import type {
  ChatMessage,
  Conversation,
  ErrorPattern,
  Level,
  Pedagogy,
  Profile,
  Progress,
  SavedWord,
  Settings,
} from '../types'
import { migrateLevel } from './levels'

const KEY = 'maya.english.v2'
const OLD_KEY = 'maya.english.v1'

type Store = {
  profile: Profile | null
  settings: Settings
  conversations: Conversation[]
  activeId: string | null
  vocab: SavedWord[]
  progress: Progress
}

const defaultSettings: Settings = {
  provider: 'groq',
  apiKey: '',
  autoSpeak: true,
  showTranslation: true,
}

export const defaultProgress: Progress = {
  streak: 0,
  lastPracticeDate: '',
  messagesCount: 0,
  conversationsCount: 0,
  xp: 0,
  correctionsCount: 0,
  correctTurns: 0,
  englishTurns: 0,
  spokenTurns: 0,
  errors: [],
  errorTypes: {},
  suggestedLevel: null,
  reviewTip: null,
}

function blank(): Store {
  return {
    profile: null,
    settings: defaultSettings,
    conversations: [],
    activeId: null,
    vocab: [],
    progress: defaultProgress,
  }
}

function migrateProfile(profile: Profile | null): Profile | null {
  if (!profile) return null
  return { ...profile, level: migrateLevel(String(profile.level)) }
}

function read(): Store {
  try {
    if (typeof localStorage === 'undefined') return blank()
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY)
    if (!raw) return blank()
    const fromOld = Boolean(localStorage.getItem(OLD_KEY) && !localStorage.getItem(KEY))
    const parsed = JSON.parse(raw) as Partial<Store>
    const progress = {
      ...defaultProgress,
      ...parsed.progress,
      errors: (parsed.progress?.errors ?? []).map((item) => ({
        ...item,
        errorType: item.errorType ?? 'other',
      })),
      errorTypes: { ...parsed.progress?.errorTypes },
      suggestedLevel: parsed.progress?.suggestedLevel ?? null,
      reviewTip: parsed.progress?.reviewTip ?? null,
      conversationsCount:
        parsed.progress?.conversationsCount ??
        parsed.conversations?.filter((item) => item.messages?.some((m) => m.role === 'user')).length ??
        0,
    }
    const store: Store = {
      ...blank(),
      ...parsed,
      profile: migrateProfile(parsed.profile ?? null),
      settings: { ...defaultSettings, ...parsed.settings },
      progress,
      conversations: parsed.conversations ?? [],
      vocab: parsed.vocab ?? [],
    }
    if (fromOld) {
      write(store)
      localStorage.removeItem(OLD_KEY)
    }
    return store
  } catch {
    return blank()
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage full or blocked */
  }
}

export function uid(): string {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && 'randomUUID' in cryptoObj) {
    return cryptoObj.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function loadStore(): Store {
  return read()
}

export function saveProfile(profile: Profile) {
  const store = read()
  store.profile = profile
  write(store)
}

export function saveSettings(settings: Settings) {
  const store = read()
  store.settings = settings
  write(store)
}

export function saveConversations(conversations: Conversation[], activeId: string | null) {
  const store = read()
  store.conversations = conversations.slice(0, 40)
  store.activeId = activeId
  write(store)
}

export function saveVocab(vocab: SavedWord[]) {
  const store = read()
  store.vocab = vocab
  write(store)
}

export function saveProgress(progress: Progress) {
  const store = read()
  store.progress = progress
  write(store)
}

function looksPortuguese(text: string): boolean {
  return /[áàâãéêíóôõúç]|(\b(não|hoje|trabalho|você|que|para|com|uma|está)\b)/i.test(text)
}

function mergeErrors(existing: ErrorPattern[], pedagogy: Pedagogy): ErrorPattern[] {
  if (
    (pedagogy.severity !== 'medium' && pedagogy.severity !== 'high') ||
    !pedagogy.original ||
    !pedagogy.correction
  ) {
    return existing
  }
  const key = `${pedagogy.original}→${pedagogy.correction}`.toLowerCase()
  const now = new Date().toISOString()
  const map = new Map(existing.map((item) => [`${item.original}→${item.corrected}`.toLowerCase(), item]))
  const prev = map.get(key)
  if (prev) {
    map.set(key, { ...prev, count: prev.count + 1, lastSeen: now, errorType: pedagogy.errorType })
  } else {
    map.set(key, {
      original: pedagogy.original,
      corrected: pedagogy.correction,
      count: 1,
      lastSeen: now,
      errorType: pedagogy.errorType,
    })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen)).slice(0, 24)
}

export function recordTurn(input: {
  userText?: string
  viaVoice?: boolean
  pedagogy?: Pedagogy | null
  xp?: number
  suggestedLevel?: Level | null
  reviewTip?: string | null
}): Progress {
  const store = read()
  const today = todayStamp()
  const last = store.progress.lastPracticeDate
  let streak = store.progress.streak
  if (last !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y = yesterday.toISOString().slice(0, 10)
    streak = last === y ? streak + 1 : 1
  }

  const spoke = Boolean(input.userText)
  const english = spoke && !looksPortuguese(input.userText || '')
  const pedagogy = input.pedagogy
  const taught = Boolean(
    pedagogy && (pedagogy.severity === 'medium' || pedagogy.severity === 'high') && pedagogy.correction,
  )
  const goodEnough = spoke && !taught
  const errorTypes = { ...store.progress.errorTypes }
  if (spoke && pedagogy && pedagogy.errorType !== 'none') {
    const key = pedagogy.errorType
    errorTypes[key] = (errorTypes[key] ?? 0) + 1
  }

  store.progress = {
    ...store.progress,
    streak,
    lastPracticeDate: today,
    messagesCount: store.progress.messagesCount + (spoke ? 1 : 0),
    xp: store.progress.xp + (input.xp ?? (spoke ? (taught ? 10 : 16) : 4)),
    correctionsCount: store.progress.correctionsCount + (taught ? 1 : 0),
    correctTurns: store.progress.correctTurns + (goodEnough ? 1 : 0),
    englishTurns: store.progress.englishTurns + (english ? 1 : 0),
    spokenTurns: store.progress.spokenTurns + (input.viaVoice ? 1 : 0),
    errors: pedagogy ? mergeErrors(store.progress.errors, pedagogy) : store.progress.errors,
    errorTypes,
    suggestedLevel: input.suggestedLevel ?? store.progress.suggestedLevel,
    reviewTip: input.reviewTip ?? store.progress.reviewTip,
  }
  write(store)
  return store.progress
}

export function recordNewConversation(): Progress {
  const store = read()
  store.progress = { ...store.progress, conversationsCount: store.progress.conversationsCount + 1 }
  write(store)
  return store.progress
}

export function resetAll() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(OLD_KEY)
}

export function newConversation(scenarioId: string, title: string): Conversation {
  return {
    id: uid(),
    title,
    scenarioId,
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}

export function appendMessage(conversation: Conversation, message: ChatMessage): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString(),
    title:
      conversation.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 42)
        : conversation.title,
  }
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}
