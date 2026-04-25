import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Mail, CreditCard, Calendar, Package, TrendingUp, Tag, Star, Clock, CheckCircle, AlertTriangle, ChevronRight, Filter, Search, Bell, Zap, ArrowRight } from 'lucide-react'

const EMAIL_CATEGORIES = {
  bill: { icon: <CreditCard size={16}/>, color: '#F44336', label: 'Bill', emoji: '💳' },
  meeting: { icon: <Calendar size={16}/>, color: '#0091FF', label: 'Meeting', emoji: '📅' },
  delivery: { icon: <Package size={16}/>, color: '#FF9800', label: 'Delivery', emoji: '📦' },
  investment: { icon: <TrendingUp size={16}/>, color: '#4CAF50', label: 'Investment', emoji: '📈' },
  offer: { icon: <Tag size={16}/>, color: '#9C27B0', label: 'Offer', emoji: '🏷️' },
  personal: { icon: <Star size={16}/>, color: '#FFB800', label: 'Personal', emoji: '⭐' },
  work: { icon: <Mail size={16}/>, color: '#00B0B6', label: 'Work', emoji: '💼' },
}

const PRIORITY_COLORS = {
  critical: { bg: 'var(--viya-error-light)', border: 'var(--viya-error)', dot: 'var(--viya-error)' },
  high: { bg: 'var(--viya-warning-light)', border: 'var(--viya-warning)', dot: 'var(--viya-warning)' },
  medium: { bg: 'var(--bg-card)', border: 'var(--border-light)', dot: 'var(--viya-primary-500)' },
  low: { bg: 'var(--bg-card)', border: 'var(--border-light)', dot: 'var(--viya-neutral-300)' },
}

export default function EmailIntelligence() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('action')
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const data = await api.getEmails(phone)
      if (data?.length) {
        setEmails(data)
        setConnected(true)
      }
    } catch (e) { console.error('Email load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  const handleMarkRead = async (email) => {
    await api.markEmailRead(email.id)
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
  }

  const handleMarkHandled = async (email) => {
    await api.markEmailHandled(email.id)
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_handled: true, action_required: false } : e))
  }

  const actionEmails = emails.filter(e => e.action_required && !e.is_handled)
  const unread = emails.filter(e => !e.is_read).length

  const tabs = [
    { id: 'action', label: `Action (${actionEmails.length})` },
    { id: 'all', label: 'All Mail' },
    { id: 'insights', label: 'Insights' },
  ]

  // Connect flow
  if (!connected && !loading) {
    return (
      <div className="page" style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Email Intelligence</h1>
            <p className="body-s text-secondary">Your inbox, decoded by AI ✨</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Connect Your Email</h2>
          <p className="body-m text-secondary" style={{ marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>
            Viya will scan your emails to auto-detect bills, meetings, deliveries, and investments — so you never miss anything.
          </p>

          <button onClick={() => setConnected(true)} style={{
            width: '100%', maxWidth: 320, padding: '16px 24px', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-primary)', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 auto 12px',
          }}>
            <Mail size={18}/> Connect Gmail
          </button>
          <button onClick={() => setConnected(true)} style={{
            width: '100%', maxWidth: 320, padding: '16px 24px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)',
            fontSize: 16, fontWeight: 600, cursor: 'pointer', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Mail size={18}/> Connect Outlook
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', maxWidth: 300, margin: '0 auto' }}>
            {['Auto-detect bills & due dates', 'Extract meeting invites', 'Track deliveries in real-time', 'Spot investment transactions'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                <CheckCircle size={16} color="var(--viya-success)"/> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayEmails = tab === 'action' ? actionEmails : emails

  // Compute insights from real data
  const billEmails = emails.filter(e => e.category === 'bill')
  const meetingEmails = emails.filter(e => e.category === 'meeting')
  const deliveryEmails = emails.filter(e => e.category === 'delivery')
  const investEmails = emails.filter(e => e.category === 'investment')
  const billTotal = billEmails.reduce((s, e) => {
    const amt = e.extracted_data?.amount || 0
    return s + amt
  }, 0)

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Email Intelligence</h1>
          <p className="body-s text-secondary">{unread} unread · AI-sorted ✨</p>
        </div>
        <button onClick={loadData} style={{
          padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
          background: 'var(--viya-primary-50)', color: 'var(--viya-primary-600)', border: '1px solid var(--viya-primary-200)',
          cursor: 'pointer',
        }}>Sync Now</button>
      </div>

      {/* AI Summary Card */}
      <div style={{
        background: 'var(--gradient-night)', borderRadius: 'var(--radius-2xl)', padding: 20,
        marginBottom: 16, color: 'white', boxShadow: '0 8px 32px rgba(13,0,32,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Zap size={14} color="var(--viya-gold-500)"/>
          <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Summary</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, opacity: 0.9, marginBottom: 12 }}>
          {emails.length === 0 ? 'No emails synced yet. Connect your inbox to get started!' :
            `You have ${billEmails.length > 0 ? `**${billEmails.length} bill${billEmails.length > 1 ? 's' : ''}**${billTotal > 0 ? ` totaling **₹${billTotal.toLocaleString('en-IN')}**` : ''}` : 'no bills'}, ${meetingEmails.length > 0 ? `**${meetingEmails.length} meeting${meetingEmails.length > 1 ? 's' : ''}**` : 'no meetings'}, and ${actionEmails.length} action items.`
          }
        </div>
        {actionEmails.length > 0 && (
          <button onClick={() => nav('/chat?q=handle+all+emails')} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            background: 'var(--viya-violet-500)', color: 'white', border: 'none', cursor: 'pointer',
          }}>Handle All →</button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {Object.entries(EMAIL_CATEGORIES).map(([key, cat]) => {
          const count = emails.filter(e => e.category === key).length
          if (count === 0) return null
          return (
            <div key={key} style={{
              padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
              background: cat.color + '12', color: cat.color, border: `1px solid ${cat.color}25`,
              whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {cat.emoji} {cat.label} ({count})
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            background: tab === t.id ? 'var(--bg-card)' : 'transparent',
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
            transition: 'all 0.2s', cursor: 'pointer', border: 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {(tab === 'action' || tab === 'all') && (
        <div style={{ marginBottom: 16 }}>
          {displayEmails.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
              {tab === 'action' ? 'No action items! You\'re all caught up 🎉' : 'No emails synced yet. Connect your inbox to get started.'}
            </div>
          )}
          {displayEmails.map((email) => {
            const cat = EMAIL_CATEGORIES[email.category] || EMAIL_CATEGORIES.work
            const pri = PRIORITY_COLORS[email.priority] || PRIORITY_COLORS.medium
            const data = email.extracted_data || {}
            return (
              <div key={email.id} onClick={() => { handleMarkRead(email); nav('/chat?q=' + encodeURIComponent(`Tell me about email from ${email.from_name || email.from_address}`)) }} style={{
                padding: '14px 16px', marginBottom: 8, borderRadius: 'var(--radius-lg)',
                background: pri.bg, border: `1px solid ${pri.border}`,
                borderLeft: email.priority === 'critical' ? `4px solid ${pri.dot}` : `4px solid ${cat.color}`,
                cursor: 'pointer', transition: 'transform 0.1s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: cat.color + '15', color: cat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                  }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: email.is_read ? 500 : 700 }}>{email.from_name || email.from_address || 'Unknown'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {email.received_at ? new Date(email.received_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: email.is_read ? 400 : 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject}
                    </div>
                    {email.snippet && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.snippet}
                      </div>
                    )}

                    {/* Extracted Data Chips */}
                    {Object.keys(data).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {data.amount && (
                          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--viya-error-light)', color: 'var(--viya-error)' }}>
                            ₹{Number(data.amount).toLocaleString('en-IN')}
                          </span>
                        )}
                        {data.dueDate && (
                          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--viya-warning-light)', color: 'var(--viya-warning)' }}>
                            Due: {new Date(data.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {data.startTime && (
                          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--viya-info-light)', color: 'var(--viya-info)' }}>
                            📅 {new Date(data.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {email.action_required && !email.is_handled && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleMarkHandled(email) }} style={{
                          padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                          background: cat.color, color: 'white', border: 'none', cursor: 'pointer',
                        }}>
                          {email.action_type === 'pay_bill' ? '💳 Pay Now' : email.action_type === 'accept_meeting' ? '✅ Accept' : '📋 Handle'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation() }} style={{
                          padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                          background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', cursor: 'pointer',
                        }}>
                          🔔 Remind Me
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'insights' && (
        <div style={{ marginBottom: 16 }}>
          {[
            billEmails.length > 0 && { icon: '💳', title: 'Bill Detection', desc: `${billEmails.length} bill${billEmails.length > 1 ? 's' : ''} found${billTotal > 0 ? ` totaling ₹${billTotal.toLocaleString('en-IN')}` : ''}`, color: 'var(--viya-error)' },
            meetingEmails.length > 0 && { icon: '📅', title: 'Meetings Extracted', desc: `${meetingEmails.length} meeting${meetingEmails.length > 1 ? 's' : ''} detected`, color: 'var(--viya-info)' },
            deliveryEmails.length > 0 && { icon: '📦', title: 'Delivery Tracking', desc: `${deliveryEmails.length} delivery update${deliveryEmails.length > 1 ? 's' : ''}`, color: 'var(--viya-gold-500)' },
            investEmails.length > 0 && { icon: '📈', title: 'Investment Activity', desc: `${investEmails.length} investment update${investEmails.length > 1 ? 's' : ''}`, color: 'var(--viya-success)' },
          ].filter(Boolean).map((insight, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              borderLeft: `4px solid ${insight.color}`,
            }}>
              <span style={{ fontSize: 24 }}>{insight.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: insight.color }}>{insight.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{insight.desc}</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)"/>
            </div>
          ))}
          {emails.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
              No email insights yet. Sync your inbox to get AI-powered analysis.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
