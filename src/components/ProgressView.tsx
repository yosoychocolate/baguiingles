import type { Level, Profile, Progress, SavedWord } from '../types'
import { errorTypeLabel } from '../lib/pedagogy'
import { cefrLevels, levelLabel, nextLevel } from '../lib/levels'
import { percent } from '../lib/storage'

type Props = {
  profile: Profile
  progress: Progress
  words: SavedWord[]
  onLevel: (level: Level) => void
}

export function ProgressView({ profile, progress, words, onLevel }: Props) {
  const grammar = percent(progress.correctTurns, progress.messagesCount)
  const vocab = percent(words.filter((item) => item.known).length, words.length)
  const comprehension = percent(progress.englishTurns, progress.messagesCount)
  const ready = progress.messagesCount >= 10 && grammar >= 78
  const upcoming = progress.suggestedLevel ?? (ready ? nextLevel(profile.level) : null)
  const topTypes = Object.entries(progress.errorTypes || {})
    .filter(([type, count]) => type !== 'none' && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [keyof typeof errorTypeLabel, number][]

  return (
    <div className="page">
      <div className="page-head" style={{ padding: 0, border: 0, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Seu inglês, {profile.name}</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Nível atual: {levelLabel(profile.level)}. A Maya sobe a dificuldade quando você acerta mais.
          </p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{profile.level}</b>
          <span>seu nível</span>
        </div>
        <div className="stat">
          <b>{words.length}</b>
          <span>palavras aprendidas</span>
        </div>
        <div className="stat">
          <b>{progress.conversationsCount}</b>
          <span>conversas</span>
        </div>
        <div className="stat">
          <b>🔥 {progress.streak}</b>
          <span>dias seguidos</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Precisão gramatical {grammar}%</h3>
        <div className="xp">
          <i style={{ width: `${grammar}%` }} />
        </div>
        <h3 style={{ marginTop: 14 }}>Vocabulário {vocab}%</h3>
        <div className="xp">
          <i style={{ width: `${vocab}%` }} />
        </div>
        <h3 style={{ marginTop: 14 }}>Compreensão {comprehension}%</h3>
        <div className="xp">
          <i style={{ width: `${comprehension}%` }} />
        </div>
        <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
          {progress.messagesCount} falas · {progress.spokenTurns} por voz · {progress.xp} XP
        </p>
      </div>

      {progress.reviewTip ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Revisão sugerida</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{progress.reviewTip}</p>
        </div>
      ) : null}

      {upcoming && (ready || progress.suggestedLevel) ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Você está pronto para {upcoming}</h3>
          <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>
            Sua precisão está alta. A Maya pode falar um pouco mais difícil.
          </p>
          <button className="primary" type="button" onClick={() => onLevel(upcoming)}>
            Subir para {upcoming}
          </button>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Onde a Maya está focando</h3>
        {topTypes.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Ainda sem padrão. Cada erro médio ou alto da conversa aparece aqui.
          </p>
        ) : (
          <div className="vocab-row">
            {topTypes.map(([type, count]) => (
              <span key={type} className="vocab-chip">
                <b>{errorTypeLabel[type]}</b>
                <span>×{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Seus erros frequentes</h3>
        {progress.errors.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Ainda não há padrão. Converse um pouco — a Maya guarda o que se repete.
          </p>
        ) : (
          progress.errors.slice(0, 8).map((item) => (
            <div className="fix" key={`${item.original}-${item.corrected}`}>
              <div>
                <del>{item.original}</del>
                {' → '}
                <ins>{item.corrected}</ins>
                <span style={{ color: 'var(--faint)', marginLeft: 8 }}>
                  {errorTypeLabel[item.errorType] || ''} ×{item.count}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Trocar de nível</h3>
        <div className="goals" style={{ marginTop: 8 }}>
          {cefrLevels.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`choice ${profile.level === item.id ? 'on' : ''}`}
              onClick={() => onLevel(item.id)}
            >
              {item.title}
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
