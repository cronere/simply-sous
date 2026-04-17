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
function scaleAmount(amount, baseServings, targetServings) {
  if (!amount || typeof amount !== 'number') return amount
  if (!baseServings || baseServings === targetServings) return amount
  return +(amount * targetServings / baseServings).toFixed(2)
}
function fmtAmt(amount, unit) {
  if (!amount && !unit) return ''
  const d = typeof amount === 'number' ? (Number.isInteger(amount) ? amount : +amount.toFixed(2)) : amount
  return [d, unit].filter(Boolean).join(' ')
}
function buildMergedList(meals, mealServings, staples, familySize) {
  const allStaples = (staples || []).map(s => s.toLowerCase().trim())
  const map = {}
  meals.forEach(meal => {
    const mealId = meal.id
    const title = meal.recipes?.title || meal.recipe_snapshot?.title || 'Unknown'
    const ingredients = meal.recipes?.ingredients || meal.recipe_snapshot?.ingredients || []
    const base = meal.recipes?.base_servings || meal.recipe_snapshot?.base_servings || 4
    const target = mealServings[mealId] || familySize
    ingredients.forEach(ing => {
      if (!ing.name) return
      const key = ing.name.toLowerCase().trim()
      const scaled = scaleAmount(ing.amount, base, target)
      if (map[key]) {
        if (map[key].unit === ing.unit && typeof map[key].amount === 'number' && typeof scaled === 'number')
          map[key].amount = +(map[key].amount + scaled).toFixed(2)
        if (title && !map[key].recipes.includes(title)) map[key].recipes.push(title)
      } else {
        map[key] = { name: ing.name, amount: scaled, unit: ing.unit, notes: ing.notes, recipes: [title] }
      }
    })
  })
  const toBuy = [], youHave = []
  Object.values(map).forEach(ing => {
    const key = ing.name.toLowerCase().trim()
    const isStaple = allStaples.some(s => key.includes(s) || s.includes(key))
    if (isStaple) youHave.push(ing); else toBuy.push(ing)
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
  .phase-tabs{display:flex;gap:.4rem;margin-bottom:1.5rem;background:rgba(255,255,255,.04);border-radius:1rem;padding:.3rem}
  .phase-tab{flex:1;padding:.6rem 1rem;border-radius:.7rem;text-align:center;font-size:.88rem;font-weight:500;cursor:pointer;transition:all .2s;color:rgba(248,243,236,.5);border:none;background:none;font-family:'Outfit',sans-serif}
  .phase-tab.active{background:#B8874A;color:#1A1612}
  .phase-tab.locked{opacity:.35;cursor:default}
  .week-tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;overflow-x:auto;padding-bottom:.25rem}
  .week-tab{white-space:nowrap;padding:.5rem 1rem;border-radius:2rem;font-size:.85rem;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,.1);color:rgba(248,243,236,.55);background:none;font-family:'Outfit',sans-serif;flex-shrink:0}
  .week-tab:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .week-tab.active{background:rgba(184,135,74,.12);border-color:rgba(184,135,74,.35);color:#D4A46A}
  .week-tab.current{border-color:rgba(143,168,137,.3)}
  .week-tab.current.active{background:rgba(143,168,137,.08);border-color:#8FA889;color:#8FA889}
  .week-tab.past{opacity:.65;border-style:dashed}
  .week-tab.past.active{opacity:1;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.2);border-style:dashed;color:rgba(248,243,236,.6)}
  .meal-card{background:#2C2420;border:1px solid rgba(255,255,255,.07);border-radius:1.25rem;margin-bottom:.85rem;overflow:hidden}
  .meal-card-hd{padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;transition:background .15s}
  .meal-card-hd:hover{background:rgba(255,255,255,.03)}
  .meal-card-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#F8F3EC;line-height:1.2}
  .meal-card-meta{font-size:.78rem;color:rgba(248,243,236,.4);margin-top:.15rem}
  .meal-card-body{padding:0 1.25rem 1.25rem;border-top:1px solid rgba(255,255,255,.06)}
  .srv-row{display:flex;align-items:center;gap:1rem;padding:1rem 0 .85rem}
  .srv-label{font-size:.7rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(248,243,236,.45);flex-shrink:0}
  .srv-slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,.12);outline:none}
  .srv-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#B8874A;cursor:pointer;border:2px solid #2C2420;box-shadow:0 0 0 2px rgba(184,135,74,.25)}
  .srv-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#B8874A;cursor:pointer;border:2px solid #2C2420}
  .srv-val{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:#B8874A;min-width:4rem;text-align:right;white-space:nowrap;line-height:1}
  .srv-note{font-size:.62rem;color:rgba(248,243,236,.28);letter-spacing:.04em;margin-top:.2rem}
  .rev-ing{display:flex;justify-content:space-between;align-items:baseline;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.9rem}
  .rev-ing:last-child{border-bottom:none}
  .rev-ing-name{color:rgba(248,243,236,.8);flex:1;padding-right:.75rem}
  .rev-ing-amt{color:#B8874A;font-size:.85rem;white-space:nowrap}
  .section-label{font-size:.72rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(248,243,236,.45);margin:1.25rem 0 .65rem}
  .progress-bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin:.5rem 0 .35rem;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,#8FA889,#B8874A);border-radius:2px;transition:width .3s}
  .ing-item{display:flex;align-items:center;gap:.85rem;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;transition:opacity .15s}
  .ing-check{width:1.2rem;height:1.2rem;border-radius:50%;border:1.5px solid rgba(184,135,74,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
  .ing-name{flex:1;font-size:.97rem;color:rgba(248,243,236,.9)}
  .ing-amount{font-size:.88rem;color:#B8874A;text-align:right;flex-shrink:0;margin-left:.5rem}
  .staple-item{display:flex;align-items:center;gap:.85rem;padding:.45rem 0}
  .confirm-bar{position:sticky;bottom:5rem;background:linear-gradient(to top,#1A1612 65%,transparent);padding:1.5rem 0 0;margin-top:.5rem}
  .no-plans{text-align:center;padding:4rem 1rem}
  .cta-btn{background:#B8874A;color:#1A1612;border:none;padding:.8rem 2rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;cursor:pointer}
  .cta-btn:hover{background:#D4A46A}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){
    .gr-wrap{padding:0 1rem 6rem}
    .gr-hd{padding:1.5rem 0 1rem}
    .meal-card-hd{padding:.85rem 1rem}
    .meal-card-body{padding:0 1rem 1rem}
  }
`

export default function GroceryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [familySize, setFamilySize] = useState(4)
  const [staples, setStaples] = useState([])
  const [weeks, setWeeks] = useState([])
  const [activeWeek, setActiveWeek] = useState(null)
  const [expandedMeals, setExpandedMeals] = useState({})
  // Track staples the user has marked as "actually need to buy"
  // Stored per week in checkedItems as 'need:{itemName}'

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!mounted) return
    const sb = getClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    })
  }, [mounted, router])
  useEffect(() => { if (userId) loadAll() }, [userId])

  const loadAll = async () => {
    setLoading(true)
    const sb = getClient()
    const [profileRes, prefsRes, plansRes] = await Promise.all([
      sb.from('profiles').select('family_size').eq('id', userId).single(),
      sb.from('user_preferences').select('pantry_staples, fridge_staples').eq('profile_id', userId).maybeSingle(),
      sb.from('weekly_plans')
        .select('id, week_start_date, planned_meals ( id, meal_date, is_skipped, recipe_snapshot, recipes ( id, title, ingredients, base_servings ) )')
        .eq('profile_id', userId).eq('status', 'confirmed')
        .order('week_start_date', { ascending: true }).limit(4)
    ])
    const fs = profileRes.data?.family_size || 4
    setFamilySize(fs)
    const allStaples = [...(prefsRes.data?.pantry_staples||[]), ...(prefsRes.data?.fridge_staples||[])]
    setStaples(allStaples)
    const plans = plansRes.data || []
    if (!plans.length) { setLoading(false); return }

    // Fetch saved states
    const { data: savedStates } = await sb.from('grocery_list_state')
      .select('*').eq('profile_id', userId).in('weekly_plan_id', plans.map(p => p.id))
    const stateMap = {}
    ;(savedStates||[]).forEach(s => { stateMap[s.weekly_plan_id] = s })

    // Enrich system recipe ingredients
    const allMeals = plans.flatMap(p => p.planned_meals||[])
    const sysIds = [...new Set(allMeals
      .filter(m => m.recipe_snapshot?.system_recipe_id && !m.recipe_snapshot?.ingredients?.length)
      .map(m => m.recipe_snapshot.system_recipe_id)
    )]
    let sysMap = {}
    if (sysIds.length) {
      const { data: sys } = await sb.from('system_recipes').select('id, title, ingredients, base_servings').in('id', sysIds)
      ;(sys||[]).forEach(r => { sysMap[r.id] = r })
    }

    const now = new Date()
    const currentWeekStart = getLocalDateStr(getWeekStart(now))

    const weekData = plans.map(plan => {
      const meals = (plan.planned_meals||[]).filter(m => !m.is_skipped).map(m => {
        if (m.recipe_snapshot?.system_recipe_id && sysMap[m.recipe_snapshot.system_recipe_id]) {
          const full = sysMap[m.recipe_snapshot.system_recipe_id]
          return { ...m, recipe_snapshot: { ...m.recipe_snapshot, ingredients: full.ingredients||[], base_servings: full.base_servings||4 } }
        }
        return m
      })
      const saved = stateMap[plan.id]
      const weekEndDate = new Date(plan.week_start_date + 'T12:00:00')
      weekEndDate.setDate(weekEndDate.getDate() + 6)
      const isPast = weekEndDate < now && plan.week_start_date !== currentWeekStart
      const isFuture = plan.week_start_date > currentWeekStart
      return {
        planId: plan.id, stateId: saved?.id || null,
        weekStart: plan.week_start_date,
        isCurrent: plan.week_start_date === currentWeekStart,
        isPast,
        isFuture,
        meals,
        phase: saved?.phase || (isPast ? 'confirmed' : 'review'),
        mealServings: saved?.meal_servings || {},
        checkedItems: saved?.checked_items || {},
      }
    })
    setWeeks(weekData)
    const ci = weekData.findIndex(w => w.isCurrent)
    setActiveWeek(weekData[ci >= 0 ? ci : weekData.length-1]?.weekStart || null)
    setLoading(false)
  }

  const updateWeek = (weekStart, changes) =>
    setWeeks(prev => prev.map(w => w.weekStart === weekStart ? { ...w, ...changes } : w))

  const persistState = useCallback(async (week) => {
    const sb = getClient()
    const payload = {
      profile_id: userId, weekly_plan_id: week.planId,
      phase: week.phase, meal_servings: week.mealServings,
      checked_items: week.checkedItems, updated_at: new Date().toISOString(),
    }
    if (week.stateId) {
      await sb.from('grocery_list_state').update(payload).eq('id', week.stateId)
    } else {
      const { data } = await sb.from('grocery_list_state').insert(payload).select('id').single()
      if (data?.id) updateWeek(week.weekStart, { stateId: data.id })
    }
  }, [userId])

  const setMealServings = (weekStart, mealId, servings) => {
    const week = weeks.find(w => w.weekStart === weekStart)
    if (!week) return
    const newServings = { ...week.mealServings, [mealId]: servings }
    updateWeek(weekStart, { mealServings: newServings })
    clearTimeout(window._srvTimeout)
    window._srvTimeout = setTimeout(() => persistState({ ...week, mealServings: newServings }), 800)
  }

  const confirmList = async (weekStart) => {
    setSaving(true)
    const week = weeks.find(w => w.weekStart === weekStart)
    if (week) {
      updateWeek(weekStart, { phase: 'confirmed' })
      await persistState({ ...week, phase: 'confirmed' })
    }
    setSaving(false)
  }

  const backToReview = async (weekStart) => {
    const week = weeks.find(w => w.weekStart === weekStart)
    if (week) {
      updateWeek(weekStart, { phase: 'review' })
      await persistState({ ...week, phase: 'review' })
    }
  }

  const toggleCheck = (weekStart, itemKey) => {
    const week = weeks.find(w => w.weekStart === weekStart)
    if (!week) return
    const newChecked = { ...week.checkedItems, [itemKey]: !week.checkedItems[itemKey] }
    updateWeek(weekStart, { checkedItems: newChecked })
    clearTimeout(window._checkTimeout)
    window._checkTimeout = setTimeout(() => persistState({ ...week, checkedItems: newChecked }), 600)
  }

  const getMealTitle = m => m.recipes?.title || m.recipe_snapshot?.title || 'Unknown recipe'
  const getMealIngredients = m => m.recipes?.ingredients || m.recipe_snapshot?.ingredients || []
  const getMealBaseServings = m => m.recipes?.base_servings || m.recipe_snapshot?.base_servings || 4
  const getMealDate = m => {
    if (!m.meal_date) return ''
    const d = new Date(m.meal_date + 'T12:00:00')
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] + ' ' + d.getDate()
  }

  if (!mounted || loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const activeWeekData = weeks.find(w => w.weekStart === activeWeek)

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
            <button className="cta-btn" onClick={() => router.push('/plan')}>Go to Plan →</button>
          </div>
        ) : (
          <>
            {weeks.length > 1 && (
              <div className="week-tabs">
                {weeks.map(w => (
                  <button key={w.weekStart}
                    className={'week-tab' + (w.weekStart === activeWeek ? ' active' : '') + (w.isCurrent ? ' current' : '') + (w.isPast ? ' past' : '')}
                    onClick={() => setActiveWeek(w.weekStart)}>
                    <span style={{display:'block',fontSize:'.75rem',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:'.15rem',opacity:.6}}>
                      {w.isCurrent ? 'This week' : w.isPast ? 'Archived' : 'Upcoming'}
                    </span>
                    <span>{formatWeekRange(w.weekStart)}</span>
                    {w.phase === 'confirmed' && !w.isPast && <span style={{marginLeft:'.4rem',color:'#8FA889',fontSize:'.8rem'}}>✓</span>}
                    {w.isPast && <span style={{marginLeft:'.4rem',fontSize:'.75rem',opacity:.5}}>📦</span>}
                  </button>
                ))}
              </div>
            )}

            {activeWeekData && (
              <>
                {/* Phase indicator */}
                <div className="phase-tabs">
                  <button
                    className={'phase-tab' + (activeWeekData.phase === 'review' ? ' active' : '')}
                    onClick={() => activeWeekData.phase === 'confirmed' && backToReview(activeWeek)}>
                    1 · Review meals
                  </button>
                  <button
                    className={'phase-tab' + (activeWeekData.phase === 'confirmed' ? ' active' : '') + (activeWeekData.phase === 'review' ? ' locked' : '')}
                    disabled={activeWeekData.phase === 'review'}>
                    2 · Shopping list
                  </button>
                </div>

                {/* ── REVIEW PHASE ──────────────────────────────── */}
                {activeWeekData.phase === 'review' && (
                  <>
                    <div style={{fontSize:'.88rem',color:'rgba(248,243,236,.45)',marginBottom:'1.25rem',lineHeight:1.6}}>
                      Review each meal and adjust serving sizes. When ready, confirm to build your merged shopping list.
                    </div>

                    {activeWeekData.meals.map(meal => {
                      const mealId = meal.id
                      const ingredients = getMealIngredients(meal)
                      const base = getMealBaseServings(meal)
                      const target = activeWeekData.mealServings[mealId] || familySize
                      const isExpanded = expandedMeals[mealId]

                      return (
                        <div key={mealId} className="meal-card">
                          <div className="meal-card-hd" onClick={() => setExpandedMeals(p => ({ ...p, [mealId]: !p[mealId] }))}>
                            <div style={{flex:1,minWidth:0}}>
                              <div className="meal-card-title">{getMealTitle(meal)}</div>
                              <div className="meal-card-meta">
                                {getMealDate(meal)}
                                {' · '}
                                <span style={{color: target !== familySize ? '#B8874A' : 'inherit'}}>
                                  {target} {target === 1 ? 'person' : 'people'}
                                  {target === familySize ? ' (default)' : ' ✏'}
                                </span>
                                {ingredients.length > 0 && ' · ' + ingredients.length + ' ingredients'}
                              </div>
                            </div>
                            <div style={{color:'rgba(248,243,236,.3)',fontSize:'.75rem',transition:'transform .2s',transform:isExpanded?'rotate(180deg)':'none',flexShrink:0}}>▼</div>
                          </div>

                          {isExpanded && (
                            <div className="meal-card-body">
                              <div className="srv-row">
                                <div className="srv-label">Cooking for</div>
                                <input type="range" min={1} max={30} step={1}
                                  value={target}
                                  onChange={e => setMealServings(activeWeek, mealId, parseInt(e.target.value))}
                                  className="srv-slider" />
                                <div className="srv-val">
                                  {target}
                                  <div className="srv-note">{target === familySize ? 'family default' : 'adjusted'}</div>
                                </div>
                              </div>

                              {ingredients.length > 0 ? ingredients.map((ing, i) => (
                                <div key={i} className="rev-ing">
                                  <span className="rev-ing-name">
                                    {ing.name}
                                    {ing.notes && <em style={{color:'rgba(248,243,236,.35)',fontSize:'.82em'}}>, {ing.notes}</em>}
                                  </span>
                                  <span className="rev-ing-amt">{fmtAmt(scaleAmount(ing.amount, base, target), ing.unit)}</span>
                                </div>
                              )) : (
                                <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.28)',padding:'.5rem 0'}}>No ingredients listed.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <div className="confirm-bar">
                      <button onClick={() => confirmList(activeWeek)} disabled={saving}
                        style={{width:'100%',background:'#B8874A',color:'#1A1612',border:'none',padding:'1rem',borderRadius:'1rem',fontFamily:"'Outfit',sans-serif",fontSize:'1rem',fontWeight:600,cursor:'pointer',opacity:saving?.7:1}}>
                        {saving ? 'Building your list...' : 'Confirm & build shopping list →'}
                      </button>
                    </div>
                  </>
                )}

                {/* ── SHOPPING PHASE ────────────────────────────── */}
                {activeWeekData.phase === 'confirmed' && (() => {
                  // Items user has moved from youHave to toBuy
                  const stapleOverrides = new Set(
                    Object.keys(activeWeekData.checkedItems)
                      .filter(k => k.startsWith('need:'))
                      .map(k => k.replace('need:', ''))
                  )
                  const { toBuy: baseToBuy, youHave: baseYouHave } = buildMergedList(activeWeekData.meals, activeWeekData.mealServings, staples, familySize)
                  // Apply overrides
                  const overriddenItems = baseYouHave.filter(i => stapleOverrides.has(i.name))
                  const toBuy = [...baseToBuy, ...overriddenItems].sort((a,b) => a.name.localeCompare(b.name))
                  const youHave = baseYouHave.filter(i => !stapleOverrides.has(i.name))
                  const checkedCount = toBuy.filter(i => activeWeekData.checkedItems[i.name]).length
                  const progress = toBuy.length ? Math.round(checkedCount/toBuy.length*100) : 100

                  return (
                    <>
                      {activeWeekData.isPast && (
                    <div style={{background:'rgba(255,255,255,.04)',border:'1px dashed rgba(255,255,255,.1)',borderRadius:'.75rem',padding:'.65rem 1rem',marginBottom:'1rem',fontSize:'.85rem',color:'rgba(248,243,236,.4)',display:'flex',alignItems:'center',gap:'.5rem'}}>
                      <span>📦</span> Archived week — viewing past grocery list for reference.
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem',flexWrap:'wrap',gap:'.5rem'}}>
                        <div style={{fontSize:'.88rem',color:'rgba(248,243,236,.45)'}}>
                          {checkedCount} of {toBuy.length} items checked
                        </div>
                        <button onClick={() => backToReview(activeWeek)}
                          style={{background:'none',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',padding:'.35rem .9rem',color:'rgba(248,243,236,.5)',fontFamily:"'Outfit',sans-serif",fontSize:'.82rem',cursor:'pointer',transition:'all .2s'}}
                          onMouseOver={e=>e.target.style.borderColor='rgba(184,135,74,.3)'}
                          onMouseOut={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}>
                          ← Adjust servings
                        </button>
                      </div>

                      <div className="progress-bar"><div className="progress-fill" style={{width:progress+'%'}}/></div>

                      {toBuy.length > 0 && (
                        <>
                          <div className="section-label">Need to buy</div>
                          {toBuy.map(item => {
                            const checked = !!activeWeekData.checkedItems[item.name]
                            return (
                              <div key={item.name} className="ing-item"
                                onClick={() => toggleCheck(activeWeek, item.name)}
                                style={{opacity: checked ? .4 : 1}}>
                                <div className="ing-check"
                                  style={{background:checked?'#8FA889':'transparent',borderColor:checked?'#8FA889':'rgba(184,135,74,.4)'}}>
                                  {checked && <span style={{color:'#F8F3EC',fontSize:'.65rem',fontWeight:700}}>✓</span>}
                                </div>
                                <div className="ing-name">
                                  <div>{item.name}{item.notes && <span style={{fontSize:'.82rem',color:'rgba(248,243,236,.4)',fontStyle:'italic'}}> — {item.notes}</span>}</div>
                                  {item.recipes?.length > 0 && (
                                    <div style={{fontSize:'.75rem',color:'rgba(248,243,236,.3)',marginTop:'.1rem'}}>
                                      {item.recipes.length === 1 ? item.recipes[0]
                                        : item.recipes.length === 2 ? item.recipes.join(' · ')
                                        : item.recipes[0] + ' +' + (item.recipes.length-1) + ' more'}
                                    </div>
                                  )}
                                </div>
                                <div className="ing-amount">{fmtAmt(item.amount, item.unit)}</div>
                              </div>
                            )
                          })}
                          {checkedCount > 0 && (
                            <button onClick={async () => {
                              const n = { ...activeWeekData.checkedItems }
                              toBuy.forEach(i => { delete n[i.name] })
                              updateWeek(activeWeek, { checkedItems: n })
                              await persistState({ ...activeWeekData, checkedItems: n })
                            }} style={{marginTop:'1rem',background:'none',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',padding:'.45rem 1.1rem',color:'rgba(248,243,236,.5)',fontFamily:"'Outfit',sans-serif",fontSize:'.88rem',cursor:'pointer'}}>
                              Clear checked
                            </button>
                          )}
                        </>
                      )}

                      {youHave.length > 0 && (
                        <>
                          <div className="section-label" style={{marginTop:'1.5rem'}}>You probably have this</div>
                          <div style={{fontSize:'.78rem',color:'rgba(248,243,236,.3)',marginBottom:'.5rem'}}>Tap any item to move it to your shopping list</div>
                          {youHave.map(item => (
                            <div key={item.name} className="staple-item"
                              style={{cursor:'pointer',borderRadius:'.5rem',padding:'.35rem .25rem',transition:'background .15s'}}
                              onClick={() => toggleCheck(activeWeek, 'need:' + item.name)}
                              onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}
                              onMouseOut={e => e.currentTarget.style.background='transparent'}>
                              <span style={{color:'rgba(143,168,137,.6)',fontSize:'.9rem'}}>✓</span>
                              <span style={{flex:1,fontSize:'.92rem',color:'rgba(248,243,236,.55)'}}>{item.name}</span>
                              <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.35)',marginRight:'.5rem'}}>{fmtAmt(item.amount, item.unit)}</span>
                              <span style={{fontSize:'.7rem',color:'rgba(248,243,236,.2)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'.4rem',padding:'.15rem .4rem',whiteSpace:'nowrap'}}>+ need it</span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
