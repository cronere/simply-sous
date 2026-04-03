import Anthropic from '@anthropic-ai/sdk'

// Increase body size limit for PDF uploads
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function callWithRetry(fn, maxRetries) {
  var max = maxRetries || 3
  for (var attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn()
    } catch (err) {
      var isOverloaded = err.status === 529 || (err.message && err.message.includes('overloaded'))
      var isRateLimit = err.status === 429
      if ((isOverloaded || isRateLimit) && attempt < max) {
        var delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
        console.log('Anthropic overloaded, retrying in ' + Math.round(delay) + 'ms (attempt ' + (attempt + 1) + '/' + max + ')')
        await new Promise(function(resolve) { setTimeout(resolve, delay) })
        continue
      }
      throw err
    }
  }
}

const SYSTEM = `You are a recipe extraction expert for Simply Sous, a family meal planning app.
Your job is to extract recipe information from URLs, images, or text and return it as clean structured JSON.

Always return valid JSON matching this exact structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "source_url": "original URL if provided, else null",
  "cuisine": "e.g. Italian, Mexican, American, Thai, etc.",
  "meal_type": "breakfast | lunch | dinner | snack | dessert | sauce | drink | bread | side",
  "difficulty": 1-5 (1=easy, 5=hard),
  "prep_time_mins": number or null,
  "cook_time_mins": number or null,
  "base_servings": number (default 4 if unknown),
  "ingredients": [
    { "name": "ingredient name", "amount": number or null, "unit": "cup/tsp/lbs/etc or null", "notes": "optional prep note or null" }
  ],
  "instructions": [
    { "step": 1, "text": "instruction text", "timer_minutes": number or null }
  ],
  "tags": ["tag1", "tag2"],
  "dietary_flags": ["gluten-free", "dairy-free", "vegan", "vegetarian", "nut-free", "low-carb", "keto", "paleo"]
}

Tag guidelines — include relevant tags from these categories:
- Protein: chicken, beef, pork, seafood, salmon, turkey, lamb, tofu, eggs, vegetarian, vegan
- Cuisine: the cuisine type
- Time: "under-20-min", "under-30-min", "under-45-min", "under-1-hour", "over-1-hour"
- Occasion: weeknight, weekend, meal-prep, date-night, kid-friendly, company
- Method: one-pan, sheet-pan, slow-cooker, instant-pot, grilling, air-fryer, stovetop, baked
- Flavor: spicy, savory, sweet, smoky, tangy, creamy, light, comforting

Only include dietary_flags that genuinely apply based on the ingredients.
Be precise with ingredient amounts. If a range is given (e.g. "1-2 cups"), use the middle value.
Return ONLY the JSON object, no markdown, no explanation, no preamble.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, url, imageBase64, imageType, text, familySize } = body

    if (!type) {
      return Response.json({ error: 'Missing type' }, { status: 400 })
    }

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
      } catch (fetchErr) {
        return Response.json(
          { error: 'Could not fetch that URL. The site may block scrapers. Try copying the recipe text manually.' },
          { status: 422 }
        )
      }

      const scaleNote = familySize ? 'Scale ingredients for ' + familySize + ' servings (base_servings should be ' + familySize + ').' : ''
      messages = [{
        role: 'user',
        content: 'Extract the recipe from this webpage content. The original URL was: ' + url + '\n\nWebpage content:\n' + pageContent + '\n\n' + scaleNote + '\n\nReturn the recipe as JSON.'
      }]
    }

    else if (type === 'image') {
      if (!imageBase64 || !imageType) {
        return Response.json({ error: 'Missing image data' }, { status: 400 })
      }

      const scaleNote = familySize ? 'Scale ingredients for ' + familySize + ' servings (base_servings should be ' + familySize + ').' : ''
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'Extract the recipe from this image. This could be a screenshot from social media, a photo of a cookbook page, or a recipe card.\n\n' + scaleNote + '\n\nReturn the recipe as JSON.',
          },
        ],
      }]
    }

    else if (type === 'manual') {
      if (!text) return Response.json({ error: 'Missing text' }, { status: 400 })

      const scaleNote = familySize ? 'Scale ingredients for ' + familySize + ' servings (base_servings should be ' + familySize + ').' : ''
      messages = [{
        role: 'user',
        content: 'Extract and structure this recipe:\n\n' + text + '\n\n' + scaleNote + '\n\nReturn the recipe as JSON.'
      }]
    }

    else if (type === 'pdf') {
      if (!body.pdfUrl) return Response.json({ error: 'Missing PDF URL' }, { status: 400 })

      // Fetch PDF from Supabase Storage and convert to base64 for Claude
      const pdfResponse = await fetch(body.pdfUrl)
      if (!pdfResponse.ok) return Response.json({ error: 'Could not fetch PDF: ' + pdfResponse.status }, { status: 500 })
      const pdfBuffer = await pdfResponse.arrayBuffer()
      const pdfBytes = new Uint8Array(pdfBuffer)
      let binary = ''
      pdfBytes.forEach(b => binary += String.fromCharCode(b))
      const pdfData = btoa(binary)

      const scaleNote = familySize ? 'Scale ingredients for ' + familySize + ' servings.' : ''

      const PDF_SYSTEM = 'You are a recipe extraction expert. Extract recipes from PDFs and return a JSON array ONLY — no markdown, no backticks, no explanation. Each recipe: {"title":"","cuisine":"","meal_type":"dinner","difficulty":2,"prep_time_mins":null,"cook_time_mins":null,"base_servings":4,"ingredients":[{"name":"","amount":1,"unit":"","notes":null}],"instructions":[{"step":1,"text":""}],"tags":[],"dietary_flags":[]}. meal_type options: breakfast, lunch, dinner, snack, dessert, sauce, drink, bread, side. Keep instructions brief. Start response with [ and end with ].'

      const allRecipes = []
      const seenTitles = new Set()

      const parseRaw = (raw, hitLimit) => {
        // Strip any markdown fences
        let s = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()

        // If truncated, salvage complete objects up to last closing brace
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
          // Extract individual objects as fallback
          const out = []
          const re = /\{"title"[\s\S]*?\}(?=\s*[,\]]|\s*$)/g
          let m
          while ((m = re.exec(s)) !== null) {
            try { const r = JSON.parse(m[0]); if (r.title) out.push(r) } catch {}
          }
          return out
        }
      }

      const doPass = async (instruction) => {
        const resp = await callWithRetry(() => anthropic.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 8192,
          system: PDF_SYSTEM,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfData } },
              { type: 'text', text: instruction + ' ' + scaleNote }
            ]
          }]
        }))

        const raw = resp.content[0]?.text?.trim() || ''
        const hitLimit = resp.stop_reason === 'max_tokens'
        console.log('[pdf] stop:', resp.stop_reason, 'len:', raw.length, 'preview:', raw.slice(0, 100))

        const recipes = parseRaw(raw, hitLimit)
        let added = 0
        for (const r of recipes) {
          const key = (r.title || '').toLowerCase().trim()
          if (key && !seenTitles.has(key)) {
            seenTitles.add(key)
            allRecipes.push(r)
            added++
          }
        }
        console.log('[pdf] pass added:', added, 'total:', allRecipes.length, 'truncated:', hitLimit)
        return hitLimit
      }

      // Pass 1: full document
      const truncated = await doPass('Extract ALL recipes from this PDF.')

      // Pass 2: if truncated, get remaining recipes
      if (truncated && allRecipes.length > 0) {
        const lastTitle = allRecipes[allRecipes.length - 1]?.title || ''
        await doPass('Extract all recipes AFTER "' + lastTitle + '". Skip already extracted recipes.')
      }

      if (allRecipes.length === 0) {
        return Response.json({ error: 'No recipes found in this PDF. Make sure it contains recipe content.' }, { status: 422 })
      }

      return Response.json({ recipes: allRecipes })
    }

    else {
      return Response.json({ error: 'Invalid type. Use url, image, manual, or pdf.' }, { status: 400 })
    }

    const response = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        system: SYSTEM,
        messages,
      })
    })

    const rawText = response.content[0] && response.content[0].text ? response.content[0].text.trim() : ''
    if (!rawText) {
      return Response.json({ error: 'Claude returned empty response' }, { status: 500 })
    }

    let recipe
    try {
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      recipe = JSON.parse(cleaned)
    } catch {
      return Response.json(
        { error: 'Could not parse recipe. Please try again or use manual entry.' },
        { status: 500 }
      )
    }

    if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
      return Response.json(
        { error: 'Could not find a complete recipe. Please check the URL or try manual entry.' },
        { status: 422 }
      )
    }

    return Response.json({ recipe })

  } catch (err) {
    console.error('Recipe extract error:', err)
    return Response.json({ error: err.message || 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
