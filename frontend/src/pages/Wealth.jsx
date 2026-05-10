import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { TrendingUp, TrendingDown, PiggyBank, Landmark, BarChart3, Plus, ChevronRight, ArrowUpRight, Shield } from 'lucide-react'
import { formatINR } from '../lib/utils'

const typeConfig = {
  mutual_fund: { emoji: '📈', color: 'var(--viya-primary-500)', label: 'Mutual Fund' },
  stock: { emoji: '📊', color: 'var(--viya-violet-500)', label: 'Stock' },
  fd: { emoji: '🏦', color: 'var(--viya-gold-500)', label: 'Fixed Deposit' },
  ppf: { emoji: '🛡️', color: 'var(--viya-success)', label: 'PPF' },
  nps: { emoji: '🏛️', color: '#0091FF', label: 'NPS' },
  gold: { emoji: '🥇', color: '#FFB800', label: 'Gold' },
  crypto: { emoji: '₿', color: '#F7931A', label: 'Crypto' },
}

export default function Wealth() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const data = await api.getInvestments(phone)
      if (data?.length) setInvestments(data)
    } catch (e) { console.error('Wealth load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  // Compute portfolio from real data
  const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount || 0), 0)
  const currentValue = investments.reduce((s, i) => s + Number(i.current_value || i.invested_amount || 0), 0)
  const returns = currentValue - totalInvested
  const returnPct = totalInvested > 0 ? ((returns / totalInvested) * 100).toFixed(1) : 0

  // Group by type
  const grouped = investments.reduce((acc, inv) => {
    const t = inv.investment_type || 'other'
    if (!acc[t]) acc[t] = []
    acc[t].push(inv)
    return acc
  }, {})

  const allocationData = Object.entries(grouped).map(([type, items]) => ({
    type,
    ...(typeConfig[type] || { emoji: '💰', color: 'var(--text-secondary)', label: type }),
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
  ]

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Wealth</h1>
          <p className="body-s text-secondary">Grow your money smartly 📈</p>
        </div>
        <button onClick={() => nav('/chat?q=investment+advice')} style={{
          padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
          background: 'var(--gradient-wealth)', color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
        }}>Ask Viya 🧠</button>
      </div>

      {/* Net Worth Hero */}
      <div style={{
        background: 'var(--gradient-wealth)', borderRadius: 'var(--radius-2xl)', padding: 24,
        marginBottom: 16, color: 'white', boxShadow: '0 8px 24px rgba(76,175,80,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Portfolio</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 36, marginBottom: 4 }}>
          ₹{currentValue}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 16 }}>
          {returns >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
          <span style={{ fontWeight: 600 }}>{returns >= 0 ? '+' : ''}₹{returns}</span>
          <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600 }}>
            {returns >= 0 ? '+' : ''}{returnPct}%
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>Invested</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 15 }}>₹{totalInvested}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>Active SIPs</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 15 }}>{sipInvestments.length}</div>
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No investments tracked yet</div>
          <div style={{ fontSize: 13 }}>Tell Viya: "I have a SIP in Axis Bluechip Fund of ₹5000/month"</div>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
                transition: 'all 0.2s', cursor: 'pointer', border: 'none',
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              {/* Allocation Breakdown */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 20,
                border: '1px solid var(--border-light)', marginBottom: 16,
              }}>
                <div className="title-m" style={{ fontSize: 15, marginBottom: 14 }}>Asset Allocation</div>
                <div style={{ display: 'flex', gap: 2, height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                  {allocationData.map((a, i) => (
                    <div key={i} style={{ width: `${a.pct}%`, background: a.color, transition: 'width 0.6s ease' }} />
                  ))}
                </div>
                {allocationData.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < allocationData.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.pct}% of portfolio</div>
                    </div>
                    <div className="num-s" style={{ fontWeight: 600 }}>₹{a.total}</div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div onClick={() => setTab('sip')} style={{
                  background: 'var(--viya-primary-50)', borderRadius: 'var(--radius-lg)', padding: 16,
                  border: '1px solid var(--viya-primary-200)', cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--viya-primary-600)', marginBottom: 4 }}>Active SIPs</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 24, color: 'var(--viya-primary-600)' }}>
                    {sipInvestments.length}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--viya-primary-500)', marginTop: 2 }}>
                    ₹{totalSIP}/mo
                  </div>
                </div>
                <div style={{
                  background: 'var(--viya-gold-100)', borderRadius: 'var(--radius-lg)', padding: 16,
                  border: '1px solid var(--viya-gold-200)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--viya-gold-500)', marginBottom: 4 }}>Holdings</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 24, color: 'var(--viya-gold-500)' }}>{investments.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--viya-gold-500)', marginTop: 2 }}>Total assets</div>
                </div>
              </div>
            </>
          )}

          {tab === 'holdings' && (
            <div style={{ marginBottom: 16 }}>
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: typeConfig[type]?.color || 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{typeConfig[type]?.emoji || '💰'}</span> {typeConfig[type]?.label || type}s
                  </div>
                  {items.map((inv) => {
                    const retPct = Number(inv.return_pct || 0)
                    return (
                      <div key={inv.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                        borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)', cursor: 'pointer',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, background: (typeConfig[type]?.color || '#999') + '15',
                          color: typeConfig[type]?.color || '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>{typeConfig[type]?.emoji || '💰'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</div>
                          <div className="body-s text-secondary">
                            Invested: ₹{Number(inv.invested_amount)}
                            {inv.broker && ` · ${inv.broker}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num-s" style={{ fontWeight: 700, fontSize: 14 }}>₹{Number(inv.current_value || inv.invested_amount)}</div>
                          <div style={{
                            fontSize: 12, fontWeight: 600,
                            color: retPct >= 0 ? 'var(--viya-success)' : 'var(--viya-error)',
                            display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end',
                          }}>
                            {retPct >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                            {retPct >= 0 ? '+' : ''}{retPct}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {tab === 'sip' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                background: 'var(--gradient-card)', borderRadius: 'var(--radius-xl)', padding: 20,
                border: '1px solid var(--border-light)', marginBottom: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--viya-primary-600)', marginBottom: 4 }}>Monthly SIP Investment</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 32, color: 'var(--viya-primary-600)' }}>
                  ₹{totalSIP}
                </div>
                <div className="body-s text-secondary" style={{ marginTop: 4 }}>
                  ₹{(totalSIP * 12)}/year
                </div>
              </div>

              {sipInvestments.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>No SIPs tracked. Tell Viya: "Track my SIP of ₹5000 in Axis Bluechip" 📈</div>
              )}

              {sipInvestments.map(inv => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                  borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'var(--viya-primary-500)15',
                    color: 'var(--viya-primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>📈</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</div>
                    <div className="body-s text-secondary">{inv.broker || 'N/A'} · Active SIP</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num-s" style={{ fontWeight: 700, color: 'var(--viya-primary-600)' }}>₹{Number(inv.sip_amount || 0)}/mo</div>
                    <div style={{ fontSize: 11, color: 'var(--viya-success)', fontWeight: 600 }}>+{inv.return_pct || 0}%</div>
                  </div>
                </div>
              ))}

              <button onClick={() => nav('/chat?q=suggest+best+SIP+funds')} style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                background: 'var(--gradient-primary)', color: 'white', border: 'none',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8,
                boxShadow: 'var(--shadow-teal)',
              }}>+ Start New SIP with AI Guidance</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
