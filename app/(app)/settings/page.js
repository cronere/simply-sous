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

const DIETARY_OPTIONS = ['Gluten-free','Dairy-free','Vegetarian','Vegan','Keto','Paleo','Low-carb','Nut-free','Halal','Kosher']
const ALLERGEN_OPTIONS = ['Peanuts','Tree nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish','Sesame']
const CUISINE_OPTIONS = ['American','Italian','Mexican','Chinese','Japanese','Korean','Thai','Vietnamese','Indian','Mediterranean','French','Spanish','Middle Eastern','Greek','Caribbean','Ethiopian','Brazilian','Peruvian']
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_NUMS  = [1,2,3,4,5,6,0]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;font-weight:300;background:#1A1612;color:#F8F3EC;min-height:100vh}
  .s-wrap{max-width:680px;margin:0 auto;padding:2rem 1.5rem 6rem}
  .s-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#F8F3EC;margin-bottom:.25rem}
  .s-title em{color:#B8874A;font-style:italic}
  .s-sub{font-size:.9rem;color:rgba(248,243,236,.5);margin-bottom:2rem}
  .s-section{background:#2C2420;border:1px solid rgba(255,255,255,.07);border-radius:1.25rem;margin-bottom:1.25rem;overflow:hidden}
  .s-section-hd{padding:1.1rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:.6rem}
  .s-section-icon{font-size:1.1rem}
  .s-section-title{font-size:1rem;font-weight:500;color:#F8F3EC}
  .s-section-body{padding:1.25rem 1.5rem}
  .s-row{margin-bottom:1.25rem}
  .s-row:last-child{margin-bottom:0}
  .s-label{font-size:.8rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(248,243,236,.5);margin-bottom:.5rem}
  .s-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.75rem;padding:.7rem 1rem;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:300;outline:none;transition:border-color .2s}
  .s-input:focus{border-color:rgba(184,135,74,.5)}
  .s-input::placeholder{color:rgba(248,243,236,.25)}
  select.s-input{cursor:pointer}
  .s-chips{display:flex;flex-wrap:wrap;gap:.5rem}
  .s-chip{padding:.35rem .9rem;border-radius:2rem;font-size:.85rem;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(248,243,236,.65)}
  .s-chip:hover{border-color:rgba(184,135,74,.3);color:#F8F3EC}
  .s-chip.active{background:rgba(184,135,74,.15);border-color:rgba(184,135,74,.4);color:#D4A46A}
  .s-chip.danger.active{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);color:#EF4444}
  .s-chip.day.active{background:rgba(143,168,137,.12);border-color:rgba(143,168,137,.3);color:#8FA889}
  .s-tags-input{display:flex;gap:.5rem;margin-bottom:.65rem}
  .s-tags-input input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.75rem;padding:.6rem .9rem;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:.95rem;outline:none}
  .s-tags-input input:focus{border-color:rgba(184,135,74,.4)}
  .s-tags-input input::placeholder{color:rgba(248,243,236,.25)}
  .s-add-btn{background:rgba(184,135,74,.15);border:1px solid rgba(184,135,74,.3);color:#B8874A;border-radius:.75rem;padding:.6rem 1rem;font-family:'Outfit',sans-serif;font-size:.9rem;cursor:pointer;white-space:nowrap;transition:all .2s}
  .s-add-btn:hover{background:rgba(184,135,74,.25)}
  .s-tag{display:flex;align-items:center;gap:.4rem;padding:.3rem .75rem;border-radius:2rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:.85rem;color:rgba(248,243,236,.75)}
  .s-tag-remove{background:none;border:none;color:rgba(248,243,236,.4);cursor:pointer;font-size:.9rem;line-height:1;padding:0;transition:color .2s}
  .s-tag-remove:hover{color:#EF4444}
  .s-range{display:flex;align-items:center;gap:1rem}
  .s-range input[type=range]{flex:1;accent-color:#B8874A;height:4px}
  .s-range-val{font-size:1rem;color:#B8874A;font-weight:500;min-width:60px;text-align:right}
  .s-save-bar{position:sticky;bottom:0;background:linear-gradient(to top,#1A1612 70%,transparent);padding:1.5rem 0 0;margin-top:1.5rem}
  .s-save-btn{width:100%;background:#B8874A;color:#1A1612;border:none;padding:1rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s}
  .s-save-btn:hover:not(:disabled){background:#D4A46A}
  .s-save-btn:disabled{opacity:.5;cursor:not-allowed}
  .s-danger-btn{width:100%;background:none;color:rgba(239,68,68,.7);border:1px solid rgba(239,68,68,.2);padding:.8rem;border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.95rem;cursor:pointer;transition:all .2s;margin-top:.75rem}
  .s-danger-btn:hover{background:rgba(239,68,68,.06);color:#EF4444}
  .s-success{font-size:.88rem;color:#8FA889;text-align:center;margin-top:.75rem;height:1.2rem;transition:opacity .3s}
  @keyframes spin{to{transform:rotate(360deg)}}
`

export default function SettingsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile fields
  const [familyName, setFamilyName] = useState('')
  const [familySize, setFamilySize] = useState(4)
  const [dinnerHour, setDinnerHour] = useState('17:00')

  // Preferences
  const [dietaryFlags, setDietaryFlags] = useState([])
  const [allergens, setAllergens] = useState([])
  const [cuisineLoves, setCuisineLoves] = useState([])
  const [cuisineAvoid, setCuisineAvoid] = useState([])
  const [spiceLevel, setSpiceLevel] = useState(2)
  const [maxWeeknightMins, setMaxWeeknightMins] = useState(30)
  const [maxWeekendMins, setMaxWeekendMins] = useState(60)
  const [dislikedIngredients, setDislikedIngredients] = useState([])
  const [pantryStaples, setPantryStaples] = useState([])
  const [fridgeStaples, setFridgeStaples] = useState([])

  // Blackout days
  const [blackoutDays, setBlackoutDays] = useState([])

  // Family members
  const [familyMembers, setFamilyMembers] = useState([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberMonth, setNewMemberMonth] = useState(1)
  const [newMemberYear, setNewMemberYear] = useState(new Date().getFullYear() - 5)

  // Tag inputs
  const [newDisliked, setNewDisliked] = useState('')
  const [newPantry, setNewPantry] = useState('')
  const [newFridge, setNewFridge] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const sb = getClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      loadSettings(session.user.id)
    })
  }, [mounted, router])

  const loadSettings = async (uid) => {
    const sb = getClient()
    const [profileRes, prefsRes, blackoutRes] = await Promise.all([
      sb.from('profiles').select('family_name, family_size, dinner_hour').eq('id', uid).single(),
      sb.from('user_preferences').select('*').eq('profile_id', uid).maybeSingle(),
      sb.from('blackout_days').select('day_of_week').eq('profile_id', uid),
    ])

    if (profileRes.data) {
      setFamilyName(profileRes.data.family_name || '')
      setFamilySize(profileRes.data.family_size || 4)
      if (profileRes.data.dinner_hour) {
        setDinnerHour(profileRes.data.dinner_hour.substring(0, 5))
      }
    }

    if (prefsRes.data) {
      const p = prefsRes.data
      setDietaryFlags(p.dietary_flags || [])
      setAllergens(p.allergens || [])
      setCuisineLoves(p.cuisine_loves || [])
      setCuisineAvoid(p.cuisine_avoid || [])
      setSpiceLevel(p.spice_level || 2)
      setMaxWeeknightMins(p.max_weeknight_mins || 30)
      setMaxWeekendMins(p.max_weekend_mins || 60)
      setDislikedIngredients(p.disliked_ingredients || [])
      setPantryStaples(p.pantry_staples || [])
      setFridgeStaples(p.fridge_staples || [])
    }

    if (blackoutRes.data) {
      setBlackoutDays(blackoutRes.data.map(b => b.day_of_week))
    }

    const membersRes = await sb.from('family_members').select('*').eq('profile_id', uid).order('birth_year', { ascending: true })
    if (membersRes.data) setFamilyMembers(membersRes.data)
  }

  const saveSettings = async () => {
    if (!userId) return
    setSaving(true)
    const sb = getClient()

    await Promise.all([
      sb.from('profiles').update({
        family_name: familyName,
        family_size: familySize,
        dinner_hour: dinnerHour + ':00',
      }).eq('id', userId),

      sb.from('user_preferences').upsert({
        profile_id: userId,
        dietary_flags: dietaryFlags,
        allergens: allergens,
        cuisine_loves: cuisineLoves,
        cuisine_avoid: cuisineAvoid,
        spice_level: spiceLevel,
        max_weeknight_mins: maxWeeknightMins,
        max_weekend_mins: maxWeekendMins,
        disliked_ingredients: dislikedIngredients,
        pantry_staples: pantryStaples,
        fridge_staples: fridgeStaples,
      }, { onConflict: 'profile_id' }),
    ])

    // Family members are saved individually via add/remove — no batch save needed

    // Update blackout days — delete and re-insert
    await sb.from('blackout_days').delete().eq('profile_id', userId)
    if (blackoutDays.length > 0) {
      await sb.from('blackout_days').insert(
        blackoutDays.map(d => ({ profile_id: userId, day_of_week: d }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const getAge = (month, year) => {
    const now = new Date()
    let age = now.getFullYear() - year
    if (now.getMonth() + 1 < month) age--
    return Math.max(0, age)
  }

  const getMemberLabel = (m) => {
    const age = getAge(m.birth_month, m.birth_year)
    return m.name || ('Child · ' + age + ' yr' + (age !== 1 ? 's' : ''))
  }

  const addFamilyMember = async () => {
    if (!userId) return
    const sb = getClient()
    const { data } = await sb.from('family_members').insert({
      profile_id: userId,
      name: newMemberName.trim() || null,
      birth_month: newMemberMonth,
      birth_year: newMemberYear,
      is_child: true,
    }).select().single()
    if (data) {
      setFamilyMembers(prev => [...prev, data])
      setNewMemberName('')
      setNewMemberMonth(1)
      setNewMemberYear(new Date().getFullYear() - 5)
      setShowAddMember(false)
    }
  }

  const removeFamilyMember = async (id) => {
    const sb = getClient()
    await sb.from('family_members').delete().eq('id', id)
    setFamilyMembers(prev => prev.filter(m => m.id !== id))
  }

  const signOut = async () => {
    await getClient().auth.signOut()
    router.replace('/login')
  }

  const toggleChip = (val, list, setList) => {
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  const addTag = (val, list, setList, clear) => {
    const trimmed = val.trim()
    if (!trimmed || list.includes(trimmed)) return
    setList(prev => [...prev, trimmed])
    clear('')
  }

  const removeTag = (val, list, setList) => {
    setList(prev => prev.filter(x => x !== val))
  }

  const spiceLabels = ['Mild','Medium-mild','Medium','Medium-hot','Hot']

  if (!mounted) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>
      <div className="s-wrap">
        <div className="s-title">Account <em>Settings</em></div>
        <div className="s-sub">Everything Simply Sous uses to personalize your experience</div>

        {/* Family */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">👨‍👩‍👧‍👦</span>
            <span className="s-section-title">Your Family</span>
          </div>
          <div className="s-section-body">
            <div className="s-row">
              <div className="s-label">Family Name</div>
              <input className="s-input" value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="The Smiths" />
            </div>
            <div className="s-row">
              <div className="s-label">Family Size</div>
              <div className="s-range">
                <input type="range" min={1} max={14} value={familySize} onChange={e => setFamilySize(+e.target.value)} />
                <div className="s-range-val">{familySize} {familySize === 1 ? 'person' : 'people'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dinner timing */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">🕐</span>
            <span className="s-section-title">Dinner Timing</span>
          </div>
          <div className="s-section-body">
            <div className="s-row">
              <div className="s-label">Dinner Time</div>
              <input type="time" className="s-input" value={dinnerHour} onChange={e => setDinnerHour(e.target.value)} />
            </div>
            <div className="s-row">
              <div className="s-label">Max Weeknight Cook Time — {maxWeeknightMins} min</div>
              <div className="s-range">
                <input type="range" min={10} max={90} step={5} value={maxWeeknightMins} onChange={e => setMaxWeeknightMins(+e.target.value)} />
                <div className="s-range-val">{maxWeeknightMins} min</div>
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Max Weekend Cook Time — {maxWeekendMins} min</div>
              <div className="s-range">
                <input type="range" min={15} max={180} step={15} value={maxWeekendMins} onChange={e => setMaxWeekendMins(+e.target.value)} />
                <div className="s-range-val">{maxWeekendMins} min</div>
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Cooking Days</div>
              <div style={{fontSize:'.82rem',color:'rgba(248,243,236,.4)',marginBottom:'.65rem'}}>Tap to toggle — dimmed days are nights off</div>
              <div className="s-chips">
                {DAY_NAMES.map((day, i) => {
                  const isBlackout = blackoutDays.includes(DAY_NUMS[i])
                  return (
                    <button key={day}
                      onClick={() => toggleChip(DAY_NUMS[i], blackoutDays, setBlackoutDays)}
                      style={{
                        padding:'.5rem 1rem',borderRadius:'2rem',fontSize:'.88rem',
                        fontFamily:"'Outfit',sans-serif",cursor:'pointer',transition:'all .2s',
                        border: isBlackout ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(184,135,74,.35)',
                        background: isBlackout ? 'rgba(255,255,255,.03)' : 'rgba(184,135,74,.12)',
                        color: isBlackout ? 'rgba(248,243,236,.25)' : '#D4A46A',
                        textDecoration: isBlackout ? 'line-through' : 'none',
                      }}>
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Dietary */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">🥗</span>
            <span className="s-section-title">Dietary Preferences</span>
          </div>
          <div className="s-section-body">
            <div className="s-row">
              <div className="s-label">Dietary Flags</div>
              <div className="s-chips">
                {DIETARY_OPTIONS.map(opt => (
                  <button key={opt} className={'s-chip' + (dietaryFlags.includes(opt) ? ' active' : '')}
                    onClick={() => toggleChip(opt, dietaryFlags, setDietaryFlags)}>{opt}</button>
                ))}
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Allergens — We&apos;ll never suggest these</div>
              <div className="s-chips">
                {ALLERGEN_OPTIONS.map(opt => (
                  <button key={opt} className={'s-chip danger' + (allergens.includes(opt) ? ' active' : '')}
                    onClick={() => toggleChip(opt, allergens, setAllergens)}>{opt}</button>
                ))}
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Spice Level — {spiceLabels[spiceLevel - 1]}</div>
              <div className="s-range">
                <input type="range" min={1} max={5} value={spiceLevel} onChange={e => setSpiceLevel(+e.target.value)} />
                <div className="s-range-val">{spiceLabels[spiceLevel - 1]}</div>
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Disliked Ingredients</div>
              <div className="s-tags-input">
                <input placeholder="e.g. mushrooms, olives..."
                  value={newDisliked} onChange={e => setNewDisliked(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag(newDisliked, dislikedIngredients, setDislikedIngredients, setNewDisliked)} />
                <button className="s-add-btn" onClick={() => addTag(newDisliked, dislikedIngredients, setDislikedIngredients, setNewDisliked)}>Add</button>
              </div>
              <div className="s-chips">
                {dislikedIngredients.map(item => (
                  <span key={item} className="s-tag">
                    {item}
                    <button className="s-tag-remove" onClick={() => removeTag(item, dislikedIngredients, setDislikedIngredients)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cuisines */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">🌍</span>
            <span className="s-section-title">Cuisine Preferences</span>
          </div>
          <div className="s-section-body">
            <div className="s-row">
              <div className="s-label">Cuisines We Love</div>
              <div className="s-chips">
                {CUISINE_OPTIONS.map(c => (
                  <button key={c} className={'s-chip' + (cuisineLoves.includes(c) ? ' active' : '')}
                    onClick={() => toggleChip(c, cuisineLoves, setCuisineLoves)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Cuisines to Avoid</div>
              <div className="s-chips">
                {CUISINE_OPTIONS.map(c => (
                  <button key={c} className={'s-chip danger' + (cuisineAvoid.includes(c) ? ' active' : '')}
                    onClick={() => toggleChip(c, cuisineAvoid, setCuisineAvoid)}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pantry */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">🫙</span>
            <span className="s-section-title">Pantry & Fridge</span>
          </div>
          <div className="s-section-body">
            <div className="s-row">
              <div className="s-label">Pantry Staples</div>
              <div style={{fontSize:'.82rem',color:'rgba(248,243,236,.4)',marginBottom:'.6rem'}}>Items you always have — we&apos;ll mark these as &ldquo;you probably have this&rdquo; in your grocery list</div>
              <div className="s-tags-input">
                <input placeholder="e.g. olive oil, garlic, rice..."
                  value={newPantry} onChange={e => setNewPantry(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag(newPantry, pantryStaples, setPantryStaples, setNewPantry)} />
                <button className="s-add-btn" onClick={() => addTag(newPantry, pantryStaples, setPantryStaples, setNewPantry)}>Add</button>
              </div>
              <div className="s-chips">
                {pantryStaples.map(item => (
                  <span key={item} className="s-tag">
                    {item}
                    <button className="s-tag-remove" onClick={() => removeTag(item, pantryStaples, setPantryStaples)}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="s-row">
              <div className="s-label">Fridge Staples</div>
              <div style={{fontSize:'.82rem',color:'rgba(248,243,236,.4)',marginBottom:'.6rem'}}>Items you keep stocked in your fridge</div>
              <div className="s-tags-input">
                <input placeholder="e.g. eggs, butter, cheese..."
                  value={newFridge} onChange={e => setNewFridge(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag(newFridge, fridgeStaples, setFridgeStaples, setNewFridge)} />
                <button className="s-add-btn" onClick={() => addTag(newFridge, fridgeStaples, setFridgeStaples, setNewFridge)}>Add</button>
              </div>
              <div className="s-chips">
                {fridgeStaples.map(item => (
                  <span key={item} className="s-tag">
                    {item}
                    <button className="s-tag-remove" onClick={() => removeTag(item, fridgeStaples, setFridgeStaples)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">👶</span>
            <span className="s-section-title">Children in Your Household</span>
          </div>
          <div className="s-section-body">
            <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.5)',marginBottom:'1rem',lineHeight:1.6}}>
              Adding children helps us suggest kid-friendly meals and adjust portions. Names are optional — we&apos;ll use their age instead.
            </div>

            {/* Existing members */}
            {familyMembers.map(m => {
              const age = getAge(m.birth_month, m.birth_year)
              return (
                <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'.75rem 1rem',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
                  borderRadius:'.85rem',marginBottom:'.5rem'}}>
                  <div>
                    <div style={{fontSize:'.97rem',color:'#F8F3EC'}}>{getMemberLabel(m)}</div>
                    <div style={{fontSize:'.82rem',color:'rgba(248,243,236,.45)',marginTop:'.1rem'}}>
                      {age < 3 ? 'Toddler — very simple foods' :
                       age < 6 ? 'Young child — mild flavors' :
                       age < 13 ? 'Kid — classic kid-friendly meals' :
                       'Teen — nearly adult portions'}
                    </div>
                  </div>
                  <button onClick={() => removeFamilyMember(m.id)}
                    style={{background:'none',border:'none',color:'rgba(248,243,236,.35)',
                      cursor:'pointer',fontSize:'1.1rem',padding:'.25rem',transition:'color .2s'}}
                    onMouseOver={e => e.currentTarget.style.color='#EF4444'}
                    onMouseOut={e => e.currentTarget.style.color='rgba(248,243,236,.35)'}>
                    ×
                  </button>
                </div>
              )
            })}

            {/* Add member form */}
            {showAddMember ? (
              <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'1rem',padding:'1.1rem',marginTop:'.5rem'}}>
                <div style={{fontSize:'.8rem',fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(248,243,236,.45)',marginBottom:'.75rem'}}>Add a child</div>
                <div style={{marginBottom:'.75rem'}}>
                  <div className="s-label">Name (optional)</div>
                  <input className="s-input" placeholder="Leave blank for privacy"
                    value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginBottom:'1rem'}}>
                  <div>
                    <div className="s-label">Birth Month</div>
                    <select className="s-input" value={newMemberMonth} onChange={e => setNewMemberMonth(+e.target.value)}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                        <option key={i} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="s-label">Birth Year</div>
                    <select className="s-input" value={newMemberYear} onChange={e => setNewMemberYear(+e.target.value)}>
                      {Array.from({length: 20}, (_,i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',gap:'.5rem'}}>
                  <button onClick={addFamilyMember}
                    style={{flex:1,background:'#B8874A',color:'#1A1612',border:'none',borderRadius:'2rem',
                      padding:'.7rem',fontFamily:"'Outfit',sans-serif",fontSize:'.95rem',fontWeight:600,cursor:'pointer'}}>
                    Add child
                  </button>
                  <button onClick={() => setShowAddMember(false)}
                    style={{background:'none',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',
                      padding:'.7rem 1.1rem',color:'rgba(248,243,236,.55)',fontFamily:"'Outfit',sans-serif",
                      fontSize:'.95rem',cursor:'pointer'}}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddMember(true)}
                style={{width:'100%',background:'none',border:'1px dashed rgba(255,255,255,.15)',
                  borderRadius:'.85rem',padding:'.8rem',color:'rgba(248,243,236,.45)',
                  fontFamily:"'Outfit',sans-serif",fontSize:'.95rem',cursor:'pointer',
                  transition:'all .2s',marginTop: familyMembers.length > 0 ? '.5rem' : 0}}
                onMouseOver={e => {e.currentTarget.style.borderColor='rgba(184,135,74,.3)';e.currentTarget.style.color='#B8874A'}}
                onMouseOut={e => {e.currentTarget.style.borderColor='rgba(255,255,255,.15)';e.currentTarget.style.color='rgba(248,243,236,.45)'}}>
                + Add a child
              </button>
            )}
          </div>
        </div>

        {/* Account */}
        <div className="s-section">
          <div className="s-section-hd">
            <span className="s-section-icon">👤</span>
            <span className="s-section-title">Account</span>
          </div>
          <div className="s-section-body">
            <button className="s-danger-btn" onClick={signOut}>Sign out</button>
          </div>
        </div>

        {/* Save bar */}
        <div className="s-save-bar">
          <button className="s-save-btn" onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          <div className="s-success" style={{opacity: saved ? 1 : 0}}>
            ✓ Settings saved
          </div>
        </div>
      </div>
    </div>
  )
}
