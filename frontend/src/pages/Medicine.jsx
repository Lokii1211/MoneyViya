// Medicine — Medicine schedule with push notification alerts
import { useState } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { Pill, Plus, Clock, Check, Trash2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'

const MOCK_MEDS = [
  { id: 1, name: 'Vitamin D3', dosage: '1000 IU', time: '08:00', frequency: 'daily', taken: true, icon: '💊', color: '#FF9800' },
  { id: 2, name: 'Omega-3', dosage: '1000mg', time: '08:00', frequency: 'daily', taken: true, icon: '🐟', color: '#2196F3' },
  { id: 3, name: 'Multivitamin', dosage: '1 tablet', time: '13:00', frequency: 'daily', taken: false, icon: '💉', color: '#4CAF50' },
  { id: 4, name: 'Melatonin', dosage: '3mg', time: '22:00', frequency: 'daily', taken: false, icon: '🌙', color: '#9C27B0' },
]

export default function Medicine() {
  const [meds, setMeds] = useState(MOCK_MEDS)
  const [showAdd, setShowAdd] = useState(false)
  const toast = useToast()
  const taken = meds.filter(m => m.taken).length
  const total = meds.length
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0

  const toggleTaken = (id) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m))
    toast.show('Medicine logged ✅', 'success')
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Medicine</h1>
            <p className="body-s text-secondary">Never miss a dose 💊</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add
          </HapticButton>
        </div>

        {/* Progress Ring */}
        <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 12px' }}>
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--bg-secondary)" strokeWidth={8} />
              <motion.circle cx={50} cy={50} r={40} fill="none" stroke="var(--viya-success)"
                strokeWidth={8} strokeLinecap="round" strokeDasharray={251.3}
                initial={{ strokeDashoffset: 251.3 }}
                animate={{ strokeDashoffset: 251.3 * (1 - pct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}%</span>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{taken}/{total} taken today</div>
        </div>

        {/* Medicine List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meds.map((med, i) => (
            <motion.div key={med.id} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, opacity: med.taken ? 0.6 : 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: med.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {med.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, textDecoration: med.taken ? 'line-through' : 'none' }}>{med.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{med.dosage} · {med.time}</div>
              </div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleTaken(med.id)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: med.taken ? 'var(--viya-success)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <Check size={18} color={med.taken ? 'white' : 'var(--text-tertiary)'} />
              </motion.button>
            </motion.div>
          ))}
        </div>

        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Medicine">
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Medicine form coming soon ✨
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
