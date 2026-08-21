export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export type Provider = 'groq' | 'gemini' | 'openai'
export type View = 'chat' | 'scenarios' | 'vocab' | 'progress' | 'settings'
export type ErrorType =
  | 'none'
  | 'tense'
  | 'agreement'
  | 'article'
  | 'preposition'
  | 'word_order'
  | 'vocabulary'
  | 'spelling'
  | 'other'
export type Severity = 'none' | 'low' | 'medium' | 'high'

export type Profile = {
  name: string
  level: Level
  goal: string
  createdAt: string
}

export type Settings = {
  provider: Provider
  apiKey: string
  autoSpeak: boolean
  showTranslation: boolean
}

export type Correction = {
  original: string
  corrected: string
  explanation: string
  errorType?: ErrorType
}

export type VocabEntry = {
  word: string
  ipa?: string
  meaning: string
  example: string
}

export type LinguisticError = {
  type: ErrorType
  span: string
  naturalSentence: string
  explanation: string
  gravity: Severity
}

export type LinguisticAnalysis = {
  original: string
  observedLevel: Level
  meaningClear: boolean
  wrotePortuguese: boolean
  errors: LinguisticError[]
  vocabulary: VocabEntry[]
  candidateReply: string
  candidatePraise: string
  translation: string
  suggestions: string[]
}

export type EngineResult = {
  tutor: TutorTurn
  vocabToAdd: VocabEntry[]
  speak: string
  xp: number
  registerError: boolean
  suggestLevelUp: Level | null
  suggestLevelDown: Level | null
  reviewTip: string | null
}

export type Pedagogy = {
  level: Level
  original: string
  errorType: ErrorType
  correction: string | null
  explanation: string | null
  severity: Severity
  newVocabulary: VocabEntry[]
  nextQuestion: string
}

export type TutorTurn = {
  reply: string
  translation: string
  praise: string
  teach: boolean
  pedagogy: Pedagogy
  natural: string | null
  explainPt: string | null
  correct: boolean
  challenge: string | null
  corrections: Correction[]
  vocabulary: VocabEntry[]
  tip: string | null
  suggestions: string[]
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  viaVoice?: boolean
  tutor?: TutorTurn
}

export type Conversation = {
  id: string
  title: string
  scenarioId: string
  messages: ChatMessage[]
  updatedAt: string
}

export type SavedWord = VocabEntry & {
  addedAt: string
  known: boolean
}

export type ErrorPattern = {
  original: string
  corrected: string
  count: number
  lastSeen: string
  errorType: ErrorType
}

export type Progress = {
  streak: number
  lastPracticeDate: string
  messagesCount: number
  conversationsCount: number
  xp: number
  correctionsCount: number
  correctTurns: number
  englishTurns: number
  spokenTurns: number
  errors: ErrorPattern[]
  errorTypes: Partial<Record<ErrorType, number>>
  suggestedLevel: Level | null
  reviewTip: string | null
}

export type Scenario = {
  id: string
  title: string
  titlePt: string
  blurb: string
  icon: string
  prompt: string
  starters: string[]
}
