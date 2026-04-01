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
      sb.from('recipes').select('id, title, cuisine, total_time_mins, tags, dietary_flags, base_servings, is_favorite, in_rotation, rotation_frequency, last_planned_date').eq('profile_id', userId).order('is_favorite', { ascending: false }),
    ])

    var profile = results[0].data
    var prefs = results[1].data
    var blackoutDays = (results[2].data || []).map(function(b) { return b.day_of_week })
    var vaultRecipes = results[3].data || []

    console.log('[plan/generate] userId=' + userId + ' vault=' + vaultRecipes.length + ' useVariety=' + useVariety)

    var today = new Date()

    // Mark recipes as eligible based on rotation frequency
    // Rotation data is included in main query above
    vaultRecipes = vaultRecipes.map(function(r) {
      var inRotation = r.in_rotation || false
      var freq = r.rotation_frequency || null
      var lastPlanned = r.last_planned_date || null
      var eligible = true

      if (inRotation && lastPlanned && freq) {
        var daysSince = (today - new Date(lastPlanned)) / 86400000
        console.log('[plan/generate] rotation check: "' + r.title + '" freq=' + freq + ' daysSince=' + Math.round(daysSince))
        if (freq === 'weekly') eligible = daysSince >= 6
        else if (freq === 'biweekly') eligible = daysSince >= 12
        else if (freq === 'monthly') eligible = daysSince >= 26
      } else if (inRotation && !lastPlanned) {
        // Never planned — eligible
        eligible = true
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
    if (notDueVault.length > 0) {
      notDueVault.forEach(function(r) {
        var daysSince = r.last_planned_date ? Math.round((today - new Date(r.last_planned_date)) / 86400000) : 'never'
        console.log('[plan/generate] not-due: "' + r.title + '" freq=' + (r.rotation_frequency||'none') + ' last=' + (r.last_planned_date||'never') + ' daysSince=' + daysSince)
      })
    }

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
    // Always fetch some system recipes as fallback in case Claude doesn't fill all days
    if (useVariety || eligibleVault.length < mealsNeeded) {
      // Always fetch enough system recipes to cover the full week if vault is exhausted
      var needed = useVariety 
        ? Math.max(mealsNeeded, 8)
        : Math.max(mealsNeeded - eligibleVault.length, 4)
      systemRecipes = await getSystemRecipes(sb, prefs, needed)
      console.log('[plan/generate] system recipes fetched=' + systemRecipes.length)
    }

    // Build index map — simple codes instead of UUIDs
    var recipeIndex = {}
    var allRecipes = []

    // Use eligible vault recipes first, then not-due as fallback if needed
    // Only use eligible recipes as V codes — never give Claude not-due recipes
    // If vault has nothing eligible, system recipes will fill the whole week
    var recipesToUse = eligibleVault

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
    var vaultLines = recipesToUse.map(function(r, i) {
      return 'V' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min' + (r.is_favorite ? ' ❤️' : '')
    }).join('\n')

    var sysLines = systemRecipes.map(function(r, i) {
      return 'S' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min'
    }).join('\n')

    var dayLines = cookingDays.map(function(d) { return d.dayName + ' ' + d.date }).join('\n')

    var vaultAvailable = recipesToUse.length
    var modeNote = vaultAvailable === 0
      ? 'No personal recipes are due this week. Use ONLY general recipes (S codes) to fill all ' + mealsNeeded + ' days.'
      : useVariety
        ? 'Mix personal (V codes) and general (S codes). Fill ALL ' + mealsNeeded + ' days. Include at least 1 S code for variety.'
        : 'Use personal recipes (V codes) first. Use S codes only if you run out of V codes. Fill ALL ' + mealsNeeded + ' days.'

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

    var allCodes = Object.keys(recipeIndex).join(', ')
    prompt = prompt.concat([
      'YOU MUST return exactly ' + mealsNeeded + ' objects in the array.',
      'One object per date. Dates to fill: ' + cookingDays.map(function(d){return d.date}).join(', '),
      'Available recipe codes: ' + allCodes,
      'Each item format: {"date":"YYYY-MM-DD","recipe_code":"V1","is_skipped":false}',
      'Rules: use each code once, vary cuisines, NO missing dates.',
      'ONLY the JSON array. No text before or after.',
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

    // Server-side gap filling — assign unused recipes to any cooking days Claude missed
    var usedCodes = new Set(planSlots.map(function(s) { return s.recipe_code }))
    var unusedRecipes = allRecipes.filter(function(r) { return !usedCodes.has(r.id) })
    var unusedIdx = 0

    var merged = weekDates.map(function(d) {
      if (blackoutDays.indexOf(d.dayOfWeek) >= 0) {
        return { date: d.date, recipe_id: null, is_skipped: true, skip_reason: 'blackout day' }
      }
      if (claudeMap[d.date]) return claudeMap[d.date]
      // Gap — fill with next unused recipe
      var assignedIds = planSlots.map(function(s) { return s.recipe_id }).filter(Boolean)
      var fill = allRecipes.find(function(r) { return assignedIds.indexOf(r.id) < 0 })
      if (fill) {
        assignedIds.push(fill.id)
        console.log('[plan/generate] gap-filled ' + d.date + ' with ' + fill.title)
        return { date: d.date, recipe_id: fill.id, is_skipped: false, skip_reason: null }
      }
      return { date: d.date, recipe_id: null, is_skipped: false, skip_reason: null }
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
