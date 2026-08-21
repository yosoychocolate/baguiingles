import { useEffect, useMemo, useState } from 'react'
import { Onboarding } from './components/Onboarding'
import { ChatView } from './components/ChatView'
import { ScenariosView } from './components/ScenariosView'
import { VocabView } from './components/VocabView'
import { ProgressView } from './components/ProgressView'
import { SettingsView } from './components/SettingsView'
import { MobileNav, Sidebar } from './components/Sidebar'
import { scenarios } from './data/scenarios'
import {
  defaultProgress,
  loadStore,
  newConversation,
  recordNewConversation,
  resetAll,
  saveConversations,
  saveProfile,
  saveProgress,
  saveSettings,
  saveVocab,
} from './lib/storage'
import type { Conversation, Profile, Progress, SavedWord, Settings, View, VocabEntry } from './types'

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [profile, setProfile] = useState<Profile | null>(() => loadStore().profile)
  const [settings, setSettings] = useState<Settings>(() => loadStore().settings)
  const [conversations, setConversations] = useState<Conversation[]>(() => loadStore().conversations)
  const [activeId, setActiveId] = useState<string | null>(() => loadStore().activeId)
  const [vocab, setVocab] = useState<SavedWord[]>(() => loadStore().vocab)
  const [progress, setProgress] = useState<Progress>(() => loadStore().progress)
  useEffect(() => {
    try {
      if (profile) saveProfile(profile)
      saveSettings(settings)
      saveConversations(conversations, activeId)
      saveVocab(vocab)
      saveProgress(progress)
    } catch {
      /* persistência bloqueada */
    }
  }, [profile, settings, conversations, activeId, vocab, progress])

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0] ?? null,
    [conversations, activeId],
  )

  function startChat(scenarioId = 'free', title = 'Conversa cotidiana') {
    const conversation = newConversation(scenarioId, title)
    setConversations((prev) => [conversation, ...prev])
    setActiveId(conversation.id)
    setProgress(recordNewConversation())
    setView('chat')
  }

  function handleProfile(next: Profile) {
    setProfile(next)
    if (conversations.length === 0) {
      const conversation = newConversation('free', 'Conversa cotidiana')
      setConversations([conversation])
      setActiveId(conversation.id)
      setProgress(recordNewConversation())
    }
  }

  function saveWord(entry: VocabEntry) {
    if (!entry.word.trim()) return
    setVocab((prev) => {
      const key = entry.word.toLowerCase()
      const existing = prev.find((item) => item.word.toLowerCase() === key)
      if (existing) {
        if (entry.meaning && !existing.meaning) {
          return prev.map((item) => (item.word.toLowerCase() === key ? { ...item, ...entry } : item))
        }
        return prev
      }
      return [{ ...entry, addedAt: new Date().toISOString(), known: false }, ...prev]
    })
  }

  function refreshProgress() {
    setProgress(loadStore().progress)
  }

  if (!profile) return <Onboarding onDone={handleProfile} />

  return (
    <div className="app">
      <Sidebar
        view={view}
        profile={profile}
        streak={progress.streak}
        onView={setView}
        onNewChat={() => startChat()}
      />
      <main className="main">
        {view === 'chat' && active ? (
          <ChatView
            key={active.id}
            conversation={active}
            profile={profile}
            settings={settings}
            savedWords={vocab}
            onConversation={(next) => {
              setConversations((prev) => prev.map((item) => (item.id === next.id ? next : item)))
            }}
            onProgress={refreshProgress}
            onSaveWord={saveWord}
            onOpenSettings={() => setView('settings')}
          />
        ) : null}
        {view === 'chat' && !active ? (
          <div className="empty">
            <h3>Nenhuma conversa</h3>
            <button className="primary" type="button" onClick={() => startChat()}>
              Começar
            </button>
          </div>
        ) : null}
        {view === 'scenarios' ? (
          <ScenariosView
            scenarios={scenarios}
            onPick={(scenario) => startChat(scenario.id, scenario.titlePt)}
          />
        ) : null}
        {view === 'vocab' ? (
          <VocabView
            words={vocab}
            onToggleKnown={(word) =>
              setVocab((prev) =>
                prev.map((item) =>
                  item.word === word ? { ...item, known: !item.known } : item,
                ),
              )
            }
            onRemove={(word) => setVocab((prev) => prev.filter((item) => item.word !== word))}
          />
        ) : null}
        {view === 'progress' ? (
          <ProgressView
            profile={profile}
            progress={progress}
            words={vocab}
            onLevel={(level) => setProfile({ ...profile, level })}
          />
        ) : null}
        {view === 'settings' ? (
          <SettingsView
            profile={profile}
            settings={settings}
            onProfile={setProfile}
            onSettings={setSettings}
            onReset={() => {
              resetAll()
              setProfile(null)
              setConversations([])
              setActiveId(null)
              setVocab([])
              setProgress(defaultProgress)
            }}
          />
        ) : null}
      </main>
      <MobileNav view={view} onView={setView} />
    </div>
  )
}
