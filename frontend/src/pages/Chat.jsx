import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Send, Mic, Paperclip, CheckCircle, TrendingUp, AlertTriangle, Target, Bell, BarChart3 } from 'lucide-react'
import { timeAgo } from '../lib/utils'

const SUGGESTIONS = [
  { text: '💰 How to save ₹1 lakh?', color: '#00B0B6' },
  { text: '📊 Weekly spending review', color: '#6422CC' },
  { text: '🏋️ Diet plan for gym', color: '#00D084' },
  { text: '📖 Study schedule', color: '#FFB800' },
  { text: '📈 Best SIP for beginners', color: '#FF9500' },
  { text: '💼 Tax saving tips', color: '#834DE0' },
]

const QUICK_ACTIONS = [
  { emoji: '💸', label: 'Add Expense', prompt: 'I spent ₹' },
  { emoji: '📝', label: 'Morning Brief', prompt: 'Give me my morning briefing' },
  { emoji: '🎯', label: 'Goal Update', prompt: 'How are my goals doing?' },
  { emoji: '🧠', label: 'Remember', prompt: 'Remember that ' },
]

function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:var(--viya-neutral-100);padding:2px 6px;border-radius:4px;font-family:JetBrains Mono,monospace;font-size:13px">$1</code>')
    .replace(/\n/g, '<br/>')
}

// Detect rich card type from AI response content
function detectCardType(content) {
  if (!content) return null
  const lower = content.toLowerCase()
  if (lower.includes('✅ done') || lower.includes('expense logged') || lower.includes('logged successfully') || lower.includes('reminder set'))
    return 'action'
  if (lower.includes('noticed') || lower.includes('tip:') || lower.includes('💡') || lower.includes('insight'))
    return 'suggestion'
  if (lower.includes('this week') && (lower.includes('₹') || lower.includes('spending')))
    return 'report'
  if (lower.includes('goal') && lower.includes('%'))
    return 'goal'
  return null
}

function getCardStyle(type) {
  switch(type) {
    case 'action': return { bg: 'var(--viya-success-light)', border: 'var(--viya-success)', icon: <CheckCircle size={16} color="var(--viya-success)"/> }
    case 'suggestion': return { bg: 'var(--viya-primary-50)', border: 'var(--viya-primary-500)', icon: <AlertTriangle size={16} color="var(--viya-primary-500)"/> }
    case 'report': return { bg: 'var(--bg-card)', border: 'var(--viya-violet-500)', icon: <BarChart3 size={16} color="var(--viya-violet-500)"/> }
    case 'goal': return { bg: 'var(--viya-gold-100)', border: 'var(--viya-gold-500)', icon: <Target size={16} color="var(--viya-gold-500)"/> }
    default: return null
  }
}

// Generate contextual quick replies based on last message
function getQuickReplies(lastMsg) {
  if (!lastMsg) return []
  const lower = lastMsg.toLowerCase()
  if (lower.includes('expense') || lower.includes('spent'))
    return ['Add another', 'View this month', 'Set budget', 'Find savings']
  if (lower.includes('goal'))
    return ['Add ₹500', 'Change target', 'View all goals', 'Boost savings']
  if (lower.includes('habit') || lower.includes('streak'))
    return ['Log workout', 'Skip today', 'View streaks', 'Add habit']
  if (lower.includes('remind') || lower.includes('reminder'))
    return ['Edit reminder', 'View all reminders', 'Set another']
  if (lower.includes('morning') || lower.includes('briefing'))
    return ['Handle all', 'Show expenses', 'Check goals', 'View habits']
  return ['Tell me more', 'Thanks!', 'What else?']
}

export default function Chat() {
  const { phone, user } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const name = user?.name || 'there'
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? '☀️ Good morning' : hour < 18 ? '🌤️ Good afternoon' : '🌙 Good evening'

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `${timeGreet} ${name}! 👋\n\nI'm **Viya** — your AI second brain.\n\n• 💰 Track money & budgets\n• 🏋️ Gym & diet plans\n• 📖 Study schedules\n• 🧠 Remember anything\n• 📈 Investment advice\n\nJust type or tap a suggestion!`,
      time: new Date().toISOString()
    }])
    if (!phone) return
    api.getChatHistory(phone, 20).then(history => {
      if (history?.length > 0) {
        const msgs = history.reverse().map(h => ({ role: h.role, content: h.content, time: h.created_at }))
        setMessages(prev => [prev[0], ...msgs])
      }
    })
  }, [phone])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const sendMsg = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setShowActions(false)
    setMessages(prev => [...prev, { role: 'user', content: msg, time: new Date().toISOString() }])
    setLoading(true)
    try {
      const { reply } = await api.chat(phone, msg)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "🤖 Connection issue. Please try again!", time: new Date().toISOString() }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const quickReplies = messages.length > 2 ? getQuickReplies(lastAssistantMsg?.content || '') : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - var(--header-height) - var(--nav-height))', background: 'var(--bg-secondary)' }}>
      {/* Chat Header Bar */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          <img src="/logo.png" alt="Viya" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Viya</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--viya-success)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--viya-success)', fontWeight: 500 }}>Online</span>
          </div>
        </div>
        <button onClick={() => sendMsg('Give me my morning briefing')} style={{
          padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
          background: 'var(--viya-primary-50)', color: 'var(--viya-primary-600)', border: '1px solid var(--viya-primary-200)',
        }}>📊 Brief</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => {
          const cardType = m.role === 'assistant' ? detectCardType(m.content) : null
          const cardStyle = cardType ? getCardStyle(cardType) : null

          return (
            <div key={i} style={{
              display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              gap: 8, alignItems: 'flex-end',
              animation: 'slideUp 0.25s var(--ease)',
              animationFillMode: 'backwards',
              animationDelay: i > messages.length - 3 ? '0.05s' : '0s',
            }}>
              {m.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                  <img src="/logo.png" alt="Viya" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                ...(cardStyle ? {
                  padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  background: cardStyle.bg, border: `1px solid ${cardStyle.border}20`,
                  borderLeft: `4px solid ${cardStyle.border}`,
                  boxShadow: 'var(--shadow-2)',
                } : {
                  padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: m.role === 'user' ? 'var(--shadow-teal)' : 'var(--shadow-1)',
                  border: m.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                }),
                fontSize: 15, lineHeight: 1.5,
              }}>
                {cardStyle && (
                  <div style={{
                    padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: 6,
                    borderBottom: `1px solid ${cardStyle.border}15`,
                  }}>
                    {cardStyle.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: cardType === 'action' ? 'var(--viya-success)' : cardType === 'suggestion' ? 'var(--viya-primary-600)' : cardType === 'goal' ? 'var(--viya-gold-500)' : 'var(--viya-violet-500)'
                    }}>
                      {cardType === 'action' ? 'Action Complete' : cardType === 'suggestion' ? 'Viya Insight' : cardType === 'goal' ? 'Goal Update' : 'Report'}
                    </span>
                  </div>
                )}
                <div style={cardStyle ? { padding: '10px 14px' } : {}}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                </div>
                <div style={{
                  fontSize: 10, padding: cardStyle ? '0 14px 8px' : '0', marginTop: cardStyle ? 0 : 4, textAlign: 'right',
                  color: m.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
                }}>
                  {m.time ? timeAgo(m.time) : ''}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', animation: 'slideUp 0.2s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
              <img src="/logo.png" alt="Viya" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            <div style={{
              padding: '14px 20px', borderRadius: '18px 18px 18px 4px',
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--viya-primary-400)',
                      animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>Viya is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Replies — contextual chips above input */}
      {quickReplies.length > 0 && !loading && messages.length > 2 && (
        <div style={{
          padding: '6px 16px 2px', display: 'flex', gap: 6,
          overflowX: 'auto', flexShrink: 0,
        }}>
          {quickReplies.map((r, i) => (
            <button key={i} onClick={() => sendMsg(r)} style={{
              whiteSpace: 'nowrap', flexShrink: 0, padding: '6px 14px',
              borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
              background: 'var(--bg-card)', border: '1px solid var(--viya-primary-200)',
              color: 'var(--viya-primary-600)', cursor: 'pointer', transition: 'all 0.15s',
            }}>{r}</button>
          ))}
        </div>
      )}

      {/* Suggestions — show only at start */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="chip" onClick={() => sendMsg(s.text)}
              style={{ whiteSpace: 'nowrap', borderColor: s.color + '30', flexShrink: 0 }}>
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions Panel */}
      {showActions && (
        <div style={{
          padding: '12px 16px', display: 'flex', gap: 8,
          background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)',
          animation: 'slideUp 0.2s ease',
        }}>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} onClick={() => { setInput(a.prompt); setShowActions(false); inputRef.current?.focus() }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 12, textAlign: 'center',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
              }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <span style={{ fontWeight: 500 }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div style={{
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)',
      }}>
        <button onClick={() => setShowActions(!showActions)}
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: showActions ? 'var(--viya-primary-50)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showActions ? 'var(--viya-primary-500)' : 'var(--text-tertiary)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}>
          <Paperclip size={18} />
        </button>

        <input
          ref={inputRef}
          style={{
            flex: 1, height: 42, padding: '0 16px',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 15, outline: 'none',
            transition: 'border-color 0.2s',
          }}
          placeholder="Ask Viya anything..."
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          onFocus={(e) => e.target.style.borderColor = 'var(--viya-primary-500)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />

        <button onClick={() => sendMsg()} disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: input.trim() ? 'var(--gradient-primary)' : 'var(--viya-neutral-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: input.trim() ? 'white' : 'var(--text-tertiary)',
            boxShadow: input.trim() ? 'var(--shadow-teal)' : 'none',
            transition: 'all 0.2s var(--ease)', cursor: 'pointer', border: 'none',
          }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
