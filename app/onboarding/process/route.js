import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callWithRetry(fn, max) {
  var maxRetries = max || 3
  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn() } catch (err) {
      var overloaded = err.status === 529 || (err.message && err.message.includes('overload'))
      if (overloaded && attempt < maxRetries) {
        await new Promise(function(r) { setTimeout(r, Math.pow(2, attempt) * 2000) })
        continue
      }
      throw err
    }
  }
}

export async function POST(request) {
  try {
    const { userId } = await request.json()
    if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get profile for family size
    const { data: profile } = await sb
      .from('profiles')
      .select('family_size')
      .eq('id', userId)
      .single()

    const familySize = profile?.family_size || 4

    // Get all pending onboarding uploads for this user
    const { data: uploads } = await sb
      .from('onboarding_uploads')
      .select('*')
      .eq('profile_id', userId)
      .eq('status', 'pending')

    if (!uploads || uploads.length === 0) {
      return Response.json({ processed: 0, message: 'No pending uploads' })
    }

    let processed = 0
    let failed = 0

    for (const upload of uploads) {
      try {
        let recipe = null

        // URL uploads
        if (upload.file_type === 'url' || (upload.storage_path && upload.storage_path.startsWith('http'))) {
          const url = upload.storage_path || upload.original_name

          // Fetch page content
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SimplySous/1.0)' },
            signal: AbortSignal.timeout(10000),
          })
          const html = await res.text()
          const pageContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 15000)

          const response = await callWithRetry(function() {
            return anthropic.messages.create({
              model: 'claude-opus-4-6',
              max_tokens: 3000,
              system: 'You are a recipe extraction API. Return ONLY valid JSON. No markdown, no explanation.',
              messages: [{
                role: 'user',
                content: 'Extract the recipe from this webpage. URL: ' + url + '\n\nContent:\n' + pageContent +
                  '\n\nScale for ' + familySize + ' servings. Return JSON with: title, description, cuisine, meal_type, difficulty(1-5), prep_time_mins, cook_time_mins, total_time_mins, base_servings(' + familySize + '), ingredients([{name,amount,unit,notes}]), instructions([{step,text,timer_minutes}]), tags[], dietary_flags[]'
              }]
            })
          })

          const raw = response.content[0]?.text?.trim() || ''
          const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
          recipe = JSON.parse(cleaned)
        }

        // Image uploads
        else if (upload.file_type === 'image' && upload.storage_path) {
          const { data: fileData } = await sb.storage
            .from('onboarding-uploads')
            .download(upload.storage_path)

          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const mediaType = upload.storage_path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'

            const response = await callWithRetry(function() {
              return anthropic.messages.create({
                model: 'claude-opus-4-6',
                max_tokens: 3000,
                system: 'You are a recipe extraction API. Return ONLY valid JSON. No markdown, no explanation.',
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                    { type: 'text', text: 'Extract the recipe from this image. Scale for ' + familySize + ' servings. Return JSON with: title, description, cuisine, meal_type, difficulty(1-5), prep_time_mins, cook_time_mins, total_time_mins, base_servings(' + familySize + '), ingredients([{name,amount,unit,notes}]), instructions([{step,text,timer_minutes}]), tags[], dietary_flags[]' }
                  ]
                }]
              })
            })

            const raw = response.content[0]?.text?.trim() || ''
            const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
            recipe = JSON.parse(cleaned)
          }
        }

        if (recipe && recipe.title) {
          // Save to recipes vault
          await sb.from('recipes').insert({
            profile_id: userId,
            title: recipe.title,
            description: recipe.description || null,
            source_type: upload.storage_path?.startsWith('http') ? 'url' : 'screenshot',
            source_url: upload.storage_path?.startsWith('http') ? upload.storage_path : null,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            prep_time_mins: recipe.prep_time_mins || null,
            cook_time_mins: recipe.cook_time_mins || null,
            total_time_mins: recipe.total_time_mins || null,
            base_servings: recipe.base_servings || familySize,
            cuisine: recipe.cuisine || null,
            meal_type: recipe.meal_type || 'dinner',
            difficulty: recipe.difficulty || 2,
            tags: recipe.tags || [],
            dietary_flags: recipe.dietary_flags || [],
            ai_processed: true,
          })

          // Mark upload as processed
          await sb.from('onboarding_uploads')
            .update({ status: 'processed' })
            .eq('id', upload.id)

          processed++
        }
      } catch (err) {
        console.error('Failed to process upload ' + upload.id + ':', err.message)
        await sb.from('onboarding_uploads')
          .update({ status: 'failed' })
          .eq('id', upload.id)
        failed++
      }
    }

    return Response.json({ processed, failed, total: uploads.length })

  } catch (err) {
    console.error('Process onboarding error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
