export async function callClaude(prompt, apiKey, model, systemPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(`Claude: ${data.error.message}`)
  return {
    text: data.content[0].text,
    tokensUsed: (data.usage?.input_tokens||0) + (data.usage?.output_tokens||0),
    costToYou: ((data.usage?.input_tokens||0)/1000*0.003) + ((data.usage?.output_tokens||0)/1000*0.015)
  }
}

export async function callOpenAI(prompt, apiKey, model, systemPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(`OpenAI: ${data.error.message}`)
  return {
    text: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
    costToYou: ((data.usage?.total_tokens||0)/1000)*0.005
  }
}

export async function callGemini(prompt, apiKey, model, systemPrompt) {
  const modelName = model || 'gemini-1.5-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: { maxOutputTokens: 1500 }
      })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(`Gemini: ${data.error.message}`)
  return {
    text: data.candidates[0].content.parts[0].text,
    tokensUsed: data.usageMetadata?.totalTokenCount || 500,
    costToYou: 0.001
  }
}

export async function callLlama(prompt, apiKey, model, systemPrompt) {
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'meta-llama/Llama-3-70b-chat-hf',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(`Llama: ${data.error?.message || 'Unknown'}`)
  return {
    text: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 500,
    costToYou: 0.0008
  }
}