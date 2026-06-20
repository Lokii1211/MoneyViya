// Subscriptions — Auto-detected recurring charges
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { CreditCard, Plus, Trash2, Bell, TrendingUp, Loader } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { useToast } from '../components/Toast'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

export default function Subscriptions() {
  const { phone } = useApp()
  const toast = useToast()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!phone) return
    loadSubs()
  }, [phone])

  const loadSubs = async () => {
    setLoading(true)
    setError(null)
    try {
      const bills = await api.getBills(phone)
      // Filter for recurring bills (subscriptions)
      const recurring = (bills || []).filter(b =>
        b.is_recurring || b.frequency === 'monthly' || b.frequency === 'yearly' || b.frequency === 'weekly'
      )
      setSubs(recurring)
    } catch (e) {
      console.error('Failed to load subscriptions:', e)
      setError('Failed to load subscriptions')
      toast.show('Could not load subscriptions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totalMonthly = subs.reduce((sum, s) => {
    const amt = Number(s.amount) || 0
    if (s.frequency === 'yearly') return sum + amt / 12
    if (s.frequency === 'weekly') return sum + amt * 4
    return sum + amt
  }, 0)
  const totalYearly = totalMonthly * 12

  const handleDelete = async (id) => {
    try {
      await api.deleteBill(id)
      setSubs(prev => prev.filter(s => s.id !== id))
      toast.show('Subscription removed', 'success')
    } catch (e) {
      toast.show('Failed to remove subscription', 'error')
    }
  }

  const getCategoryIcon = (cat) => {
    const icons = {
      entertainment: '🎬', music: '🎵', storage: '☁️', health: '💪',
      streaming: '📺', software: '💻', gaming: '🎮', news: '📰',
    }
    return icons[(cat || '').toLowerCase()] || '📋'
  }

  const getCategoryColor = (cat) => {
    const colors = {
      entertainment: '#E50914', music: '#1DB954', storage: '#007AFF', health: '#FF6B00',
      streaming: '#FF0000', software: '#6366F1', gaming: '#9333EA', news: '#0EA5E9',
    }
    return colors[(cat || '').toLowerCase()] || '#6B7280'
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Subscriptions</h1>
          <p className="body-s text-secondary">Auto-detected recurring charges</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Monthly</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color:'var(--viya-primary-700)' }}>
              {loading ? '...' : `₹${Math.round(totalMonthly).toLocaleString()}`}
            </div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Yearly</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-warning)' }}>
              {loading ? '...' : `₹${Math.round(totalYearly).toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Loader size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} color="var(--viya-primary-500)" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--viya-error)', marginBottom: 12 }}>{error}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={loadSubs}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--viya-primary-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && subs.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <CreditCard size={32} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No recurring subscriptions found</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Add recurring bills to track them here</p>
          </div>
        )}

        {/* Subscription List */}
        {!loading && !error && subs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subs.map((sub, i) => {
              const icon = getCategoryIcon(sub.category)
              const color = getCategoryColor(sub.category)
              return (
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
                    width: 44, height: 44, borderRadius: 12, background: color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{sub.name || sub.title || 'Subscription'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {sub.due_date ? `Next: ${new Date(sub.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : sub.frequency || 'Recurring'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>₹{Number(sub.amount || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/{(sub.frequency || 'mo').slice(0, 2)}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleDelete(sub.id)}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                  >
                    <Trash2 size={16} color="var(--viya-error)" />
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
