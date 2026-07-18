// Email Intelligence — Coming Soon.
// Gmail OAuth needs Google's sensitive-scope app verification (same review
// queue as Sign in with Google) before it can be offered to real users, so
// the connect flow is hidden for now rather than exposing an OAuth screen
// that would confuse people or fail. The backend (api/auth/gmail/*) is left
// intact and working — this only gates the entry point in the UI.
import { Mail, CreditCard, Calendar, Package, Clock } from 'lucide-react'

export default function EmailIntelligence() {
  return (
    <div className="page" style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Email Intelligence</h1>
        <p className="body-s text-secondary">Your inbox, decoded by AI ✨</p>
      </div>

      <div style={{
        background: 'var(--gradient-night)', borderRadius: 'var(--radius-2xl)', padding: 28,
        marginBottom: 20, color: 'white', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(13,0,32,0.4)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          Coming Soon
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.5 }}>
          Gmail connect is going through Google's security review before it opens up —
          once that clears, Viya will read your inbox and auto-detect bills, meetings,
          deliveries & investments.
        </p>
        <div style={{
          marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700,
        }}>
          <Clock size={12} /> In review
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🧠 What it'll detect from your inbox:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: <CreditCard size={16}/>, emoji: '💳', label: 'Bills & Due Dates', color: '#F44336' },
            { icon: <Calendar size={16}/>, emoji: '📅', label: 'Meeting Invites', color: '#2196F3' },
            { icon: <Package size={16}/>, emoji: '📦', label: 'Delivery Tracking', color: '#FF9800' },
            { icon: <Mail size={16}/>, emoji: '📈', label: 'Investments', color: '#4CAF50' },
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

      <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          In the meantime, tell Viya about bills and meetings directly in chat or WhatsApp —
          she'll log and remind you the same way.
        </p>
      </div>
    </div>
  )
}
