import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Mail, CreditCard, Calendar, Package, Clock, ArrowLeft, RefreshCw, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function EmailIntelligence() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (phone) loadEmails()
  }, [phone])

  const loadEmails = async () => {
    setLoading(true)
    try {
      const res = await api.getEmails(phone, 30)
      setEmails(res || [])
    } catch (e) {
      console.error('Error loading emails:', e)
    } finally {
      setLoading(false)
    }
  }

  const connectGmail = () => {
    window.location.href = `/api/auth/gmail?phone=${encodeURIComponent(phone || '')}`
  }

  const isConnected = Boolean(user?.gmail_connected || emails.length > 0)
  const filtered = filter === 'all' ? emails : emails.filter(e => e.category === filter)

  return (
    <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Email Intelligence</h1>
            <p className="body-s text-secondary">Your inbox decoded into bills, meetings & orders ✨</p>
          </div>
        </div>
        {isConnected && (
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={loadEmails}>
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Connection Banner */}
      {!isConnected ? (
        <div style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderRadius: 'var(--radius-2xl)', padding: 24,
          marginBottom: 20, color: 'white', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(30,27,75,0.4)',
        }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📬</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            Connect Your Gmail
          </h2>
          <p style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 16px' }}>
            Viya securely scans your inbox using bank-grade AES encryption to auto-detect credit card bills, Amazon packages, and meeting links.
          </p>
          <button
            onClick={connectGmail}
            style={{
              padding: '12px 24px', borderRadius: 'var(--radius-full)',
              background: '#FFFFFF', color: '#1E1B4B', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <Mail size={16} color="#4338CA" /> Connect with Google
          </button>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, opacity: 0.75 }}>
            <ShieldCheck size={14} /> Bank-grade encryption • Read-only access
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(0,229,176,0.08)', border: '1px solid rgba(0,229,176,0.3)',
          borderRadius: 14, padding: 14, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={20} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Gmail Connected</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.gmail_address || 'Inbox active & scanning'}</div>
            </div>
          </div>
          <button onClick={connectGmail} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Re-sync
          </button>
        </div>
      )}

      {/* Feature Pills */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          ⚡ Auto-Detected Categories
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: 'All', emoji: '📬' },
            { key: 'bill', label: 'Bills', emoji: '💳' },
            { key: 'delivery', label: 'Deliveries', emoji: '📦' },
            { key: 'meeting', label: 'Meetings', emoji: '📅' },
            { key: 'subscription', label: 'Subscriptions', emoji: '📈' },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: filter === c.key ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: filter === c.key ? 'var(--primary-dim)' : 'var(--surface)',
                color: filter === c.key ? 'var(--primary)' : 'var(--text2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
              }}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Synced Email List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(e => (
            <div
              key={e.id}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: e.category === 'bill' ? 'rgba(239,68,68,0.1)' : e.category === 'delivery' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>
                {e.category === 'bill' ? '💳' : e.category === 'delivery' ? '📦' : e.category === 'meeting' ? '📅' : '✉️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{e.sender || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(e.received_at)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.subject}
                </div>
                {e.snippet && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {e.snippet}
                  </div>
                )}
                {e.extracted_amount && (
                  <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(0,229,176,0.1)', color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
                    ₹{Number(e.extracted_amount).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No emails detected yet</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 260, margin: '0 auto' }}>
            Connect your Gmail or tell Viya in chat about your upcoming bills & orders!
          </div>
        </div>
      )}
    </div>
  )
}
