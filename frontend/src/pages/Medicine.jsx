import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { Pill, Plus, Check, Clock, Trash2, X, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night']

export default function Medicine() {
  const { phone } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [medicines, setMedicines] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('Morning')

  useEffect(() => {
    if (phone) loadData()
  }, [phone])

  async function loadData() {
    setLoading(true)
    const [meds, checks] = await Promise.all([
      api.getMedicines(phone),
      api.getMedicineCheckins(phone),
    ])
    setMedicines(meds || [])
    setCheckins(checks || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    const ok = await api.addMedicine(phone, { name: name.trim(), dosage, time, active: true })
    if (!ok) { toast.show('Failed to add medicine', 'error'); return }
    setName(''); setDosage(''); setTime('Morning'); setShowAdd(false)
    toast.show('Medicine added', 'success')
    loadData()
  }

  async function handleCheckin(medId) {
    const ok = await api.checkinMedicine(medId, phone)
    if (!ok) { toast.show('Failed to save — try again', 'error'); return }
    toast.show('Medicine taken!', 'success')
    loadData()
  }

  async function handleDelete(id) {
    const ok = await api.deleteMedicine(id)
    if (!ok) { toast.show('Failed to remove medicine', 'error'); return }
    toast.show('Medicine removed', 'info')
    loadData()
  }

  const isTaken = (medId) => checkins.some(c => c.medicine_id === medId)
  const takenCount = medicines.filter(m => isTaken(m.id)).length
  const pct = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Medicine</h2>
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 'var(--radius)' }} />)}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <Pill size={22} style={{ color: 'var(--coral-400)' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Medicine</h2>
        </div>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, minHeight: 36 }} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>

      {medicines.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', marginBottom: 20,
        }}>
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={40} cy={40} r={32} fill="none" stroke="var(--surface2)" strokeWidth={6} />
              <motion.circle cx={40} cy={40} r={32} fill="none" stroke="var(--primary)"
                strokeWidth={6} strokeLinecap="round" strokeDasharray={201}
                initial={{ strokeDashoffset: 201 }}
                animate={{ strokeDashoffset: 201 * (1 - pct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800 }}>{pct}%</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {takenCount === medicines.length ? 'All done!' : `${takenCount}/${medicines.length} taken`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              {takenCount === medicines.length ? 'Great job staying on track' : 'Tap to mark as taken'}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd} className="entry-form" style={{ marginBottom: 20, overflow: 'hidden' }}
          >
            <div className="form-group">
              <label>Medicine Name</label>
              <input className="form-input" placeholder="e.g. Vitamin D3" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Dosage</label>
              <input className="form-input" placeholder="e.g. 1 tablet, 5ml" value={dosage} onChange={e => setDosage(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Time of Day</label>
              <div className="cat-grid">
                {TIME_OPTIONS.map(t => (
                  <button key={t} type="button" className={`cat-chip${time === t ? ' active' : ''}`} onClick={() => setTime(t)}>{t}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary full">Add Medicine</button>
          </motion.form>
        )}
      </AnimatePresence>

      {medicines.length === 0 ? (
        <div className="empty-state">
          <Pill size={48} className="empty-icon" />
          <h3>No medicines tracked</h3>
          <p>Add your daily medications and supplements to never miss a dose.</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TIME_OPTIONS.map(timeSlot => {
            const meds = medicines.filter(m => m.time === timeSlot)
            if (!meds.length) return null
            return (
              <section key={timeSlot}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} />{timeSlot}
                </div>
                {meds.map((med, i) => {
                  const taken = isTaken(med.id)
                  return (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`habit-card${taken ? ' done' : ''}`}
                    >
                      <div className="habit-left">
                        <span style={{ fontSize: 24 }}>💊</span>
                        <div>
                          <div className="habit-name" style={{ textDecoration: taken ? 'line-through' : 'none', opacity: taken ? 0.6 : 1 }}>{med.name}</div>
                          {med.dosage && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{med.dosage}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          className={`checkin-btn${taken ? ' checked' : ''}`}
                          onClick={() => handleCheckin(med.id)}
                          aria-label={taken ? 'Taken' : 'Mark as taken'}
                          style={{
                            width: 36, height: 36, borderRadius: '50%', minHeight: 36,
                            background: taken ? 'var(--primary)' : 'var(--surface2)',
                          }}
                        >
                          <Check size={18} color={taken ? '#fff' : undefined} />
                        </motion.button>
                        <button className="checkin-btn" onClick={() => handleDelete(med.id)} aria-label="Delete" style={{ minHeight: 36 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
