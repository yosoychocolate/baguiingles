import type { ChatMessage, ErrorPattern, Level, Provider, Scenario } from '../types'
import { completeChat } from './providers'
import { buildSystemPrompt } from './prompt'

type AnalyzeInput = {
  provider: Provider
  apiKey: string
  name: string
  level: Level
  goal: string
  scenario: Scenario
  history: ChatMessage[]
  userMessage: string | null
  frequentErrors?: ErrorPattern[]
}

async function tryChromeAi(systemPrompt: string, history: ChatMessage[], userMessage: string | null): Promise<string | null> {
  const LM = window.LanguageModel
  if (!LM) return null
  try {
    const availability = await LM.availability()
    if (availability !== 'available' && availability !== 'readily') return null
    const session = await LM.create({
      expectedInputs: [{ type: 'text', languages: ['en', 'pt'] }],
    })
    const transcript = history
      .map((m) => `${m.role === 'user' ? 'Student' : 'Maya'}: ${m.content}`)
      .join('\n')
    const turn = userMessage ? `Student: ${userMessage}` : '[Start of conversation. No student sentence yet.]'
    return await session.prompt(`${systemPrompt}\n\nConversation so far:\n${transcript || '(empty)'}\n\n${turn}`)
  } catch {
    return null
  }
}

function isLocalHost() {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

async function viaLocalProxy(input: {
  provider: Provider
  apiKey: string
  systemPrompt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  userMessage: string | null
}): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await response.json()) as { text?: string; error?: string }
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao falar com a I.A.')
  }
  return data.text || ''
}

/** Calls the language model and returns raw JSON text. Parsing and pedagogy happen elsewhere. */
export async function analyzeUtterance(input: AnalyzeInput): Promise<string> {
  const systemPrompt = buildSystemPrompt({
    name: input.name,
    level: input.level,
    goal: input.goal,
    scenario: input.scenario,
    frequentErrors: input.frequentErrors,
  })

  const history = input.history.slice(-16).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  if (!input.apiKey) {
    const local = await tryChromeAi(systemPrompt, input.history, input.userMessage)
    if (local) return local
  }

  const payload = {
    provider: input.provider,
    apiKey: input.apiKey,
    systemPrompt,
    messages: history,
    userMessage: input.userMessage,
  }

  if (isLocalHost()) {
    try {
      return await viaLocalProxy(payload)
    } catch (error) {
      if (input.apiKey) {
        return completeChat(payload)
      }
      throw error
    }
  }

  return completeChat(payload)
}
