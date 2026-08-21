import type { Level } from '../types'

export const cefrLevels: { id: Level; title: string; detail: string }[] = [
  { id: 'A1', title: 'A1 — iniciante', detail: 'Frases curtas, presente e vocabulário do dia a dia.' },
  { id: 'A2', title: 'A2 — básico', detail: 'Rotina, passado simples e conversas curtas.' },
  { id: 'B1', title: 'B1 — intermediário', detail: 'Histórias, opiniões e tempos verbais mistos.' },
  { id: 'B2', title: 'B2 — intermediário avançado', detail: 'Conversas naturais, phrasal verbs e mais fluidez.' },
  { id: 'C1', title: 'C1 — avançado', detail: 'Nuance, humor e inglês perto de nativo.' },
]

const order: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export function isLevel(value: string): value is Level {
  return order.includes(value as Level)
}

export function migrateLevel(value: string | undefined): Level {
  if (value && isLevel(value)) return value
  if (value === 'beginner') return 'A1'
  if (value === 'intermediate') return 'B1'
  if (value === 'advanced') return 'C1'
  return 'A1'
}

export function levelLabel(level: Level): string {
  return cefrLevels.find((item) => item.id === level)?.title ?? level
}

export function previousLevel(level: Level): Level | null {
  const index = order.indexOf(level)
  return index > 0 ? order[index - 1] : null
}

export function nextLevel(level: Level): Level | null {
  const index = order.indexOf(level)
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null
}

export const levelGuide: Record<Level, string> = {
  A1: 'Use A1 English: very short sentences, present simple, high-frequency words. One idea at a time. Repeat useful chunks.',
  A2: 'Use A2 English: simple past, everyday routine, short connected sentences. Avoid idioms unless you explain them in Portuguese.',
  B1: 'Use B1 English: natural questions, mixed tenses, some connectors (because, so, then). Challenge a little.',
  B2: 'Use B2 English: fluent conversation, phrasal verbs, opinions and follow-up questions. Correct what a careful speaker would notice.',
  C1: 'Use C1 English: native-like rhythm, nuance, humor. Correct only unnatural phrasing.',
}
