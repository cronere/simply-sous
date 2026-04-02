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

function getLocalDateStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0,0,0,0)
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function calcStartTime(dinnerHour, cookMins) {
  if (!dinnerHour || !cookMins) return null
  // dinnerHour is like "17:00:00"
  const parts = dinnerHour.split(':')
  const dinnerMins = parseInt(parts[0]) * 60 + parseInt(parts[1])
  const startMins = dinnerMins - cookMins
  const h = Math.floor(startMins / 60)
  const m = startMins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h)
  return h12 + ':' + String(m).padStart(2,'0') + ' ' + ampm
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;font-weight:300;background:#1A1612;color:#F8F3EC;min-height:100vh}
  .today-wrap{max-width:680px;margin:0 auto;padding:2rem 1.5rem 6rem}
  .today-eyebrow{font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:rgba(248,243,236,.45);margin-bottom:.35rem}
  .today-date{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:rgba(248,243,236,.6);margin-bottom:2rem}
  .tonight-card{background:linear-gradient(135deg,#2C2420 0%,#231E1B 100%);border:1px solid rgba(184,135,74,.2);border-radius:1.5rem;padding:2rem;margin-bottom:1.5rem;position:relative;overflow:hidden}
  .tonight-card::before{content:'';position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle at top right,rgba(184,135,74,.06),transparent 70%);pointer-events:none}
  .tonight-label{font-size:.68rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#B8874A;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
  .tonight-dot{width:6px;height:6px;border-radius:50%;background:#B8874A;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
  .tonight-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:#F8F3EC;line-height:1.15;margin-bottom:.75rem;cursor:pointer}
  .tonight-title:hover{color:#D4A46A}
  .tonight-meta{display:flex;gap:1.25rem;flex-wrap:wrap;margin-bottom:1.5rem}
  .tonight-meta-item{display:flex;align-items:center;gap:.4rem;font-size:.9rem;color:rgba(248,243,236,.65)}
  .start-time-box{background:rgba(184,135,74,.08);border:1px solid rgba(184,135,74,.2);border-radius:1rem;padding:.85rem 1.25rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between}
  .start-time-label{font-size:.78rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(248,243,236,.45)}
  .start-time-value{font-family:'Cormorant Garamond',serif;font-size:1.75rem;color:#B8874A;font-weight:400}
  .tonight-actions{display:flex;gap:.75rem;flex-wrap:wrap}
  .action-btn{display:flex;align-items:center;gap:.5rem;padding:.7rem 1.25rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:500;cursor:pointer;transition:all .2s;border:none}
  .action-btn.primary{background:#B8874A;color:#1A1612;flex:1;justify-content:center}
  .action-btn.primary:hover{background:#D4A46A;transform:translateY(-1px)}
  .action-btn.secondary{background:rgba(255,255,255,.06);color:rgba(248,243,236,.75);border:1px solid rgba(255,255,255,.1)}
  .action-btn.secondary:hover{background:rgba(255,255,255,.1);color:#F8F3EC}
  .action-btn.danger{background:rgba(239,68,68,.08);color:#EF4444;border:1px solid rgba(239,68,68,.2)}
  .action-btn.danger:hover{background:rgba(239,68,68,.15)}
  .no-plan-card{text-align:center;padding:3rem 1.5rem;background:#2C2420;border-radius:1.5rem;border:1px solid rgba(255,255,255,.06)}
  .no-plan-icon{font-size:2.5rem;margin-bottom:1rem}
  .no-plan-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;margin-bottom:.5rem}
  .no-plan-sub{font-size:.95rem;color:rgba(248,243,236,.55);line-height:1.7;margin-bottom:1.5rem}
  .cta-btn{background:#B8874A;color:#1A1612;border:none;padding:.75rem 2rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.97rem;font-weight:600;cursor:pointer;transition:all .2s}
  .cta-btn:hover{background:#D4A46A}
  .cook-mode{position:fixed;inset:0;background:#1A1612;z-index:100;overflow-y:auto;padding:2rem 1.5rem 6rem}
  .cook-mode-wrap{max-width:640px;margin:0 auto}
  .cook-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem}
  .cook-back{background:none;border:none;color:rgba(248,243,236,.6);font-family:'Outfit',sans-serif;font-size:.97rem;cursor:pointer;display:flex;align-items:center;gap:.4rem;padding:0}
  .cook-back:hover{color:#F8F3EC}
  .cook-title{font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:#F8F3EC;margin-bottom:1.5rem;line-height:1.2}
  .cook-progress{display:flex;gap:.35rem;margin-bottom:2rem}
  .cook-pip{height:3px;flex:1;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
  .cook-pip.done{background:#B8874A}
  .cook-pip.active{background:rgba(184,135,74,.5)}
  .step-card{background:#2C2420;border-radius:1.25rem;padding:1.75rem;margin-bottom:1rem;border:1px solid rgba(255,255,255,.06)}
  .step-number{font-size:.7rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:#B8874A;margin-bottom:.65rem}
  .step-text{font-size:1.05rem;color:rgba(248,243,236,.9);line-height:1.75}
  .step-timer{display:flex;align-items:center;gap:.5rem;margin-top:1rem;padding:.6rem 1rem;background:rgba(184,135,74,.08);border-radius:.75rem;font-size:.9rem;color:rgba(248,243,236,.65);width:fit-content}
  .cook-nav{display:flex;gap:.75rem;margin-top:1.5rem}
  .cook-nav-btn{flex:1;padding:.9rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:500;cursor:pointer;transition:all .2s;border:none}
  .cook-nav-btn.prev{background:rgba(255,255,255,.06);color:rgba(248,243,236,.65)}
  .cook-nav-btn.next{background:#B8874A;color:#1A1612}
  .cook-nav-btn.next:hover{background:#D4A46A}
  .cook-nav-btn.finish{background:#8FA889;color:#1A1612}
  .ingr-list{background:#2C2420;border-radius:1.25rem;padding:1.5rem;margin-bottom:1.5rem;border:1px solid rgba(255,255,255,.06)}
  .ingr-title{font-size:.7rem;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:rgba(248,243,236,.45);margin-bottom:1rem}
  .ingr-item{display:flex;justify-content:space-between;padding:.45rem 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.95rem}
  .ingr-item:last-child{border-bottom:none}
  .ingr-name{color:rgba(248,243,236,.85)}
  .ingr-amt{color:#B8874A;text-align:right}
  .rate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;display:flex;align-items:flex-end;justify-content:center}
  .rate-sheet{background:#2C2420;border-radius:1.5rem 1.5rem 0 0;width:100%;max-width:640px;padding:2rem}
  .rate-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;margin-bottom:.5rem}
  .rate-sub{font-size:.95rem;color:rgba(248,243,236,.55);margin-bottom:1.75rem}
  .rate-btns{display:flex;gap:.75rem}
  .rate-btn{flex:1;padding:1rem;border-radius:1rem;border:1px solid rgba(255,255,255,.1);background:none;font-family:'Outfit',sans-serif;font-size:.95rem;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:.4rem}
  .rate-btn:hover{background:rgba(255,255,255,.06)}
  .rate-btn .rate-emoji{font-size:1.75rem}
  .rate-btn .rate-label{font-size:.82rem;color:rgba(248,243,236,.6)}
  .skip-tonight-sheet{background:#2C2420;border-radius:1.5rem 1.5rem 0 0;width:100%;max-width:640px;padding:2rem}
  .skip-option{display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:1rem;cursor:pointer;transition:background .15s;margin-bottom:.5rem}
  .skip-option:hover{background:rgba(255,255,255,.05)}
  .skip-option-icon{font-size:1.5rem;width:2.5rem;text-align:center;flex-shrink:0}
  .skip-option-title{font-size:1rem;color:#F8F3EC;margin-bottom:.2rem}
  .skip-option-sub{font-size:.85rem;color:rgba(248,243,236,.45)}
  @keyframes spin{to{transform:rotate(360deg)}}
`

export default function TodayPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tonightMeal, setTonightMeal] = useState(null)
  const [dinnerHour, setDinnerHour] = useState(null)
  const [cookMins, setCookMins] = useState(30)
  const [planId, setPlanId] = useState(null)
  const [mealId, setMealId] = useState(null)
  const [cookMode, setCookMode] = useState(false)
  const [cookStep, setCookStep] = useState(0)
  const [showRate, setShowRate] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [rated, setRated] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [showSwap, setShowSwap] = useState(false)
  const [swapSuggestions, setSwapSuggestions] = useState([])
  const [loadingSwap, setLoadingSwap] = useState(false)

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
    loadTonight()
  }, [userId])

  const loadTonight = async () => {
    setLoading(true)
    const sb = getClient()
    const today = getLocalDateStr()
    const weekStart = getWeekStart()

    // Get profile for dinner hour
    const { data: profile } = await sb
      .from('profiles')
      .select('dinner_hour, family_size')
      .eq('id', userId)
      .single()

    if (profile) setDinnerHour(profile.dinner_hour)

    // Get user prefs for max cook time
    const { data: prefs } = await sb
      .from('user_preferences')
      .select('max_weeknight_mins')
      .eq('profile_id', userId)
      .maybeSingle()

    if (prefs && prefs.max_weeknight_mins) setCookMins(prefs.max_weeknight_mins)

    // Get this week's confirmed plan
    const { data: plans } = await sb
      .from('weekly_plans')
      .select('id, status')
      .eq('profile_id', userId)
      .eq('week_start_date', weekStart)
      .order('updated_at', { ascending: false })
      .limit(1)

    const plan = plans && plans[0]
    if (!plan || plan.status !== 'confirmed') {
      setLoading(false)
      return
    }

    setPlanId(plan.id)

    // Get tonight's meal
    const { data: meal } = await sb
      .from('planned_meals')
      .select('id, recipe_snapshot, recipes(id, title, cuisine, total_time_mins, ingredients, instructions, tags, description)')
      .eq('weekly_plan_id', plan.id)
      .eq('meal_date', today)
      .eq('is_skipped', false)
      .maybeSingle()

    if (!meal) { setLoading(false); return }

    setMealId(meal.id)

    // Use vault recipe or snapshot
    const recipe = meal.recipes || meal.recipe_snapshot

    // If system recipe, fetch full data
    if (!meal.recipes && meal.recipe_snapshot && meal.recipe_snapshot.system_recipe_id) {
      const { data: sysRecipe } = await sb
        .from('system_recipes')
        .select('*')
        .eq('id', meal.recipe_snapshot.system_recipe_id)
        .single()
      if (sysRecipe) {
        setTonightMeal(sysRecipe)
        setLoading(false)
        return
      }
    }

    setTonightMeal(recipe)
    setLoading(false)
  }

  const startCooking = () => {
    setCookStep(0)
    setCookMode(true)
  }

  const loadSwapSuggestions = async () => {
    setLoadingSwap(true)
    setShowSwap(true)
    const sb = getClient()

    // Get vault recipes excluding tonight's
    const { data: vaultRecipes } = await sb
      .from('recipes')
      .select('id, title, cuisine, total_time_mins, tags, description, ingredients')
      .eq('profile_id', userId)
      .neq('id', tonightMeal?.id || '')
      .order('is_favorite', { ascending: false })
      .limit(20)

    // Get system recipes
    const { data: sysRecipes } = await sb
      .from('system_recipes')
      .select('id, title, cuisine, total_time_mins, tags, description')
      .order('times_served', { ascending: true })
      .limit(20)

    // Pick 3 vault + 3 system, varied cuisines
    const pickDiverse = (recipes, count) => {
      const picked = []
      const usedCuisines = []
      for (const r of (recipes || [])) {
        if (picked.length >= count) break
        if (!usedCuisines.includes(r.cuisine)) {
          picked.push(r)
          usedCuisines.push(r.cuisine)
        }
      }
      // Fill remainder if not enough diverse
      for (const r of (recipes || [])) {
        if (picked.length >= count) break
        if (!picked.find(p => p.id === r.id)) picked.push(r)
      }
      return picked
    }

    const vault3 = pickDiverse(vaultRecipes, 3)
    const sys3 = pickDiverse(sysRecipes, 3).map(r => ({ ...r, isSystem: true }))

    setSwapSuggestions([...vault3, ...sys3])
    setLoadingSwap(false)
  }

  const applySwap = async (recipe) => {
    const sb = getClient()
    const today = getLocalDateStr()

    if (recipe.isSystem) {
      // Update planned meal with system recipe snapshot
      const { data: full } = await sb
        .from('system_recipes')
        .select('*')
        .eq('id', recipe.id)
        .single()

      await sb.from('planned_meals').update({
        recipe_id: null,
        notes: recipe.title,
        recipe_snapshot: {
          system_recipe_id: recipe.id,
          title: recipe.title,
          cuisine: recipe.cuisine,
          total_time_mins: recipe.total_time_mins,
          tags: recipe.tags || [],
          ingredients: full?.ingredients || [],
          instructions: full?.instructions || [],
          description: recipe.description || null,
        }
      }).eq('id', mealId)
      setTonightMeal(full || recipe)
    } else {
      // Update with vault recipe
      await sb.from('planned_meals').update({
        recipe_id: recipe.id,
        notes: recipe.title,
        recipe_snapshot: {
          id: recipe.id,
          title: recipe.title,
          cuisine: recipe.cuisine,
          total_time_mins: recipe.total_time_mins,
          tags: recipe.tags || [],
          ingredients: recipe.ingredients || [],
          description: recipe.description || null,
        }
      }).eq('id', mealId)
      setTonightMeal(recipe)
    }
    setShowSwap(false)
  }

  const handleRate = async (rating) => {
    const sb = getClient()
    setShowRate(false)
    setRated(true)

    // Update was_made and rating on planned meal
    if (mealId) {
      await sb.from('planned_meals')
        .update({ was_made: true, made_at: new Date().toISOString() })
        .eq('id', mealId)
    }

    // Update recipe average rating
    if (tonightMeal && tonightMeal.id) {
      const { data: recipe } = await sb
        .from('recipes')
        .select('times_made, average_rating')
        .eq('id', tonightMeal.id)
        .single()

      if (recipe) {
        const ratingVal = rating === 'love' ? 5 : rating === 'ok' ? 3 : 1
        const newTimes = (recipe.times_made || 0) + 1
        const newAvg = ((recipe.average_rating || 0) * (newTimes - 1) + ratingVal) / newTimes
        await sb.from('recipes')
          .update({ times_made: newTimes, average_rating: newAvg })
          .eq('id', tonightMeal.id)
      }
    }
  }

  const handleSkip = async (type) => {
    setShowSkip(false)
    const sb = getClient()

    if (type === 'swap') {
      loadSwapSuggestions()

    } else if (type === 'never') {
      // Remove from rotation — stop suggesting this recipe
      if (tonightMeal && tonightMeal.id) {
        await sb.from('recipes')
          .update({ in_rotation: false, rotation_frequency: null })
          .eq('id', tonightMeal.id)
      }
      router.push('/plan')

    } else if (type === 'tomorrow') {
      // Mark tonight's meal as skipped — plans changed
      if (mealId) {
        await sb.from('planned_meals')
          .update({ is_skipped: true, skip_reason: 'plans changed' })
          .eq('id', mealId)
      }
      setTonightMeal(null)
    }
  }

  const formatAmt = (ing) => {
    if (!ing.amount && !ing.unit) return ''
    const amt = typeof ing.amount === 'number'
      ? (Number.isInteger(ing.amount) ? ing.amount : +ing.amount.toFixed(2))
      : ing.amount
    return [amt, ing.unit].filter(Boolean).join(' ')
  }

  const today = new Date()
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()]
  const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][today.getMonth()]
  const dateStr = dayName + ', ' + monthName + ' ' + today.getDate()

  const startTime = tonightMeal ? calcStartTime(dinnerHour, tonightMeal.total_time_mins || cookMins) : null
  const instructions = (tonightMeal && tonightMeal.instructions) || []
  const ingredients = (tonightMeal && tonightMeal.ingredients) || []

  if (!mounted || loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Cook mode view
  if (cookMode && tonightMeal) {
    const step = instructions[cookStep]
    return (
      <div style={{minHeight:'100vh',background:'#1A1612'}}>
        <style>{css}</style>
        <div className="cook-mode">
          <div className="cook-mode-wrap">
            <div className="cook-hd">
              <button className="cook-back" onClick={() => setCookMode(false)}>← Back</button>
              <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.45)'}}>Step {cookStep+1} of {instructions.length}</span>
            </div>

            <div className="cook-title">{tonightMeal.title}</div>

            {/* Progress pips */}
            <div className="cook-progress">
              {instructions.map((_, i) => (
                <div key={i} className={'cook-pip' + (i < cookStep ? ' done' : i === cookStep ? ' active' : '')}/>
              ))}
            </div>

            {/* Ingredients on step 0 */}
            {cookStep === 0 && ingredients.length > 0 && (
              <div className="ingr-list">
                <div className="ingr-title">Ingredients</div>
                {ingredients.map((ing, i) => (
                  <div key={i} className="ingr-item">
                    <span className="ingr-name">{ing.name}</span>
                    <span className="ingr-amt">{formatAmt(ing)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Current step */}
            {step && (
              <div className="step-card">
                <div className="step-number">Step {cookStep + 1}</div>
                <div className="step-text">{step.text}</div>
                {step.timer_minutes && (
                  <div className="step-timer">⏱ {step.timer_minutes} min timer</div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="cook-nav">
              {cookStep > 0 && (
                <button className="cook-nav-btn prev" onClick={() => setCookStep(s => s - 1)}>← Back</button>
              )}
              {cookStep < instructions.length - 1 ? (
                <button className="cook-nav-btn next" onClick={() => setCookStep(s => s + 1)}>Next step →</button>
              ) : (
                <button className="cook-nav-btn finish" onClick={() => { setCookMode(false); setShowRate(true) }}>
                  Done! Rate dinner 🎉
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>

      <div className="today-wrap">
        <div className="today-eyebrow">Tonight</div>
        <div className="today-date">{dateStr}</div>

        {!tonightMeal ? (
          <div className="no-plan-card">
            <div className="no-plan-icon">📅</div>
            <div className="no-plan-title">No dinner planned tonight</div>
            <div className="no-plan-sub">
              {planId
                ? "Tonight isn't scheduled — enjoy a night off or add a meal to your plan."
                : "You don't have a confirmed plan for this week yet."}
            </div>
            <button className="cta-btn" onClick={() => router.push('/plan')}>
              {planId ? 'Go to plan →' : 'Create this week\'s plan →'}
            </button>
          </div>
        ) : (
          <>
            {/* Tonight's recipe card */}
            <div className="tonight-card">
              <div className="tonight-label">
                <div className="tonight-dot"/>
                Tonight&apos;s dinner
              </div>

              <div className="tonight-title" onClick={() => router.push(tonightMeal.id && !tonightMeal.system_recipe_id ? '/vault/' + tonightMeal.id : '#')}>
                {tonightMeal.title}
              </div>

              <div className="tonight-meta">
                {tonightMeal.cuisine && (
                  <div className="tonight-meta-item">🌍 {tonightMeal.cuisine}</div>
                )}
                {tonightMeal.total_time_mins && (
                  <div className="tonight-meta-item">⏱ {tonightMeal.total_time_mins} min</div>
                )}
                {ingredients.length > 0 && (
                  <div className="tonight-meta-item">🧂 {ingredients.length} ingredients</div>
                )}
              </div>

              {tonightMeal.description && (
                <p style={{fontSize:'.95rem',color:'rgba(248,243,236,.65)',lineHeight:1.7,marginBottom:'1.25rem'}}>
                  {tonightMeal.description}
                </p>
              )}

              {/* Start time */}
              {startTime && (
                <div className="start-time-box">
                  <div>
                    <div className="start-time-label">Start cooking by</div>
                    <div className="start-time-value">{startTime}</div>
                  </div>
                  <div style={{fontSize:'2rem'}}>🍳</div>
                </div>
              )}

              {/* Actions */}
              <div className="tonight-actions">
                {!rated ? (
                  <>
                    {instructions.length > 0 ? (
                      <button className="action-btn primary" onClick={startCooking}>
                        👨‍🍳 Start cooking
                      </button>
                    ) : (
                      <button className="action-btn primary" onClick={() => setShowRate(true)}>
                        ✓ Mark as made
                      </button>
                    )}
                    <button className="action-btn secondary" onClick={() => setShowSkip(true)}>
                      🔄 Not tonight
                    </button>
                  </>
                ) : (
                  <div style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.75rem 1rem',background:'rgba(143,168,137,.1)',border:'1px solid rgba(143,168,137,.2)',borderRadius:'1rem',flex:1}}>
                    <span style={{fontSize:'1.25rem'}}>✓</span>
                    <span style={{fontSize:'.95rem',color:'#8FA889'}}>Dinner logged! Enjoy your meal.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick ingredients preview */}
            {ingredients.length > 0 && (
              <div style={{background:'#2C2420',border:'1px solid rgba(255,255,255,.06)',borderRadius:'1.25rem',padding:'1.5rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'.7rem',fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(248,243,236,.4)',marginBottom:'1rem'}}>
                  Ingredients
                </div>
                {ingredients.slice(0, 6).map((ing, i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'.4rem 0',borderBottom:'1px solid rgba(255,255,255,.05)',fontSize:'.95rem'}}>
                    <span style={{color:'rgba(248,243,236,.82)'}}>{ing.name}</span>
                    <span style={{color:'#B8874A'}}>{formatAmt(ing)}</span>
                  </div>
                ))}
                {ingredients.length > 6 && (
                  <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.35)',marginTop:'.75rem',textAlign:'center'}}>
                    +{ingredients.length - 6} more ingredients
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Swap suggestions modal */}
      {showSwap && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:200,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={() => setShowSwap(false)}>
          <div style={{background:'#2C2420',borderRadius:'1.5rem',width:'100%',
            maxWidth:'520px',maxHeight:'88vh',overflow:'auto'}}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:'1.5rem 1.5rem 1rem',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.25rem'}}>
                <div style={{fontSize:'.7rem',fontWeight:500,letterSpacing:'.15em',
                  textTransform:'uppercase',color:'#B8874A'}}>✨ Dot suggests</div>
                <button onClick={() => setShowSwap(false)}
                  style={{background:'none',border:'none',color:'rgba(248,243,236,.4)',
                    fontSize:'1.2rem',cursor:'pointer',lineHeight:1}}>✕</button>
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.5rem',color:'#F8F3EC'}}>
                Something quick and easy tonight
              </div>
            </div>

            {/* Suggestions */}
            <div style={{padding:'1rem 1.25rem'}}>
              {loadingSwap ? (
                <div style={{textAlign:'center',padding:'2rem',color:'rgba(248,243,236,.45)'}}>
                  <div style={{width:20,height:20,border:'2px solid rgba(184,135,74,.2)',
                    borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite',
                    margin:'0 auto .75rem'}}/>
                  Finding options...
                </div>
              ) : (
                <>
                  {/* Vault recipes */}
                  {swapSuggestions.filter(r => !r.isSystem).length > 0 && (
                    <>
                      <div style={{fontSize:'.68rem',fontWeight:500,letterSpacing:'.14em',
                        textTransform:'uppercase',color:'rgba(248,243,236,.4)',margin:'.5rem 0 .75rem'}}>
                        From your vault
                      </div>
                      {swapSuggestions.filter(r => !r.isSystem).map(r => (
                        <div key={r.id}
                          onClick={() => applySwap(r)}
                          style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                            padding:'.9rem 1rem',borderRadius:'1rem',cursor:'pointer',
                            marginBottom:'.5rem',background:'rgba(255,255,255,.03)',
                            border:'1px solid rgba(255,255,255,.06)',transition:'all .15s'}}
                          onMouseOver={e => e.currentTarget.style.background='rgba(184,135,74,.08)'}
                          onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}>
                          <div>
                            <div style={{fontSize:'1rem',color:'#F8F3EC',marginBottom:'.25rem'}}>{r.title}</div>
                            <div style={{display:'flex',gap:'.75rem',fontSize:'.82rem',color:'rgba(248,243,236,.5)'}}>
                              {r.cuisine && <span>🌍 {r.cuisine}</span>}
                              {r.total_time_mins && <span>⏱ {r.total_time_mins} min</span>}
                            </div>
                          </div>
                          <div style={{color:'#B8874A',fontSize:'.85rem',flexShrink:0,marginLeft:'1rem'}}>
                            Tonight →
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* System recipes */}
                  {swapSuggestions.filter(r => r.isSystem).length > 0 && (
                    <>
                      <div style={{fontSize:'.68rem',fontWeight:500,letterSpacing:'.14em',
                        textTransform:'uppercase',color:'rgba(248,243,236,.4)',margin:'1rem 0 .75rem'}}>
                        ✨ From Dot
                      </div>
                      {swapSuggestions.filter(r => r.isSystem).map(r => (
                        <div key={r.id}
                          onClick={() => applySwap(r)}
                          style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                            padding:'.9rem 1rem',borderRadius:'1rem',cursor:'pointer',
                            marginBottom:'.5rem',background:'rgba(255,255,255,.03)',
                            border:'1px solid rgba(255,255,255,.06)',transition:'all .15s'}}
                          onMouseOver={e => e.currentTarget.style.background='rgba(184,135,74,.08)'}
                          onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}>
                          <div>
                            <div style={{fontSize:'1rem',color:'#F8F3EC',marginBottom:'.25rem'}}>{r.title}</div>
                            <div style={{display:'flex',gap:'.75rem',fontSize:'.82rem',color:'rgba(248,243,236,.5)'}}>
                              {r.cuisine && <span>🌍 {r.cuisine}</span>}
                              {r.total_time_mins && <span>⏱ {r.total_time_mins} min</span>}
                            </div>
                          </div>
                          <div style={{color:'#B8874A',fontSize:'.85rem',flexShrink:0,marginLeft:'1rem'}}>
                            Tonight →
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Search vault CTA */}
                  <div style={{marginTop:'1.25rem',paddingTop:'1.25rem',
                    borderTop:'1px solid rgba(255,255,255,.07)',textAlign:'center'}}>
                    <div style={{fontSize:'.88rem',color:'rgba(248,243,236,.45)',marginBottom:'.75rem'}}>
                      Don&apos;t see what you want?
                    </div>
                    <button
                      onClick={() => { setShowSwap(false); router.push('/vault') }}
                      style={{background:'none',border:'1px solid rgba(255,255,255,.15)',
                        borderRadius:'2rem',padding:'.65rem 1.75rem',
                        color:'rgba(248,243,236,.75)',fontFamily:"'Outfit',sans-serif",
                        fontSize:'.95rem',cursor:'pointer',transition:'all .2s'}}
                      onMouseOver={e => e.currentTarget.style.borderColor='rgba(184,135,74,.4)'}
                      onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}>
                      🔍 Search your vault
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating sheet */}
      {showRate && (
        <div className="rate-overlay" onClick={() => setShowRate(false)}>
          <div className="rate-sheet" onClick={e => e.stopPropagation()}>
            <div className="rate-title">How was dinner?</div>
            <div className="rate-sub">{tonightMeal?.title}</div>
            <div className="rate-btns">
              <button className="rate-btn" onClick={() => handleRate('love')}>
                <span className="rate-emoji">😍</span>
                <span className="rate-label">Loved it</span>
              </button>
              <button className="rate-btn" onClick={() => handleRate('ok')}>
                <span className="rate-emoji">😊</span>
                <span className="rate-label">It was good</span>
              </button>
              <button className="rate-btn" onClick={() => handleRate('meh')}>
                <span className="rate-emoji">😐</span>
                <span className="rate-label">Just ok</span>
              </button>
              <button className="rate-btn" onClick={() => handleRate('skip')}>
                <span className="rate-emoji">👎</span>
                <span className="rate-label">Skip next time</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip / Not tonight sheet */}
      {showSkip && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}} onClick={() => setShowSkip(false)}>
          <div style={{background:'#2C2420',borderRadius:'1.5rem',width:'100%',maxWidth:'480px',padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.4rem',color:'#F8F3EC',marginBottom:'.5rem'}}>Not feeling it tonight?</div>
            <div style={{fontSize:'.92rem',color:'rgba(248,243,236,.5)',marginBottom:'1.5rem'}}>What would you like to do?</div>

            <div className="skip-option" onClick={() => handleSkip('swap')}>
              <div className="skip-option-icon">🔄</div>
              <div>
                <div className="skip-option-title">Swap for something else</div>
                <div className="skip-option-sub">Pick a different recipe from your vault</div>
              </div>
            </div>

            <div className="skip-option" onClick={() => handleSkip('never')}>
              <div className="skip-option-icon">🚫</div>
              <div>
                <div className="skip-option-title">Remove from rotation</div>
                <div className="skip-option-sub">Stop suggesting this recipe in future plans</div>
              </div>
            </div>

            <div className="skip-option" onClick={() => handleSkip('tomorrow')}>
              <div className="skip-option-icon">📅</div>
              <div>
                <div className="skip-option-title">Plans changed tonight</div>
                <div className="skip-option-sub">Skip tonight, keep the recipe for tomorrow</div>
              </div>
            </div>

            <div className="skip-option" onClick={() => setShowSkip(false)}>
              <div className="skip-option-icon">✕</div>
              <div>
                <div className="skip-option-title">Never mind, keep it</div>
                <div className="skip-option-sub">Stick with tonight&apos;s plan</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
