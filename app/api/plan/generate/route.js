import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── RETRY WRAPPER ────────────────────────────────────────────
async function callWithRetry(fn, maxRetries) {
  var max = maxRetries || 3
  for (var attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn()
    } catch (err) {
      var statusCode = err.status || err.statusCode || (err.error && err.error.type === 'overloaded_error' ? 529 : 0)
      var isOverloaded = statusCode === 529 ||
        (err.message && err.message.toLowerCase().includes('overload')) ||
        (err.error && err.error.type === 'overloaded_error')
      var isRateLimit = statusCode === 429
      if ((isOverloaded || isRateLimit) && attempt < max) {
        var delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000
        console.log('Anthropic overloaded (attempt ' + (attempt + 1) + '/' + max + '), retrying in ' + Math.round(delay / 1000) + 's...')
        await new Promise(function(resolve) { setTimeout(resolve, delay) })
        continue
      }
      throw err
    }
  }
}

// ── INCREMENT SERVED ─────────────────────────────────────────
async function incrementServed(sb, systemRecipeIds) {
  if (!systemRecipeIds.length) return
  for (var i = 0; i < systemRecipeIds.length; i++) {
    try {
      await sb.rpc('increment_recipe_served', { recipe_id: systemRecipeIds[i] })
    } catch (e) {
      // Non-critical
    }
  }
}

// ── SYSTEM RECIPE LOOKUP ─────────────────────────────────────
async function getSystemRecipes(sb, prefs, count, excludeIds) {
  var excluded = excludeIds || []
  var dietaryFlags = (prefs && prefs.dietary_flags ? prefs.dietary_flags : []).map(function(f) { return f.toLowerCase() })
  var allergens = (prefs && prefs.allergens ? prefs.allergens : []).map(function(a) { return a.toLowerCase() })
  var restrictions = dietaryFlags.concat(allergens)
  var maxTime = (prefs && prefs.max_weeknight_mins) ? prefs.max_weeknight_mins : 60
  var cuisines = (prefs && prefs.cuisine_loves) ? prefs.cuisine_loves : []

  var query = sb
    .from('system_recipes')
    .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
    .lte('total_time_mins', maxTime + 15)
    .order('times_served', { ascending: true })

  if (excluded.length > 0) {
    query = query.not('id', 'in', '("' + excluded.join('","') + '")')
  }

  if (restrictions.indexOf('vegan') >= 0) {
    query = query.contains('dietary_flags', ['vegan'])
  } else if (restrictions.indexOf('vegetarian') >= 0) {
    query = query.or('dietary_flags.cs.{"vegetarian"},dietary_flags.cs.{"vegan"}')
  }

  // Fetch a large diverse pool and let Claude choose — don't pre-filter by cuisine
  // This prevents empty results when cuisine labels don't match exactly
  var fetchCount = Math.max(count * 4, 20) // always fetch plenty for variety
  var poolRes = await query.limit(fetchCount)
  var results = poolRes.data || []

  // If not enough, fetch more without dietary restriction
  if (results.length < count) {
    var existingIds = excluded.concat(results.map(function(r) { return r.id }))
    var fillQuery = sb
      .from('system_recipes')
      .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
      .order('times_served', { ascending: true })
      .limit(fetchCount)

    if (existingIds.length > 0) {
      fillQuery = fillQuery.not('id', 'in', '("' + existingIds.join('","') + '")')
    }

    var fillRes = await fillQuery
    results = results.concat(fillRes.data || [])
  }

  return results.slice(0, count).map(function(r) {
    return {
      id: 'sys-' + r.id,
      system_recipe_id: r.id,
      title: r.title,
      cuisine: r.cuisine,
      total_time_mins: r.total_time_mins,
      tags: r.tags || [],
      dietary_flags: r.dietary_flags || [],
      base_servings: r.base_servings || 4,
      from_database: true,
    }
  })
}

// ── BATCH RECIPE GENERATION ──────────────────────────────────
async function generateAndSaveRecipes(sb, prefs, existingTitles, count) {
  var restrictions = [].concat(
    prefs && prefs.dietary_flags ? prefs.dietary_flags : [],
    prefs && prefs.allergens ? prefs.allergens : []
  )
  var cuisines = (prefs && prefs.cuisine_loves && prefs.cuisine_loves.length)
    ? prefs.cuisine_loves
    : ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean']
  var maxTime = (prefs && prefs.max_weeknight_mins) ? prefs.max_weeknight_mins : 45
  var disliked = (prefs && prefs.disliked_ingredients) ? prefs.disliked_ingredients : []

  var restrictionStr = restrictions.length ? restrictions.join(', ') : 'none'
  var dislikedStr = disliked.length ? disliked.join(', ') : 'none'
  var cuisineStr = cuisines.join(', ')
  var existingStr = existingTitles.slice(0, 15).join(', ')

  var promptLines = [
    'Generate ' + count + ' different dinner recipes for a family.',
    'Requirements:',
    '- Max total time: ' + maxTime + ' minutes each',
    '- Dietary restrictions (MUST follow): ' + restrictionStr,
    '- Avoid these ingredients: ' + dislikedStr,
    '- Preferred cuisines: ' + cuisineStr,
    '- Different from these existing recipes: ' + existingStr,
    '- Family-friendly, serves 4, variety of proteins and cuisines',
    '',
    'Return ONLY a valid JSON array of ' + count + ' recipe objects.',
    'Each recipe object must have these exact keys:',
    'title, description, cuisine, meal_type, difficulty, prep_time_mins, cook_time_mins, total_time_mins, base_servings, ingredients, instructions, tags, dietary_flags',
    '',
    'Start your response with [ and end with ]. No explanation, no markdown.',
  ]

  var prompt = promptLines.join('\n')

  var response = await callWithRetry(function() {
    return anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      system: 'You are a recipe generation API. Return ONLY valid JSON arrays. No explanation, no markdown fences.',
      messages: [{ role: 'user', content: prompt }],
    })
  })

  var raw = (response.content[0] && response.content[0].text) ? response.content[0].text.trim() : '[]'

  // Extract JSON array robustly
  var parsed
  try {
    var bfi = raw.indexOf('[')
    var bli = raw.lastIndexOf(']')
    if (bfi < 0 || bli <= bfi) throw new Error('No JSON array in batch response')
    parsed = JSON.parse(raw.substring(bfi, bli + 1))
  } catch (e) {
    throw new Error('Could not parse recipe batch response: ' + e.message)
  }

  if (!Array.isArray(parsed)) throw new Error('Invalid recipe batch response')

  var saved = []
  for (var i = 0; i < parsed.length; i++) {
    var recipe = parsed[i]
    try {
      var res = await sb.from('system_recipes').insert({
        title: recipe.title,
        description: recipe.description || null,
        cuisine: recipe.cuisine,
        meal_type: recipe.meal_type || 'dinner',
        difficulty: recipe.difficulty || 2,
        prep_time_mins: recipe.prep_time_mins || null,
        cook_time_mins: recipe.cook_time_mins || null,
        total_time_mins: recipe.total_time_mins || null,
        base_servings: recipe.base_servings || 4,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        tags: recipe.tags || [],
        dietary_flags: recipe.dietary_flags || [],
        source: 'ai_generated',
        times_served: 1,
      }).select('id').single()

      if (!res.error && res.data) {
        console.log('Saved system recipe: "' + recipe.title + '"')
        saved.push({
          id: 'sys-' + res.data.id,
          system_recipe_id: res.data.id,
          title: recipe.title,
          cuisine: recipe.cuisine,
          total_time_mins: recipe.total_time_mins,
          tags: recipe.tags || [],
          dietary_flags: recipe.dietary_flags || [],
          base_servings: recipe.base_servings || 4,
          from_generated: true,
        })
      }
    } catch (saveErr) {
      console.error('Failed to save recipe "' + recipe.title + '":', saveErr.message)
    }
  }

  return saved
}

// ── MAIN ROUTE ───────────────────────────────────────────────
export async function POST(request) {
  try {
    var body = await request.json()
    var userId = body.userId
    var weekStartDate = body.weekStartDate
    var useVariety = body.useVariety === true // explicitly opt-in to mixing system recipes

    if (!userId || !weekStartDate) {
      return Response.json({ error: 'Missing userId or weekStartDate' }, { status: 400 })
    }

    var sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch all data in parallel
    console.log('Fetching data for userId:', userId)
    var results = await Promise.all([
      sb.from('profiles').select('family_size, dinner_hour, family_name').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', userId),
      sb.from('recipes')
        .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings, is_favorite, times_made, average_rating')
        .eq('profile_id', userId)
        .order('is_favorite', { ascending: false }),
    ])
    console.log('Profile found:', results[0].data ? 'yes' : 'no', '| Prefs found:', results[1].data ? 'yes' : 'no')
    console.log('Recipes query error:', results[3].error ? results[3].error.message : 'none')
    console.log('Raw recipe count from DB:', results[3].data ? results[3].data.length : 0)

    var profile = results[0].data
    var prefs = results[1].data
    var blackoutDays = (results[2].data || []).map(function(b) { return b.day_of_week })
    var baseRecipes = results[3].data || []

    // Fetch rotation fields separately — safe if columns don't exist yet
    var rotationData = {}
    try {
      var rotRes = await sb.from('recipes').select('id, in_rotation, rotation_frequency, last_planned_date').eq('profile_id', userId)
      if (rotRes.data) {
        rotRes.data.forEach(function(r) { rotationData[r.id] = r })
      }
    } catch (e) {
      console.log('Rotation columns not available yet')
    }

    var vaultRecipes = baseRecipes.map(function(r) {
      return Object.assign({}, r, {
        in_rotation: (rotationData[r.id] && rotationData[r.id].in_rotation) || false,
        rotation_frequency: (rotationData[r.id] && rotationData[r.id].rotation_frequency) || null,
        last_planned_date: (rotationData[r.id] && rotationData[r.id].last_planned_date) || null,
      })
    })

    // Build week dates using local timezone
    var weekDates = []
    var start = new Date(weekStartDate + 'T12:00:00')
    for (var i = 0; i < 7; i++) {
      var d = new Date(start)
      d.setDate(start.getDate() + i)
      weekDates.push({
        date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
        dayOfWeek: d.getDay(),
        dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()],
      })
    }

    var cookingDays = weekDates.filter(function(d) { return blackoutDays.indexOf(d.dayOfWeek) < 0 })
    var skippedDays = weekDates.filter(function(d) { return blackoutDays.indexOf(d.dayOfWeek) >= 0 })
    var mealsNeeded = cookingDays.length

    // Categorize vault recipes
    var today = new Date()
    var rotationRecipes = vaultRecipes.filter(function(r) { return r.in_rotation }).map(function(r) {
      var isDue = true
      if (r.last_planned_date) {
        var last = new Date(r.last_planned_date)
        var daysSince = (today - last) / (1000 * 60 * 60 * 24)
        if (r.rotation_frequency === 'weekly') isDue = daysSince >= 6
        else if (r.rotation_frequency === 'biweekly') isDue = daysSince >= 13
        else if (r.rotation_frequency === 'monthly') isDue = daysSince >= 27
      }
      return Object.assign({}, r, { isDue: isDue })
    })

    var dueRotation = rotationRecipes.filter(function(r) { return r.isDue })
    var otherVault = vaultRecipes.filter(function(r) { return !r.in_rotation })
    var vaultCount = vaultRecipes.length
    console.log('=== PLAN GENERATION DEBUG ===')
    console.log('userId:', userId)
    console.log('Vault recipes found:', vaultCount)
    console.log('Vault recipe titles:', vaultRecipes.map(function(r) { return r.title }).join(', '))
    console.log('Meals needed:', mealsNeeded, '| Cooking days:', cookingDays.map(function(d) { return d.dayName }).join(', '))
    console.log('useVariety:', useVariety)
    console.log('Rotation due:', dueRotation.length)
    console.log('Other vault:', otherVault.length)

    // Always fetch system recipes for variety pool
    // Even if vault covers the week, get some system recipes so Claude has variety
    var systemPoolSize = useVariety
      ? Math.max(mealsNeeded, 10)  // big pool when user wants variety
      : Math.max(mealsNeeded - vaultCount, 4)  // smaller pool otherwise, min 4 for dedup safety
    var fallbacksNeeded = systemPoolSize

    // Get system recipes first
    var systemRecipes = []
    if (fallbacksNeeded > 0) {
      console.log('Vault has ' + vaultCount + ' recipes, fetching ' + fallbacksNeeded + ' from system database...')
      systemRecipes = await getSystemRecipes(sb, prefs, fallbacksNeeded)
      console.log('Found ' + systemRecipes.length + ' system recipes')
    }

    // Generate if still needed
    var stillNeeded = fallbacksNeeded - systemRecipes.length
    var generatedRecipes = []

    if (stillNeeded > 0) {
      console.log('Generating ' + stillNeeded + ' new recipes with Claude...')
      var existingTitles = vaultRecipes.concat(systemRecipes).map(function(r) { return r.title })
      try {
        var batchGenerated = await generateAndSaveRecipes(sb, prefs, existingTitles, stillNeeded)
        batchGenerated.forEach(function(r) { generatedRecipes.push(r) })
        console.log('Generated ' + generatedRecipes.length + ' new recipes')
      } catch (genErr) {
        console.error('Batch generation failed:', genErr.message)
        // Emergency fallback
        var emergency = [
          { id: 'emg-1', title: 'Garlic Butter Chicken', cuisine: 'American', total_time_mins: 30, tags: ['chicken','weeknight'], dietary_flags: [], base_servings: 4 },
          { id: 'emg-2', title: 'Simple Beef Tacos', cuisine: 'Mexican', total_time_mins: 25, tags: ['beef','weeknight'], dietary_flags: [], base_servings: 4 },
          { id: 'emg-3', title: 'Lemon Pasta', cuisine: 'Italian', total_time_mins: 20, tags: ['vegetarian','pasta'], dietary_flags: ['vegetarian'], base_servings: 4 },
          { id: 'emg-4', title: 'Honey Soy Salmon', cuisine: 'Asian', total_time_mins: 25, tags: ['seafood','healthy'], dietary_flags: [], base_servings: 4 },
          { id: 'emg-5', title: 'Black Bean Bowls', cuisine: 'Mexican', total_time_mins: 20, tags: ['vegetarian','healthy'], dietary_flags: ['vegetarian'], base_servings: 4 },
        ]
        emergency.slice(0, stillNeeded).forEach(function(r) { generatedRecipes.push(r) })
      }
    }

    var allRecipes = dueRotation.concat(otherVault).concat(systemRecipes).concat(generatedRecipes)

    // Build prompt for Claude to assign recipes to days
    var restrictions2 = [].concat(
      prefs && prefs.dietary_flags ? prefs.dietary_flags : [],
      prefs && prefs.allergens ? prefs.allergens : []
    )

    // Use simple numeric indices instead of UUIDs to prevent Claude from mangling them
    var indexedRecipes = []
    var recipeIndex = {}

    dueRotation.forEach(function(r, i) {
      var idx = 'R' + (indexedRecipes.length + 1)
      indexedRecipes.push(r)
      recipeIndex[idx] = r.id
    })
    var rotationIndexed = dueRotation.map(function(r, i) {
      return '- IDX: R' + (i + 1) + ' | "' + r.title + '" | ' + (r.rotation_frequency || '') + ' | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min | ROTATION'
    })

    var vaultStart = indexedRecipes.length
    otherVault.forEach(function(r) { indexedRecipes.push(r) })
    var vaultIndexed = otherVault.map(function(r, i) {
      var idx = 'V' + (i + 1)
      recipeIndex[idx] = r.id
      return '- IDX: ' + idx + ' | "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min | Favorite: ' + (r.is_favorite ? 'YES' : 'no') + ' | PERSONAL VAULT RECIPE'
    })

    var sysAll = systemRecipes.concat(generatedRecipes)
    var sysIndexed = sysAll.map(function(r, i) {
      var idx = 'S' + (i + 1)
      recipeIndex[idx] = r.id
      indexedRecipes.push(r)
      return '- IDX: ' + idx + ' | "' + r.title + '" | ' + (r.cuisine || 'various') + ' | ' + (r.total_time_mins || '?') + ' min | DATABASE RECIPE'
    })

    var rotationSection = rotationIndexed.length > 0 ? rotationIndexed.join('\n') : 'None due this week'
    var vaultSection = vaultIndexed.length > 0 ? vaultIndexed.join('\n') : 'None — use database recipes'
    var systemSection = sysIndexed.length > 0 ? sysIndexed.join('\n') : 'None'

    console.log('Recipe index built:', JSON.stringify(recipeIndex))

    var promptLines2 = [
      'You are the meal planning AI for Simply Sous.',
      '',
      'USER PREFERENCE: ' + (useVariety ? 'Mix in new recipes from the system database alongside vault recipes for variety.' : 'Prioritize the user vault recipes first.'),
      '',
      'FAMILY: ' + (profile && profile.family_size ? profile.family_size : 4) + ' people',
      'DIETARY RESTRICTIONS (never violate): ' + (restrictions2.length ? restrictions2.join(', ') : 'none'),
      'CUISINE PREFERENCES: ' + (prefs && prefs.cuisine_loves ? prefs.cuisine_loves.join(', ') : 'varied'),
      'DISLIKED INGREDIENTS: ' + (prefs && prefs.disliked_ingredients ? prefs.disliked_ingredients.join(', ') : 'none'),
      'MAX WEEKNIGHT COOK TIME: ' + (prefs && prefs.max_weeknight_mins ? prefs.max_weeknight_mins : 45) + ' minutes',
      '',
      'DAYS TO PLAN:',
      cookingDays.map(function(d) { return '- ' + d.dayName + ' ' + d.date }).join('\n'),
      '',
      'SKIPPED DAYS: ' + (skippedDays.length ? skippedDays.map(function(d) { return d.dayName }).join(', ') : 'none'),
      '',
      'ROTATION RECIPES (schedule these first):',
      rotationSection,
      '',
      'OTHER VAULT RECIPES (use after rotation):',
      vaultSection,
      '',
      'SYSTEM DATABASE RECIPES (fill remaining days):',
      systemSection,
      '',
      'RULES:',
      '1. Assign exactly one recipe per cooking day',
      '2. ALWAYS schedule due rotation recipes first — these are marked ROTATION in the list',
      '3. STRONGLY PREFER personal vault recipes (marked PERSONAL RECIPE) over system database recipes',
      '4. Only use system database recipes when vault recipes are exhausted or when user requested variety',
      '5. No same cuisine two days in a row',
      '6. Balance proteins across the week',
      '7. NEVER repeat the same recipe_id twice in the same week — every day must have a unique recipe',
      '8. If vault has enough recipes to fill the week, prefer vault over system database',
      '',
      'CRITICAL REQUIREMENTS:',
      '- You MUST return exactly ' + cookingDays.length + ' entries in the array - one for EACH cooking day listed above',
      '- Every cooking day must have a recipe_idx assigned using the IDX codes (V1, V2, S1, R1 etc)',
      '- STRONGLY prefer PERSONAL VAULT RECIPE entries (V codes) over DATABASE RECIPE entries (S codes)',
      '- NEVER repeat the same recipe_idx twice in the same week',
      '- Return ONLY the JSON array. Start with [ and end with ]. Nothing else.',
      '',
      'Format: [{"date":"YYYY-MM-DD","recipe_idx":"V1","is_skipped":false,"skip_reason":null}]',
      'Use the IDX value (like V1, S3, R2) NOT the full recipe title as the recipe_idx.',
    ]

    var prompt2 = promptLines2.join('\n')

    var response2 = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        system: 'You are a meal planning API. Respond ONLY with a valid JSON array. No explanation, no markdown.',
        messages: [{ role: 'user', content: prompt2 }],
      })
    })

    var raw2 = (response2.content[0] && response2.content[0].text) ? response2.content[0].text.trim() : '[]'
    console.log('Plan response preview:', raw2.substring(0, 150))

    // Parse robustly
    var planSlots
    try {
      // Always extract by finding first [ and last ] — handles any surrounding text or markdown
      var fi = raw2.indexOf('[')
      var li = raw2.lastIndexOf(']')
      if (fi < 0 || li <= fi) {
        throw new Error('No JSON array found in response')
      }
      var extracted = raw2.substring(fi, li + 1)
      planSlots = JSON.parse(extracted)
    } catch (e) {
      console.error('Plan JSON parse error:', e.message, '| Raw:', raw2.substring(0, 300))
      return Response.json({ error: 'Plan generation failed — unexpected format. Please try again.' }, { status: 500 })
    }

    if (!Array.isArray(planSlots)) {
      return Response.json({ error: 'Plan generation failed — invalid response. Please try again.' }, { status: 500 })
    }

    // Inject blackout days server-side
    var claudeSlotMap = {}
    // Convert recipe_idx back to real recipe IDs using our index map
    planSlots = planSlots.map(function(slot) {
      if (slot.is_skipped) return slot
      var idx = slot.recipe_idx || slot.recipe_id
      if (!idx) return slot
      var realId = recipeIndex[idx]
      if (!realId) {
        // Claude may have returned the title or a slightly different format — try to match
        console.log('No match for idx:', idx, '| Available:', Object.keys(recipeIndex).join(','))
      }
      return Object.assign({}, slot, { recipe_id: realId || null, recipe_idx: idx })
    })
    planSlots.forEach(function(s) { claudeSlotMap[s.date] = s })

    var mergedSlots = weekDates.map(function(d) {
      if (blackoutDays.indexOf(d.dayOfWeek) >= 0) {
        return { date: d.date, recipe_id: null, is_skipped: true, skip_reason: 'blackout day' }
      }
      return claudeSlotMap[d.date] || { date: d.date, recipe_id: null, is_skipped: false, skip_reason: null }
    })

    // Deduplicate
    var usedIds = new Set()
    var deduped = mergedSlots.map(function(slot) {
      if (slot.is_skipped || !slot.recipe_id) return slot
      if (usedIds.has(slot.recipe_id)) {
        var unused = allRecipes.find(function(r) { return !usedIds.has(r.id) && r.id !== slot.recipe_id })
        if (unused) {
          usedIds.add(unused.id)
          return Object.assign({}, slot, { recipe_id: unused.id })
        }
        return slot
      }
      usedIds.add(slot.recipe_id)
      return slot
    })

    // Build recipe map and enrich
    var recipeMap = {}
    allRecipes.forEach(function(r) { recipeMap[r.id] = r })

    // Debug: log ID matching
    console.log('Recipe map keys sample:', Object.keys(recipeMap).slice(0, 5))
    console.log('Claude returned IDs:', deduped.filter(function(s){return !s.is_skipped}).map(function(s){return s.recipe_id}))
    console.log('Vault IDs in map:', Object.keys(recipeMap).filter(function(k){return !k.startsWith('sys-')}).slice(0, 5))

    var enriched = deduped.map(function(slot) {
      var recipe = null
      if (slot.recipe_id) {
        recipe = recipeMap[slot.recipe_id] || null
        if (!recipe) {
          // Try matching without sys- prefix for edge cases
          var bareId = String(slot.recipe_id).replace(/^sys-/, '')
          recipe = recipeMap['sys-' + bareId] || recipeMap[bareId] || null
        }
      }
      return Object.assign({}, slot, {
        recipe: recipe,
        dayName: (weekDates.find(function(d) { return d.date === slot.date }) || {}).dayName || '',
      })
    })
    
    // Log how many recipes were matched
    var matched = enriched.filter(function(s) { return !s.is_skipped && s.recipe }).length
    var unmatched = enriched.filter(function(s) { return !s.is_skipped && !s.recipe && s.recipe_id }).length
    console.log('Enrichment: ' + matched + ' matched, ' + unmatched + ' unmatched')

    // Increment served for used system recipes
    var usedSystemIds = deduped
      .filter(function(s) { return s.recipe_id && String(s.recipe_id).startsWith('sys-') && !String(s.recipe_id).startsWith('sys-emg') })
      .map(function(s) {
        var r = allRecipes.find(function(r2) { return r2.id === s.recipe_id })
        return r ? r.system_recipe_id : null
      })
      .filter(Boolean)

    if (usedSystemIds.length > 0) {
      incrementServed(sb, usedSystemIds)
    }

    // Update last_planned_date for rotation recipes used
    var usedRotationIds = deduped
      .filter(function(s) { return s.recipe_id && !String(s.recipe_id).startsWith('sys-') })
      .map(function(s) { return s.recipe_id })
      .filter(function(id) { return rotationRecipes.some(function(r) { return r.id === id }) })

    if (usedRotationIds.length > 0) {
      var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
      for (var j = 0; j < usedRotationIds.length; j++) {
        try {
          await sb.from('recipes').update({ last_planned_date: todayStr }).eq('id', usedRotationIds[j])
        } catch (err) {
          console.error('Failed to update last_planned_date:', err)
        }
      }
    }

    return Response.json({
      plan: enriched,
      weekStartDate: weekStartDate,
      stats: {
        vaultRecipes: vaultCount,
        systemRecipesUsed: systemRecipes.length,
        generatedRecipes: generatedRecipes.length,
      }
    })

  } catch (err) {
    console.error('Plan generate error:', err)
    var msg = err.message || 'Failed to generate plan'
    if (msg.includes('529') || msg.toLowerCase().includes('overload')) {
      msg = 'Dot is a little busy right now. Wait 30 seconds and try again.'
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
