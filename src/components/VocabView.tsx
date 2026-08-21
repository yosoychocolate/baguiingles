import { useMemo, useState } from 'react'
import type { SavedWord } from '../types'

type Props = {
  words: SavedWord[]
  onToggleKnown: (word: string) => void
  onRemove: (word: string) => void
}

export function VocabView({ words, onToggleKnown, onRemove }: Props) {
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState(false)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return words
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q),
    )
  }, [words, query])

  const deck = words.filter((w) => !w.known)
  const card = deck[index % Math.max(deck.length, 1)]

  return (
    <div className="page">
      <div className="page-head" style={{ padding: 0, border: 0, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Vocabulário</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Toque numa palavra na conversa — a Maya explica e já guarda aqui.
          </p>
        </div>
        <button className="primary" type="button" onClick={() => setFlash((v) => !v)} disabled={words.length === 0}>
          {flash ? 'Lista' : 'Revisar'}
        </button>
      </div>

      {flash && deck.length > 0 && card ? (
        <div className="card">
          <button className="flash" type="button" onClick={() => setRevealed((v) => !v)}>
            <h3>{card.word}</h3>
            {card.ipa ? <p style={{ color: 'var(--faint)' }}>{card.ipa}</p> : null}
            {revealed ? (
              <>
                <p>{card.meaning}</p>
                <p style={{ color: 'var(--muted)' }}>{card.example}</p>
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Toque para ver o significado</p>
            )}
          </button>
          <div className="row-actions">
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setRevealed(false)
                setIndex((i) => i + 1)
              }}
            >
              Ainda não
            </button>
            <button
              className="primary"
              type="button"
              onClick={() => {
                onToggleKnown(card.word)
                setRevealed(false)
                setIndex((i) => i + 1)
              }}
            >
              Já sei
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              placeholder="word ou significado"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <h3>Caderno vazio</h3>
              <p>Quando a Maya ensinar uma palavra, toque nela para salvar aqui.</p>
            </div>
          ) : (
            <div className="grid">
              {filtered.map((item) => (
                <div key={item.word} className={`card ${item.known ? 'known' : ''}`}>
                  <h3 style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text)', fontSize: '1.1rem' }}>
                    {item.word}
                  </h3>
                  <p style={{ margin: '4px 0', color: 'var(--muted)' }}>{item.meaning}</p>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{item.example}</p>
                  <div className="row-actions">
                    <button className="ghost" type="button" onClick={() => onToggleKnown(item.word)}>
                      {item.known ? 'Revisar de novo' : 'Marcar como sei'}
                    </button>
                    <button className="ghost" type="button" onClick={() => onRemove(item.word)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
