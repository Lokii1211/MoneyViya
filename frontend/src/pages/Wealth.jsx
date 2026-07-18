import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, Plus, BarChart3, Shield, X, ChevronRight, Smartphone, Target, Calendar, HandCoins, Users } from 'lucide-react'

/* ─── Premium toggle (matches BankConnect/Reminders) ─── */
function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 40, height: 22, minHeight: 22, minWidth: 40, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? 'var(--primary)' : 'var(--surface3, #2a2a2a)',
        position: 'relative', transition: 'background 0.25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0, boxShadow: on ? '0 0 8px rgba(0,229,176,0.35)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  )
}

const typeConfig = {
  mutual_fund: { emoji: '📈', color: 'var(--primary)', label: 'Mutual Fund' },
  stock: { emoji: '📊', color: 'var(--violet)', label: 'Stock' },
  fd: { emoji: '🏦', color: 'var(--gold)', label: 'Fixed Deposit' },
  ppf: { emoji: '🛡️', color: 'var(--primary)', label: 'PPF' },
  nps: { emoji: '🏛️', color: 'var(--cyan)', label: 'NPS' },
  gold: { emoji: '🥇', color: '#FFB800', label: 'Gold' },
  crypto: { emoji: '₿', color: '#F7931A', label: 'Crypto' },
}

const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'stock', label: 'Stock' },
  { value: 'fd', label: 'Fixed Deposit' },
  { value: 'ppf', label: 'PPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
]

const GOAL_ICONS = [
  { emoji: '🎯', label: 'General' },
  { emoji: '🏠', label: 'Home' },
  { emoji: '🚗', label: 'Car' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '💍', label: 'Wedding' },
  { emoji: '🎓', label: 'Education' },
  { emoji: '🛡️', label: 'Emergency' },
  { emoji: '👶', label: 'Child' },
  { emoji: '💰', label: 'Retirement' },
  { emoji: '📱', label: 'Gadget' },
]


/* ─── Expandable lending/split bucket row — tap to reveal per-person amounts ─── */
function WealthBucketRow({ label, total, sign, color, bg, isOpen, onToggle, people, formatINR }) {
  return (
    <>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', font: 'inherit',
        }}
      >
        <div className="info-icon" style={{ background: bg, color }}><HandCoins size={16} /></div>
        <div className="info-body">
          <div className="info-title" style={{ fontSize: 12 }}>{label}</div>
          <div className="info-value" style={{ fontSize: 13, color }}>{sign}{formatINR(total)}</div>
        </div>
        <ChevronRight size={14} color="var(--text3)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {isOpen && (
        <div style={{ paddingLeft: 44, marginBottom: 6 }}>
          {people.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12.5 }}>
              <span style={{ color: 'var(--text2)' }}>{p.name}</span>
              <span style={{ fontWeight: 700, color }}>{formatINR(p.total)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="skeleton"
        style={{ height: 160, borderRadius: 20, marginBottom: 16 }} />
      <div className="stat-grid">
        {[0, 1].map(i => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }} className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="skeleton" style={{ height: 44, borderRadius: 12, marginBottom: 16 }} />
      {[0, 1, 2].map(i => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.06 }} className="skeleton"
          style={{ height: 68, borderRadius: 16, marginBottom: 8 }} />
      ))}
    </div>
  )
}

export default function Wealth() {
  const { phone } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [investments, setInvestments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('ALL')
  const [goals, setGoals] = useState([])
  const [lendings, setLendings] = useState([])
  const [expandedBucket, setExpandedBucket] = useState(null) // 'lent' | 'borrowed' | 'split' | null

  // Add Investment form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '',
    is_sip: false, sip_amount: '', sip_date: '',
  })

  // Add Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalForm, setGoalForm] = useState({
    name: '', emoji: '🎯', target_amount: '', deadline: '',
  })

  // Add money to goal
  const [addMoneyGoalId, setAddMoneyGoalId] = useState(null)
  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [addMoneySaving, setAddMoneySaving] = useState(false)

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const [invData, txnData, goalData, lendData] = await Promise.all([
        api.getInvestments(phone),
        api.getTransactions(phone),
        api.getGoals(phone),
        api.getLendings(phone),
      ])
      if (invData?.length) setInvestments(invData)
      if (txnData?.length) setTransactions(txnData)
      if (goalData?.length) setGoals(goalData)
      if (lendData?.length) setLendings(lendData)
    } catch (e) { console.error('Wealth load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  /* ─── Add Investment ─── */
  async function handleAddInvestment() {
    if (!addForm.name.trim()) {
      toast.show('Enter investment name', 'warning')
      return
    }
    if (!addForm.invested_amount || Number(addForm.invested_amount) <= 0) {
      toast.show('Enter invested amount', 'warning')
      return
    }
    setAddSaving(true)
    try {
      const data = {
        name: addForm.name.trim(),
        investment_type: addForm.investment_type,
        invested_amount: Number(addForm.invested_amount),
        current_value: Number(addForm.current_value || addForm.invested_amount),
        is_sip: addForm.is_sip,
      }
      if (addForm.is_sip) {
        data.sip_amount = Number(addForm.sip_amount || 0)
        data.sip_date = addForm.sip_date || ''
      }
      const ok = await api.addInvestment(phone, data)
      if (!ok) { toast.show('Failed to add investment', 'error'); setAddSaving(false); return }
      toast.show('Investment added!', 'success')
      setAddForm({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '' })
      setShowAddForm(false)
      loadData()
    } catch (e) {
      console.error('Add investment error:', e)
      toast.show('Failed to add investment', 'error')
    }
    setAddSaving(false)
  }

  /* ─── Add Goal ─── */
  async function handleAddGoal() {
    if (!goalForm.name.trim()) {
      toast.show('Enter goal name', 'warning')
      return
    }
    if (!goalForm.target_amount || Number(goalForm.target_amount) <= 0) {
      toast.show('Enter target amount', 'warning')
      return
    }
    setGoalSaving(true)
    try {
      const ok = await api.addGoal(
        phone,
        goalForm.name.trim(),
        goalForm.emoji,
        Number(goalForm.target_amount),
        goalForm.deadline || null
      )
      if (!ok) { toast.show('Failed to create goal', 'error'); setGoalSaving(false); return }
      toast.show('Goal created!', 'success')
      setGoalForm({ name: '', emoji: '🎯', target_amount: '', deadline: '' })
      setShowGoalForm(false)
      loadData()
    } catch (e) {
      console.error('Add goal error:', e)
      toast.show('Failed to create goal', 'error')
    }
    setGoalSaving(false)
  }

  /* ─── Add Money to Goal ─── */
  async function handleAddMoney(goalId) {
    if (!addMoneyAmount || Number(addMoneyAmount) <= 0) {
      toast.show('Enter amount to add', 'warning')
      return
    }
    setAddMoneySaving(true)
    try {
      const ok = await api.addToGoal(goalId, Number(addMoneyAmount))
      if (!ok) { toast.show('Failed to add money', 'error'); setAddMoneySaving(false); return }
      toast.show(`₹${Number(addMoneyAmount).toLocaleString('en-IN')} added to goal!`, 'success')
      setAddMoneyGoalId(null)
      setAddMoneyAmount('')
      loadData()
    } catch (e) {
      console.error('Add to goal error:', e)
      toast.show('Failed to add money', 'error')
    }
    setAddMoneySaving(false)
  }

  // Portfolio computations
  const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount || 0), 0)
  const currentValue = investments.reduce((s, i) => s + Number(i.current_value || i.invested_amount || 0), 0)
  const returns = currentValue - totalInvested
  const returnPct = totalInvested > 0 ? ((returns / totalInvested) * 100).toFixed(1) : 0

  // Net worth from transactions
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)

  // Group by type
  const grouped = investments.reduce((acc, inv) => {
    const t = inv.investment_type || 'other'
    if (!acc[t]) acc[t] = []
    acc[t].push(inv)
    return acc
  }, {})

  const allocationData = Object.entries(grouped).map(([type, items]) => ({
    type,
    ...(typeConfig[type] || { emoji: '💰', color: 'var(--text2)', label: type }),
    total: items.reduce((s, i) => s + Number(i.current_value || i.invested_amount || 0), 0),
    pct: currentValue > 0 ? Math.round((items.reduce((s, i) => s + Number(i.current_value || i.invested_amount || 0), 0) / currentValue) * 100) : 0,
  }))

  const sipInvestments = investments.filter(i => i.is_sip)
  const totalSIP = sipInvestments.reduce((s, i) => s + Number(i.sip_amount || 0), 0)
  const isEmpty = investments.length === 0 && !loading

  // Lending/Splits live under Wealth too — money lent out is still yours
  // (an asset owed back to you), money borrowed is a liability — so net
  // worth here should reflect both, not just the investment portfolio.
  // Splits write to the same `lending` table (tagged via the reason field),
  // so they're split out here to show as their own bucket rather than
  // getting lumped silently into general lending.
  const pendingLendings = lendings.filter(l => l.status !== 'settled')
  const splitEntries = pendingLendings.filter(l => l.reason?.startsWith('Split:'))
  const plainLendings = pendingLendings.filter(l => !l.reason?.startsWith('Split:'))
  const totalLentOut = plainLendings.filter(l => l.type === 'given').reduce((s, l) => s + Number(l.amount || 0), 0)
  const totalBorrowed = plainLendings.filter(l => l.type === 'taken').reduce((s, l) => s + Number(l.amount || 0), 0)
  const totalSplitOwed = splitEntries.reduce((s, l) => s + Number(l.amount || 0), 0)
  const netWorth = currentValue + totalLentOut - totalBorrowed + totalSplitOwed

  // Per-person breakdown for the expandable buckets below — grouped so one
  // person with multiple entries shows as a single line, not one per entry.
  const groupByPerson = (entries) => {
    const byName = {}
    entries.forEach(l => {
      const name = l.person_name || 'Unknown'
      byName[name] = (byName[name] || 0) + Number(l.amount || 0)
    })
    return Object.entries(byName).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  }
  const lentByPerson = groupByPerson(plainLendings.filter(l => l.type === 'given'))
  const borrowedByPerson = groupByPerson(plainLendings.filter(l => l.type === 'taken'))
  const splitByPerson = groupByPerson(splitEntries)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'sip', label: 'SIPs' },
    { id: 'goals', label: 'Goals' },
  ]

  /* ─── Inline Add Investment Form (shared between sections) ─── */
  const renderAddInvestmentForm = () => (
    <motion.div
      key="add-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div className="card mb-4 wl-add-card">
        <div className="wl-form-hdr">
          <span className="wl-form-title">📈 New Investment</span>
          <button onClick={() => setShowAddForm(false)} className="modal-close"><X size={18} /></button>
        </div>
        <div className="wl-form-body">
          <input type="text" className="input-field" placeholder="Investment name (e.g. Axis Bluechip Fund)"
            value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
          <select className="input-field" value={addForm.investment_type}
            onChange={e => setAddForm({ ...addForm, investment_type: e.target.value })}>
            {INVESTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="bc2-two-col">
            <div style={{ position: 'relative' }}>
              <span className="bc-rupee">₹</span>
              <input type="number" className="input-field" placeholder="Invested amount"
                value={addForm.invested_amount} onChange={e => setAddForm({ ...addForm, invested_amount: e.target.value })}
                style={{ paddingLeft: 26 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <span className="bc-rupee">₹</span>
              <input type="number" className="input-field" placeholder="Current value"
                value={addForm.current_value} onChange={e => setAddForm({ ...addForm, current_value: e.target.value })}
                style={{ paddingLeft: 26 }} />
            </div>
          </div>
          <div className="bc2-sip-row">
            <span className="bc2-sip-label">Is this a SIP?</span>
            <Toggle on={addForm.is_sip} onToggle={() => setAddForm({ ...addForm, is_sip: !addForm.is_sip })} />
          </div>
          <AnimatePresence>
            {addForm.is_sip && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div className="bc2-two-col" style={{ marginTop: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <span className="bc-rupee">₹</span>
                    <input type="number" className="input-field" placeholder="SIP/month"
                      value={addForm.sip_amount} onChange={e => setAddForm({ ...addForm, sip_amount: e.target.value })}
                      style={{ paddingLeft: 26 }} />
                  </div>
                  <input type="number" className="input-field" min="1" max="28" placeholder="SIP date (1-28)"
                    value={addForm.sip_date} onChange={e => setAddForm({ ...addForm, sip_date: e.target.value })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button className="btn-primary full" onClick={handleAddInvestment} disabled={addSaving} style={{ marginTop: 4 }}>
            {addSaving ? 'Saving…' : <><Plus size={14} /> Save Investment</>}
          </button>
        </div>
      </div>
    </motion.div>
  )

  /* ─── Inline Add Goal Form ─── */
  const renderAddGoalForm = () => (
    <motion.div
      key="goal-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div className="card mb-4 wl-add-card" style={{ borderColor: 'var(--cyan)' }}>
        <div className="wl-form-hdr">
          <span className="wl-form-title">🎯 New Savings Goal</span>
          <button onClick={() => setShowGoalForm(false)} className="modal-close"><X size={18} /></button>
        </div>
        <div className="wl-form-body">
          <div>
            <div className="wl-form-label">Choose icon</div>
            <div className="wl-icon-grid">
              {GOAL_ICONS.map(ic => (
                <button key={ic.emoji} className={`wl-icon-btn ${goalForm.emoji === ic.emoji ? 'wl-icon-btn--active' : ''}`}
                  onClick={() => setGoalForm({ ...goalForm, emoji: ic.emoji })}>
                  {ic.emoji}
                </button>
              ))}
            </div>
          </div>
          <input type="text" className="input-field" placeholder="Goal name (e.g. Emergency Fund)"
            value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} />
          <div style={{ position: 'relative' }}>
            <span className="bc-rupee">₹</span>
            <input type="number" className="input-field" placeholder="Target amount"
              value={goalForm.target_amount} onChange={e => setGoalForm({ ...goalForm, target_amount: e.target.value })}
              style={{ paddingLeft: 26 }} />
          </div>
          <div>
            <div className="wl-form-label">Target date (optional)</div>
            <input type="date" className="input-field" value={goalForm.deadline}
              onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })} />
          </div>
          <button className="btn-primary full" onClick={handleAddGoal} disabled={goalSaving} style={{ marginTop: 4 }}>
            {goalSaving ? 'Saving…' : <><Target size={14} /> Create Goal</>}
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Wealth</h2>
          <p className="body-s text-secondary">Grow your money smartly</p>
        </div>
        <button className="pill-btn active" onClick={() => nav('/chat?q=investment+advice')}>Ask Viya</button>
      </div>

      {/* Track Portfolio — action buttons (no broker redirects to chat) */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Track your portfolio</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Add investments manually to track your net worth</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="pill-btn active" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> Add Investment
          </button>
          <button className="pill-btn" onClick={() => nav('/bank-connect')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Smartphone size={14} /> Connect Bank
          </button>
          <button className="pill-btn" onClick={() => nav('/lending')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HandCoins size={14} /> Lending
          </button>
          <button className="pill-btn" onClick={() => nav('/splits')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={14} /> Splits
          </button>
        </div>
      </div>

      {/* Add Investment Form (inline expandable) */}
      <AnimatePresence>
        {showAddForm && renderAddInvestmentForm()}
      </AnimatePresence>

      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Net Worth Hero */}
          <div className="hero-card green mb-4" style={{ padding: 24 }}>
            <div className="hero-orb" />
            <div className="stat-card-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Portfolio</div>
            <div className="currency" style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {formatINR(currentValue)}
            </div>
            <div className="flex items-center gap-2 mb-4" style={{ fontSize: 14, color: '#fff' }}>
              {returns >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span style={{ fontWeight: 600 }}>{returns >= 0 ? '+' : ''}{formatINR(returns)}</span>
              <span className="pill-btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', fontSize: 12 }}>
                {returns >= 0 ? '+' : ''}{returnPct}%
              </span>
            </div>
            <div className="flex gap-5">
              <div>
                <div className="stat-card-label" style={{ opacity: 0.65 }}>Invested</div>
                <div className="currency" style={{ fontWeight: 600, fontSize: 15 }}>{formatINR(totalInvested)}</div>
              </div>
              <div>
                <div className="stat-card-label" style={{ opacity: 0.65 }}>Active SIPs</div>
                <div className="currency" style={{ fontWeight: 600, fontSize: 15 }}>{sipInvestments.length}</div>
              </div>
            </div>
          </div>

          {/* Total Savings — portfolio plus lending, since money lent out
              (green) is still yours and owed back, money borrowed (red) is
              a liability, and Splits money owed to you (green, same table
              tagged separately) is the same thing under another name.
              Tapping a bucket expands it in place to show each person. */}
          {(totalLentOut > 0 || totalBorrowed > 0 || totalSplitOwed > 0) && (
            <div className="card mb-4" style={{ padding: 16 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Total Savings (Portfolio + Lending)</span>
              </div>
              <div className="currency" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{formatINR(netWorth)}</div>

              <div className="info-row" style={{ padding: '8px 0' }}>
                <div className="info-icon" style={{ background: 'var(--primary-dim, rgba(0,229,176,0.1))', color: 'var(--primary)' }}><PiggyBank size={16} /></div>
                <div className="info-body">
                  <div className="info-title" style={{ fontSize: 12 }}>Portfolio</div>
                  <div className="info-value" style={{ fontSize: 13 }}>{formatINR(currentValue)}</div>
                </div>
              </div>

              {totalLentOut > 0 && (
                <WealthBucketRow
                  label="Lent Out" total={totalLentOut} sign="+" color="var(--viya-success, #00E87E)" bg="rgba(0,232,126,0.1)"
                  isOpen={expandedBucket === 'lent'} onToggle={() => setExpandedBucket(b => b === 'lent' ? null : 'lent')}
                  people={lentByPerson} formatINR={formatINR}
                />
              )}
              {totalBorrowed > 0 && (
                <WealthBucketRow
                  label="Borrowed" total={totalBorrowed} sign="-" color="var(--coral-500, #FF5040)" bg="rgba(255,80,64,0.1)"
                  isOpen={expandedBucket === 'borrowed'} onToggle={() => setExpandedBucket(b => b === 'borrowed' ? null : 'borrowed')}
                  people={borrowedByPerson} formatINR={formatINR}
                />
              )}
              {totalSplitOwed > 0 && (
                <WealthBucketRow
                  label="Splits Owed to You" total={totalSplitOwed} sign="+" color="var(--viya-success, #00E87E)" bg="rgba(0,232,126,0.1)"
                  isOpen={expandedBucket === 'split'} onToggle={() => setExpandedBucket(b => b === 'split' ? null : 'split')}
                  people={splitByPerson} formatINR={formatINR}
                />
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="stat-grid">
            <div className="stat-card" onClick={() => setTab('sip')}>
              <div className="stat-label">Monthly SIPs</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{formatINR(totalSIP)}</div>
              <div className="stat-sub">{sipInvestments.length} active</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Holdings</div>
              <div className="stat-value" style={{ color: 'var(--gold)' }}>{investments.length}</div>
              <div className="stat-sub">Total assets</div>
            </div>
          </div>

          {isEmpty && (
            <div className="empty-state-card">
              <div className="empty-emoji">📈</div>
              <h3>No investments tracked yet</h3>
              <p>Add your first investment using the form above to start tracking your portfolio.</p>
              <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ marginTop: 4 }}>
                <Plus size={14} /> Add Your First Investment
              </button>
            </div>
          )}

          {!isEmpty && (
            <>
              {/* Tab Bar */}
              <div className="tab-bar">
                {tabs.map(t => (
                  <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                    onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* === OVERVIEW === */}
                {tab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* Time Range Filter */}
                    <div className="pill-bar justify-center">
                      {['30D', '3M', '6M', '1Y', 'ALL'].map(r => (
                        <button key={r} className={`pill-btn ${timeRange === r ? 'active' : ''}`}
                          onClick={() => setTimeRange(r)}>{r}</button>
                      ))}
                    </div>

                    {/* Asset Allocation */}
                    <div className="card mb-4" style={{ padding: 20 }}>
                      <div className="section-head">
                        <h3>Asset Allocation</h3>
                      </div>
                      {/* Allocation bar */}
                      <div className="progress-bar flex gap-1 mb-4" style={{ height: 12 }}>
                        {allocationData.map((a, i) => (
                          <div key={i} style={{ width: `${a.pct}%`, height: '100%', background: a.color, transition: 'width 0.6s var(--ease)' }} />
                        ))}
                      </div>
                      {/* Allocation rows */}
                      {allocationData.map((a, i) => (
                        <div key={i} className="info-row" style={{ border: 'none', padding: '8px 0', background: 'none' }}>
                          <span style={{ fontSize: 20 }}>{a.emoji}</span>
                          <div className="info-body">
                            <div className="info-title">{a.label}</div>
                            <div className="info-sub">{a.pct}% of portfolio</div>
                          </div>
                          <span className="info-value">{formatINR(a.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Viya Insight */}
                    <div className="insight-card" onClick={() => nav('/chat?q=investment+analysis')}>
                      <BarChart3 size={16} className="insight-icon" />
                      <span className="insight-text">
                        {returnPct > 0
                          ? `Your portfolio is up ${returnPct}%. Ask Viya for rebalancing advice.`
                          : 'Ask Viya for personalized investment recommendations.'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* === HOLDINGS === */}
                {tab === 'holdings' && (
                  <motion.div key="holdings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {Object.entries(grouped).map(([type, items]) => {
                      const cfg = typeConfig[type] || { emoji: '💰', color: 'var(--text2)', label: type }
                      return (
                        <div key={type} className="section mb-4">
                          <div className="section-head">
                            <h3 style={{ fontSize: 13, color: cfg.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{cfg.emoji}</span> {cfg.label}s
                            </h3>
                          </div>
                          {items.map((inv) => {
                            const retPct = Number(inv.return_pct || 0)
                            return (
                              <div key={inv.id} className="info-row">
                                <div className="info-icon" style={{ background: cfg.color + '15', color: cfg.color, fontSize: 18 }}>
                                  {cfg.emoji}
                                </div>
                                <div className="info-body">
                                  <div className="info-title" style={{ fontSize: 13 }}>{inv.name}</div>
                                  <div className="info-sub">
                                    Invested: {formatINR(inv.invested_amount)}
                                    {inv.broker && ` · ${inv.broker}`}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div className="info-value">{formatINR(inv.current_value || inv.invested_amount)}</div>
                                  <div className={`flex items-center gap-1 ${retPct >= 0 ? 'currency-positive' : 'currency-negative'}`}
                                    style={{ fontSize: 12, fontWeight: 600, justifyContent: 'flex-end' }}>
                                    {retPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                    {retPct >= 0 ? '+' : ''}{retPct}%
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}

                    <button className="btn-primary full mt-2" onClick={() => setShowAddForm(true)}>
                      <Plus size={16} /> Add Investment
                    </button>
                    <AnimatePresence>
                      {showAddForm && renderAddInvestmentForm()}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* === SIPs === */}
                {tab === 'sip' && (
                  <motion.div key="sip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* SIP Summary */}
                    <div className="card text-center mb-4" style={{ padding: 20 }}>
                      <div className="stat-label">Monthly SIP Investment</div>
                      <div className="currency currency-positive" style={{ fontSize: 30, fontWeight: 800, margin: '4px 0' }}>
                        {formatINR(totalSIP)}
                      </div>
                      <div className="body-s text-secondary">{formatINR(totalSIP * 12)}/year</div>
                    </div>

                    {sipInvestments.length === 0 && (
                      <div className="empty-state-card">
                        <div className="empty-emoji">📈</div>
                        <h3>No SIPs tracked</h3>
                        <p>Add a SIP investment using the form below to start tracking your systematic investments.</p>
                        <button className="btn-primary" onClick={() => { setAddForm({ ...addForm, is_sip: true }); setShowAddForm(true) }}
                          style={{ marginTop: 4 }}>
                          <Plus size={14} /> Add Your First SIP
                        </button>
                      </div>
                    )}

                    {sipInvestments.map(inv => (
                      <div key={inv.id} className="info-row">
                        <div className="info-icon green">📈</div>
                        <div className="info-body">
                          <div className="info-title">{inv.name}</div>
                          <div className="info-sub">{inv.broker || 'N/A'} · Active SIP</div>
                        </div>
                        <div>
                          <div className="info-value green">{formatINR(inv.sip_amount || 0)}/mo</div>
                          <div className="text-success" style={{ fontSize: 11, fontWeight: 600 }}>+{inv.return_pct || 0}%</div>
                        </div>
                      </div>
                    ))}

                    <button className="btn-primary full mt-2" onClick={() => { setAddForm({ ...addForm, is_sip: true }); setShowAddForm(true) }}>
                      <Plus size={16} /> Add New SIP
                    </button>
                    <AnimatePresence>
                      {showAddForm && renderAddInvestmentForm()}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* === GOALS === */}
                {tab === 'goals' && (
                  <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {goals.length === 0 && !showGoalForm && (
                      <div className="empty-state-card">
                        <div className="empty-emoji">🎯</div>
                        <h3>No savings goals yet</h3>
                        <p>Create your first savings goal to start building towards your financial dreams.</p>
                        <button className="btn-primary" onClick={() => setShowGoalForm(true)} style={{ marginTop: 4 }}>
                          <Plus size={14} /> Create Your First Goal
                        </button>
                      </div>
                    )}

                    {/* Add Goal Form */}
                    <AnimatePresence>
                      {showGoalForm && renderAddGoalForm()}
                    </AnimatePresence>

                    {goals.map((g, i) => {
                      const target = Number(g.target_amount || 0)
                      const saved = Number(g.current_amount || 0)
                      const pct = target > 0 ? Math.round((saved / target) * 100) : 0
                      const deadline = g.deadline ? new Date(g.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''
                      const colors = ['var(--cyan)', 'var(--violet)', 'var(--orange)', 'var(--primary)', 'var(--gold)']
                      const color = colors[i % colors.length]
                      const isAddingMoney = addMoneyGoalId === g.id
                      return (
                        <div key={g.id || i} className="card mb-2" style={{ padding: 16 }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 24 }}>{g.emoji || g.icon || '🎯'}</span>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
                                {deadline && <div className="body-s text-tertiary">Target: {deadline}</div>}
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color }}>{pct}%</span>
                          </div>
                          <div className="progress-bar mb-2" style={{ height: 8 }}>
                            <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                          </div>
                          <div className="flex justify-between body-s">
                            <span className="text-secondary">{formatINR(saved)} saved</span>
                            <span style={{ fontWeight: 600 }}>{formatINR(target)} goal</span>
                          </div>

                          {/* Add Money inline */}
                          <div className="flex gap-2 mt-2">
                            <button className="pill-btn active"
                              onClick={() => { setAddMoneyGoalId(isAddingMoney ? null : g.id); setAddMoneyAmount('') }}>
                              {isAddingMoney ? 'Cancel' : '+ Add Money'}
                            </button>
                          </div>

                          <AnimatePresence>
                            {isAddingMoney && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                  <div style={{ flex: 1, position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>₹</span>
                                    <input
                                      type="number"
                                      placeholder="Amount to add"
                                      value={addMoneyAmount}
                                      onChange={e => setAddMoneyAmount(e.target.value)}
                                      className="input-field"
                                      style={{ paddingLeft: 28 }}
                                      autoFocus
                                    />
                                  </div>
                                  <button className="btn-primary" onClick={() => handleAddMoney(g.id)} disabled={addMoneySaving}
                                    style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                                    {addMoneySaving ? '...' : 'Add'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}

                    {(goals.length > 0 || showGoalForm) && (
                      <button className="btn-primary full" onClick={() => setShowGoalForm(!showGoalForm)} style={{ marginTop: 8 }}>
                        <Plus size={16} /> Create New Goal
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </>
      )}
    </div>
  )
}
