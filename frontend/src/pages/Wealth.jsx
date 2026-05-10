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
    { id: 'goals', label: 'Goals' },
    { id: 'tax', label: 'Tax' },
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

              {/* Time Range Tabs (PRD line 895) */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
                {['30D', '3M', '6M', '1Y', 'ALL'].map(r => (
                  <button key={r} style={{
                    padding: '5px 14px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
                    background: r === '30D' ? 'var(--gradient-wealth)' : 'transparent',
                    color: r === '30D' ? 'white' : 'var(--text-secondary)',
                    border: r === '30D' ? 'none' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }}>{r}</button>
                ))}
              </div>

              {/* Spending Donut Chart (PRD lines 900-904) */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 20,
                border: '1px solid var(--border-light)', marginBottom: 16, boxShadow: 'var(--sh-3)',
              }}>
                <div className="title-m" style={{ fontSize: 15, marginBottom: 14 }}>Spending Breakdown</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {/* SVG Donut */}
                  <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                    <svg width={140} height={140} viewBox="0 0 140 140">
                      {(() => {
                        const cats = [
                          { label: 'Food', pct: 28, color: '#FF5722' },
                          { label: 'Transport', pct: 18, color: '#0091FF' },
                          { label: 'Shopping', pct: 22, color: '#9C27B0' },
                          { label: 'Bills', pct: 20, color: '#FF5252' },
                          { label: 'Other', pct: 12, color: '#808080' },
                        ]
                        const r = 55, cx = 70, cy = 70, circ = 2 * Math.PI * r
                        let offset = 0
                        return cats.map((c, i) => {
                          const dash = (c.pct / 100) * circ
                          const el = (
                            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={c.color} strokeWidth={22}
                              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
                              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 0.6s ease' }} />
                          )
                          offset += dash
                          return el
                        })
                      })()}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 16 }}>₹14,320</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>spent</div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ flex: 1 }}>
                    {[
                      { label: 'Food', pct: 28, amt: '₹4,010', color: '#FF5722' },
                      { label: 'Transport', pct: 18, amt: '₹2,578', color: '#0091FF' },
                      { label: 'Shopping', pct: 22, amt: '₹3,150', color: '#9C27B0' },
                      { label: 'Bills', pct: 20, amt: '₹2,864', color: '#FF5252' },
                      { label: 'Other', pct: 12, amt: '₹1,718', color: '#808080' },
                    ].map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{c.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.pct}%</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--emerald-500)', marginTop: 6 }}>₹10,680 remaining</div>
                  </div>
                </div>
              </div>

              {/* Upcoming Events Timeline (PRD lines 906-913) */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
                border: '1px solid var(--border-light)', marginBottom: 16,
              }}>
                <div className="title-m" style={{ fontSize: 15, marginBottom: 12 }}>📅 Upcoming</div>
                {[
                  { date: 'Jun 14', icon: '🔴', text: 'Credit Card Due', amt: '₹12,400', action: 'Pay Now', color: 'var(--coral-500)' },
                  { date: 'Jun 15', icon: '💰', text: 'SIP Deduction', amt: '₹10,000', action: 'Auto', color: 'var(--emerald-500)' },
                  { date: 'Jun 24', icon: '📱', text: 'Jio Recharge', amt: '₹479', action: 'Recharge', color: 'var(--info-500)' },
                  { date: 'Jul 5', icon: '🏦', text: 'Home Loan EMI', amt: '₹22,000', action: 'Auto-debit', color: 'var(--amber-500)' },
                ].map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div style={{
                      padding: '2px 8px', borderRadius: 'var(--r-xs)', fontSize: 10, fontWeight: 700,
                      background: e.color + '15', color: e.color, whiteSpace: 'nowrap',
                    }}>{e.date}</div>
                    <span style={{ fontSize: 16 }}>{e.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.text}</div>
                    </div>
                    <div className="num-s" style={{ fontWeight: 600, fontSize: 13 }}>{e.amt}</div>
                    <div style={{
                      padding: '3px 8px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 600,
                      background: e.color, color: 'white',
                    }}>{e.action}</div>
                  </div>
                ))}
              </div>

              {/* Viya Insight Box (PRD lines 915-919) */}
              <div style={{
                background: 'var(--cosmos-50)', borderRadius: 'var(--r-lg)', padding: 16,
                border: '1.5px solid var(--cosmos-100)', marginBottom: 16,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cosmos-600)', marginBottom: 6 }}>💡 Viya's Insight</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Your food spending is 28% of total — that's ₹1,200 above last month. Consider meal-prepping on weekends to save ~₹3,000/month.
                </div>
                <button onClick={() => nav('/chat?q=reduce+food+spending')} style={{
                  padding: '6px 16px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                  background: 'none', color: 'var(--cosmos-500)', border: 'none', cursor: 'pointer',
                }}>Act on this →</button>
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

          {/* Goals Tab (PRD lines 920-940) */}
          {tab === 'goals' && (
            <div style={{ marginBottom: 16 }}>
              {/* Goal Cards */}
              {[
                { name: 'Emergency Fund', emoji: '🛡️', target: 300000, saved: 185000, color: '#00B0B6', deadline: 'Dec 2025' },
                { name: 'New Laptop', emoji: '💻', target: 85000, saved: 42000, color: '#6B00FF', deadline: 'Aug 2025' },
                { name: 'Goa Trip', emoji: '✈️', target: 40000, saved: 28000, color: '#FF9500', deadline: 'Jul 2025' },
              ].map((g, i) => {
                const pct = Math.round((g.saved / g.target) * 100)
                return (
                  <div key={i} style={{
                    background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
                    border: '1px solid var(--border-light)', marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{g.emoji}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Target: {g.deadline}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{pct}%</div>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--viya-neutral-100)', overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: g.color, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>₹{(g.saved / 1000).toFixed(0)}K saved</span>
                      <span style={{ fontWeight: 600 }}>₹{(g.target / 1000).toFixed(0)}K goal</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button onClick={() => nav(`/chat?q=add+money+to+${encodeURIComponent(g.name)}`)} style={{
                        padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                        background: g.color, color: 'white', border: 'none', cursor: 'pointer',
                      }}>+ Add Money</button>
                      <button style={{
                        padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                        background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', cursor: 'pointer',
                      }}>Edit Goal</button>
                    </div>
                  </div>
                )
              })}
              <button onClick={() => nav('/chat?q=create+new+savings+goal')} style={{
                width: '100%', padding: 14, borderRadius: 'var(--r-lg)',
                background: 'var(--gradient-primary)', color: 'white', border: 'none',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-teal)',
              }}>+ Create New Goal</button>
            </div>
          )}

          {/* Tax Tab (PRD lines 941-965) */}
          {tab === 'tax' && (
            <div style={{ marginBottom: 16 }}>
              {/* 80C Tracker */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 20,
                border: '1px solid var(--border-light)', marginBottom: 16,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Section 80C Tracker</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>FY 2024–25 · Limit: ₹1,50,000</div>
                <div style={{ height: 12, borderRadius: 99, background: 'var(--viya-neutral-100)', overflow: 'hidden', marginBottom: 12, display: 'flex' }}>
                  <div style={{ width: '40%', height: '100%', background: '#4CAF50' }} />
                  <div style={{ width: '20%', height: '100%', background: '#FF9800' }} />
                  <div style={{ width: '10%', height: '100%', background: '#9C27B0' }} />
                </div>
                {[
                  { section: 'ELSS (Mutual Funds)', amt: 60000, color: '#4CAF50' },
                  { section: 'PPF', amt: 30000, color: '#FF9800' },
                  { section: 'LIC Premium', amt: 15000, color: '#9C27B0' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{s.section}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13 }}>₹{(s.amt / 1000).toFixed(0)}K</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '8px 0', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Used: ₹1,05,000</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald-500)' }}>₹45,000 remaining</span>
                </div>
              </div>

              {/* Tax Estimate */}
              <div style={{
                background: 'var(--cosmos-50)', borderRadius: 'var(--r-lg)', padding: 16,
                border: '1.5px solid var(--cosmos-100)', marginBottom: 16,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cosmos-600)', marginBottom: 6 }}>💡 Tax Saving Tip</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 8 }}>
                  Invest ₹45,000 more in ELSS before March to save ~₹14,040 in tax (30% bracket).
                </div>
                <button onClick={() => nav('/chat?q=best+ELSS+funds+for+tax+saving')} style={{
                  padding: '6px 16px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                  background: 'var(--cosmos-400)', color: 'white', border: 'none', cursor: 'pointer',
                }}>Show ELSS Options →</button>
              </div>

              {/* Other Sections */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Other Deductions</div>
              {[
                { section: '80D (Health Insurance)', limit: '₹25,000', used: '₹18,500', pct: 74, color: '#FF6B6B' },
                { section: '80E (Education Loan)', limit: 'No limit', used: '₹48,000', pct: 100, color: '#0091FF' },
                { section: 'HRA Exemption', limit: '₹2,40,000', used: '₹2,40,000', pct: 100, color: '#4CAF50' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
                  border: '1px solid var(--border-light)', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.section}</span>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.used}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--viya-neutral-100)', overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 99, background: s.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Limit: {s.limit}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
