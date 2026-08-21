import type {
  ChatMessage,
  EngineResult,
  ErrorType,
  Level,
  LinguisticAnalysis,
  LinguisticError,
  Pedagogy,
  Profile,
  Progress,
  Provider,
  SavedWord,
  Scenario,
  Severity,
  VocabEntry,
} from '../types'
import { emptyAnalysis, parseLinguisticAnalysis } from './analysis'
import { analyzeUtterance } from './ai'
import { errorTypeLabel, toTutorTurn } from './pedagogy'
import { nextLevel, previousLevel } from './levels'
import { loadStore, percent, recordTurn } from './storage'

const gravityRank: Record<Severity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}

export type EngineContext = {
  profile: Profile
  progress: Progress
  knownWords: SavedWord[]
  userText: string | null
  viaVoice: boolean
}

function isWorthShowing(error: LinguisticError, level: Level, meaningClear: boolean): boolean {
  if (error.gravity === 'none') return false
  if (error.gravity === 'low' && meaningClear) return false
  if (
    (level === 'A1' || level === 'A2') &&
    (error.type === 'article' || error.type === 'spelling') &&
    error.gravity !== 'high'
  ) {
    return false
  }
  return error.gravity === 'medium' || error.gravity === 'high'
}

function pickError(
  analysis: LinguisticAnalysis,
  level: Level,
): LinguisticError | null {
  const ranked = analysis.errors
    .filter((item) => isWorthShowing(item, level, analysis.meaningClear))
    .sort((a, b) => gravityRank[b.gravity] - gravityRank[a.gravity])
  return ranked[0] ?? null
}

function pedagogyFrom(
  analysis: LinguisticAnalysis,
  chosen: LinguisticError | null,
  level: Level,
): Pedagogy {
  if (!chosen) {
    return {
      level: analysis.observedLevel,
      original: analysis.original,
      errorType: 'none',
      correction: null,
      explanation: null,
      severity: 'none',
      newVocabulary: analysis.vocabulary,
      nextQuestion: analysis.candidateReply,
    }
  }
  return {
    level: analysis.observedLevel || level,
    original: analysis.original,
    errorType: chosen.type,
    correction: chosen.naturalSentence,
    explanation: chosen.explanation,
    severity: chosen.gravity,
    newVocabulary: analysis.vocabulary,
    nextQuestion: analysis.candidateReply,
  }
}

function xpFor(taught: boolean, hasUserText: boolean): number {
  if (!hasUserText) return 4
  return taught ? 10 : 16
}

function reviewTipFor(progress: Progress, taughtType: ErrorType | null): string | null {
  if (!taughtType || taughtType === 'none') return null
  const count = progress.errorTypes[taughtType] ?? 0
  if (count + 1 < 3) return null
  return `Você erra ${errorTypeLabel[taughtType].toLowerCase()} com frequência. Vale revisar isso na próxima conversa.`
}

function levelSuggestions(profile: Profile, progress: Progress, taught: boolean): {
  up: Level | null
  down: Level | null
} {
  const total = progress.messagesCount + 1
  const correct = progress.correctTurns + (taught ? 0 : 1)
  const accuracy = percent(correct, total)
  const up = total >= 12 && accuracy >= 80 ? nextLevel(profile.level) : null
  const down = total >= 15 && accuracy <= 38 ? previousLevel(profile.level) : null
  return { up, down }
}

function vocabToAdd(analysis: LinguisticAnalysis, known: SavedWord[]): VocabEntry[] {
  return analysis.vocabulary.filter((item) => {
    const key = item.word.toLowerCase()
    return key.length > 1 && !known.some((word) => word.word.toLowerCase() === key)
  })
}

/** Pedagogical decisions. Groq does not decide these. */
export function decide(analysis: LinguisticAnalysis, ctx: EngineContext): EngineResult {
  const kickoff = !ctx.userText
  let chosen = kickoff ? null : pickError(analysis, ctx.profile.level)
  if (!kickoff && analysis.wrotePortuguese) {
    chosen =
      analysis.errors.find((item) => item.type === 'vocabulary') ??
      chosen ?? {
        type: 'vocabulary',
        span: analysis.original,
        naturalSentence: analysis.errors[0]?.naturalSentence || analysis.original,
        explanation: 'Tente dizer isso em inglês. Eu te ajudo com a frase.',
        gravity: 'medium',
      }
  }
  const taught = Boolean(chosen)
  const pedagogy = pedagogyFrom(analysis, chosen, ctx.profile.level)
  const praise =
    analysis.candidatePraise ||
    (taught ? 'Almost! ❤️' : kickoff ? 'Hi!' : 'Very good!')
  const reply = analysis.candidateReply || pedagogy.nextQuestion || 'Tell me more.'
  const { up, down } = kickoff
    ? { up: null, down: null }
    : levelSuggestions(ctx.profile, ctx.progress, taught)

  const tutor = toTutorTurn({
    pedagogy,
    praise,
    reply,
    translation: analysis.translation,
    suggestions: analysis.suggestions,
  })

  return {
    tutor,
    vocabToAdd: vocabToAdd(analysis, ctx.knownWords),
    speak: reply,
    xp: xpFor(taught, Boolean(ctx.userText)),
    registerError: taught,
    suggestLevelUp: up,
    suggestLevelDown: down,
    reviewTip: kickoff ? null : reviewTipFor(ctx.progress, chosen?.type ?? null),
  }
}

export function applyEngineResult(
  result: EngineResult,
  input: { userText: string | null; viaVoice: boolean },
): Progress {
  return recordTurn({
    userText: input.userText ?? undefined,
    viaVoice: input.viaVoice,
    pedagogy: input.userText ? result.tutor.pedagogy : null,
    xp: result.xp,
    suggestedLevel: result.suggestLevelUp,
    reviewTip: result.reviewTip,
  })
}

export function localGreeting(name: string, level: Level): EngineResult {
  const reply = `Hi ${name}! What did you do today?`
  const analysis = emptyAnalysis(level, reply)
  analysis.translation = `Oi, ${name}! O que você fez hoje?`
  analysis.suggestions = ['I went to work.', 'I stayed home.', 'I studied English.']
  analysis.candidatePraise = 'Hi!'
  const ctx: EngineContext = {
    profile: { name, level, goal: 'conversation', createdAt: '' },
    progress: loadStore().progress,
    knownWords: [],
    userText: null,
    viaVoice: false,
  }
  const result = decide(analysis, ctx)
  result.tutor.tip =
    'Cole uma chave grátis da Groq em Ajustes para a Maya analisar seu inglês de verdade.'
  return result
}

export async function completeTurn(input: {
  provider: Provider
  apiKey: string
  profile: Profile
  scenario: Scenario
  history: ChatMessage[]
  userText: string | null
  viaVoice: boolean
  knownWords: SavedWord[]
}): Promise<EngineResult> {
  const progress = loadStore().progress
  const raw = await analyzeUtterance({
    provider: input.provider,
    apiKey: input.apiKey,
    name: input.profile.name,
    level: input.profile.level,
    goal: input.profile.goal,
    scenario: input.scenario,
    history: input.history,
    userMessage: input.userText,
    frequentErrors: progress.errors,
  })
  const analysis = parseLinguisticAnalysis(raw, input.profile.level, input.userText)
  const result = decide(analysis, {
    profile: input.profile,
    progress,
    knownWords: input.knownWords,
    userText: input.userText,
    viaVoice: input.viaVoice,
  })
  applyEngineResult(result, { userText: input.userText, viaVoice: input.viaVoice })
  return result
}
