import { useState, useRef, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Send, Mic, Sparkles } from 'lucide-react'

export default function Chat() {
  const { phone } = useApp()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Viya, your AI wealth manager. Ask me anything about your finances, goals, or habits! 💰' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      const msg = q.replace(/\+/g, ' ')
      // Auto-send the quick action
      setMessages(prev => [...prev, { role: 'user', content: msg }])
      setLoading(true)
      api.chat(phone, msg).then(r => {
        setMessages(prev => [...prev, { role: 'assistant', content: r.reply || 'Try again!' }])
        setLoading(false)
      }).catch(() => { setLoading(false) })
      // Clean URL
      window.history.replaceState({}, '', '/chat')
    }
  }, [])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const r = await api.chat(phone, userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: r.reply || 'I couldn\'t process that. Try again!' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }])
    }
    setLoading(false)
  }

  const chips = ['💰 My balance', '📊 Weekly review', '🎯 My goals', '🔥 My habits', '💡 Save money tips', '📅 Plan my day']

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Sparkles size={20} className="chat-ai-icon" />
        <div><div className="chat-title">Viya AI</div><div className="chat-sub">Your Private Wealth Manager</div></div>
      </header>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={'chat-bubble ' + m.role}>
            {m.role === 'assistant' && <div className="bubble-avatar"><Sparkles size={14} /></div>}
            <div className="bubble-content" dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} />
          </div>
        ))}
        {loading && <div className="chat-bubble assistant"><div className="bubble-avatar"><Sparkles size={14} /></div><div className="bubble-content typing">Thinking...</div></div>}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div className="chip-row">{chips.map((c, i) => (<button key={i} className="chip" onClick={() => { setInput(c.slice(2)); }}>{c}</button>))}</div>
      )}
      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input type="text" placeholder="Ask Viya anything..." value={input} onChange={e => setInput(e.target.value)} className="chat-input" />
        <button type="submit" className="send-btn" disabled={loading}><Send size={18} /></button>
      </form>
    </div>
  )
}
