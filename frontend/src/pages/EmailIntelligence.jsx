import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
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
  const [connectedEmail, setConnectedEmail] = useState('')

  // Check URL params for OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      setConnected(true)
      setConnectedEmail(params.get('email') || '')
      // Clean URL
      window.history.replaceState({}, '', '/email')
    }
    if (params.get('error')) {
      console.error('Gmail OAuth error:', params.get('error'))
    }
  }, [])

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

  const handleConnectGmail = () => {
    // Open OAuth in popup instead of redirect (feels more native)
    const width = 500, height = 600
    const left = (window.innerWidth - width) / 2 + window.screenX
    const top = (window.innerHeight - height) / 2 + window.screenY
    const popup = window.open(
      `/api/auth/gmail?phone=${encodeURIComponent(phone)}`,
      'gmail_oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    )

    // Poll for popup close (callback redirects back to /email)
    const pollTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollTimer)
          // Reload data after popup closes
          setTimeout(() => loadData(), 1000)
        }
        // Check if popup landed on our callback
        if (popup?.location?.href?.includes('/email')) {
          const url = new URL(popup.location.href)
          if (url.searchParams.get('connected') === 'true') {
            setConnected(true)
            setConnectedEmail(url.searchParams.get('email') || '')
            popup.close()
            clearInterval(pollTimer)
            loadData()
          }
        }
      } catch (e) { /* cross-origin - ignore */ }
    }, 500)
  }

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

  // Connect flow — user-friendly native feel
  if (!connected && !loading) {
    return (
      <div className="page" style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Email Intelligence</h1>
            <p className="body-s text-secondary">Your inbox, decoded by AI ✨</p>
          </div>
        </div>

        {/* Hero Card */}
        <div style={{
          background: 'var(--gradient-night)', borderRadius: 'var(--radius-2xl)', padding: 28,
          marginBottom: 20, color: 'white', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(13,0,32,0.4)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            Let Viya Watch Your Inbox
          </h2>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20, lineHeight: 1.5 }}>
            Viya reads your emails and auto-detects bills, meetings, deliveries & investments — so you never miss anything important.
          </p>

          {/* Primary: Popup-based connect (native feel) */}
          <button onClick={handleConnectGmail} style={{
            width: '100%', maxWidth: 300, padding: '14px 24px', borderRadius: 'var(--radius-full)',
            background: 'white', color: '#1a1a1a', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 auto 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
            Opens a secure popup · Powered by Google OAuth 2.0
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="card" style={{ padding: 20, marginBottom: 16, border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔒</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Your Privacy is Protected</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Google-verified secure connection</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '✅', text: 'Read-only access' },
              { icon: '✅', text: 'No passwords stored' },
              { icon: '🚫', text: "Can't send emails" },
              { icon: '🚫', text: "Can't delete anything" },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* What AI Detects */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🧠 What Viya detects from your inbox:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { emoji: '💳', label: 'Bills & Due Dates', color: '#F44336' },
              { emoji: '📅', label: 'Meeting Invites', color: '#2196F3' },
              { emoji: '📦', label: 'Delivery Tracking', color: '#FF9800' },
              { emoji: '📈', label: 'Investments', color: '#4CAF50' },
            ].map((d, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                background: d.color + '10', border: `1px solid ${d.color}20`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>{d.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disconnect anytime notice */}
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            You can disconnect anytime from Profile → Settings.
            <br/>Viya never stores your email content permanently.
          </p>
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
            `You have ${billEmails.length > 0 ? `**${billEmails.length} bill${billEmails.length > 1 ? 's' : ''}**${billTotal > 0 ? ` totaling **₹${billTotal}**` : ''}` : 'no bills'}, ${meetingEmails.length > 0 ? `**${meetingEmails.length} meeting${meetingEmails.length > 1 ? 's' : ''}**` : 'no meetings'}, and ${actionEmails.length} action items.`
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
                            ₹{Number(data.amount)}
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
            billEmails.length > 0 && { icon: '💳', title: 'Bill Detection', desc: `${billEmails.length} bill${billEmails.length > 1 ? 's' : ''} found${billTotal > 0 ? ` totaling ₹${billTotal}` : ''}`, color: 'var(--viya-error)' },
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
