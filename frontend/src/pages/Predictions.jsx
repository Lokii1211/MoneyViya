import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, TrendingDown, Calendar, Loader2, AlertTriangle, Zap } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop, listItem } from '../animations/pageVariants'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'
import { formatINR, getCategoryIcon } from '../lib/utils'

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function getDayOfMonth(date) {
  return date.getDate()
}

function buildCategoryPredictions(transactions) {
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const dayOfMonth = getDayOfMonth(now)
  const daysInMonth = getDaysInMonth(now)

  // Group current month expenses by category
  const catSpending = {}
  const lastMonthCatSpending = {}

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = lastMonth.toISOString().slice(0, 7)

  transactions.forEach(t => {
    if (t.type !== 'expense') return
    const cat = t.category || 'Other'
    const monthKey = (t.created_at || '').slice(0, 7)

    if (monthKey === currentMonth) {
      catSpending[cat] = (catSpending[cat] || 0) + Number(t.amount)
    } else if (monthKey === lastMonthKey) {
      lastMonthCatSpending[cat] = (lastMonthCatSpending[cat] || 0) + Number(t.amount)
    }
  })

  // Build predictions
  const allCats = new Set([...Object.keys(catSpending), ...Object.keys(lastMonthCatSpending)])
  const predictions = []

  allCats.forEach(cat => {
    const currentSpend = catSpending[cat] || 0
    const lastMonthTotal = lastMonthCatSpending[cat] || 0
    const projectedEnd = dayOfMonth > 0 ? Math.round((currentSpend / dayOfMonth) * daysInMonth) : 0
    const willOverspend = lastMonthTotal > 0 && projectedEnd > lastMonthTotal * 1.1

    if (currentSpend > 0 || lastMonthTotal > 0) {
      predictions.push({
        category: cat,
        icon: getCategoryIcon(cat),
        currentSpend,
        projectedEnd,
        lastMonthTotal,
        willOverspend,
      })
    }
  })

  return predictions.sort((a, b) => b.projectedEnd - a.projectedEnd).slice(0, 6)
}

export default function Predictions() {
  const { phone } = useApp()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [bills, setBills] = useState([])
  const [prediction, setPrediction] = useState({
    totalSpentThisMonth: 0,
    projectedMonthEnd: 0,
    lastMonthTotal: 0,
    velocity: 0, // positive = spending faster, negative = slower
    daysLeft: 0,
    categoryPredictions: [],
  })

  useEffect(() => {
    if (!phone) return
    loadData()
  }, [phone])

  const loadData = async () => {
    setLoading(true)
    try {
      const [txns, billsData] = await Promise.all([
        api.getTransactions(phone, 300),
        api.getBills(phone),
      ])

      setTransactions(txns || [])
      setBills(billsData || [])

      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7)
      const dayOfMonth = getDayOfMonth(now)
      const daysInMonth = getDaysInMonth(now)
      const daysLeft = daysInMonth - dayOfMonth

      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthKey = lastMonth.toISOString().slice(0, 7)

      // Current month expenses
      const thisMonthExpenses = (txns || []).filter(t =>
        t.type === 'expense' && (t.created_at || '').startsWith(currentMonth)
      )
      const totalSpentThisMonth = thisMonthExpenses.reduce((s, t) => s + Number(t.amount), 0)

      // Last month expenses
      const lastMonthExpenses = (txns || []).filter(t =>
        t.type === 'expense' && (t.created_at || '').startsWith(lastMonthKey)
      )
      const lastMonthTotal = lastMonthExpenses.reduce((s, t) => s + Number(t.amount), 0)

      // Linear projection
      const projectedMonthEnd = dayOfMonth > 0
        ? Math.round((totalSpentThisMonth / dayOfMonth) * daysInMonth)
        : 0

      // Velocity: compare spending rate vs last month at this point
      const lastMonthDays = getDaysInMonth(lastMonth)
      const lastMonthRatePerDay = lastMonthTotal / lastMonthDays
      const thisMonthRatePerDay = dayOfMonth > 0 ? totalSpentThisMonth / dayOfMonth : 0
      const velocity = lastMonthRatePerDay > 0
        ? Math.round(((thisMonthRatePerDay - lastMonthRatePerDay) / lastMonthRatePerDay) * 100)
        : 0

      // Current month income
      const thisMonthIncome = (txns || []).filter(t =>
        t.type === 'income' && (t.created_at || '').startsWith(currentMonth)
      ).reduce((s, t) => s + Number(t.amount), 0)

      const predictedSavings = thisMonthIncome - projectedMonthEnd

      const categoryPredictions = buildCategoryPredictions(txns || [])

      setPrediction({
        totalSpentThisMonth,
        projectedMonthEnd,
        lastMonthTotal,
        velocity,
        daysLeft,
        predictedSavings,
        thisMonthIncome,
        categoryPredictions,
      })
    } catch (err) {
      console.error('Predictions load error:', err)
    }
    setLoading(false)
  }

  // Filter upcoming bills (due in the future)
  const upcomingBills = bills.filter(b => {
    if (!b.due_date) return false
    return new Date(b.due_date) >= new Date()
  }).slice(0, 6)

  const upcomingBillsTotal = upcomingBills.reduce((s, b) => s + Number(b.amount || 0), 0)

  if (loading) {
    return (
      <PageTransition>
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 size={28} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
        </div>
      </PageTransition>
    )
  }

  const hasData = transactions.length > 0
  const overBudgetCats = prediction.categoryPredictions.filter(c => c.willOverspend)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Predictions</h1>
          <p className="body-s text-secondary">AI forecasts for this month 🔮</p>
        </div>

        {!hasData ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
              No predictions yet
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Start logging your expenses and we'll predict your spending patterns, savings potential, and budget trends.
            </div>
          </motion.div>
        ) : (
          <>
            {/* Predicted Month-End Spending */}
            <motion.div
              variants={cardPop} initial="initial" animate="animate"
              style={{
                padding: 24, marginBottom: 16, borderRadius: 'var(--radius-2xl)',
                background: 'linear-gradient(135deg, #1a237e, #283593, #3949ab)',
                color: 'white', textAlign: 'center', boxShadow: '0 8px 32px rgba(26,35,126,0.4)',
              }}
            >
              <Brain size={28} style={{ marginBottom: 8, opacity: 0.8 }} />
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Predicted Month-End Spending</div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
                {formatINR(prediction.projectedMonthEnd)}
              </div>
              <div style={{
                fontSize: 13, marginTop: 6,
                color: prediction.predictedSavings >= 0 ? '#81C784' : '#EF5350',
              }}>
                {prediction.predictedSavings >= 0
                  ? `🎯 ${formatINR(prediction.predictedSavings)} predicted savings`
                  : `⚠️ ${formatINR(Math.abs(prediction.predictedSavings))} over income`
                }
              </div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>
                {prediction.daysLeft} days remaining this month
              </div>
            </motion.div>

            {/* Spending Velocity + Spent So Far */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card" style={{ padding: 16, textAlign: 'center' }}
              >
                <Zap size={20} style={{
                  color: prediction.velocity > 0 ? '#F44336' : '#4CAF50',
                  marginBottom: 6,
                }} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Spending Velocity</div>
                <div style={{
                  fontSize: 20, fontWeight: 700, fontFamily: "'Sora',sans-serif",
                  color: prediction.velocity > 0 ? '#F44336' : '#4CAF50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {prediction.velocity > 0 ? (
                    <><TrendingUp size={16} /> +{prediction.velocity}%</>
                  ) : prediction.velocity < 0 ? (
                    <><TrendingDown size={16} /> {prediction.velocity}%</>
                  ) : (
                    '0%'
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  vs last month's pace
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card" style={{ padding: 16, textAlign: 'center' }}
              >
                <TrendingUp size={20} style={{ color: 'var(--viya-primary-500)', marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Spent So Far</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
                  {formatINR(prediction.totalSpentThisMonth)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Last month: {formatINR(prediction.lastMonthTotal)}
                </div>
              </motion.div>
            </div>

            {/* Category Predictions */}
            {prediction.categoryPredictions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} /> Category Forecasts
                  {overBudgetCats.length > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                      background: 'rgba(244,67,54,0.1)', color: '#F44336', marginLeft: 'auto',
                    }}>
                      {overBudgetCats.length} over-trending
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prediction.categoryPredictions.map((pred, i) => (
                    <motion.div
                      key={pred.category}
                      variants={listItem} initial="initial" animate="animate"
                      transition={{ delay: i * 0.05 }}
                      className="card" style={{ padding: 14 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{pred.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{pred.category}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            Now: {formatINR(pred.currentSpend)} → End: {formatINR(pred.projectedEnd)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                            color: pred.willOverspend ? '#F44336' : '#4CAF50',
                            background: pred.willOverspend ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
                          }}>
                            {pred.willOverspend ? 'Over' : 'Safe'}
                          </span>
                          {pred.lastMonthTotal > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                              Last: {formatINR(pred.lastMonthTotal)}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Progress bar: current spend vs projected */}
                      {pred.projectedEnd > 0 && (
                        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((pred.currentSpend / pred.projectedEnd) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            style={{
                              height: '100%', borderRadius: 2,
                              background: pred.willOverspend
                                ? 'linear-gradient(90deg, #FF9800, #F44336)'
                                : 'linear-gradient(90deg, #4CAF50, #00B0B6)',
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} /> Upcoming Bills
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginLeft: 'auto',
                  }}>
                    Total: {formatINR(upcomingBillsTotal)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingBills.map((bill, i) => {
                    const dueDate = new Date(bill.due_date)
                    const daysUntil = Math.ceil((dueDate - new Date()) / 86400000)
                    const isUrgent = daysUntil <= 3

                    return (
                      <motion.div
                        key={bill.id || i}
                        variants={listItem} initial="initial" animate="animate"
                        transition={{ delay: i * 0.05 }}
                        className="card"
                        style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <span style={{ fontSize: 22 }}>{bill.icon || getCategoryIcon(bill.category || bill.name)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{bill.name || bill.title}</div>
                          <div style={{
                            fontSize: 12,
                            color: isUrgent ? '#F44336' : 'var(--text-tertiary)',
                            fontWeight: isUrgent ? 600 : 400,
                          }}>
                            {isUrgent && '⚠️ '}{daysUntil <= 0 ? 'Due today' : `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                            {' · '}{dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatINR(bill.amount)}</div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Spending Alert */}
            {prediction.velocity > 15 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: 16, borderRadius: 14, marginBottom: 16,
                  background: 'rgba(244,67,54,0.06)',
                  border: '1px solid rgba(244,67,54,0.15)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={20} style={{ color: '#F44336', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F44336', marginBottom: 4 }}>
                    Spending Alert
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    You're spending {prediction.velocity}% faster than last month at this point. Consider reviewing your expenses to stay on track.
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
