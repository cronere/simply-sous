'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── DATA ────────────────────────────────────────────────────
const CUISINES = [
  'American','Mexican','Italian','Thai','Japanese','Chinese',
  'Indian','Mediterranean','French','Greek','Korean','Vietnamese',
  'Middle Eastern','Spanish','Caribbean','BBQ'
]

const DIETARY = [
  'Gluten-free','Dairy-free','Nut-free','Vegan','Vegetarian',
  'Halal','Kosher','Low-carb','Keto','Paleo','Whole30'
]

const ALLERGENS = [
  'Peanuts','Tree nuts','Shellfish','Fish','Eggs','Soy','Wheat','Milk'
]

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const FRIDGE = [
  'Eggs','Milk','Butter','Cheese','Yogurt',
  'Leftover chicken','Ground beef','Bacon',
  'Carrots','Celery','Bell peppers','Spinach','Lettuce',
  'Broccoli','Zucchini','Mushrooms','Tomatoes',
  'Lemons','Limes','Fresh ginger','Fresh herbs',
  'Condiments','Salsa','Hummus','Sour cream'
]

const PANTRY = [
  'Olive oil','Avocado oil','Garlic','Onion','Salt','Pepper',
  'Pasta','Rice','Canned tomatoes','Chicken broth','Vegetable broth',
  'Flour','Sugar','Brown sugar','Soy sauce','Fish sauce',
  'Hot sauce','Lemon juice','Apple cider vinegar',
  'Canned beans','Black beans','Chickpeas','Lentils',
  'Bread','Tortillas','Breadcrumbs','Oats',
  'Cumin','Paprika','Chili powder','Italian seasoning',
  'Garlic powder','Onion powder','Red pepper flakes','Oregano',
  'Honey','Maple syrup','Peanut butter','Coconut milk',
  'Dijon mustard','Worcestershire sauce'
]

const TIMES = [
  '4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM'
]

// ── STYLES ──────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300}

  .ob{
    min-height:100vh;
    background:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(184,135,74,.12) 0%,transparent 60%);
  }

  /* Progress */
  .ob-bar{position:fixed;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,.07);z-index:100}
  .ob-bar-fill{height:100%;background:linear-gradient(to right,#B8874A,#D4A46A);transition:width .5s cubic-bezier(.16,1,.3,1)}

  /* Header */
  .ob-hd{display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem}
  .ob-logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:#F8F3EC}
  .ob-logo span{color:#B8874A;font-style:italic}
  .ob-steps{font-size:.75rem;color:rgba(248,243,236,.65);letter-spacing:.1em;text-transform:uppercase}

  /* Content */
  .ob-main{max-width:620px;margin:0 auto;padding:2rem 2rem 8rem;animation:obIn .5s cubic-bezier(.16,1,.3,1) both}
  @keyframes obIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

  .ob-eyebrow{display:inline-flex;align-items:center;gap:.6rem;font-size:.80rem;
    font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#B8874A;margin-bottom:1.25rem}
  .ob-eyebrow::before{content:'';width:1.5rem;height:1px;background:#B8874A;opacity:.6}

  .ob-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2.2rem,5vw,3.2rem);
    font-weight:300;line-height:1.1;color:#F8F3EC;margin-bottom:.75rem}
  .ob-title em{font-style:italic;color:#B8874A}
  .ob-sub{font-size:1.05rem;color:rgba(248,243,236,.80);line-height:1.8;margin-bottom:2.5rem}

  /* Fields */
  .ob-label{display:block;font-size:.85rem;font-weight:500;letter-spacing:.08em;
    text-transform:uppercase;color:rgba(248,243,236,.72);margin-bottom:6px}
  .ob-field{margin-bottom:1.25rem}
  .ob-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:13px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1.05rem;font-weight:300;outline:none;transition:border-color .2s,background .2s}
  .ob-input:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .ob-input::placeholder{color:rgba(248,243,236,.28)}
  .ob-select{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:13px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1.05rem;outline:none;transition:border-color .2s;cursor:pointer;
    appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23B8874A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat:no-repeat;background-position:right 16px center}
  .ob-select:focus{border-color:#B8874A}
  .ob-select option{background:#2C2420;color:#F8F3EC}
  .ob-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}

  /* Pill toggles */
  .ob-pills{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem}
  .ob-pill{font-size:.82rem;padding:.45rem 1rem;border-radius:2rem;
    border:1px solid rgba(255,255,255,.1);color:rgba(248,243,236,.5);
    cursor:pointer;transition:all .2s;background:none;font-family:'Outfit',sans-serif;
    font-weight:300}
  .ob-pill:hover{border-color:rgba(184,135,74,.4);color:#B8874A}
  .ob-pill.on{background:rgba(184,135,74,.15);border-color:rgba(184,135,74,.5);
    color:#D4A46A;font-weight:400}

  /* Spice slider */
  .ob-slider-wrap{margin-top:.5rem}
  .ob-slider{width:100%;-webkit-appearance:none;height:4px;border-radius:2px;
    background:rgba(255,255,255,.1);outline:none;cursor:pointer}
  .ob-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;
    border-radius:50%;background:#B8874A;cursor:pointer;border:2px solid #1A1612;
    box-shadow:0 0 0 3px rgba(184,135,74,.2)}
  .ob-slider-labels{display:flex;justify-content:space-between;
    font-size:.85rem;color:rgba(248,243,236,.60);margin-top:.4rem}

  /* Day grid */
  .ob-days{display:grid;grid-template-columns:repeat(7,1fr);gap:.4rem;margin-top:.5rem}
  .ob-day{aspect-ratio:1;border-radius:.5rem;border:1px solid rgba(255,255,255,.1);
    display:flex;align-items:center;justify-content:center;
    font-size:.88rem;cursor:pointer;transition:all .2s;color:rgba(248,243,236,.72);
    background:none;font-family:'Outfit',sans-serif}
  .ob-day:hover{border-color:rgba(192,92,48,.4);color:#C05C30}
  .ob-day.off{background:rgba(192,92,48,.12);border-color:rgba(192,92,48,.4);color:#C05C30}

  /* File upload */
  .ob-upload{border:1.5px dashed rgba(255,255,255,.15);border-radius:1rem;
    padding:3rem 2rem;text-align:center;cursor:pointer;transition:all .2s;
    position:relative}
  .ob-upload:hover{border-color:rgba(184,135,74,.4);background:rgba(184,135,74,.04)}
  .ob-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
  .ob-upload-ico{font-size:2.5rem;margin-bottom:1rem}
  .ob-upload-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;
    color:#F8F3EC;margin-bottom:.4rem}
  .ob-upload-sub{font-size:.95rem;color:rgba(248,243,236,.68)}
  .ob-files{display:flex;flex-direction:column;gap:.5rem;margin-top:1rem}
  .ob-file{display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08);border-radius:.6rem;padding:.6rem 1rem}
  .ob-file-name{flex:1;font-size:.95rem;color:rgba(248,243,236,.85);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ob-file-remove{background:none;border:none;color:rgba(248,243,236,.3);
    cursor:pointer;font-size:1rem;padding:0;line-height:1;transition:color .2s}
  .ob-file-remove:hover{color:#EF4444}

  /* Navigation buttons */
  .ob-nav{position:fixed;bottom:0;left:0;right:0;
    background:linear-gradient(to top,#1A1612 60%,transparent);
    padding:2rem;display:flex;align-items:center;justify-content:space-between;z-index:50}
  .ob-back{background:none;border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.5);
    padding:.75rem 1.75rem;border-radius:2rem;font-family:'Outfit',sans-serif;
    font-size:1.02rem;cursor:pointer;transition:all .2s}
  .ob-back:hover{border-color:rgba(248,243,236,.3);color:#F8F3EC}
  .ob-next{background:#B8874A;color:#1A1612;border:none;padding:.85rem 2.25rem;
    border-radius:2rem;font-family:'Outfit',sans-serif;font-size:.95rem;
    font-weight:600;cursor:pointer;transition:all .2s;
    box-shadow:0 8px 24px rgba(184,135,74,.25)}
  .ob-next:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px);
    box-shadow:0 12px 32px rgba(184,135,74,.35)}
  .ob-next:disabled{opacity:.5;cursor:not-allowed}
  .ob-skip{background:none;border:none;color:rgba(248,243,236,.3);
    font-family:'Outfit',sans-serif;font-size:.85rem;cursor:pointer;
    transition:color .2s;padding:.5rem}
  .ob-skip:hover{color:rgba(248,243,236,.80)}

  /* Error */
  .ob-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);
    border-radius:8px;color:#EF4444;font-size:.82rem;padding:10px 14px;
    margin-bottom:1rem}

  /* Spinner */
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);
    border-top-color:#1A1612;border-radius:50%;
    animation:spin .7s linear infinite;display:inline-block;
    vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* Step 5 hint */
  .ob-hint{background:rgba(107,126,103,.1);border:1px solid rgba(107,126,103,.2);
    border-radius:10px;padding:1rem 1.25rem;font-size:.85rem;
    color:rgba(248,243,236,.80);line-height:1.7;margin-bottom:1.5rem}
  .ob-hint strong{color:#8FA889}

  @media(max-width:520px){
    .ob-main{padding:1.5rem 1.25rem 8rem}
    .ob-row{grid-template-columns:1fr}
    .ob-days{grid-template-columns:repeat(7,1fr)}
    .ob-day{font-size:.74rem}
    .ob-nav{padding:1.5rem 1.25rem}
  }
`

// ── STEP COMPONENTS ─────────────────────────────────────────

function Step1({ data, onChange }) {
  return (
    <div>
      <div className="ob-eyebrow">Step 1 of 5</div>
      <h1 className="ob-title">Welcome to<br /><em>Simply Sous.</em></h1>
      <p className="ob-sub">Let&apos;s start with the basics so we can personalize everything for your family.</p>

      <div className="ob-row">
        <div className="ob-field">
          <label className="ob-label">Your first name *</label>
          <input className="ob-input" type="text" placeholder="Jane"
            value={data.firstName} onChange={e => onChange('firstName', e.target.value)}
            autoComplete="given-name" autoFocus />
        </div>
        <div className="ob-field">
          <label className="ob-label">Family name</label>
          <input className="ob-input" type="text" placeholder="The Smiths"
            value={data.familyName} onChange={e => onChange('familyName', e.target.value)} />
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">How many people are you cooking for? *</label>
        <select className="ob-select" value={data.familySize}
          onChange={e => onChange('familySize', parseInt(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
      </div>

      <div className="ob-field">
        <label className="ob-label">What time is dinner? *</label>
        <select className="ob-select" value={data.dinnerHour}
          onChange={e => onChange('dinnerHour', e.target.value)}>
          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  )
}

function Step2({ data, onChange }) {
  const toggle = (field, val) => {
    const arr = data[field] || []
    onChange(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  return (
    <div>
      <div className="ob-eyebrow">Step 2 of 5</div>
      <h1 className="ob-title">Your family&apos;s<br /><em>food profile.</em></h1>
      <p className="ob-sub">This is how Dot learns what to suggest. Be as specific as you like — you can always update it later.</p>

      <div className="ob-field">
        <label className="ob-label">Cuisines you love</label>
        <div className="ob-pills">
          {CUISINES.map(c => (
            <button key={c} className={`ob-pill${(data.cuisineLoves||[]).includes(c) ? ' on' : ''}`}
              onClick={() => toggle('cuisineLoves', c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">Dietary restrictions (hard limits — AI will never suggest these)</label>
        <div className="ob-pills">
          {DIETARY.map(d => (
            <button key={d} className={`ob-pill${(data.dietaryFlags||[]).includes(d) ? ' on' : ''}`}
              onClick={() => toggle('dietaryFlags', d)}>{d}</button>
          ))}
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">Allergies</label>
        <div className="ob-pills">
          {ALLERGENS.map(a => (
            <button key={a} className={`ob-pill${(data.allergens||[]).includes(a) ? ' on' : ''}`}
              onClick={() => toggle('allergens', a)}>{a}</button>
          ))}
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">Spice tolerance — {['None','Mild','Medium','Hot','Very hot'][data.spiceLevel - 1]}</label>
        <div className="ob-slider-wrap">
          <input className="ob-slider" type="range" min="1" max="5" step="1"
            value={data.spiceLevel} onChange={e => onChange('spiceLevel', parseInt(e.target.value))} />
          <div className="ob-slider-labels">
            <span>No spice</span><span>Mild</span><span>Medium</span><span>Hot</span><span>Very hot</span>
          </div>
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">Any ingredients anyone dislikes?</label>
        <input className="ob-input" type="text" placeholder="e.g. cilantro, mushrooms, olives"
          value={data.dislikedIngredients}
          onChange={e => onChange('dislikedIngredients', e.target.value)} />
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.60)',marginTop:'.4rem'}}>
          Separate with commas. AI will avoid these when possible.
        </div>
      </div>
    </div>
  )
}

function Step3({ data, onChange }) {
  const toggleDay = (i) => {
    const days = data.blackoutDays || []
    onChange('blackoutDays', days.includes(i) ? days.filter(d => d !== i) : [...days, i])
  }

  return (
    <div>
      <div className="ob-eyebrow">Step 3 of 5</div>
      <h1 className="ob-title">Your planning<br /><em>schedule.</em></h1>
      <p className="ob-sub">Simply Sous runs on your schedule, not ours. Set it once and reminders happen automatically.</p>

      <div className="ob-row">
        <div className="ob-field">
          <label className="ob-label">Weekly planning day *</label>
          <select className="ob-select" value={data.planningDay}
            onChange={e => onChange('planningDay', parseInt(e.target.value))}>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div className="ob-field">
          <label className="ob-label">Reminder time</label>
          <select className="ob-select" value={data.planningTime}
            onChange={e => onChange('planningTime', e.target.value)}>
            {[
              '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
              '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
              '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
              '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM'
            ].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="ob-field">
        <label className="ob-label">Nights you don&apos;t cook — tap to toggle off</label>
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.62)',marginBottom:'.6rem'}}>
          AI skips these nights when building your plan.
        </div>
        <div className="ob-days">
          {DAYS.map((d, i) => (
            <button key={d}
              className={`ob-day${(data.blackoutDays||[]).includes(i) ? ' off' : ''}`}
              onClick={() => toggleDay(i)}
              title={(data.blackoutDays||[]).includes(i) ? `${d} — skipped` : d}>
              {d.slice(0, 2)}
            </button>
          ))}
        </div>
        {(data.blackoutDays||[]).length > 0 && (
          <div style={{fontSize:'.78rem',color:'rgba(192,92,48,.6)',marginTop:'.5rem'}}>
            Skipping: {(data.blackoutDays||[]).map(i => DAYS[i]).join(', ')}
          </div>
        )}
      </div>

      <div className="ob-field">
        <label className="ob-label">How long can you cook on weeknights?</label>
        <select className="ob-select" value={data.maxWeeknightMins}
          onChange={e => onChange('maxWeeknightMins', parseInt(e.target.value))}>
          <option value={20}>Under 20 minutes</option>
          <option value={30}>Under 30 minutes</option>
          <option value={45}>Under 45 minutes</option>
          <option value={60}>Under 1 hour</option>
          <option value={90}>Up to 90 minutes</option>
        </select>
      </div>

      <div className="ob-field">
        <label className="ob-label">Cooking confidence</label>
        <select className="ob-select" value={data.cookingSkill}
          onChange={e => onChange('cookingSkill', parseInt(e.target.value))}>
          <option value={1}>Beginner — simple recipes only</option>
          <option value={2}>Comfortable — standard home cooking</option>
          <option value={3}>Confident — happy to try new techniques</option>
          <option value={4}>Experienced — love a challenge</option>
          <option value={5}>Advanced — bring it on</option>
        </select>
      </div>
    </div>
  )
}

function Step4({ data, onChange }) {
  const togglePantry = (item) => {
    const arr = data.pantryStaples || []
    onChange('pantryStaples', arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const toggleFridge = (item) => {
    const arr = data.fridgeStaples || []
    onChange('fridgeStaples', arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  return (
    <div>
      <div className="ob-eyebrow">Step 4 of 5</div>
      <h1 className="ob-title">What&apos;s in your<br /><em>kitchen?</em></h1>
      <p className="ob-sub">Tell us what you keep stocked. AI uses this to prioritize meals that use what you already have — shrinking your shopping list automatically.</p>

      <div className="ob-field">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.5rem'}}>
          <label className="ob-label" style={{margin:0}}>🧊 Fridge — what do you usually have?</label>
          <button
            onClick={() => onChange('fridgeStaples', (data.fridgeStaples||[]).length === FRIDGE.length ? [] : [...FRIDGE])}
            style={{background:'none',border:'1px solid rgba(255,255,255,.18)',borderRadius:'1.5rem',
              padding:'.3rem .9rem',fontSize:'.85rem',color:'rgba(248,243,236,.70)',
              cursor:'pointer',fontFamily:"'Outfit',sans-serif",flexShrink:0}}>
            {(data.fridgeStaples||[]).length === FRIDGE.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.62)',marginBottom:'.75rem',lineHeight:1.6}}>
          These are common fridge items. Tap everything that&apos;s typically in yours.
        </div>
        <div className="ob-pills">
          {FRIDGE.map(item => (
            <button key={item}
              className={`ob-pill${(data.fridgeStaples||[]).includes(item) ? ' on' : ''}`}
              onClick={() => toggleFridge(item)}>{item}</button>
          ))}
        </div>
      </div>

      <div className="ob-field" style={{marginTop:'2rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.5rem'}}>
          <label className="ob-label" style={{margin:0}}>🫙 Pantry — what do you always keep stocked?</label>
          <button
            onClick={() => onChange('pantryStaples', (data.pantryStaples||[]).length === PANTRY.length ? [] : [...PANTRY])}
            style={{background:'none',border:'1px solid rgba(255,255,255,.18)',borderRadius:'1.5rem',
              padding:'.3rem .9rem',fontSize:'.85rem',color:'rgba(248,243,236,.70)',
              cursor:'pointer',fontFamily:"'Outfit',sans-serif",flexShrink:0}}>
            {(data.pantryStaples||[]).length === PANTRY.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.62)',marginBottom:'.75rem',lineHeight:1.6}}>
          Oils, spices, grains, canned goods — the things you never run out of.
        </div>
        <div className="ob-pills">
          {PANTRY.map(item => (
            <button key={item}
              className={`ob-pill${(data.pantryStaples||[]).includes(item) ? ' on' : ''}`}
              onClick={() => togglePantry(item)}>{item}</button>
          ))}
        </div>
      </div>

      <div className="ob-field" style={{marginTop:'1.5rem'}}>
        <label className="ob-label">Anything else? Add your own</label>
        <input className="ob-input" type="text"
          placeholder="e.g. tahini, miso paste, truffle oil"
          value={data.customPantry || ''}
          onChange={e => onChange('customPantry', e.target.value)} />
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.60)',marginTop:'.4rem'}}>
          Separate with commas. Fridge or pantry — add anything here.
        </div>
      </div>
    </div>
  )
}

function Step5({ data, onChange }) {
  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files || [])
    onChange('uploadedFiles', [...(data.uploadedFiles || []), ...newFiles])
  }

  const removeFile = (i) => {
    onChange('uploadedFiles', (data.uploadedFiles || []).filter((_, idx) => idx !== i))
  }

  const addUrl = () => {
    const url = (data.currentUrl || '').trim()
    if (!url) return
    if (!url.startsWith('http')) { onChange('urlError', 'Please enter a valid URL starting with http'); return }
    onChange('recipeUrls', [...(data.recipeUrls || []), url])
    onChange('currentUrl', '')
    onChange('urlError', '')
  }

  const removeUrl = (i) => {
    onChange('recipeUrls', (data.recipeUrls || []).filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div className="ob-eyebrow">Step 5 of 5</div>
      <h1 className="ob-title">Seed your<br /><em>recipe vault.</em></h1>
      <p className="ob-sub">Add a few recipes now to get started. Photos, screenshots, or URLs from your favorite recipe sites — AI handles the rest.</p>

      <div className="ob-hint">
        <strong>Three ways to add recipes:</strong> Paste a URL from any recipe website, upload screenshots from Instagram or TikTok, or snap photos of cookbook pages. AI extracts and organizes everything automatically.
      </div>

      {/* URL input */}
      <div className="ob-field">
        <label className="ob-label">🔗 Paste recipe URLs</label>
        <div style={{display:'flex',gap:'.5rem'}}>
          <input
            className="ob-input"
            type="url"
            placeholder="https://www.foodblog.com/chicken-tacos"
            value={data.currentUrl || ''}
            onChange={e => { onChange('currentUrl', e.target.value); onChange('urlError', '') }}
            onKeyDown={e => e.key === 'Enter' && addUrl()}
            style={{flex:1}}
          />
          <button
            onClick={addUrl}
            style={{
              background:'rgba(184,135,74,.15)',border:'1px solid rgba(184,135,74,.3)',
              color:'#D4A46A',borderRadius:'10px',padding:'0 1.25rem',
              fontFamily:"'Outfit',sans-serif",fontSize:'.9rem',cursor:'pointer',
              whiteSpace:'nowrap',transition:'all .2s'
            }}>
            Add →
          </button>
        </div>
        {data.urlError && (
          <div style={{fontSize:'.75rem',color:'#EF4444',marginTop:'.4rem'}}>{data.urlError}</div>
        )}
        <div style={{fontSize:'1rem',color:'rgba(248,243,236,.60)',marginTop:'.4rem'}}>
          Works with AllRecipes, NYT Cooking, Half Baked Harvest, Food Network, and most recipe blogs.
        </div>
      </div>

      {/* URL list */}
      {(data.recipeUrls || []).length > 0 && (
        <div className="ob-files" style={{marginBottom:'1.5rem'}}>
          {(data.recipeUrls || []).map((url, i) => (
            <div key={i} className="ob-file">
              <span style={{fontSize:'1rem'}}>🔗</span>
              <span className="ob-file-name">{url}</span>
              <button className="ob-file-remove" onClick={() => removeUrl(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* File upload */}
      <div className="ob-field">
        <label className="ob-label">📸 Upload photos or screenshots</label>
        <div className="ob-upload">
          <input type="file" multiple accept="image/*,.pdf" onChange={handleFiles} />
          <div className="ob-upload-ico">📱</div>
          <div className="ob-upload-title">Drop files or tap to browse</div>
          <div className="ob-upload-sub">Instagram/TikTok screenshots · Cookbook photos · Recipe cards · Max 10MB each</div>
        </div>
      </div>

      {(data.uploadedFiles || []).length > 0 && (
        <div className="ob-files">
          {(data.uploadedFiles || []).map((f, i) => (
            <div key={i} className="ob-file">
              <span style={{fontSize:'1rem'}}>📄</span>
              <span className="ob-file-name">{f.name}</span>
              <button className="ob-file-remove" onClick={() => removeFile(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:'1.5rem',padding:'1.25rem',background:'rgba(255,255,255,.03)',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)'}}>
        <p style={{fontSize:'1rem',color:'rgba(248,243,236,.72)',lineHeight:1.7}}>
          💡 <strong style={{color:'rgba(248,243,236,.85)'}}>Tip:</strong> Even 3–5 recipes is enough for your first week&apos;s plan. Add more anytime from the vault. Prefer to browse our built-in recipe database first? Just skip this step.
        </p>
      </div>
    </div>
  )
}

// ── MAIN ONBOARDING COMPONENT ────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    // Step 1
    firstName: '',
    familyName: '',
    familySize: 4,
    dinnerHour: '6:00 PM',
    // Step 2
    cuisineLoves: [],
    dietaryFlags: [],
    allergens: [],
    spiceLevel: 2,
    dislikedIngredients: '',
    // Step 3
    planningDay: 0,
    planningTime: '9:00 AM',
    blackoutDays: [],
    maxWeeknightMins: 45,
    cookingSkill: 2,
    // Step 4
    pantryStaples: [...PANTRY],
    fridgeStaples: [...FRIDGE],
    customPantry: '',
    // Step 5
    uploadedFiles: [],
    recipeUrls: [],
    currentUrl: '',
    urlError: '',
  })

  // Load session + any saved progress
  useEffect(() => {
    async function init() {
      const sb = getClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      // Load saved progress
      const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile) {
        // If already complete, skip to app
        if (profile.onboarding_complete) { router.replace('/today'); return }

        // Resume from saved step
        if (profile.onboarding_step > 0) setStep(profile.onboarding_step)

        // Pre-fill name from auth
        setForm(f => ({
          ...f,
          firstName: profile.full_name?.split(' ')[0] || '',
          familyName: profile.family_name || '',
          familySize: profile.family_size || 4,
          dinnerHour: profile.dinner_hour
            ? new Date(`2000-01-01T${profile.dinner_hour}`).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'})
            : '6:00 PM',
          planningDay: profile.planning_day ?? 0,
        }))
      }

      // Load preferences if saved
      const { data: prefs } = await sb
        .from('user_preferences')
        .select('*')
        .eq('profile_id', session.user.id)
        .maybeSingle()

      if (prefs) {
        setForm(f => ({
          ...f,
          cuisineLoves: prefs.cuisine_loves || [],
          dietaryFlags: prefs.dietary_flags || [],
          allergens: prefs.allergens || [],
          spiceLevel: prefs.spice_level || 2,
          dislikedIngredients: (prefs.disliked_ingredients || []).join(', '),
          pantryStaples: prefs.pantry_staples || [],
          maxWeeknightMins: prefs.max_weeknight_mins || 45,
          cookingSkill: prefs.cooking_skill || 2,
        }))
      }
    }
    init()
  }, [router])

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  // Convert "6:00 PM" to "18:00:00" for Postgres
  const toTime = (t) => {
    try {
      const [time, ampm] = t.split(' ')
      let [h, m] = time.split(':').map(Number)
      if (ampm === 'PM' && h !== 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
    } catch { return '18:00:00' }
  }

  const validate = () => {
    if (step === 1 && !form.firstName.trim()) {
      setError('Please enter your first name.'); return false
    }
    return true
  }

  const saveStep = async (nextStep) => {
    if (!validate()) return
    setSaving(true); setError('')
    const sb = getClient()

    try {
      if (step === 1) {
        await sb.from('profiles').update({
          full_name: `${form.firstName} ${form.familyName}`.trim(),
          family_name: form.familyName || null,
          family_size: form.familySize,
          dinner_hour: toTime(form.dinnerHour),
          planning_day: form.planningDay,
          onboarding_step: nextStep,
        }).eq('id', userId)
      }

      if (step === 2) {
        const disliked = form.dislikedIngredients
          .split(',').map(s => s.trim()).filter(Boolean)

        const { data: existing } = await sb
          .from('user_preferences')
          .select('id').eq('profile_id', userId).maybeSingle()

        if (existing) {
          await sb.from('user_preferences').update({
            cuisine_loves: form.cuisineLoves,
            dietary_flags: form.dietaryFlags,
            allergens: form.allergens,
            spice_level: form.spiceLevel,
            disliked_ingredients: disliked,
          }).eq('profile_id', userId)
        } else {
          await sb.from('user_preferences').insert({
            profile_id: userId,
            cuisine_loves: form.cuisineLoves,
            dietary_flags: form.dietaryFlags,
            allergens: form.allergens,
            spice_level: form.spiceLevel,
            disliked_ingredients: disliked,
            fridge_staples: [],
            pantry_staples: [],
          })
        }
        await sb.from('profiles').update({ onboarding_step: nextStep }).eq('id', userId)
      }

      if (step === 3) {
        // Save planning schedule
        const planningTimeFormatted = toTime(form.planningTime)
        await sb.from('profiles').update({
          planning_day: form.planningDay,
          planning_time: planningTimeFormatted,
          onboarding_step: nextStep,
        }).eq('id', userId)

        // Save blackout days — delete old ones first
        await sb.from('blackout_days').delete().eq('profile_id', userId)
        if (form.blackoutDays.length > 0) {
          await sb.from('blackout_days').insert(
            form.blackoutDays.map(day => ({
              profile_id: userId,
              day_of_week: day,
              label: `${DAYS[day]} — skipped`,
            }))
          )
        }

        // Save weeknight time + skill to preferences
        const { data: existing } = await sb
          .from('user_preferences')
          .select('id').eq('profile_id', userId).maybeSingle()

        if (existing) {
          await sb.from('user_preferences').update({
            max_weeknight_mins: form.maxWeeknightMins,
            cooking_skill: form.cookingSkill,
          }).eq('profile_id', userId)
        } else {
          await sb.from('user_preferences').insert({
            profile_id: userId,
            max_weeknight_mins: form.maxWeeknightMins,
            cooking_skill: form.cookingSkill,
            fridge_staples: [],
            pantry_staples: [],
          })
        }
      }

      if (step === 4) {
        // Save pantry and fridge separately
        const custom = form.customPantry.split(',').map(s => s.trim()).filter(Boolean)
        // Split custom items evenly — all go to pantry for simplicity
        const pantryAll = [...new Set([...form.pantryStaples, ...custom])]
        const fridgeAll = [...new Set([...form.fridgeStaples])]

        const { data: existing } = await sb
          .from('user_preferences')
          .select('id').eq('profile_id', userId).maybeSingle()

        if (existing) {
          await sb.from('user_preferences').update({
            pantry_staples: pantryAll,
            fridge_staples: fridgeAll,
          }).eq('profile_id', userId)
        } else {
          await sb.from('user_preferences').insert({
            profile_id: userId,
            pantry_staples: pantryAll,
            fridge_staples: fridgeAll,
          })
        }
        await sb.from('profiles').update({ onboarding_step: nextStep }).eq('id', userId)
      }

      if (step === 5) {
        // Mark onboarding complete
        await sb.from('profiles').update({
          onboarding_complete: true,
          onboarding_step: 5,
        }).eq('id', userId)

        // Trigger background processing of all onboarding uploads into vault
        // Fire and forget — don't block navigation
        fetch('/api/onboarding/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(e => console.error('Onboarding process error:', e))

        // Queue uploaded files for AI processing
        if (form.uploadedFiles.length > 0) {
          for (const file of form.uploadedFiles) {
            const path = `${userId}/${Date.now()}-${file.name.replace(/\s/g,'_')}`
            const { error: uploadErr } = await sb.storage
              .from('onboarding-uploads')
              .upload(path, file)
            if (!uploadErr) {
              await sb.from('onboarding_uploads').insert({
                profile_id: userId,
                storage_path: path,
                file_type: file.type.includes('pdf') ? 'pdf' : 'image',
                original_name: file.name,
                status: 'pending',
              })
            }
          }
        }

        // Queue recipe URLs for AI processing
        if ((form.recipeUrls || []).length > 0) {
          for (const url of form.recipeUrls) {
            await sb.from('onboarding_uploads').insert({
              profile_id: userId,
              storage_path: url,
              file_type: 'image',
              original_name: url,
              status: 'pending',
            })
          }
        }

        router.push('/today')
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setStep(nextStep)
      window.scrollTo(0, 0)
    } catch (e) {
      console.error(e)
      setError('Something went wrong saving your progress. Please try again.')
    }
    setSaving(false)
  }

  const skipStep5 = async () => {
    setSaving(true)
    const sb = getClient()
    await sb.from('profiles').update({
      onboarding_complete: true,
      onboarding_step: 5,
    }).eq('id', userId)
    router.push('/today')
  }

  const progress = (step / 5) * 100

  const stepComponents = {
    1: <Step1 data={form} onChange={update} />,
    2: <Step2 data={form} onChange={update} />,
    3: <Step3 data={form} onChange={update} />,
    4: <Step4 data={form} onChange={update} />,
    5: <Step5 data={form} onChange={update} />,
  }

  return (
    <div className="ob">
      <style>{css}</style>

      {/* Progress bar */}
      <div className="ob-bar">
        <div className="ob-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="ob-hd">
        <div className="ob-logo">Simply <span>Sous</span></div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.2rem'}}>
          <div className="ob-steps">Step {step} of 5</div>
          <div style={{fontSize:'.80rem',color:'rgba(248,243,236,.50)',letterSpacing:'.06em'}}>
            Auto-saves as you go
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="ob-main" key={step}>
        {error && <div className="ob-err">{error}</div>}
        {stepComponents[step]}
      </div>

      {/* Auto-save indicator */}
      {saved && (
        <div style={{
          position:'fixed',bottom:'6rem',left:'50%',transform:'translateX(-50%)',
          background:'rgba(107,126,103,.15)',border:'1px solid rgba(107,126,103,.3)',
          borderRadius:'2rem',padding:'.5rem 1.25rem',
          fontSize:'.8rem',color:'#8FA889',
          display:'flex',alignItems:'center',gap:'.5rem',
          zIndex:60,animation:'fadeIn .3s ease',whiteSpace:'nowrap'
        }}>
          ✓ Progress saved — you can come back anytime
        </div>
      )}

      {/* Bottom navigation */}
      <div className="ob-nav">
        <div>
          {step > 1 ? (
            <button className="ob-back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          ) : (
            <div />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {step === 5 && (
            <button className="ob-skip" onClick={skipStep5} disabled={saving}>
              Skip for now
            </button>
          )}
          <button className="ob-next" onClick={() => saveStep(step + 1)} disabled={saving}>
            {saving
              ? <><span className="sp" />Saving...</>
              : step === 5
                ? 'Finish setup →'
                : 'Continue →'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
