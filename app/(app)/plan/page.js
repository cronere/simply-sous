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
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0,0,0,0)
  return d
}

function formatWeekLabel(ws) {
  const end = new Date(ws)
  end.setDate(end.getDate() + 6)
  const o = { month:'short', day:'numeric' }
  return `${ws.toLocaleDateString('en-US',o)} – ${end.toLocaleDateString('en-US',o)}`
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0]
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

  const weekStartStr = weekStart?.toISOString().split('T')[0]

  useEffect(() => {
    if (!userId || !weekStartStr) return
    loadPlan()
  }, [userId, weekStartStr])

  const loadPlan = async () => {
    const sb = getClient()
    const { data } = await sb
      .from('weekly_plans')
      .select(`id, status, planned_meals (
        id, meal_date, is_skipped, skip_reason, start_cooking_at,
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
          recipe: m.recipes || null,
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

  const generatePlan = async () => {
    setGenerating(true); setError('')
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekStartDate: weekStartStr }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')
      setPlan(data.plan); setPlanStatus('draft')
    } catch (e) {
      setError(e.message || 'Could not generate plan. Please try again.')
    }
    setGenerating(false)
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
        <button className="wn-btn" onClick={() => setWeekOffset(o => o-1)}>← Prev</button>
        <span className="week-label">
          {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `${weekOffset > 0 ? '+':''}${weekOffset} weeks`}
        </span>
        <button className="wn-btn" onClick={() => setWeekOffset(o => o+1)}>Next →</button>
      </div>

      {error && <div className="plan-err">{error}</div>}

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
            <button className="generate-btn" onClick={generatePlan}>✨ Generate my week →</button>
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
                      <div className={`recipe-slot${tod ? ' tonight' : ''}`}
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
                <button className="regen-btn" onClick={generatePlan} disabled={generating}>↺ Regenerate</button>
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
