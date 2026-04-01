import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    const { data: recipes, error: recipeErr } = await sb
      .from('recipes')
      .select('id, title, is_published, profile_id')
      .eq('profile_id', userId)

    const { data: allRecipes, error: allErr } = await sb
      .from('recipes')
      .select('id, title, profile_id')
      .limit(5)

    return Response.json({
      usingServiceRole,
      userId,
      recipesForUser: recipes?.length || 0,
      recipeTitles: recipes?.map(r => r.title) || [],
      recipeError: recipeErr?.message || null,
      totalRecipesInTable: allRecipes?.length || 0,
      allRecipeError: allErr?.message || null,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
