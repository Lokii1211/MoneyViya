import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'

const RISK_PROFILES = [
  { key: 'conservative', label: '🛡️ Conservative', desc: 'Capital protection first' },
  { key: 'moderate', label: '⚖️ Moderate', desc: 'Balanced growth + safety' },
  { key: 'aggressive', label: '🚀 Aggressive', desc: 'Maximum growth' },
]

const ALLOCATION_MAP = {
  conservative: { equity: 30, debt: 60, gold: 10 },
  moderate: { equity: 60, debt: 32, gold: 8 },
  aggressive: { equity: 80, debt: 15, gold: 5 },
}

const INSTRUMENTS = {
  equity: { conservative: 'Nifty 50 Index Fund', moderate: 'Parag Parikh Flexi Cap', aggressive: 'SBI Small Cap + Quant Mid Cap' },
  debt: { conservative: 'PPF + RBI Floating Rate Bond', moderate: 'HDFC Short Duration Fund', aggressive: 'ICICI Corporate Bond' },
  gold: { conservative: 'Sovereign Gold Bond', moderate: 'Sovereign Gold Bond', aggressive: 'Gold ETF (Nippon Gold BeES)' },
}

const COLORS = { equity: '#34d399', debt: '#60a5fa', gold: '#fbbf24' }

export default function AdvisorDashboard() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [age, setAge] = useState(28)
  const [income, setIncome] = useState(85000)
  const [expenses, setExpenses] = useState(40000)
  const [risk, setRisk] = useState('moderate')
  const [emergencyFund, setEmergencyFund] = useState(50000)
  const [step, setStep] = useState(1)

  const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0
  const emergencyTarget = expenses * 6
  const emergencyGap = Math.max(0, emergencyTarget - emergencyFund)
  const investable = Math.max(0, savings - (emergencyGap > 0 ? Math.min(savings * 0.5, emergencyGap) : 0))
  const allocation = ALLOCATION_MAP[risk]

  // 10-year wealth projection
  const projection = useMemo(() => {
    const rates = { equity: 0.12, debt: 0.07, gold: 0.09 }
    let fv = 0
    const invested = investable * 12 * 10
    Object.entries(allocation).forEach(([asset, pct]) => {
      const sip = investable * pct / 100
      const mr = rates[asset] / 12
      let bal = 0
      for (let i = 0; i < 120; i++) bal = (bal + sip) * (1 + mr)
      fv += bal
    })
    return { invested, fv: Math.round(fv), gain: Math.round(fv - invested), multiplier: invested > 0 ? (fv / invested).toFixed(1) : '0' }
  }, [investable, allocation])

  // Recommendations
  const recs = useMemo(() => {
    const list = []
    if (emergencyGap > 0) {
      list.push({ icon: '🚨', title: 'Build Emergency Fund', priority: 'critical',
        detail: `Need ${fmt(emergencyTarget)} (6 months). Gap: ${fmt(emergencyGap)}. Park in Liquid Fund.` })
    }
    if (age < 45) {
      list.push({ icon: '🛡️', title: 'Get Term Insurance', priority: 'high',
        detail: `₹${Math.round(income * 12 * 15 / 10000000)} Cr cover. Cost ~₹800/month. Protect your family.` })
    }
    list.push({ icon: '💊', title: 'Health Insurance', priority: 'high',
      detail: '₹10L family floater. Medical inflation is 14%/yr. One hospital stay = 6 months savings.' })
    if (investable > 0) {
      Object.entries(allocation).forEach(([asset, pct]) => {
        const amt = Math.round(investable * pct / 100)
        if (amt >= 500) {
          list.push({ icon: asset === 'equity' ? '📈' : asset === 'debt' ? '🏦' : '🥇',
            title: `Invest ${fmt(amt)}/mo in ${asset.charAt(0).toUpperCase() + asset.slice(1)}`,
            priority: 'medium',
            detail: `${INSTRUMENTS[asset][risk]} — ${pct}% of your investable surplus.` })
        }
      })
    }
    if (savingsRate < 20) {
      list.push({ icon: '⚠️', title: 'Low Savings Rate', priority: 'critical',
        detail: `Only ${savingsRate}% saved. Target at least 30%. Review subscriptions & dining out.` })
    }
    return list
  }, [age, income, expenses, risk, emergencyGap, investable, allocation, savingsRate])

  const priorityColor = { critical: 'var(--cosmos-400)', high: 'var(--amber-400)', medium: 'var(--emerald-400)' }

  return (
    <div className="page" id="advisor-page">
      <div className="page-header">
        <h1 className="page-title">AI Advisor</h1>
        <p className="page-subtitle">Personalized financial plan</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3].map(s => (
          <div key={s} onClick={() => setStep(s)} style={{
            width: step === s ? 32 : 10, height: 10, borderRadius: 5, cursor: 'pointer',
            background: step >= s ? 'var(--accent-primary)' : 'var(--glass-border)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ═══ STEP 1: PROFILE ═══ */}
      {step === 1 && (
        <>
          <div className="section-card">
            <h2 className="section-title">📋 Your Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Age: <strong style={{ color: 'var(--text-primary)' }}>{age}</strong>
                <input type="range" min="18" max="60" value={age} onChange={e => setAge(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Monthly Income: <strong style={{ color: 'var(--text-primary)' }}>{fmt(income)}</strong>
                <input type="range" min="15000" max="500000" step="5000" value={income} onChange={e => setIncome(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Monthly Expenses: <strong style={{ color: 'var(--text-primary)' }}>{fmt(expenses)}</strong>
                <input type="range" min="5000" max="300000" step="5000" value={expenses} onChange={e => setExpenses(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
              <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Emergency Fund: <strong style={{ color: 'var(--text-primary)' }}>{fmt(emergencyFund)}</strong>
                <input type="range" min="0" max="1000000" step="10000" value={emergencyFund} onChange={e => setEmergencyFund(+e.target.value)}
                  style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent-primary)' }} />
              </label>
            </div>
          </div>

          {/* Savings summary */}
          <div className="cf-summary-grid">
            <div className="cf-card cf-income">
              <span className="cf-card-label">Savings</span>
              <span className="cf-card-value" style={{ fontSize: 18 }}>{fmt(savings)}</span>
              <span className="cf-card-tag">{savingsRate}% rate</span>
            </div>
            <div className="cf-card cf-net">
              <span className="cf-card-label">Emergency</span>
              <span className="cf-card-value" style={{ fontSize: 18, color: emergencyGap > 0 ? 'var(--cosmos-400)' : 'var(--emerald-400)' }}>
                {emergencyGap > 0 ? `Gap: ${fmt(emergencyGap)}` : '✅ Covered'}
              </span>
              <span className="cf-card-tag">Target: {fmt(emergencyTarget)}</span>
            </div>
          </div>

          <button className="cf-action-btn" style={{ width: '100%', marginTop: 8, padding: '14px', fontSize: 15, fontWeight: 600 }}
            onClick={() => setStep(2)}>
            Next: Choose Risk Profile →
          </button>
        </>
      )}

      {/* ═══ STEP 2: RISK PROFILE ═══ */}
      {step === 2 && (
        <>
          <div className="section-card">
            <h2 className="section-title">🎯 Risk Tolerance</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {RISK_PROFILES.map(r => (
                <div key={r.key} onClick={() => setRisk(r.key)} style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${risk === r.key ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  background: risk === r.key ? 'rgba(139, 92, 246, 0.1)' : 'var(--glass-bg)',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation preview */}
          <div className="section-card">
            <h2 className="section-title">Recommended Allocation</h2>
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 32, marginTop: 12 }}>
              {Object.entries(allocation).map(([asset, pct]) => (
                <div key={asset} style={{
                  width: `${pct}%`, background: COLORS[asset],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#000',
                }}>
                  {asset.charAt(0).toUpperCase() + asset.slice(1)} {pct}%
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
              {Object.entries(allocation).map(([asset, pct]) => (
                <div key={asset} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(investable * pct / 100)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{asset}/mo</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="cf-action-btn" style={{ flex: 1, padding: '14px' }} onClick={() => setStep(1)}>← Back</button>
            <button className="cf-action-btn" style={{ flex: 2, padding: '14px', fontSize: 15, fontWeight: 600 }} onClick={() => setStep(3)}>
              See Your Plan →
            </button>
          </div>
        </>
      )}

      {/* ═══ STEP 3: YOUR PLAN ═══ */}
      {step === 3 && (
        <>
          {/* Wealth Projection */}
          <div className="cf-summary-grid">
            <div className="cf-card cf-income">
              <span className="cf-card-label">10yr Invested</span>
              <span className="cf-card-value" style={{ fontSize: 17 }}>{fmt(projection.invested)}</span>
            </div>
            <div className="cf-card cf-net">
              <span className="cf-card-label">Projected Value</span>
              <span className="cf-card-value" style={{ fontSize: 17, color: 'var(--emerald-400)' }}>{fmt(projection.fv)}</span>
              <span className="cf-card-tag">{projection.multiplier}× multiplier</span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="section-card">
            <h2 className="section-title">🎯 Action Plan ({recs.length} steps)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {recs.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: priorityColor[r.priority] + '22', color: priorityColor[r.priority],
                        textTransform: 'uppercase',
                      }}>{r.priority}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Investment Plan */}
          <div className="section-card">
            <h2 className="section-title">📅 Monthly Investment Plan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {Object.entries(allocation).map(([asset, pct]) => {
                const amt = Math.round(investable * pct / 100)
                if (amt < 500) return null
                return (
                  <div key={asset} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {asset === 'equity' ? '📈' : asset === 'debt' ? '🏦' : '🥇'} {asset.charAt(0).toUpperCase() + asset.slice(1)} ({pct}%)
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{INSTRUMENTS[asset][risk]}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--emerald-400)' }}>{fmt(amt)}</div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>Total Monthly SIP</span>
                <span style={{ color: 'var(--accent-primary)', fontSize: 16 }}>{fmt(investable)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="cf-action-btn" style={{ flex: 1, padding: '14px' }} onClick={() => setStep(2)}>← Back</button>
            <button className="cf-action-btn" style={{ flex: 2, padding: '14px' }} onClick={() => navigate('/portfolio-dashboard')}>
              📈 View Portfolio
            </button>
          </div>
        </>
      )}
    </div>
  )
}
