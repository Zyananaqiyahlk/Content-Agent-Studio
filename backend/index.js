// Claude (Anthropic)
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
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
  return {
    text: data.content[0].text,
    tokensUsed,
    costToYou: ((data.usage?.input_tokens || 0) / 1000 * 0.003) + ((data.usage?.output_tokens || 0) / 1000 * 0.015)
  }
}

// OpenAI
export async function callOpenAI(prompt, apiKey, model, systemPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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
  const tokensUsed = data.usage?.total_tokens || 0
  const costMap = { 'gpt-4o': 0.005, 'gpt-4o-mini': 0.00015 }
  return {
    text: data.choices[0].message.content,
    tokensUsed,
    costToYou: (tokensUsed / 1000) * (costMap[model] || 0.005)
  }
}

// Google Gemini
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
  const costMap = { 'gemini-1.5-pro': 0.0035, 'gemini-1.5-flash': 0.000075 }
  const tokensUsed = data.usageMetadata?.totalTokenCount || 500
  return {
    text: data.candidates[0].content.parts[0].text,
    tokensUsed,
    costToYou: (tokensUsed / 1000) * (costMap[modelName] || 0.000075)
  }
}

// Together AI (Llama)
export async function callLlama(prompt, apiKey, model, systemPrompt) {
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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
  if (data.error) throw new Error(`Llama: ${data.error?.message || 'Unknown error'}`)
  const tokensUsed = data.usage?.total_tokens || 500
  return {
    text: data.choices[0].message.content,
    tokensUsed,
    costToYou: (tokensUsed / 1000) * 0.0009
  }
}
