import type { Profile, Provider, Settings } from '../types'

type Props = {
  profile: Profile
  settings: Settings
  onProfile: (profile: Profile) => void
  onSettings: (settings: Settings) => void
  onReset: () => void
}

export function SettingsView({ profile, settings, onProfile, onSettings, onReset }: Props) {
  return (
    <div className="page">
      <div className="page-head" style={{ padding: 0, border: 0, marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Ajustes</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Conecte uma I.A. grátis para conversas reais com a Maya.
          </p>
        </div>
      </div>

      <div className="card help">
        <h3>Chave de I.A. (Groq, recomendado)</h3>
        <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>
          1. Abra{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          <br />
          2. Crie uma conta e clique em Create API Key
          <br />
          3. Cole a chave abaixo. Ela fica só neste computador.
        </p>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Alternativa grátis:{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Google Gemini
          </a>
          . OpenAI também funciona.
        </p>
      </div>

      <div className="field">
        <label htmlFor="provider">Provedor</label>
        <select
          id="provider"
          value={settings.provider}
          onChange={(e) => onSettings({ ...settings, provider: e.target.value as Provider })}
        >
          <option value="groq">Groq (Llama, grátis e rápido)</option>
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="key">Chave de API</label>
        <input
          id="key"
          type="password"
          autoComplete="off"
          placeholder="gsk_... ou AIza... ou sk-..."
          value={settings.apiKey}
          onChange={(e) => onSettings({ ...settings, apiKey: e.target.value.trim() })}
        />
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
