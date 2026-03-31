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

  .rp{min-height:100vh;background:#1A1612;max-width:780px;margin:0 auto;padding:0 0 6rem}

  /* Header */
  .rp-hd{display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem;
    border-bottom:1px solid rgba(255,255,255,.06);gap:1rem;flex-wrap:wrap}
  .rp-back{background:none;border:none;color:rgba(248,243,236,.4);cursor:pointer;
    font-family:'Outfit',sans-serif;font-size:.9rem;display:flex;align-items:center;
    gap:.4rem;transition:color .2s;padding:0}
  .rp-back:hover{color:#F8F3EC}
  .rp-hd-actions{display:flex;align-items:center;gap:.75rem}
  .rp-fav-btn{background:none;border:1px solid rgba(255,255,255,.1);border-radius:2rem;
    padding:.5rem 1rem;font-size:.85rem;cursor:pointer;transition:all .2s;
    font-family:'Outfit',sans-serif;color:rgba(248,243,236,.5);display:flex;align-items:center;gap:.4rem}
  .rp-fav-btn:hover{border-color:rgba(184,135,74,.4);color:#B8874A}
  .rp-fav-btn.loved{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.3);color:#EF4444}
  .rp-delete-btn{background:none;border:1px solid rgba(239,68,68,.2);border-radius:2rem;
    padding:.5rem 1rem;font-size:.85rem;cursor:pointer;transition:all .2s;
    font-family:'Outfit',sans-serif;color:rgba(239,68,68,.5);display:flex;align-items:center;gap:.4rem}
  .rp-delete-btn:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.5);color:#EF4444}

  /* Hero */
  .rp-hero{padding:2rem 2rem 1.5rem}
  .rp-source{font-size:.68rem;color:rgba(248,243,236,.25);letter-spacing:.1em;
    text-transform:uppercase;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
  .rp-title{font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,5vw,2.8rem);
    font-weight:300;color:#F8F3EC;line-height:1.1;margin-bottom:.75rem}
  .rp-desc{font-size:.95rem;color:rgba(248,243,236,.45);line-height:1.8;margin-bottom:1.25rem}
  .rp-meta{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
  .rp-meta-item{display:flex;align-items:center;gap:.4rem;font-size:.85rem;
    color:rgba(248,243,236,.5);background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07);border-radius:2rem;padding:.4rem .9rem}
  .rp-tags{display:flex;flex-wrap:wrap;gap:.4rem}
  .rp-tag{font-size:.72rem;padding:.25rem .65rem;border-radius:2rem;
    border:1px solid rgba(255,255,255,.08);color:rgba(248,243,236,.35)}
  .rp-tag.prim{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.3);color:#B8874A}

  /* Divider */
  .rp-divider{height:1px;background:rgba(255,255,255,.06);margin:0 2rem}

  /* Sections */
  .rp-section{padding:1.75rem 2rem}
  .rp-section-title{font-size:.68rem;font-weight:500;letter-spacing:.15em;
    text-transform:uppercase;color:rgba(248,243,236,.3);margin-bottom:1.1rem;
    display:flex;align-items:center;gap:.75rem}
  .rp-section-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}

  /* Ingredients */
  .rp-ingredients{display:flex;flex-direction:column;gap:.35rem}
  .rp-ingredient{display:flex;gap:.75rem;padding:.55rem 0;
    border-bottom:1px solid rgba(255,255,255,.04);align-items:baseline}
  .rp-ingredient:last-child{border:none}
  .rp-amt{min-width:6rem;font-size:.85rem;color:#B8874A;font-weight:400}
  .rp-ing-name{font-size:.9rem;color:rgba(248,243,236,.75)}
  .rp-ing-note{font-size:.78rem;color:rgba(248,243,236,.3);margin-left:.35rem;font-style:italic}

  /* Instructions */
  .rp-steps{display:flex;flex-direction:column;gap:1.25rem}
  .rp-step{display:flex;gap:1rem;align-items:flex-start}
  .rp-step-n{width:2.25rem;height:2.25rem;border-radius:50%;background:rgba(184,135,74,.1);
    border:1px solid rgba(184,135,74,.2);display:flex;align-items:center;justify-content:center;
    font-size:.8rem;color:#B8874A;font-weight:500;flex-shrink:0;margin-top:.1rem}
  .rp-step-body{flex:1}
  .rp-step-text{font-size:.92rem;color:rgba(248,243,236,.7);line-height:1.75}
  .rp-timer{display:inline-flex;align-items:center;gap:.35rem;margin-top:.4rem;
    font-size:.75rem;color:#B8874A;background:rgba(184,135,74,.08);
    padding:.25rem .65rem;border-radius:1rem;border:1px solid rgba(184,135,74,.15)}

  /* Delete confirm modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;
    display:flex;align-items:center;justify-content:center;padding:1.5rem}
  .modal{background:#2C2420;border:1px solid rgba(255,255,255,.1);border-radius:1.5rem;
    padding:2.5rem;max-width:420px;width:100%;text-align:center}
  .modal-ico{font-size:2.5rem;margin-bottom:1rem;display:block}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;
    color:#F8F3EC;margin-bottom:.6rem}
  .modal-sub{font-size:.88rem;color:rgba(248,243,236,.45);line-height:1.7;margin-bottom:2rem}
  .modal-actions{display:flex;gap:.75rem}
  .modal-cancel{flex:1;background:none;border:1px solid rgba(255,255,255,.12);
    color:rgba(248,243,236,.5);padding:.85rem;border-radius:.75rem;
    font-family:'Outfit',sans-serif;font-size:.9rem;cursor:pointer;transition:all .2s}
  .modal-cancel:hover{border-color:rgba(255,255,255,.3);color:#F8F3EC}
  .modal-confirm{flex:1;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);
    color:#EF4444;padding:.85rem;border-radius:.75rem;
    font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
  .modal-confirm:hover{background:rgba(239,68,68,.25);border-color:rgba(239,68,68,.5)}
  .modal-confirm:disabled{opacity:.5;cursor:not-allowed}

  /* Loading / error */
  .center-msg{display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:60vh;text-align:center;padding:2rem;gap:1rem}
  .center-msg-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC}
  .center-msg-sub{font-size:.88rem;color:rgba(248,243,236,.35)}

  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.3);border-top-color:#EF4444;
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;
    vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}

  @media(max-width:600px){
    .rp-hd{padding:1.25rem}
    .rp-hero,.rp-section{padding-left:1.25rem;padding-right:1.25rem}
    .rp-divider{margin:0 1.25rem}
    .rp-amt{min-width:5rem}
  }
`

export default function RecipePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [mounted, setMounted] = useState(false)
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showRotationPicker, setShowRotationPicker] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!id) return

    const sb = getClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }

      const { data, error } = await sb
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('profile_id', session.user.id)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
      } else {
        setRecipe(data)
      }
      setLoading(false)
    })
  }, [id, router])

  const toggleFavorite = async () => {
    if (!recipe || toggling) return
    setToggling(true)
    const sb = getClient()
    const newVal = !recipe.is_favorite
    await sb.from('recipes').update({ is_favorite: newVal }).eq('id', recipe.id)
    setRecipe(r => ({ ...r, is_favorite: newVal }))
    setToggling(false)
  }

  const setRotation = async (frequency) => {
    if (!recipe) return
    const sb = getClient()
    const inRotation = frequency !== null
    await sb.from('recipes').update({
      in_rotation: inRotation,
      rotation_frequency: frequency,
    }).eq('id', recipe.id)
    setRecipe(r => ({ ...r, in_rotation: inRotation, rotation_frequency: frequency }))
    setShowRotationPicker(false)
  }

  const deleteRecipe = async () => {
    setDeleting(true)
    const sb = getClient()
    await sb.from('recipes').delete().eq('id', recipe.id)
    router.replace('/vault')
  }

  const formatAmount = (ing) => {
    const amt = ing.amount != null ? String(ing.amount) : ''
    const unit = ing.unit || ''
    return [amt, unit].filter(Boolean).join(' ') || '—'
  }

  if (!mounted) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{css}</style>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>
      <div className="center-msg">
        <span style={{fontSize:'3rem'}}>🍽️</span>
        <div className="center-msg-title">Recipe not found</div>
        <div className="center-msg-sub">This recipe may have been deleted or doesn&apos;t belong to your vault.</div>
        <button onClick={() => router.push('/vault')}
          style={{marginTop:'1rem',background:'#B8874A',color:'#1A1612',border:'none',
            padding:'.75rem 1.75rem',borderRadius:'2rem',fontFamily:"'Outfit',sans-serif",
            fontSize:'.9rem',fontWeight:600,cursor:'pointer'}}>
          Back to vault
        </button>
      </div>
    </div>
  )

  const SOURCE_LABELS = {
    url: '🔗 Web import', screenshot: '📸 Screenshot',
    photo: '📷 Photo', manual: '✍️ Manual entry', system: '📚 Recipe database'
  }

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>

      {/* Rotation frequency picker */}
      {showRotationPicker && (
        <div className="modal-overlay" onClick={() => setShowRotationPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-ico">🔄</span>
            <div className="modal-title">Add to rotation</div>
            <div className="modal-sub">
              How often should <strong style={{color:'#F8F3EC'}}>{recipe.title}</strong> appear in your weekly plan?
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem',marginBottom:'1rem'}}>
              {[
                {value:'weekly',   label:'Every week',    sub:'In the plan every single week'},
                {value:'biweekly', label:'Every 2 weeks', sub:'Twice a month'},
                {value:'monthly',  label:'Once a month',  sub:'AI picks the best week for it'},
              ].map(opt => (
                <button key={opt.value} onClick={() => setRotation(opt.value)}
                  style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',
                    borderRadius:'10px',padding:'1rem 1.25rem',cursor:'pointer',
                    transition:'all .2s',textAlign:'left',width:'100%',fontFamily:"'Outfit',sans-serif"}}>
                  <div style={{fontSize:'.95rem',color:'#F8F3EC',fontWeight:400,marginBottom:'.2rem'}}>{opt.label}</div>
                  <div style={{fontSize:'.78rem',color:'rgba(248,243,236,.4)'}}>{opt.sub}</div>
                </button>
              ))}
            </div>
            <button className="modal-cancel" style={{width:'100%'}}
              onClick={() => setShowRotationPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-ico">🗑️</span>
            <div className="modal-title">Delete this recipe?</div>
            <div className="modal-sub">
              <strong style={{color:'#F8F3EC'}}>{recipe.title}</strong> will be permanently removed from your vault. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowDelete(false)}>
                Keep it
              </button>
              <button className="modal-confirm" onClick={deleteRecipe} disabled={deleting}>
                {deleting ? <><span className="sp"/>Deleting...</> : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rp">
        {/* Header */}
        <div className="rp-hd">
          <button className="rp-back" onClick={() => router.push('/vault')}>
            ← Vault
          </button>
          <div className="rp-hd-actions">
            <button
              className={`rp-fav-btn${recipe.is_favorite ? ' loved' : ''}`}
              onClick={toggleFavorite}
              disabled={toggling}>
              {recipe.is_favorite ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
            <button
              className="rp-fav-btn"
              onClick={() => recipe.in_rotation ? setRotation(null) : setShowRotationPicker(true)}
              style={recipe.in_rotation
                ? {background:'rgba(107,126,103,.1)',borderColor:'rgba(107,126,103,.3)',color:'#8FA889'}
                : {}}>
              {recipe.in_rotation
                ? `🔄 ${recipe.rotation_frequency === 'weekly' ? 'Weekly' : recipe.rotation_frequency === 'biweekly' ? 'Bi-weekly' : 'Monthly'}`
                : '🔄 Rotation'}
            </button>
            <button className="rp-delete-btn" onClick={() => setShowDelete(true)}>
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="rp-hero">
          <div className="rp-source">
            {SOURCE_LABELS[recipe.source_type] || '📄 Recipe'}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
                style={{color:'rgba(184,135,74,.6)',textDecoration:'none',fontSize:'.65rem'}}>
                View original →
              </a>
            )}
          </div>

          <div className="rp-title">{recipe.title}</div>

          {recipe.description && (
            <div className="rp-desc">{recipe.description}</div>
          )}

          <div className="rp-meta">
            {recipe.cuisine && <div className="rp-meta-item">🌍 {recipe.cuisine}</div>}
            {recipe.prep_time_mins && <div className="rp-meta-item">⏱ Prep {recipe.prep_time_mins} min</div>}
            {recipe.cook_time_mins && <div className="rp-meta-item">🔥 Cook {recipe.cook_time_mins} min</div>}
            {recipe.total_time_mins && <div className="rp-meta-item">⏰ Total {recipe.total_time_mins} min</div>}
            {recipe.base_servings && <div className="rp-meta-item">👨‍👩‍👧‍👦 Serves {recipe.base_servings}</div>}
            {recipe.difficulty && (
              <div className="rp-meta-item">
                {'⭐'.repeat(recipe.difficulty)} {'Easy/Medium/Medium-Hard/Hard/Expert'.split('/')[recipe.difficulty - 1]}
              </div>
            )}
          </div>

          {((recipe.tags?.length > 0) || (recipe.dietary_flags?.length > 0)) && (
            <div className="rp-tags">
              {recipe.dietary_flags?.map(f => (
                <span key={f} className="rp-tag prim">{f}</span>
              ))}
              {recipe.tags?.map(t => (
                <span key={t} className="rp-tag">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="rp-divider" />

        {/* Ingredients */}
        <div className="rp-section">
          <div className="rp-section-title">
            Ingredients · Scaled for {recipe.base_servings} servings
          </div>
          <div className="rp-ingredients">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="rp-ingredient">
                <span className="rp-amt">{formatAmount(ing)}</span>
                <span className="rp-ing-name">
                  {ing.name}
                  {ing.notes && <span className="rp-ing-note">{ing.notes}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-divider" />

        {/* Instructions */}
        <div className="rp-section">
          <div className="rp-section-title">Instructions</div>
          <div className="rp-steps">
            {recipe.instructions?.map((step, i) => (
              <div key={i} className="rp-step">
                <div className="rp-step-n">{step.step || i + 1}</div>
                <div className="rp-step-body">
                  <div className="rp-step-text">{step.text}</div>
                  {step.timer_minutes && (
                    <div className="rp-timer">⏱ {step.timer_minutes} min</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
