import type { IncomingMessage, ServerResponse } from 'node:http'

type ChatBody = {
  provider?: string
  apiKey?: string
  systemPrompt?: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
  userMessage?: string | null
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function envKey(provider: string): string {
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || ''
  if (provider === 'openai') return process.env.OPENAI_API_KEY || ''
  return process.env.GROQ_API_KEY || ''
}

async function groqChat(apiKey: string, systemPrompt: string, messages: ChatBody['messages'], userMessage: string | null) {
  const payload = [
    { role: 'system', content: systemPrompt },
    ...(messages ?? []),
    ...(userMessage ? [{ role: 'user' as const, content: userMessage }] : [{ role: 'user' as const, content: 'Start the conversation now.' }]),
  ]

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
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

async function openaiChat(apiKey: string, systemPrompt: string, messages: ChatBody['messages'], userMessage: string | null) {
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

async function geminiChat(apiKey: string, systemPrompt: string, messages: ChatBody['messages'], userMessage: string | null) {
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

function mapProviderError(provider: string, status: number, message?: string): string {
  if (status === 401 || status === 403) {
    return 'Chave de API inválida. Confira em Ajustes.'
  }
  if (status === 429) {
    return 'A I.A. atingiu o limite agora. Espere uns segundos e tente de novo.'
  }
  return message || `Erro no provedor ${provider} (${status}).`
}

export async function handleChat(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    send(res, 405, { error: 'Use POST.' })
    return
  }

  let body: ChatBody
  try {
    body = JSON.parse(await readBody(req)) as ChatBody
  } catch {
    send(res, 400, { error: 'JSON inválido.' })
    return
  }

  const provider = (body.provider || 'groq').toLowerCase()
  const apiKey = (body.apiKey || envKey(provider)).trim()
  if (!apiKey) {
    send(res, 400, {
      error:
        'Adicione uma chave de API grátis (Groq ou Gemini) em Ajustes para conversar com a Maya.',
    })
    return
  }
  if (!body.systemPrompt) {
    send(res, 400, { error: 'Prompt ausente.' })
    return
  }

  try {
    let text = ''
    if (provider === 'openai') {
      text = await openaiChat(apiKey, body.systemPrompt, body.messages, body.userMessage ?? null)
    } else if (provider === 'gemini') {
      text = await geminiChat(apiKey, body.systemPrompt, body.messages, body.userMessage ?? null)
    } else {
      text = await groqChat(apiKey, body.systemPrompt, body.messages, body.userMessage ?? null)
    }
    send(res, 200, { text })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 502
    const message = error instanceof Error ? error.message : 'Falha ao chamar a I.A.'
    send(res, status || 502, { error: message })
  }
}
