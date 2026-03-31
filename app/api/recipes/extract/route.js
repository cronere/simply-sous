import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── SYSTEM PROMPT ────────────────────────────────────────────
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

// ── ROUTE HANDLER ────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, url, imageBase64, imageType, text, familySize } = body

    if (!type) {
      return Response.json({ error: 'Missing type' }, { status: 400 })
    }

    let messages = []

    // ── URL extraction ──
    if (type === 'url') {
      if (!url) return Response.json({ error: 'Missing URL' }, { status: 400 })

      // Fetch the page content
      let pageContent = ''
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SimplySous/1.0)' },
          signal: AbortSignal.timeout(10000),
        })
        const html = await res.text()
        // Strip HTML tags to get readable text (basic)
        pageContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 15000) // Limit to avoid token overload
      } catch (fetchErr) {
        return Response.json(
          { error: 'Could not fetch that URL. The site may block scrapers. Try copying the recipe text manually.' },
          { status: 422 }
        )
      }

      messages = [{
        role: 'user',
        content: `Extract the recipe from this webpage content. The original URL was: ${url}

Webpage content:
${pageContent}

${familySize ? `Scale ingredients for ${familySize} servings (base_servings should be ${familySize}).` : ''}

Return the recipe as JSON.`
      }]
    }

    // ── Image/screenshot extraction ──
    else if (type === 'image') {
      if (!imageBase64 || !imageType) {
        return Response.json({ error: 'Missing image data' }, { status: 400 })
      }

      messages = [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Extract the recipe from this image. This could be a screenshot from social media, a photo of a cookbook page, or a recipe card.

${familySize ? `Scale ingredients for ${familySize} servings (base_servings should be ${familySize}).` : ''}

Return the recipe as JSON.`,
          },
        ],
      }]
    }

    // ── Manual text extraction ──
    else if (type === 'manual') {
      if (!text) return Response.json({ error: 'Missing text' }, { status: 400 })

      messages = [{
        role: 'user',
        content: `Extract and structure this recipe:

${text}

${familySize ? `Scale ingredients for ${familySize} servings (base_servings should be ${familySize}).` : ''}

Return the recipe as JSON.`
      }]
    }

    else {
      return Response.json({ error: 'Invalid type. Use url, image, or manual.' }, { status: 400 })
    }

    // ── Call Claude ──
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      system: SYSTEM,
      messages,
    })

    const rawText = response.content[0]?.text?.trim()
    if (!rawText) {
      return Response.json({ error: 'Claude returned empty response' }, { status: 500 })
    }

    // Parse JSON — strip any accidental markdown fences
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

    // Validate required fields
    if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
      return Response.json(
        { error: 'Could not find a complete recipe. Please check the URL or try manual entry.' },
        { status: 422 }
      )
    }

    return Response.json({ recipe })

  } catch (err) {
    console.error('Recipe extract error:', err)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
