import type { IncomingMessage, ServerResponse } from 'node:http'
import { completeChat } from '../src/lib/providers.ts'

type ChatBody = {
  provider?: string
  systemPrompt?: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
  userMessage?: string | null
}

function allowedOrigins(): string[] {
  const raw = process.env.MAYA_ALLOWED_ORIGINS || '*'
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function applyCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin || ''
  const allowed = allowedOrigins()
  if (allowed.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  } else if (origin && allowed.some((item) => origin === item || origin.startsWith(`${item}/`))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (origin && allowed.some((item) => item.endsWith('.github.io') && origin.endsWith('.github.io'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

function send(req: IncomingMessage, res: ServerResponse, status: number, payload: unknown) {
  applyCors(req, res)
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

function configuredProvider(): string {
  if (envKey('groq')) return 'groq'
  if (envKey('gemini')) return 'gemini'
  if (envKey('openai')) return 'openai'
  return 'groq'
}

function pathname(req: IncomingMessage): string {
  return (req.url || '').split('?')[0]
}

export async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const path = pathname(req)
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    res.end()
    return
  }
  if (path === '/api/status' || path === '/api/status/') {
    send(req, res, 200, {
      ready: Boolean(envKey(configuredProvider())),
      provider: configuredProvider(),
    })
    return
  }
  if (path === '/api/chat' || path === '/api/chat/') {
    await handleChat(req, res)
    return
  }
  send(req, res, 404, { error: 'Rota não encontrada.' })
}

async function handleChat(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    send(req, res, 405, { error: 'Use POST.' })
    return
  }

  let body: ChatBody
  try {
    body = JSON.parse(await readBody(req)) as ChatBody
  } catch {
    send(req, res, 400, { error: 'JSON inválido.' })
    return
  }

  const requested = (body.provider || configuredProvider()).toLowerCase()
  const provider = envKey(requested) ? requested : configuredProvider()
  const apiKey = envKey(provider).trim()

  if (!apiKey) {
    send(req, res, 503, {
      error: 'A I.A. não está configurada no servidor. Adicione GROQ_API_KEY nas variáveis secretas da hospedagem.',
    })
    return
  }

  try {
    const text = await completeChat({
      provider,
      apiKey,
      systemPrompt: body.systemPrompt || '',
      messages: body.messages,
      userMessage: body.userMessage ?? null,
    })
    send(req, res, 200, { text })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 502
    const message = error instanceof Error ? error.message : 'Falha ao chamar a I.A.'
    send(req, res, status || 502, { error: message })
  }
}
