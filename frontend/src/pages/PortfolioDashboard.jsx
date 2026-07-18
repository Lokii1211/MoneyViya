import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const getEPFProjection = async () => null

const TABS = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'holdings', label: '📈 Holdings' },
  { key: 'tax', label: '📋 Tax' },
  { key: 'sip', label: '💰 SIP' },
  { key: 'retire', label: '🏖️ Retire' },
]

const TYPE_MAP = {
  mutual_fund: { type: 'Mutual Fund', sector: 'Flexi Cap' },
  stock: { type: 'Equity', sector: 'Equity' },
  fd: { type: 'FD', sector: 'Fixed Income' },
  ppf: { type: 'PPF', sector: 'Fixed Income' },
  nps: { type: 'NPS', sector: 'Retirement' },
  gold: { type: 'ETF', sector: 'Gold' },
  crypto: { type: 'Crypto', sector: 'Crypto' },
}

function PortfolioSkeleton() {
  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="skeleton"
        style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ))}
      </div>
      {[0, 1, 2, 3].map(i => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.06 }} className="skeleton"
          style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />
      ))}
    </div>
  )
}

export default function PortfolioDashboard() {
  const navigate = useNavigate()
  const { user, phone } = useApp()
  const [tab, setTab] = useState('overview')
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sipAmount, setSipAmount] = useState(10000)
  const [sipYears, setSipYears] = useState(20)
  const [sipRate, setSipRate] = useState(12)
  const [epfBasic, setEpfBasic] = useState(60000)
  const [epfBalance, setEpfBalance] = useState(500000)
  const [epfAge, setEpfAge] = useState(28)
  const [epfResult, setEpfResult] = useState(null)

  // Load real investment data from API
  useEffect(() => {
    async function fetchData() {
      if (!phone) { setLoading(false); return }
      setLoading(true)
      try {
        const invData = await api.getInvestments(phone)
        if (invData?.length) {
          setHoldings(invData.map(inv => {
            const mapping = TYPE_MAP[inv.investment_type] || { type: inv.investment_type || 'Other', sector: 'Other' }
            const invested = Number(inv.invested_amount || 0)
            const current = Number(inv.current_value || inv.invested_amount || 0)
            const returns_pct = invested > 0 ? Math.round(((current - invested) / invested) * 100) : 0
            return {
              name: inv.name,
              type: mapping.type,
              invested,
              current,
              returns_pct,
              sector: mapping.sector,
            }
          }))
        }
      } catch (e) {
        console.error('Portfolio load error:', e)
      }
      setLoading(false)
    }
    fetchData()
  }, [phone])

  // Fetch EPF projection from API when inputs change
  useEffect(() => {
    async function fetchEPF() {
      try {
        const res = await getEPFProjection(epfBasic, epfBalance, epfAge)
        if (res?.data) {
          setEpfResult(res.data)
          return
        }
      } catch { /* offline — compute locally */ }
      // Local fallback
      const years = 60 - epfAge
      if (years <= 0) { setEpfResult(null); return }
      const monthly = epfBasic * 0.24
      const mr = 8.25 / 100 / 12
      let bal = epfBalance
      for (let i = 0; i < years * 12; i++) bal = (bal + monthly) * (1 + mr)
      setEpfResult({ projected_corpus: Math.round(bal), monthly_contribution: Math.round(monthly), monthly_pension_estimate: Math.round(bal * 0.004), years_to_retirement: years })
    }
    fetchEPF()
  }, [epfBasic, epfBalance, epfAge])

  const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

  const portfolio = useMemo(() => {
    const invested = holdings.reduce((s, h) => s + h.invested, 0)
    const current = holdings.reduce((s, h) => s + h.current, 0)
    const pnl = current - invested
    const pnlPct = invested > 0 ? ((pnl / invested) * 100).toFixed(1) : '0.0'
    return { invested, current, pnl, pnlPct }
  }, [holdings])

  const allocation = useMemo(() => {
    const sectors = {}
    holdings.forEach(h => {
      sectors[h.sector] = (sectors[h.sector] || 0) + h.current
    })
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / portfolio.current) * 100) }))
      .sort((a, b) => b.value - a.value)
  }, [holdings, portfolio])

  // SIP projection (client-side — no API needed, real-time slider)
  const sipResult = useMemo(() => {
    const months = sipYears * 12
    const mr = sipRate / 100 / 12
    let fv = 0
    for (let i = 0; i < months; i++) fv = (fv + sipAmount) * (1 + mr)
    const invested = sipAmount * months
    return { invested, fv: Math.round(fv), gain: Math.round(fv - invested), multiplier: invested > 0 ? (fv / invested).toFixed(1) : '0' }
  }, [sipAmount, sipYears, sipRate])

  // Normalize EPF result fields (API uses projected_corpus, local uses corpus)
  const epf = epfResult ? {
    monthly: epfResult.monthly_contribution || epfResult.monthly || 0,
    corpus: epfResult.projected_corpus || epfResult.corpus || 0,
    pension: epfResult.monthly_pension_estimate || epfResult.pension || 0,
    years: epfResult.years_to_retirement || epfResult.years || 0,
  } : null

  const isEmpty = holdings.length === 0 && !loading

  return (
    <div className="page" id="portfolio-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
          <div>
            <h1 className="page-title">Portfolio</h1>
            <p className="page-subtitle">Investment command center</p>
          </div>
        </div>
      </div>

      {loading && <PortfolioSkeleton />}

      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>No investments tracked yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            Add your mutual funds, stocks, FDs and more to track your portfolio in one place.
          </p>
          <button className="cf-action-btn" onClick={() => navigate('/wealth')}
            style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600 }}>
            + Add Investment
          </button>
        </div>
      )}

      {!loading && !isEmpty && (
        <>
      {/* Tab Bar */}
      <div className="cf-period-bar" style={{ overflowX: 'auto', gap: 4 }}>
        {TABS.map(t => (
          <button key={t.key} className={`cf-period-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="cf-summary-grid">
            <div className="cf-card cf-income">
              <span className="cf-card-label">Invested</span>
              <span className="cf-card-value">{fmt(portfolio.invested)}</span>
            </div>
            <div className="cf-card cf-net">
              <span className="cf-card-label">Current Value</span>
              <span className="cf-card-value" style={{ color: 'var(--emerald-400)' }}>{fmt(portfolio.current)}</span>
            </div>
            <div className="cf-card cf-expense">
              <span className="cf-card-label">Total P&L</span>
              <span className="cf-card-value" style={{ color: portfolio.pnl >= 0 ? 'var(--emerald-400)' : 'var(--cosmos-400)' }}>
                {portfolio.pnl >= 0 ? '+' : ''}{fmt(portfolio.pnl)} ({portfolio.pnlPct}%)
              </span>
            </div>
          </div>

          {/* Ring chart */}
          <div className="cf-ring-section">
            <div className="cf-ring-container">
              <svg viewBox="0 0 120 120" className="cf-ring-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke="var(--emerald-400)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(portfolio.pnlPct / 50) * 327} 327`}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="700">+{portfolio.pnlPct}%</text>
                <text x="60" y="72" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">returns</text>
              </svg>
            </div>
          </div>

          {/* Allocation */}
          <div className="section-card">
            <h2 className="section-title">Asset Allocation</h2>
            <div className="cf-cat-list">
              {allocation.map(a => (
                <div key={a.name} className="cf-cat-row">
                  <span className="cf-cat-emoji">{a.name === 'Gold' ? '🥇' : a.name === 'Banking' ? '🏦' : '📈'}</span>
                  <div className="cf-cat-info">
                    <span className="cf-cat-name">{a.name}</span>
                    <div className="cf-cat-bar-bg">
                      <div className="cf-cat-bar-fill" style={{ width: `${a.pct}%`, background: 'var(--accent-gradient)' }} />
                    </div>
                  </div>
                  <div className="cf-cat-right">
                    <span className="cf-cat-amount">{fmt(a.value)}</span>
                    <span className="cf-cat-pct">{a.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ HOLDINGS ═══ */}
      {tab === 'holdings' && (
        <div className="section-card">
          <h2 className="section-title">All Holdings ({holdings.length})</h2>
          <div className="cf-auto-list">
            {[...holdings].sort((a, b) => b.current - a.current).map((h, i) => (
              <div key={i} className="cf-auto-row" style={{ alignItems: 'flex-start' }}>
                <div className="cf-auto-badge" style={{ fontSize: 18 }}>
                  {h.type === 'Equity' ? '📊' : h.type === 'ETF' ? '🥇' : '📈'}
                </div>
                <div className="cf-auto-info">
                  <span className="cf-auto-desc">{h.name}</span>
                  <span className="cf-auto-meta">{h.type} · {h.sector}</span>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span>Inv: {fmt(h.invested)}</span>
                    <span>Cur: {fmt(h.current)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 70 }}>
                  <span className={`cf-auto-amt ${h.returns_pct >= 0 ? 'income' : 'expense'}`}>
                    {h.returns_pct >= 0 ? '+' : ''}{h.returns_pct}%
                  </span>
                  <div style={{ fontSize: 12, color: h.returns_pct >= 0 ? 'var(--emerald-400)' : 'var(--cosmos-400)', marginTop: 2 }}>
                    {h.returns_pct >= 0 ? '+' : ''}{fmt(h.current - h.invested)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAX ═══ */}
      {tab === 'tax' && (() => {
        const totalGains = portfolio.pnl > 0 ? portfolio.pnl : 0
        const ltcgExempt = 125000
        const taxableGains = Math.max(0, totalGains - ltcgExempt)
        const estimatedTax = Math.round(taxableGains * 0.125)
        return (
        <>
          <div className="cf-summary-grid">
            <div className="cf-card cf-income">
              <span className="cf-card-label">Total Gains</span>
              <span className="cf-card-value" style={{ fontSize: 18 }}>{fmt(totalGains)}</span>
              <span className="cf-card-tag">Exempt up to {fmt(ltcgExempt)}</span>
            </div>
            <div className="cf-card cf-expense">
              <span className="cf-card-label">Taxable Gains</span>
              <span className="cf-card-value" style={{ fontSize: 18 }}>{fmt(taxableGains)}</span>
              <span className="cf-card-tag">LTCG @ 12.5%</span>
            </div>
            <div className="cf-card cf-net">
              <span className="cf-card-label">Estimated Tax</span>
              <span className="cf-card-value" style={{ fontSize: 18, color: 'var(--amber-400)' }}>{fmt(estimatedTax)}</span>
              <span className="cf-card-tag">Based on current holdings</span>
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">Tax Insights</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                totalGains < ltcgExempt
                  ? `${fmt(ltcgExempt - totalGains)} more LTCG is tax-free this FY — consider booking profits`
                  : `${fmt(taxableGains)} of your gains is taxable at 12.5%`,
                'ELSS investments give 80C benefit up to 1.5L',
                'NPS gives additional 50K deduction under 80CCD(1B)',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--glass-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
        )
      })()}

      {/* ═══ SIP CALCULATOR ═══ */}
      {tab === 'sip' && (
        <>
          <div className="section-card">
            <h2 className="section-title">SIP Projection Calculator</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Monthly SIP: <strong style={{ color: 'var(--text-primary)' }}>{fmt(sipAmount)}</strong>
                <input type="range" min="1000" max="100000" step="1000" value={sipAmount}
                  onChange={e => setSipAmount(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Duration: <strong style={{ color: 'var(--text-primary)' }}>{sipYears} years</strong>
                <input type="range" min="1" max="40" value={sipYears}
                  onChange={e => setSipYears(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Expected Return: <strong style={{ color: 'var(--text-primary)' }}>{sipRate}%</strong>
                <input type="range" min="6" max="20" value={sipRate}
                  onChange={e => setSipRate(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
            </div>
          </div>

          <div className="cf-summary-grid">
            <div className="cf-card cf-income">
              <span className="cf-card-label">Invested</span>
              <span className="cf-card-value" style={{ fontSize: 17 }}>{fmt(sipResult.invested)}</span>
            </div>
            <div className="cf-card cf-net">
              <span className="cf-card-label">Future Value</span>
              <span className="cf-card-value" style={{ fontSize: 17, color: 'var(--emerald-400)' }}>{fmt(sipResult.fv)}</span>
            </div>
            <div className="cf-card cf-expense">
              <span className="cf-card-label">Wealth Gain</span>
              <span className="cf-card-value" style={{ fontSize: 17 }}>{fmt(sipResult.gain)}</span>
              <span className="cf-card-tag">{sipResult.multiplier}× multiplier</span>
            </div>
          </div>

          {/* Visual bar */}
          <div className="section-card">
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 28 }}>
              <div style={{ width: `${(sipResult.invested / sipResult.fv) * 100}%`, background: 'var(--royal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                Invested
              </div>
              <div style={{ flex: 1, background: 'var(--emerald-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#000', fontWeight: 600 }}>
                Gains
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ RETIREMENT ═══ */}
      {tab === 'retire' && (
        <>
          <div className="section-card">
            <h2 className="section-title">🏖️ EPF Retirement Projection</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Basic Salary: <strong style={{ color: 'var(--text-primary)' }}>{fmt(epfBasic)}</strong>
                <input type="range" min="15000" max="200000" step="5000" value={epfBasic}
                  onChange={e => setEpfBasic(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Current Age: <strong style={{ color: 'var(--text-primary)' }}>{epfAge}</strong>
                <input type="range" min="21" max="58" value={epfAge}
                  onChange={e => setEpfAge(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
            </div>
          </div>

          {epf && (
            <div className="cf-summary-grid">
              <div className="cf-card cf-income">
                <span className="cf-card-label">Monthly EPF</span>
                <span className="cf-card-value" style={{ fontSize: 17 }}>{fmt(epf.monthly)}</span>
                <span className="cf-card-tag">12% + 12%</span>
              </div>
              <div className="cf-card cf-net">
                <span className="cf-card-label">Corpus at 60</span>
                <span className="cf-card-value" style={{ fontSize: 17, color: 'var(--emerald-400)' }}>{fmt(epf.corpus)}</span>
                <span className="cf-card-tag">{epf.years} years</span>
              </div>
              <div className="cf-card cf-expense">
                <span className="cf-card-label">Monthly Pension</span>
                <span className="cf-card-value" style={{ fontSize: 17 }}>{fmt(epf.pension)}</span>
                <span className="cf-card-tag">~4.8% withdrawal</span>
              </div>
            </div>
          )}

          <div className="section-card">
            <h2 className="section-title">🧮 Retirement Readiness</h2>
            {epf && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Years to retirement</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{epf.years}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>EPF Interest Rate</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>8.25%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>NPS (Recommended)</span>
                  <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>Start ₹10K/mo SIP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Tax benefit (80CCD)</span>
                  <span style={{ color: 'var(--amber-400)', fontWeight: 600 }}>Save ₹15K/yr</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="cf-actions">
        <button className="cf-action-btn" onClick={() => navigate('/report')}>📊 Reports</button>
        <button className="cf-action-btn" onClick={() => navigate('/insights')}>💡 Insights</button>
        <button className="cf-action-btn" onClick={() => navigate('/wealth')}>💰 Wealth</button>
      </div>
        </>
      )}
    </div>
  )
}
