import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callWithRetry(fn, max) {
  var maxR = max || 3
  for (var attempt = 0; attempt <= maxR; attempt++) {
    try { return await fn() } catch (err) {
      var code = err.status || err.statusCode || (err.error && err.error.type === 'overloaded_error' ? 529 : 0)
      var overloaded = code === 529 || (err.message && err.message.toLowerCase().includes('overload')) || (err.error && err.error.type === 'overloaded_error')
      if ((overloaded || code === 429) && attempt < maxR) {
        await new Promise(function(r) { setTimeout(r, Math.pow(2, attempt) * 2000) })
        continue
      }
      throw err
    }
  }
}

async function getSystemRecipes(sb, prefs, count) {
  var maxTime = (prefs && prefs.max_weeknight_mins) ? prefs.max_weeknight_mins + 15 : 75
  var res = await sb.from('system_recipes')
    .select('id, title, cuisine, total_time_mins, tags, dietary_flags, base_servings')
    .lte('total_time_mins', maxTime)
    .order('times_served', { ascending: true })
    .limit(count * 3)
  return (res.data || []).slice(0, count).map(function(r) {
    return { id: 'sys-' + r.id, system_recipe_id: r.id, title: r.title, cuisine: r.cuisine, total_time_mins: r.total_time_mins, tags: r.tags || [], dietary_flags: r.dietary_flags || [], base_servings: r.base_servings || 4 }
  })
}

export async function POST(request) {
  try {
    var body = await request.json()
    var userId = body.userId
    var weekStartDate = body.weekStartDate
    var useVariety = body.useVariety === true

    if (!userId || !weekStartDate) {
      return Response.json({ error: 'Missing userId or weekStartDate' }, { status: 400 })
    }

    var sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch everything in parallel
    var results = await Promise.all([
      sb.from('profiles').select('family_size, dinner_hour').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', userId),
      sb.from('recipes').select('id, title, cuisine, total_time_mins, tags, dietary_flags, base_servings, is_favorite').eq('profile_id', userId).order('is_favorite', { ascending: false }),
    ])

    var profile = results[0].data
    var prefs = results[1].data
    var blackoutDays = (results[2].data || []).map(function(b) { return b.day_of_week })
    var vaultRecipes = results[3].data || []

    console.log('[plan/generate] userId=' + userId + ' vault=' + vaultRecipes.length + ' useVariety=' + useVariety)

    // Fetch rotation fields
    var rotationData = {}
    try {
      var rotRes = await sb.from('recipes')
        .select('id, in_rotation, rotation_frequency, last_planned_date')
        .eq('profile_id', userId)
      if (rotRes.data) rotRes.data.forEach(function(r) { rotationData[r.id] = r })
    } catch(e) {}

    var today = new Date()

    // Mark recipes as eligible based on rotation frequency
    vaultRecipes = vaultRecipes.map(function(r) {
      var rot = rotationData[r.id] || {}
      var inRotation = rot.in_rotation || false
      var freq = rot.rotation_frequency || null
      var lastPlanned = rot.last_planned_date || null
      var eligible = true

      if (inRotation && lastPlanned && freq) {
        var daysSince = (today - new Date(lastPlanned)) / 86400000
        if (freq === 'weekly') eligible = daysSince >= 6
        else if (freq === 'biweekly') eligible = daysSince >= 12
        else if (freq === 'monthly') eligible = daysSince >= 26
      }

      return Object.assign({}, r, {
        in_rotation: inRotation,
        rotation_frequency: freq,
        last_planned_date: lastPlanned,
        eligible: eligible
      })
    })

    // Split into eligible and not-yet-due
    var eligibleVault = vaultRecipes.filter(function(r) { return r.eligible })
    var notDueVault = vaultRecipes.filter(function(r) { return !r.eligible })

    console.log('[plan/generate] eligible=' + eligibleVault.length + ' not-due=' + notDueVault.length)

    // Build week dates
    var weekDates = []
    var start = new Date(weekStartDate + 'T12:00:00')
    for (var i = 0; i < 7; i++) {
      var d = new Date(start)
      d.setDate(start.getDate() + i)
      weekDates.push({
        date: d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'),
        dayOfWeek: d.getDay(),
        dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
      })
    }

    var cookingDays = weekDates.filter(function(d) { return blackoutDays.indexOf(d.dayOfWeek) < 0 })
    var skippedDays = weekDates.filter(function(d) { return blackoutDays.indexOf(d.dayOfWeek) >= 0 })
    var mealsNeeded = cookingDays.length

    // Get system recipes if needed
    var systemRecipes = []
    if (useVariety || vaultRecipes.length < mealsNeeded) {
      var needed = useVariety ? Math.max(Math.ceil(mealsNeeded / 2), 4) : Math.max(mealsNeeded - eligibleVault.length, 2)
      systemRecipes = await getSystemRecipes(sb, prefs, needed)
      console.log('[plan/generate] system recipes fetched=' + systemRecipes.length)
    }

    // Build index map — simple codes instead of UUIDs
    var recipeIndex = {}
    var allRecipes = []

    // Use eligible vault recipes first, then not-due as fallback if needed
    var recipesToUse = eligibleVault.length >= mealsNeeded
      ? eligibleVault
      : eligibleVault.concat(notDueVault).slice(0, Math.max(eligibleVault.length, mealsNeeded))

    recipesToUse.forEach(function(r, i) {
      var code = 'V' + (i + 1)
      recipeIndex[code] = r.id
      allRecipes.push(r)
    })

    systemRecipes.forEach(function(r, i) {
      var code = 'S' + (i + 1)
      recipeIndex[code] = r.id
      allRecipes.push(r)
    })

    console.log('[plan/generate] index=' + JSON.stringify(recipeIndex))

    // Build recipe map for enrichment
    var recipeMap = {}
    allRecipes.forEach(function(r) { recipeMap[r.id] = r })

    // Build prompt
    var vaultLines = vaultRecipes.map(function(r, i) {
      return 'V' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min' + (r.is_favorite ? ' ❤️' : '')
    }).join('\n')

    var sysLines = systemRecipes.map(function(r, i) {
      return 'S' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min'
    }).join('\n')

    var dayLines = cookingDays.map(function(d) { return d.dayName + ' ' + d.date }).join('\n')

    var sysCount = systemRecipes.length
    var modeNote = useVariety
      ? 'Use a MIX of personal (V codes) and general (S codes) recipes. You MUST fill ALL ' + mealsNeeded + ' days — use V codes for most days but include at least 1-2 S codes for variety.'
      : 'Use personal recipes (V codes) first. Only use S codes if you run out of V codes. You MUST fill ALL ' + mealsNeeded + ' days.'

    var prompt = [
      'Plan dinners for a family of ' + ((profile && profile.family_size) || 4) + '.',
      'Mode: ' + modeNote,
      '',
      'DAYS TO PLAN (' + mealsNeeded + ' days):',
      dayLines,
      '',
      'PERSONAL RECIPES (prefer these):',
      vaultLines || 'None',
      '',
    ]

    if (sysLines) {
      prompt.push('GENERAL RECIPES (use for variety or if personal runs out):')
      prompt.push(sysLines)
      prompt.push('')
    }

    prompt = prompt.concat([
      'CRITICAL: Return a JSON array with EXACTLY ' + mealsNeeded + ' items — one for every day listed above.',
      'Do NOT skip any days. Do NOT return fewer than ' + mealsNeeded + ' items.',
      'Each item: {"date":"YYYY-MM-DD","recipe_code":"V1","is_skipped":false}',
      'Use each recipe code only once. Vary cuisines day to day.',
      'ONLY the JSON array. No explanation. No markdown.',
    ])

    var promptStr = prompt.join('\n')
    console.log('[plan/generate] prompt length=' + promptStr.length)

    var response = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 800,
        system: 'You are a meal planning API. Output ONLY a valid JSON array. No markdown, no explanation.',
        messages: [{ role: 'user', content: promptStr }]
      })
    })

    var raw = (response.content[0] && response.content[0].text) ? response.content[0].text.trim() : ''
    console.log('[plan/generate] raw=' + raw.substring(0, 200))

    // Extract JSON
    var fi = raw.indexOf('[')
    var li = raw.lastIndexOf(']')
    if (fi < 0 || li <= fi) {
      console.error('[plan/generate] no array found in: ' + raw)
      return Response.json({ error: 'Plan generation failed — please try again.' }, { status: 500 })
    }

    var planSlots
    try {
      planSlots = JSON.parse(raw.substring(fi, li + 1))
    } catch(e) {
      console.error('[plan/generate] parse error: ' + e.message)
      return Response.json({ error: 'Plan generation failed — please try again.' }, { status: 500 })
    }

    if (!Array.isArray(planSlots)) {
      return Response.json({ error: 'Plan generation failed.' }, { status: 500 })
    }

    // Convert codes to real IDs
    planSlots = planSlots.map(function(slot) {
      if (slot.is_skipped) return slot
      var code = String(slot.recipe_code || slot.recipe_id || '').toUpperCase()
      var realId = recipeIndex[code]
      if (!realId) console.log('[plan/generate] no match for code: ' + code)
      return Object.assign({}, slot, { recipe_id: realId || null })
    })

    // Inject blackout days
    var claudeMap = {}
    planSlots.forEach(function(s) { if (s.date) claudeMap[s.date] = s })

    var merged = weekDates.map(function(d) {
      if (blackoutDays.indexOf(d.dayOfWeek) >= 0) {
        return { date: d.date, recipe_id: null, is_skipped: true, skip_reason: 'blackout day' }
      }
      return claudeMap[d.date] || { date: d.date, recipe_id: null, is_skipped: false, skip_reason: null }
    })

    // Deduplicate
    var usedIds = new Set()
    var deduped = merged.map(function(slot) {
      if (slot.is_skipped || !slot.recipe_id) return slot
      if (usedIds.has(slot.recipe_id)) {
        var unused = allRecipes.find(function(r) { return !usedIds.has(r.id) })
        if (unused) { usedIds.add(unused.id); return Object.assign({}, slot, { recipe_id: unused.id }) }
        return slot
      }
      usedIds.add(slot.recipe_id)
      return slot
    })

    // Enrich with recipe data
    var enriched = deduped.map(function(slot) {
      return Object.assign({}, slot, {
        recipe: slot.recipe_id ? (recipeMap[slot.recipe_id] || null) : null,
        dayName: (weekDates.find(function(d) { return d.date === slot.date }) || {}).dayName || ''
      })
    })

    var matched = enriched.filter(function(s) { return !s.is_skipped && s.recipe }).length
    var missing = enriched.filter(function(s) { return !s.is_skipped && !s.recipe }).length
    console.log('[plan/generate] matched=' + matched + ' missing=' + missing)

    // Update last_planned_date for vault recipes used in this plan
    var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0')
    var usedVaultIds = deduped
      .filter(function(s) { return s.recipe_id && !String(s.recipe_id).startsWith('sys-') && !String(s.recipe_id).startsWith('emg-') })
      .map(function(s) { return s.recipe_id })

    for (var j = 0; j < usedVaultIds.length; j++) {
      try {
        await sb.from('recipes').update({ last_planned_date: todayStr }).eq('id', usedVaultIds[j])
      } catch(e) {}
    }
    console.log('[plan/generate] updated last_planned_date for ' + usedVaultIds.length + ' vault recipes')

    return Response.json({
      plan: enriched,
      weekStartDate: weekStartDate,
      stats: { vault: vaultRecipes.length, system: systemRecipes.length }
    })

  } catch(err) {
    console.error('[plan/generate] error:', err.message)
    var msg = err.message || 'Failed to generate plan'
    if (msg.toLowerCase().includes('overload') || (err.status === 529)) {
      msg = 'Dot is busy right now — wait 30 seconds and try again.'
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
