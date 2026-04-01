'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

let _client = null
const getClient = () => {
  if (_client) return _client
  _client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return _client
}

function getLocalDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0,0,0,0)
  return d
}

function formatWeekRange(weekStartStr) {
  const start = new Date(weekStartStr + 'T12:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months[start.getMonth()] + ' ' + start.getDate() + ' - ' + months[end.getMonth()] + ' ' + end.getDate()
}

function buildGroceryList(meals, staples) {
  const allStaples = (staples || []).map(s => s.toLowerCase().trim())
  const ingredientMap = {}

  meals.forEach(meal => {
    const ingredients = (meal.recipes && meal.recipes.ingredients) || (meal.recipe_snapshot && meal.recipe_snapshot.ingredients) || []
    ingredients.forEach(ing => {
      if (!ing.name) return
      const key = ing.name.toLowerCase().trim()
      if (ingredientMap[key]) {
        if (ingredientMap[key].unit === ing.unit && typeof ingredientMap[key].amount === 'number' && typeof ing.amount === 'number') {
          ingredientMap[key].amount += ing.amount
        }
      } else {
        ingredientMap[key] = Object.assign({}, ing)
      }
    })
  })

  const toBuy = []
  const youHave = []

  Object.values(ingredientMap).forEach(ing => {
    const key = ing.name.toLowerCase().trim()
    const isStaple = allStaples.some(s => key.includes(s) || s.includes(key))
    const item = { name: ing.name, amount: ing.amount, unit: ing.unit, notes: ing.notes }
    if (isStaple) youHave.push(item)
    else toBuy.push(item)
  })

  toBuy.sort((a,b) => a.name.localeCompare(b.name))
  youHave.sort((a,b) => a.name.localeCompare(b.name))
  return { toBuy, youHave }
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;font-weight:300;background:#1A1612;color:#F8F3EC}
  .gr-wrap{max-width:680px;margin:0 auto;padding:0 1.5rem 6rem}
  .gr-hd{padding:2rem 0 1.5rem}
  .gr-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:300;color:#F8F3EC}
  .gr-title span{color:#B8874A;font-style:italic}
  .gr-sub{font-size:.97rem;color:rgba(248,243,236,.6);margin-top:.35rem}
  .week-block{margin-bottom:1.25rem;border:1px solid rgba(255,255,255,.08);border-radius:1.25rem;overflow:hidden}
  .week-hd{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;cursor:pointer;gap:1rem}
  .week-hd:hover{background:rgba(255,255,255,.03)}
  .week-badge{font-size:.7rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:.25rem .7rem;border-radius:2rem;background:rgba(184,135,74,.15);color:#B8874A;white-space:nowrap}
  .week-badge.current{background:rgba(143,168,137,.15);color:#8FA889}
  .week-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#F8F3EC}
  .week-count{font-size:.88rem;color:rgba(248,243,236,.45);margin-top:.1rem}
  .week-body{padding:1rem 1.25rem 1.25rem;border-top:1px solid rgba(255,255,255,.06)}
  .progress-bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin:.75rem 0 .5rem;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,#8FA889,#B8874A);border-radius:2px;transition:width .3s}
  .section-label{font-size:.72rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(248,243,236,.45);margin:1rem 0 .6rem}
  .ing-item{display:flex;align-items:center;gap:.85rem;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer}
  .ing-check{width:1.2rem;height:1.2rem;border-radius:50%;border:1.5px solid rgba(184,135,74,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
  .ing-name{flex:1;font-size:.97rem;color:rgba(248,243,236,.9)}
  .ing-amount{font-size:.88rem;color:#B8874A;text-align:right;flex-shrink:0}
  .staple-item{display:flex;align-items:center;gap:.85rem;padding:.45rem 0}
  .no-plans{text-align:center;padding:4rem 1rem}
  .cta-btn{background:#B8874A;color:#1A1612;border:none;padding:.8rem 2rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;cursor:pointer}
  @keyframes spin{to{transform:rotate(360deg)}}
`

export default function GroceryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weeks, setWeeks] = useState([])
  const [checkedItems, setCheckedItems] = useState({})
  const [expandedWeeks, setExpandedWeeks] = useState({})

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const sb = getClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    })
  }, [mounted, router])

  useEffect(() => {
    if (!userId) return
    loadAllWeeks()
  }, [userId])

  const loadAllWeeks = async () => {
    setLoading(true)
    const sb = getClient()

    const { data: prefs } = await sb
      .from('user_preferences')
      .select('pantry_staples, fridge_staples')
      .eq('profile_id', userId)
      .maybeSingle()

    const allStaples = [...(prefs && prefs.pantry_staples ? prefs.pantry_staples : []), ...(prefs && prefs.fridge_staples ? prefs.fridge_staples : [])]

    const { data: plans } = await sb
      .from('weekly_plans')
      .select('id, week_start_date, status, planned_meals ( meal_date, is_skipped, notes, recipe_snapshot, recipes ( id, title, ingredients ) )')
      .eq('profile_id', userId)
      .eq('status', 'confirmed')
      .order('week_start_date', { ascending: true })
      .limit(4)

    if (!plans || plans.length === 0) {
      setLoading(false)
      return
    }

    const now = new Date()
    const currentWeekStart = getLocalDateStr(getWeekStart(now))

    const weekData = plans.map(plan => {
      const meals = (plan.planned_meals || []).filter(m => !m.is_skipped)
      const { toBuy, youHave } = buildGroceryList(meals, allStaples)
      return {
        planId: plan.id,
        weekStart: plan.week_start_date,
        isCurrent: plan.week_start_date === currentWeekStart,
        mealCount: meals.length,
        toBuy,
        youHave,
      }
    })

    // For any system recipes missing ingredients, fetch from system_recipes table
    const allMeals = plans.flatMap(p => p.planned_meals || [])
    const missingIngSysIds = allMeals
      .filter(m => {
        const snap = m.recipe_snapshot
        return snap && snap.system_recipe_id &&
          (!snap.ingredients || snap.ingredients.length === 0)
      })
      .map(m => m.recipe_snapshot.system_recipe_id)
      .filter((id, idx, arr) => arr.indexOf(id) === idx) // unique

    let sysRecipeMap = {}
    if (missingIngSysIds.length > 0) {
      const { data: sysRecipes } = await sb
        .from('system_recipes')
        .select('id, title, ingredients')
        .in('id', missingIngSysIds)
      if (sysRecipes) {
        sysRecipes.forEach(r => { sysRecipeMap[r.id] = r })
      }
    }

    // Rebuild weekData with enriched ingredients
    const enrichedWeekData = plans.map(plan => {
      const meals = (plan.planned_meals || []).filter(m => !m.is_skipped).map(m => {
        // If snapshot has system_recipe_id but no ingredients, inject from sysRecipeMap
        if (m.recipe_snapshot && m.recipe_snapshot.system_recipe_id && sysRecipeMap[m.recipe_snapshot.system_recipe_id]) {
          const full = sysRecipeMap[m.recipe_snapshot.system_recipe_id]
          return {
            ...m,
            recipe_snapshot: { ...m.recipe_snapshot, ingredients: full.ingredients || [] }
          }
        }
        return m
      })
      const { toBuy, youHave } = buildGroceryList(meals, allStaples)
      const isCurrent = plan.week_start_date === currentWeekStart
      return {
        planId: plan.id,
        weekStart: plan.week_start_date,
        isCurrent,
        mealCount: meals.length,
        toBuy,
        youHave,
      }
    })

    setWeeks(enrichedWeekData)

    const defaultExpand = {}
    const currentIdx = enrichedWeekData.findIndex(w => w.isCurrent)
    if (currentIdx >= 0) defaultExpand[enrichedWeekData[currentIdx].weekStart] = true
    else if (enrichedWeekData.length > 0) defaultExpand[enrichedWeekData[enrichedWeekData.length-1].weekStart] = true
    setExpandedWeeks(defaultExpand)
    setLoading(false)
  }

  const toggleCheck = (weekStart, itemName) => {
    const key = weekStart + '-' + itemName
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getProgress = (week) => {
    const total = week.toBuy.length
    if (!total) return 100
    const checked = week.toBuy.filter(i => checkedItems[week.weekStart + '-' + i.name]).length
    return Math.round((checked / total) * 100)
  }

  const formatAmt = (item) => {
    if (!item.amount && !item.unit) return ''
    const amt = typeof item.amount === 'number' ? (Number.isInteger(item.amount) ? item.amount : +item.amount.toFixed(2)) : item.amount
    return [amt, item.unit].filter(Boolean).join(' ')
  }

  if (!mounted || loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>
      <div className="gr-wrap">
        <div className="gr-hd">
          <div className="gr-title">Grocery <span>List</span></div>
          <div className="gr-sub">
            {weeks.length > 0
              ? weeks.length + ' week' + (weeks.length > 1 ? 's' : '') + ' planned'
              : 'Confirm a weekly plan to see your grocery list'}
          </div>
        </div>

        {weeks.length === 0 ? (
          <div className="no-plans">
            <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🛒</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.5rem',color:'#F8F3EC',marginBottom:'.5rem'}}>No grocery lists yet</div>
            <div style={{fontSize:'.97rem',color:'rgba(248,243,236,.55)',lineHeight:1.7,marginBottom:'2rem',maxWidth:'320px',margin:'0 auto 2rem'}}>
              Confirm your weekly plan and your grocery list will appear here automatically.
            </div>
            <button className="cta-btn" onClick={() => router.push('/plan')}>Go to Plan</button>
          </div>
        ) : weeks.map(week => {
          const isExpanded = expandedWeeks[week.weekStart]
          const progress = getProgress(week)
          const checkedCount = week.toBuy.filter(i => checkedItems[week.weekStart + '-' + i.name]).length

          return (
            <div key={week.weekStart} className="week-block">
              <div className="week-hd" onClick={() => setExpandedWeeks(prev => ({ ...prev, [week.weekStart]: !prev[week.weekStart] }))}>
                <div style={{display:'flex',alignItems:'center',gap:'.75rem',flex:1,minWidth:0}}>
                  <div className={'week-badge' + (week.isCurrent ? ' current' : '')}>{week.isCurrent ? 'This week' : 'Upcoming'}</div>
                  <div>
                    <div className="week-title">{formatWeekRange(week.weekStart)}</div>
                    <div className="week-count">{week.mealCount} meals &middot; {week.toBuy.length} items to buy{checkedCount > 0 ? ' \u00b7 ' + checkedCount + ' checked' : ''}</div>
                  </div>
                </div>
                <div style={{color:'rgba(248,243,236,.4)',fontSize:'.8rem',transition:'transform .2s',transform: isExpanded ? 'rotate(180deg)' : 'none',flexShrink:0}}>▼</div>
              </div>

              {isExpanded && (
                <div className="week-body">
                  {week.toBuy.length === 0 && week.youHave.length === 0 ? (
                    <div style={{padding:'1.5rem 0',textAlign:'center',color:'rgba(248,243,236,.4)',fontSize:'.95rem'}}>
                      No ingredients found. Add recipes with full ingredient lists to your vault.
                    </div>
                  ) : (
                    <>
                      {week.toBuy.length > 0 && (
                        <>
                          <div className="progress-bar"><div className="progress-fill" style={{width:progress+'%'}}/></div>
                          <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.45)',marginBottom:'.25rem'}}>{checkedCount} of {week.toBuy.length} items checked</div>
                          <div className="section-label">Need to buy</div>
                          {week.toBuy.map(item => {
                            const checked = checkedItems[week.weekStart + '-' + item.name] || false
                            return (
                              <div key={item.name} className="ing-item" onClick={() => toggleCheck(week.weekStart, item.name)}
                                style={{opacity: checked ? .45 : 1}}>
                                <div className="ing-check" style={{background: checked ? '#8FA889' : 'transparent', borderColor: checked ? '#8FA889' : 'rgba(184,135,74,.4)'}}>
                                  {checked && <span style={{color:'#F8F3EC',fontSize:'.65rem',fontWeight:700}}>✓</span>}
                                </div>
                                <div className="ing-name">
                                  {item.name}
                                  {item.notes && <span style={{fontSize:'.82rem',color:'rgba(248,243,236,.4)',fontStyle:'italic'}}> — {item.notes}</span>}
                                </div>
                                <div className="ing-amount">{formatAmt(item)}</div>
                              </div>
                            )
                          })}
                          {checkedCount > 0 && (
                            <button onClick={() => {
                              const n = { ...checkedItems }
                              week.toBuy.forEach(i => { delete n[week.weekStart + '-' + i.name] })
                              setCheckedItems(n)
                            }} style={{marginTop:'1rem',background:'none',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',padding:'.45rem 1.1rem',color:'rgba(248,243,236,.5)',fontFamily:"'Outfit',sans-serif",fontSize:'.88rem',cursor:'pointer'}}>
                              Clear checked
                            </button>
                          )}
                        </>
                      )}
                      {week.youHave.length > 0 && (
                        <>
                          <div className="section-label" style={{marginTop:'1.5rem'}}>You probably have this</div>
                          {week.youHave.map(item => (
                            <div key={item.name} className="staple-item">
                              <span style={{color:'rgba(143,168,137,.6)',fontSize:'.9rem'}}>✓</span>
                              <span style={{flex:1,fontSize:'.92rem',color:'rgba(248,243,236,.55)'}}>{item.name}</span>
                              <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.35)'}}>{formatAmt(item)}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
