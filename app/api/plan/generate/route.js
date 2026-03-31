import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Retry wrapper for Anthropic API calls — handles 529 overload gracefully
async function callWithRetry(fn, maxRetries) {
  var max = maxRetries || 3
  for (var attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn()
    } catch (err) {
      // Anthropic SDK error can have status, statusCode, or error.type
      var statusCode = err.status || err.statusCode || (err.error && err.error.type === 'overloaded_error' ? 529 : 0)
      var isOverloaded = statusCode === 529 ||
        (err.message && err.message.toLowerCase().includes('overload')) ||
        (err.error && err.error.type === 'overloaded_error')
      var isRateLimit = statusCode === 429

      if ((isOverloaded || isRateLimit) && attempt < max) {
        var delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000
        var msg = 'Anthropic overloaded (attempt ' + (attempt + 1) + '/' + max + '), retrying in ' + Math.round(delay / 1000) + 's...'
        console.log(msg)
        await new Promise(function(resolve) { setTimeout(resolve, delay) })
        continue
      }
      throw err
    }
  }
}

// ── SYSTEM RECIPE LOOKUP + GENERATION ───────────────────────
// 1. Search system_recipes database first (zero cost)
// 2. If no match, generate with Claude and save to database
// 3. Every generation enriches the shared database for future users

async function getSystemRecipes(sb, prefs, count, excludeIds = []) {
  const dietaryFlags = (prefs?.dietary_flags || []).map(f => f.toLowerCase())
  const allergens = (prefs?.allergens || []).map(a => a.toLowerCase())
  const restrictions = [...dietaryFlags, ...allergens]
  const maxTime = prefs?.max_weeknight_mins || 60
  const cuisines = prefs?.cuisine_loves || []

  // Build search query — find recipes matching preferences
  let query = sb
    .from('system_recipes')
    .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
    .lte('total_time_mins', maxTime + 15) // slight buffer
    .order('times_served', { ascending: true }) // prefer less-served for variety

  // Filter out already-selected recipes
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  // Dietary restriction filters
  if (restrictions.includes('vegan')) {
    query = query.contains('dietary_flags', ['vegan'])
  } else if (restrictions.includes('vegetarian')) {
    query = query.or('dietary_flags.cs.{"vegetarian"},dietary_flags.cs.{"vegan"}')
  }
  if (restrictions.includes('gluten-free')) {
    query = query.contains('dietary_flags', ['gluten-free'])
  }

  // Try with cuisine preference first
  let results = []
  if (cuisines.length > 0) {
    const cuisineQuery = query.in('cuisine', cuisines).limit(count * 2)
    const { data } = await cuisineQuery
    results = data || []
  }

  // If not enough cuisine matches, fill with any matching recipes
  if (results.length < count) {
    const needed = count - results.length
    const existingIds = [...excludeIds, ...results.map(r => r.id)]
    let fillQuery = sb
      .from('system_recipes')
      .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings')
      .lte('total_time_mins', maxTime + 15)
      .order('times_served', { ascending: true })
      .limit(needed * 2)

    if (existingIds.length > 0) {
      fillQuery = fillQuery.not('id', 'in', `(${existingIds.join(',')})`)
    }
    if (restrictions.includes('vegan')) fillQuery = fillQuery.contains('dietary_flags', ['vegan'])
    else if (restrictions.includes('vegetarian')) fillQuery = fillQuery.or('dietary_flags.cs.{"vegetarian"},dietary_flags.cs.{"vegan"}')

    const { data: fillData } = await fillQuery
    results = [...results, ...(fillData || [])]
  }

  // Map to our standard format
  return results.slice(0, count).map(r => ({
    id: `sys-${r.id}`,
    system_recipe_id: r.id,
    title: r.title,
    cuisine: r.cuisine,
    total_time_mins: r.total_time_mins,
    tags: r.tags || [],
    dietary_flags: r.dietary_flags || [],
    base_servings: r.base_servings || 4,
    from_database: true,
  }))
}

// Generate a new recipe with Claude and save it to system_recipes
async function generateAndSaveRecipe(sb, prefs, existingTitles) {
  const restrictions = [
    ...(prefs?.dietary_flags || []),
    ...(prefs?.allergens || []),
  ]
  const cuisines = prefs?.cuisine_loves || ['American', 'Italian', 'Mexican']
  const maxTime = prefs?.max_weeknight_mins || 45
  const disliked = prefs?.disliked_ingredients || []

  // Pick a random cuisine from preferences for variety
  const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)]

  const prompt = `Generate a complete dinner recipe with these requirements:
- Cuisine: ${cuisine}
- Max total time: ${maxTime} minutes
- Dietary restrictions (MUST follow): ${restrictions.length ? restrictions.join(', ') : 'none'}
- Avoid these ingredients: ${disliked.length ? disliked.join(', ') : 'none'}
- Different from these existing recipes: ${existingTitles.slice(0, 10).join(', ')}
- Family-friendly, serves 4

Return ONLY valid JSON matching this structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "cuisine": "${cuisine}",
  "meal_type": "dinner",
  "difficulty": 2,
  "prep_time_mins": 15,
  "cook_time_mins": 25,
  "total_time_mins": 40,
  "base_servings": 4,
  "ingredients": [
    { "name": "chicken breast", "amount": 1.5, "unit": "lbs", "notes": "sliced thin" }
  ],
  "instructions": [
    { "step": 1, "text": "instruction here", "timer_minutes": null }
  ],
  "tags": ["chicken", "weeknight", "under-45-min"],
  "dietary_flags": []
}

Return ONLY the JSON, no markdown, no explanation.`

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  }))

  const raw = response.content[0]?.text?.trim()
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const recipe = JSON.parse(cleaned)

  // Save to system_recipes database for future users
  const { data: saved, error: saveErr } = await sb
    .from('system_recipes')
    .insert({
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      meal_type: recipe.meal_type || 'dinner',
      difficulty: recipe.difficulty || 2,
      prep_time_mins: recipe.prep_time_mins,
      cook_time_mins: recipe.cook_time_mins,
      total_time_mins: recipe.total_time_mins,
      base_servings: recipe.base_servings || 4,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags || [],
      dietary_flags: recipe.dietary_flags || [],
      source: 'ai_generated',
      times_served: 1,
    })
    .select('id')
    .single()

  if (saveErr) {
    console.error('Failed to save generated recipe:', saveErr)
  } else {
    console.log(`Generated + saved new system recipe: "${recipe.title}" (${saved?.id})`)
  }

  return {
    id: saved?.id ? `sys-${saved.id}` : `sys-gen-${Date.now()}`,
    system_recipe_id: saved?.id || null,
    title: recipe.title,
    cuisine: recipe.cuisine,
    total_time_mins: recipe.total_time_mins,
    tags: recipe.tags || [],
    dietary_flags: recipe.dietary_flags || [],
    base_servings: recipe.base_servings || 4,
    from_generated: true,
  }
}

// Increment times_served counter for used system recipes
async function incrementServed(sb, systemRecipeIds) {
  if (!systemRecipeIds.length) return
  for (const id of systemRecipeIds) {
    await sb.rpc('increment_recipe_served', { recipe_id: id }).catch(() => {
      // Non-critical — ignore errors
    })
  }
}

// ── MAIN ROUTE ───────────────────────────────────────────────
export async function POST(request) {
  try {
    const { userId, weekStartDate } = await request.json()
    if (!userId || !weekStartDate) {
      return Response.json({ error: 'Missing userId or weekStartDate' }, { status: 400 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch user data in parallel
    const [profileRes, prefsRes, blackoutRes, recipesRes] = await Promise.all([
      sb.from('profiles').select('family_size, dinner_hour, family_name').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', userId),
      sb.from('recipes')
        .select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings, is_favorite, times_made, average_rating')
        .eq('profile_id', userId),
    ])

    const profile = profileRes.data
    const prefs = prefsRes.data
    const blackoutDays = (blackoutRes.data || []).map(b => b.day_of_week)
    const baseRecipes = recipesRes.data || []

    // Fetch rotation fields separately — safe if columns don't exist yet
    let rotationData = {}
    try {
      const { data: rotData } = await sb
        .from('recipes')
        .select('id, in_rotation, rotation_frequency, last_planned_date')
        .eq('profile_id', userId)
      if (rotData) {
        rotData.forEach(r => { rotationData[r.id] = r })
      }
    } catch (e) {
      console.log('Rotation columns not yet available, skipping rotation logic')
    }

    const vaultRecipes = baseRecipes.map(r => ({
      ...r,
      in_rotation: rotationData[r.id]?.in_rotation || false,
      rotation_frequency: rotationData[r.id]?.rotation_frequency || null,
      last_planned_date: rotationData[r.id]?.last_planned_date || null,
    }))

    // Build week dates
    const weekDates = []
    const start = new Date(weekStartDate)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      weekDates.push({
        date: d.toISOString().split('T')[0],
        dayOfWeek: d.getDay(),
        dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()],
      })
    }

    const cookingDays = weekDates.filter(d => !blackoutDays.includes(d.dayOfWeek))
    const skippedDays = weekDates.filter(d => blackoutDays.includes(d.dayOfWeek))
    const mealsNeeded = cookingDays.length

    // Step 1: How many fallback recipes do we need?
    // Categorize vault recipes by priority
    const today = new Date()
    const rotationRecipes = vaultRecipes.filter(r => r.in_rotation).map(r => ({
      ...r,
      priority: 1,
      // Check if due based on frequency + last_planned_date
      isDue: (() => {
        if (!r.last_planned_date) return true // never planned, always due
        const last = new Date(r.last_planned_date)
        const daysSince = (today - last) / (1000 * 60 * 60 * 24)
        if (r.rotation_frequency === 'weekly') return daysSince >= 6
        if (r.rotation_frequency === 'biweekly') return daysSince >= 13
        if (r.rotation_frequency === 'monthly') return daysSince >= 27
        return true
      })()
    }))

    const dueRotation = rotationRecipes.filter(r => r.isDue)
    const otherVault = vaultRecipes.filter(r => !r.in_rotation).map(r => ({...r, priority: 2}))

    // How many fallbacks do we need after vault recipes?
    const vaultCount = vaultRecipes.length
    const fallbacksNeeded = Math.max(0, mealsNeeded - vaultCount + 2) // +2 for variety

    // Step 2: Try system_recipes database first
    let systemRecipes = []
    if (fallbacksNeeded > 0) {
      console.log(`Vault has ${vaultCount} recipes, fetching ${fallbacksNeeded} from system database...`)
      systemRecipes = await getSystemRecipes(sb, prefs, fallbacksNeeded)
      console.log(`Found ${systemRecipes.length} system recipes`)
    }

    // Step 3: If system database doesn't have enough, generate with Claude
    const stillNeeded = fallbacksNeeded - systemRecipes.length
    const generatedRecipes = []

    if (stillNeeded > 0) {
      console.log(`Generating ${stillNeeded} new recipes with Claude...`)
      const existingTitles = [...vaultRecipes, ...systemRecipes].map(r => r.title)

      for (let i = 0; i < stillNeeded; i++) {
        try {
          const generated = await generateAndSaveRecipe(sb, prefs, existingTitles)
          generatedRecipes.push(generated)
          existingTitles.push(generated.title)
        } catch (genErr) {
          console.error('Recipe generation failed:', genErr)
        }
      }
      console.log(`Generated ${generatedRecipes.length} new recipes, saved to system database`)
    }

    const allRecipes = [...dueRotation, ...otherVault, ...systemRecipes, ...generatedRecipes]

    // Step 4: Ask Claude to assign recipes to days
    const restrictions = [
      ...(prefs?.dietary_flags || []),
      ...(prefs?.allergens || []),
    ]

    const prompt = `You are the meal planning AI for Simply Sous.

FAMILY: ${profile?.family_size || 4} people
DIETARY RESTRICTIONS (never violate): ${restrictions.length ? restrictions.join(', ') : 'none'}
CUISINE PREFERENCES: ${prefs?.cuisine_loves?.join(', ') || 'varied'}
DISLIKED INGREDIENTS: ${(prefs?.disliked_ingredients || []).join(', ') || 'none'}
MAX WEEKNIGHT COOK TIME: ${prefs?.max_weeknight_mins || 45} minutes
COOKING SKILL: ${prefs?.cooking_skill || 2}/5

DAYS TO PLAN:
${cookingDays.map(d => `- ${d.dayName} ${d.date} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.dayOfWeek]})`).join('\n')}

SKIPPED DAYS: ${skippedDays.map(d => d.dayName).join(', ') || 'none'}

ROTATION RECIPES (schedule these first — user has explicitly requested them):
${dueRotation.length > 0 ? dueRotation.map(r => `- ID: "${r.id}" | "${r.title}" | ${r.rotation_frequency} | ${r.cuisine || 'various'} | ${r.total_time_mins || '?'} min`).join('\n') : 'None due this week'}

OTHER VAULT RECIPES (use after rotation is satisfied):
${otherVault.map(r => `- ID: "${r.id}" | "${r.title}" | ${r.cuisine || 'various'} | ${r.total_time_mins || '?'} min | Favorite: ${r.is_favorite ? 'YES':'no'} | Made: ${r.times_made||0}x`).join('\n') || 'None'}

SYSTEM DATABASE RECIPES (use to fill remaining days):
${[...systemRecipes, ...generatedRecipes].map(r => `- ID: "${r.id}" | "${r.title}" | ${r.cuisine || 'various'} | ${r.total_time_mins || '?'} min`).join('\n') || 'None'}

RULES:
1. Assign exactly one recipe per cooking day
2. ALWAYS schedule due rotation recipes first — these are the user's explicit requests
3. Fill remaining days from Other Vault recipes, then System Database
4. No same cuisine two days in a row
5. Balance proteins across the week
6. Respect weeknight time limits (${prefs?.max_weeknight_mins || 45} min max on weekdays)
7. Never repeat same recipe in same week

CRITICAL: Your response must be ONLY a valid JSON array. No explanation. No preamble. No markdown. Start your response with [ and end with ]. Nothing else.

[
  { "date": "YYYY-MM-DD", "recipe_id": "the-id-exactly-as-shown", "is_skipped": false, "skip_reason": null },
  { "date": "YYYY-MM-DD", "recipe_id": null, "is_skipped": true, "skip_reason": "blackout day" }
]`

    const response = await callWithRetry(() => anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      system: 'You are a meal planning API. You respond ONLY with valid JSON arrays. Never explain. Never add text before or after the JSON. Your entire response is always a JSON array starting with [ and ending with ].',
      messages: [{ role: 'user', content: prompt }],
    }))

    const raw = response.content[0]?.text?.trim() || ''
    console.log('Plan generation raw response:', raw.substring(0, 200))

    // Robust extraction — find the JSON array even if Claude added surrounding text
    let planSlots
    try {
      // Try direct parse first
      const directCleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      planSlots = JSON.parse(directCleaned)
    } catch {
      // Fall back to extracting the JSON array from the response
      const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (!arrayMatch) {
        console.error('Could not find JSON array in response:', raw)
        return Response.json({
          error: 'Plan generation failed — AI returned unexpected format. Please try again.'
        }, { status: 500 })
      }
      planSlots = JSON.parse(arrayMatch[0])
    }

    if (!Array.isArray(planSlots)) {
      return Response.json({
        error: 'Plan generation failed — invalid response format. Please try again.'
      }, { status: 500 })
    }

    // Enrich with full recipe data
    const recipeMap = {}
    allRecipes.forEach(r => { recipeMap[r.id] = r })

    const enriched = planSlots.map(slot => ({
      ...slot,
      recipe: slot.recipe_id ? (recipeMap[slot.recipe_id] || null) : null,
      dayName: weekDates.find(d => d.date === slot.date)?.dayName || '',
    }))

    // Increment served count for system recipes that were used
    const usedSystemIds = planSlots
      .filter(s => s.recipe_id?.startsWith('sys-') && !s.recipe_id?.startsWith('sys-gen-'))
      .map(s => {
        const match = allRecipes.find(r => r.id === s.recipe_id)
        return match?.system_recipe_id || null
      })
      .filter(Boolean)

    if (usedSystemIds.length > 0) {
      incrementServed(sb, usedSystemIds)
    }

    // Update last_planned_date for rotation recipes that were used
    const usedRotationIds = planSlots
      .filter(s => s.recipe_id && !String(s.recipe_id).startsWith('sys-'))
      .map(s => s.recipe_id)
      .filter(id => rotationRecipes.some(r => r.id === id))

    if (usedRotationIds.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      for (const id of usedRotationIds) {
        await sb.from('recipes')
          .update({ last_planned_date: today })
          .eq('id', id)
          .catch(err => console.error('Failed to update last_planned_date:', err))
      }
    }

    return Response.json({
      plan: enriched,
      weekStartDate,
      stats: {
        vaultRecipes: vaultCount,
        systemRecipesUsed: systemRecipes.length,
        generatedRecipes: generatedRecipes.length,
      }
    })

  } catch (err) {
    console.error('Plan generate error:', err)
    return Response.json({ error: err.message || 'Failed to generate plan' }, { status: 500 })
  }
}
