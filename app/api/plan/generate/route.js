import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callWithRetry(fn, max) {
  var maxR = max || 3
  for (var attempt = 0; attempt <= maxR; attempt++) {
    try {
      return await fn()
    } catch (err) {
      var code = err.status || err.statusCode || (err.error && err.error.type === 'overloaded_error' ? 529 : 0)
      var overloaded = code === 529 || (err.message && err.message.toLowerCase().includes('overload')) || (err.error && err.error.type === 'overloaded_error')
      if ((overloaded || code === 429) && attempt < maxR) {
        var delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000
        console.log('Overloaded, retry ' + (attempt+1) + '/' + maxR + ' in ' + Math.round(delay/1000) + 's')
        await new Promise(function(r) { setTimeout(r, delay) })
        continue
      }
      throw err
    }
  }
}

async function incrementServed(sb, ids) {
  for (var i = 0; i < ids.length; i++) {
    try { await sb.rpc('increment_recipe_served', { recipe_id: ids[i] }) } catch(e) {}
  }
}

async function getSystemRecipes(sb, prefs, count, excludeIds) {
  var excluded = excludeIds || []
  var maxTime = (prefs && prefs.max_weeknight_mins) ? prefs.max_weeknight_mins + 15 : 75
  var restrictions = [].concat(
    prefs && prefs.dietary_flags ? prefs.dietary_flags : [],
    prefs && prefs.allergens ? prefs.allergens : []
  ).map(function(s) { return s.toLowerCase() })

  var query = sb.from('system_recipes')
    .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
    .lte('total_time_mins', maxTime)
    .order('times_served', { ascending: true })
    .limit(count * 4)

  if (excluded.length > 0) {
    query = query.not('id', 'in', '("' + excluded.join('","') + '")')
  }

  if (restrictions.indexOf('vegan') >= 0) {
    query = query.contains('dietary_flags', ['vegan'])
  } else if (restrictions.indexOf('vegetarian') >= 0) {
    query = query.or('dietary_flags.cs.{"vegetarian"},dietary_flags.cs.{"vegan"}')
  }

  var res = await query
  var results = res.data || []

  if (results.length < count) {
    var existingIds = excluded.concat(results.map(function(r) { return r.id }))
    var fillQ = sb.from('system_recipes')
      .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
      .order('times_served', { ascending: true })
      .limit(count * 4)
    if (existingIds.length > 0) {
      fillQ = fillQ.not('id', 'in', '("' + existingIds.join('","') + '")')
    }
    var fillRes = await fillQ
    results = results.concat(fillRes.data || [])
  }

  return results.slice(0, count).map(function(r) {
    return { id: 'sys-' + r.id, system_recipe_id: r.id, title: r.title, cuisine: r.cuisine, total_time_mins: r.total_time_mins, tags: r.tags || [], dietary_flags: r.dietary_flags || [], base_servings: r.base_servings || 4 }
  })
}

async function generateAndSaveRecipes(sb, prefs, existingTitles, count) {
  var restrictions = [].concat(prefs && prefs.dietary_flags ? prefs.dietary_flags : [], prefs && prefs.allergens ? prefs.allergens : [])
  var cuisines = (prefs && prefs.cuisine_loves && prefs.cuisine_loves.length) ? prefs.cuisine_loves : ['American','Italian','Mexican','Asian','Mediterranean']
  var maxTime = (prefs && prefs.max_weeknight_mins) ? prefs.max_weeknight_mins : 45
  var disliked = (prefs && prefs.disliked_ingredients) ? prefs.disliked_ingredients : []

  var lines = [
    'Generate ' + count + ' different weeknight dinner recipes.',
    'Max time: ' + maxTime + ' minutes. Serves 4.',
    'Dietary restrictions: ' + (restrictions.length ? restrictions.join(', ') : 'none'),
    'Avoid: ' + (disliked.length ? disliked.join(', ') : 'none'),
    'Cuisines: ' + cuisines.join(', '),
    'Different from: ' + existingTitles.slice(0,15).join(', '),
    '',
    'Return ONLY a JSON array. Each item: {title, description, cuisine, meal_type, difficulty, prep_time_mins, cook_time_mins, total_time_mins, base_servings, ingredients:[{name,amount,unit,notes}], instructions:[{step,text,timer_minutes}], tags:[], dietary_flags:[]}',
    'Start with [ end with ]. No markdown.'
  ]

  var response = await callWithRetry(function() {
    return anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      system: 'Recipe generation API. Return ONLY valid JSON arrays. No explanation.',
      messages: [{ role: 'user', content: lines.join('\n') }]
    })
  })

  var raw = (response.content[0] && response.content[0].text) ? response.content[0].text.trim() : '[]'
  var fi = raw.indexOf('['), li = raw.lastIndexOf(']')
  if (fi < 0 || li <= fi) throw new Error('No array in batch response')
  var parsed = JSON.parse(raw.substring(fi, li + 1))
  if (!Array.isArray(parsed)) throw new Error('Invalid batch response')

  var saved = []
  for (var i = 0; i < parsed.length; i++) {
    var recipe = parsed[i]
    try {
      var res = await sb.from('system_recipes').insert({
        title: recipe.title, description: recipe.description || null, cuisine: recipe.cuisine,
        meal_type: recipe.meal_type || 'dinner', difficulty: recipe.difficulty || 2,
        prep_time_mins: recipe.prep_time_mins || null, cook_time_mins: recipe.cook_time_mins || null,
        total_time_mins: recipe.total_time_mins || null, base_servings: recipe.base_servings || 4,
        ingredients: recipe.ingredients || [], instructions: recipe.instructions || [],
        tags: recipe.tags || [], dietary_flags: recipe.dietary_flags || [],
        source: 'ai_generated', times_served: 1
      }).select('id').single()
      if (!res.error && res.data) {
        saved.push({ id: 'sys-' + res.data.id, system_recipe_id: res.data.id, title: recipe.title, cuisine: recipe.cuisine, total_time_mins: recipe.total_time_mins, tags: recipe.tags || [], dietary_flags: recipe.dietary_flags || [], base_servings: recipe.base_servings || 4 })
      }
    } catch(e) { console.error('Save recipe failed:', e.message) }
  }
  return saved
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
      sb.from('profiles').select('family_size, dinner_hour, family_name').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', userId),
      sb.from('recipes').select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings, is_favorite, times_made, average_rating').eq('profile_id', userId).order('is_favorite', { ascending: false }),
    ])

    var profile = results[0].data
    var prefs = results[1].data
    var blackoutDays = (results[2].data || []).map(function(b) { return b.day_of_week })
    var baseRecipes = results[3].data || []

    console.log('userId:', userId, '| vault count:', baseRecipes.length, '| useVariety:', useVariety)
    if (results[3].error) console.log('Recipe query error:', results[3].error.message)

    var rotationData = {}
    try {
      var rotRes = await sb.from('recipes').select('id, in_rotation, rotation_frequency, last_planned_date').eq('profile_id', userId)
      if (rotRes.data) rotRes.data.forEach(function(r) { rotationData[r.id] = r })
    } catch(e) {}

    var vaultRecipes = baseRecipes.map(function(r) {
      return Object.assign({}, r, {
        in_rotation: (rotationData[r.id] && rotationData[r.id].in_rotation) || false,
        rotation_frequency: (rotationData[r.id] && rotationData[r.id].rotation_frequency) || null,
        last_planned_date: (rotationData[r.id] && rotationData[r.id].last_planned_date) || null,
      })
    })

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

    var today = new Date()
    var dueRotation = vaultRecipes.filter(function(r) { return r.in_rotation }).map(function(r) {
      var isDue = true
      if (r.last_planned_date) {
        var daysSince = (today - new Date(r.last_planned_date)) / 86400000
        if (r.rotation_frequency === 'weekly') isDue = daysSince >= 6
        else if (r.rotation_frequency === 'biweekly') isDue = daysSince >= 13
        else if (r.rotation_frequency === 'monthly') isDue = daysSince >= 27
      }
      return Object.assign({}, r, { isDue: isDue })
    }).filter(function(r) { return r.isDue })

    var otherVault = vaultRecipes.filter(function(r) { return !r.in_rotation })

    // Fetch system recipes for variety pool
    var systemRecipes = []
    var generatedRecipes = []

    if (useVariety || vaultRecipes.length < mealsNeeded) {
      var poolSize = useVariety ? Math.max(mealsNeeded, 10) : Math.max(mealsNeeded - vaultRecipes.length, 2)
      console.log('Fetching ' + poolSize + ' system recipes')
      systemRecipes = await getSystemRecipes(sb, prefs, poolSize)
      console.log('Got ' + systemRecipes.length + ' system recipes')

      var stillNeeded = poolSize - systemRecipes.length
      if (stillNeeded > 0) {
        var existingTitles = vaultRecipes.concat(systemRecipes).map(function(r) { return r.title })
        try {
          generatedRecipes = await generateAndSaveRecipes(sb, prefs, existingTitles, stillNeeded)
        } catch(e) {
          console.error('Generation failed:', e.message)
          var emergency = [
            { id: 'emg-1', title: 'Garlic Butter Chicken', cuisine: 'American', total_time_mins: 30, tags: [], dietary_flags: [], base_servings: 4 },
            { id: 'emg-2', title: 'Simple Beef Tacos', cuisine: 'Mexican', total_time_mins: 25, tags: [], dietary_flags: [], base_servings: 4 },
            { id: 'emg-3', title: 'Lemon Herb Pasta', cuisine: 'Italian', total_time_mins: 20, tags: [], dietary_flags: [], base_servings: 4 },
          ]
          emergency.slice(0, stillNeeded).forEach(function(r) { generatedRecipes.push(r) })
        }
      }
    }

    // ── BUILD INDEX MAP ─────────────────────────────────────
    // Give Claude simple codes (V1, S1, R1) instead of long UUIDs
    var recipeIndex = {}  // code -> real ID
    var allRecipesForMap = []

    var rotLines = dueRotation.map(function(r, i) {
      var code = 'R' + (i+1)
      recipeIndex[code] = r.id
      allRecipesForMap.push(r)
      return code + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min | ROTATION'
    })

    var vaultLines = otherVault.map(function(r, i) {
      var code = 'V' + (i+1)
      recipeIndex[code] = r.id
      allRecipesForMap.push(r)
      return code + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min' + (r.is_favorite ? ' | ❤️ Favorite' : '') + ' | YOUR RECIPE'
    })

    var sysAll = systemRecipes.concat(generatedRecipes)
    var sysLines = sysAll.map(function(r, i) {
      var code = 'S' + (i+1)
      recipeIndex[code] = r.id
      allRecipesForMap.push(r)
      return code + ': "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min | GENERAL'
    })

    console.log('Index map:', JSON.stringify(recipeIndex))

    var allRecipes = allRecipesForMap

    // Build recipe map by real ID for enrichment
    var recipeMap = {}
    allRecipes.forEach(function(r) { recipeMap[r.id] = r })

    // ── PROMPT ──────────────────────────────────────────────
    var restrictions2 = [].concat(prefs && prefs.dietary_flags ? prefs.dietary_flags : [], prefs && prefs.allergens ? prefs.allergens : [])

    var promptParts = [
      'You are a meal planning assistant for Simply Sous.',
      '',
      'FAMILY: ' + ((profile && profile.family_size) || 4) + ' people',
      'DIETARY RESTRICTIONS: ' + (restrictions2.length ? restrictions2.join(', ') : 'none'),
      'MAX COOK TIME: ' + ((prefs && prefs.max_weeknight_mins) || 45) + ' min on weeknights',
      'MODE: ' + (useVariety ? 'Mix personal and general recipes for variety' : 'Use personal vault recipes first — only use GENERAL if vault runs out'),
      '',
      'DAYS TO FILL (' + mealsNeeded + ' total):',
      cookingDays.map(function(d) { return d.dayName + ' ' + d.date }).join('\n'),
      '',
    ]

    if (rotLines.length > 0) {
      promptParts.push('ROTATION RECIPES (schedule these first):')
      promptParts.push(rotLines.join('\n'))
      promptParts.push('')
    }

    promptParts.push('YOUR PERSONAL RECIPES (use these — they are from the user\'s vault):')
    promptParts.push(vaultLines.length > 0 ? vaultLines.join('\n') : 'None')
    promptParts.push('')

    if (sysLines.length > 0) {
      promptParts.push('GENERAL RECIPES (only use if personal recipes are exhausted or variety requested):')
      promptParts.push(sysLines.join('\n'))
      promptParts.push('')
    }

    promptParts = promptParts.concat([
      'RULES:',
      '1. Fill ALL ' + mealsNeeded + ' days — every cooking day must have a recipe',
      '2. Use rotation recipes first (R codes), then personal vault (V codes), then general (S codes)',
      '3. NEVER repeat the same code in the same week',
      '4. Vary cuisines — avoid same cuisine two days in a row',
      '',
      'Return a JSON array with exactly ' + mealsNeeded + ' objects.',
      'Use the recipe codes (V1, S2, R1 etc) as the recipe_code value.',
      'Format: [{"date":"YYYY-MM-DD","recipe_code":"V1","is_skipped":false}]',
      'ONLY the JSON array. No explanation. No markdown.',
    ])

    var prompt2 = promptParts.join('\n')

    var response2 = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        system: 'You are a meal planning API. You output ONLY valid JSON arrays. Never add text, explanation, or markdown around the JSON.',
        messages: [{ role: 'user', content: prompt2 }]
      })
    })

    var raw2 = (response2.content[0] && response2.content[0].text) ? response2.content[0].text.trim() : ''
    console.log('Claude raw response:', raw2.substring(0, 300))

    // Extract JSON array
    var fi = raw2.indexOf('[')
    var li = raw2.lastIndexOf(']')
    if (fi < 0 || li <= fi) {
      console.error('No JSON array in response:', raw2)
      return Response.json({ error: 'Plan generation failed — please try again.' }, { status: 500 })
    }

    var planSlots
    try {
      planSlots = JSON.parse(raw2.substring(fi, li + 1))
    } catch(e) {
      console.error('JSON parse failed:', e.message, '| extracted:', raw2.substring(fi, li+1).substring(0,200))
      return Response.json({ error: 'Plan generation failed — please try again.' }, { status: 500 })
    }

    if (!Array.isArray(planSlots)) {
      return Response.json({ error: 'Plan generation failed — invalid response.' }, { status: 500 })
    }

    // ── CONVERT CODES TO REAL IDs ────────────────────────────
    planSlots = planSlots.map(function(slot) {
      if (slot.is_skipped) return slot
      var code = slot.recipe_code || slot.recipe_idx || slot.recipe_id
      if (!code) return slot
      var realId = recipeIndex[String(code).toUpperCase()]
      if (!realId) {
        console.log('No match for code:', code, '| index keys:', Object.keys(recipeIndex).join(','))
      }
      return Object.assign({}, slot, { recipe_id: realId || null })
    })

    // ── INJECT BLACKOUT DAYS ─────────────────────────────────
    var claudeMap = {}
    planSlots.forEach(function(s) { if (s.date) claudeMap[s.date] = s })

    var mergedSlots = weekDates.map(function(d) {
      if (blackoutDays.indexOf(d.dayOfWeek) >= 0) {
        return { date: d.date, recipe_id: null, is_skipped: true, skip_reason: 'blackout day' }
      }
      return claudeMap[d.date] || { date: d.date, recipe_id: null, is_skipped: false, skip_reason: null }
    })

    // ── DEDUPLICATE ──────────────────────────────────────────
    var usedIds = new Set()
    var deduped = mergedSlots.map(function(slot) {
      if (slot.is_skipped || !slot.recipe_id) return slot
      if (usedIds.has(slot.recipe_id)) {
        var unused = allRecipes.find(function(r) { return !usedIds.has(r.id) })
        if (unused) {
          usedIds.add(unused.id)
          return Object.assign({}, slot, { recipe_id: unused.id })
        }
        return slot
      }
      usedIds.add(slot.recipe_id)
      return slot
    })

    // ── ENRICH ───────────────────────────────────────────────
    var matched = 0, unmatched = 0
    var enriched = deduped.map(function(slot) {
      var recipe = slot.recipe_id ? (recipeMap[slot.recipe_id] || null) : null
      if (!slot.is_skipped && slot.recipe_id) { if (recipe) matched++; else unmatched++ }
      return Object.assign({}, slot, {
        recipe: recipe,
        dayName: (weekDates.find(function(d) { return d.date === slot.date }) || {}).dayName || ''
      })
    })
    console.log('Enrichment: ' + matched + ' matched, ' + unmatched + ' unmatched')

    // Increment served for system recipes used
    var usedSysIds = deduped
      .filter(function(s) { return s.recipe_id && String(s.recipe_id).startsWith('sys-') })
      .map(function(s) { var r = allRecipes.find(function(r2) { return r2.id === s.recipe_id }); return r ? r.system_recipe_id : null })
      .filter(Boolean)
    if (usedSysIds.length) incrementServed(sb, usedSysIds)

    // Update last_planned_date for rotation recipes
    var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0')
    var usedRotIds = deduped
      .filter(function(s) { return s.recipe_id && !String(s.recipe_id).startsWith('sys-') })
      .map(function(s) { return s.recipe_id })
      .filter(function(id) { return dueRotation.some(function(r) { return r.id === id }) })

    for (var j = 0; j < usedRotIds.length; j++) {
      try { await sb.from('recipes').update({ last_planned_date: todayStr }).eq('id', usedRotIds[j]) } catch(e) {}
    }

    return Response.json({
      plan: enriched,
      weekStartDate: weekStartDate,
      stats: { vaultRecipes: vaultRecipes.length, systemUsed: systemRecipes.length, generated: generatedRecipes.length }
    })

  } catch(err) {
    console.error('Plan generate error:', err)
    var msg = err.message || 'Failed to generate plan'
    if (msg.toLowerCase().includes('overload') || (err.status === 529)) {
      msg = 'Dot is a little busy right now. Wait 30 seconds and try again.'
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
