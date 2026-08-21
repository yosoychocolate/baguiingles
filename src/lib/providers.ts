export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type CompleteChatInput = {
  provider: string
  apiKey: string
  systemPrompt: string
  messages?: ChatTurn[]
  userMessage?: string | null
}

function mapProviderError(provider: string, status: number, message?: string): string {
  if (status === 401 || status === 403) {
    return 'Chave de API inválida. Crie outra no console da Groq e coloque só no arquivo .env.'
  }
  if (status === 429) {
    return 'A I.A. atingiu o limite agora. Espere uns segundos e tente de novo.'
  }
  return message || `Erro no provedor ${provider} (${status}).`
}

async function groqChat(apiKey: string, systemPrompt: string, messages: ChatTurn[] | undefined, userMessage: string | null) {
  const payload = [
    { role: 'system', content: systemPrompt },
    ...(messages ?? []),
    ...(userMessage
      ? [{ role: 'user' as const, content: userMessage }]
      : [{ role: 'user' as const, content: 'Start the conversation now.' }]),
  ]

  const models = ['openai/gpt-oss-120b']
  let lastError = 'Groq indisponível.'

  for (const model of models) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: payload,
      }),
    })
    const data = (await response.json()) as {
      error?: { message?: string }
      choices?: { message?: { content?: string } }[]
    }
    if (response.ok) {
      return data.choices?.[0]?.message?.content || ''
    }
    lastError = data.error?.message || lastError
    if (response.status === 401 || response.status === 429) {
      throw Object.assign(new Error(mapProviderError('groq', response.status, lastError)), { status: response.status })
    }
  }
  throw new Error(lastError)
}

async function openaiChat(apiKey: string, systemPrompt: string, messages: ChatTurn[] | undefined, userMessage: string | null) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages ?? []),
        ...(userMessage
          ? [{ role: 'user' as const, content: userMessage }]
          : [{ role: 'user' as const, content: 'Start the conversation now.' }]),
      ],
    }),
  })
  const data = (await response.json()) as {
    error?: { message?: string }
    choices?: { message?: { content?: string } }[]
  }
  if (!response.ok) {
    throw Object.assign(new Error(mapProviderError('openai', response.status, data.error?.message)), {
      status: response.status,
    })
  }
  return data.choices?.[0]?.message?.content || ''
}

async function geminiChat(apiKey: string, systemPrompt: string, messages: ChatTurn[] | undefined, userMessage: string | null) {
  const contents = [
    ...(messages ?? []).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage || 'Start the conversation now.' }],
    },
  ]

  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
  let lastError = 'Gemini indisponível.'

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      },
    )
    const data = (await response.json()) as {
      error?: { message?: string }
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    if (response.ok) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
    lastError = data.error?.message || lastError
    if (response.status === 400 && /not found|not supported/i.test(lastError)) continue
    throw Object.assign(new Error(mapProviderError('gemini', response.status, lastError)), { status: response.status })
  }
  throw new Error(lastError)
}

export async function completeChat(input: CompleteChatInput): Promise<string> {
  const provider = (input.provider || 'groq').toLowerCase()
  const apiKey = input.apiKey.trim()
  if (!apiKey) {
    throw new Error('A Groq não está configurada no servidor. Coloque GROQ_API_KEY no arquivo .env e rode npm run dev.')
  }
  if (!input.systemPrompt) {
    throw new Error('Prompt ausente.')
  }

  try {
    if (provider === 'openai') {
      return await openaiChat(apiKey, input.systemPrompt, input.messages, input.userMessage ?? null)
    }
    if (provider === 'gemini') {
      return await geminiChat(apiKey, input.systemPrompt, input.messages, input.userMessage ?? null)
    }
    return await groqChat(apiKey, input.systemPrompt, input.messages, input.userMessage ?? null)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'A I.A. só responde pelo servidor local. Abra a Maya com npm run dev. A chave não vai no navegador.',
      )
    }
    throw error
  }
}
