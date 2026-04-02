'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

let _client = null
const getClient = () => {
  if (_client) return _client
  _client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return _client
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300;min-height:100vh}
  .vault-root{min-height:100vh;background:#1A1612}
  .vault-hd{padding:1.75rem 2rem 0;display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
  .vault-hd-left h1{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#F8F3EC}
  .vault-hd-left h1 em{font-style:italic;color:#B8874A}
  .vault-hd-sub{font-size:.97rem;color:rgba(248,243,236,.65);margin-top:.25rem}
  .add-recipe-btn{display:flex;align-items:center;gap:.5rem;background:#B8874A;color:#1A1612;border:none;padding:.75rem 1.5rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:1.02rem;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;white-space:nowrap}
  .add-recipe-btn:hover{background:#D4A46A;transform:translateY(-1px)}
  .vault-tabs{display:flex;gap:.25rem;padding:1.25rem 2rem 0;border-bottom:1px solid rgba(255,255,255,.07)}
  .vault-tab{padding:.65rem 1.5rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:400;cursor:pointer;border:none;background:none;color:rgba(248,243,236,.5);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
  .vault-tab.active{color:#B8874A;border-bottom-color:#B8874A}
  .vault-tab:hover:not(.active){color:rgba(248,243,236,.8)}
  .vault-controls{padding:1.25rem 2rem;display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
  .search-wrap{flex:1;min-width:200px;position:relative}
  .search-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:1.02rem;pointer-events:none}
  .search-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:2rem;padding:10px 16px 10px 38px;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:1rem;outline:none;transition:border-color .2s}
  .search-input:focus{border-color:#B8874A}
  .search-input::placeholder{color:rgba(248,243,236,.50)}
  .filter-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:2rem;padding:.5rem 1rem;font-size:1.02rem;color:rgba(248,243,236,.82);cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif;white-space:nowrap}
  .filter-btn:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .filter-btn.active{background:rgba(184,135,74,.12);border-color:rgba(184,135,74,.4);color:#D4A46A}
  .vault-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;padding:0 2rem 4rem}
  .recipe-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.25rem;overflow:hidden;cursor:pointer;transition:all .25s}
  .recipe-card:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2);transform:translateY(-3px)}
  .recipe-card-body{padding:1.5rem}
  .recipe-card-source{font-size:1.02rem;color:rgba(248,243,236,.85);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.6rem;display:flex;align-items:center;gap:.4rem}
  .recipe-card-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:400;color:#F8F3EC;line-height:1.25;margin-bottom:.5rem}
  .recipe-card-meta{display:flex;gap:.75rem;font-size:.87rem;color:rgba(248,243,236,.60);margin-bottom:.85rem}
  .recipe-card-tags{display:flex;flex-wrap:wrap;gap:.3rem}
  .rc-tag{font-size:1.02rem;padding:.2rem .55rem;border-radius:2rem;border:1px solid rgba(255,255,255,.07);color:rgba(248,243,236,.60)}
  .rc-tag.prim{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.25);color:#B8874A}
  .recipe-card-footer{padding:.75rem 1.5rem;border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between}
  .heart-btn{background:none;border:none;cursor:pointer;font-size:1.1rem;transition:transform .2s;padding:.25rem;line-height:1}
  .heart-btn:hover{transform:scale(1.2)}
  .discover-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.25rem;overflow:hidden;transition:all .25s}
  .discover-card:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2);transform:translateY(-2px)}
  .discover-card-body{padding:1.25rem}
  .discover-card-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#F8F3EC;line-height:1.2;margin-bottom:.4rem}
  .discover-card-meta{display:flex;gap:.75rem;font-size:.87rem;color:rgba(248,243,236,.55);margin-bottom:.75rem}
  .discover-card-desc{font-size:.88rem;color:rgba(248,243,236,.55);line-height:1.6;margin-bottom:.85rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .discover-save-btn{background:#B8874A;color:#1A1612;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .2s}
  .discover-save-btn:hover{background:#D4A46A}
  .discover-save-btn.saved{background:rgba(143,168,137,.2);color:#8FA889;cursor:default}
  .empty{text-align:center;padding:6rem 2rem}
  .empty-ico{font-size:4rem;margin-bottom:1.5rem;display:block;opacity:.5}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;color:#F8F3EC;margin-bottom:.75rem}
  .empty-sub{font-size:.92rem;color:rgba(248,243,236,.65);line-height:1.8;max-width:380px;margin:0 auto 2rem}
  .empty-btn{display:inline-flex;align-items:center;gap:.5rem;background:#B8874A;color:#1A1612;border:none;padding:.85rem 2rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:600;cursor:pointer;transition:all .2s}
  .empty-btn:hover{background:#D4A46A;transform:translateY(-1px)}
  .skel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:1.25rem;height:200px;animation:shimmer 1.5s ease infinite}
  @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.7}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){
    .vault-hd,.vault-controls,.vault-tabs{padding-left:1.25rem;padding-right:1.25rem}
    .vault-grid{grid-template-columns:1fr;padding:0 1.25rem 4rem}
  }
`

const SOURCE_ICONS = { url: '🔗', screenshot: '📸', photo: '📷', manual: '✍️', system: '📚', dot: '✨' }
const DISCOVER_PAGE_SIZE = 12
const DISCOVER_FILTERS = ['all','quick','gluten-free','vegetarian','vegan','paleo','keto','healthy','chicken','beef','seafood']

export default function VaultPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [userId, setUserId] = useState(null)
  const [recipeCount, setRecipeCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  // Discover tab state
  const [activeTab, setActiveTab] = useState('mine')
  const [discoverRecipes, setDiscoverRecipes] = useState([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverSearch, setDiscoverSearch] = useState('')
  const [discoverFilter, setDiscoverFilter] = useState('all')
  const [savedToVault, setSavedToVault] = useState({})
  const [discoverPage, setDiscoverPage] = useState(0)

  useEffect(() => {
    setMounted(true)
    const sb = getClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      loadRecipes(session.user.id)
    })
  }, [router])

  useEffect(() => {
    if (activeTab === 'discover') {
      setDiscoverPage(0)
      loadDiscover(discoverSearch, discoverFilter, 0)
    }
  }, [activeTab, discoverSearch, discoverFilter])

  const loadRecipes = useCallback(async (uid) => {
    setLoading(true)
    const sb = getClient()
    const { data, error } = await sb
      .from('recipes')
      .select('id,title,description,source_type,cuisine,meal_type,prep_time_mins,cook_time_mins,total_time_mins,base_servings,tags,dietary_flags,is_favorite,created_at')
      .eq('profile_id', uid)
      .order('created_at', { ascending: false })
    if (!error && data) { setRecipes(data); setRecipeCount(data.length) }
    setLoading(false)
  }, [])

  const loadDiscover = async (search, filter, page) => {
    setDiscoverLoading(true)
    const sb = getClient()
    let query = sb
      .from('system_recipes')
      .select('id, title, description, cuisine, total_time_mins, tags, dietary_flags, base_servings')
      .order('times_served', { ascending: true })
      .range(page * DISCOVER_PAGE_SIZE, (page + 1) * DISCOVER_PAGE_SIZE - 1)
    if (search) query = query.or(`title.ilike.%${search}%,cuisine.ilike.%${search}%`)
    if (filter && filter !== 'all') query = query.contains('tags', [filter])
    const { data } = await query
    if (page === 0) setDiscoverRecipes(data || [])
    else setDiscoverRecipes(prev => [...prev, ...(data || [])])
    setDiscoverLoading(false)
  }

  const saveToVault = async (recipe) => {
    if (savedToVault[recipe.id]) return

    // Get userId fresh from session in case state isn't set yet
    const sb = getClient()
    let uid = userId
    if (!uid) {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      uid = session.user.id
      setUserId(uid)
    }

    setSavedToVault(prev => ({ ...prev, [recipe.id]: 'saving' }))
    const { data: full } = await sb.from('system_recipes').select('*').eq('id', recipe.id).single()
    // total_time_mins is a generated column (prep + cook) — don't insert it directly
    const cookMins = full?.cook_time_mins || recipe.total_time_mins || null
    const { error } = await sb.from('recipes').insert({
      profile_id: uid,
      title: recipe.title,
      description: recipe.description || null,
      cuisine: recipe.cuisine || null,
      meal_type: 'dinner',
      prep_time_mins: full?.prep_time_mins || null,
      cook_time_mins: cookMins,
      tags: recipe.tags || [],
      dietary_flags: recipe.dietary_flags || [],
      source_type: 'system',
      ai_processed: true,
      base_servings: recipe.base_servings || 4,
      ingredients: full?.ingredients || [],
      instructions: full?.instructions || [],
    })
    if (!error) {
      setSavedToVault(prev => ({ ...prev, [recipe.id]: 'saved' }))
      setRecipeCount(c => c + 1)
    } else {
      console.error('saveToVault error:', JSON.stringify(error))
      console.error('uid:', uid, 'recipe.id:', recipe.id)
      setSavedToVault(prev => ({ ...prev, [recipe.id]: null }))
    }
  }

  const toggleFavorite = async (e, recipeId, current) => {
    e.stopPropagation()
    const sb = getClient()
    await sb.from('recipes').update({ is_favorite: !current }).eq('id', recipeId)
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, is_favorite: !current } : r))
  }

  const dynamicFilters = (() => {
    const tagCount = {}
    recipes.forEach(r => {
      ;[...(r.tags || []), ...(r.dietary_flags || [])].forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 })
    })
    return Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([tag]) => ({ id: tag, label: tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ') }))
  })()

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q)) || r.dietary_flags?.some(f => f.toLowerCase().includes(q))
    const matchFilter = filter === 'all' ? true : filter === 'favorites' ? r.is_favorite
      : r.tags?.includes(filter) || r.dietary_flags?.includes(filter)
    return matchSearch && matchFilter
  })

  if (!mounted) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

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
        <button className="add-recipe-btn" onClick={() => router.push('/vault/add')}>+ Add recipe</button>
      </div>

      {/* Tabs */}
      <div className="vault-tabs">
        <button className={'vault-tab' + (activeTab === 'mine' ? ' active' : '')} onClick={() => setActiveTab('mine')}>
          My Recipes {recipeCount > 0 ? `(${recipeCount})` : ''}
        </button>
        <button className={'vault-tab' + (activeTab === 'discover' ? ' active' : '')} onClick={() => setActiveTab('discover')}>
          ✨ Discover
        </button>
      </div>

      {/* Search + Filters */}
      <div className="vault-controls">
        <div className="search-wrap">
          <span className="search-ico">🔍</span>
          <input className="search-input" type="text"
            placeholder={activeTab === 'mine' ? 'Search recipes, cuisines, tags...' : "Search Dot's recipes..."}
            value={activeTab === 'mine' ? search : discoverSearch}
            onChange={e => activeTab === 'mine' ? setSearch(e.target.value) : setDiscoverSearch(e.target.value)}
          />
        </div>
        {activeTab === 'mine' ? (
          <>
            <button className={'filter-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</button>
            <button className={'filter-btn' + (filter === 'favorites' ? ' active' : '')} onClick={() => setFilter('favorites')}>❤️ Favorites</button>
            {dynamicFilters.map(f => (
              <button key={f.id} className={'filter-btn' + (filter === f.id ? ' active' : '')} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </>
        ) : (
          DISCOVER_FILTERS.map(f => (
            <button key={f} className={'filter-btn' + (discoverFilter === f ? ' active' : '')} onClick={() => setDiscoverFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace(/-/g,' ')}
            </button>
          ))
        )}
      </div>

      {/* MY RECIPES TAB */}
      {activeTab === 'mine' && (
        <div style={{padding:'1rem 0 0'}}>
          {loading && (
            <div className="vault-grid" style={{paddingTop:'1.5rem'}}>
              {[...Array(6)].map((_, i) => <div key={i} className="skel"/>)}
            </div>
          )}
          {!loading && recipeCount === 0 && (
            <div className="empty">
              <span className="empty-ico">📖</span>
              <div className="empty-title">Your vault is empty</div>
              <div className="empty-sub">Add your first recipe — paste a URL, upload a screenshot, or type one in manually.</div>
              <button className="empty-btn" onClick={() => router.push('/vault/add')}>+ Add your first recipe</button>
            </div>
          )}
          {!loading && recipeCount > 0 && filtered.length === 0 && (
            <div className="empty">
              <span className="empty-ico">🔍</span>
              <div className="empty-title">No recipes found</div>
              <div className="empty-sub">Try a different search or filter.</div>
              <button className="empty-btn" onClick={() => { setSearch(''); setFilter('all') }}>Clear filters</button>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="vault-grid">
              {filtered.map(recipe => (
                <div key={recipe.id} className="recipe-card" onClick={() => router.push(`/vault/${recipe.id}`)}>
                  <div className="recipe-card-body">
                    <div className="recipe-card-source">
                      {SOURCE_ICONS[recipe.source_type] || '📄'}
                      <span>{recipe.source_type === 'url' ? 'Web import' : recipe.source_type === 'screenshot' ? 'Screenshot' : recipe.source_type === 'manual' ? 'Manual entry' : recipe.source_type === 'dot' ? 'Saved from Dot' : 'Recipe database'}</span>
                    </div>
                    <div className="recipe-card-title">{recipe.title}</div>
                    <div className="recipe-card-meta">
                      {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                      {recipe.total_time_mins && <span>⏱ {recipe.total_time_mins} min</span>}
                      {recipe.base_servings && <span>👨‍👩‍👧‍👦 {recipe.base_servings}</span>}
                    </div>
                    <div className="recipe-card-tags">
                      {[...(recipe.tags || []), ...(recipe.dietary_flags || [])].slice(0, 4).map((tag, i) => (
                        <span key={i} className={`rc-tag${i < 2 ? ' prim' : ''}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="recipe-card-footer">
                    <span style={{fontSize:'.82rem',color:'rgba(248,243,236,.45)'}}>
                      {recipe.total_time_mins ? recipe.total_time_mins + ' min' : recipe.meal_type || ''}
                    </span>
                    <button className="heart-btn" onClick={e => toggleFavorite(e, recipe.id, recipe.is_favorite)}>
                      {recipe.is_favorite ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <div style={{padding:'1rem 2rem 4rem'}}>
          {discoverLoading && discoverPage === 0 ? (
            <div className="vault-grid" style={{padding:0,marginTop:'1rem'}}>
              {[...Array(6)].map((_, i) => <div key={i} className="skel"/>)}
            </div>
          ) : discoverRecipes.length === 0 ? (
            <div className="empty">
              <span className="empty-ico">🔍</span>
              <div className="empty-title">No recipes found</div>
              <div className="empty-sub">Try a different search or filter.</div>
            </div>
          ) : (
            <>
              <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.4)',margin:'1rem 0 1.25rem'}}>
                Dot&apos;s recipe collection — save any to your vault
              </div>
              <div className="vault-grid" style={{padding:0}}>
                {discoverRecipes.map(recipe => {
                  const saveState = savedToVault[recipe.id]
                  return (
                    <div key={recipe.id} className="discover-card">
                      <div className="discover-card-body">
                        <div className="discover-card-title">{recipe.title}</div>
                        <div className="discover-card-meta">
                          {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                          {recipe.total_time_mins && <span>⏱ {recipe.total_time_mins} min</span>}
                          {recipe.base_servings && <span>👥 {recipe.base_servings}</span>}
                        </div>
                        {recipe.description && <div className="discover-card-desc">{recipe.description}</div>}
                        {recipe.tags && recipe.tags.length > 0 && (
                          <div style={{display:'flex',flexWrap:'wrap',gap:'.3rem',marginBottom:'.75rem'}}>
                            {recipe.tags.slice(0,4).map(t => <span key={t} className="rc-tag" style={{fontSize:'.78rem'}}>{t}</span>)}
                          </div>
                        )}
                        <button
                          className={'discover-save-btn' + (saveState === 'saved' ? ' saved' : '')}
                          onClick={() => saveToVault(recipe)}
                          disabled={!!saveState}>
                          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '✓ Saved to vault' : '+ Save to my vault'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {discoverRecipes.length >= DISCOVER_PAGE_SIZE && (
                <div style={{textAlign:'center',marginTop:'2rem'}}>
                  <button
                    onClick={() => { const next = discoverPage + 1; setDiscoverPage(next); loadDiscover(discoverSearch, discoverFilter, next) }}
                    disabled={discoverLoading}
                    style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'2rem',padding:'.7rem 2rem',color:'rgba(248,243,236,.7)',fontFamily:"'Outfit',sans-serif",fontSize:'1rem',cursor:'pointer'}}>
                    {discoverLoading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
