// Subscriptions — Auto-detected recurring charges
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { CreditCard, Plus, Trash2, Bell, TrendingUp } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { useToast } from '../components/Toast'

const MOCK_SUBS = [
  { id: 1, name: 'Netflix', amount: 199, frequency: 'monthly', nextCharge: '2026-05-15', category: 'Entertainment', icon: '🎬', color: '#E50914' },
  { id: 2, name: 'Spotify', amount: 119, frequency: 'monthly', nextCharge: '2026-05-20', category: 'Music', icon: '🎵', color: '#1DB954' },
  { id: 3, name: 'iCloud+', amount: 75, frequency: 'monthly', nextCharge: '2026-05-28', category: 'Storage', icon: '☁️', color: '#007AFF' },
  { id: 4, name: 'YouTube Premium', amount: 149, frequency: 'monthly', nextCharge: '2026-06-01', category: 'Entertainment', icon: '📺', color: '#FF0000' },
  { id: 5, name: 'Gym Membership', amount: 1500, frequency: 'monthly', nextCharge: '2026-06-05', category: 'Health', icon: '💪', color: '#FF6B00' },
]

export default function Subscriptions() {
  const [subs, setSubs] = useState(MOCK_SUBS)
  const toast = useToast()
  const totalMonthly = subs.reduce((sum, s) => sum + s.amount, 0)
  const totalYearly = totalMonthly * 12

  const handleDelete = (id) => {
    setSubs(prev => prev.filter(s => s.id !== id))
    toast.show('Subscription removed', 'success')
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Subscriptions</h1>
          <p className="body-s text-secondary">Auto-detected recurring charges 🔄</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Monthly</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color:'var(--viya-primary-700)' }}>
              ₹{totalMonthly.toLocaleString()}
            </div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Yearly</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-warning)' }}>
              ₹{totalYearly.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subs.map((sub, i) => (
            <motion.div
              key={sub.id}
              variants={listItem}
              initial="initial"
              animate="animate"
              custom={i}
              className="card"
              style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: sub.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {sub.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Next: {new Date(sub.nextCharge).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>₹{sub.amount}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/mo</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleDelete(sub.id)}
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
              >
                <Trash2 size={16} color="var(--viya-error)" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
