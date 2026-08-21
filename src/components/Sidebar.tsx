import type { Profile, View } from '../types'
import { levelLabel } from '../lib/levels'

type Props = {
  view: View
  profile: Profile
  streak: number
  onView: (view: View) => void
  onNewChat: () => void
}

const items: { id: View; label: string; icon: string }[] = [
  { id: 'chat', label: 'Conversa', icon: '💬' },
  { id: 'scenarios', label: 'Cenários', icon: '🎭' },
  { id: 'vocab', label: 'Vocabulário', icon: '📘' },
  { id: 'progress', label: 'Progresso', icon: '🔥' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
]

export function Sidebar({ view, profile, streak, onView, onNewChat }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">M</div>
        <div>
          <h1>Maya</h1>
          <p>Inglês com I.A.</p>
        </div>
      </div>
      <button className="new-chat" type="button" onClick={onNewChat}>
        + Nova conversa
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-btn ${view === item.id ? 'active' : ''}`}
          onClick={() => onView(item.id)}
        >
          <span className="ico">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <div className="sidebar-foot">
        <strong>{profile.name}</strong>
        <span>
          {levelLabel(profile.level)} · 🔥 {streak} dia{streak === 1 ? '' : 's'}
        </span>
      </div>
    </aside>
  )
}

export function MobileNav({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <nav className="mobile-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={view === item.id ? 'active' : ''}
          onClick={() => onView(item.id)}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
