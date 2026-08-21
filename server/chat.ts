import type { IncomingMessage, ServerResponse } from 'node:http'
import { completeChat } from '../src/lib/providers.ts'

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

  try {
    const text = await completeChat({
      provider,
      apiKey,
      systemPrompt: body.systemPrompt || '',
      messages: body.messages,
      userMessage: body.userMessage ?? null,
    })
    send(res, 200, { text })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 502
    const message = error instanceof Error ? error.message : 'Falha ao chamar a I.A.'
    send(res, status || 502, { error: message })
  }
}
