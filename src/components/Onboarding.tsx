import { useState } from 'react'
import type { Level, Profile } from '../types'
import { cefrLevels } from '../lib/levels'

const goals = [
  { id: 'conversation', label: 'Conversar no dia a dia' },
  { id: 'work', label: 'Inglês para o trabalho' },
  { id: 'travel', label: 'Viajar com confiança' },
  { id: 'exams', label: 'Provas e estudos' },
]

type Props = {
  onDone: (profile: Profile) => void
}

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<Level>('A1')
  const [goal, setGoal] = useState('conversation')

  return (
    <div className="onboarding">
      <div className="ob-card">
        {step === 0 && (
          <>
            <div className="orb" />
            <p
              style={{
                textAlign: 'center',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Tutor de inglês com I.A.
            </p>
            <h2 style={{ textAlign: 'center' }}>Olá, eu sou a Maya.</h2>
            <p style={{ textAlign: 'center' }}>
              Vamos conversar em inglês. Eu entendo o que você escreve, corrijo, explico em
              português quando precisa e volto para o inglês.
            </p>
            <div className="row-actions">
              <button className="primary" type="button" onClick={() => setStep(1)}>
                Começar
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Como posso te chamar?</h2>
            <p>Uso seu nome nas conversas, como um par de verdade.</p>
            <div className="field">
              <label htmlFor="name">Seu nome</label>
              <input
                id="name"
                autoFocus
                placeholder="Ana, João, Mari..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) setStep(2)
                }}
              />
            </div>
            <div className="row-actions">
              <button className="ghost" type="button" onClick={() => setStep(0)}>
                Voltar
              </button>
              <button className="primary" type="button" disabled={!name.trim()} onClick={() => setStep(2)}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Qual é o seu nível?</h2>
            <p>A1 ao C1. Posso subir a dificuldade quando você melhorar.</p>
            <div className="levels">
              {cefrLevels.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`choice ${level === item.id ? 'on' : ''}`}
                  onClick={() => setLevel(item.id)}
                >
                  {item.title}
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
            <div className="row-actions">
              <button className="ghost" type="button" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button className="primary" type="button" onClick={() => setStep(3)}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>O que você mais quer?</h2>
            <p>Isso muda os assuntos e o jeito que eu te treino.</p>
            <div className="goals">
              {goals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`choice ${goal === item.id ? 'on' : ''}`}
                  onClick={() => setGoal(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="row-actions">
              <button className="ghost" type="button" onClick={() => setStep(2)}>
                Voltar
              </button>
              <button
                className="primary"
                type="button"
                onClick={() =>
                  onDone({
                    name: name.trim(),
                    level,
                    goal,
                    createdAt: new Date().toISOString(),
                  })
                }
              >
                Conversar com a Maya
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
