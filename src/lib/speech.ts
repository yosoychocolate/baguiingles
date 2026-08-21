function getRecognition(): SpeechRecognition | null {
  const Ctor =
    window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) return null
  return new Ctor()
}

export function canListen(): boolean {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function canSpeak(): boolean {
  return 'speechSynthesis' in window
}

export function startListening(
  onResult: (text: string, final: boolean) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): () => void {
  const rec = getRecognition()
  if (!rec) {
    onError('Seu navegador não suporta ditado. Use Chrome ou Edge.')
    onEnd()
    return () => {}
  }

  rec.lang = 'en-US'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let text = ''
    let final = false
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      text += event.results[i][0].transcript
      if (event.results[i].isFinal) final = true
    }
    onResult(text.trim(), final)
  }

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'not-allowed') {
      onError('Permita o microfone para falar com a Maya.')
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      onError('Não consegui ouvir. Tente de novo.')
    }
    onEnd()
  }

  rec.onend = () => onEnd()
  rec.start()

  return () => {
    try {
      rec.stop()
    } catch {
      /* already stopped */
    }
  }
}

export function speak(text: string, onEnd?: () => void): () => void {
  if (!canSpeak() || !text.trim()) {
    onEnd?.()
    return () => {}
  }

  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.92
  utter.pitch = 1

  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => v.lang.startsWith('en') && /natural|google|samantha|aria|jenny/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'))
    if (preferred) utter.voice = preferred
  }

  pickVoice()
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice, { once: true })
  }

  utter.onend = () => onEnd?.()
  utter.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utter)

  return () => window.speechSynthesis.cancel()
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}
