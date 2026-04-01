'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300;min-height:100vh}
  .ed{max-width:760px;margin:0 auto;padding:0 0 6rem}
  .ed-hd{display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem;
    border-bottom:1px solid rgba(255,255,255,.06);gap:1rem;flex-wrap:wrap}
  .ed-back{background:none;border:none;color:rgba(248,243,236,.65);cursor:pointer;
    font-family:'Outfit',sans-serif;font-size:1rem;display:flex;align-items:center;gap:.4rem;padding:0}
  .ed-back:hover{color:#F8F3EC}
  .ed-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#F8F3EC}
  .ed-save{background:#B8874A;color:#1A1612;border:none;padding:.65rem 1.5rem;border-radius:2rem;
    font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .2s}
  .ed-save:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px)}
  .ed-save:disabled{opacity:.5;cursor:not-allowed}
  .ed-body{padding:1.75rem 2rem}
  .ed-section{margin-bottom:2.5rem}
  .ed-section-title{font-size:.72rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;
    color:rgba(248,243,236,.50);margin-bottom:1rem;padding-bottom:.5rem;
    border-bottom:1px solid rgba(255,255,255,.06)}
  .ed-label{display:block;font-size:.82rem;font-weight:500;letter-spacing:.06em;
    text-transform:uppercase;color:rgba(248,243,236,.62);margin-bottom:.5rem}
  .ed-field{margin-bottom:1.25rem}
  .ed-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:12px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1rem;font-weight:300;outline:none;transition:border-color .2s}
  .ed-input:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .ed-input::placeholder{color:rgba(248,243,236,.28)}
  .ed-textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:12px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1rem;font-weight:300;outline:none;resize:vertical;min-height:80px;
    transition:border-color .2s;line-height:1.6}
  .ed-textarea:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .ed-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem}
  .ed-select{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:12px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1rem;outline:none;cursor:pointer;appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23B8874A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat:no-repeat;background-position:right 14px center}
  .ed-select:focus{border-color:#B8874A}
  .ed-select option{background:#2C2420}
  /* Ingredients */
  .ing-row{display:grid;grid-template-columns:5rem 5rem 1fr 1fr auto;gap:.5rem;
    align-items:start;margin-bottom:.6rem}
  .ing-del{background:none;border:none;color:rgba(248,243,236,.35);cursor:pointer;
    font-size:1.1rem;padding:.5rem;transition:color .2s;line-height:1;margin-top:.25rem}
  .ing-del:hover{color:#EF4444}
  .add-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:.75rem;padding:.65rem 1.25rem;color:rgba(248,243,236,.65);
    font-family:'Outfit',sans-serif;font-size:.95rem;cursor:pointer;transition:all .2s;
    margin-top:.5rem}
  .add-btn:hover{background:rgba(255,255,255,.09);color:#F8F3EC;border-color:rgba(184,135,74,.3)}
  /* Steps */
  .step-row{display:flex;gap:.75rem;align-items:flex-start;margin-bottom:.75rem}
  .step-n{width:2rem;height:2rem;border-radius:50%;background:rgba(184,135,74,.1);
    border:1px solid rgba(184,135,74,.2);display:flex;align-items:center;justify-content:center;
    font-size:.8rem;color:#B8874A;font-weight:500;flex-shrink:0;margin-top:.35rem}
  .step-body{flex:1;display:flex;flex-direction:column;gap:.4rem}
  .step-del{background:none;border:none;color:rgba(248,243,236,.3);cursor:pointer;
    font-size:1rem;padding:.35rem;transition:color .2s;line-height:1;flex-shrink:0;margin-top:.3rem}
  .step-del:hover{color:#EF4444}
  /* Notes */
  .ed-notes{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:12px 16px;color:#F8F3EC;font-family:'Outfit',sans-serif;
    font-size:1rem;font-weight:300;outline:none;resize:vertical;min-height:100px;
    transition:border-color .2s;line-height:1.7}
  .ed-notes:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .ed-notes::placeholder{color:rgba(248,243,236,.28)}
  .ed-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;
    color:#EF4444;font-size:.9rem;padding:10px 14px;margin:0 2rem 1rem}
  .ed-success{background:rgba(107,126,103,.1);border:1px solid rgba(107,126,103,.25);border-radius:8px;
    color:#8FA889;font-size:.9rem;padding:10px 14px;margin:0 2rem 1rem}
  .sp{width:16px;height:16px;border:2px solid rgba(26,22,18,.2);border-top-color:#1A1612;
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:5px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){
    .ed-body{padding:1.25rem}
    .ing-row{grid-template-columns:4rem 4rem 1fr auto}
    .ed-row{grid-template-columns:1fr 1fr}
  }
`

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('dinner')
  const [difficulty, setDifficulty] = useState(2)
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState(4)
  const [ingredients, setIngredients] = useState([])
  const [instructions, setInstructions] = useState([])
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    setMounted(true)
    if (!id) return
    const sb = getClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const { data, error } = await sb
        .from('recipes').select('*').eq('id', id)
        .eq('profile_id', session.user.id).maybeSingle()
      if (error || !data) { router.replace('/vault'); return }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setCuisine(data.cuisine || '')
      setMealType(data.meal_type || 'dinner')
      setDifficulty(data.difficulty || 2)
      setPrepTime(data.prep_time_mins || '')
      setCookTime(data.cook_time_mins || '')
      setServings(data.base_servings || 4)
      setIngredients(data.ingredients || [])
      setInstructions(data.instructions || [])
      setNotes(data.notes || '')
      setTags((data.tags || []).join(', '))
      setLoading(false)
    })
  }, [id, router])

  const updateIng = (i, field, val) => {
    setIngredients(prev => prev.map((ing, idx) =>
      idx === i ? { ...ing, [field]: val } : ing
    ))
  }

  const addIng = () => {
    setIngredients(prev => [...prev, { name: '', amount: null, unit: '', notes: '' }])
  }

  const removeIng = (i) => {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateStep = (i, field, val) => {
    setInstructions(prev => prev.map((s, idx) =>
      idx === i ? { ...s, [field]: val } : s
    ))
  }

  const addStep = () => {
    setInstructions(prev => [...prev, { step: prev.length + 1, text: '', timer_minutes: null }])
  }

  const removeStep = (i) => {
    setInstructions(prev =>
      prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 }))
    )
  }

  const save = async () => {
    if (!title.trim()) { setError('Recipe title is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const sb = getClient()
      const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean)
      const totalTime = prepTime && cookTime
        ? parseInt(prepTime) + parseInt(cookTime)
        : (cookTime ? parseInt(cookTime) : null)

      const { error: saveErr } = await sb.from('recipes').update({
        title: title.trim(),
        description: description.trim() || null,
        cuisine: cuisine.trim() || null,
        meal_type: mealType,
        difficulty: parseInt(difficulty),
        prep_time_mins: prepTime ? parseInt(prepTime) : null,
        cook_time_mins: cookTime ? parseInt(cookTime) : null,
        total_time_mins: totalTime,
        base_servings: parseInt(servings),
        ingredients,
        instructions,
        notes: notes.trim() || null,
        tags: tagsArr,
      }).eq('id', id)

      if (saveErr) throw saveErr
      setSuccess('Recipe saved!')
      setTimeout(() => router.push('/vault/' + id), 1000)
    } catch (e) {
      setError('Could not save. Please try again.')
      console.error(e)
    }
    setSaving(false)
  }

  if (!mounted || loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>
      <div className="ed">
        <div className="ed-hd">
          <button className="ed-back" onClick={() => router.push('/vault/' + id)}>← Back to recipe</button>
          <div className="ed-title">Edit recipe</div>
          <button className="ed-save" onClick={save} disabled={saving}>
            {saving ? <><span className="sp"/>Saving...</> : 'Save changes'}
          </button>
        </div>

        {error && <div className="ed-err">{error}</div>}
        {success && <div className="ed-success">✓ {success}</div>}

        <div className="ed-body">

          {/* Basic info */}
          <div className="ed-section">
            <div className="ed-section-title">Basic info</div>
            <div className="ed-field">
              <label className="ed-label">Title *</label>
              <input className="ed-input" type="text" value={title}
                onChange={e => setTitle(e.target.value)} placeholder="Recipe name" />
            </div>
            <div className="ed-field">
              <label className="ed-label">Description</label>
              <textarea className="ed-textarea" value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this recipe..." />
            </div>
            <div className="ed-row">
              <div className="ed-field">
                <label className="ed-label">Cuisine</label>
                <input className="ed-input" type="text" value={cuisine}
                  onChange={e => setCuisine(e.target.value)} placeholder="e.g. Italian" />
              </div>
              <div className="ed-field">
                <label className="ed-label">Meal type</label>
                <select className="ed-select" value={mealType} onChange={e => setMealType(e.target.value)}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>
              <div className="ed-field">
                <label className="ed-label">Difficulty</label>
                <select className="ed-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value={1}>⭐ Easy</option>
                  <option value={2}>⭐⭐ Medium</option>
                  <option value={3}>⭐⭐⭐ Medium-Hard</option>
                  <option value={4}>⭐⭐⭐⭐ Hard</option>
                  <option value={5}>⭐⭐⭐⭐⭐ Expert</option>
                </select>
              </div>
            </div>
            <div className="ed-row">
              <div className="ed-field">
                <label className="ed-label">Prep time (min)</label>
                <input className="ed-input" type="number" value={prepTime}
                  onChange={e => setPrepTime(e.target.value)} placeholder="15" min="0" />
              </div>
              <div className="ed-field">
                <label className="ed-label">Cook time (min)</label>
                <input className="ed-input" type="number" value={cookTime}
                  onChange={e => setCookTime(e.target.value)} placeholder="30" min="0" />
              </div>
              <div className="ed-field">
                <label className="ed-label">Servings</label>
                <input className="ed-input" type="number" value={servings}
                  onChange={e => setServings(e.target.value)} placeholder="4" min="1" max="20" />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="ed-section">
            <div className="ed-section-title">Ingredients</div>
            {ingredients.map((ing, i) => (
              <div key={i} className="ing-row">
                <input className="ed-input" type="text" value={ing.amount || ''}
                  onChange={e => updateIng(i, 'amount', e.target.value)}
                  placeholder="Amt" style={{padding:'10px 10px'}} />
                <input className="ed-input" type="text" value={ing.unit || ''}
                  onChange={e => updateIng(i, 'unit', e.target.value)}
                  placeholder="Unit" style={{padding:'10px 10px'}} />
                <input className="ed-input" type="text" value={ing.name || ''}
                  onChange={e => updateIng(i, 'name', e.target.value)}
                  placeholder="Ingredient name" />
                <input className="ed-input" type="text" value={ing.notes || ''}
                  onChange={e => updateIng(i, 'notes', e.target.value)}
                  placeholder="Note (optional)" />
                <button className="ing-del" onClick={() => removeIng(i)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={addIng}>+ Add ingredient</button>
          </div>

          {/* Instructions */}
          <div className="ed-section">
            <div className="ed-section-title">Instructions</div>
            {instructions.map((step, i) => (
              <div key={i} className="step-row">
                <div className="step-n">{i + 1}</div>
                <div className="step-body">
                  <textarea className="ed-textarea" value={step.text || ''}
                    onChange={e => updateStep(i, 'text', e.target.value)}
                    placeholder={'Step ' + (i + 1) + ' instructions...'}
                    style={{minHeight:'60px'}} />
                  <input className="ed-input" type="number"
                    value={step.timer_minutes || ''}
                    onChange={e => updateStep(i, 'timer_minutes', e.target.value || null)}
                    placeholder="Timer (minutes, optional)"
                    style={{padding:'8px 12px',fontSize:'.9rem'}} />
                </div>
                <button className="step-del" onClick={() => removeStep(i)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={addStep}>+ Add step</button>
          </div>

          {/* Tags & Notes */}
          <div className="ed-section">
            <div className="ed-section-title">Tags & notes</div>
            <div className="ed-field">
              <label className="ed-label">Tags</label>
              <input className="ed-input" type="text" value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="chicken, weeknight, under-30-min (comma separated)" />
            </div>
            <div className="ed-field">
              <label className="ed-label">Personal notes</label>
              <textarea className="ed-notes" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this recipe — substitutions you like, tips, family preferences..." />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
