import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, PiggyBank, Plus, BarChart3, Shield, X, ChevronRight, Smartphone } from 'lucide-react'

const typeConfig = {
  mutual_fund: { emoji: '📈', color: 'var(--primary)', label: 'Mutual Fund' },
  stock: { emoji: '📊', color: 'var(--violet)', label: 'Stock' },
  fd: { emoji: '🏦', color: 'var(--gold)', label: 'Fixed Deposit' },
  ppf: { emoji: '🛡️', color: 'var(--primary)', label: 'PPF' },
  nps: { emoji: '🏛️', color: 'var(--cyan)', label: 'NPS' },
  gold: { emoji: '🥇', color: '#FFB800', label: 'Gold' },
  crypto: { emoji: '₿', color: '#F7931A', label: 'Crypto' },
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '' })

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const [invData, txnData] = await Promise.all([
        api.getInvestments(phone),
        api.getTransactions(phone),
      ])
      if (invData?.length) setInvestments(invData)
      if (txnData?.length) setTransactions(txnData)
    } catch (e) { console.error('Wealth load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddInvestment() {
    if (!addForm.name || !addForm.invested_amount) {
      toast.error('Please enter name and invested amount')
      return
    }
    setAddSaving(true)
    try {
      await api.addInvestment(phone, {
        name: addForm.name,
        investment_type: addForm.investment_type,
        invested_amount: Number(addForm.invested_amount),
        current_value: Number(addForm.current_value || addForm.invested_amount),
      })
      toast.success('Investment added!')
      setAddForm({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '' })
      setShowAddForm(false)
      loadData()
    } catch (e) {
      console.error('Add investment error:', e)
      toast.error('Failed to add investment')
    }
    setAddSaving(false)
  }

  // Portfolio computations
  const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount || 0), 0)
  const currentValue = investments.reduce((s, i) => s + Number(i.current_value || i.invested_amount || 0), 0)
  const returns = currentValue - totalInvested
  const returnPct = totalInvested > 0 ? ((returns / totalInvested) * 100).toFixed(1) : 0

  // Net worth from transactions
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
  const netWorth = currentValue + (totalIncome - totalExpense)

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'sip', label: 'SIPs' },
    { id: 'goals', label: 'Goals' },
  ]

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

      {/* Connect Investment Accounts */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Track your portfolio</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Connect your broker or add investments manually</div>
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 12 }}>
          {['Zerodha', 'Groww', 'Kuvera'].map(broker => (
            <button key={broker} className="pill-btn" onClick={() => nav(`/chat?q=I+have+investments+in+${broker}`)}>
              {broker}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="pill-btn active" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} /> Add Investment
          </button>
          <button className="pill-btn" onClick={() => nav('/bank-connect')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Smartphone size={14} /> Connect Bank
          </button>
        </div>
      </div>

      {/* Add Investment Form (inline expandable) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="card mb-4" style={{ padding: 16, border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>New Investment</span>
                <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="Investment name (e.g. Axis Bluechip Fund)"
                  value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--glass-border, #333)', background: 'var(--glass-bg, #1a1a1a)', color: 'var(--text1, #fff)', fontSize: 14 }} />
                <select value={addForm.investment_type} onChange={e => setAddForm({ ...addForm, investment_type: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--glass-border, #333)', background: 'var(--glass-bg, #1a1a1a)', color: 'var(--text1, #fff)', fontSize: 14 }}>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="stock">Stock</option>
                  <option value="fd">Fixed Deposit</option>
                  <option value="ppf">PPF</option>
                  <option value="nps">NPS</option>
                  <option value="gold">Gold</option>
                  <option value="crypto">Crypto</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Invested amount"
                    value={addForm.invested_amount} onChange={e => setAddForm({ ...addForm, invested_amount: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--glass-border, #333)', background: 'var(--glass-bg, #1a1a1a)', color: 'var(--text1, #fff)', fontSize: 14 }} />
                  <input type="number" placeholder="Current value"
                    value={addForm.current_value} onChange={e => setAddForm({ ...addForm, current_value: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--glass-border, #333)', background: 'var(--glass-bg, #1a1a1a)', color: 'var(--text1, #fff)', fontSize: 14 }} />
                </div>
                <button className="btn-primary full" onClick={handleAddInvestment} disabled={addSaving}
                  style={{ marginTop: 4 }}>
                  {addSaving ? 'Saving...' : 'Save Investment'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
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
              <p>Tell Viya: "I have a SIP in Axis Bluechip Fund of Rs 5000/month"</p>
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
                        <p>Tell Viya: "Track my SIP of Rs 5000 in Axis Bluechip"</p>
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

                    <button className="btn-primary full mt-2" onClick={() => nav('/chat?q=suggest+best+SIP+funds')}>
                      <Plus size={16} /> Start New SIP with AI Guidance
                    </button>
                  </motion.div>
                )}

                {/* === GOALS === */}
                {tab === 'goals' && (
                  <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {[
                      { name: 'Emergency Fund', emoji: '🛡️', target: 300000, saved: 185000, color: 'var(--cyan)', deadline: 'Dec 2025' },
                      { name: 'New Laptop', emoji: '💻', target: 85000, saved: 42000, color: 'var(--violet)', deadline: 'Aug 2025' },
                      { name: 'Goa Trip', emoji: '✈️', target: 40000, saved: 28000, color: 'var(--orange)', deadline: 'Jul 2025' },
                    ].map((g, i) => {
                      const pct = Math.round((g.saved / g.target) * 100)
                      return (
                        <div key={i} className="card mb-2" style={{ padding: 16 }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 24 }}>{g.emoji}</span>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
                                <div className="body-s text-tertiary">Target: {g.deadline}</div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color: g.color }}>{pct}%</span>
                          </div>
                          <div className="progress-bar mb-2" style={{ height: 8 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: g.color }} />
                          </div>
                          <div className="flex justify-between body-s">
                            <span className="text-secondary">{formatINR(g.saved)} saved</span>
                            <span style={{ fontWeight: 600 }}>{formatINR(g.target)} goal</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button className="pill-btn active"
                              onClick={() => nav(`/chat?q=add+money+to+${encodeURIComponent(g.name)}`)}>
                              + Add Money
                            </button>
                            <button className="pill-btn">Edit Goal</button>
                          </div>
                        </div>
                      )
                    })}
                    <button className="btn-primary full" onClick={() => nav('/chat?q=create+new+savings+goal')}>
                      <Plus size={16} /> Create New Goal
                    </button>
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
