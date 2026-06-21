import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Zap, Wifi, Phone, Home, ShieldCheck, Calendar, Plus, TrendingUp, Trash2 } from 'lucide-react'

const BILL_ICONS = {
  credit_card: { icon: <CreditCard size={18} />, color: '#E91E63', emoji: '💳' },
  electricity: { icon: <Zap size={18} />, color: '#FF9800', emoji: '⚡' },
  internet: { icon: <Wifi size={18} />, color: '#0091FF', emoji: '🌐' },
  phone: { icon: <Phone size={18} />, color: '#4CAF50', emoji: '📱' },
  rent: { icon: <Home size={18} />, color: '#9C27B0', emoji: '🏠' },
  insurance: { icon: <ShieldCheck size={18} />, color: '#00BCD4', emoji: '🛡️' },
  emi: { icon: <TrendingUp size={18} />, color: '#5514FF', emoji: '🏦' },
  subscription: { icon: <Calendar size={18} />, color: '#6422CC', emoji: '📺' },
}

function enrichBill(bill) {
  const dueDate = bill.due_date ? new Date(bill.due_date) : null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft = dueDate ? Math.ceil((dueDate - today) / 86400000) : 999
  const status = daysLeft < 0 && bill.status !== 'paid' ? 'overdue' : bill.status
  return { ...bill, _daysLeft: daysLeft, status }
}

function getUrgencyClass(bill) {
  if (bill.status === 'paid') return 'paid'
  if (bill.status === 'overdue' || bill._daysLeft < 0) return 'overdue'
  if (bill._daysLeft <= 1) return 'due-now'
  if (bill._daysLeft <= 7) return 'upcoming'
  return 'upcoming'
}

function getUrgencyStyle(bill) {
  if (bill.status === 'paid') return { borderLeft: '4px solid #10B981', opacity: 0.75 }
  if (bill.status === 'overdue' || bill._daysLeft < 0) return { borderLeft: '4px solid #FF6B6B', background: 'rgba(255,107,107,0.04)' }
  if (bill._daysLeft <= 1) return { borderLeft: '4px solid #F59E0B', background: 'rgba(245,158,11,0.04)' }
  if (bill._daysLeft <= 7) return { borderLeft: '4px solid #10B981' }
  return {}
}

function getUrgencyLabel(bill) {
  if (bill.status === 'paid') return { emoji: '✅', text: 'Paid', color: '#10B981' }
  if (bill.status === 'overdue' || bill._daysLeft < 0) return { emoji: '🔴', text: `Overdue by ${Math.abs(bill._daysLeft)}d`, color: '#FF6B6B' }
  if (bill._daysLeft === 0) return { emoji: '⚠️', text: 'Due Today', color: '#F59E0B' }
  if (bill._daysLeft === 1) return { emoji: '⚠️', text: 'Due Tomorrow', color: '#F59E0B' }
  if (bill._daysLeft <= 7) return { emoji: '🟢', text: `Due in ${bill._daysLeft}d`, color: '#10B981' }
  return { emoji: '', text: `Due in ${bill._daysLeft}d`, color: 'var(--text2)' }
}

function LoadingSkeleton() {
  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="skeleton"
        style={{ height: 120, borderRadius: 20, marginBottom: 16 }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="skeleton" style={{ height: 44, borderRadius: 12, marginBottom: 16 }} />
      {[0, 1, 2].map(i => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.06 }} className="skeleton"
          style={{ height: 68, borderRadius: 16, marginBottom: 8 }} />
      ))}
    </div>
  )
}

export default function Bills() {
  const { phone } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', due_date: '', bill_type: 'credit_card', auto_debit: false })

  const loadBills = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const data = await api.getBills(phone)
      if (data?.length) setBills(data.map(enrichBill))
      else setBills([])
    } catch (e) { console.error('Bills load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadBills() }, [loadBills])

  const handleMarkPaid = async (bill) => {
    try {
      await api.markBillPaid(bill.id)
      setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b))
      toast.show(`${bill.name} marked as paid!`, 'success')
    } catch { toast.show('Failed to mark paid', 'error') }
  }

  const handleDelete = async (bill) => {
    try {
      await api.deleteBill(bill.id)
      setBills(prev => prev.filter(b => b.id !== bill.id))
      toast.show(`${bill.name} deleted`, 'info')
    } catch { toast.show('Failed to delete bill', 'error') }
  }

  const handleAdd = async () => {
    if (!form.name || !form.amount) return toast.show('Name and amount are required', 'error')
    try {
      await api.addBill(phone, {
        name: form.name,
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        bill_type: form.bill_type,
        auto_debit: form.auto_debit,
        status: 'pending',
      })
      toast.show(`${form.name} added!`, 'success')
      setForm({ name: '', amount: '', due_date: '', bill_type: 'credit_card', auto_debit: false })
      setShowForm(false)
      loadBills()
    } catch { toast.show('Failed to add bill', 'error') }
  }

  // Derived data
  const filtered = bills.filter(b => {
    if (filter === 'all') return true
    if (filter === 'overdue') return b.status === 'overdue'
    if (filter === 'upcoming') return b.status === 'pending' && b._daysLeft >= 0
    if (filter === 'paid') return b.status === 'paid'
    return true
  })

  const totalPending = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + Number(b.amount || 0), 0)
  const overdueCount = bills.filter(b => b.status === 'overdue').length
  const upcomingCount = bills.filter(b => b.status === 'pending' && b._daysLeft >= 0).length
  const isEmpty = bills.length === 0 && !loading

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'paid', label: 'Paid' },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22 }}>Bills & Payments</h2>
          <p className="body-s text-secondary">Never miss a due date</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}
          style={{ width: 40, height: 40, borderRadius: '50%', padding: 0 }}>
          <Plus size={18} />
        </button>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Summary Card */}
          <div className="hero-card night" style={{ marginBottom: 16, padding: 20 }}>
            <div className="stat-card-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Pending</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 32, color: '#fff', marginBottom: 8 }}>
              {formatINR(totalPending)}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {overdueCount > 0 && <span style={{ fontWeight: 600, color: '#FF6B6B' }}>🔴 {overdueCount} overdue</span>}
              <span>🟢 {upcomingCount} upcoming</span>
              {bills.filter(b => b.status === 'paid').length > 0 && (
                <span style={{ color: '#A7F3D0' }}>✅ {bills.filter(b => b.status === 'paid').length} paid</span>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="pill-bar">
            {filters.map(f => (
              <button key={f.id} className={`pill-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>

          {/* Add Bill Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div key="form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 16 }}>
                <div className="entry-form">
                  <div className="form-group">
                    <label>Bill Name</label>
                    <input className="form-input" placeholder="e.g. Credit Card" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input className="form-input" type="number" placeholder="e.g. 5000"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input className="form-input" type="date" value={form.due_date}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <div className="cat-grid">
                      {Object.entries(BILL_ICONS).map(([key, cfg]) => (
                        <button key={key} className={`cat-chip ${form.bill_type === key ? 'active' : ''}`}
                          onClick={() => setForm(f => ({ ...f, bill_type: key }))}>
                          {cfg.emoji} {cfg.emoji === '📺' ? 'Sub' : key.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ flex: 1, margin: 0 }}>Auto-pay enabled</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, auto_debit: !f.auto_debit }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: form.auto_debit ? '#10B981' : 'var(--surface2)',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                      <span style={{
                        position: 'absolute', top: 2, left: form.auto_debit ? 22 : 2,
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleAdd}>Add Bill</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {isEmpty && (
            <div className="empty-state-card">
              <div className="empty-emoji">📋</div>
              <h3>No bills tracked yet</h3>
              <p>Tap + above to add your first bill or recurring payment</p>
            </div>
          )}

          {/* Bill List */}
          {filtered.map((bill, i) => {
            const cfg = BILL_ICONS[bill.bill_type] || BILL_ICONS.credit_card
            const urgency = getUrgencyClass(bill)
            const urgencyStyle = getUrgencyStyle(bill)
            const urgencyLabel = getUrgencyLabel(bill)
            const isPaid = bill.status === 'paid'
            return (
              <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <div className="info-row" style={{ ...urgencyStyle, borderRadius: 14, marginBottom: 6, paddingLeft: 12 }}>
                  <div className={`info-icon ${urgency === 'overdue' ? 'red' : urgency === 'due-now' ? 'gold' : 'green'}`}>{cfg.icon}</div>
                  <div className="info-body">
                    <div className="info-title" style={isPaid ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                      {bill.name}
                    </div>
                    <div className="info-sub" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: urgencyLabel.color, fontWeight: 600 }}>
                        {urgencyLabel.emoji} {urgencyLabel.text}
                      </span>
                      {bill.due_date && !isPaid && (
                        <span style={{ color: 'var(--text3)', fontSize: 11 }}>
                          · {new Date(bill.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {bill.auto_debit && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          Auto-pay ✅
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`info-value`} style={{
                      fontWeight: 700,
                      color: isPaid ? '#10B981' : urgency === 'overdue' ? '#FF6B6B' : urgency === 'due-now' ? '#F59E0B' : 'var(--text1)',
                      textDecoration: isPaid ? 'line-through' : 'none',
                    }}>
                      {formatINR(bill.amount)}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!isPaid && (
                        <button className="pill-btn active" onClick={() => handleMarkPaid(bill)}
                          style={{ padding: '3px 10px', fontSize: 10, minHeight: 'auto' }}>
                          {urgency === 'overdue' ? 'Pay Now' : 'Mark Paid'}
                        </button>
                      )}
                      <button className="btn-ghost" onClick={() => handleDelete(bill)}
                        style={{ minHeight: 'auto', padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {filtered.length === 0 && !isEmpty && (
            <div className="empty-state-card" style={{ padding: 32 }}>
              <div className="empty-emoji">📭</div>
              <h3>No {filter} bills</h3>
              <p>Switch filters to see other bills</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
