import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Send, Sparkles, Bot } from 'lucide-react'

const SUGGESTIONS = [
  '💰 How to save ₹1 lakh?',
  '📊 Weekly review',
  '🏋️ Diet plan for gym',
  '📖 Study schedule for exams',
  '🏠 Household budget tips',
  '📈 Best SIP for beginners',
  '🧮 Calculate my protein needs',
  '💼 Tax saving tips',
]

export default function Chat() {
  const { phone } = useApp()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hey! I\'m **Viya** — your personal AI assistant.\n\nI can help with:\n• 💰 Budget & Savings\n• 🏋️ Gym & Diet plans\n• 📖 Study schedules\n• 📊 Financial planning\n• 🎯 Goal tracking\n\nJust type anything!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  // Load chat history
  useEffect(() => {
    if (!phone) return
    api.getChatHistory(phone, 30).then(history => {
      if (history.length > 0) {
        const msgs = history.reverse().map(h => ({ role: h.role, content: h.content }))
        setMessages(prev => [prev[0], ...msgs])
      }
    })
  }, [phone])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMsg = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    const { reply } = await api.chat(phone, msg)
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setLoading(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div style={{width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),#34D399)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <div className="chat-title">Viya AI</div>
          <div className="chat-sub">● Online — Your personal assistant</div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.role === 'assistant' && (
              <div className="bubble-avatar"><Bot size={14} /></div>
            )}
            <div className={`bubble-content${m.role === 'assistant' && loading && i === messages.length - 1 ? ' typing' : ''}`}>
              {m.content.split('\n').map((line, j) => (
                <span key={j}>{line.replace(/\*\*(.*?)\*\*/g, '«$1»').split('«').map((part, k) => {
                  if (part.includes('»')) {
                    const [bold, rest] = part.split('»')
                    return <span key={k}><strong>{bold}</strong>{rest}</span>
                  }
                  return part
                })}<br /></span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="bubble-avatar"><Bot size={14} /></div>
            <div className="bubble-content typing">Thinking...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="chip-row">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="chip" onClick={() => sendMsg(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-input-bar">
        <input
          className="chat-input" placeholder="Ask Viya anything..."
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
        />
        <button className="send-btn" onClick={() => sendMsg()} disabled={!input.trim() || loading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
