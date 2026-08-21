import type { Scenario } from '../types'

type Props = {
  scenarios: Scenario[]
  onPick: (scenario: Scenario) => void
}

export function ScenariosView({ scenarios, onPick }: Props) {
  return (
    <div className="page">
      <div className="page-head" style={{ padding: 0, border: 0, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Cenários</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Ensaie inglês de situações reais. A Maya entra no papel e te conduz.
          </p>
        </div>
      </div>
      <div className="grid">
        {scenarios.map((item) => (
          <button key={item.id} className="scenario" type="button" onClick={() => onPick(item)}>
            <span className="icon">{item.icon}</span>
            <h3>{item.titlePt}</h3>
            <p>{item.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
