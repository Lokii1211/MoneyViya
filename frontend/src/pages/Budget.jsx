import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingDown, TrendingUp, Wallet, PieChart, Edit3, Check, X, RefreshCw, Sparkles, Sliders } from 'lucide-react'

// Suggests a daily spending budget from real inputs — a deterministic
// calculation, not an LLM guess, so the number is actually trustworthy.
function suggestDailyBudget({ income, investments, fixedExpenses, familySize, age }) {
  const savingsPct = age < 30 ? 0.20 : age < 45 ? 0.25 : 0.30
  const targetSavings = income * savingsPct
  const familyBuffer = Math.max(0, (familySize - 1)) * 2000 // rough per-dependent monthly floor
  const availableForSpending = Math.max(0, income - targetSavings - investments - fixedExpenses - familyBuffer)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return {
    daily: Math.round(availableForSpending / daysInMonth),
    breakdown: { targetSavings, familyBuffer, availableForSpending, savingsPct },
  }
}

// ── Category definitions with emojis, default budget allocations & colors ──
const CATEGORIES = [
  { key: 'Food',          emoji: '🍔', label: 'Food & Dining',    defaultPct: 0.25, color: '#F59E0B' },
  { key: 'Transport',     emoji: '🚗', label: 'Transport',        defaultPct: 0.10, color: '#06B6D4' },
  { key: 'Shopping',      emoji: '🛍️', label: 'Shopping',         defaultPct: 0.15, color: '#F43F5E' },
  { key: 'Bills',         emoji: '📱', label: 'Bills & Utilities', defaultPct: 0.15, color: '#8B5CF6' },
  { key: 'Health',        emoji: '💊', label: 'Health',            defaultPct: 0.08, color: '#FF7062' },
  { key: 'Entertainment', emoji: '🎬', label: 'Entertainment',    defaultPct: 0.07, color: '#10B981' },
  { key: 'Education',     emoji: '📚', label: 'Education',        defaultPct: 0.10, color: '#3B82F6' },
  { key: 'Other',         emoji: '💳', label: 'Other',            defaultPct: 0.10, color: '#9CA3AF' },
]

const STORAGE_KEY = 'mv_budget_overrides'

function loadBudgetOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveBudgetOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

// Map transaction categories to our canonical keys
function normalizeCategory(cat) {
  if (!cat) return 'Other'
  const lower = cat.toLowerCase()
  // Direct matches
  for (const c of CATEGORIES) {
    if (lower === c.key.toLowerCase()) return c.key
    if (lower === c.label.toLowerCase()) return c.key
  }
  // Partial / alias matches
  if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('grocery') || lower.includes('groceries')) return 'Food'
  if (lower.includes('transport') || lower.includes('uber') || lower.includes('cab') || lower.includes('fuel') || lower.includes('petrol') || lower.includes('auto')) return 'Transport'
  if (lower.includes('shop') || lower.includes('amazon') || lower.includes('flipkart') || lower.includes('cloth')) return 'Shopping'
  if (lower.includes('bill') || lower.includes('electric') || lower.includes('water') || lower.includes('gas') || lower.includes('recharge') || lower.includes('rent') || lower.includes('wifi') || lower.includes('internet')) return 'Bills'
  if (lower.includes('health') || lower.includes('medical') || lower.includes('medicine') || lower.includes('hospital') || lower.includes('doctor') || lower.includes('pharmacy')) return 'Health'
  if (lower.includes('entertain') || lower.includes('movie') || lower.includes('netflix') || lower.includes('game') || lower.includes('spotify') || lower.includes('subscription')) return 'Entertainment'
  if (lower.includes('education') || lower.includes('course') || lower.includes('book') || lower.includes('school') || lower.includes('college') || lower.includes('tuition')) return 'Education'
  // Emoji-prefixed categories from existing data (e.g. "🍕 Food")
  const stripped = cat.replace(/[^\w\s]/g, '').trim().toLowerCase()
  for (const c of CATEGORIES) {
    if (stripped === c.key.toLowerCase() || stripped.includes(c.key.toLowerCase())) return c.key
  }
  return 'Other'
}

// Animation variants
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }
const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

export default function Budget() {
  const { phone } = useApp()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [monthlyIncome, setMonthlyIncome] = useState(30000)
  const [categorySpending, setCategorySpending] = useState({})
  const [budgetOverrides, setBudgetOverrides] = useState(loadBudgetOverrides)
  const [editingCat, setEditingCat] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // ── Daily budget state ──
  const [dailyBudget, setDailyBudget] = useState(1000)
  const [todaySpent, setTodaySpent] = useState(0)
  const [userAge, setUserAge] = useState(30)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetMode, setBudgetMode] = useState('manual') // 'manual' | 'suggest'
  const [manualInput, setManualInput] = useState('')
  const [suggestForm, setSuggestForm] = useState({ investments: '', fixedExpenses: '', familySize: '1', age: '' })
  const [suggestion, setSuggestion] = useState(null)
  const [savingBudget, setSavingBudget] = useState(false)

  // ── Fetch data from Supabase ──
  const fetchData = useCallback(async () => {
    if (!phone) return
    setError(null)

    try {
      // Fetch user data and transactions in parallel
      const [user, transactions] = await Promise.all([
        api.getUser(phone),
        api.getTransactions(phone, 500),
      ])

      if (user?.daily_budget) setDailyBudget(Number(user.daily_budget))
      if (user?.age) setUserAge(Number(user.age))
      const todayStr = new Date().toDateString()
      const spentToday = (user?.recent_transactions || [])
        .filter(t => t.type === 'expense' && new Date(t.created_at).toDateString() === todayStr)
        .reduce((s, t) => s + Number(t.amount), 0)
      setTodaySpent(spentToday)

      // Real over-budget notification — once per day, not just a passive banner
      if (user?.daily_budget && spentToday > Number(user.daily_budget)) {
        const dedupKey = `mv_overbudget_notified_${todayStr}`
        if (!localStorage.getItem(dedupKey)) {
          localStorage.setItem(dedupKey, '1')
          api.addNotification(phone, `You've gone over your daily budget — spent ₹${Math.round(spentToday)} of ₹${Math.round(Number(user.daily_budget))}`, 'budget')
        }
      }

      // Set monthly income from user profile
      if (user?.monthly_income && Number(user.monthly_income) > 0) {
        setMonthlyIncome(Number(user.monthly_income))
      }

      // Filter expenses only and aggregate by category
      const expenses = (transactions || []).filter(t => t.type === 'expense')

      // Filter to current month only
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const thisMonthExpenses = expenses.filter(t => {
        const d = new Date(t.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      const grouped = {}
      thisMonthExpenses.forEach(t => {
        const cat = normalizeCategory(t.category)
        grouped[cat] = (grouped[cat] || 0) + Number(t.amount || 0)
      })

      setCategorySpending(grouped)
    } catch (err) {
      console.error('Budget fetch error:', err)
      setError('Failed to load budget data. Pull down to retry.')
      toast.show('Failed to load budget data', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [phone, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Refresh handler ──
  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // ── Daily budget: open/save ──
  function openBudgetModal() {
    setManualInput(String(dailyBudget))
    setSuggestForm(f => ({ ...f, age: f.age || String(userAge) }))
    setSuggestion(null)
    setBudgetMode('manual')
    setShowBudgetModal(true)
  }

  function computeSuggestion() {
    const result = suggestDailyBudget({
      income: monthlyIncome,
      investments: Number(suggestForm.investments) || 0,
      fixedExpenses: Number(suggestForm.fixedExpenses) || 0,
      familySize: Number(suggestForm.familySize) || 1,
      age: Number(suggestForm.age) || 30,
    })
    setSuggestion(result)
  }

  async function saveDailyBudget(amount) {
    if (!amount || amount <= 0) { toast.show('Enter a valid amount', 'error'); return }
    setSavingBudget(true)
    const ok = await api.updateUser(phone, { daily_budget: amount })
    setSavingBudget(false)
    if (ok) {
      setDailyBudget(amount)
      setShowBudgetModal(false)
      toast.show('Daily budget updated', 'success')
    } else {
      toast.show('Could not save — check your connection', 'error')
    }
  }

  // ── Budget calculations ──
  function getCategoryBudget(cat) {
    if (budgetOverrides[cat.key] != null) return Number(budgetOverrides[cat.key])
    return Math.round(monthlyIncome * cat.defaultPct)
  }

  const categoryData = CATEGORIES.map(cat => {
    const budget = getCategoryBudget(cat)
    const spent = categorySpending[cat.key] || 0
    const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
    const remaining = budget - spent
    return { ...cat, budget, spent, pct, remaining }
  })

  const totalBudget = categoryData.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0
  const isOverBudget = overallPct > 90

  // SVG ring parameters
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDash = (overallPct / 100) * circumference
  const strokeGap = circumference - strokeDash

  // ── Category budget editing ──
  function startEdit(catKey, currentBudget) {
    setEditingCat(catKey)
    setEditValue(String(currentBudget))
  }

  function saveEdit(catKey) {
    const val = parseInt(editValue, 10)
    if (isNaN(val) || val < 0) {
      toast.show('Enter a valid amount', 'error')
      return
    }
    const updated = { ...budgetOverrides, [catKey]: val }
    setBudgetOverrides(updated)
    saveBudgetOverrides(updated)
    setEditingCat(null)
    setEditValue('')
    toast.show('Budget updated', 'success')
  }

  function cancelEdit() {
    setEditingCat(null)
    setEditValue('')
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="page">
        <header className="page-header">
          <div className="header-left"><h2>Budget</h2></div>
        </header>
        <div className="budget-overview">
          <div className="budget-ring-wrap">
            <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
          </div>
          <div className="budget-meta">
            <div className="bm-row"><div className="skeleton" style={{ width: '100%', height: 18, borderRadius: 6 }} /></div>
            <div className="bm-row"><div className="skeleton" style={{ width: '100%', height: 18, borderRadius: 6 }} /></div>
            <div className="bm-row"><div className="skeleton" style={{ width: '100%', height: 18, borderRadius: 6 }} /></div>
          </div>
        </div>
        <section className="section">
          <div className="section-head"><h3>Spending by Category</h3></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="budget-cat-card">
              <div className="bc-header">
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <div className="bc-info">
                  <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 36, height: 20, borderRadius: 4 }} />
              </div>
              <div className="progress-bar"><div className="skeleton" style={{ width: '100%', height: '100%' }} /></div>
            </div>
          ))}
        </section>
      </div>
    )
  }

  // ── Error state ──
  if (error && Object.keys(categorySpending).length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <div className="header-left"><h2>Budget</h2></div>
        </header>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertTriangle size={48} color="var(--red)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20 }}>{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh} style={{ margin: '0 auto' }}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  // Active categories = those with spending or budget > 0
  const activeCategories = categoryData.filter(c => c.spent > 0 || c.budget > 0)
  const overBudgetCount = activeCategories.filter(c => c.pct > 100).length

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="page-header">
        <div className="header-left"><h2>Budget</h2></div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text3)' }}
          aria-label="Refresh budget data"
        >
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
        </button>
      </header>

      {/* ── Daily budget card ── */}
      <motion.div className="daily-budget-card" {...fadeUp} transition={{ duration: 0.35 }}>
        <div className="dbc-left">
          <div className="dbc-label">Daily Budget</div>
          <div className="dbc-amount">{formatINR(dailyBudget)}</div>
          <div className={`dbc-today ${todaySpent > dailyBudget ? 'over' : ''}`}>
            {todaySpent > dailyBudget
              ? <><AlertTriangle size={12} /> ₹{Math.round(todaySpent - dailyBudget)} over today</>
              : `₹${Math.round(dailyBudget - todaySpent)} left today`}
          </div>
        </div>
        <button className="dbc-edit-btn" onClick={openBudgetModal}>
          <Sliders size={14} /> Set Budget
        </button>
      </motion.div>

      {/* ── Daily budget modal ── */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
            <motion.div
              className="rm-modal"
              onClick={e => e.stopPropagation()}
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              <div className="rm-modal-hdr">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wallet size={18} style={{ color: 'var(--primary)' }} />
                  <span className="rm-modal-title">Set Daily Budget</span>
                </div>
                <button className="modal-close" onClick={() => setShowBudgetModal(false)}><X size={16} /></button>
              </div>
              <div className="rm-modal-body">
                <div className="rm-freq-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <button className={`rm-freq-btn ${budgetMode === 'manual' ? 'rm-freq-btn--active' : ''}`} onClick={() => setBudgetMode('manual')}>
                    Set it myself
                  </button>
                  <button className={`rm-freq-btn ${budgetMode === 'suggest' ? 'rm-freq-btn--active' : ''}`} onClick={() => setBudgetMode('suggest')}>
                    <Sparkles size={12} /> Let Viya suggest
                  </button>
                </div>

                {budgetMode === 'manual' ? (
                  <>
                    <div className="rm-section-label" style={{ marginTop: 16 }}>Daily budget (₹)</div>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="1000"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                    />
                    <button
                      className="btn-primary full"
                      style={{ marginTop: 14 }}
                      disabled={savingBudget}
                      onClick={() => saveDailyBudget(Number(manualInput))}
                    >
                      {savingBudget ? 'Saving…' : 'Save Budget'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="dbc-suggest-intro">
                      Based on your ₹{monthlyIncome.toLocaleString('en-IN')}/mo income, tell Viya a bit more and it'll work out a realistic daily number.
                    </p>
                    <div className="rm-section-label" style={{ marginTop: 10 }}>Your age</div>
                    <input type="number" className="input-field" placeholder="30" value={suggestForm.age}
                      onChange={e => setSuggestForm(f => ({ ...f, age: e.target.value }))} />

                    <div className="rm-section-label" style={{ marginTop: 10 }}>Family size (incl. you)</div>
                    <input type="number" className="input-field" placeholder="1" min="1" value={suggestForm.familySize}
                      onChange={e => setSuggestForm(f => ({ ...f, familySize: e.target.value }))} />

                    <div className="rm-section-label" style={{ marginTop: 10 }}>Existing monthly investments/SIPs (₹)</div>
                    <input type="number" className="input-field" placeholder="0" value={suggestForm.investments}
                      onChange={e => setSuggestForm(f => ({ ...f, investments: e.target.value }))} />

                    <div className="rm-section-label" style={{ marginTop: 10 }}>Fixed monthly expenses — rent, EMI, etc. (₹)</div>
                    <input type="number" className="input-field" placeholder="0" value={suggestForm.fixedExpenses}
                      onChange={e => setSuggestForm(f => ({ ...f, fixedExpenses: e.target.value }))} />

                    <button className="btn-secondary full" style={{ marginTop: 14 }} onClick={computeSuggestion}>
                      <Sparkles size={14} /> Calculate Suggestion
                    </button>

                    {suggestion && (
                      <div className="dbc-suggestion-result">
                        <div className="dbc-suggestion-amount">{formatINR(suggestion.daily)}<span>/day</span></div>
                        <div className="dbc-suggestion-breakdown">
                          <div>Target savings ({Math.round(suggestion.breakdown.savingsPct * 100)}% for your age): ₹{Math.round(suggestion.breakdown.targetSavings).toLocaleString('en-IN')}/mo</div>
                          {suggestion.breakdown.familyBuffer > 0 && <div>Family buffer: ₹{suggestion.breakdown.familyBuffer.toLocaleString('en-IN')}/mo</div>}
                          <div>Available for spending: ₹{Math.round(suggestion.breakdown.availableForSpending).toLocaleString('en-IN')}/mo</div>
                        </div>
                        <button
                          className="btn-primary full"
                          style={{ marginTop: 12 }}
                          disabled={savingBudget}
                          onClick={() => saveDailyBudget(suggestion.daily)}
                        >
                          {savingBudget ? 'Saving…' : 'Use This Budget'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Overview ring + summary ── */}
      <motion.div className="budget-overview" {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="budget-ring-wrap">
          <svg viewBox="0 0 100 100" className="budget-ring">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface2)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={isOverBudget ? 'var(--red)' : 'var(--violet)'}
              strokeWidth="8"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={circumference - strokeDash}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - strokeDash }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: 'center' }}
            />
          </svg>
          <div className="budget-ring-text">
            <div className="budget-ring-pct">{overallPct}%</div>
            <div className="budget-ring-label">used</div>
          </div>
        </div>
        <div className="budget-meta">
          <div className="bm-row">
            <span className="bm-label"><Wallet size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Total Budget</span>
            <span className="bm-val">{formatINR(totalBudget)}</span>
          </div>
          <div className="bm-row">
            <span className="bm-label"><TrendingDown size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Spent</span>
            <span className="bm-val cosmos">{formatINR(totalSpent)}</span>
          </div>
          <div className="bm-row">
            <span className="bm-label">{totalRemaining >= 0 ? <TrendingUp size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> : <AlertTriangle size={13} style={{ marginRight: 4, verticalAlign: -2 }} />}Remaining</span>
            <span className={'bm-val ' + (totalRemaining >= 0 ? 'green' : 'red')}>{formatINR(totalRemaining)}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Over-budget alert ── */}
      <AnimatePresence>
        {isOverBudget && (
          <motion.div
            className="budget-alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertTriangle size={16} />
            <span>You've used {overallPct}% of your budget!{overBudgetCount > 0 ? ` ${overBudgetCount} categor${overBudgetCount === 1 ? 'y is' : 'ies are'} over limit.` : ''}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category breakdown ── */}
      <section className="section">
        <div className="section-head">
          <h3><PieChart size={16} style={{ marginRight: 6, verticalAlign: -2 }} />Spending by Category</h3>
        </div>

        {activeCategories.length === 0 ? (
          <motion.p className="empty-text" {...fadeUp}>
            No expenses tracked this month yet. Start with "spent 500 on food"
          </motion.p>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate">
            {activeCategories.sort((a, b) => b.spent - a.spent).map((c, i) => (
              <motion.div
                key={c.key}
                className="budget-cat-card"
                variants={fadeUp}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="bc-header">
                  <span className="bc-emoji">{c.emoji}</span>
                  <div className="bc-info">
                    <div className="bc-name">{c.label}</div>
                    {editingCat === c.key ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Budget:</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.key); if (e.key === 'Escape') cancelEdit() }}
                          autoFocus
                          style={{
                            width: 80, padding: '2px 6px', fontSize: 13,
                            border: '1px solid var(--border)', borderRadius: 6,
                            background: 'var(--surface)', color: 'var(--text)',
                            fontFamily: 'var(--mono)',
                          }}
                        />
                        <button onClick={() => saveEdit(c.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--primary)' }}><Check size={16} /></button>
                        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text3)' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="bc-amounts">
                        {formatINR(c.spent)} / {formatINR(c.budget)}
                        <button
                          onClick={() => startEdit(c.key, c.budget)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text3)', verticalAlign: -1 }}
                          aria-label={`Edit ${c.label} budget`}
                        >
                          <Edit3 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={'bc-pct' + (c.pct > 90 ? ' over' : '')}>{c.pct}%</div>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    style={{ background: c.pct > 100 ? 'var(--red)' : c.color }}
                    initial={{ width: 0 }}
                    animate={{ width: c.pct + '%' }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                  />
                </div>
                {c.pct > 100 && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={11} /> Over budget by {formatINR(c.spent - c.budget)}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Monthly income note ── */}
      <motion.div
        style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Budget calculated from monthly income of {formatINR(monthlyIncome)}
      </motion.div>
    </div>
  )
}
