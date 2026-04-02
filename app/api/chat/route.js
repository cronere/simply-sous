import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callWithRetry(fn, max) {
  var maxR = max || 3
  for (var attempt = 0; attempt <= maxR; attempt++) {
    try { return await fn() } catch (err) {
      var code = err.status || err.statusCode || (err.error && err.error.type === 'overloaded_error' ? 529 : 0)
      var overloaded = code === 529 || (err.message && err.message.toLowerCase().includes('overload'))
      if ((overloaded || code === 429) && attempt < maxR) {
        await new Promise(function(r) { setTimeout(r, Math.pow(2, attempt) * 1500) })
        continue
      }
      throw err
    }
  }
}

export async function POST(request) {
  try {
    var body = await request.json()
    var messages = body.messages || []
    var systemPrompt = body.systemPrompt || 'You are Dot, a helpful kitchen assistant.'

    if (!messages.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    var response = await callWithRetry(function() {
      return anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      })
    })

    var content = response.content[0] && response.content[0].text ? response.content[0].text : ''

    return Response.json({ content })

  } catch (err) {
    console.error('Chat API error:', err.message)
    var msg = err.message || 'Chat failed'
    if (msg.toLowerCase().includes('overload')) {
      msg = 'Dot is a little busy right now. Try again in a moment.'
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}

