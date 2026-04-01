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
    .select('id, title, description, cuisine, total_time_mins, tags, dietary_flags, base_servings, ingredients, instructions')
    .lte('total_time_mins', maxTime)
    .order('times_served', { ascending: true })
    .limit(count * 3)
  return (res.data || []).slice(0, count).map(function(r) {
    return {
      id: 'sys-' + r.id,
      system_recipe_id: r.id,
      title: r.title,
      description: r.description || null,
      cuisine: r.cuisine,
      total_time_mins: r.total_time_mins,
      tags: r.tags || [],
      dietary_flags: r.dietary_flags || [],
      base_servings: r.base_servings || 4,
      ingredients: r.ingredients || [],
      instructions: r.instructions || [],
    }
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

    var results = await Promise.all([
      sb.from('profiles').select('family_size, dinner_hour').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', userId),
      sb.from('recipes').select('id, title, description, cuisine, total_time_mins, tags, dietary_flags, base_servings, is_favorite, in_rotation, rotation_frequency, last_planned_date, ingredients, instructions').eq('profile_id', userId).order('is_favorite', { ascending: false }),
    ])

    var profile = results[0].data
    var prefs = results[1].data
    var blackoutDays = (results[2].data || []).map(function(b) { return b.day_of_week })
    var vaultRecipes = results[3].data || []

    console.log('[plan/generate] userId=' + userId + ' vault=' + vaultRecipes.length + ' useVariety=' + useVariety)

    // Parse weekStartDate as a date number for comparison
    // weekStartDate is like "2026-04-06" — convert to day number
    var planningDate = new Date(weekStartDate + 'T12:00:00')

    // Eligibility rules:
    // - weekly: not in the same week (>= 7 days)
    // - biweekly: not in the last 2 weeks (>= 14 days)  
    // - monthly: not in the last 4 weeks (>= 28 days)
    // We use planningDate (the week being generated) as reference
    // so planning ahead works correctly
    vaultRecipes = vaultRecipes.map(function(r) {
      var inRotation = r.in_rotation || false
      var freq = r.rotation_frequency || null
      var lastPlanned = r.last_planned_date || null
      var eligible = true

      if (inRotation && lastPlanned && freq) {
        var daysSince = (planningDate - new Date(lastPlanned + 'T12:00:00')) / 86400000
        console.log('[plan/generate] check "' + r.title + '" freq=' + freq + ' lastPlanned=' + lastPlanned + ' planningDate=' + weekStartDate + ' daysSince=' + Math.round(daysSince))
        if (freq === 'weekly') eligible = daysSince >= 7
        else if (freq === 'biweekly') eligible = daysSince >= 14
        else if (freq === 'monthly') eligible = daysSince >= 28
      }
      // If not in rotation, or never planned, always eligible
      return Object.assign({}, r, { eligible: eligible })
    })

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
    var mealsNeeded = cookingDays.length

    // Fetch system recipes only when needed
    var systemRecipes = []
    if (useVariety || eligibleVault.length < mealsNeeded) {
      var needed = useVariety
        ? Math.max(mealsNeeded, 8)
        : Math.max(mealsNeeded - eligibleVault.length, 2)
      systemRecipes = await getSystemRecipes(sb, prefs, needed)
      console.log('[plan/generate] system=' + systemRecipes.length)
    }

    // Build index — V codes for vault, S codes for system
    var recipeIndex = {}
    var allRecipes = []

    eligibleVault.forEach(function(r, i) {
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

    var recipeMap = {}
    allRecipes.forEach(function(r) { recipeMap[r.id] = r })

    // Build prompt
    var vaultLines = eligibleVault.map(function(r, i) {
      return 'V' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min'
    }).join('\n')

    var sysLines = systemRecipes.map(function(r, i) {
      return 'S' + (i+1) + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min'
    }).join('\n')

    var dayLines = cookingDays.map(function(d) { return d.dayName + ' ' + d.date }).join('\n')
    var allCodes = Object.keys(recipeIndex).join(', ')

    var modeNote = eligibleVault.length === 0
      ? 'No personal recipes are due. Use S codes only.'
      : useVariety
        ? 'Mix V and S codes. Use at least 1 S code.'
        : 'Use V codes. Use S codes only if you run out of V codes.'

    var promptLines = [
      'Assign dinner recipes to days for a family of ' + ((profile && profile.family_size) || 4) + '.',
      'Mode: ' + modeNote,
      '',
      'DAYS (' + mealsNeeded + '):',
      dayLines,
      '',
      'PERSONAL RECIPES:',
      vaultLines || 'None available',
      '',
    ]

    if (sysLines) {
      promptLines.push('GENERAL RECIPES:')
      promptLines.push(sysLines)
      promptLines.push('')
    }

    promptLines = promptLines.concat([
      'Return JSON array of exactly ' + mealsNeeded + ' objects.',
      'Dates: ' + cookingDays.map(function(d) { return d.date }).join(', '),
      'Codes: ' + allCodes,
      'Format: [{"date":"YYYY-MM-DD","recipe_code":"V1","is_skipped":false}]',
      'Use each code once. No repeats. Fill every date. JSON only.',
    ])

    var promptStr = promptLines.join('\n')

    var response = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 800,
        system: 'Meal planning API. Output ONLY valid JSON array.',
        messages: [{ role: 'user', content: promptStr }]
      })
    })

    var raw = (response.content[0] && response.content[0].text) ? response.content[0].text.trim() : ''
    console.log('[plan/generate] raw=' + raw.substring(0, 200))

    var fi = raw.indexOf('[')
    var li = raw.lastIndexOf(']')
    if (fi < 0 || li <= fi) {
      console.error('[plan/generate] no array in: ' + raw)
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

    // Map Claude slots by date
    var claudeMap = {}
    planSlots.forEach(function(s) { if (s.date) claudeMap[s.date] = s })

    // Build final 7-day plan — inject blackout days and gap-fill missing cooking days
    var usedIds = new Set()
    planSlots.forEach(function(s) { if (s.recipe_id) usedIds.add(s.recipe_id) })

    var merged = weekDates.map(function(d) {
      if (blackoutDays.indexOf(d.dayOfWeek) >= 0) {
        return { date: d.date, recipe_id: null, is_skipped: true, skip_reason: 'blackout day' }
      }
      if (claudeMap[d.date] && claudeMap[d.date].recipe_id) return claudeMap[d.date]
      // Gap fill with unused recipe
      var fill = allRecipes.find(function(r) { return !usedIds.has(r.id) })
      if (fill) {
        usedIds.add(fill.id)
        console.log('[plan/generate] gap-filled ' + d.date + ' with ' + fill.title)
        return { date: d.date, recipe_id: fill.id, is_skipped: false, skip_reason: null }
      }
      return { date: d.date, recipe_id: null, is_skipped: false, skip_reason: null }
    })

    // Deduplicate within this week
    var finalUsed = new Set()
    var deduped = merged.map(function(slot) {
      if (slot.is_skipped || !slot.recipe_id) return slot
      if (finalUsed.has(slot.recipe_id)) {
        var unused = allRecipes.find(function(r) { return !finalUsed.has(r.id) })
        if (unused) { finalUsed.add(unused.id); return Object.assign({}, slot, { recipe_id: unused.id }) }
        return slot
      }
      finalUsed.add(slot.recipe_id)
      return slot
    })

    // Enrich
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
      stats: { vault: vaultRecipes.length, eligible: eligibleVault.length, system: systemRecipes.length }
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
