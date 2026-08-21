import type { ErrorType, Level, LinguisticAnalysis, LinguisticError, Severity, VocabEntry } from '../types'
import { isLevel } from './levels'

const errorTypes: ErrorType[] = [
  'none',
  'tense',
  'agreement',
  'article',
  'preposition',
  'word_order',
  'vocabulary',
  'spelling',
  'other',
]

const severities: Severity[] = ['none', 'low', 'medium', 'high']

function asErrorType(value: unknown): ErrorType {
  return errorTypes.includes(value as ErrorType) ? (value as ErrorType) : 'other'
}

function asSeverity(value: unknown): Severity {
  return severities.includes(value as Severity) ? (value as Severity) : 'low'
}

function asVocab(raw: unknown): VocabEntry[] {
  if (typeof raw === 'string' && raw.trim()) {
    return [{ word: raw.trim(), meaning: '', example: '' }]
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) {
      return [{ word: item.trim(), meaning: '', example: '' }]
    }
    const row = item as Record<string, unknown>
    const word = String(row.word ?? '').trim()
    if (!word) return []
    return [
      {
        word,
        ipa: row.ipa ? String(row.ipa) : '',
        meaning: String(row.meaning ?? ''),
        example: String(row.example ?? ''),
      },
    ]
  })
}

function asError(item: unknown, original: string): LinguisticError | null {
  if (typeof item !== 'object' || !item) return null
  const row = item as Record<string, unknown>
  const type = asErrorType(row.type ?? row.errorType)
  if (type === 'none') return null
  const naturalSentence = String(row.naturalSentence ?? row.correction ?? '').trim()
  if (!naturalSentence) return null
  return {
    type,
    span: String(row.span ?? original),
    naturalSentence,
    explanation: String(row.explanation ?? ''),
    gravity: asSeverity(row.gravity ?? row.severity),
  }
}

export function emptyAnalysis(level: Level, reply = ''): LinguisticAnalysis {
  return {
    original: '',
    observedLevel: level,
    meaningClear: true,
    wrotePortuguese: false,
    errors: [],
    vocabulary: [],
    candidateReply: reply,
    candidatePraise: '',
    translation: '',
    suggestions: [],
  }
}

/** Groq (or any model) → structured linguistic analysis. No teaching decisions here. */
export function parseLinguisticAnalysis(
  text: string,
  fallbackLevel: Level,
  originalFallback: string | null,
): LinguisticAnalysis {
  const cleaned = text.replace(/```json\s*|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < 0) {
    return {
      ...emptyAnalysis(fallbackLevel, cleaned || 'Tell me more.'),
      original: originalFallback ?? '',
    }
  }

  try {
    const data = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
    const analysis = (
      data.analysis && typeof data.analysis === 'object' ? data.analysis : data
    ) as Record<string, unknown>
    const original = String(analysis.original ?? data.original ?? originalFallback ?? '')
    const nestedErrors = Array.isArray(analysis.errors) ? analysis.errors : null
    const single = asError(
      {
        type: analysis.errorType ?? data.errorType,
        span: original,
        naturalSentence: analysis.correction ?? data.natural ?? data.correction,
        explanation: analysis.explanation ?? data.explainPt,
        gravity: analysis.severity ?? data.severity,
      },
      original,
    )
    const errors = (nestedErrors ?? (single ? [single] : []))
      .map((item) => asError(item, original))
      .filter((item): item is LinguisticError => Boolean(item))

    const vocab = asVocab(analysis.newVocabulary ?? analysis.vocabulary ?? data.vocabulary)
    const reply = String(
      data.candidateReply ?? data.reply ?? analysis.nextQuestion ?? cleaned,
    )

    return {
      original,
      observedLevel: isLevel(String(analysis.observedLevel ?? analysis.level ?? ''))
        ? ((analysis.observedLevel ?? analysis.level) as Level)
        : fallbackLevel,
      meaningClear: analysis.meaningClear !== false && data.meaningClear !== false,
      wrotePortuguese: Boolean(analysis.wrotePortuguese ?? data.wrotePortuguese),
      errors,
      vocabulary: vocab,
      candidateReply: reply,
      candidatePraise: String(data.candidatePraise ?? data.praise ?? ''),
      translation: String(data.translation ?? ''),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).slice(0, 3) : [],
    }
  } catch {
    return {
      ...emptyAnalysis(fallbackLevel, text.trim() || 'Let’s keep going.'),
      original: originalFallback ?? '',
    }
  }
}
