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

const VALID_MEAL_TYPES = ['breakfast','lunch','dinner','snack','dessert','sauce','drink','bread','side']

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
  .save-btn:hover:not(:disabled){background:#D4A46A;transform:translateY(-1px)}
  .save-btn:disabled{opacity:.5;cursor:not-allowed}
  .retry-btn{background:rgba(255,255,255,.06);color:rgba(248,243,236,.88);border:1px solid rgba(255,255,255,.1);padding:14px 20px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:1rem;cursor:pointer;transition:all .2s;white-space:nowrap}
  .retry-btn:hover{background:rgba(255,255,255,.1);color:#F8F3EC}
  .add-label{display:block;font-size:.84rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(248,243,236,.65);margin-bottom:.6rem}
  .hint{font-size:.94rem;color:rgba(248,243,236,.60);line-height:1.7;margin-bottom:1.25rem}
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);border-top-color:#1A1612;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}

  .pdf-status{background:rgba(184,135,74,.08);border:1px solid rgba(184,135,74,.2);border-radius:.75rem;padding:.85rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem;font-size:.92rem;color:#D4A46A}
  .pdf-status-dot{width:.5rem;height:.5rem;border-radius:50%;background:#D4A46A;flex-shrink:0;animation:pulse 1.2s ease infinite}
  .pdf-recipe-list{display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.5rem}
  .pdf-recipe-row{display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1rem;padding:.85rem 1rem;transition:all .2s}
  .pdf-recipe-row:hover{border-color:rgba(184,135,74,.2)}
  .pdf-recipe-row.checked{background:rgba(184,135,74,.07);border-color:rgba(184,135,74,.25)}
  .pdf-recipe-row.dup{opacity:.45;border-style:dashed}
  .pdf-checkbox{width:1.1rem;height:1.1rem;border-radius:.3rem;border:2px solid rgba(255,255,255,.2);background:none;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;cursor:pointer}
  .pdf-recipe-row.checked .pdf-checkbox{background:#B8874A;border-color:#B8874A}
  .pdf-recipe-info{flex:1;min-width:0;cursor:pointer}
  .pdf-recipe-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:#F8F3EC;line-height:1.2;margin-bottom:.15rem}
  .pdf-recipe-meta{font-size:.78rem;color:rgba(248,243,236,.4)}
  .pdf-preview-btn{background:none;border:1px solid rgba(255,255,255,.1);color:rgba(248,243,236,.5);border-radius:.5rem;padding:.25rem .6rem;font-size:.75rem;font-family:'Outfit',sans-serif;cursor:pointer;white-space:nowrap;transition:all .2s;flex-shrink:0}
  .pdf-preview-btn:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .pdf-batch-actions{display:flex;gap:.75rem;margin-bottom:1rem;align-items:center;flex-wrap:wrap}
  .pdf-select-all{background:none;border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.6);border-radius:2rem;padding:.35rem .9rem;font-family:'Outfit',sans-serif;font-size:.82rem;cursor:pointer;transition:all .2s}
  .pdf-select-all:hover{border-color:rgba(184,135,74,.3);color:#B8874A}
  .pdf-count{font-size:.85rem;color:rgba(248,243,236,.35);margin-left:auto}
  .pdf-save-bar{position:sticky;bottom:0;background:linear-gradient(to top,#1A1612 70%,transparent);padding:1.5rem 0 0}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:flex-end;justify-content:center}
  @media(min-width:600px){.modal-overlay{align-items:center}}
  .modal-sheet{background:#222018;border-radius:1.5rem 1.5rem 0 0;width:100%;max-width:640px;max-height:90vh;overflow-y:auto}
  @media(min-width:600px){.modal-sheet{border-radius:1.5rem;max-height:85vh}}
  .modal-hd{display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;background:#222018;z-index:1}
  .modal-back{background:none;border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.7);border-radius:.5rem;padding:.4rem .9rem;font-family:'Outfit',sans-serif;font-size:.85rem;cursor:pointer;transition:all .2s;flex-shrink:0}
  .modal-back:hover{border-color:#B8874A;color:#B8874A}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#F8F3EC;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

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
  const [mounted, setMounted] = useState(false)

  // PDF state
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfRecipes, setPdfRecipes] = useState([])
  const [pdfChecked, setPdfChecked] = useState({})
  const [pdfSaving, setPdfSaving] = useState(false)
  const [pdfSaved, setPdfSaved] = useState(0)
  const [pdfWorking, setPdfWorking] = useState(false)
  const [pdfStatus, setPdfStatus] = useState('')
  const [previewRecipe, setPreviewRecipe] = useState(null)

  useEffect(() => {
    setMounted(true)
    const sb = getClient()
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    }
    init()
  }, [router])

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file); setError('')
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePdf = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file); setPdfRecipes([]); setPdfChecked({}); setError('')
  }

  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })

  const filterDuplicates = async (recipes) => {
    if (!userId) return recipes.map(r => ({ ...r, _isDuplicate: false }))
    const sb = getClient()
    const { data: existing } = await sb.from('recipes').select('title').eq('profile_id', userId)
    const existingTitles = new Set((existing || []).map(r => r.title.toLowerCase().trim()))
    return recipes.map(r => ({ ...r, _isDuplicate: existingTitles.has((r.title || '').toLowerCase().trim()) }))
  }

  const extract = async () => {
    setError(''); setRecipe(null); setLoading(true)
    try {
      let body = { type: method }
      if (method === 'url') {
        if (!url.trim()) { setError('Please enter a URL.'); setLoading(false); return }
        body.url = url.trim()
      } else if (method === 'image') {
        if (!imageFile) { setError('Please select an image.'); setLoading(false); return }
        body.imageBase64 = await toBase64(imageFile)
        body.imageType = imageFile.type
      } else if (method === 'manual') {
        if (!manualText.trim()) { setError('Please enter the recipe text.'); setLoading(false); return }
        body.text = manualText.trim()
      }
      const res = await fetch('/api/recipes/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error || 'Something went wrong.')
      else setRecipe(data.recipe)
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const extractPdf = async () => {
    if (!pdfFile) { setError('Please select a PDF file.'); return }
    setError(''); setLoading(true); setPdfRecipes([]); setPdfChecked({}); setPdfSaved(0); setPdfStatus('')

    try {
      const sb = getClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `pdf-imports/${session.user.id}/${Date.now()}-${safeName}`

      const { error: uploadError } = await sb.storage
        .from('pdf-imports').upload(filePath, pdfFile, { contentType: 'application/pdf', upsert: true })
      if (uploadError) { setError('Upload failed: ' + uploadError.message); setLoading(false); return }

      const { data: signedData, error: signedError } = await sb.storage
        .from('pdf-imports').createSignedUrl(filePath, 1800)
      if (signedError || !signedData?.signedUrl) { setError('Could not access uploaded file.'); setLoading(false); return }

      const pdfUrl = signedData.signedUrl

      // ── PASS 1 ──────────────────────────────────────────────
      const res1 = await fetch('/api/recipes/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pdf', pdfUrl }),
      })
      const data1 = await res1.json()
      if (!res1.ok || data1.error) { setError(data1.error || 'Could not extract recipes.'); setLoading(false); return }

      const pass1 = await filterDuplicates(data1.recipes || [])
      const checked1 = {}
      pass1.forEach((r, i) => { checked1[i] = !r._isDuplicate })
      setPdfRecipes(pass1)
      setPdfChecked(checked1)
      setLoading(false)

      // ── REMAINING CHUNKS (background if more chunks exist) ────
      if (data1.truncated && data1.nextChunkIndex != null) {
        setPdfWorking(true)

        let currentRecipes = pass1
        let nextChunkIndex = data1.nextChunkIndex
        const seenTitles = new Set(pass1.map(r => r.title.toLowerCase().trim()))

        while (nextChunkIndex != null) {
          setPdfStatus(`Found ${currentRecipes.length} recipes so far — reading chunk ${nextChunkIndex + 1}...`)

          try {
            const res = await fetch('/api/recipes/extract', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'pdf', pdfUrl, chunkIndex: nextChunkIndex }),
            })
            const data = await res.json()

            if (!res.ok || data.error) {
              console.error('Chunk error:', data.error)
              break
            }

            const newRecipes = (data.recipes || []).filter(r => {
              const key = (r.title||'').toLowerCase().trim()
              if (!key || seenTitles.has(key)) return false
              seenTitles.add(key)
              return true
            })

            if (newRecipes.length > 0) {
              const newWithDups = await filterDuplicates(newRecipes)
              setPdfRecipes(prev => {
                const combined = [...prev, ...newWithDups]
                setPdfChecked(prev2 => {
                  const merged = { ...prev2 }
                  newWithDups.forEach((r, j) => { merged[prev.length + j] = !r._isDuplicate })
                  return merged
                })
                return combined
              })
              currentRecipes = [...currentRecipes, ...newRecipes]
            }

            nextChunkIndex = data.nextChunkIndex ?? null

          } catch (e) {
            console.error('Chunk error:', e)
            break
          }
        }

        setPdfWorking(false)
        setPdfStatus('')
      }

    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const togglePdfRecipe = (i) => setPdfChecked(prev => ({ ...prev, [i]: !prev[i] }))

  const toggleAllPdf = () => {
    const nonDup = pdfRecipes.map((r, i) => ({ r, i })).filter(({ r }) => !r._isDuplicate)
    const allChecked = nonDup.every(({ i }) => pdfChecked[i])
    const newChecked = { ...pdfChecked }
    nonDup.forEach(({ i }) => { newChecked[i] = !allChecked })
    setPdfChecked(newChecked)
  }

  const savePdfRecipes = async () => {
    const toSave = pdfRecipes.filter((_, i) => pdfChecked[i])
    if (!toSave.length) { setError('Please select at least one recipe.'); return }
    setPdfSaving(true); setError('')
    const sb = getClient()
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { router.replace('/login'); return }
    const uid = session.user.id
    let saved = 0
    const failures = []
    for (const r of toSave) {
      try {
        const { error: saveErr } = await sb.from('recipes').insert({
          profile_id: uid,
          title: r.title,
          description: r.description || null,
          source_type: 'manual',
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          prep_time_mins: r.prep_time_mins || null,
          cook_time_mins: r.cook_time_mins || null,
          base_servings: r.base_servings || 4,
          cuisine: r.cuisine || null,
          meal_type: VALID_MEAL_TYPES.includes(r.meal_type) ? r.meal_type : 'dinner',
          difficulty: r.difficulty || 2,
          tags: r.tags || [],
          dietary_flags: r.dietary_flags || [],
          ai_processed: true,
        })
        if (saveErr) { failures.push(r.title + ': ' + saveErr.message); continue }
        saved++
      } catch (e) { failures.push(r.title + ': ' + e.message) }
    }
    setPdfSaved(saved)
    if (failures.length) setError(failures.length + ' recipe(s) failed: ' + failures.slice(0,3).join('; '))
    setPdfSaving(false)
    if (saved > 0) setTimeout(() => router.push('/vault'), 1500)
  }

  const saveRecipe = async () => {
    if (!recipe || !userId) return
    setSaving(true); setError('')
    try {
      const sb = getClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session) { router.replace('/login'); return }
      // Duplicate check
      const { data: existing } = await sb.from('recipes').select('id')
        .eq('profile_id', session.user.id).ilike('title', recipe.title).maybeSingle()
      if (existing) { setError('"' + recipe.title + '" is already in your vault.'); setSaving(false); return }
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
        base_servings: recipe.base_servings || 4,
        cuisine: recipe.cuisine || null,
        meal_type: VALID_MEAL_TYPES.includes(recipe.meal_type) ? recipe.meal_type : 'dinner',
        difficulty: recipe.difficulty || 2,
        tags: recipe.tags || [],
        dietary_flags: recipe.dietary_flags || [],
        ai_processed: true,
      })
      if (saveErr) { setError('Save failed: ' + saveErr.message); setSaving(false); return }
      router.push('/vault')
    } catch (e) { setError('Error: ' + e.message) }
    setSaving(false)
  }

  const formatAmount = (ing) => {
    if (!ing.amount && !ing.unit) return ''
    return [ing.amount ? String(ing.amount) : '', ing.unit || ''].filter(Boolean).join(' ')
  }

  const checkedCount = Object.values(pdfChecked).filter(Boolean).length
  const dupCount = pdfRecipes.filter(r => r._isDuplicate).length
  const newCount = pdfRecipes.filter(r => !r._isDuplicate).length

  if (!mounted) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="add-root">
      <style>{css}</style>

      {/* Recipe detail modal */}
      {previewRecipe && (
        <div className="modal-overlay" onClick={() => setPreviewRecipe(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <button className="modal-back" onClick={() => setPreviewRecipe(null)}>← Back</button>
              <div className="modal-title">{previewRecipe.title}</div>
            </div>
            <div style={{padding:'1.5rem 1.5rem 2rem'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:'.65rem',marginBottom:'1.25rem'}}>
                {previewRecipe.cuisine && <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.6)'}}>🌍 {previewRecipe.cuisine}</span>}
                {previewRecipe.prep_time_mins && <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.6)'}}>⏱ Prep {previewRecipe.prep_time_mins} min</span>}
                {previewRecipe.cook_time_mins && <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.6)'}}>🔥 Cook {previewRecipe.cook_time_mins} min</span>}
                {previewRecipe.base_servings && <span style={{fontSize:'.85rem',color:'rgba(248,243,236,.6)'}}>👥 Serves {previewRecipe.base_servings}</span>}
                <span style={{fontSize:'.75rem',background:'rgba(184,135,74,.1)',color:'#B8874A',padding:'.2rem .6rem',borderRadius:'2rem',border:'1px solid rgba(184,135,74,.2)'}}>{previewRecipe.meal_type}</span>
              </div>
              {previewRecipe.description && (
                <p style={{fontSize:'.95rem',color:'rgba(248,243,236,.65)',lineHeight:1.7,marginBottom:'1.5rem'}}>{previewRecipe.description}</p>
              )}
              <div className="preview-section-title">Ingredients</div>
              <div className="preview-ingredients">
                {(previewRecipe.ingredients||[]).map((ing, i) => (
                  <div key={i} className="preview-ingredient">
                    <span className="preview-amount">{formatAmount(ing)}</span>
                    <span>{ing.name}{ing.notes ? ', ' + ing.notes : ''}</span>
                  </div>
                ))}
              </div>
              <div className="preview-section-title">Instructions</div>
              <div className="preview-steps">
                {(previewRecipe.instructions||[]).map((step, i) => (
                  <div key={i} className="preview-step">
                    <div className="preview-step-n">{step.step || i+1}</div>
                    <div className="preview-step-t">{step.text}</div>
                  </div>
                ))}
              </div>
              {(previewRecipe.tags?.length > 0 || previewRecipe.dietary_flags?.length > 0) && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'.4rem',marginTop:'.5rem'}}>
                  {previewRecipe.dietary_flags?.map(f => <span key={f} className="preview-pill primary">{f}</span>)}
                  {previewRecipe.tags?.map(t => <span key={t} className="preview-pill">{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="add-hd">
        <button className="add-back" onClick={() => router.push('/vault')}>← Vault</button>
        <div className="add-hd-title">Add a recipe</div>
      </div>

      <div className="add-tabs">
        {[
          { id: 'url', ico: '🔗', label: 'Paste a URL' },
          { id: 'image', ico: '📸', label: 'Upload photo' },
          { id: 'pdf', ico: '📄', label: 'Import PDF' },
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
                ? "She's going through every page and pulling out each recipe. This may take a minute or two — please keep this page open."
                : <>She&apos;s reading your {method === 'url' ? 'recipe page' : method === 'image' ? 'image' : 'text'} and pulling out every ingredient and step. Takes about 10–15 seconds.</>
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
                  <input className="url-input" type="url" placeholder="https://www.allrecipes.com/recipe/..."
                    value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && extract()} />
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
                      <div style={{marginTop:'1rem',fontSize:'.85rem',color:'rgba(248,243,236,.4)'}}>{imageFile?.name} · Tap to change</div>
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
                <p className="hint">Upload a PDF with one or many recipes — a family recipe book, cookbook export, or any PDF with recipe content. Dot will find every recipe and let you choose which to save.</p>
                <div className="img-upload">
                  <input type="file" accept="application/pdf,.pdf" onChange={handlePdf} />
                  {pdfFile ? (
                    <div style={{padding:'1rem 0'}}>
                      <span style={{fontSize:'2.5rem',display:'block',marginBottom:'.75rem'}}>📄</span>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color:'#F8F3EC',marginBottom:'.35rem'}}>{pdfFile.name}</div>
                      <div style={{fontSize:'.85rem',color:'rgba(248,243,236,.4)'}}>{(pdfFile.size/1024/1024).toFixed(1)} MB · Tap to change</div>
                    </div>
                  ) : (
                    <>
                      <span className="img-upload-ico">📄</span>
                      <div className="img-upload-title">Drop PDF or tap to browse</div>
                      <div className="img-upload-sub">Family recipe books · Cookbook exports · Any PDF with recipes<br/>PDF files only</div>
                    </>
                  )}
                </div>
                {pdfFile && <button className="manual-btn" onClick={extractPdf} disabled={loading}>Find all recipes →</button>}
              </div>
            )}

            {method === 'manual' && (
              <div>
                <label className="add-label">Recipe text</label>
                <p className="hint">Paste or type the recipe — ingredients, steps, whatever you have. Dot will clean it up and organize everything.</p>
                <textarea className="manual-area"
                  placeholder={'Paste your recipe here.\n\nChicken Tikka Masala\nServes 4\n\nIngredients:\n- 2 lbs chicken breast\n...\n\nInstructions:\n1. Marinate chicken...'}
                  value={manualText} onChange={e => setManualText(e.target.value)} />
                <button className="manual-btn" onClick={extract} disabled={!manualText.trim() || loading}>
                  Extract &amp; structure recipe →
                </button>
              </div>
            )}
          </>
        )}

        {/* PDF results — progressive, shows after pass 1 */}
        {pdfRecipes.length > 0 && (
          <div>
            {pdfWorking && (
              <div className="pdf-status">
                <div className="pdf-status-dot"/>
                <span>{pdfStatus || 'Dot is still reading — more recipes coming...'}</span>
              </div>
            )}

            {!pdfWorking && (
              <div style={{marginBottom:'1rem'}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.4rem',color:'#F8F3EC',marginBottom:'.5rem'}}>
                  Found {pdfRecipes.length} recipe{pdfRecipes.length !== 1 ? 's' : ''}
                </div>
                <div style={{fontSize:'.9rem',color:'rgba(248,243,236,.55)',lineHeight:1.6}}>
                  {newCount} new recipe{newCount !== 1 ? 's' : ''} ready to save — all selected by default.
                </div>
                {dupCount > 0 && (
                  <div style={{display:'flex',gap:'.65rem',alignItems:'flex-start',marginTop:'.75rem',background:'rgba(184,135,74,.07)',border:'1px solid rgba(184,135,74,.18)',borderRadius:'.75rem',padding:'.75rem 1rem'}}>
                    <span style={{fontSize:'1.1rem',flexShrink:0}}>👵</span>
                    <span style={{fontSize:'.88rem',color:'rgba(248,243,236,.65)',lineHeight:1.6}}>
                      I found <strong style={{color:'#D4A46A'}}>{dupCount} recipe{dupCount !== 1 ? 's' : ''}</strong> you&apos;ve already saved to your vault. {dupCount !== 1 ? "They're" : "It's"} shown dimmed below and won&apos;t be selected — no duplicates!
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="pdf-batch-actions">
              <button className="pdf-select-all" onClick={toggleAllPdf}>
                {pdfRecipes.filter(r => !r._isDuplicate).every((r, idx) => pdfChecked[pdfRecipes.findIndex(x => x === r)])
                  ? 'Deselect all' : 'Select all'}
              </button>
              <div className="pdf-count">{checkedCount} selected</div>
            </div>

            <div className="pdf-recipe-list">
              {pdfRecipes.map((r, i) => (
                <div key={i} className={`pdf-recipe-row${pdfChecked[i] ? ' checked' : ''}${r._isDuplicate ? ' dup' : ''}`}>
                  <div className="pdf-checkbox" onClick={() => !r._isDuplicate && togglePdfRecipe(i)}>
                    {pdfChecked[i] && <span style={{color:'#1A1612',fontSize:'.75rem',fontWeight:700}}>✓</span>}
                  </div>
                  <div className="pdf-recipe-info" onClick={() => !r._isDuplicate && togglePdfRecipe(i)}>
                    <div className="pdf-recipe-title">
                      {r.title}
                      {r._isDuplicate && <span style={{fontSize:'.7rem',color:'rgba(248,243,236,.3)',marginLeft:'.5rem'}}>already saved</span>}
                    </div>
                    <div className="pdf-recipe-meta">
                      {[r.meal_type, r.cuisine, r.cook_time_mins ? r.cook_time_mins + ' min' : null, r.base_servings ? 'Serves ' + r.base_servings : null]
                        .filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button className="pdf-preview-btn" onClick={() => setPreviewRecipe(r)}>Preview</button>
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
                  <button className="retry-btn" onClick={() => { setPdfRecipes([]); setPdfFile(null); setPdfStatus(''); setError('') }}>
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
                {recipe.base_servings && <div className="preview-meta-item">👥 Serves {recipe.base_servings}</div>}
                <div className="preview-meta-item" style={{fontSize:'.75rem',background:'rgba(184,135,74,.1)',color:'#B8874A',padding:'.2rem .6rem',borderRadius:'2rem',border:'1px solid rgba(184,135,74,.2)'}}>{recipe.meal_type}</div>
              </div>
            </div>
            <div className="preview-body">
              {(recipe.tags?.length > 0 || recipe.dietary_flags?.length > 0) && (
                <div style={{marginBottom:'1.5rem'}}>
                  <div className="preview-section-title">Tags</div>
                  <div className="preview-tags">
                    {recipe.dietary_flags?.map(f => <span key={f} className="preview-pill primary">{f}</span>)}
                    {recipe.tags?.map(t => <span key={t} className="preview-pill">{t}</span>)}
                  </div>
                </div>
              )}
              <div className="preview-section-title">Ingredients · As written in recipe</div>
              <div className="preview-ingredients">
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} className="preview-ingredient">
                    <span className="preview-amount">{formatAmount(ing)}</span>
                    <span>{ing.name}{ing.notes ? ', ' + ing.notes : ''}</span>
                  </div>
                ))}
              </div>
              <div className="preview-section-title">Instructions</div>
              <div className="preview-steps">
                {recipe.instructions?.map((step, i) => (
                  <div key={i} className="preview-step">
                    <div className="preview-step-n">{step.step || i+1}</div>
                    <div className="preview-step-t">{step.text}</div>
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
