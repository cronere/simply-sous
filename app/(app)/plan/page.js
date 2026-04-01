'use client'

import { useState, useEffect } from 'react'
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
  .plan-root{min-height:100vh;background:#1A1612;padding:0 0 6rem}
  .plan-hd{padding:1.75rem 2rem 1rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem}
  .plan-hd h1{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#F8F3EC}
  .plan-hd h1 em{font-style:italic;color:#B8874A}
  .plan-hd-sub{font-size:.85rem;color:rgba(248,243,236,.5);margin-top:.25rem}
  .week-nav{display:flex;align-items:center;gap:.75rem;padding:0 2rem 1.25rem}
  .wn-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:2rem;
    padding:.45rem 1rem;font-size:.82rem;color:rgba(248,243,236,.5);cursor:pointer;
    transition:all .2s;font-family:'Outfit',sans-serif}
  .wn-btn:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .week-label{font-size:.88rem;color:rgba(248,243,236,.4);flex:1;text-align:center}
  .plan-status{display:inline-flex;align-items:center;gap:.4rem;font-size:.7rem;font-weight:500;
    letter-spacing:.08em;text-transform:uppercase;padding:.28rem .7rem;border-radius:2rem;margin-left:.5rem}
  .plan-status.draft{background:rgba(184,135,74,.1);color:#B8874A;border:1px solid rgba(184,135,74,.2)}
  .plan-status.confirmed{background:rgba(107,126,103,.1);color:#8FA889;border:1px solid rgba(107,126,103,.2)}
  .generate-wrap{padding:.5rem 2rem 2rem}
  .generate-card{background:rgba(184,135,74,.05);border:1.5px dashed rgba(184,135,74,.2);
    border-radius:1.5rem;padding:3.5rem 2rem;text-align:center}
  .generate-ico{font-size:3.5rem;margin-bottom:1.25rem;display:block}
  .generate-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;
    color:#F8F3EC;margin-bottom:.6rem}
  .generate-sub{font-size:.92rem;color:rgba(248,243,236,.5);line-height:1.8;
    max-width:420px;margin:0 auto 2rem}
  .generate-btn{background:#B8874A;color:#1A1612;border:none;padding:1rem 2.75rem;
    border-radius:3rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;
    cursor:pointer;transition:all .2s;box-shadow:0 8px 28px rgba(184,135,74,.25)}
  .generate-btn:hover:not(:disabled){background:#D4A46A;transform:translateY(-2px);
    box-shadow:0 14px 36px rgba(184,135,74,.35)}
  .generate-btn:disabled{opacity:.5;cursor:not-allowed}
  .generating-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
    border-radius:1.5rem;padding:3.5rem 2rem;text-align:center}
  .gen-ico{font-size:3rem;display:block;margin-bottom:1rem;animation:pulse 1.5s ease infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .gen-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;margin-bottom:.5rem}
  .gen-sub{font-size:.88rem;color:rgba(248,243,236,.4);line-height:1.7}
  .plan-grid{padding:0 2rem}
  .plan-day{display:flex;gap:1rem;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,.05)}
  .plan-day:last-child{border:none}
  .day-label{width:3.5rem;flex-shrink:0;display:flex;flex-direction:column;
    align-items:center;justify-content:flex-start;padding-top:.3rem;gap:.15rem}
  .day-name{font-size:.68rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;
    color:rgba(248,243,236,.3)}
  .day-date{font-size:.8rem;color:rgba(248,243,236,.2)}
  .day-name.tod{color:#B8874A}
  .day-date.tod{color:rgba(184,135,74,.7);font-weight:500}
  .day-content{flex:1;min-width:0}
  .recipe-slot{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
    border-radius:.875rem;padding:1rem 1.25rem;cursor:pointer;transition:all .2s}
  .recipe-slot:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2)}
  .recipe-slot.tonight{background:rgba(184,135,74,.08);border-color:rgba(184,135,74,.3)}
  .tonight-badge{font-size:.62rem;color:#B8874A;letter-spacing:.1em;text-transform:uppercase;
    font-weight:500;margin-bottom:.35rem}
  .slot-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:#F8F3EC;
    line-height:1.3;margin-bottom:.35rem}
  .slot-meta{display:flex;gap:.75rem;font-size:.75rem;color:rgba(248,243,236,.35);flex-wrap:wrap}
  .slot-cook-time{font-size:.7rem;color:rgba(184,135,74,.7);margin-top:.4rem;display:block}
  .skip-slot{background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.06);
    border-radius:.875rem;padding:.85rem 1.25rem}
  .skip-label{font-size:.82rem;color:rgba(248,243,236,.22);font-style:italic}
  .empty-slot{background:rgba(255,255,255,.02);border:1.5px dashed rgba(255,255,255,.07);
    border-radius:.875rem;padding:.85rem 1.25rem;cursor:pointer;transition:all .2s}
  .empty-slot:hover{border-color:rgba(184,135,74,.25);background:rgba(184,135,74,.03)}
  .empty-label{font-size:.82rem;color:rgba(248,243,236,.22)}
  .plan-actions{position:sticky;bottom:0;background:linear-gradient(to top,#1A1612 65%,transparent);
    padding:2rem 2rem 1rem;display:flex;gap:.75rem;margin-top:1rem}
  .confirm-btn{flex:1;background:#B8874A;color:#1A1612;border:none;padding:.9rem;
    border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:600;
    cursor:pointer;transition:all .2s}
  .confirm-btn:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px)}
  .confirm-btn:disabled{opacity:.5;cursor:not-allowed}
  .regen-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    color:rgba(248,243,236,.55);padding:.9rem 1.5rem;border-radius:2rem;
    font-family:'Outfit',sans-serif;font-size:.88rem;cursor:pointer;transition:all .2s;white-space:nowrap}
  .regen-btn:hover{background:rgba(255,255,255,.09);color:#F8F3EC}
  .plan-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;
    color:#EF4444;font-size:.85rem;padding:12px 16px;margin:0 2rem 1rem;line-height:1.6}
  .sp{width:16px;height:16px;border:2px solid rgba(26,22,18,.2);border-top-color:#1A1612;
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:5px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){
    .plan-hd,.plan-grid,.generate-wrap,.plan-actions,.week-nav{padding-left:1.25rem;padding-right:1.25rem}
  }
`

function getWeekStart(date) {
  const d = new Date(date)
  // Use local date components to avoid UTC timezone shift
  const localDay = d.getDay()
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(ws) {
  const end = new Date(ws)
  end.setDate(end.getDate() + 6)
  const o = { month:'short', day:'numeric' }
  return `${ws.toLocaleDateString('en-US',o)} – ${end.toLocaleDateString('en-US',o)}`
}

function isToday(dateStr) {
  const now = new Date()
  const localDate = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0')
  return dateStr === localDate
}

export default function PlanPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekStart, setWeekStart] = useState(null)
  const [plan, setPlan] = useState(null)
  const [planId, setPlanId] = useState(null)
  const [planStatus, setPlanStatus] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [showVarietyPrompt, setShowVarietyPrompt] = useState(false)
  const [pendingGenerate, setPendingGenerate] = useState(false)

  useEffect(() => {
    setMounted(true)
    getClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!mounted) return
    const base = getWeekStart(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    setWeekStart(new Date(base))
  }, [mounted, weekOffset])

  const weekStartStr = weekStart ? (
    weekStart.getFullYear() + '-' +
    String(weekStart.getMonth() + 1).padStart(2, '0') + '-' +
    String(weekStart.getDate()).padStart(2, '0')
  ) : null

  useEffect(() => {
    if (!userId || !weekStartStr) return
    loadPlan()
  }, [userId, weekStartStr])

  const loadPlan = async () => {
    const sb = getClient()
    const { data } = await sb
      .from('weekly_plans')
      .select(`id, status, planned_meals (
        id, meal_date, is_skipped, skip_reason, start_cooking_at, notes,
        recipes ( id, title, cuisine, total_time_mins, tags, dietary_flags, base_servings, is_favorite )
      )`)
      .eq('profile_id', userId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle()

    if (data) {
      setPlanId(data.id)
      setPlanStatus(data.status)
      const formatted = (data.planned_meals || [])
        .sort((a,b) => a.meal_date.localeCompare(b.meal_date))
        .map(m => ({
          date: m.meal_date,
          recipe_id: m.recipes?.id || null,
          recipe: m.recipes || (m.notes ? { title: m.notes, cuisine: null, total_time_mins: null, is_favorite: false } : null),
          is_skipped: m.is_skipped,
          skip_reason: m.skip_reason,
          start_cooking_at: m.start_cooking_at,
          dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(m.meal_date + 'T12:00:00').getDay()],
        }))
      setPlan(formatted)
    } else {
      setPlan(null); setPlanId(null); setPlanStatus(null)
    }
  }

  const saveDraft = async (planData) => {
    if (!planData || !userId || !weekStartStr) return
    const sb = getClient()
    try {
      // Upsert the weekly_plan record
      let currentPlanId = planId
      if (!currentPlanId) {
        const { data: np, error: pe } = await sb
          .from('weekly_plans')
          .insert({
            profile_id: userId,
            week_start_date: weekStartStr,
            status: 'draft',
            ai_generated: true,
          })
          .select('id')
          .single()
        if (pe) throw pe
        currentPlanId = np.id
        setPlanId(currentPlanId)
      } else {
        await sb.from('weekly_plans')
          .update({ status: 'draft' })
          .eq('id', currentPlanId)
      }

      // Save planned meals
      await sb.from('planned_meals').delete().eq('weekly_plan_id', currentPlanId)

      const meals = planData.map(slot => ({
        weekly_plan_id: currentPlanId,
        profile_id: userId,
        recipe_id: slot.recipe_id && !String(slot.recipe_id || '').startsWith('sys-') ? slot.recipe_id : null,
        meal_date: slot.date,
        servings: slot.recipe?.base_servings || 4,
        is_skipped: slot.is_skipped || false,
        skip_reason: slot.skip_reason || null,
        start_cooking_at: null,
        // Always store recipe title in notes as fallback for display
        notes: slot.recipe?.title || null,
      }))

      await sb.from('planned_meals').insert(meals)
      console.log('Draft auto-saved')
    } catch (e) {
      console.error('Auto-save failed:', e)
      // Non-critical — don't show error to user
    }
  }

  const generatePlan = async (useVariety = null) => {
    // If useVariety hasn't been decided and vault is large enough, ask first
    if (useVariety === null) {
      const sb = getClient()
      const { count } = await sb
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', userId)

      const cookingDaysCount = 7 - 2 // rough estimate
      if ((count || 0) >= cookingDaysCount) {
        setShowVarietyPrompt(true)
        setPendingGenerate(true)
        return
      }
    }

    setShowVarietyPrompt(false)
    setPendingGenerate(false)
    setGenerating(true); setError('')
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekStartDate: weekStartStr, useVariety: useVariety ?? false }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')
      setPlan(data.plan); setPlanStatus('draft')

      // Auto-save draft immediately so navigating away doesn't lose it
      await saveDraft(data.plan)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('529') || msg.includes('overload') || msg.includes('Overloaded')) {
        setError("Dot is a little busy right now — Anthropic's servers are at capacity. Wait 30 seconds and try again.")
      } else {
        setError(msg || 'Could not generate plan. Please try again.')
      }
    }
    setGenerating(false)
  }

  const swapMeal = async (date) => {
    if (!plan || generating) return
    setError('')
    // Remove this day's meal and re-ask Claude for just that day
    // For now: cycle to next available vault recipe not already in plan
    const sb = getClient()
    const { data: vaultRecipes } = await sb
      .from('recipes')
      .select('id, title, cuisine, total_time_mins, tags, dietary_flags, base_servings, is_favorite')
      .eq('profile_id', userId)
      .eq('is_published', true)

    if (!vaultRecipes?.length) {
      setError('Add more recipes to your vault to enable swapping.')
      return
    }

    const usedIds = plan.filter(s => s.date !== date && !s.is_skipped).map(s => s.recipe_id)
    const available = vaultRecipes.filter(r => !usedIds.includes(r.id))
    const pool = available.length > 0 ? available : vaultRecipes

    // Pick a random one from the pool
    const pick = pool[Math.floor(Math.random() * pool.length)]

    setPlan(prev => prev.map(slot =>
      slot.date === date
        ? { ...slot, recipe_id: pick.id, recipe: pick }
        : slot
    ))
  }

  const confirmPlan = async () => {
    if (!plan) return
    setConfirming(true); setError('')
    const sb = getClient()
    try {
      let currentPlanId = planId
      if (!currentPlanId) {
        const { data: np, error: pe } = await sb.from('weekly_plans').insert({
          profile_id: userId,
          week_start_date: weekStartStr,
          status: 'confirmed',
          ai_generated: true,
        }).select('id').single()
        if (pe) throw pe
        currentPlanId = np.id
        setPlanId(currentPlanId)
      } else {
        await sb.from('weekly_plans').update({ status: 'confirmed' }).eq('id', currentPlanId)
      }

      await sb.from('planned_meals').delete().eq('weekly_plan_id', currentPlanId)

      const meals = plan.map(slot => {
        let startCooking = null
        if (!slot.is_skipped && slot.recipe?.total_time_mins) {
          // Default dinner at 6pm, calculate back
          const mins = slot.recipe.total_time_mins
          const dinnerH = 18, dinnerM = 0
          let startM = dinnerH * 60 + dinnerM - mins
          const sh = Math.floor(startM / 60)
          const sm = startM % 60
          startCooking = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`
        }
        return {
          weekly_plan_id: currentPlanId,
          profile_id: userId,
          recipe_id: slot.recipe_id?.startsWith('sys-') ? null : (slot.recipe_id || null),
          meal_date: slot.date,
          servings: slot.recipe?.base_servings || 4,
          is_skipped: slot.is_skipped || false,
          skip_reason: slot.skip_reason || null,
          start_cooking_at: startCooking,
        }
      })

      const { error: me } = await sb.from('planned_meals').insert(meals)
      if (me) throw me

      setPlanStatus('confirmed')
      router.push('/grocery')
    } catch (e) {
      console.error(e)
      setError(`Could not confirm plan: ${e.message}`)
    }
    setConfirming(false)
  }

  if (!mounted) return null

  return (
    <div className="plan-root">
      <style>{css}</style>

      <div className="plan-hd">
        <div>
          <h1>Weekly <em>Plan</em></h1>
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'.5rem',marginTop:'.3rem'}}>
            <span className="plan-hd-sub">{weekStart ? formatWeekLabel(weekStart) : '...'}</span>
            {planStatus && <span className={`plan-status ${planStatus}`}>{planStatus === 'confirmed' ? '✓ Confirmed' : '✏️ Draft'}</span>}
          </div>
        </div>
      </div>

      <div className="week-nav">
        <button className="wn-btn"
          onClick={() => setWeekOffset(o => Math.max(o-1, -2))}
          disabled={weekOffset <= -2}
          style={{opacity: weekOffset <= -2 ? .3 : 1}}>
          ← Prev
        </button>
        <span className="week-label">
          {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `${weekOffset > 0 ? '+':''}${weekOffset} weeks`}
        </span>
        <button className="wn-btn"
          onClick={() => setWeekOffset(o => Math.min(o+1, 4))}
          disabled={weekOffset >= 4}
          style={{opacity: weekOffset >= 4 ? .3 : 1}}>
          Next →
        </button>
      </div>

      {error && <div className="plan-err">{error}</div>}

      {/* Variety prompt */}
      {showVarietyPrompt && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:200,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
          <div style={{background:'#2C2420',border:'1px solid rgba(255,255,255,.1)',
            borderRadius:'1.5rem',padding:'2.5rem',maxWidth:'420px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🍽️</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.5rem',
              color:'#F8F3EC',marginBottom:'.6rem'}}>Your vault covers this week</div>
            <div style={{fontSize:'.88rem',color:'rgba(248,243,236,.5)',lineHeight:1.7,marginBottom:'2rem'}}>
              You have enough personal recipes to fill the whole week. Would you like Dot to stick to your vault, or mix in some new ideas from our recipe database?
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
              <button onClick={() => generatePlan(false)}
                style={{background:'#B8874A',color:'#1A1612',border:'none',padding:'.9rem',
                  borderRadius:'2rem',fontFamily:"'Outfit',sans-serif",fontSize:'.95rem',
                  fontWeight:600,cursor:'pointer'}}>
                Use my vault only
              </button>
              <button onClick={() => generatePlan(true)}
                style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
                  color:'rgba(248,243,236,.7)',padding:'.9rem',borderRadius:'2rem',
                  fontFamily:"'Outfit',sans-serif",fontSize:'.92rem',cursor:'pointer'}}>
                Mix in some new recipes ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {generating && (
        <div className="generate-wrap">
          <div className="generating-card">
            <span className="gen-ico">👵</span>
            <div className="gen-title">Dot is planning your week...</div>
            <div className="gen-sub">She&apos;s going through your vault, checking your preferences and blackout days, and building a balanced week of dinners. Takes about 15 seconds.</div>
          </div>
        </div>
      )}

      {!generating && !plan && (
        <div className="generate-wrap">
          <div className="generate-card">
            <span className="generate-ico">📅</span>
            <div className="generate-title">No plan yet for this week</div>
            <div className="generate-sub">Dot will pick meals from your vault, respect your preferences and blackout days, and build a balanced week of dinners automatically.</div>
            <button className="generate-btn" onClick={() => generatePlan(null)}>✨ Generate my week →</button>
          </div>
        </div>
      )}

      {!generating && plan && (
        <>
          <div className="plan-grid">
            {plan.map(slot => {
              const tod = isToday(slot.date)
              return (
                <div key={slot.date} className="plan-day">
                  <div className="day-label">
                    <div className={`day-name${tod ? ' tod' : ''}`}>{slot.dayName?.slice(0,3)}</div>
                    <div className={`day-date${tod ? ' tod' : ''}`}>{new Date(slot.date + 'T12:00:00').getDate()}</div>
                  </div>
                  <div className="day-content">
                    {slot.is_skipped ? (
                      <div className="skip-slot"><div className="skip-label">{slot.skip_reason || 'Eating out / skipped'}</div></div>
                    ) : slot.recipe ? (
                      <div className={`recipe-slot${tod ? ' tonight' : ''}`}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:'.5rem'}}>
                          <div style={{flex:1,minWidth:0}}
                            onClick={() => slot.recipe_id && !String(slot.recipe_id).startsWith('sys-') && router.push(`/vault/${slot.recipe_id}`)}>
                            {tod && <div className="tonight-badge">☀️ Tonight</div>}
                            <div className="slot-title">{slot.recipe.title}</div>
                            <div className="slot-meta">
                              {slot.recipe.cuisine && <span>🌍 {slot.recipe.cuisine}</span>}
                              {slot.recipe.total_time_mins && <span>⏱ {slot.recipe.total_time_mins} min</span>}
                              {slot.recipe.is_favorite && <span>❤️ Favorite</span>}
                            </div>
                            {slot.start_cooking_at && planStatus === 'confirmed' && (
                              <span className="slot-cook-time">
                                Start by {new Date(`2000-01-01T${slot.start_cooking_at}`).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                          {planStatus !== 'confirmed' && (
                            <button
                              onClick={() => swapMeal(slot.date)}
                              title="Swap this meal"
                              style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
                                borderRadius:'.5rem',padding:'.3rem .55rem',fontSize:'.7rem',
                                color:'rgba(248,243,236,.4)',cursor:'pointer',transition:'all .2s',
                                fontFamily:"'Outfit',sans-serif",flexShrink:0,marginTop:'.15rem'}}>
                              ↺ Swap
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-slot"><div className="empty-label">+ Add a meal</div></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="plan-actions">
            {planStatus !== 'confirmed' ? (
              <>
                <button className="regen-btn" onClick={() => generatePlan(null)} disabled={generating}>↺ Regenerate</button>
                <button className="confirm-btn" onClick={confirmPlan} disabled={confirming}>
                  {confirming ? <><span className="sp"/>Saving...</> : '✓ Confirm & build grocery list →'}
                </button>
              </>
            ) : (
              <button className="confirm-btn" onClick={() => router.push('/grocery')}>View grocery list →</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
