import Anthropic from '@anthropic-ai/sdk'

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

const PDF_SYSTEM = `You are a recipe extraction expert. Extract recipes from PDFs VERBATIM.
Copy ingredient amounts exactly as written — never calculate, scale, or interpret quantities.
If it says "a pinch" or "to taste" or "light sprinkle", copy those exact words.
base_servings = what the recipe states, never the user's family size.
Return a JSON array ONLY — no markdown, no backticks, no explanation.
Each recipe: {"title":"","description":"","cuisine":"","meal_type":"dinner","difficulty":2,"prep_time_mins":null,"cook_time_mins":null,"base_servings":4,"ingredients":[{"name":"","amount":null,"unit":null,"notes":null}],"instructions":[{"step":1,"text":""}],"tags":[],"dietary_flags":[]}
meal_type options: breakfast, lunch, dinner, snack, dessert, sauce, drink, bread, side
Start response with [ and end with ].`

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
  let s = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  if (hitLimit || (!s.endsWith(']') && s.includes('}'))) {
    const last = s.lastIndexOf('}')
    if (last > 0) {
      s = s.substring(0, last + 1)
      if (!s.startsWith('[')) s = '[' + s
      s = s + ']'
    }
  }
  try {
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    const out = []
    const re = /\{"title"[\s\S]*?\}(?=\s*[,\]]|\s*$)/g
    let m
    while ((m = re.exec(s)) !== null) {
      try { const r = JSON.parse(m[0]); if (r.title) out.push(r) } catch {}
    }
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

      const pdfResponse = await fetch(body.pdfUrl)
      if (!pdfResponse.ok) return Response.json({ error: 'Could not fetch PDF: ' + pdfResponse.status }, { status: 500 })
      const pdfBuffer = await pdfResponse.arrayBuffer()
      const pdfBytes = new Uint8Array(pdfBuffer)
      let binary = ''
      pdfBytes.forEach(b => binary += String.fromCharCode(b))
      const pdfData = btoa(binary)

      // lastTitle is passed on pass 2 to skip already-extracted recipes
      const instruction = lastTitle
        ? 'Extract all recipes AFTER "' + lastTitle + '". Skip any recipes before or including that one.'
        : 'Extract ALL recipes from this PDF.'

      // Haiku for PDF: much higher rate limits + lower cost, quality sufficient for extraction
      // Delay between passes to let the token bucket refill
      if (body.lastTitle) {
        console.log('[pdf] waiting 65s before pass 2+ to avoid rate limit...')
        await new Promise(resolve => setTimeout(resolve, 65000))
      }

      const resp = await callWithRetry(() => anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system: PDF_SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfData } },
            { type: 'text', text: instruction }
          ]
        }]
      }))

      const raw = resp.content[0]?.text?.trim() || ''
      const truncated = resp.stop_reason === 'max_tokens'
      console.log('[pdf] stop:', resp.stop_reason, 'len:', raw.length, 'truncated:', truncated)

      const recipes = parseRaw(raw, truncated).map(sanitizeRecipe)
      return Response.json({ recipes, truncated })
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
