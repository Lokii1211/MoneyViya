import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Send, Mic, Paperclip, X, ChevronDown, Zap, CheckCircle, AlertTriangle, TrendingUp, Target, BarChart3, Bell, Plus, Trash2, Clock, ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { timeAgo } from '../lib/utils'

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { text: 'How to save ₹1 lakh this year?', emoji: '💰' },
  { text: 'Spent 500 on lunch', emoji: '🍔' },
  { text: 'Done with morning workout', emoji: '🏋️' },
  { text: 'Best SIP for beginners?', emoji: '📈' },
  { text: 'Remind me at 9pm to journal', emoji: '🔔' },
  { text: 'Give me my daily brief', emoji: '📊' },
]

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: '💸', label: 'Expense', prompt: 'Spent ₹' },
  { emoji: '🎯', label: 'Goal', prompt: 'Create goal: ' },
  { emoji: '✅', label: 'Check-in', prompt: 'Done with ' },
  { emoji: '🔔', label: 'Reminder', prompt: 'Remind me at ' },
  { emoji: '📊', label: 'Brief', prompt: 'Give me my morning briefing' },
  { emoji: '🧠', label: 'Remember', prompt: 'Remember that ' },
  { emoji: '💊', label: 'Medicine', prompt: 'Took my medicine' },
  { emoji: '🚶', label: 'Health', prompt: 'Walked 8000 steps today' },
]

// ── Markdown formatter ────────────────────────────────────────────────────────
function fmt(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br/>')
}

// ── Action badge component ────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const map = {
    expense:    { icon: '💸', label: `₹${action.amount} logged`, color: '#00E5B0', bg: 'rgba(0,229,176,0.12)' },
    income:     { icon: '💰', label: `₹${action.amount} income`, color: '#00E5B0', bg: 'rgba(0,229,176,0.1)' },
    reminder:   { icon: '🔔', label: `Reminder: ${action.title || action.text} at ${action.time}`, color: '#7C6AF9', bg: 'rgba(124,106,249,0.12)' },
    habit:      { icon: '🔥', label: `${action.name} — ${action.streak}d streak!`, color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
    habit_already: { icon: '✅', label: `${action.name} already done`, color: '#888', bg: 'rgba(136,136,136,0.1)' },
    goal:       { icon: '🎯', label: `Goal: ${action.name} (₹${action.target?.toLocaleString('en-IN')})`, color: '#7C6AF9', bg: 'rgba(124,106,249,0.12)' },
    new_habit:  { icon: '✨', label: `New habit: ${action.name}`, color: '#00E5B0', bg: 'rgba(0,229,176,0.1)' },
    health:     { icon: '❤️', label: `Health logged${action.steps ? ` · ${action.steps.toLocaleString()} steps` : ''}${action.water ? ` · ${action.water}L` : ''}`, color: '#FF7062', bg: 'rgba(255,112,98,0.12)' },
    memory:     { icon: '🧠', label: `Remembered: ${action.key}`, color: '#7C6AF9', bg: 'rgba(124,106,249,0.1)' },
    habit_not_found: { icon: '⚠️', label: `Habit not found — add it first!`, color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  }
  const cfg = map[action.type] || { icon: '✅', label: action.type, color: '#00E5B0', bg: 'rgba(0,229,176,0.1)' }
  return (
    <div className="action-badge" style={{ background: cfg.bg, borderColor: cfg.color + '40' }}>
      <span className="action-badge-icon">{cfg.icon}</span>
      <span className="action-badge-label" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}

// ── Smart card type detector ──────────────────────────────────────────────────
function detectCard(content) {
  if (!content) return null
  const l = content.toLowerCase()
  if (l.includes('overdue') || l.includes('⚠️') || l.includes('warning') || l.includes('alert')) return 'warning'
  if (l.includes('✅') && (l.includes('logged') || l.includes('created') || l.includes('set') || l.includes('done'))) return 'success'
  if (l.includes('💡') || l.includes('tip:') || l.includes('noticed') || l.includes('insight')) return 'insight'
  if ((l.includes('this week') || l.includes('this month')) && l.includes('₹')) return 'report'
  if (l.includes('goal') && l.includes('%')) return 'goal'
  return null
}

const CARD_CFG = {
  success: { border: '#00E5B0', icon: <CheckCircle size={13} color="#00E5B0"/>, label: 'Done' },
  insight: { border: '#7C6AF9', icon: <TrendingUp size={13} color="#7C6AF9"/>, label: 'Insight' },
  warning: { border: '#FF7062', icon: <AlertTriangle size={13} color="#FF7062"/>, label: 'Alert' },
  report:  { border: '#5514FF', icon: <BarChart3 size={13} color="#5514FF"/>, label: 'Report' },
  goal:    { border: '#FFB800', icon: <Target size={13} color="#FFB800"/>, label: 'Goal' },
}

// ── Contextual quick replies ──────────────────────────────────────────────────
function getQuickReplies(last) {
  if (!last) return []
  const l = last.toLowerCase()
  if (l.includes('expense') || l.includes('₹') || l.includes('spent'))
    return ['Add another', 'Monthly summary', 'Set budget alert']
  if (l.includes('habit') || l.includes('streak') || l.includes('workout'))
    return ['Check all habits', 'Check-in another', 'View streak']
  if (l.includes('remind') || l.includes('reminder'))
    return ['Add another reminder', 'View all reminders']
  if (l.includes('goal'))
    return ['Add money to goal', 'Create new goal', 'View all goals']
  if (l.includes('brief') || l.includes('summary'))
    return ['Handle bills', 'Check goals', 'Log expense']
  if (l.includes('invest') || l.includes('sip') || l.includes('mutual fund'))
    return ['Best SIPs for me', 'How to start SIP?', 'Compare funds']
  return ['Tell me more', 'What else can I do?']
}

// ── Main Chat component ───────────────────────────────────────────────────────
export default function Chat() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const recTimerRef = useRef(null)
  const recognitionRef = useRef(null)

  const speakText = (text, idx) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
      return
    }
    window.speechSynthesis.cancel()
    const cleanText = (text || '')
      .replace(/[*_`#]/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim()
    if (!cleanText) return

    const utter = new SpeechSynthesisUtterance(cleanText)
    utter.rate = 1.0
    utter.pitch = 1.0

    try {
      const voices = window.speechSynthesis.getVoices()
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.lang.startsWith('en'))
      if (inVoice) utter.voice = inVoice
    } catch { /* use default voice */ }

    utter.onend = () => setSpeakingIndex(null)
    utter.onerror = () => setSpeakingIndex(null)
    setSpeakingIndex(idx)
    window.speechSynthesis.speak(utter)
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const name = user?.name || 'there'
  const hour = new Date().getHours()
  const greet = hour < 12 ? '☀️ Good morning' : hour < 18 ? '🌤️ Good afternoon' : '🌙 Good evening'

  const welcomeMsg = {
    role: 'assistant',
    content: `${greet}, ${name.split(' ')[0]}! 👋\n\nI'm **Viya** — your AI second brain. I don't just chat, I **take real actions**:\n\n💸 _"spent 500 on food"_ → logs it\n✅ _"done with workout"_ → marks habit\n🔔 _"remind me at 9pm to study"_ → sets reminder\n🎯 _"create goal Goa trip 50k"_ → creates goal\n🧠 _"remember mom's birthday is Dec 5"_ → saved\n\nEverything syncs with your app instantly. What's on your mind?`,
    time: new Date().toISOString(),
  }

  useEffect(() => {
    setMessages([welcomeMsg])
    if (!phone) return
    api.getChatHistory(phone, 20).then(history => {
      if (history?.length > 0) {
        const msgs = history.reverse().map(h => ({ role: h.role, content: h.content, time: h.created_at }))
        setMessages(prev => [prev[0], ...msgs])
      }
    })
  }, [phone])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const onScroll = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }, [])

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })

  const startRecording = () => {
    setRecording(true); setRecTime(0); setVoiceTranscript('')
    recTimerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
    if (!voiceSupported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setVoiceTranscript(text)
    }
    rec.onerror = () => {}
    rec.start()
    recognitionRef.current = rec
  }

  const stopRecording = () => {
    setRecording(false)
    clearInterval(recTimerRef.current)
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }

  const sendMsg = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowActions(false)
    setShowAttach(false)

    const userMsg = { role: 'user', content: msg, time: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Pass last 10 messages as history for context
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const { reply, actions_executed } = await api.chat(phone, msg, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        time: new Date().toISOString(),
        actions: actions_executed || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🤖 Connection issue. Check your internet and try again!',
        time: new Date().toISOString(),
        actions: [],
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
  }

  const TEXT_FILE_TYPES = ['text/plain', 'text/csv', 'application/json']
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const isTextFile = TEXT_FILE_TYPES.includes(file.type) || /\.(txt|csv|json)$/i.test(file.name)
    if (isTextFile && file.size < 200_000) {
      const content = await file.text()
      sendMsg(`I'm sharing a file called "${file.name}". Here's its content:\n\n${content.slice(0, 4000)}`)
      return
    }

    if (file.type.startsWith('image/')) {
      setMessages(prev => [...prev, { role: 'assistant', content: '🔍 Reading your image…', time: new Date().toISOString(), transient: true }])
      try {
        const image = await fileToBase64(file)
        const resp = await fetch('/api/chat?action=extract_image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, phone }),
        })
        const data = await resp.json()
        setMessages(prev => prev.filter(m => !m.transient))
        sendMsg(data.description || "I couldn't read that image clearly — can you describe what's in it?")
      } catch {
        setMessages(prev => prev.filter(m => !m.transient))
        sendMsg("I couldn't read that image — can you describe what's in it?")
      }
      return
    }

    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      setMessages(prev => [...prev, { role: 'assistant', content: '📄 Reading your PDF…', time: new Date().toISOString(), transient: true }])
      try {
        const pdf = await fileToBase64(file)
        const resp = await fetch('/api/chat?action=extract_pdf', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf, phone }),
        })
        const data = await resp.json()
        setMessages(prev => prev.filter(m => !m.transient))
        if (data.text) sendMsg(`I'm sharing a file called "${file.name}". Here's its content:\n\n${data.text}`)
        else sendMsg(`I couldn't read "${file.name}" — ${data.error || 'try a different file'}.`)
      } catch {
        setMessages(prev => prev.filter(m => !m.transient))
        sendMsg(`I couldn't read "${file.name}" — try a different file.`)
      }
      return
    }

    // Word/Excel docs aren't parsed yet — say so instead of pretending it worked
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `I can't read ${file.name.split('.').pop().toUpperCase()} files yet — only images, PDFs, plain text, CSV, and JSON for now. Paste the text directly, or describe what's in it and I'll help.`,
      time: new Date().toISOString(),
    }])
  }

  const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
  const quickReplies = messages.length > 2 ? getQuickReplies(lastAI?.content || '') : []

  return (
    <div className="chat-root">
      {/* Hidden file input */}
      <input ref={fileRef} type="file" className="sr-only" style={{display:'none'}} onChange={handleFile}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv" />

      {/* Header */}
      <div className="chat-hdr">
        <button className="back-btn" onClick={() => nav(-1)} style={{ flexShrink: 0 }}><ArrowLeft size={20}/></button>
        <div className="chat-hdr-avatar">
          <img src="/logo.png" alt="Viya" className="chat-hdr-img" />
          <div className="chat-hdr-dot" />
        </div>
        <div className="chat-hdr-info">
          <div className="chat-hdr-name">Viya AI</div>
          <div className="chat-hdr-sub">
            <span className="chat-hdr-live" />
            Your 2nd brain · Always on
          </div>
        </div>
        <button className="chat-brief-pill" onClick={() => sendMsg('Give me my morning briefing')} title="Daily brief">
          <Zap size={13} /> Brief
        </button>
      </div>

      {/* Messages area */}
      <div className="chat-msgs" ref={scrollAreaRef} onScroll={onScroll}>

        {/* Suggestions — only at start */}
        {messages.length <= 2 && (
          <div className="chat-suggestions-grid">
            <div className="chat-suggestions-label">Try asking:</div>
            <div className="chat-suggestions-row">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chat-suggestion-chip" onClick={() => sendMsg(s.text)}>
                  <span>{s.emoji}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const card = m.role === 'assistant' ? detectCard(m.content) : null
          const cardCfg = card ? CARD_CFG[card] : null

          return (
            <div key={i} className={`chat-row ${m.role}`}>
              {m.role === 'assistant' && (
                <img src="/logo.png" alt="Viya" className="chat-row-avatar" />
              )}
              <div className="chat-row-col">
                {/* Action badges — show above the bubble */}
                {m.role === 'assistant' && m.actions?.length > 0 && (
                  <div className="chat-actions-strip">
                    {m.actions.map((a, ai) => <ActionBadge key={ai} action={a} />)}
                  </div>
                )}

                <div className={`chat-bubble ${m.role}${card ? ` chat-card-${card}` : ''}`}
                  style={cardCfg ? { borderLeftColor: cardCfg.border } : undefined}>
                  {cardCfg && (
                    <div className="chat-card-label">
                      {cardCfg.icon}
                      <span style={{ color: cardCfg.border }}>{cardCfg.label}</span>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: m.role === 'assistant' ? 'flex-start' : 'flex-end', gap: 8 }}>
                  <div className={`chat-time ${m.role}`}>
                    {m.time ? timeAgo(m.time) : ''}
                  </div>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speakText(m.content, i)}
                      title={speakingIndex === i ? 'Stop listening' : 'Listen to message'}
                      aria-label="Read message aloud"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        color: speakingIndex === i ? 'var(--primary, #00E5B0)' : 'var(--text3, #888)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        borderRadius: 6,
                        transition: 'color 0.2s',
                      }}
                    >
                      {speakingIndex === i ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      <span style={{ fontSize: 10 }}>{speakingIndex === i ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="chat-row assistant">
            <img src="/logo.png" alt="Viya" className="chat-row-avatar" />
            <div className="chat-bubble assistant chat-typing-bubble">
              <div className="chat-typing-dots">
                {[0,1,2].map(i => <span key={i} className="typing-dot" style={{animationDelay:`${i*0.15}s`}} />)}
              </div>
              <span className="chat-typing-label">Viya is thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} style={{height: 4}} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button className="chat-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to bottom">
          <ChevronDown size={18} />
        </button>
      )}

      {/* Quick replies */}
      {quickReplies.length > 0 && !loading && messages.length > 2 && (
        <div className="chat-replies-row">
          {quickReplies.map((r, i) => (
            <button key={i} onClick={() => sendMsg(r)} className="chat-reply-pill">{r}</button>
          ))}
        </div>
      )}

      {/* Quick Actions grid */}
      {showActions && (
        <div className="chat-qa-panel">
          <div className="chat-qa-header">
            <span className="chat-qa-title">⚡ Quick Actions</span>
            <button onClick={() => setShowActions(false)} className="chat-qa-close"><X size={16}/></button>
          </div>
          <div className="chat-qa-grid">
            {QUICK_ACTIONS.map((a, i) => (
              <button key={i} className="chat-qa-btn"
                onClick={() => { setInput(a.prompt); setShowActions(false); inputRef.current?.focus() }}>
                <span className="chat-qa-emoji">{a.emoji}</span>
                <span className="chat-qa-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attach menu */}
      {showAttach && (
        <div className="chat-attach-panel">
          {[
            { id: 'photo', emoji: '📷', label: 'Camera', desc: 'Take receipt photo' },
            { id: 'gallery', emoji: '🖼️', label: 'Gallery', desc: 'From your photos' },
            { id: 'doc', emoji: '📄', label: 'Document', desc: 'PDF, CSV, Excel' },
          ].map(opt => (
            <button key={opt.id} className="chat-attach-opt"
              onClick={() => {
                setShowAttach(false)
                if (fileRef.current) {
                  fileRef.current.accept = opt.id === 'doc' ? '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx' : 'image/*'
                  if (opt.id === 'photo') fileRef.current.capture = 'environment'
                  else fileRef.current.removeAttribute('capture')
                  fileRef.current.click()
                }
              }}>
              <span className="chat-attach-emoji">{opt.emoji}</span>
              <div>
                <div className="chat-attach-label">{opt.label}</div>
                <div className="chat-attach-desc">{opt.desc}</div>
              </div>
            </button>
          ))}
          <button className="chat-attach-close" onClick={() => setShowAttach(false)}><X size={16}/></button>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-bar">
        <button className="chat-bar-btn"
          onClick={() => { setShowActions(!showActions); setShowAttach(false) }}
          aria-label="Quick actions"
          title="Quick actions">
          <Plus size={20} />
        </button>

        <button className="chat-bar-btn"
          onClick={() => { setShowAttach(!showAttach); setShowActions(false) }}
          aria-label="Attach file"
          title="Attach file">
          <Paperclip size={18} />
        </button>

        <div className="chat-bar-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-bar-input"
            placeholder="Ask Viya anything..."
            value={input}
            rows={1}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={handleKey}
            onPaste={async e => {
              const imgItem = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
              if (!imgItem) return
              e.preventDefault()
              const file = imgItem.getAsFile()
              if (!file) return
              setMessages(prev => [...prev, { role: 'assistant', content: '🔍 Reading your image…', time: new Date().toISOString(), transient: true }])
              try {
                const image = await fileToBase64(file)
                const resp = await fetch('/api/chat?action=extract_image', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image, phone }),
                })
                const data = await resp.json()
                setMessages(prev => prev.filter(m => !m.transient))
                sendMsg(data.description || "I couldn't read that image clearly — can you describe what's in it?")
              } catch {
                setMessages(prev => prev.filter(m => !m.transient))
                sendMsg("I couldn't read that image — can you describe what's in it?")
              }
            }}
          />
        </div>

        {input.trim() ? (
          <button onClick={() => sendMsg()} disabled={loading} className="chat-bar-send send" aria-label="Send">
            <Send size={18} />
          </button>
        ) : (
          <button onClick={() => setVoiceOpen(true)} className="chat-bar-send voice" aria-label="Voice">
            <Mic size={18} />
          </button>
        )}
      </div>

      {/* Voice overlay */}
      {voiceOpen && (
        <div className="voice-overlay">
          <button className="voice-close" onClick={() => { setVoiceOpen(false); stopRecording(); setRecTime(0) }}>
            <X size={22} />
          </button>

          <div className="voice-orb-wrap">
            {recording && [0,1,2].map(i => (
              <div key={i} className="voice-ring" style={{ animationDelay: `${i * 0.4}s`, inset: -24 - i * 20 }} />
            ))}
            <div className={`voice-orb ${recording ? 'active' : ''}`}>
              <Mic size={40} color="white" />
            </div>
          </div>

          <div className="voice-timer">
            {String(Math.floor(recTime/60)).padStart(2,'0')}:{String(recTime%60).padStart(2,'0')}
          </div>
          <div className="voice-hint">
            {!voiceSupported ? "Your browser can't transcribe speech — type instead" : recording ? 'Listening... speak clearly' : 'Tap to start'}
          </div>
          {recording && voiceTranscript && <div className="voice-transcript">{voiceTranscript}</div>}

          {recording && (
            <div className="voice-wave">
              {Array.from({length:20}).map((_,i) => (
                <div key={i} className="voice-bar" style={{ animationDelay: `${i*0.06}s` }} />
              ))}
            </div>
          )}

          <div className="voice-controls">
            {recording ? (
              <>
                <button className="voice-cancel" onClick={() => { stopRecording(); setRecTime(0); setVoiceOpen(false); setVoiceTranscript('') }}>
                  <X size={20}/> Cancel
                </button>
                <button className="voice-send-btn" onClick={() => {
                  const text = voiceTranscript.trim()
                  stopRecording(); setVoiceOpen(false); setRecTime(0); setVoiceTranscript('')
                  sendMsg(text || "I tried to send a voice message but nothing was transcribed — could you type that instead?")
                }}>
                  <Send size={20}/> Send
                </button>
              </>
            ) : (
              <button className="voice-start" onClick={startRecording} disabled={!voiceSupported}>
                Start Recording
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
