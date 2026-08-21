import { useEffect, useState } from 'react'
import type { Profile, Settings } from '../types'
import { getAiStatus } from '../lib/ai'

type Props = {
  profile: Profile
  settings: Settings
  onProfile: (profile: Profile) => void
  onSettings: (settings: Settings) => void
  onReset: () => void
}

export function SettingsView({ profile, settings, onProfile, onSettings, onReset }: Props) {
  const [server, setServer] = useState<{ ready: boolean; provider: string } | null>(null)

  useEffect(() => {
    void getAiStatus().then(setServer)
  }, [])

  return (
    <div className="page">
      <div className="page-head" style={{ padding: 0, border: 0, marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Ajustes</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            A Maya fala com a Groq pelo servidor. A chave não entra no navegador.
          </p>
        </div>
      </div>

      <div className="card help">
        <h3>{server?.ready ? 'I.A. ligada no servidor' : 'Servidor da I.A.'}</h3>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          {server?.ready ? (
            <>
              A Groq responde pelo backend ({server.provider}). A chave fica só no servidor — nunca no navegador.
            </>
          ) : (
            <>
              Local: coloque <code>GROQ_API_KEY</code> no arquivo <code>.env</code> e rode <code>npm run dev</code>.
              <br />
              Online: hospede o backend no Render e configure a chave como variável secreta lá.
            </>
          )}
        </p>
      </div>

      <div className="field">
        <label htmlFor="pname">Nome</label>
        <input
          id="pname"
          value={profile.name}
          onChange={(e) => onProfile({ ...profile, name: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="level">Nível</label>
        <select
          id="level"
          value={profile.level}
          onChange={(e) => onProfile({ ...profile, level: e.target.value as Profile['level'] })}
        >
          <option value="A1">A1 — iniciante</option>
          <option value="A2">A2 — básico</option>
          <option value="B1">B1 — intermediário</option>
          <option value="B2">B2 — intermediário avançado</option>
          <option value="C1">C1 — avançado</option>
        </select>
      </div>

      <label className="choice" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        Ouvir a Maya automaticamente
        <input
          type="checkbox"
          checked={settings.autoSpeak}
          onChange={(e) => onSettings({ ...settings, autoSpeak: e.target.checked })}
        />
      </label>
      <label className="choice" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        Mostrar tradução em português
        <input
          type="checkbox"
          checked={settings.showTranslation}
          onChange={(e) => onSettings({ ...settings, showTranslation: e.target.checked })}
        />
      </label>

      <div className="row-actions">
        <button
          className="ghost"
          type="button"
          onClick={() => {
            if (confirm('Apagar perfil, conversas e vocabulário deste aparelho?')) onReset()
          }}
        >
          Recomeçar do zero
        </button>
      </div>
    </div>
  )
}
