import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, MessageCircle, Smartphone, Mail, Moon, Clock, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'

const CHANNELS = [
  { id: 'whatsapp', icon: <MessageCircle size={18} />, name: 'WhatsApp', desc: 'Primary — 80% read rate', color: '#25D366', enabled: true },
  { id: 'push', icon: <Smartphone size={18} />, name: 'Push Notifications', desc: 'Max 5/day', color: 'var(--teal-500)', enabled: true },
  { id: 'sms', icon: <MessageCircle size={18} />, name: 'SMS', desc: 'Critical alerts only, max 2/day', color: 'var(--amber-500)', enabled: false },
  { id: 'email', icon: <Mail size={18} />, name: 'Email', desc: 'Transactional receipts & reports', color: 'var(--info-500)', enabled: true },
]

const CATEGORIES = [
  { id: 'reminders', emoji: '⏰', name: 'Reminders', desc: 'User-set reminders', canDisable: false },
  { id: 'bills', emoji: '🧾', name: 'Bills & Due Dates', desc: 'Bill alerts, EMI reminders', canDisable: false },
  { id: 'goals', emoji: '🎯', name: 'Goal Updates', desc: 'Milestone achievements, progress', canDisable: true },
  { id: 'health', emoji: '💊', name: 'Health & Medicine', desc: 'Medicine reminders, health insights', canDisable: true },
  { id: 'proactive', emoji: '💡', name: 'Viya Insights', desc: 'AI-powered tips, max 2/day', canDisable: true },
  { id: 'marketing', emoji: '🎉', name: 'Product Updates', desc: 'New features, weekly max 1', canDisable: true },
]

export default function NotificationSettings() {
  const nav = useNavigate()
  const [channels, setChannels] = useState(
    Object.fromEntries(CHANNELS.map(c => [c.id, c.enabled]))
  )
  const [categories, setCategories] = useState(
    Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
  )
  const [quietStart, setQuietStart] = useState('23:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [digestMode, setDigestMode] = useState(false)

  const toggleChannel = (id) => setChannels(p => ({ ...p, [id]: !p[id] }))
  const toggleCategory = (id) => setCategories(p => ({ ...p, [id]: !p[id] }))

  const Toggle = ({ on, onToggle, disabled }) => (
    <button onClick={onToggle} disabled={disabled} style={{
      width: 44, height: 24, borderRadius: 99, padding: 2, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: on ? 'var(--teal-500)' : 'var(--viya-neutral-200)',
      opacity: disabled ? 0.5 : 1, transition: 'background 0.2s',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transform: on ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s', boxShadow: 'var(--shadow-1)',
      }} />
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        padding: '50px 20px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)',
      }}>
        <button onClick={() => nav(-1)} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ArrowLeft size={18} /></button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>🔔 Notifications</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Control what, when, and how Viya alerts you</div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Channels Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Delivery Channels
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {CHANNELS.map((ch, i) => (
              <div key={ch.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < CHANNELS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-md)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: ch.color + '15', color: ch.color,
                }}>{ch.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{ch.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ch.desc}</div>
                </div>
                <Toggle on={channels[ch.id]} onToggle={() => toggleChannel(ch.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Notification Categories
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cat.desc}</div>
                </div>
                {cat.canDisable ? (
                  <Toggle on={categories[cat.id]} onToggle={() => toggleCategory(cat.id)} />
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--teal-600)', background: 'var(--teal-50)', padding: '3px 8px', borderRadius: 99 }}>Always On</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            <Moon size={12} style={{ marginRight: 4 }} /> Quiet Hours
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              No notifications during these hours (except critical bills)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>From</div>
                <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-light)', fontSize: 14,
                  fontFamily: "'JetBrains Mono',monospace", background: 'var(--bg-secondary)',
                }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', paddingTop: 18 }}>to</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Until</div>
                <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-light)', fontSize: 14,
                  fontFamily: "'JetBrains Mono',monospace", background: 'var(--bg-secondary)',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Digest */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
          border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: 'var(--cosmos-50)', color: 'var(--cosmos-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Clock size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Daily Digest Mode</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Bundle non-urgent notifications into one daily summary</div>
          </div>
          <Toggle on={digestMode} onToggle={() => setDigestMode(!digestMode)} />
        </div>
      </div>
    </div>
  )
}
