// Splits — Track who owes you, send reminders
import { useState } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { Users, Plus, Check, Clock, Send } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'

const MOCK_SPLITS = [
  { id: 1, title: 'Dinner at Zomato', total: 2400, date: '2026-05-08', participants: [
    { name: 'Arun', amount: 600, paid: true },
    { name: 'Priya', amount: 600, paid: false },
    { name: 'Karthik', amount: 600, paid: false },
    { name: 'You', amount: 600, paid: true },
  ]},
  { id: 2, title: 'Movie tickets', total: 1200, date: '2026-05-05', participants: [
    { name: 'Rohit', amount: 400, paid: true },
    { name: 'Sneha', amount: 400, paid: false },
    { name: 'You', amount: 400, paid: true },
  ]},
]

export default function Splits() {
  const [splits, setSplits] = useState(MOCK_SPLITS)
  const [showAdd, setShowAdd] = useState(false)
  const totalOwed = splits.reduce((sum, s) =>
    sum + s.participants.filter(p => !p.paid && p.name !== 'You').reduce((a, p) => a + p.amount, 0), 0)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Split Bills</h1>
            <p className="body-s text-secondary">Track shared expenses 🤝</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New
          </HapticButton>
        </div>

        {/* Owed Summary */}
        <div className="card" style={{
          padding: 20, marginBottom: 20, background: 'var(--gradient-night)',
          color: 'white', textAlign: 'center', borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Friends owe you</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>₹{totalOwed.toLocaleString()}</div>
        </div>

        {/* Split Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {splits.map((split, i) => (
            <motion.div key={split.id} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{split.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{split.date} · ₹{split.total}</div>
                </div>
                <Users size={18} color="var(--text-tertiary)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {split.participants.filter(p => p.name !== 'You').map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                      }}>
                        {p.name[0]}
                      </div>
                      <span style={{ fontSize: 14 }}>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>₹{p.amount}</span>
                      {p.paid ? (
                        <span style={{ fontSize: 11, color: 'var(--viya-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Check size={12} /> Paid
                        </span>
                      ) : (
                        <motion.button whileTap={{ scale: 0.9 }} style={{
                          fontSize: 11, fontWeight: 600, color:'var(--viya-primary-700)',
                          background: 'var(--viya-primary-500)11', border: 'none', borderRadius: 8,
                          padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                          <Send size={10} /> Remind
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Split">
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Split bill creation form coming soon ✨
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
