'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300;min-height:100vh}

  .vault-root{min-height:100vh;background:#1A1612}

  /* Header */
  .vault-hd{padding:1.75rem 2rem 0;display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
  .vault-hd-left h1{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#F8F3EC}
  .vault-hd-left h1 em{font-style:italic;color:#B8874A}
  .vault-hd-sub{font-size:.85rem;color:rgba(248,243,236,.35);margin-top:.25rem}
  .add-recipe-btn{display:flex;align-items:center;gap:.5rem;background:#B8874A;color:#1A1612;
    border:none;padding:.75rem 1.5rem;border-radius:2rem;font-family:'Outfit',sans-serif;
    font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;
    white-space:nowrap}
  .add-recipe-btn:hover{background:#D4A46A;transform:translateY(-1px)}

  /* Search + filters */
  .vault-controls{padding:1.25rem 2rem;display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
  .search-wrap{flex:1;min-width:200px;position:relative}
  .search-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);
    font-size:.9rem;pointer-events:none}
  .search-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:2rem;padding:10px 16px 10px 38px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:.88rem;outline:none;transition:border-color .2s}
  .search-input:focus{border-color:#B8874A}
  .search-input::placeholder{color:rgba(248,243,236,.2)}
  .filter-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:2rem;padding:.5rem 1rem;font-size:.78rem;color:rgba(248,243,236,.5);
    cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif;white-space:nowrap}
  .filter-btn:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .filter-btn.active{background:rgba(184,135,74,.12);border-color:rgba(184,135,74,.4);color:#D4A46A}

  /* Recipe grid */
  .vault-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
    gap:1rem;padding:0 2rem 4rem}

  /* Recipe card */
  .recipe-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
    border-radius:1.25rem;overflow:hidden;cursor:pointer;transition:all .25s}
  .recipe-card:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2);
    transform:translateY(-3px)}
  .recipe-card-body{padding:1.5rem}
  .recipe-card-source{font-size:.65rem;color:rgba(248,243,236,.25);
    letter-spacing:.08em;text-transform:uppercase;margin-bottom:.6rem;
    display:flex;align-items:center;gap:.4rem}
  .recipe-card-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;
    font-weight:400;color:#F8F3EC;line-height:1.25;margin-bottom:.5rem}
  .recipe-card-meta{display:flex;gap:.75rem;font-size:.75rem;color:rgba(248,243,236,.3);margin-bottom:.85rem}
  .recipe-card-tags{display:flex;flex-wrap:wrap;gap:.3rem}
  .rc-tag{font-size:.65rem;padding:.2rem .55rem;border-radius:2rem;
    border:1px solid rgba(255,255,255,.07);color:rgba(248,243,236,.3)}
  .rc-tag.prim{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.25);color:#B8874A}
  .recipe-card-footer{padding:.75rem 1.5rem;border-top:1px solid rgba(255,255,255,.05);
    display:flex;align-items:center;justify-content:space-between}
  .heart-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;
    transition:transform .2s;padding:.25rem;line-height:1}
  .heart-btn:hover{transform:scale(1.2)}

  /* Empty state */
  .empty{text-align:center;padding:6rem 2rem}
  .empty-ico{font-size:4rem;margin-bottom:1.5rem;display:block;opacity:.5}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;
    color:#F8F3EC;margin-bottom:.75rem}
  .empty-sub{font-size:.92rem;color:rgba(248,243,236,.35);line-height:1.8;
    max-width:380px;margin:0 auto 2rem}
  .empty-btn{display:inline-flex;align-items:center;gap:.5rem;background:#B8874A;
    color:#1A1612;border:none;padding:.85rem 2rem;border-radius:2rem;
    font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:600;
    cursor:pointer;transition:all .2s}
  .empty-btn:hover{background:#D4A46A;transform:translateY(-1px)}

  /* Loading skeleton */
  .skel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);
    border-radius:1.25rem;height:200px;animation:shimmer 1.5s ease infinite}
  @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.7}}

  @media(max-width:600px){
    .vault-hd,.vault-controls{padding-left:1.25rem;padding-right:1.25rem}
    .vault-grid{grid-template-columns:1fr;padding:0 1.25rem 4rem}
  }
`

const SOURCE_ICONS = {
  url: '🔗', screenshot: '📸', photo: '📷', manual: '✍️', system: '📚', spoonacular: '📚'
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: '❤️ Favorites' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'beef', label: 'Beef' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'under-30-min', label: 'Under 30 min' },
  { id: 'kid-friendly', label: 'Kid-friendly' },
]

export default function VaultPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [userId, setUserId] = useState(null)
  const [recipeCount, setRecipeCount] = useState(0)

  useEffect(() => {
    const sb = getClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      loadRecipes(session.user.id)
    })
  }, [router])

  const loadRecipes = useCallback(async (uid) => {
    setLoading(true)
    const sb = getClient()
    const { data, error } = await sb
      .from('recipes')
      .select('id,title,description,source_type,cuisine,meal_type,prep_time_mins,cook_time_mins,total_time_mins,base_servings,tags,dietary_flags,is_favorite,created_at')
      .eq('profile_id', uid)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRecipes(data)
      setRecipeCount(data.length)
    }
    setLoading(false)
  }, [])

  const toggleFavorite = async (e, recipeId, current) => {
    e.stopPropagation()
    const sb = getClient()
    await sb.from('recipes').update({ is_favorite: !current }).eq('id', recipeId)
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, is_favorite: !current } : r))
  }

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.title?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q)) ||
      r.dietary_flags?.some(f => f.toLowerCase().includes(q))

    const matchFilter = filter === 'all' ? true
      : filter === 'favorites' ? r.is_favorite
      : r.tags?.includes(filter) || r.dietary_flags?.includes(filter)

    return matchSearch && matchFilter
  })

  return (
    <div className="vault-root">
      <style>{css}</style>

      {/* Header */}
      <div className="vault-hd">
        <div className="vault-hd-left">
          <h1>Recipe <em>Vault</em></h1>
          <div className="vault-hd-sub">
            {loading ? 'Loading...' : `${recipeCount} recipe${recipeCount !== 1 ? 's' : ''} saved`}
          </div>
        </div>
        <button className="add-recipe-btn" onClick={() => router.push('/vault/add')}>
          + Add recipe
        </button>
      </div>

      {/* Search + filters */}
      {!loading && recipeCount > 0 && (
        <div className="vault-controls">
          <div className="search-wrap">
            <span className="search-ico">🔍</span>
            <input className="search-input" type="text"
              placeholder="Search recipes, cuisines, tags..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {FILTERS.map(f => (
            <button key={f.id}
              className={`filter-btn${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: loading || recipeCount === 0 ? 0 : '1rem 0 0' }}>
        {/* Loading skeletons */}
        {loading && (
          <div className="vault-grid" style={{ paddingTop: '1.5rem' }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skel" />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && recipeCount === 0 && (
          <div className="empty">
            <span className="empty-ico">📖</span>
            <div className="empty-title">Your vault is empty</div>
            <div className="empty-sub">
              Add your first recipe — paste a URL from your favorite food blog, upload a screenshot from Instagram, or type one in manually.
            </div>
            <button className="empty-btn" onClick={() => router.push('/vault/add')}>
              + Add your first recipe
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && recipeCount > 0 && filtered.length === 0 && (
          <div className="empty">
            <span className="empty-ico">🔍</span>
            <div className="empty-title">No recipes found</div>
            <div className="empty-sub">Try a different search or filter.</div>
            <button className="empty-btn" onClick={() => { setSearch(''); setFilter('all') }}>
              Clear filters
            </button>
          </div>
        )}

        {/* Recipe grid */}
        {!loading && filtered.length > 0 && (
          <div className="vault-grid">
            {filtered.map(recipe => (
              <div key={recipe.id} className="recipe-card"
                onClick={() => router.push(`/vault/${recipe.id}`)}>
                <div className="recipe-card-body">
                  <div className="recipe-card-source">
                    {SOURCE_ICONS[recipe.source_type] || '📄'}
                    <span>{recipe.source_type === 'url' ? 'Web import'
                      : recipe.source_type === 'screenshot' ? 'Screenshot'
                      : recipe.source_type === 'manual' ? 'Manual entry'
                      : 'Recipe database'}</span>
                  </div>
                  <div className="recipe-card-title">{recipe.title}</div>
                  <div className="recipe-card-meta">
                    {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                    {recipe.total_time_mins && <span>⏱ {recipe.total_time_mins} min</span>}
                    {recipe.base_servings && <span>👨‍👩‍👧‍👦 {recipe.base_servings}</span>}
                  </div>
                  <div className="recipe-card-tags">
                    {recipe.dietary_flags?.slice(0,2).map(f => (
                      <span key={f} className="rc-tag prim">{f}</span>
                    ))}
                    {recipe.tags?.slice(0,3).map(t => (
                      <span key={t} className="rc-tag">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="recipe-card-footer">
                  <span style={{fontSize:'.75rem',color:'rgba(248,243,236,.25)'}}>
                    {new Date(recipe.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </span>
                  <button className="heart-btn"
                    onClick={e => toggleFavorite(e, recipe.id, recipe.is_favorite)}
                    title={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
                    {recipe.is_favorite ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
