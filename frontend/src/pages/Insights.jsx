import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR, getCategoryIcon, getCategoryColor } from '../lib/utils'
import { ArrowLeft, TrendingUp, TrendingDown, PieChart, Target, Lightbulb, BarChart3 } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop, listItem } from '../animations/pageVariants'

export default function Insights() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone) return
    setLoading(true)
    api.getTransactions(phone, 300).then(txns => {
      setTransactions(txns || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [phone])

  const now = new Date()
  const thisMonthPrefix = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthPrefix = lastMonth.toISOString().slice(0, 7)

  const thisMonthTxns = useMemo(() => transactions.filter(t => t.created_at?.startsWith(thisMonthPrefix)), [transactions, thisMonthPrefix])
  const lastMonthTxns = useMemo(() => transactions.filter(t => t.created_at?.startsWith(lastMonthPrefix)), [transactions, lastMonthPrefix])

  const thisExpenses = thisMonthTxns.filter(t => t.type === 'expense')
  const lastExpenses = lastMonthTxns.filter(t => t.type === 'expense')
  const thisTotal = thisExpenses.reduce((s, t) => s + Number(t.amount), 0)
  const lastTotal = lastExpenses.reduce((s, t) => s + Number(t.amount), 0)
  const thisIncome = thisMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

  const spendingChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const predictedMonthEnd = dayOfMonth > 0 ? Math.round((thisTotal / dayOfMonth) * daysInMonth) : thisTotal
  const savingsPotential = thisIncome > 0 ? Math.max(thisIncome - predictedMonthEnd, 0) : 0

  // Category analysis
  const thisCatMap = useMemo(() => {
    const map = {}
    thisExpenses.forEach(t => { const c = t.category || 'Other'; map[c] = (map[c] || 0) + Number(t.amount) })
    return map
  }, [thisExpenses])

  const lastCatMap = useMemo(() => {
    const map = {}
    lastExpenses.forEach(t => { const c = t.category || 'Other'; map[c] = (map[c] || 0) + Number(t.amount) })
    return map
  }, [lastExpenses])

  // Top changed category
  const topCategoryChange = useMemo(() => {
    let maxChange = { name: '', change: 0, thisAmt: 0, lastAmt: 0 }
    Object.keys(thisCatMap).forEach(cat => {
      const last = lastCatMap[cat] || 0
      if (last > 0) {
        const pctChange = Math.round(((thisCatMap[cat] - last) / last) * 100)
        if (Math.abs(pctChange) > Math.abs(maxChange.change)) {
          maxChange = { name: cat, change: pctChange, thisAmt: thisCatMap[cat], lastAmt: last }
        }
      }
    })
    return maxChange
  }, [thisCatMap, lastCatMap])

  // Category breakdown sorted
  const categories = useMemo(() =>
    Object.entries(thisCatMap).map(([name, amount]) => ({
      name, amount, pct: thisTotal > 0 ? Math.round((amount / thisTotal) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount),
    [thisCatMap, thisTotal]
  )

  // Build insight cards
  const insightCards = useMemo(() => {
    const cards = []

    // 1. Spending trend
    if (lastTotal > 0) {
      const isUp = spendingChange > 0
      cards.push({
        icon: isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
        iconColor: isUp ? '#FF5252' : '#4CAF50',
        title: isUp ? 'Spending is Up' : 'Spending is Down',
        description: `You've spent ${formatINR(thisTotal)} this month, which is ${Math.abs(spendingChange)}% ${isUp ? 'more' : 'less'} than last month's ${formatINR(lastTotal)}.`,
        trend: isUp ? 'negative' : 'positive',
      })
    }

    // 2. Top category change
    if (topCategoryChange.name && Math.abs(topCategoryChange.change) > 10) {
      const isUp = topCategoryChange.change > 0
      cards.push({
        icon: <span style={{ fontSize: 20 }}>{getCategoryIcon(topCategoryChange.name)}</span>,
        iconColor: isUp ? '#FF9800' : '#4CAF50',
        title: `${topCategoryChange.name} ${isUp ? 'Surge' : 'Drop'}`,
        description: `${topCategoryChange.name} is ${isUp ? 'up' : 'down'} ${Math.abs(topCategoryChange.change)}%: ${formatINR(topCategoryChange.thisAmt)} vs ${formatINR(topCategoryChange.lastAmt)} last month.`,
        trend: isUp ? 'warning' : 'positive',
      })
    }

    // 3. Predicted month-end
    if (thisTotal > 0) {
      cards.push({
        icon: <Target size={20} />,
        iconColor: '#2196F3',
        title: 'Month-End Forecast',
        description: `At your current pace, you'll spend ${formatINR(predictedMonthEnd)} by month end.${thisIncome > 0 ? ` That's ${Math.round((predictedMonthEnd / thisIncome) * 100)}% of your income.` : ''}`,
        trend: thisIncome > 0 && predictedMonthEnd > thisIncome ? 'negative' : 'neutral',
      })
    }

    // 4. Savings potential
    if (savingsPotential > 0) {
      cards.push({
        icon: <Lightbulb size={20} />,
        iconColor: '#FF9800',
        title: 'Savings Potential',
        description: `If you maintain current spending, you could save ${formatINR(savingsPotential)} this month. ${savingsPotential > thisIncome * 0.2 ? 'That\'s a solid savings rate!' : 'Try to cut 1-2 non-essential expenses.'}`,
        trend: 'positive',
      })
    }

    if (cards.length === 0) {
      cards.push({
        icon: <BarChart3 size={20} />,
        iconColor: 'var(--text3)',
        title: 'Not Enough Data',
        description: 'Keep tracking your expenses for at least a month to see spending insights and predictions.',
        trend: 'neutral',
      })
    }

    return cards
  }, [spendingChange, topCategoryChange, predictedMonthEnd, savingsPotential, thisTotal, lastTotal, thisIncome])

  const trendColors = { positive: 'rgba(0,208,132,0.08)', negative: 'rgba(255,82,82,0.08)', warning: 'rgba(255,152,0,0.08)', neutral: 'var(--bg-card, var(--surface))' }
  const trendBorders = { positive: 'rgba(0,208,132,0.2)', negative: 'rgba(255,82,82,0.2)', warning: 'rgba(255,152,0,0.2)', neutral: 'var(--border-light, var(--border))' }

  if (loading) return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ height: 28, width: 120, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 6 }} />
        <div style={{ height: 16, width: 200, background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 120, background: 'var(--bg-secondary)', borderRadius: 18, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 90, background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </PageTransition>
  )

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Insights</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3, var(--text-tertiary))', marginBottom: 20, paddingLeft: 32 }}>AI-powered spending analytics</p>

        {/* Total Spending Card */}
        <motion.div variants={cardPop} initial="initial" animate="animate"
          style={{ padding: 20, marginBottom: 20, background: 'var(--gradient-night, linear-gradient(135deg, #1a1a2e, #16213e))', color: 'white', borderRadius: 18 }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Total Spent This Month</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 6 }}>{formatINR(thisTotal)}</div>
          {lastTotal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              {spendingChange > 0 ? <TrendingUp size={14} color="#FF5252" /> : <TrendingDown size={14} color="#4CAF50" />}
              <span style={{ color: spendingChange > 0 ? '#FF5252' : '#4CAF50' }}>
                {Math.abs(spendingChange)}% {spendingChange > 0 ? 'more' : 'less'} than last month
              </span>
            </div>
          )}
        </motion.div>

        {/* Insight Cards */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Key Insights</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {insightCards.map((card, i) => (
            <motion.div key={i} variants={listItem} initial="initial" animate="animate"
              transition={{ delay: i * 0.1 }}
              style={{
                padding: 16, borderRadius: 14,
                background: trendColors[card.trend],
                border: `1px solid ${trendBorders[card.trend]}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.6)', color: card.iconColor, flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2, var(--text-secondary))', lineHeight: 1.5 }}>{card.description}</div>
              </div>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {card.trend === 'positive' && <TrendingDown size={16} color="#4CAF50" />}
                {card.trend === 'negative' && <TrendingUp size={16} color="#FF5252" />}
                {card.trend === 'warning' && <TrendingUp size={16} color="#FF9800" />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={16} /> Category Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {categories.map((cat, i) => (
                <motion.div key={cat.name} variants={listItem} initial="initial" animate="animate"
                  style={{ padding: 14, borderRadius: 12, background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{getCategoryIcon(cat.name)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3, var(--text-tertiary))' }}>{cat.pct}% of total</div>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{formatINR(cat.amount)}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      style={{ height: '100%', borderRadius: 3, background: getCategoryColor(cat.name) }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BarChart3 size={48} style={{ color: 'var(--text3)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No data yet</h3>
            <p style={{ fontSize: 13, color: 'var(--text3, var(--text-tertiary))' }}>Start tracking expenses to get spending insights.</p>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
