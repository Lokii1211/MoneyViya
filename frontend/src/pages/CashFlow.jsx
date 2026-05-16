import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'

const PERIOD_OPTIONS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
]

const CATEGORY_EMOJI = {
  food_dining: '🍕', grocery: '🛒', shopping: '🛍️', transport: '🚗',
  entertainment: '🎬', healthcare: '💊', bills_utilities: '💡',
  education: '📚', travel: '✈️', emi_loan: '🏦', income_salary: '💰',
  investment: '📈', personal_care: '💅', insurance: '🛡️',
  cash_withdrawal: '🏧', other: '📦',
}

export default function CashFlow() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCashFlow()
  }, [period])

  async function loadCashFlow() {
    setLoading(true)
    try {
      const phone = user?.phone || localStorage.getItem('viya_phone')
      const API = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API}/api/dashboard/${phone}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch { /* offline fallback */ }
    setLoading(false)
  }

  // Compute summary from data
  const summary = useMemo(() => {
    if (!data) return { income: 0, expenses: 0, net: 0, savingsRate: 0, txnCount: 0 }
    const transactions = data.transactions || []
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
    const net = income - expenses
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0
    return { income, expenses, net, savingsRate, txnCount: transactions.length }
  }, [data])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!data) return []
    const transactions = (data.transactions || []).filter(t => t.type === 'expense')
    const cats = {}
    transactions.forEach(t => {
      const c = t.category || 'other'
      cats[c] = (cats[c] || 0) + (t.amount || 0)
    })
    return Object.entries(cats)
      .map(([cat, amount]) => ({ cat, amount, pct: summary.expenses > 0 ? Math.round((amount / summary.expenses) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount)
  }, [data, summary])

  // Recent auto-captured transactions
  const autoCaptured = useMemo(() => {
    if (!data) return []
    return (data.transactions || [])
      .filter(t => t.source === 'sms' || t.source === 'aa_api')
      .slice(0, 5)
  }, [data])

  const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

  if (loading) {
    return (
      <div className="page" id="cashflow-page">
        <div className="page-header"><h1 className="page-title">Cash Flow</h1></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="shimmer-block" style={{ width: '100%', height: 200, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page" id="cashflow-page">
      <div className="page-header">
        <h1 className="page-title">Cash Flow</h1>
        <p className="page-subtitle">Your financial pulse</p>
      </div>

      {/* Period Selector */}
      <div className="cf-period-bar">
        {PERIOD_OPTIONS.map(p => (
          <button
            key={p.key}
            className={`cf-period-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >{p.label}</button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="cf-summary-grid">
        <div className="cf-card cf-income">
          <span className="cf-card-label">Income</span>
          <span className="cf-card-value">{fmt(summary.income)}</span>
          <span className="cf-card-tag">↑ {summary.txnCount} transactions</span>
        </div>
        <div className="cf-card cf-expense">
          <span className="cf-card-label">Expenses</span>
          <span className="cf-card-value">{fmt(summary.expenses)}</span>
          <span className="cf-card-tag">{categoryBreakdown.length} categories</span>
        </div>
        <div className="cf-card cf-net">
          <span className="cf-card-label">Net Cash Flow</span>
          <span className="cf-card-value" style={{ color: summary.net >= 0 ? 'var(--emerald-400)' : 'var(--cosmos-400)' }}>
            {summary.net >= 0 ? '+' : '-'}{fmt(summary.net)}
          </span>
          <span className="cf-card-tag">Savings rate: {summary.savingsRate}%</span>
        </div>
      </div>

      {/* Savings Rate Ring */}
      <div className="cf-ring-section">
        <div className="cf-ring-container">
          <svg viewBox="0 0 120 120" className="cf-ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={summary.savingsRate >= 30 ? 'var(--emerald-400)' : 'var(--amber-400)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(summary.savingsRate / 100) * 327} 327`}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="55" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700" fontFamily="var(--font-mono)">{summary.savingsRate}%</text>
            <text x="60" y="72" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">saved</text>
          </svg>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="section-card">
        <h2 className="section-title">Spending by Category</h2>
        {categoryBreakdown.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No expenses yet this period</p>
        ) : (
          <div className="cf-cat-list">
            {categoryBreakdown.map(({ cat, amount, pct }) => {
              const label = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              const emoji = CATEGORY_EMOJI[cat] || '📦'
              return (
                <div key={cat} className="cf-cat-row">
                  <span className="cf-cat-emoji">{emoji}</span>
                  <div className="cf-cat-info">
                    <span className="cf-cat-name">{label}</span>
                    <div className="cf-cat-bar-bg">
                      <div className="cf-cat-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="cf-cat-right">
                    <span className="cf-cat-amount">{fmt(amount)}</span>
                    <span className="cf-cat-pct">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Auto-Captured Feed */}
      {autoCaptured.length > 0 && (
        <div className="section-card">
          <h2 className="section-title">⚡ Auto-Captured</h2>
          <div className="cf-auto-list">
            {autoCaptured.map((t, i) => (
              <div key={i} className="cf-auto-row">
                <div className="cf-auto-badge">{t.source === 'sms' ? '📱' : '🏦'}</div>
                <div className="cf-auto-info">
                  <span className="cf-auto-desc">{t.description || t.merchant_normalized || 'Transaction'}</span>
                  <span className="cf-auto-meta">{t.payment_method || 'auto'} · {t.category || 'uncategorized'}</span>
                </div>
                <span className={`cf-auto-amt ${t.type === 'income' ? 'income' : 'expense'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="cf-actions">
        <button className="cf-action-btn" onClick={() => navigate('/expenses')}>
          📊 All Transactions
        </button>
        <button className="cf-action-btn" onClick={() => navigate('/budget')}>
          📋 Budget Status
        </button>
        <button className="cf-action-btn" onClick={() => navigate('/wealth')}>
          💰 Portfolio
        </button>
      </div>
    </div>
  )
}
