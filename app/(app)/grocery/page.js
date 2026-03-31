'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

let _client = null
const getClient = () => {
  if (_client) return _client
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return _client
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300}
  .gr-root{min-height:100vh;background:#1A1612;padding:0 0 6rem}
  .gr-hd{padding:1.75rem 2rem 1.25rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem}
  .gr-hd h1{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#F8F3EC}
  .gr-hd h1 em{font-style:italic;color:#B8874A}
  .gr-hd-sub{font-size:.85rem;color:rgba(248,243,236,.45);margin-top:.25rem}
  .gr-week-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:2rem;
    padding:.45rem 1rem;font-size:.8rem;color:rgba(248,243,236,.45);cursor:pointer;
    font-family:'Outfit',sans-serif;transition:all .2s;white-space:nowrap}
  .gr-week-btn:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .gr-progress{padding:0 2rem 1.25rem}
  .gr-progress-bar{height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}
  .gr-progress-fill{height:100%;background:linear-gradient(to right,#B8874A,#D4A46A);transition:width .4s ease;border-radius:2px}
  .gr-progress-label{font-size:.75rem;color:rgba(248,243,236,.3);margin-top:.5rem}
  .gr-content{padding:0 2rem}
  .gr-section{margin-bottom:2rem}
  .gr-section-hd{display:flex;align-items:center;gap:.75rem;margin-bottom:.85rem;padding-bottom:.6rem;
    border-bottom:1px solid rgba(255,255,255,.06)}
  .gr-section-title{font-size:.7rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;
    color:rgba(248,243,236,.35);flex:1}
  .gr-section-count{font-size:.72rem;color:rgba(248,243,236,.25)}
  .gr-items{display:flex;flex-direction:column;gap:.35rem}
  .gr-item{display:flex;align-items:center;gap:.875rem;padding:.7rem .85rem;
    border-radius:.75rem;transition:all .2s;cursor:pointer;border:1px solid transparent}
  .gr-item:hover{background:rgba(255,255,255,.04)}
  .gr-item.checked{opacity:.45}
  .gr-check{width:1.25rem;height:1.25rem;border-radius:.35rem;border:1.5px solid rgba(255,255,255,.2);
    flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;background:none}
  .gr-item.checked .gr-check{background:#B8874A;border-color:#B8874A}
  .gr-check-mark{color:#1A1612;font-size:.75rem;font-weight:700}
  .gr-item-name{flex:1;font-size:.9rem;color:rgba(248,243,236,.8);transition:all .2s}
  .gr-item.checked .gr-item-name{text-decoration:line-through;color:rgba(248,243,236,.3)}
  .gr-item-amt{font-size:.78rem;color:rgba(248,243,236,.35);text-align:right;white-space:nowrap}
  .gr-item-recipe{font-size:.7rem;color:rgba(248,243,236,.2);margin-top:.1rem}
  .staples-section{background:rgba(107,126,103,.06);border:1px solid rgba(107,126,103,.15);
    border-radius:1.25rem;padding:1.25rem 1.5rem;margin-bottom:2rem}
  .staples-hd{display:flex;align-items:center;gap:.75rem;margin-bottom:.85rem}
  .staples-title{font-size:.7rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;
    color:rgba(143,168,137,.7);flex:1}
  .staples-sub{font-size:.78rem;color:rgba(143,168,137,.5);margin-bottom:.85rem;line-height:1.6}
  .staples-items{display:flex;flex-direction:column;gap:.3rem}
  .staple-item{display:flex;align-items:center;gap:.75rem;padding:.5rem .6rem;
    border-radius:.6rem;cursor:pointer;transition:all .2s}
  .staple-item:hover{background:rgba(107,126,103,.1)}
  .staple-item.checked{opacity:.4}
  .staple-check{width:1.1rem;height:1.1rem;border-radius:.3rem;border:1.5px solid rgba(143,168,137,.3);
    flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .staple-item.checked .staple-check{background:rgba(107,126,103,.4);border-color:rgba(107,126,103,.4)}
  .staple-name{font-size:.85rem;color:rgba(248,243,236,.55)}
  .staple-item.checked .staple-name{text-decoration:line-through;color:rgba(248,243,236,.25)}
  .empty-state{text-align:center;padding:4rem 2rem}
  .empty-ico{font-size:3rem;display:block;margin-bottom:1rem;opacity:.5}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;margin-bottom:.6rem}
  .empty-sub{font-size:.88rem;color:rgba(248,243,236,.35);line-height:1.8;max-width:340px;margin:0 auto 1.5rem}
  .empty-btn{background:#B8874A;color:#1A1612;border:none;padding:.75rem 1.75rem;border-radius:2rem;
    font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s}
  .empty-btn:hover{background:#D4A46A}
  .clear-btn{background:none;border:1px solid rgba(255,255,255,.1);color:rgba(248,243,236,.35);
    padding:.4rem .9rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.75rem;
    cursor:pointer;transition:all .2s}
  .clear-btn:hover{border-color:rgba(248,243,236,.25);color:rgba(248,243,236,.6)}
  @media(max-width:600px){
    .gr-hd,.gr-progress,.gr-content{padding-left:1.25rem;padding-right:1.25rem}
  }
`

// Merge ingredients from multiple recipes, combining duplicate items
function buildGroceryList(meals, staples) {
  const itemMap = {}
  const staplesSet = new Set(staples.map(s => s.toLowerCase().trim()))

  meals.forEach(meal => {
    if (!meal.recipe?.ingredients) return
    meal.recipe.ingredients.forEach(ing => {
      if (!ing.name) return
      const key = ing.name.toLowerCase().trim()
      const isStaple = staplesSet.has(key) ||
        [...staplesSet].some(s => key.includes(s) || s.includes(key))

      if (itemMap[key]) {
        // Combine amounts if same unit
        if (ing.unit && itemMap[key].unit === ing.unit && ing.amount) {
          itemMap[key].amount = (itemMap[key].amount || 0) + ing.amount
        }
        itemMap[key].recipes.push(meal.recipe.title)
      } else {
        itemMap[key] = {
          name: ing.name,
          amount: ing.amount || null,
          unit: ing.unit || null,
          notes: ing.notes || null,
          recipes: [meal.recipe.title],
          isStaple,
          checked: false,
        }
      }
    })
  })

  const items = Object.values(itemMap)
  const toBuy = items.filter(i => !i.isStaple).sort((a,b) => a.name.localeCompare(b.name))
  const youHave = items.filter(i => i.isStaple).sort((a,b) => a.name.localeCompare(b.name))

  return { toBuy, youHave }
}

function formatAmt(item) {
  if (!item.amount && !item.unit) return ''
  const amt = item.amount ? (Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(1)) : ''
  return [amt, item.unit].filter(Boolean).join(' ')
}

export default function GroceryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [groceryItems, setGroceryItems] = useState([])
  const [stapleItems, setStapleItems] = useState([])
  const [checked, setChecked] = useState({})
  const [checkedStaples, setCheckedStaples] = useState({})
  const [weekLabel, setWeekLabel] = useState('')
  const [mealCount, setMealCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasPlan, setHasPlan] = useState(false)

  useEffect(() => {
    setMounted(true)
    getClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    loadGroceries()
  }, [userId])

  const loadGroceries = useCallback(async () => {
    setLoading(true)
    const sb = getClient()

    // Get this week's confirmed plan
    const weekStart = (() => {
      const d = new Date()
      const day = d.getDay()
      d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
      d.setHours(0,0,0,0)
      return d.toISOString().split('T')[0]
    })()

    const { data: plan } = await sb
      .from('weekly_plans')
      .select(`id, week_start_date, status,
        planned_meals (
          meal_date, is_skipped,
          recipes ( id, title, ingredients )
        )`)
      .eq('profile_id', userId)
      .eq('week_start_date', weekStart)
      .maybeSingle()

    if (!plan) {
      setHasPlan(false)
      setLoading(false)
      return
    }

    setHasPlan(true)

    // Week label
    const ws = new Date(weekStart + 'T12:00:00')
    const we = new Date(ws)
    we.setDate(we.getDate() + 6)
    const o = { month:'short', day:'numeric' }
    setWeekLabel(`${ws.toLocaleDateString('en-US',o)} – ${we.toLocaleDateString('en-US',o)}`)

    // Get user staples
    const { data: prefs } = await sb
      .from('user_preferences')
      .select('pantry_staples, fridge_staples')
      .eq('profile_id', userId)
      .maybeSingle()

    const allStaples = [
      ...(prefs?.pantry_staples || []),
      ...(prefs?.fridge_staples || []),
    ]

    // Build grocery list from meals
    const meals = (plan.planned_meals || []).filter(m => !m.is_skipped && m.recipes)
    setMealCount(meals.length)

    const { toBuy, youHave } = buildGroceryList(meals, allStaples)
    setGroceryItems(toBuy)
    setStapleItems(youHave)
    setLoading(false)
  }, [userId])

  const toggleItem = (name) => {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const toggleStaple = (name) => {
    setCheckedStaples(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const clearChecked = () => setChecked({})

  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalCount = groceryItems.length
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  if (!mounted) return null

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="gr-root">
      <style>{css}</style>

      <div className="gr-hd">
        <div>
          <h1>Grocery <em>List</em></h1>
          {hasPlan && <div className="gr-hd-sub">{weekLabel} · {mealCount} meals · {totalCount} items to buy</div>}
        </div>
        {hasPlan && checkedCount > 0 && (
          <button className="clear-btn" onClick={clearChecked}>Clear checked</button>
        )}
      </div>

      {!hasPlan ? (
        <div className="empty-state">
          <span className="empty-ico">🛒</span>
          <div className="empty-title">No grocery list yet</div>
          <div className="empty-sub">Confirm your weekly meal plan first and your grocery list will build automatically.</div>
          <button className="empty-btn" onClick={() => router.push('/plan')}>Go to Weekly Plan →</button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="gr-progress">
              <div className="gr-progress-bar">
                <div className="gr-progress-fill" style={{width:`${pct}%`}} />
              </div>
              <div className="gr-progress-label">
                {checkedCount === totalCount && totalCount > 0
                  ? '✓ All done! Ready to shop.'
                  : `${checkedCount} of ${totalCount} checked off`}
              </div>
            </div>
          )}

          <div className="gr-content">
            {/* Items to buy */}
            {groceryItems.length > 0 && (
              <div className="gr-section">
                <div className="gr-section-hd">
                  <div className="gr-section-title">🛒 Need to buy</div>
                  <div className="gr-section-count">{groceryItems.filter(i => !checked[i.name]).length} remaining</div>
                </div>
                <div className="gr-items">
                  {groceryItems.map(item => (
                    <div key={item.name}
                      className={`gr-item${checked[item.name] ? ' checked' : ''}`}
                      onClick={() => toggleItem(item.name)}>
                      <div className="gr-check">
                        {checked[item.name] && <span className="gr-check-mark">✓</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="gr-item-name">{item.name}{item.notes ? `, ${item.notes}` : ''}</div>
                        <div className="gr-item-recipe">{item.recipes.slice(0,2).join(', ')}{item.recipes.length > 2 ? ` +${item.recipes.length-2}` : ''}</div>
                      </div>
                      {formatAmt(item) && (
                        <div className="gr-item-amt">{formatAmt(item)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staples — you probably have this */}
            {stapleItems.length > 0 && (
              <div className="staples-section">
                <div className="staples-hd">
                  <div className="staples-title">🫙 You probably have this</div>
                </div>
                <div className="staples-sub">
                  Based on your pantry and fridge staples. Tap to uncheck anything you&apos;re running low on.
                </div>
                <div className="staples-items">
                  {stapleItems.map(item => (
                    <div key={item.name}
                      className={`staple-item${checkedStaples[item.name] ? ' checked' : ''}`}
                      onClick={() => toggleStaple(item.name)}>
                      <div className="staple-check">
                        {checkedStaples[item.name] && <span style={{color:'rgba(248,243,236,.6)',fontSize:'.7rem',fontWeight:700}}>✓</span>}
                      </div>
                      <div className="staple-name">{item.name}{item.notes ? `, ${item.notes}` : ''}</div>
                      {formatAmt(item) && (
                        <div style={{fontSize:'.72rem',color:'rgba(143,168,137,.4)'}}>{formatAmt(item)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty — all checked */}
            {groceryItems.length === 0 && stapleItems.length === 0 && (
              <div style={{textAlign:'center',padding:'3rem 0'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>✓</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.4rem',color:'#F8F3EC',marginBottom:'.5rem'}}>Nothing to buy</div>
                <div style={{fontSize:'.88rem',color:'rgba(248,243,236,.35)'}}>Your pantry covers everything this week.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
