import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, TrendingDown, Calendar, CreditCard, Scissors, ExternalLink } from 'lucide-react'

const SUBSCRIPTIONS = [
  {
    id: 1, name: 'Netflix', icon: '🎬', amount: 649, renewDate: 'Jun 18',
    category: 'Entertainment', lastUsed: '2 days ago', usageScore: 85,
    status: 'active', verdict: 'keep',
  },
  {
    id: 2, name: 'Spotify Premium', icon: '🎵', amount: 119, renewDate: 'Jun 22',
    category: 'Music', lastUsed: 'Today', usageScore: 95,
    status: 'active', verdict: 'keep',
  },
  {
    id: 3, name: 'Adobe Creative Cloud', icon: '🎨', amount: 1675, renewDate: 'Jul 5',
    category: 'Productivity', lastUsed: '45 days ago', usageScore: 12,
    status: 'active', verdict: 'cancel',
  },
  {
    id: 4, name: 'YouTube Premium', icon: '📺', amount: 149, renewDate: 'Jun 15',
    category: 'Entertainment', lastUsed: '5 days ago', usageScore: 60,
    status: 'active', verdict: 'review',
  },
  {
    id: 5, name: 'Headspace', icon: '🧘', amount: 499, renewDate: 'Jun 28',
    category: 'Health', lastUsed: '30 days ago', usageScore: 8,
    status: 'active', verdict: 'cancel',
  },
  {
    id: 6, name: 'Notion Plus', icon: '📝', amount: 480, renewDate: 'Jul 10',
    category: 'Productivity', lastUsed: '1 day ago', usageScore: 90,
    status: 'active', verdict: 'keep',
  },
  {
    id: 7, name: 'Gym Membership', icon: '💪', amount: 1500, renewDate: 'Jul 1',
    category: 'Health', lastUsed: '18 days ago', usageScore: 25,
    status: 'active', verdict: 'review',
  },
]

export default function SubscriptionAudit() {
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')

  const totalMonthly = SUBSCRIPTIONS.reduce((s, sub) => s + sub.amount, 0)
  const wasteSubs = SUBSCRIPTIONS.filter(s => s.verdict === 'cancel')
  const wasteAmount = wasteSubs.reduce((s, sub) => s + sub.amount, 0)
  const yearlyWaste = wasteAmount * 12

  const filtered = filter === 'all' ? SUBSCRIPTIONS :
    filter === 'cancel' ? SUBSCRIPTIONS.filter(s => s.verdict === 'cancel') :
    filter === 'review' ? SUBSCRIPTIONS.filter(s => s.verdict === 'review') :
    SUBSCRIPTIONS.filter(s => s.verdict === 'keep')

  const verdictConfig = {
    keep: { color: 'var(--emerald-500)', bg: 'rgba(0,200,83,0.1)', label: '✅ Keep', icon: <CheckCircle size={14} /> },
    review: { color: 'var(--amber-500)', bg: 'rgba(255,152,0,0.1)', label: '⚠️ Review', icon: <AlertTriangle size={14} /> },
    cancel: { color: 'var(--coral-500)', bg: 'rgba(255,82,82,0.1)', label: '❌ Cancel', icon: <XCircle size={14} /> },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #FF7062 0%, #FF9800 50%, #FFD93D 100%)',
        padding: '50px 20px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', top: -40, right: -30,
        }} />

        <button onClick={() => nav(-1)} style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}><ArrowLeft size={16} color="white" /></button>

        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: 'white', marginBottom: 4 }}>
          ✂️ Subscription Audit
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
          Viya analyzed your subscriptions for waste
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-lg)', padding: 14,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Monthly Total</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'white' }}>
              ₹{totalMonthly.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{SUBSCRIPTIONS.length} subscriptions</div>
          </div>
          <div style={{
            background: 'rgba(255,82,82,0.25)', borderRadius: 'var(--r-lg)', padding: 14,
            border: '1px solid rgba(255,82,82,0.3)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>🔥 You Could Save</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'white' }}>
              ₹{wasteAmount.toLocaleString('en-IN')}<span style={{ fontSize: 12 }}>/mo</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>₹{yearlyWaste.toLocaleString('en-IN')}/year</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {[
            { id: 'all', label: `All (${SUBSCRIPTIONS.length})` },
            { id: 'cancel', label: `Cancel (${wasteSubs.length})` },
            { id: 'review', label: `Review (${SUBSCRIPTIONS.filter(s => s.verdict === 'review').length})` },
            { id: 'keep', label: `Keep (${SUBSCRIPTIONS.filter(s => s.verdict === 'keep').length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
              background: filter === f.id ? 'var(--teal-500)' : 'var(--bg-card)',
              color: filter === f.id ? 'white' : 'var(--text-secondary)',
              border: filter === f.id ? 'none' : '1px solid var(--border-light)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Subscription Cards */}
        {filtered.map(sub => {
          const v = verdictConfig[sub.verdict]
          return (
            <div key={sub.id} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
              border: '1px solid var(--border-light)', marginBottom: 10,
              borderLeft: `4px solid ${v.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{sub.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{sub.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sub.category} · Renews {sub.renewDate}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>₹{sub.amount}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>/month</div>
                </div>
              </div>

              {/* Usage Bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Usage Score</span>
                  <span style={{ fontWeight: 600, color: sub.usageScore > 60 ? 'var(--emerald-500)' : sub.usageScore > 30 ? 'var(--amber-500)' : 'var(--coral-500)' }}>
                    {sub.usageScore}%
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${sub.usageScore}%`, borderRadius: 99,
                    background: sub.usageScore > 60 ? 'var(--emerald-500)' : sub.usageScore > 30 ? 'var(--amber-500)' : 'var(--coral-500)',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>Last used: {sub.lastUsed}</div>
              </div>

              {/* Verdict + Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                  background: v.bg, color: v.color,
                }}>{v.label}</span>
                {sub.verdict === 'cancel' && (
                  <button style={{
                    marginLeft: 'auto', padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                    background: 'var(--coral-500)', color: 'white', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}><Scissors size={12} /> Cancel Sub</button>
                )}
                {sub.verdict === 'review' && (
                  <button style={{
                    marginLeft: 'auto', padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                    background: 'var(--amber-500)', color: 'white', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}><AlertTriangle size={12} /> Review Usage</button>
                )}
              </div>
            </div>
          )
        })}

        {/* AI Insight */}
        <div style={{
          background: 'var(--cosmos-50)', borderRadius: 'var(--r-xl)', padding: 16,
          border: '1px solid var(--cosmos-100)', marginTop: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cosmos-500)', marginBottom: 6 }}>💡 Viya's Recommendation</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            You're paying ₹{wasteAmount.toLocaleString('en-IN')}/month for services you barely use. 
            Cancel <strong>{wasteSubs.map(s => s.name).join(' and ')}</strong> to save <strong>₹{yearlyWaste.toLocaleString('en-IN')}/year</strong>. 
            That's enough for {Math.floor(yearlyWaste / 3000)} months of SIP in Axis Bluechip!
          </div>
          <button onClick={() => nav('/chat?q=cancel+unused+subscriptions')} style={{
            marginTop: 10, padding: '8px 16px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
            background: 'var(--cosmos-500)', color: 'white', border: 'none', cursor: 'pointer',
          }}>Ask Viya to Handle This →</button>
        </div>
      </div>
    </div>
  )
}
