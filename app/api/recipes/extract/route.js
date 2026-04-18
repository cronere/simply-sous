import Anthropic from '@anthropic-ai/sdk'
// pdf-parse needs dynamic import to avoid Next.js build issues
async function getPdfParse() {
  const mod = await import('pdf-parse/lib/pdf-parse.js')
  return mod.default || mod
}

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callWithRetry(fn, maxRetries) {
  var max = maxRetries || 3
  for (var attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn()
    } catch (err) {
      var isOverloaded = err.status === 529 || (err.message && err.message.includes('overloaded'))
      var isRateLimit = err.status === 429
      if (isRateLimit && attempt < max) {
        // Rate limit: wait 60s + jitter before retrying
        var delay = 60000 + Math.random() * 5000
        console.log('Rate limited, waiting ' + Math.round(delay/1000) + 's before retry (attempt ' + (attempt+1) + '/' + max + ')')
        await new Promise(function(resolve) { setTimeout(resolve, delay) })
        continue
      }
      if (isOverloaded && attempt < max) {
        var delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000
        console.log('Anthropic overloaded, retrying in ' + Math.round(delay) + 'ms')
        await new Promise(function(resolve) { setTimeout(resolve, delay) })
        continue
      }
      throw err
    }
  }
}

// Valid meal types — must match DB constraint
const VALID_MEAL_TYPES = ['breakfast','lunch','dinner','snack','dessert','sauce','drink','bread','side']

const SYSTEM = `You are a recipe extraction expert for Simply Sous, a family meal planning app.
Extract recipe information VERBATIM — copy ingredient amounts and names exactly as written.
Do NOT scale, interpret, or calculate quantities. Do NOT multiply by servings.
If an amount says "a squeeze of" or "light sprinkle", copy that exact phrase as the unit or notes.
base_servings should be whatever the recipe explicitly states (default 4 if not mentioned).

Return valid JSON matching this exact structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "source_url": "original URL if provided, else null",
  "cuisine": "e.g. Italian, Mexican, American, Thai, etc.",
  "meal_type": "breakfast | lunch | dinner | snack | dessert | sauce | drink | bread | side",
  "difficulty": 1-5,
  "prep_time_mins": number or null,
  "cook_time_mins": number or null,
  "base_servings": number (from recipe text, default 4),
  "ingredients": [
    { "name": "ingredient name", "amount": number or null, "unit": "unit or null", "notes": "exact prep note from recipe or null" }
  ],
  "instructions": [
    { "step": 1, "text": "instruction text verbatim", "timer_minutes": number or null }
  ],
  "tags": ["tag1", "tag2"],
  "dietary_flags": ["gluten-free", "dairy-free", "vegan", "vegetarian", "nut-free", "low-carb", "keto", "paleo"]
}

Tag guidelines:
- Protein: chicken, beef, pork, seafood, salmon, turkey, lamb, tofu, eggs
- Time: "under-20-min", "under-30-min", "under-45-min", "under-1-hour", "over-1-hour"
- Occasion: weeknight, weekend, meal-prep, date-night, kid-friendly, company
- Method: one-pan, sheet-pan, slow-cooker, instant-pot, grilling, air-fryer, stovetop, baked
- Flavor: spicy, savory, sweet, smoky, tangy, creamy, light, comforting

Return ONLY the JSON object, no markdown, no explanation.`

const PDF_SYSTEM = `You are a recipe extraction expert. Extract ALL recipes from the text provided.
IMPORTANT: Extract EVERY recipe you find, even if it seems incomplete or spans the edge of the text.
Copy ingredient amounts VERBATIM — never scale or interpret quantities.
base_servings = what the recipe explicitly states (default 4 if not mentioned).

Rules:
- Extract every recipe, including side dishes, sauces, drinks, and desserts
- If a recipe appears cut off at the end of the text, extract what you have — include whatever ingredients and instructions are present
- If a recipe appears cut off at the beginning (no title visible), skip it
- Never merge two different recipes into one
- Return a JSON array ONLY — no markdown fences, no backticks, no explanation, no preamble
- Start your response with [ and end with ]

Each recipe object:
{"title":"","description":"","cuisine":"","meal_type":"dinner","difficulty":2,"prep_time_mins":null,"cook_time_mins":null,"base_servings":4,"ingredients":[{"name":"","amount":null,"unit":null,"notes":null}],"instructions":[{"step":1,"text":""}],"tags":[],"dietary_flags":[]}
meal_type options: breakfast, lunch, dinner, snack, dessert, sauce, drink, bread, side`

// Sanitize a recipe before saving — ensures valid meal_type, no total_time_mins, etc.
export function sanitizeRecipe(r) {
  return {
    title: r.title || 'Untitled Recipe',
    description: r.description || null,
    cuisine: r.cuisine || null,
    meal_type: VALID_MEAL_TYPES.includes(r.meal_type) ? r.meal_type : 'dinner',
    difficulty: (r.difficulty >= 1 && r.difficulty <= 5) ? r.difficulty : 2,
    prep_time_mins: r.prep_time_mins ? parseInt(r.prep_time_mins) || null : null,
    cook_time_mins: r.cook_time_mins ? parseInt(r.cook_time_mins) || null : null,
    base_servings: r.base_servings ? parseInt(r.base_servings) || 4 : 4,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    dietary_flags: Array.isArray(r.dietary_flags) ? r.dietary_flags : [],
    source_url: r.source_url || null,
    ai_processed: true,
  }
}

const parseRaw = (raw, hitLimit) => {
  // Strip all markdown fences — handle ```json, ```JSON, ``` etc with any whitespace
  let s = raw
    .replace(/^```[\w]*[\r\n]*/i, '')  // opening fence
    .replace(/[\r\n]*```\s*$/i, '')      // closing fence
    .trim()

  // If truncated or doesn't end cleanly, try to salvage complete objects
  const needsSalvage = hitLimit || (!s.endsWith(']') && !s.endsWith('}'))

  if (needsSalvage) {
    // Find last complete recipe object by scanning for the last }
    // followed by either , or end of array
    const last = s.lastIndexOf('},')
    const veryLast = s.lastIndexOf('}')
    const cutAt = last > 0 ? last + 1 : veryLast
    if (cutAt > 0) {
      s = s.substring(0, cutAt).trim()
      // Ensure it's wrapped in an array
      if (!s.startsWith('[')) s = '[' + s
      if (!s.endsWith(']')) s = s + ']'
    }
  }

  // Ensure array wrapper
  if (s.startsWith('{')) s = '[' + s + ']'

  try {
    const parsed = JSON.parse(s)
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    console.log('[pdf] parseRaw success:', arr.length, 'recipes')
    return arr
  } catch (e) {
    console.log('[pdf] parseRaw JSON.parse failed, trying salvage. Error:', e.message.substring(0, 100))
    // Last resort: extract individual complete recipe objects
    const out = []
    // Match objects that have at minimum title + ingredients
    const re = /\{[^{}]*"title"[^{}]*"ingredients"[\s\S]*?(?="title"|$)/g
    let depth = 0, start = -1
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') { if (depth === 0) start = i; depth++ }
      else if (s[i] === '}') {
        depth--
        if (depth === 0 && start >= 0) {
          try {
            const obj = JSON.parse(s.substring(start, i + 1))
            if (obj.title && obj.ingredients) out.push(obj)
          } catch {}
          start = -1
        }
      }
    }
    console.log('[pdf] salvage found:', out.length, 'recipes')
    return out
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, url, imageBase64, imageType, text, lastTitle } = body

    if (!type) return Response.json({ error: 'Missing type' }, { status: 400 })

    let messages = []

    if (type === 'url') {
      if (!url) return Response.json({ error: 'Missing URL' }, { status: 400 })
      let pageContent = ''
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SimplySous/1.0)' },
          signal: AbortSignal.timeout(10000),
        })
        const html = await res.text()
        pageContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000)
      } catch {
        return Response.json({ error: 'Could not fetch that URL. Try copying the recipe text manually.' }, { status: 422 })
      }
      messages = [{ role: 'user', content: 'Extract the recipe from this webpage. URL: ' + url + '\n\n' + pageContent + '\n\nReturn as JSON.' }]
    }

    else if (type === 'image') {
      if (!imageBase64 || !imageType) return Response.json({ error: 'Missing image data' }, { status: 400 })
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: imageType, data: imageBase64 } },
          { type: 'text', text: 'Extract the recipe from this image verbatim. Return as JSON.' },
        ],
      }]
    }

    else if (type === 'manual') {
      if (!text) return Response.json({ error: 'Missing text' }, { status: 400 })
      messages = [{ role: 'user', content: 'Extract and structure this recipe verbatim:\n\n' + text + '\n\nReturn as JSON.' }]
    }

    else if (type === 'pdf') {
      if (!body.pdfUrl) return Response.json({ error: 'Missing PDF URL' }, { status: 400 })
      console.log('[pdf] handler reached, pdfUrl length:', body.pdfUrl?.length, 'chunkIndex:', body.chunkIndex)

      // Fetch and extract ALL text from PDF upfront
      const pdfResponse = await fetch(body.pdfUrl)
      if (!pdfResponse.ok) return Response.json({ error: 'Could not fetch PDF: ' + pdfResponse.status }, { status: 500 })
      const pdfBuffer = await pdfResponse.arrayBuffer()

      let pdfText = ''
      try {
        const pdfParse = await getPdfParse()
        const parsed = await pdfParse(Buffer.from(pdfBuffer))
        pdfText = parsed.text
        console.log('[pdf] extracted', pdfText.length, 'chars from', parsed.numpages, 'pages')
        console.log('[pdf] text preview (first 500):', pdfText.substring(0, 500))
      } catch (parseErr) {
        console.error('[pdf] text extraction failed:', parseErr.message)
        return Response.json({ error: 'Could not read this PDF. Make sure it is a digital PDF with selectable text, not a scanned image.' }, { status: 422 })
      }

      if (!pdfText || pdfText.trim().length < 100) {
        return Response.json({ error: 'This PDF appears to be a scanned image. Only digital PDFs with selectable text are supported. Try uploading a photo of the recipe page instead.' }, { status: 422 })
      }

      // Split into overlapping chunks
      // CHUNK_SIZE = 20000 chars (~5000 tokens) — leaves plenty of room for output
      // OVERLAP = 6000 chars — larger than any single recipe, guarantees no recipe
      // is ever fully split across a boundary
      const CHUNK_SIZE = 20000
      const OVERLAP = 6000
      const chunks = []
      let pos = 0
      while (pos < pdfText.length) {
        chunks.push(pdfText.substring(pos, pos + CHUNK_SIZE))
        if (pos + CHUNK_SIZE >= pdfText.length) break
        pos += (CHUNK_SIZE - OVERLAP)
      }
      console.log('[pdf] total chunks:', chunks.length, 'for', pdfText.length, 'chars')

      const chunkIndex = body.chunkIndex || 0
      const chunk = chunks[chunkIndex]
      const hasMore = chunkIndex < chunks.length - 1

      console.log('[pdf] chunk', chunkIndex + 1, 'of', chunks.length, '— chars:', chunk?.length, 'totalChunks:', chunks.length)
      console.log('[pdf] chunk preview (first 300):', chunk?.substring(0, 300))

      if (!chunk || !chunk.trim()) {
        return Response.json({ recipes: [], truncated: false })
      }

      const resp = await callWithRetry(() => anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system: PDF_SYSTEM,
        messages: [{
          role: 'user',
          content: 'Extract ALL recipes from this section of a recipe book. Return every complete recipe you find.\n\nText:\n' + chunk
        }]
      }))

      const raw = resp.content[0]?.text?.trim() || ''
      const hitTokenLimit = resp.stop_reason === 'max_tokens'
      // truncated = there are more chunks OR Claude hit its output limit
      const truncated = hasMore || hitTokenLimit
      console.log('[pdf] chunk', chunkIndex + 1, 'stop:', resp.stop_reason, 'recipes raw len:', raw.length, 'more chunks:', hasMore)
      console.log('[pdf] raw response preview:', raw.substring(0, 500))

      const recipes = parseRaw(raw, hitTokenLimit).map(sanitizeRecipe)
      // Return nextChunkIndex so client knows what to ask for next
      return Response.json({ recipes, truncated, nextChunkIndex: hasMore ? chunkIndex + 1 : null })
    }

    else {
      return Response.json({ error: 'Invalid type.' }, { status: 400 })
    }

    // Single recipe extraction (url/image/manual)
    const response = await callWithRetry(() => anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      system: SYSTEM,
      messages,
    }))

    const rawText = response.content[0]?.text?.trim() || ''
    if (!rawText) return Response.json({ error: 'Claude returned empty response' }, { status: 500 })

    let recipe
    try {
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      recipe = sanitizeRecipe(JSON.parse(cleaned))
    } catch {
      return Response.json({ error: 'Could not parse recipe. Please try again or use manual entry.' }, { status: 500 })
    }

    if (!recipe.title || !recipe.ingredients?.length || !recipe.instructions?.length) {
      return Response.json({ error: 'Could not find a complete recipe. Please check the URL or try manual entry.' }, { status: 422 })
    }

    return Response.json({ recipe })

  } catch (err) {
    console.error('Recipe extract error:', err)
    const isRateLimit = err.status === 429 || (err.message && err.message.includes('rate limit'))
    const msg = isRateLimit
      ? 'Dot is busy right now — too many requests at once. Please wait 60 seconds and try again.'
      : err.message || 'Something went wrong.'
    return Response.json({ error: msg }, { status: isRateLimit ? 429 : 500 })
  }
}
