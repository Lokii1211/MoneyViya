import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR, getCategoryIcon, getCategoryColor } from '../lib/utils'
import { ArrowLeft, Share2, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekRange(offset = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek + (offset * 7))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export default function WeeklyReport() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone) return
    setLoading(true)
    api.getTransactions(phone, 100).then(txns => {
      setTransactions(txns || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [phone])

  const thisWeek = getWeekRange(0)
  const lastWeek = getWeekRange(-1)

  const thisWeekTxns = useMemo(() =>
    transactions.filter(t => { const d = new Date(t.created_at); return d >= thisWeek.start && d <= thisWeek.end }),
    [transactions, thisWeek.start, thisWeek.end]
  )
  const lastWeekTxns = useMemo(() =>
    transactions.filter(t => { const d = new Date(t.created_at); return d >= lastWeek.start && d <= lastWeek.end }),
    [transactions, lastWeek.start, lastWeek.end]
  )

  const thisExpenses = thisWeekTxns.filter(t => t.type === 'expense')
  const lastExpenses = lastWeekTxns.filter(t => t.type === 'expense')
  const thisTotal = thisExpenses.reduce((s, t) => s + Number(t.amount), 0)
  const lastTotal = lastExpenses.reduce((s, t) => s + Number(t.amount), 0)
  const thisIncome = thisWeekTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const change = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0

  // Daily bars for this week
  const dailyBars = useMemo(() => {
    const bars = DAY_NAMES.map((name, i) => {
      const date = new Date(thisWeek.start)
      date.setDate(date.getDate() + i)
      const dayStr = date.toISOString().split('T')[0]
      const amount = thisExpenses.filter(t => t.created_at?.startsWith(dayStr)).reduce((s, t) => s + Number(t.amount), 0)
      return { name, amount, isToday: dayStr === new Date().toISOString().split('T')[0] }
    })
    return bars
  }, [thisWeek.start, thisExpenses])

  const maxDailyBar = Math.max(...dailyBars.map(d => d.amount), 1)

  // Top categories this week
  const topCategories = useMemo(() => {
    const map = {}
    thisExpenses.forEach(t => {
      const cat = t.category || 'Other'
      map[cat] = (map[cat] || 0) + Number(t.amount)
    })
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [thisExpenses])

  // Compare categories with last week
  const lastCatMap = useMemo(() => {
    const map = {}
    lastExpenses.forEach(t => { const cat = t.category || 'Other'; map[cat] = (map[cat] || 0) + Number(t.amount) })
    return map
  }, [lastExpenses])

  // Generate insights
  const insights = useMemo(() => {
    const result = []
    if (change > 10) result.push({ icon: '📈', text: `Spending is up ${change}% compared to last week. Review non-essential purchases.`, type: 'warning' })
    else if (change < -10) result.push({ icon: '📉', text: `Great! Spending is down ${Math.abs(change)}% from last week.`, type: 'positive' })
    else if (lastTotal > 0) result.push({ icon: '📊', text: `Spending is steady compared to last week (${change >= 0 ? '+' : ''}${change}%).`, type: 'neutral' })

    topCategories.slice(0, 2).forEach(cat => {
      const lastAmt = lastCatMap[cat.name] || 0
      if (lastAmt > 0) {
        const catChange = Math.round(((cat.amount - lastAmt) / lastAmt) * 100)
        if (catChange > 20) result.push({ icon: '⚠️', text: `${cat.name} spending jumped ${catChange}% this week (${formatINR(cat.amount)} vs ${formatINR(lastAmt)}).`, type: 'warning' })
        else if (catChange < -20) result.push({ icon: '✅', text: `${cat.name} spending dropped ${Math.abs(catChange)}% this week. Keep it up!`, type: 'positive' })
      }
    })

    if (thisIncome > 0 && thisTotal > 0) {
      const rate = Math.round(((thisIncome - thisTotal) / thisIncome) * 100)
      if (rate > 0) result.push({ icon: '💰', text: `You saved ${rate}% of your income this week.`, type: 'positive' })
    }

    if (result.length === 0) result.push({ icon: '📊', text: 'Track more expenses to get personalized insights.', type: 'neutral' })
    return result
  }, [change, topCategories, lastCatMap, thisIncome, thisTotal, lastTotal])

  const periodLabel = `${thisWeek.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${thisWeek.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const shareReport = () => {
    const name = user?.name || 'User'
    const text = `${name}'s Weekly Report (${periodLabel})\n\nSpent: ${formatINR(thisTotal)}\nIncome: ${formatINR(thisIncome)}\nVs last week: ${change >= 0 ? '+' : ''}${change}%\n\nPowered by Viya`
    if (navigator.share) navigator.share({ title: 'Weekly Report', text })
    else { navigator.clipboard.writeText(text); toast.show('Report copied!', 'success') }
  }

  if (loading) return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ height: 20, width: 160, background: 'var(--bg-secondary)', borderRadius: 8 }} />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 70, background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  )

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }}><ArrowLeft size={20} /></button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Weekly Report</h2>
        </div>
        <button onClick={shareReport} style={{ padding: '6px 12px', background: 'var(--primary-dim)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 10, color: 'var(--primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Share2 size={14} /> Share
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
        <Calendar size={14} color="var(--text3)" />
        <span style={{ fontSize: 13, color: 'var(--text3, var(--text-tertiary))', fontWeight: 600 }}>{periodLabel}</span>
      </div>

      {thisWeekTxns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <BarChart3 size={48} style={{ color: 'var(--text3)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No data this week</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Start tracking expenses to see your weekly report.</p>
        </div>
      ) : (
        <>
          {/* Week-over-Week Comparison */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text3, var(--text-tertiary))', fontWeight: 700, marginBottom: 4 }}>THIS WEEK</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: 'var(--cosmos-400)' }}>{formatINR(thisTotal)}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text3, var(--text-tertiary))', fontWeight: 700, marginBottom: 4 }}>LAST WEEK</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: 'var(--text2, var(--text-secondary))' }}>{formatINR(lastTotal)}</div>
            </div>
          </div>

          {/* Change Indicator */}
          {lastTotal > 0 && (
            <div style={{ background: change > 0 ? 'rgba(255,82,82,0.08)' : 'rgba(0,208,132,0.08)', border: `1px solid ${change > 0 ? 'rgba(255,82,82,0.2)' : 'rgba(0,208,132,0.2)'}`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              {change > 0 ? <TrendingUp size={16} color="#FF5252" /> : <TrendingDown size={16} color="var(--primary)" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: change > 0 ? '#FF5252' : 'var(--primary)' }}>
                {change > 0 ? '+' : ''}{change}% vs last week
              </span>
            </div>
          )}

          {/* Daily Spending Bars */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Daily Spending</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
              {dailyBars.map((d, i) => {
                const h = d.amount > 0 ? Math.max((d.amount / maxDailyBar) * 100, 6) : 4
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3, var(--text-tertiary))', minHeight: 14 }}>
                      {d.amount > 0 ? formatINR(d.amount).replace('₹', '') : ''}
                    </div>
                    <div style={{
                      width: '100%', height: h, borderRadius: 6,
                      background: d.isToday ? 'var(--primary)' : d.amount > 0 ? 'var(--cosmos-400)' : 'var(--bg-secondary)',
                      opacity: d.amount > 0 ? 1 : 0.3, transition: 'height 0.4s ease',
                    }} />
                    <div style={{ fontSize: 11, fontWeight: d.isToday ? 700 : 500, color: d.isToday ? 'var(--primary)' : 'var(--text3, var(--text-tertiary))' }}>{d.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top Categories</div>
              {topCategories.map((cat, i) => {
                const pct = thisTotal > 0 ? Math.round((cat.amount / thisTotal) * 100) : 0
                const lastAmt = lastCatMap[cat.name] || 0
                return (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))', borderRadius: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{getCategoryIcon(cat.name)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700 }}>{formatINR(cat.amount)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: getCategoryColor(cat.name), transition: 'width 0.5s ease' }} />
                      </div>
                      {lastAmt > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text3, var(--text-tertiary))', marginTop: 2 }}>
                          Last week: {formatINR(lastAmt)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Insights */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Insights</div>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 12, marginBottom: 6,
                background: ins.type === 'warning' ? 'rgba(255,152,0,0.06)' : ins.type === 'positive' ? 'rgba(0,208,132,0.06)' : 'var(--bg-card, var(--surface))',
                borderLeft: `3px solid ${ins.type === 'warning' ? '#FF9800' : ins.type === 'positive' ? 'var(--primary)' : 'var(--text3, var(--text-tertiary))'}`,
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text2, var(--text-secondary))', lineHeight: 1.5 }}>{ins.text}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--text3, var(--text-tertiary))' }}>
            {thisWeekTxns.length} transactions this week
          </div>
        </>
      )}
    </div>
  )
}
