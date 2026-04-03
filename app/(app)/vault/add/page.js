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
  body{background:#1A1612;color:#F8F3EC;font-family:'Outfit',sans-serif;font-weight:300;min-height:100vh}
  .add-root{min-height:100vh;background:radial-gradient(ellipse 70% 40% at 50% 0%,rgba(184,135,74,.1) 0%,transparent 60%)}
  .add-hd{display:flex;align-items:center;gap:1rem;padding:1.5rem 2rem;border-bottom:1px solid rgba(255,255,255,.06)}
  .add-back{background:none;border:none;color:rgba(248,243,236,.72);cursor:pointer;font-family:'Outfit',sans-serif;font-size:1.02rem;display:flex;align-items:center;gap:.4rem;transition:color .2s;padding:0}
  .add-back:hover{color:#F8F3EC}
  .add-hd-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:400;color:#F8F3EC}
  .add-tabs{display:flex;gap:.5rem;padding:1.5rem 2rem 0;max-width:760px;margin:0 auto}
  .add-tab{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1rem;padding:1.1rem 1rem;text-align:center;cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif}
  .add-tab:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2)}
  .add-tab.active{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.35)}
  .add-tab-ico{font-size:1.5rem;margin-bottom:.4rem;display:block}
  .add-tab-label{font-size:.85rem;font-weight:500;color:rgba(248,243,236,.88)}
  .add-tab.active .add-tab-label{color:#D4A46A}
  .add-content{max-width:760px;margin:0 auto;padding:2rem}
  .url-wrap{display:flex;gap:.75rem;margin-bottom:1rem}
  .url-input{flex:1;min-width:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:300;outline:none;transition:border-color .2s}
  .url-input:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .url-input::placeholder{color:rgba(248,243,236,.50)}
  .url-btn{background:#B8874A;color:#1A1612;border:none;padding:14px 24px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0}
  .url-btn:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px)}
  .url-btn:disabled{opacity:.5;cursor:not-allowed}
  .img-upload{border:2px dashed rgba(255,255,255,.12);border-radius:1.25rem;padding:3.5rem 2rem;text-align:center;cursor:pointer;transition:all .2s;position:relative}
  .img-upload:hover{border-color:rgba(184,135,74,.4);background:rgba(184,135,74,.04)}
  .img-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
  .img-upload-ico{font-size:3rem;margin-bottom:1rem;display:block}
  .img-upload-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#F8F3EC;margin-bottom:.5rem}
  .img-upload-sub{font-size:.97rem;color:rgba(248,243,236,.65);line-height:1.6}
  .img-preview{width:100%;max-height:300px;object-fit:contain;border-radius:.75rem;margin-top:1rem;border:1px solid rgba(255,255,255,.08)}
  .manual-area{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px 18px;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:300;outline:none;transition:border-color .2s;resize:vertical;min-height:220px;line-height:1.7}
  .manual-area:focus{border-color:#B8874A;background:rgba(184,135,74,.05)}
  .manual-area::placeholder{color:rgba(248,243,236,.50)}
  .manual-btn{width:100%;background:#B8874A;color:#1A1612;border:none;padding:14px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .2s;margin-top:.75rem}
  .manual-btn:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px)}
  .manual-btn:disabled{opacity:.5;cursor:not-allowed}
  .loading-wrap{text-align:center;padding:3rem 2rem}
  .loading-ico{font-size:3rem;margin-bottom:1rem;animation:pulse 1.5s ease infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .loading-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;margin-bottom:.5rem}
  .loading-sub{font-size:1rem;color:rgba(248,243,236,.72);line-height:1.7}
  .add-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;color:#EF4444;font-size:.97rem;padding:12px 16px;margin-bottom:1rem;line-height:1.6}
  .preview{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1.5rem;overflow:hidden;margin-top:1.5rem}
  .preview-header{padding:2rem 2rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.06)}
  .preview-tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.80rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#B8874A;background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.2);padding:.28rem .7rem;border-radius:2rem;margin-bottom:1rem}
  .preview-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:400;color:#F8F3EC;line-height:1.2;margin-bottom:.5rem}
  .preview-desc{font-size:1.02rem;color:rgba(248,243,236,.78);line-height:1.7;margin-bottom:1rem}
  .preview-meta{display:flex;flex-wrap:wrap;gap:1rem}
  .preview-meta-item{display:flex;align-items:center;gap:.4rem;font-size:.92rem;color:rgba(248,243,236,.72)}
  .preview-body{padding:1.5rem 2rem}
  .preview-section-title{font-size:.94rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(248,243,236,.60);margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid rgba(255,255,255,.05)}
  .preview-ingredients{display:flex;flex-direction:column;gap:.4rem;margin-bottom:2rem}
  .preview-ingredient{display:flex;gap:.75rem;font-size:1rem;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.04);color:rgba(248,243,236,.7)}
  .preview-amount{min-width:5rem;color:rgba(184,135,74,.8);font-weight:400}
  .preview-steps{display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem}
  .preview-step{display:flex;gap:1rem}
  .preview-step-n{width:2rem;height:2rem;border-radius:50%;background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.2);display:flex;align-items:center;justify-content:center;font-size:.87rem;color:#B8874A;font-weight:500;flex-shrink:0}
  .preview-step-t{font-size:1rem;color:rgba(248,243,236,.65);line-height:1.7;padding-top:.2rem}
  .preview-tags{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.5rem}
  .preview-pill{font-size:.84rem;padding:.25rem .65rem;border-radius:2rem;border:1px solid rgba(255,255,255,.08);color:rgba(248,243,236,.65)}
  .preview-pill.primary{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.3);color:#B8874A}
  .save-row{display:flex;gap:.75rem;padding:1.5rem 2rem;border-top:1px solid rgba(255,255,255,.06)}
  .save-btn{flex:1;background:#B8874A;color:#1A1612;border:none;padding:14px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .2s}
  .save-btn:hover{background:#D4A46A;transform:translateY(-1px)}
  .retry-btn{background:rgba(255,255,255,.06);color:rgba(248,243,236,.88);border:1px solid rgba(255,255,255,.1);padding:14px 20px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:1rem;cursor:pointer;transition:all .2s;white-space:nowrap}
  .retry-btn:hover{background:rgba(255,255,255,.1);color:#F8F3EC}
  .add-label{display:block;font-size:.84rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(248,243,236,.65);margin-bottom:.6rem}
  .hint{font-size:.94rem;color:rgba(248,243,236,.60);line-height:1.7;margin-bottom:1.25rem}
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);border-top-color:#1A1612;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* PDF batch select styles */
  .pdf-recipe-list{display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem}
  .pdf-recipe-row{display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1rem;padding:1rem 1.25rem;cursor:pointer;transition:all .2s}
  .pdf-recipe-row:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2)}
  .pdf-recipe-row.checked{background:rgba(184,135,74,.08);border-color:rgba(184,135,74,.3)}
  .pdf-checkbox{width:1.25rem;height:1.25rem;border-radius:.35rem;border:2px solid rgba(255,255,255,.2);background:none;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .pdf-recipe-row.checked .pdf-checkbox{background:#B8874A;border-color:#B8874A}
  .pdf-recipe-info{flex:1;min-width:0}
  .pdf-recipe-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#F8F3EC;line-height:1.2;margin-bottom:.2rem}
  .pdf-recipe-meta{font-size:.82rem;color:rgba(248,243,236,.45)}
  .pdf-batch-actions{display:flex;gap:.75rem;margin-bottom:1.25rem;align-items:center;flex-wrap:wrap}
  .pdf-select-all{background:none;border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.6);border-radius:2rem;padding:.4rem 1rem;font-family:'Outfit',sans-serif;font-size:.85rem;cursor:pointer;transition:all .2s}
  .pdf-select-all:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .pdf-count{font-size:.88rem;color:rgba(248,243,236,.4);margin-left:auto}
  .pdf-save-bar{position:sticky;bottom:0;background:linear-gradient(to top,#1A1612 70%,transparent);padding:1.5rem 0 0;margin-top:.5rem}

  @media(max-width:600px){
    .add-tabs{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
    .url-wrap{flex-direction:column}
    .save-row{flex-direction:column}
    .add-content{padding:1.25rem}
    .preview-body{padding:1.25rem}
    .preview-header{padding:1.25rem}
  }
`

export default function AddRecipePage() {
  const router = useRouter()
  const [method, setMethod] = useState('url')
  const [url, setUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [manualText, setManualText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)
  const [familySize, setFamilySize] = useState(4)
  const [mounted, setMounted] = useState(false)

  // PDF state
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfRecipes, setPdfRecipes] = useState([]) // extracted recipes
  const [pdfChecked, setPdfChecked] = useState({}) // {index: bool}
  const [pdfSaving, setPdfSaving] = useState(false)
  const [pdfSaved, setPdfSaved] = useState(0)

  useEffect(() => {
    setMounted(true)
    const sb = getClient()
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      const { data: profile } = await sb
        .from('profiles').select('family_size').eq('id', session.user.id).maybeSingle()
      if (profile?.family_size) setFamilySize(profile.family_size)
    }
    init()
  }, [router])

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePdf = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    setPdfRecipes([])
    setPdfChecked({})
    setError('')
  }

  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })

  const extract = async () => {
    setError(''); setRecipe(null); setLoading(true)
    try {
      let body = { familySize }
      if (method === 'url') {
        if (!url.trim()) { setError('Please enter a URL.'); setLoading(false); return }
        body = { ...body, type: 'url', url: url.trim() }
      } else if (method === 'image') {
        if (!imageFile) { setError('Please select an image.'); setLoading(false); return }
        const imageBase64 = await toBase64(imageFile)
        body = { ...body, type: 'image', imageBase64, imageType: imageFile.type }
      } else if (method === 'manual') {
        if (!manualText.trim()) { setError('Please enter the recipe text.'); setLoading(false); return }
        body = { ...body, type: 'manual', text: manualText.trim() }
      }
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error || 'Something went wrong.')
      else setRecipe(data.recipe)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const extractPdf = async () => {
    if (!pdfFile) { setError('Please select a PDF file.'); return }
    setError(''); setLoading(true); setPdfRecipes([])
    try {
      // Use FormData to bypass Next.js JSON body size limit for large PDFs
      const formData = new FormData()
      formData.append('type', 'pdf')
      formData.append('familySize', String(familySize))
      formData.append('pdf', pdfFile)
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        body: formData, // no Content-Type header — browser sets multipart boundary automatically
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Could not extract recipes from PDF.')
      } else if (data.recipes && data.recipes.length > 0) {
        setPdfRecipes(data.recipes)
        // Pre-check all recipes
        const checked = {}
        data.recipes.forEach((_, i) => { checked[i] = true })
        setPdfChecked(checked)
      } else {
        setError('No recipes found in this PDF. Try a different file.')
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const togglePdfRecipe = (i) => {
    setPdfChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const toggleAllPdf = () => {
    const allChecked = pdfRecipes.every((_, i) => pdfChecked[i])
    const newChecked = {}
    pdfRecipes.forEach((_, i) => { newChecked[i] = !allChecked })
    setPdfChecked(newChecked)
  }

  const savePdfRecipes = async () => {
    const toSave = pdfRecipes.filter((_, i) => pdfChecked[i])
    if (!toSave.length) { setError('Please select at least one recipe.'); return }
    setPdfSaving(true)
    setError('')
    const sb = getClient()
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { router.replace('/login'); return }
    const uid = session.user.id
    let saved = 0
    for (const recipe of toSave) {
      try {
        await sb.from('recipes').insert({
          profile_id: uid,
          title: recipe.title,
          description: recipe.description || null,
          source_type: 'manual',
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          prep_time_mins: recipe.prep_time_mins || null,
          cook_time_mins: recipe.cook_time_mins || null,
          base_servings: recipe.base_servings || familySize,
          cuisine: recipe.cuisine || null,
          meal_type: recipe.meal_type || 'dinner',
          difficulty: recipe.difficulty || 2,
          tags: recipe.tags || [],
          dietary_flags: recipe.dietary_flags || [],
          ai_processed: true,
        })
        saved++
      } catch (e) {
        console.error('Failed to save:', recipe.title, e)
      }
    }
    setPdfSaved(saved)
    setPdfSaving(false)
    setTimeout(() => router.push('/vault'), 1500)
  }

  const saveRecipe = async () => {
    if (!recipe || !userId) return
    setSaving(true); setError('')
    try {
      const sb = getClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { error: saveErr } = await sb.from('recipes').insert({
        profile_id: session.user.id,
        title: recipe.title,
        description: recipe.description || null,
        source_type: method === 'url' ? 'url' : method === 'image' ? 'screenshot' : 'manual',
        source_url: recipe.source_url || (method === 'url' ? url : null),
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time_mins: recipe.prep_time_mins || null,
        cook_time_mins: recipe.cook_time_mins || null,
        base_servings: recipe.base_servings || familySize,
        cuisine: recipe.cuisine || null,
        meal_type: recipe.meal_type || 'dinner',
        difficulty: recipe.difficulty || 2,
        tags: recipe.tags || [],
        dietary_flags: recipe.dietary_flags || [],
        ai_processed: true,
      })
      if (saveErr) { setError(`Save failed: ${saveErr.message}`); setSaving(false); return }
      router.push('/vault')
    } catch (e) {
      setError(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  const formatAmount = (ing) => {
    if (!ing.amount && !ing.unit) return '—'
    return [ing.amount ? String(ing.amount) : '', ing.unit || ''].filter(Boolean).join(' ')
  }

  const checkedCount = Object.values(pdfChecked).filter(Boolean).length

  if (!mounted) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="add-root">
      <style>{css}</style>

      <div className="add-hd">
        <button className="add-back" onClick={() => router.push('/vault')}>← Vault</button>
        <div className="add-hd-title">Add a recipe</div>
      </div>

      <div className="add-tabs">
        {[
          { id: 'url',    ico: '🔗', label: 'Paste a URL' },
          { id: 'image',  ico: '📸', label: 'Upload photo' },
          { id: 'pdf',    ico: '📄', label: 'Import PDF' },
          { id: 'manual', ico: '✍️', label: 'Type it in' },
        ].map(tab => (
          <div key={tab.id}
            className={`add-tab${method === tab.id ? ' active' : ''}`}
            onClick={() => { setMethod(tab.id); setError(''); setRecipe(null); setPdfRecipes([]) }}>
            <span className="add-tab-ico">{tab.ico}</span>
            <div className="add-tab-label">{tab.label}</div>
          </div>
        ))}
      </div>

      <div className="add-content">
        {error && <div className="add-err">{error}</div>}

        {loading && (
          <div className="loading-wrap">
            <span className="loading-ico">👵</span>
            <div className="loading-title">
              {method === 'pdf' ? 'Dot is reading your recipe book...' : 'Dot is on it...'}
            </div>
            <div className="loading-sub">
              {method === 'pdf'
                ? "She's going through every page, identifying each recipe, and organizing them for your vault. This may take 30–60 seconds for longer documents."
                : <>She&apos;s reading your {method === 'url' ? 'recipe page' : method === 'image' ? 'image' : 'text'}, pulling out every ingredient and step, and tagging it all for your vault. Takes about 10–15 seconds.</>
              }
            </div>
          </div>
        )}

        {!loading && !recipe && pdfRecipes.length === 0 && (
          <>
            {method === 'url' && (
              <div>
                <label className="add-label">Recipe URL</label>
                <p className="hint">Paste a link from any recipe website — AllRecipes, NYT Cooking, Half Baked Harvest, Food Network, or any food blog.</p>
                <div className="url-wrap">
                  <input className="url-input" type="url"
                    placeholder="https://www.allrecipes.com/recipe/..."
                    value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && extract()} />
                  <button className="url-btn" onClick={extract} disabled={!url.trim()}>Extract →</button>
                </div>
              </div>
            )}

            {method === 'image' && (
              <div>
                <label className="add-label">Photo or screenshot</label>
                <p className="hint">Upload a screenshot from Instagram, TikTok, or Pinterest — or a photo of a cookbook page or recipe card.</p>
                <div className="img-upload">
                  <input type="file" accept="image/*" onChange={handleImage} />
                  {imagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="img-preview" />
                      <div style={{marginTop:'1rem',fontSize:'.85rem',color:'rgba(248,243,236,.4)'}}>
                        {imageFile?.name} · Tap to change
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="img-upload-ico">📱</span>
                      <div className="img-upload-title">Drop image or tap to browse</div>
                      <div className="img-upload-sub">Instagram/TikTok screenshots · Cookbook photos · Recipe cards<br/>JPG, PNG, WEBP · Max 10MB</div>
                    </>
                  )}
                </div>
                {imageFile && <button className="manual-btn" onClick={extract} disabled={loading}>Extract recipe →</button>}
              </div>
            )}

            {method === 'pdf' && (
              <div>
                <label className="add-label">Recipe book PDF</label>
                <p className="hint">Upload a PDF with one or many recipes — a family recipe book, cookbook export, or any PDF with recipe content. Dot will find every recipe and let you choose which ones to save.</p>
                <div className="img-upload">
                  <input type="file" accept="application/pdf,.pdf" onChange={handlePdf} />
                  {pdfFile ? (
                    <div style={{padding:'1rem 0'}}>
                      <span style={{fontSize:'2.5rem',display:'block',marginBottom:'.75rem'}}>📄</span>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color:'#F8F3EC',marginBottom:'.35rem'}}>{pdfFile.name}</div>
                      <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.4)'}}>
                        {(pdfFile.size / 1024 / 1024).toFixed(1)} MB · Tap to change
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="img-upload-ico">📄</span>
                      <div className="img-upload-title">Drop PDF or tap to browse</div>
                      <div className="img-upload-sub">Family recipe books · Cookbook exports · Any PDF with recipes<br/>PDF files only</div>
                    </>
                  )}
                </div>
                {pdfFile && (
                  <button className="manual-btn" onClick={extractPdf} disabled={loading}>
                    Find all recipes →
                  </button>
                )}
              </div>
            )}

            {method === 'manual' && (
              <div>
                <label className="add-label">Recipe text</label>
                <p className="hint">Paste or type the recipe — ingredients, steps, whatever you have. Dot will clean it up and organize everything.</p>
                <textarea className="manual-area"
                  placeholder={`Paste your recipe here. For example:\n\nChicken Tikka Masala\nServes 4\n\nIngredients:\n- 2 lbs chicken breast\n- 1 cup yogurt\n...\n\nInstructions:\n1. Marinate chicken...`}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)} />
                <button className="manual-btn" onClick={extract} disabled={!manualText.trim() || loading}>
                  Extract &amp; structure recipe →
                </button>
              </div>
            )}
          </>
        )}

        {/* PDF batch results */}
        {!loading && pdfRecipes.length > 0 && (
          <div>
            <div style={{marginBottom:'1.25rem'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.5rem',color:'#F8F3EC',marginBottom:'.35rem'}}>
                Found {pdfRecipes.length} recipe{pdfRecipes.length !== 1 ? 's' : ''}
              </div>
              <div style={{fontSize:'.92rem',color:'rgba(248,243,236,.5)'}}>
                All selected by default — uncheck any you don&apos;t want to save.
              </div>
            </div>

            <div className="pdf-batch-actions">
              <button className="pdf-select-all" onClick={toggleAllPdf}>
                {pdfRecipes.every((_, i) => pdfChecked[i]) ? 'Deselect all' : 'Select all'}
              </button>
              <div className="pdf-count">{checkedCount} of {pdfRecipes.length} selected</div>
            </div>

            <div className="pdf-recipe-list">
              {pdfRecipes.map((r, i) => (
                <div key={i}
                  className={`pdf-recipe-row${pdfChecked[i] ? ' checked' : ''}`}
                  onClick={() => togglePdfRecipe(i)}>
                  <div className="pdf-checkbox">
                    {pdfChecked[i] && <span style={{color:'#1A1612',fontSize:'.8rem',fontWeight:700}}>✓</span>}
                  </div>
                  <div className="pdf-recipe-info">
                    <div className="pdf-recipe-title">{r.title}</div>
                    <div className="pdf-recipe-meta">
                      {[r.cuisine, r.cook_time_mins ? `${r.cook_time_mins} min` : null, r.base_servings ? `Serves ${r.base_servings}` : null]
                        .filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pdf-save-bar">
              {pdfSaved > 0 ? (
                <div style={{textAlign:'center',padding:'1rem',color:'#8FA889',fontSize:'1rem'}}>
                  ✓ Saved {pdfSaved} recipe{pdfSaved !== 1 ? 's' : ''} to your vault!
                </div>
              ) : (
                <div style={{display:'flex',gap:'.75rem'}}>
                  <button className="retry-btn" onClick={() => { setPdfRecipes([]); setPdfFile(null) }}>
                    ← Start over
                  </button>
                  <button className="save-btn" onClick={savePdfRecipes} disabled={pdfSaving || checkedCount === 0}>
                    {pdfSaving
                      ? <><span className="sp"/>Saving {checkedCount} recipes...</>
                      : `Save ${checkedCount} recipe${checkedCount !== 1 ? 's' : ''} to vault →`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Single recipe preview */}
        {!loading && recipe && (
          <div className="preview">
            <div className="preview-header">
              <div className="preview-tag">✦ AI extracted · Review before saving</div>
              <div className="preview-title">{recipe.title}</div>
              {recipe.description && <div className="preview-desc">{recipe.description}</div>}
              <div className="preview-meta">
                {recipe.cuisine && <div className="preview-meta-item">🌍 {recipe.cuisine}</div>}
                {recipe.prep_time_mins && <div className="preview-meta-item">⏱ Prep {recipe.prep_time_mins} min</div>}
                {recipe.cook_time_mins && <div className="preview-meta-item">🔥 Cook {recipe.cook_time_mins} min</div>}
                {recipe.base_servings && <div className="preview-meta-item">👨‍👩‍👧‍👦 Serves {recipe.base_servings}</div>}
              </div>
            </div>
            <div className="preview-body">
              {recipe.tags?.length > 0 && (
                <div style={{marginBottom:'1.5rem'}}>
                  <div className="preview-section-title">Tags</div>
                  <div className="preview-tags">
                    {recipe.dietary_flags?.map(f => <span key={f} className="preview-pill primary">{f}</span>)}
                    {recipe.tags.map(t => <span key={t} className="preview-pill">{t}</span>)}
                  </div>
                </div>
              )}
              <div className="preview-section-title">Ingredients · Scaled for {recipe.base_servings} servings</div>
              <div className="preview-ingredients">
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} className="preview-ingredient">
                    <span className="preview-amount">{formatAmount(ing)}</span>
                    <span>{ing.name}{ing.notes ? `, ${ing.notes}` : ''}</span>
                  </div>
                ))}
              </div>
              <div className="preview-section-title">Instructions</div>
              <div className="preview-steps">
                {recipe.instructions?.map((step, i) => (
                  <div key={i} className="preview-step">
                    <div className="preview-step-n">{step.step || i + 1}</div>
                    <div className="preview-step-t">
                      {step.text}
                      {step.timer_minutes && (
                        <span style={{display:'inline-block',marginLeft:'.5rem',fontSize:'.75rem',color:'#B8874A',background:'rgba(184,135,74,.1)',padding:'.15rem .5rem',borderRadius:'1rem'}}>
                          ⏱ {step.timer_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="save-row">
              <button className="retry-btn" onClick={() => { setRecipe(null); setError('') }}>← Try again</button>
              <button className="save-btn" onClick={saveRecipe} disabled={saving}>
                {saving ? <><span className="sp"/>Saving...</> : 'Save to vault →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
