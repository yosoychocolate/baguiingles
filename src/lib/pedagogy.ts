import type { ErrorType, Level, Pedagogy, TutorTurn } from '../types'

export const errorTypeLabel: Record<ErrorType, string> = {
  none: 'Nenhum',
  tense: 'Tempo verbal',
  agreement: 'Concordância',
  article: 'Artigo',
  preposition: 'Preposição',
  word_order: 'Ordem das palavras',
  vocabulary: 'Vocabulário',
  spelling: 'Ortografia',
  other: 'Outro',
}

export function toTutorTurn(input: {
  pedagogy: Pedagogy
  praise: string
  reply: string
  translation: string
  suggestions: string[]
  challenge?: string | null
  tip?: string | null
}): TutorTurn {
  const teach = Boolean(
    (input.pedagogy.severity === 'medium' || input.pedagogy.severity === 'high') &&
      input.pedagogy.correction &&
      input.pedagogy.original,
  )
  return {
    reply: input.reply,
    translation: input.translation,
    praise: input.praise || (teach ? 'Almost! ❤️' : 'Very good!'),
    teach,
    pedagogy: input.pedagogy,
    natural: teach ? input.pedagogy.correction : null,
    explainPt: teach ? input.pedagogy.explanation : null,
    correct: !teach,
    challenge: teach ? null : input.challenge ?? null,
    corrections:
      teach && input.pedagogy.correction
        ? [
            {
              original: input.pedagogy.original,
              corrected: input.pedagogy.correction,
              explanation: input.pedagogy.explanation || '',
              errorType: input.pedagogy.errorType,
            },
          ]
        : [],
    vocabulary: input.pedagogy.newVocabulary,
    tip: input.tip ?? null,
    suggestions: input.suggestions,
  }
}

export function emptyPedagogy(level: Level, nextQuestion = ''): Pedagogy {
  return {
    level,
    original: '',
    errorType: 'none',
    correction: null,
    explanation: null,
    severity: 'none',
    newVocabulary: [],
    nextQuestion,
  }
}
