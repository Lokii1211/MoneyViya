// Lending — Track money given/taken with interest and reminders
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
import { Plus, ArrowUpRight, ArrowDownLeft, Clock, Bell, Percent, User, Calendar, Check, X, Users } from 'lucide-react'
import PageTransition from '../components/PageTransition'

/* §6.2 Brand-compliant colors:
   Given (outflow) = cosmos-400 (#7743FF) — NOT red (triggers shame)
   Taken (inflow)  = emerald-500 (#00E87E) — positive/money color
   Interest        = amber-500 (#FF9800) — warning/attention
   Settled         = teal-500 (#00E5B0) — brand primary success
   Overdue         = coral-500 (#FF5040) — genuine warning state (allowed)
*/
const TABS = [
  { key: 'given', label: 'Given', icon: <ArrowUpRight size={14} />, color: 'var(--cosmos-400)', hex: '#7743FF' },
  { key: 'taken', label: 'Taken', icon: <ArrowDownLeft size={14} />, color: 'var(--emerald-500)', hex: '#00E87E' },
]

export default function Lending() {
  const { phone } = useApp()
  const [tab, setTab] = useState('given')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [contacts, setContacts] = useState([]) // real friends + family, [{name, phone}]
  const [form, setForm] = useState({
    person: '', amount: '', reason: '', hasInterest: false,
    interestRate: '', interestType: 'monthly', dueDate: '',
    reminderEnabled: true, reminderFrequency: 'weekly',
  })

  const loadEntries = async () => {
    if (!phone) return
    const data = await api.getLendings(phone)
    setEntries(data || [])
    setLoading(false)
  }

  const loadContacts = async () => {
    if (!phone) return
    try {
      const [sent, received] = await Promise.all([
        api.getFamilyConnections(phone),
        api.getFamilyInvitesReceived(phone),
      ])
      const accepted = [
        ...(sent || []).filter(c => c.status === 'accepted'),
        ...(received || []).filter(c => c.status === 'accepted'),
      ]
      const withNames = await Promise.all(accepted.map(async c => {
        const otherPhone = c.member_phone === phone ? c.owner_phone : c.member_phone
        const u = await api.getUser(otherPhone)
        return { name: u?.name || otherPhone, phone: otherPhone, relation: c.relation }
      }))
      // De-dupe (a connection can appear from both directions)
      const seen = new Set()
      setContacts(withNames.filter(c => (seen.has(c.phone) ? false : (seen.add(c.phone), true))))
    } catch { setContacts([]) }
  }

  useEffect(() => { loadEntries(); loadContacts() }, [phone])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Interest accrues from the last time it was settled, not always from
  // when the loan was created — otherwise settling interest today and
  // asking again next month would double-count the months already paid.
  const calcInterest = (entry) => {
    if (!entry.has_interest || !entry.interest_rate) return 0
    const since = entry.last_interest_settled_at || entry.created_at
    const months = Math.max(1, Math.round((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24 * 30)))
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

  // Record just this period's interest — the loan stays open, and the
  // interest clock resets so next time only the new period is charged.
  const settleInterestOnly = async (entry) => {
    const amount = calcInterest(entry)
    if (amount <= 0) return
    const now = new Date().toISOString()
    await api.updateLending(entry.id, {
      interest_paid_total: Number(entry.interest_paid_total || 0) + amount,
      last_interest_settled_at: now,
    })
    // Interest is real cash moving that nothing else tracks — log it so
    // Budget/Reports reflect it too.
    if (entry.type === 'given') await api.addIncome(phone, amount, `Interest from ${entry.person_name}`)
    else await api.addExpense(phone, amount, '💸 Interest', `Interest paid to ${entry.person_name}`)
    showToast(`✅ ₹${amount.toLocaleString()} interest settled`)
    loadEntries()
  }

  // Settle everything owed right now (principal + any interest accrued
  // since the last interest settlement) and close the entry.
  const settleFull = async (entry) => {
    const interest = calcInterest(entry)
    const now = new Date().toISOString()
    if (interest > 0) {
      if (entry.type === 'given') await api.addIncome(phone, interest, `Interest from ${entry.person_name}`)
      else await api.addExpense(phone, interest, '💸 Interest', `Interest paid to ${entry.person_name}`)
    }
    await api.updateLending(entry.id, {
      status: 'settled', settled_at: now,
      interest_paid_total: Number(entry.interest_paid_total || 0) + interest,
    })
    showToast('✅ Fully settled!')
    loadEntries()
  }

  const tabColor = tab === 'given' ? 'var(--cosmos-400)' : 'var(--emerald-500)'
  const tabHex = tab === 'given' ? '#7743FF' : '#00E87E'
  const tabDim = tab === 'given' ? 'var(--cosmos-50)' : 'var(--emerald-50)'

  const filtered = entries.filter(e => e.type === tab)
  const pendingTotal = filtered.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const interestTotal = filtered.filter(e => e.status === 'pending').reduce((s, e) => s + calcInterest(e), 0)
  const settledTotal = filtered.filter(e => e.status === 'settled').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <PageTransition>
      <div className="page page-padded">
        {toast && <div className="toast">{toast}</div>}

        <div className="page-header-lending">
          <div>
            <h1>Lending</h1>
            <p className="body-s text-secondary">Track money given & taken 💰</p>
          </div>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setShowAdd(true)}
            className="btn-add-gradient">
            <Plus size={16} /> Add
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="lending-tab-bar">
          {TABS.map(t => (
            <motion.button key={t.key} whileTap={{ scale: 0.96 }}
              onClick={() => setTab(t.key)}
              className="lending-tab-btn"
              style={{
                background: tab === t.key ? (t.key === 'given' ? 'var(--cosmos-50)' : 'var(--emerald-50)') : 'var(--bg-secondary)',
                color: tab === t.key ? t.hex : 'var(--text-secondary)',
                border: tab === t.key ? `1.5px solid ${t.hex}30` : '1px solid transparent',
              }}>
              {t.icon} Money {t.label}
            </motion.button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="skeleton-row">
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </motion.div>
            {[0, 1, 2].map(i => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }} className="skeleton skeleton-item" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stat-summary-row">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="stat-summary-card"
                style={{ background: tabDim, border: `1px solid ${tabHex}18` }}>
                <div className="stat-summary-value" style={{ color: tabColor }}>
                  ₹{pendingTotal.toLocaleString()}
                </div>
                <div className="stat-summary-label">PENDING</div>
              </motion.div>
              {interestTotal > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="stat-summary-card"
                  style={{ background: 'var(--amber-50)', border: '1px solid rgba(255,152,0,0.12)' }}>
                  <div className="stat-summary-value" style={{ color: 'var(--amber-500)' }}>₹{interestTotal.toLocaleString()}</div>
                  <div className="stat-summary-label">INTEREST</div>
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="stat-summary-card"
                style={{ background: 'var(--viya-success-light)', border: '1px solid rgba(0,232,126,0.12)' }}>
                <div className="stat-summary-value text-success">₹{settledTotal.toLocaleString()}</div>
                <div className="stat-summary-label">SETTLED</div>
              </motion.div>
            </div>

            {/* Entries List */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <h3>No {tab === 'given' ? 'lendings' : 'borrowings'} yet</h3>
                <p>{tab === 'given' ? 'Record money you\'ve lent to others' : 'Track money you\'ve borrowed'}</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}>
                  <Plus size={16} /> Add {tab === 'given' ? 'Lending' : 'Borrowing'}
                </button>
              </div>
            ) : (
              <div className="lending-list">
                {filtered.map((entry, i) => {
                  const interest = calcInterest(entry)
                  const totalOwed = Number(entry.amount) + interest
                  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && entry.status === 'pending'
                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`lending-card${isOverdue ? ' overdue' : ''}${entry.status === 'settled' ? ' settled' : ''}`}>
                      <div className="lending-card-top">
                        <div className="lending-card-person">
                          <div className="lending-card-avatar" style={{ background: tabDim, color: tabColor }}>
                            {entry.person_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="lending-card-name">{entry.person_name}</div>
                            {entry.reason && <div className="lending-card-reason">{entry.reason}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="lending-card-amount" style={{ color: tabColor }}>
                            ₹{totalOwed.toLocaleString()}
                          </div>
                          {interest > 0 && (
                            <div className="lending-card-interest">
                              +₹{interest.toLocaleString()} interest
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lending-card-tags">
                        {entry.has_interest && (
                          <span className="lending-tag interest">
                            <Percent size={10} /> {entry.interest_rate}% {entry.interest_type}
                          </span>
                        )}
                        {entry.due_date && (
                          <span className={`lending-tag ${isOverdue ? 'overdue' : 'due'}`}>
                            <Calendar size={10} /> {new Date(entry.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {isOverdue && ' ⚠️ OVERDUE'}
                          </span>
                        )}
                        {entry.reminder_enabled && entry.status === 'pending' && (
                          <span className="lending-tag reminder">
                            <Bell size={10} /> {entry.reminder_frequency} reminder
                          </span>
                        )}
                        <span className={`lending-tag ${entry.status === 'settled' ? 'settled' : 'pending'}`}>
                          {entry.status === 'settled' ? '✅ Settled' : '⏳ Pending'}
                        </span>
                      </div>

                      {Number(entry.interest_paid_total) > 0 && (
                        <div className="lending-interest-paid">₹{Number(entry.interest_paid_total).toLocaleString()} interest settled so far</div>
                      )}

                      {entry.status === 'pending' && (
                        entry.has_interest ? (
                          <div className="lending-settle-row">
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => settleInterestOnly(entry)}
                              disabled={interest <= 0}
                              className="btn-settle-interest">
                              <Percent size={13} /> Settle Interest{interest > 0 ? ` (₹${interest.toLocaleString()})` : ''}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => settleFull(entry)}
                              className="btn-settle">
                              <Check size={14} /> Settle Full (₹{totalOwed.toLocaleString()})
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => markSettled(entry.id)}
                            className="btn-settle">
                            <Check size={14} /> Mark as Settled
                          </motion.button>
                        )
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Add Entry Bottom Sheet */}
        <AnimatePresence>
          {showAdd && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowAdd(false)}
                className="sheet-overlay-lending" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="sheet-lending">
                <div className="sheet-handle" />
                <h3 className="sheet-title">
                  {tab === 'given' ? '💸 Money Given' : '📥 Money Taken'}
                </h3>

                <div className="sheet-form">
                  <div>
                    <label className="form-label">Person Name *</label>
                    {contacts.length > 0 && (
                      <div className="lending-contact-chips">
                        {contacts.map(c => (
                          <button
                            key={c.phone}
                            type="button"
                            className={`lending-contact-chip${form.person === c.name ? ' active' : ''}`}
                            onClick={() => setForm(p => ({ ...p, person: c.name }))}
                          >
                            {c.name}{c.relation ? ` · ${c.relation}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                    <input className="form-input" placeholder="e.g. Rahul, Mom — or pick a friend above" value={form.person}
                      onChange={e => setForm(p => ({ ...p, person: e.target.value }))} />
                    {contacts.length === 0 && (
                      <p className="lending-contact-hint">Add friends/family to pick them here instead of typing names each time.</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Amount (₹) *</label>
                    <input className="form-input" type="number" placeholder="5000" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>

                  <div>
                    <label className="form-label">Reason</label>
                    <input className="form-input" placeholder="e.g. Emergency, Business, Personal" value={form.reason}
                      onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                  </div>

                  {/* Interest Toggle */}
                  <div className="toggle-row">
                    <div className="toggle-row-left">
                      <Percent size={16} color="var(--amber-500)" />
                      <span className="toggle-row-label">With Interest?</span>
                    </div>
                    <button onClick={() => setForm(p => ({ ...p, hasInterest: !p.hasInterest, reminderFrequency: !p.hasInterest ? p.interestType : p.reminderFrequency }))}
                      className={`toggle-switch ${form.hasInterest ? 'on' : 'off'}`}>
                      <div className={`toggle-dot ${form.hasInterest ? 'on' : 'off'}`} />
                    </button>
                  </div>

                  {form.hasInterest && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      className="interest-row">
                      <div className="interest-col">
                        <label className="form-label-sm">Rate (%)</label>
                        <input className="form-input" type="number" placeholder="2" value={form.interestRate}
                          onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))} />
                      </div>
                      <div className="interest-col">
                        <label className="form-label-sm">Type</label>
                        <select className="form-input" value={form.interestType}
                          onChange={e => setForm(p => ({ ...p, interestType: e.target.value, reminderFrequency: e.target.value }))}>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="form-label">Due Date {form.hasInterest && form.interestType === 'monthly' ? '— collection day' : '(optional)'}</label>
                    <input className="form-input" type="date" value={form.dueDate}
                      onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                    {form.hasInterest && form.interestType === 'monthly' && (
                      <p className="lending-contact-hint">Viya will remind you every month on this date to collect the interest.</p>
                    )}
                  </div>

                  {/* Reminder Toggle */}
                  <div className="toggle-row">
                    <div className="toggle-row-left">
                      <Bell size={16} color="var(--viya-primary-500)" />
                      <span className="toggle-row-label">Send Reminders</span>
                    </div>
                    <button onClick={() => setForm(p => ({ ...p, reminderEnabled: !p.reminderEnabled }))}
                      className={`toggle-switch ${form.reminderEnabled ? 'on' : 'off'}`}>
                      <div className={`toggle-dot ${form.reminderEnabled ? 'on' : 'off'}`} />
                    </button>
                  </div>

                  {form.reminderEnabled && (
                    <div>
                      <label className="form-label-sm">Frequency</label>
                      <div className="freq-row">
                        {['daily', 'weekly', 'monthly'].map(f => (
                          <button key={f} onClick={() => setForm(p => ({ ...p, reminderFrequency: f }))}
                            className={`freq-btn ${form.reminderFrequency === f ? 'active' : 'inactive'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.button whileTap={{ scale: 0.96 }} onClick={addEntry}
                    className="btn-submit-gradient">
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
