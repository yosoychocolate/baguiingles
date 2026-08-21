import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Conversation, Profile, SavedWord, Settings, VocabEntry } from '../types'
import { getScenario } from '../data/scenarios'
import { completeTurn, localGreeting } from '../lib/learningEngine'
import { getAiStatus } from '../lib/ai'
import { errorTypeLabel } from '../lib/pedagogy'
import { levelLabel } from '../lib/levels'
import { appendMessage, uid } from '../lib/storage'
import { canListen, speak, startListening, stopSpeaking } from '../lib/speech'

const kickedOff = new Set<string>()

type Props = {
  conversation: Conversation
  profile: Profile
  settings: Settings
  onConversation: (conversation: Conversation) => void
  onProgress: () => void
  onSaveWord: (word: VocabEntry) => void
  savedWords: SavedWord[]
  onOpenSettings: () => void
}

export function ChatView({
  conversation,
  profile,
  settings,
  onConversation,
  onProgress,
  onSaveWord,
  savedWords,
  onOpenSettings,
}: Props) {
  const [draft, setDraft] = useState('')
  const [aiReady, setAiReady] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(conversation.messages.length === 0)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [viaVoice, setViaVoice] = useState(false)
  const [coach, setCoach] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const convRef = useRef(conversation)
  const stopListen = useRef<(() => void) | null>(null)
  const scenario = getScenario(conversation.scenarioId)
  const lastMaya = [...conversation.messages].reverse().find((m) => m.role === 'assistant')
  convRef.current = conversation

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversation.messages.length, busy])

  useEffect(() => {
    void getAiStatus().then((status) => setAiReady(status.ready))
  }, [])

  useEffect(() => {
    if (conversation.messages.length > 0 || aiReady === null) return
    if (!aiReady) {
      if (kickedOff.has(`${conversation.id}:hello`)) return
      kickedOff.add(`${conversation.id}:hello`)
      const tutor = localGreeting(profile.name, profile.level).tutor
      const welcome: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: tutor.reply,
        createdAt: new Date().toISOString(),
        tutor,
      }
      onConversation(appendMessage(convRef.current, welcome))
      setBusy(false)
      return
    }
    if (kickedOff.has(conversation.id)) return
    kickedOff.add(conversation.id)
    void runTurn(null, false)
  }, [conversation.id, aiReady])

  async function runTurn(userText: string | null, voice: boolean) {
    setBusy(true)
    setError('')
    let current = convRef.current
    if (userText) {
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: userText,
        createdAt: new Date().toISOString(),
        viaVoice: voice,
      }
      current = appendMessage(current, userMsg)
      onConversation(current)
    }
    try {
      const result = await completeTurn({
        provider: settings.provider,
        profile,
        scenario,
        history: current.messages,
        userText,
        viaVoice: voice,
        knownWords: savedWords,
      })
      const tutor = result.tutor
      const assistant: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: tutor.reply,
        createdAt: new Date().toISOString(),
        tutor,
      }
      const next = appendMessage(current, assistant)
      onConversation(
        next.title === scenario.titlePt && userText
          ? { ...next, title: userText.slice(0, 42) }
          : next,
      )
      for (const item of result.vocabToAdd) onSaveWord(item)
      onProgress()
      setCoach(result.reviewTip || result.suggestLevelUp ? [result.reviewTip, result.suggestLevelUp ? `Quando quiser, suba para ${result.suggestLevelUp} em Progresso.` : ''].filter(Boolean).join(' ') : null)
      if (settings.autoSpeak) speak(result.speak)
    } catch (err) {
      kickedOff.delete(conversation.id)
      setError(err instanceof Error ? err.message : 'Não consegui responder agora.')
    } finally {
      setBusy(false)
      setViaVoice(false)
    }
  }

  function send(text: string, voice = viaVoice) {
    const clean = text.trim()
    if (!clean || busy) return
    setDraft('')
    stopSpeaking()
    void runTurn(clean, voice)
  }

  function toggleMic() {
    if (listening) {
      stopListen.current?.()
      setListening(false)
      return
    }
    if (!canListen()) {
      setError('Ditado disponível no Chrome ou Edge, em localhost ou HTTPS.')
      return
    }
    setListening(true)
    setViaVoice(true)
    setError('')
    stopListen.current = startListening(
      (text, final) => {
        setDraft(text)
        if (final && text) {
          setListening(false)
          send(text, true)
        }
      },
      () => setListening(false),
      (message) => {
        setError(message)
        setListening(false)
        setViaVoice(false)
      },
    )
  }

  return (
    <>
      <header className="chat-head">
        <div>
          <strong>
            {scenario.icon} {scenario.titlePt}
          </strong>
          <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
            Maya · {levelLabel(profile.level)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" type="button" title="Parar áudio" onClick={stopSpeaking}>
            🔇
          </button>
          <button className="icon-btn" type="button" title="Ajustes" onClick={onOpenSettings}>
            ⚙️
          </button>
        </div>
      </header>

      {aiReady === false ? (
        <div className="banner">
          A Maya de verdade roda com <code>npm run dev</code>. A chave Groq fica no arquivo .env, no servidor — não no GitHub e não no navegador.
        </div>
      ) : null}
      {coach ? <div className="banner">{coach}</div> : null}

      <div className="chat" ref={listRef}>
        {conversation.messages.length === 0 ? (
          <div className="empty">
            <div className="orb" />
            <h3>{busy ? 'Maya está entrando...' : 'Escreva em inglês'}</h3>
            <p>
              {busy
                ? 'Ela vai entender, corrigir e continuar o papo.'
                : 'Você escreve. A Maya corrige, explica em português e volta para o inglês.'}
            </p>
          </div>
        ) : null}

        {conversation.messages.map((message) => (
          <MessageBlock
            key={message.id}
            message={message}
            showTranslation={settings.showTranslation}
            savedWords={savedWords}
            onSaveWord={onSaveWord}
          />
        ))}

        {busy && conversation.messages.length > 0 ? (
          <div className="bubble-row">
            <div className="avatar">M</div>
            <div className="bubble maya">
              <div className="typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {lastMaya?.tutor?.suggestions?.length && !busy ? (
        <div className="suggestions">
          {lastMaya.tutor.suggestions.map((item) => (
            <button key={item} className="chip" type="button" onClick={() => send(item, false)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="error">
          {error}{' '}
          {conversation.messages.filter((m) => m.role === 'user').length === 0 ? (
            <button
              className="ghost"
              type="button"
              onClick={() => {
                kickedOff.delete(conversation.id)
                void runTurn(null, false)
              }}
            >
              Tentar de novo
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft, false)
        }}
      >
        <div className="composer-box">
          <button
            className={`icon-btn ${listening ? 'live' : ''}`}
            type="button"
            onClick={toggleMic}
            title="Falar em inglês"
          >
            {listening ? '●' : '🎙'}
          </button>
          <textarea
            rows={1}
            placeholder={listening ? 'Estou ouvindo...' : 'Write in English...'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(draft, false)
              }
            }}
          />
          <button className="send" type="submit" disabled={busy || !draft.trim()}>
            ↑
          </button>
        </div>
      </form>
    </>
  )
}

function MessageBlock({
  message,
  showTranslation,
  savedWords,
  onSaveWord,
}: {
  message: ChatMessage
  showTranslation: boolean
  savedWords: SavedWord[]
  onSaveWord: (word: VocabEntry) => void
}) {
  const [picked, setPicked] = useState<VocabEntry | null>(null)
  const tutor = message.tutor

  if (message.role === 'user') {
    return (
      <div className="bubble-row user">
        <div className="bubble user">
          {message.viaVoice ? <span className="meta">falado</span> : null}
          {message.content}
        </div>
      </div>
    )
  }

  const vocab = tutor?.vocabulary ?? []

  return (
    <>
      {tutor?.teach ? (
        <div className="extras">
          <div className="card lesson">
            <h3>{tutor.praise || 'Almost! ❤️'}</h3>
            {tutor.pedagogy.errorType !== 'none' ? (
              <p className="lesson-tag">{errorTypeLabel[tutor.pedagogy.errorType]}</p>
            ) : null}
            {tutor.natural ? (
              <p style={{ margin: '0 0 8px' }}>
                A more natural sentence is:
                <br />
                <ins>“{tutor.natural}”</ins>
              </p>
            ) : null}
            {tutor.explainPt ? (
              <p className="explain-pt">
                <strong>🇧🇷 Por quê?</strong>
                <br />
                {tutor.explainPt}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="bubble-row">
        <div className="avatar">M</div>
        <div className="bubble maya">
          <div className="meta">
            Maya
            <button className="speak-mini" type="button" onClick={() => speak(message.content)} title="Ouvir">
              ▶
            </button>
          </div>
          <TappableEnglish
            text={message.content}
            vocab={vocab}
            onPick={(entry) => {
              setPicked(entry)
              if (entry.meaning) onSaveWord(entry)
            }}
          />
          {showTranslation && tutor?.translation ? (
            <div className="translation">{tutor.translation}</div>
          ) : null}
        </div>
      </div>
      {tutor ? (
        <div className="extras">
          {tutor.correct && tutor.challenge ? (
            <div className="card lesson ok">
              <h3>{tutor.praise || 'Very good!'}</h3>
              <p style={{ margin: 0 }}>{tutor.challenge}</p>
            </div>
          ) : null}
          {picked ? (
            <div className="card">
              <h3>{picked.word}</h3>
              <p style={{ margin: 0 }}>
                {picked.meaning || 'Salvo no seu vocabulário.'}
                {picked.example ? ` · ${picked.example}` : ''}
              </p>
            </div>
          ) : null}
          {vocab.length > 0 ? (
            <div className="vocab-row">
              {vocab.map((item) => {
                const saved = savedWords.some((w) => w.word.toLowerCase() === item.word.toLowerCase())
                return (
                  <button
                    key={item.word}
                    className="vocab-chip"
                    type="button"
                    onClick={() => {
                      setPicked(item)
                      onSaveWord(item)
                    }}
                    title="Já vai para o seu vocabulário"
                  >
                    <b>
                      {item.word} {saved ? '✓' : '+'}
                    </b>
                    <span>{item.meaning}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
          {tutor.tip ? (
            <div className="card">
              <h3>Dica</h3>
              <p style={{ margin: 0 }}>{tutor.tip}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function TappableEnglish({
  text,
  vocab,
  onPick,
}: {
  text: string
  vocab: VocabEntry[]
  onPick: (entry: VocabEntry) => void
}) {
  const phrases = [...vocab].sort((a, b) => b.word.length - a.word.length)
  const chunks: { text: string; entry?: VocabEntry }[] = []
  let rest = text

  while (rest.length) {
    let at = -1
    let hit: VocabEntry | undefined
    for (const entry of phrases) {
      const needle = entry.word.toLowerCase()
      const idx = rest.toLowerCase().indexOf(needle)
      if (idx < 0) continue
      const before = idx === 0 || /\W/.test(rest[idx - 1] ?? '')
      const after = idx + entry.word.length >= rest.length || /\W/.test(rest[idx + entry.word.length] ?? '')
      if (before && after && (at < 0 || idx < at)) {
        at = idx
        hit = entry
      }
    }
    if (!hit || at < 0) {
      chunks.push({ text: rest })
      break
    }
    if (at > 0) chunks.push({ text: rest.slice(0, at) })
    chunks.push({ text: rest.slice(at, at + hit.word.length), entry: hit })
    rest = rest.slice(at + hit.word.length)
  }

  return (
    <span>
      {chunks.map((chunk, index) =>
        chunk.entry ? (
          <button
            key={`${chunk.text}-${index}`}
            className="word-link"
            type="button"
            onClick={() => onPick(chunk.entry!)}
            title={chunk.entry.meaning}
          >
            {chunk.text}
          </button>
        ) : (
          <PlainWords
            key={`plain-${index}`}
            text={chunk.text}
            onPick={(word) =>
              onPick({
                word,
                meaning: 'Palavra destacada em verde já vai para o seu vocabulário, com a explicação da Maya.',
                example: '',
              })
            }
          />
        ),
      )}
    </span>
  )
}

function PlainWords({ text, onPick }: { text: string; onPick: (word: string) => void }) {
  return (
    <>
      {text.split(/(\b[A-Za-z']{3,}\b)/).map((bit, index) =>
        /^[A-Za-z']{3,}$/.test(bit) ? (
          <button key={`${bit}-${index}`} className="word-link subtle" type="button" onClick={() => onPick(bit)}>
            {bit}
          </button>
        ) : (
          <span key={`${bit}-${index}`}>{bit}</span>
        ),
      )}
    </>
  )
}
