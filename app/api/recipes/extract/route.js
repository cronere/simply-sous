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
  "meal_type": "breakfast | lunch | dinner | snack | dessert",
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
      if (!body.pdfBase64) return Response.json({ error: 'Missing PDF data' }, { status: 400 })

      const scaleNote = familySize ? 'Scale all recipe ingredients for ' + familySize + ' servings.' : ''

      // Claude max output is 8192 tokens — not enough for large cookbooks in one pass.
      // Strategy: send the full PDF but ask Claude to extract in passes using page ranges.
      // For very large PDFs we make multiple calls with page range hints.
      const pdfData = body.pdfBase64

      // First pass: extract all recipes from full PDF
      // Claude will do its best within token limits; we capture partial results gracefully
      const allRecipes = []
      const seenTitles = new Set()

      const extractPass = async (startHint, endHint) => {
        const rangeNote = startHint ? 'Focus on pages ' + startHint + ' through ' + endHint + ' of this PDF.' : ''
        const resp = await callWithRetry(function() {
          return anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 8192,
            system: SYSTEM,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: pdfData },
                },
                {
                  type: 'text',
                  text: rangeNote + '\n\nExtract ALL recipes you find and return them as a JSON array. ' + scaleNote + '\n\nBe concise — for each recipe include: title, cuisine, cook_time_mins, base_servings, ingredients (name/amount/unit), instructions (step text only), tags, dietary_flags. Skip lengthy descriptions to fit more recipes.\n\nReturn ONLY a valid JSON array. No markdown, no explanation.',
                },
              ],
            }],
          })
        })

        const raw = resp.content[0]?.text?.trim() || ''
        if (!raw) return

        // Check if Claude hit the token limit (response cut off)
        const hitLimit = resp.stop_reason === 'max_tokens'

        try {
          // Handle truncated JSON gracefully - try to salvage complete objects
          let cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

          // If truncated, try to close the JSON array
          if (hitLimit && !cleaned.endsWith(']')) {
            // Find last complete recipe object
            const lastComplete = cleaned.lastIndexOf('},')
            if (lastComplete > 0) {
              cleaned = cleaned.substring(0, lastComplete + 1) + ']'
            } else {
              cleaned = cleaned + ']'
            }
          }

          const parsed = JSON.parse(cleaned)
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          for (const r of arr) {
            if (r.title && !seenTitles.has(r.title.toLowerCase())) {
              seenTitles.add(r.title.toLowerCase())
              allRecipes.push(r)
            }
          }
          return hitLimit // return true if we hit the limit and need another pass
        } catch {
          // Try salvaging individual recipes from malformed JSON
          const matches = raw.match(/\{[^{}]*"title"[^{}]*\}/g) || []
          for (const m of matches) {
            try {
              const r = JSON.parse(m)
              if (r.title && !seenTitles.has(r.title.toLowerCase())) {
                seenTitles.add(r.title.toLowerCase())
                allRecipes.push(r)
              }
            } catch { /* skip malformed */ }
          }
        }
      }

      // First pass - full document
      const needsMore = await extractPass(null, null)

      // If we hit the token limit, do additional passes with page range hints
      // This helps Claude focus on later pages it may have missed
      if (needsMore && allRecipes.length > 0) {
        // Estimate pages per recipe to figure out where we left off
        // We'll try a second pass asking Claude to start from where recipes seem to end
        await extractPass(Math.floor(allRecipes.length * 2), 999)
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
