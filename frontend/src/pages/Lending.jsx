// Lending — Track money given/taken with interest and reminders
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
import { Plus, ArrowUpRight, ArrowDownLeft, Clock, Bell, Percent, User, Calendar, Check, X } from 'lucide-react'
import PageTransition from '../components/PageTransition'

const TABS = [
  { key: 'given', label: 'Given', icon: <ArrowUpRight size={14} />, color: '#ef4444' },
  { key: 'taken', label: 'Taken', icon: <ArrowDownLeft size={14} />, color: '#00B870' },
]

export default function Lending() {
  const { phone } = useApp()
  const [tab, setTab] = useState('given')
  const [entries, setEntries] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    person: '', amount: '', reason: '', hasInterest: false,
    interestRate: '', interestType: 'monthly', dueDate: '',
    reminderEnabled: true, reminderFrequency: 'weekly',
  })

  const loadEntries = async () => {
    if (!phone) return
    const data = await api.getLendings(phone)
    setEntries(data || [])
  }

  useEffect(() => { loadEntries() }, [phone])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const calcInterest = (entry) => {
    if (!entry.has_interest || !entry.interest_rate) return 0
    const months = Math.max(1, Math.round((Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    if (entry.interest_type === 'monthly') {
      return Math.round(entry.amount * (entry.interest_rate / 100) * months)
    }
    return Math.round(entry.amount * (entry.interest_rate / 100) * (months / 12))
  }

  const addEntry = async () => {
    if (!form.person.trim() || !form.amount) return showToast('Fill name and amount')
    const entry = {
      user_phone: phone,
      type: tab,
      person_name: form.person.trim(),
      amount: parseFloat(form.amount),
      reason: form.reason.trim() || null,
      has_interest: form.hasInterest,
      interest_rate: form.hasInterest ? parseFloat(form.interestRate) || 0 : 0,
      interest_type: form.interestType,
      due_date: form.dueDate || null,
      reminder_enabled: form.reminderEnabled,
      reminder_frequency: form.reminderFrequency,
      status: 'pending',
    }
    const result = await api.addLending(entry)
    if (!result) return showToast('❌ Error saving')
    setShowAdd(false)
    setForm({ person: '', amount: '', reason: '', hasInterest: false, interestRate: '', interestType: 'monthly', dueDate: '', reminderEnabled: true, reminderFrequency: 'weekly' })
    showToast(tab === 'given' ? '💸 Lending recorded!' : '📥 Borrowing recorded!')
    loadEntries()
  }

  const markSettled = async (id) => {
    await api.settleLending(id)
    showToast('✅ Marked as settled!')
    loadEntries()
  }

  const filtered = entries.filter(e => e.type === tab)
  const pendingTotal = filtered.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const interestTotal = filtered.filter(e => e.status === 'pending').reduce((s, e) => s + calcInterest(e), 0)
  const settledTotal = filtered.filter(e => e.status === 'settled').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        {toast && <div className="toast">{toast}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 22 }}>Lending</h1>
            <p className="body-s text-secondary">Track money given & taken 💰</p>
          </div>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setShowAdd(true)}
            style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <Plus size={16} /> Add
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TABS.map(t => (
            <motion.button key={t.key} whileTap={{ scale: 0.96 }}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none',
                background: tab === t.key ? (t.key === 'given' ? 'rgba(239,68,68,0.1)' : 'rgba(0,184,112,0.1)') : 'var(--bg-secondary)',
                color: tab === t.key ? t.color : 'var(--text-secondary)',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                border: tab === t.key ? `1.5px solid ${t.color}30` : '1px solid transparent',
              }}>
              {t.icon} Money {t.label}
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, padding: '14px 12px', borderRadius: 14, textAlign: 'center',
              background: tab === 'given' ? 'rgba(239,68,68,0.06)' : 'rgba(0,184,112,0.06)',
              border: `1px solid ${tab === 'given' ? 'rgba(239,68,68,0.12)' : 'rgba(0,184,112,0.12)'}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: tab === 'given' ? '#ef4444' : '#00B870' }}>
              ₹{pendingTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>PENDING</div>
          </motion.div>
          {interestTotal > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ flex: 1, padding: '14px 12px', borderRadius: 14, textAlign: 'center', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>₹{interestTotal.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>INTEREST</div>
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ flex: 1, padding: '14px 12px', borderRadius: 14, textAlign: 'center', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>₹{settledTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>SETTLED</div>
          </motion.div>
        </div>

        {/* Entries List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'given' ? '💸' : '📥'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No {tab === 'given' ? 'lendings' : 'borrowings'} yet</div>
            <div style={{ fontSize: 13 }}>Tap + to add one</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((entry, i) => {
              const interest = calcInterest(entry)
              const totalOwed = Number(entry.amount) + interest
              const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && entry.status === 'pending'
              return (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{
                    padding: 16, borderRadius: 14, background: 'var(--bg-card)',
                    border: isOverdue ? '1.5px solid rgba(239,68,68,0.3)' : '1px solid var(--border-light)',
                    opacity: entry.status === 'settled' ? 0.5 : 1,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700,
                        background: tab === 'given' ? 'rgba(239,68,68,0.1)' : 'rgba(0,184,112,0.1)',
                        color: tab === 'given' ? '#ef4444' : '#00B870',
                      }}>
                        {entry.person_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{entry.person_name}</div>
                        {entry.reason && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{entry.reason}</div>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: tab === 'given' ? '#ef4444' : '#00B870' }}>
                        ₹{totalOwed.toLocaleString()}
                      </div>
                      {interest > 0 && (
                        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
                          +₹{interest.toLocaleString()} interest
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {entry.has_interest && (
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Percent size={10} /> {entry.interest_rate}% {entry.interest_type}
                      </span>
                    )}
                    {entry.due_date && (
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: isOverdue ? '#ef4444' : '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={10} /> {new Date(entry.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {isOverdue && ' ⚠️ OVERDUE'}
                      </span>
                    )}
                    {entry.reminder_enabled && entry.status === 'pending' && (
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,176,182,0.1)', color: '#00B0B6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Bell size={10} /> {entry.reminder_frequency} reminder
                      </span>
                    )}
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: entry.status === 'settled' ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)', color: entry.status === 'settled' ? '#22c55e' : '#9ca3af', fontWeight: 700 }}>
                      {entry.status === 'settled' ? '✅ Settled' : '⏳ Pending'}
                    </span>
                  </div>

                  {entry.status === 'pending' && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => markSettled(entry.id)}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1.5px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Check size={14} /> Mark as Settled
                    </motion.button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add Entry Bottom Sheet */}
        <AnimatePresence>
          {showAdd && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowAdd(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                  background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0',
                  padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
                  maxHeight: '85vh', overflowY: 'auto',
                }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-light)', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  {tab === 'given' ? '💸 Money Given' : '📥 Money Taken'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Person Name *</label>
                    <input className="form-input" placeholder="e.g. Rahul, Mom" value={form.person}
                      onChange={e => setForm(p => ({ ...p, person: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Amount (₹) *</label>
                    <input className="form-input" type="number" placeholder="5000" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Reason</label>
                    <input className="form-input" placeholder="e.g. Emergency, Business, Personal" value={form.reason}
                      onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {/* Interest Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Percent size={16} color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>With Interest?</span>
                    </div>
                    <button onClick={() => setForm(p => ({ ...p, hasInterest: !p.hasInterest }))}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                        background: form.hasInterest ? '#00B870' : 'var(--border-light)', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3,
                        left: form.hasInterest ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>

                  {form.hasInterest && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Rate (%)</label>
                        <input className="form-input" type="number" placeholder="2" value={form.interestRate}
                          onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))} style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Type</label>
                        <select className="form-input" value={form.interestType}
                          onChange={e => setForm(p => ({ ...p, interestType: e.target.value }))} style={{ width: '100%' }}>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Due Date (optional)</label>
                    <input className="form-input" type="date" value={form.dueDate}
                      onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {/* Reminder Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={16} color="#00B0B6" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Send Reminders</span>
                    </div>
                    <button onClick={() => setForm(p => ({ ...p, reminderEnabled: !p.reminderEnabled }))}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                        background: form.reminderEnabled ? '#00B870' : 'var(--border-light)', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3,
                        left: form.reminderEnabled ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>

                  {form.reminderEnabled && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Frequency</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['daily', 'weekly', 'monthly'].map(f => (
                          <button key={f} onClick={() => setForm(p => ({ ...p, reminderFrequency: f }))}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: form.reminderFrequency === f ? 'rgba(0,176,182,0.12)' : 'var(--bg-secondary)',
                              color: form.reminderFrequency === f ? '#00B0B6' : 'var(--text-tertiary)',
                              fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                            }}>{f}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.button whileTap={{ scale: 0.96 }} onClick={addEntry}
                    style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: 'var(--gradient-primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                    {tab === 'given' ? '💸 Record Lending' : '📥 Record Borrowing'}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
