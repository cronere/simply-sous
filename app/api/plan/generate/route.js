import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// System recipes to fill gaps when vault is thin
const FALLBACK_RECIPES = [
  { id: 'sys-1', title: 'Classic Spaghetti Bolognese', cuisine: 'Italian', total_time_mins: 45, tags: ['beef','pasta','weeknight'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-2', title: 'Lemon Herb Roasted Chicken', cuisine: 'American', total_time_mins: 55, tags: ['chicken','baked','weeknight'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-3', title: 'Black Bean Tacos', cuisine: 'Mexican', total_time_mins: 25, tags: ['vegetarian','weeknight','under-30-min'], dietary_flags: ['vegetarian'], base_servings: 4 },
  { id: 'sys-4', title: 'Honey Garlic Salmon', cuisine: 'American', total_time_mins: 25, tags: ['seafood','salmon','healthy','under-30-min'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-5', title: 'Chicken Fried Rice', cuisine: 'Chinese', total_time_mins: 30, tags: ['chicken','rice','weeknight','under-30-min'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-6', title: 'Beef Stir Fry', cuisine: 'Asian', total_time_mins: 25, tags: ['beef','stovetop','under-30-min'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-7', title: 'Margherita Pizza', cuisine: 'Italian', total_time_mins: 35, tags: ['vegetarian','baked','kid-friendly'], dietary_flags: ['vegetarian'], base_servings: 4 },
  { id: 'sys-8', title: 'Thai Green Curry', cuisine: 'Thai', total_time_mins: 40, tags: ['chicken','thai','spicy'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-9', title: 'Sheet Pan Sausage & Veggies', cuisine: 'American', total_time_mins: 40, tags: ['sheet-pan','weeknight','pork'], dietary_flags: [], base_servings: 4 },
  { id: 'sys-10', title: 'Greek Chicken Bowls', cuisine: 'Mediterranean', total_time_mins: 35, tags: ['chicken','healthy','meal-prep'], dietary_flags: [], base_servings: 4 },
]

export async function POST(request) {
  try {
    const { userId, weekStartDate } = await request.json()
    if (!userId || !weekStartDate) {
      return Response.json({ error: 'Missing userId or weekStartDate' }, { status: 400 })
    }

    // Use service role to fetch data server-side
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch user profile, preferences, and blackout days in parallel
    const [profileRes, prefsRes, blackoutRes, recipesRes] = await Promise.all([
      sb.from('profiles').select('family_size, dinner_hour, family_name, planning_advance_weeks').eq('id', userId).single(),
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('blackout_days').select('day_of_week, label').eq('profile_id', userId).eq('is_active', true),
      sb.from('recipes').select('id, title, cuisine, meal_type, total_time_mins, tags, dietary_flags, base_servings, is_favorite, times_made, average_rating').eq('profile_id', userId).eq('is_published', true),
    ])

    const profile = profileRes.data
    const prefs = prefsRes.data
    const blackoutDays = blackoutRes.data || []
    const vaultRecipes = recipesRes.data || []

    // Build the week's dates (Mon–Sun based on weekStartDate)
    const weekDates = []
    const start = new Date(weekStartDate)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      weekDates.push({
        date: d.toISOString().split('T')[0],
        dayOfWeek: d.getDay(), // 0=Sun, 6=Sat
        dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()],
      })
    }

    // Mark blackout days
    const blackoutDayNums = blackoutDays.map(b => b.day_of_week)
    const cookingDays = weekDates.filter(d => !blackoutDayNums.includes(d.dayOfWeek))
    const skippedDays = weekDates.filter(d => blackoutDayNums.includes(d.dayOfWeek))

    // Combine vault + fallback recipes (filter fallbacks by dietary restrictions)
    const dietaryFlags = prefs?.dietary_flags || []
    const allergens = prefs?.allergens || []
    const restrictions = [...dietaryFlags, ...allergens].map(s => s.toLowerCase())

    const filteredFallbacks = FALLBACK_RECIPES.filter(r => {
      if (restrictions.includes('vegan') && !r.dietary_flags.includes('vegan')) return false
      if (restrictions.includes('vegetarian') && !r.dietary_flags.includes('vegetarian') && !r.dietary_flags.includes('vegan')) return false
      return true
    })

    const allRecipes = [...vaultRecipes, ...filteredFallbacks]

    // Build Claude prompt
    const prompt = `You are the meal planning AI for Simply Sous, a family meal planning app.

FAMILY INFO:
- Family size: ${profile?.family_size || 4} people
- Dinner time: ${profile?.dinner_hour || '18:00:00'}
- Dietary restrictions (NEVER violate): ${restrictions.length ? restrictions.join(', ') : 'none'}
- Cuisine preferences: ${prefs?.cuisine_loves?.join(', ') || 'no specific preferences'}
- Disliked ingredients: ${prefs?.disliked_ingredients?.join(', ') || 'none'}
- Max weeknight cook time: ${prefs?.max_weeknight_mins || 45} minutes
- Cooking skill: ${prefs?.cooking_skill || 2}/5

DAYS TO PLAN (${cookingDays.length} days):
${cookingDays.map(d => `- ${d.dayName} ${d.date}`).join('\n')}

SKIPPED DAYS (blackout/eating out):
${skippedDays.length ? skippedDays.map(d => `- ${d.dayName}`).join('\n') : 'none'}

AVAILABLE RECIPES (vault + database):
${allRecipes.map(r => `- ID: ${r.id} | "${r.title}" | ${r.cuisine || 'various'} | ${r.total_time_mins || '?'} min | Tags: ${(r.tags || []).join(', ')} | Favorite: ${r.is_favorite ? 'YES' : 'no'} | Made ${r.times_made || 0} times`).join('\n')}

INSTRUCTIONS:
1. Assign one recipe to each cooking day
2. Prioritize variety — don't repeat the same cuisine back to back
3. Prioritize favorites and highly-rated recipes
4. Respect weeknight time limits (${prefs?.max_weeknight_mins || 45} min max on weekdays)
5. Balance proteins across the week
6. If a recipe has been made many times recently, give newer recipes a chance too
7. Respect ALL dietary restrictions — never assign a recipe that violates them

Return ONLY a JSON array, no explanation:
[
  { "date": "YYYY-MM-DD", "recipe_id": "the-recipe-id", "is_skipped": false, "skip_reason": null },
  { "date": "YYYY-MM-DD", "recipe_id": null, "is_skipped": true, "skip_reason": "blackout day" }
]

Include ALL 7 days in the array. Skipped days get recipe_id: null and is_skipped: true.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.text?.trim()
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const plan = JSON.parse(cleaned)

    // Enrich plan with full recipe details
    const recipeMap = {}
    allRecipes.forEach(r => { recipeMap[r.id] = r })

    const enriched = plan.map(slot => ({
      ...slot,
      recipe: slot.recipe_id ? (recipeMap[slot.recipe_id] || null) : null,
      dayName: weekDates.find(d => d.date === slot.date)?.dayName || '',
    }))

    return Response.json({ plan: enriched, weekStartDate })

  } catch (err) {
    console.error('Plan generate error:', err)
    return Response.json({ error: err.message || 'Failed to generate plan' }, { status: 500 })
  }
}
