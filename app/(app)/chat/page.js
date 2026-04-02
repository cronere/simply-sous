'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

let _client = null
const getClient = () => {
  if (_client) return _client
  _client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return _client
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;font-weight:300;background:#1A1612;color:#F8F3EC}
  .dot-wrap{display:flex;flex-direction:column;height:100vh;max-width:700px;margin:0 auto}
  .dot-hd{padding:1.25rem 1.5rem 1rem;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
  .dot-hd-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;display:flex;align-items:center;gap:.6rem}
  .dot-hd-sub{font-size:.85rem;color:rgba(248,243,236,.45);margin-top:.2rem}
  .dot-messages{flex:1;overflow-y:auto;padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
  .msg{display:flex;gap:.75rem;align-items:flex-start;max-width:90%}
  .msg.user{align-self:flex-end;flex-direction:row-reverse}
  .msg-avatar{width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;margin-top:.1rem}
  .msg-avatar.dot{background:linear-gradient(135deg,#B8874A,#D4A46A)}
  .msg-avatar.user{background:rgba(255,255,255,.1)}
  .msg-bubble{padding:.85rem 1.1rem;border-radius:1.25rem;font-size:.97rem;line-height:1.65}
  .msg-bubble.dot{background:#2C2420;border:1px solid rgba(255,255,255,.07);color:rgba(248,243,236,.88);border-top-left-radius:.35rem}
  .msg-bubble.user{background:#B8874A;color:#1A1612;border-top-right-radius:.35rem}
  .msg-bubble p{margin-bottom:.5rem}
  .msg-bubble p:last-child{margin-bottom:0}
  .recipe-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:1rem;padding:1rem;margin-top:.75rem;cursor:pointer;transition:all .2s}
  .recipe-card:hover{background:rgba(184,135,74,.08);border-color:rgba(184,135,74,.25)}
  .recipe-card-title{font-size:1rem;color:#F8F3EC;margin-bottom:.35rem;font-weight:400}
  .recipe-card-meta{display:flex;gap:.75rem;font-size:.82rem;color:rgba(248,243,236,.5);margin-bottom:.6rem}
  .recipe-card-actions{display:flex;gap:.5rem;flex-wrap:wrap}
  .recipe-card-btn{padding:.35rem .9rem;border-radius:2rem;font-size:.8rem;font-family:'Outfit',sans-serif;cursor:pointer;transition:all .2s;border:none}
  .recipe-card-btn.save{background:#B8874A;color:#1A1612;font-weight:500}
  .recipe-card-btn.save:hover{background:#D4A46A}
  .recipe-card-btn.view{background:rgba(255,255,255,.08);color:rgba(248,243,236,.7)}
  .recipe-card-btn.view:hover{background:rgba(255,255,255,.13)}
  .recipe-card-btn.saved{background:rgba(143,168,137,.15);color:#8FA889;cursor:default}
  .dot-input-area{padding:1rem 1.5rem 1.5rem;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0}
  .dot-suggestions{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem}
  .dot-suggestion{padding:.4rem .9rem;border-radius:2rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);font-size:.82rem;color:rgba(248,243,236,.6);cursor:pointer;transition:all .2s;white-space:nowrap;font-family:'Outfit',sans-serif}
  .dot-suggestion:hover{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.3);color:#F8F3EC}
  .dot-input-row{display:flex;gap:.75rem;align-items:flex-end}
  .dot-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:1.25rem;padding:.75rem 1.1rem;color:#F8F3EC;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:300;outline:none;resize:none;min-height:44px;max-height:120px;transition:border-color .2s;line-height:1.5}
  .dot-input:focus{border-color:rgba(184,135,74,.4)}
  .dot-input::placeholder{color:rgba(248,243,236,.28)}
  .dot-send{width:44px;height:44px;border-radius:50%;background:#B8874A;border:none;color:#1A1612;font-size:1.1rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .dot-send:hover:not(:disabled){background:#D4A46A;transform:scale(1.05)}
  .dot-send:disabled{opacity:.4;cursor:not-allowed}
  .typing{display:flex;gap:.35rem;align-items:center;padding:.75rem 1rem}
  .typing-dot{width:7px;height:7px;border-radius:50%;background:#B8874A;animation:typingBounce 1.2s infinite}
  .typing-dot:nth-child(2){animation-delay:.2s}
  .typing-dot:nth-child(3){animation-delay:.4s}
  @keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .save-toast{position:fixed;bottom:6rem;left:50%;transform:translateX(-50%);background:#8FA889;color:#1A1612;padding:.6rem 1.5rem;border-radius:2rem;font-size:.9rem;font-weight:500;z-index:100;animation:toastIn .3s ease}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  .recipe-preview-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}
  .recipe-preview-modal{background:#2C2420;border-radius:1.5rem;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column}
  .recipe-preview-hd{padding:1.5rem 1.5rem 1rem;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;position:sticky;top:0;background:#2C2420;z-index:1}
  .recipe-preview-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#F8F3EC;line-height:1.2}
  .recipe-preview-body{padding:1.25rem 1.5rem 1.5rem;flex:1}
  .recipe-preview-meta{display:flex;gap:1rem;font-size:.88rem;color:rgba(248,243,236,.55);margin-bottom:1rem;flex-wrap:wrap}
  .recipe-preview-desc{font-size:.97rem;color:rgba(248,243,236,.75);line-height:1.7;margin-bottom:1.25rem}
  .recipe-section-label{font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(248,243,236,.4);margin-bottom:.65rem}
  .recipe-ingredient{display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.92rem}
  .recipe-step{padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.05)}
  .recipe-step-num{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#B8874A;margin-bottom:.3rem}
  .recipe-step-text{font-size:.92rem;color:rgba(248,243,236,.82);line-height:1.65}
  .recipe-preview-footer{padding:1rem 1.5rem;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:.75rem;position:sticky;bottom:0;background:#2C2420}
`

function getSeason() {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'fall'
  return 'winter'
}

const SUGGESTIONS = [
  "What can I make with chicken tonight?",
  "Quick dinners under 20 minutes",
  "Something the whole family will love",
  "What's a good meal prep dish?",
  "Surprise me with something new",
]

export default function DotPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState(null)
  const STORAGE_KEY = 'dot-conversation'

  const defaultMessages = [{
    role: 'dot',
    content: "Hi! I'm Dot — your personal kitchen assistant 👵🏼\n\nI can help you find recipes from your vault, suggest new ideas based on what you have, or answer any cooking questions. What sounds good tonight?",
    recipes: []
  }]

  const loadSavedMessages = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch(e) {}
    return defaultMessages
  }

  const [messages, setMessages] = useState(loadSavedMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefs, setPrefs] = useState(null)
  const [vaultTitles, setVaultTitles] = useState([])
  const [savedRecipes, setSavedRecipes] = useState({})
  const [toast, setToast] = useState(null)
  const [previewRecipe, setPreviewRecipe] = useState(null)
  const [previewSaveKey, setPreviewSaveKey] = useState(null)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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
    loadContext()
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Save conversation to sessionStorage so it persists during session
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch(e) {}
  }, [messages])

  const [familyMembers, setFamilyMembers] = useState([])

  const loadContext = async () => {
    const sb = getClient()
    const [prefsRes, recipesRes, membersRes] = await Promise.all([
      sb.from('user_preferences').select('*').eq('profile_id', userId).maybeSingle(),
      sb.from('recipes').select('title, cuisine, tags, total_time_mins').eq('profile_id', userId),
      sb.from('family_members').select('name, birth_month, birth_year').eq('profile_id', userId),
    ])
    if (prefsRes.data) setPrefs(prefsRes.data)
    if (recipesRes.data) setVaultTitles(recipesRes.data.map(r => r.title))
    if (membersRes.data) setFamilyMembers(membersRes.data)
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Build context for Dot
      const sb = getClient()

      // Get vault recipes for context
      const { data: vaultRecipes } = await sb
        .from('recipes')
        .select('id, title, cuisine, total_time_mins, tags, dietary_flags, description, ingredients')
        .eq('profile_id', userId)
        .limit(30)

      // Get pantry/fridge staples
      const pantry = prefs?.pantry_staples || []
      const fridge = prefs?.fridge_staples || []
      const dietary = prefs?.dietary_flags || []
      const allergens = prefs?.allergens || []
      const disliked = prefs?.disliked_ingredients || []

      // Build conversation history for API
      const history = messages.map(m => ({
        role: m.role === 'dot' ? 'assistant' : 'user',
        content: m.content
      }))

      const season = getSeason()
      const seasonNote = season === 'summer' ? 'It is summer — lean toward lighter, fresher meals.'
        : season === 'winter' ? 'It is winter — heartier, warming meals are welcome.'
        : season === 'fall' ? 'It is fall — comforting meals with seasonal produce are ideal.'
        : 'It is spring — fresh, lighter meals are in season.'

      const getAge = (month, year) => {
        const now = new Date()
        let age = now.getFullYear() - year
        if (now.getMonth() + 1 < month) age--
        return Math.max(0, age)
      }
      const childAges = familyMembers.map(m => getAge(m.birth_month, m.birth_year))
      const familyNote = childAges.length > 0
        ? 'Family has children aged ' + childAges.join(', ') + '. Consider kid-friendliness.'
        : ''

      const systemPrompt = `You are Dot, a kitchen assistant for Simply Sous with a warm, gently grandmotherly tone — practical, brief, and genuinely helpful. Never fussy or over-explaining.

CURRENT SEASON: ${season}. ${seasonNote}
${familyNote}

USER PREFERENCES:
- Dietary: ${dietary.length ? dietary.join(', ') : 'none'}
- Allergens (never suggest these): ${allergens.length ? allergens.join(', ') : 'none'}
- Dislikes: ${disliked.length ? disliked.join(', ') : 'none'}
- Max weeknight cook time: ${prefs?.max_weeknight_mins || 30} minutes

USER'S SAVED RECIPES (their vault):
${vaultRecipes && vaultRecipes.length > 0
  ? vaultRecipes.map(r => '- ' + r.title + ' (' + (r.cuisine || 'various') + ', ' + (r.total_time_mins || '?') + ' min)').join('\n')
  : 'No recipes saved yet'}

RESPONSE RULES:
- Keep responses SHORT. 2-4 sentences max before the recipe cards. No bullet points.
- A little warmth is lovely — one gentle observation is enough. Never repeat praise or add "smart thinking" type comments.
- When suggesting recipes, put a brief natural sentence before them, then end your text there. The recipe cards will appear below automatically.
- Never describe the recipes in your text — the cards already show that. Just say you found some ideas.
- Never suggest recipes containing allergens.
- For pure cooking questions (no recipe needed), answer conversationally in 2-3 sentences.
- CRITICAL: When suggesting recipes, you MUST wrap the JSON in <recipes> tags at the END of your message. Never output raw JSON without these tags:
  <recipes>
  [{"title":"Recipe Name","cuisine":"Italian","total_time_mins":25,"description":"One sentence description","source":"new","ingredients":[{"name":"chicken breast","amount":2,"unit":"lbs"},{"name":"garlic","amount":3,"unit":"cloves"}],"instructions":[{"text":"Season chicken and heat oil in skillet."},{"text":"Cook 6-7 minutes per side until golden."}]}]
  </recipes>
- source="vault" for their saved recipes (include vault_id, no need for ingredients/instructions)
- source="new" for suggestions — ALWAYS include full ingredients array and instructions array
- Keep ingredients concise: {name, amount, unit}. Keep instructions concise: {text} only.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: msg }],
          systemPrompt,
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chat failed')

      // Parse response — extract recipe JSON if present
      let content = data.content || ''
      let recipes = []

      // Try <recipes> tags first
      const recipeMatch = content.match(/<recipes>([\s\S]*?)<\/recipes>/)
      if (recipeMatch) {
        try {
          recipes = JSON.parse(recipeMatch[1].trim())
          content = content.replace(/<recipes>[\s\S]*?<\/recipes>/, '').trim()
        } catch(e) {}
      }

      // Fallback: strip any raw JSON array that leaked into content
      if (recipes.length === 0) {
        const fi = content.lastIndexOf('[{')
        const li = content.lastIndexOf('}]')
        if (fi >= 0 && li > fi) {
          try {
            recipes = JSON.parse(content.substring(fi, li + 2))
            content = content.substring(0, fi).trim()
          } catch(e) {}
        }
      }

      // Also strip any leftover <recipes> or [ tags that didn't parse
      content = content.replace(/<\/?recipes>/g, '').replace(/^\s*\[\s*$/gm, '').trim()

      // Enrich vault recipes with real IDs
      if (vaultRecipes && recipes.length > 0) {
        recipes = recipes.map(r => {
          if (r.source === 'vault') {
            const match = vaultRecipes.find(v =>
              v.title.toLowerCase() === r.title.toLowerCase()
            )
            if (match) return { ...r, vault_id: match.id, ingredients: match.ingredients }
          }
          return r
        })
      }

      setMessages(prev => [...prev, { role: 'dot', content, recipes }])
    } catch(e) {
      setMessages(prev => [...prev, {
        role: 'dot',
        content: "Sorry, I'm having trouble right now. Please try again in a moment.",
        recipes: []
      }])
    }
    setLoading(false)
  }

  const openPreview = async (recipe, msgIdx, recipeIdx) => {
    const key = msgIdx + '-' + recipeIdx
    setPreviewSaveKey(key)
    setFetchingPreview(true)
    setPreviewRecipe({ ...recipe, _loading: true }) // show modal immediately with loading state

    const sb = getClient()

    // 1. Vault recipe — fetch from user's recipes
    if (recipe.source === 'vault' && recipe.vault_id) {
      const { data } = await sb.from('recipes').select('*').eq('id', recipe.vault_id).single()
      setPreviewRecipe(data ? { ...data, source: 'vault', vault_id: recipe.vault_id } : recipe)
      setFetchingPreview(false)
      return
    }

    // 2. Already has full data from Dot's response — use it immediately
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      setPreviewRecipe({ ...recipe, source: 'new' })
      setFetchingPreview(false)
      return
    }

    // 3. Try to find in system_recipes by title
    const { data: sysMatch } = await sb
      .from('system_recipes')
      .select('*')
      .ilike('title', recipe.title)
      .maybeSingle()

    if (sysMatch && sysMatch.ingredients && sysMatch.ingredients.length > 0) {
      setPreviewRecipe({ ...sysMatch, source: 'new' })
      setFetchingPreview(false)
      return
    }

    // 4. Generate full recipe details via Claude
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Give me the full recipe for "' + recipe.title + '". Return ONLY a JSON object with these fields: ingredients (array of {name, amount, unit}), instructions (array of {text, timer_minutes}). No other text.' }],
          systemPrompt: 'You are a recipe API. Return only valid JSON, no markdown.',
        })
      })
      const data = await res.json()
      if (data.content) {
        const fi = data.content.indexOf('{')
        const li = data.content.lastIndexOf('}')
        if (fi >= 0 && li > fi) {
          const parsed = JSON.parse(data.content.substring(fi, li + 1))
          setPreviewRecipe({
            ...recipe,
            ingredients: parsed.ingredients || [],
            instructions: parsed.instructions || [],
            source: 'new'
          })
          setFetchingPreview(false)
          return
        }
      }
    } catch(e) {}

    // 4. Fallback — show what we have
    setPreviewRecipe({ ...recipe, source: 'new' })
    setFetchingPreview(false)
  }

  const saveRecipe = async (recipe, msgIdx, recipeIdx) => {
    const key = msgIdx + '-' + recipeIdx
    if (savedRecipes[key]) return
    setSavedRecipes(prev => ({ ...prev, [key]: 'saving' }))

    try {
      const sb = getClient()

      if (recipe.source === 'vault') {
        // Already in vault — just navigate
        router.push('/vault/' + recipe.vault_id)
        return
      }

      // If recipe is from system_recipes, fetch full data first
      let ingredients = recipe.ingredients || []
      let instructions = recipe.instructions || []

      if (recipe.system_recipe_id) {
        const { data: sysData } = await sb
          .from('system_recipes')
          .select('ingredients, instructions')
          .eq('id', recipe.system_recipe_id)
          .single()
        if (sysData) {
          ingredients = sysData.ingredients || []
          instructions = sysData.instructions || []
        }
      }

      const { data, error } = await sb.from('recipes').insert({
        profile_id: userId,
        title: recipe.title,
        description: recipe.description || null,
        cuisine: recipe.cuisine || null,
        meal_type: 'dinner',
        cook_time_mins: recipe.total_time_mins || null,
        tags: recipe.tags || [],
        dietary_flags: recipe.dietary_flags || [],
        source_type: 'system',
        ai_processed: true,
        base_servings: 4,
        ingredients,
        instructions,
      }).select('id').single()

      if (error) {
        console.error('Save recipe error:', error.message)
        setSavedRecipes(prev => ({ ...prev, [key]: null }))
        showToast('Could not save recipe. Try again.')
        return
      }

      setSavedRecipes(prev => ({ ...prev, [key]: 'saved' }))
      showToast('Added to your vault!')
    } catch(e) {
      console.error('Save recipe exception:', e)
      setSavedRecipes(prev => ({ ...prev, [key]: null }))
      showToast('Could not save recipe. Try again.')
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!mounted) return null

  return (
    <div style={{minHeight:'100vh',background:'#1A1612'}}>
      <style>{css}</style>

      <div className="dot-wrap">
        {/* Header */}
        <div className="dot-hd">
          <div className="dot-hd-title">
            <span style={{fontSize:'1.4rem'}}>👵🏼</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif"}}>Dot</span>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div className="dot-hd-sub">Your personal kitchen assistant</div>
            {messages.length > 1 && (
              <button
                onClick={() => {
                  sessionStorage.removeItem(STORAGE_KEY)
                  setMessages(defaultMessages)
                  setSavedRecipes({})
                }}
                style={{background:'none',border:'1px solid rgba(255,255,255,.1)',borderRadius:'2rem',
                  padding:'.25rem .75rem',fontSize:'.75rem',color:'rgba(248,243,236,.4)',
                  cursor:'pointer',fontFamily:"'Outfit',sans-serif",transition:'all .2s'}}
                onMouseOver={e => e.currentTarget.style.color='rgba(248,243,236,.7)'}
                onMouseOut={e => e.currentTarget.style.color='rgba(248,243,236,.4)'}>
                New chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="dot-messages">
          {messages.map((msg, msgIdx) => (
            <div key={msgIdx}>
              <div className={'msg' + (msg.role === 'user' ? ' user' : '')}>
                <div className={'msg-avatar ' + msg.role}>
                  {msg.role === 'dot' ? '👵' : '👤'}
                </div>
                <div className={'msg-bubble ' + msg.role}>
                  {msg.content.split('\n').map((line, i) => (
                    line ? <p key={i}>{line}</p> : <br key={i}/>
                  ))}
                </div>
              </div>

              {/* Recipe cards */}
              {msg.recipes && msg.recipes.length > 0 && (
                <div style={{paddingLeft:'2.75rem',marginTop:'.5rem',display:'flex',flexDirection:'column',gap:'.6rem'}}>
                  {msg.recipes.map((recipe, recipeIdx) => {
                    const key = msgIdx + '-' + recipeIdx
                    const saveState = savedRecipes[key]
                    return (
                      <div key={recipeIdx} className="recipe-card">
                        <div className="recipe-card-title">{recipe.title}</div>
                        <div className="recipe-card-meta">
                          {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                          {recipe.total_time_mins && <span>⏱ {recipe.total_time_mins} min</span>}
                          {recipe.source === 'vault' && <span style={{color:'#8FA889'}}>📖 In your vault</span>}
                        </div>
                        {recipe.description && (
                          <p style={{fontSize:'.88rem',color:'rgba(248,243,236,.55)',lineHeight:1.6,marginBottom:'.6rem'}}>
                            {recipe.description}
                          </p>
                        )}
                        <div className="recipe-card-actions">
                          <button className="recipe-card-btn view"
                            onClick={() => openPreview(recipe, msgIdx, recipeIdx)}>
                            View recipe →
                          </button>
                          {recipe.source !== 'vault' && (
                            saveState === 'saved' ? (
                              <button className="recipe-card-btn saved">✓ Saved</button>
                            ) : (
                              <button className="recipe-card-btn save"
                                onClick={() => saveRecipe(recipe, msgIdx, recipeIdx)}
                                disabled={saveState === 'saving'}>
                                {saveState === 'saving' ? '...' : '+ Save'}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg">
              <div className="msg-avatar dot">👵</div>
              <div className="msg-bubble dot">
                <div className="typing">
                  <div className="typing-dot"/>
                  <div className="typing-dot"/>
                  <div className="typing-dot"/>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}/>
        </div>

        {/* Input area */}
        <div className="dot-input-area">
          {messages.length <= 1 && (
            <div className="dot-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="dot-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="dot-input-row">
            <textarea
              ref={inputRef}
              className="dot-input"
              placeholder="Ask Dot anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="dot-send" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              ➤
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="save-toast">{toast}</div>}

      {/* Recipe Preview Modal */}
      {previewRecipe && (
        <div className="recipe-preview-overlay" onClick={() => setPreviewRecipe(null)}>
          <div className="recipe-preview-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="recipe-preview-hd">
              <div>
                <div style={{fontSize:'.7rem',fontWeight:500,letterSpacing:'.14em',textTransform:'uppercase',color:'#B8874A',marginBottom:'.35rem'}}>
                  {previewRecipe.source === 'vault' ? '📖 In your vault' : '✨ From Dot'}
                </div>
                <div className="recipe-preview-title">{previewRecipe.title}</div>
              </div>
              <button onClick={() => setPreviewRecipe(null)}
                style={{background:'none',border:'none',color:'rgba(248,243,236,.4)',fontSize:'1.3rem',cursor:'pointer',flexShrink:0,lineHeight:1}}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="recipe-preview-body">
              <div className="recipe-preview-meta">
                {previewRecipe.cuisine && <span>🌍 {previewRecipe.cuisine}</span>}
                {previewRecipe.total_time_mins && <span>⏱ {previewRecipe.total_time_mins} min</span>}
                {previewRecipe.base_servings && <span>👥 Serves {previewRecipe.base_servings}</span>}
              </div>

              {previewRecipe.description && (
                <div className="recipe-preview-desc">{previewRecipe.description}</div>
              )}

              {/* Ingredients */}
              {previewRecipe.ingredients && previewRecipe.ingredients.length > 0 && (
                <div style={{marginBottom:'1.5rem'}}>
                  <div className="recipe-section-label">Ingredients</div>
                  {previewRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="recipe-ingredient">
                      <span style={{color:'rgba(248,243,236,.85)'}}>{ing.name}</span>
                      <span style={{color:'#B8874A',textAlign:'right',marginLeft:'1rem'}}>
                        {[ing.amount, ing.unit].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Instructions */}
              {previewRecipe.instructions && previewRecipe.instructions.length > 0 && (
                <div>
                  <div className="recipe-section-label">Instructions</div>
                  {previewRecipe.instructions.map((step, i) => (
                    <div key={i} className="recipe-step">
                      <div className="recipe-step-num">Step {i + 1}</div>
                      <div className="recipe-step-text">{step.text || step}</div>
                    </div>
                  ))}
                </div>
              )}

              {previewRecipe._loading || fetchingPreview ? (
                <div style={{textAlign:'center',padding:'3rem 0'}}>
                  <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto .75rem'}}/>
                  <div style={{fontSize:'.9rem',color:'rgba(248,243,236,.4)'}}>Fetching recipe details...</div>
                </div>
              ) : (!previewRecipe.ingredients || previewRecipe.ingredients.length === 0) &&
                 (!previewRecipe.instructions || previewRecipe.instructions.length === 0) ? (
                <div style={{color:'rgba(248,243,236,.45)',fontSize:'.95rem',textAlign:'center',padding:'2rem 0'}}>
                  Full recipe details not available.<br/>Save to your vault to add them.
                </div>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="recipe-preview-footer">
              <button onClick={() => setPreviewRecipe(null)}
                style={{flex:1,padding:'.8rem',border:'1px solid rgba(255,255,255,.12)',borderRadius:'2rem',
                  background:'none',color:'rgba(248,243,236,.65)',fontFamily:"'Outfit',sans-serif",
                  fontSize:'.97rem',cursor:'pointer'}}>
                ← Back to chat
              </button>
              {previewRecipe.source === 'vault' ? (
                <button
                  onClick={() => { setPreviewRecipe(null); router.push('/vault/' + previewRecipe.vault_id) }}
                  style={{flex:1,padding:'.8rem',background:'#B8874A',color:'#1A1612',border:'none',
                    borderRadius:'2rem',fontFamily:"'Outfit',sans-serif",fontSize:'.97rem',
                    fontWeight:600,cursor:'pointer'}}>
                  Open in vault →
                </button>
              ) : (
                savedRecipes[previewSaveKey] === 'saved' ? (
                  <button style={{flex:1,padding:'.8rem',background:'rgba(143,168,137,.2)',color:'#8FA889',
                    border:'none',borderRadius:'2rem',fontFamily:"'Outfit',sans-serif",fontSize:'.97rem',cursor:'default'}}>
                    ✓ Saved to vault
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const [msgIdx, recipeIdx] = previewSaveKey.split('-').map(Number)
                      const msg = messages[msgIdx]
                      const recipe = msg?.recipes?.[recipeIdx]
                      if (recipe) await saveRecipe(recipe, msgIdx, recipeIdx)
                      setPreviewRecipe(null)
                    }}
                    style={{flex:1,padding:'.8rem',background:'#B8874A',color:'#1A1612',border:'none',
                      borderRadius:'2rem',fontFamily:"'Outfit',sans-serif",fontSize:'.97rem',
                      fontWeight:600,cursor:'pointer'}}>
                    + Save to vault
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
