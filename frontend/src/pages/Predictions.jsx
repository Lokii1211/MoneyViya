// Predictions — AI spending forecasts
import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop, listItem } from '../animations/pageVariants'

const PREDICTIONS = [
  { category: 'Food', current: 8200, predicted: 12500, budget: 10000, trend: 'over', icon: '🍕' },
  { category: 'Transport', current: 3400, predicted: 4200, budget: 5000, trend: 'safe', icon: '🚗' },
  { category: 'Shopping', current: 5600, predicted: 7800, budget: 5000, trend: 'over', icon: '🛍️' },
  { category: 'Entertainment', current: 2100, predicted: 2800, budget: 3000, trend: 'safe', icon: '🎬' },
  { category: 'Bills', current: 4200, predicted: 4200, budget: 5000, trend: 'safe', icon: '📄' },
]

const UPCOMING_BILLS = [
  { name: 'Electricity', amount: 2400, due: '2026-05-15', icon: '⚡' },
  { name: 'WiFi', amount: 899, due: '2026-05-18', icon: '📡' },
  { name: 'Netflix', amount: 199, due: '2026-05-20', icon: '🎬' },
  { name: 'Phone', amount: 599, due: '2026-05-25', icon: '📱' },
]

export default function Predictions() {
  const totalPredicted = PREDICTIONS.reduce((s, p) => s + p.predicted, 0)
  const totalBudget = PREDICTIONS.reduce((s, p) => s + p.budget, 0)
  const overBudget = PREDICTIONS.filter(p => p.trend === 'over')
  const savingsEstimate = totalBudget - totalPredicted

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Predictions</h1>
          <p className="body-s text-secondary">AI forecasts for this month 🔮</p>
        </div>

        {/* Forecast Card */}
        <motion.div variants={cardPop} initial="initial" animate="animate"
          style={{
            padding: 24, marginBottom: 20, borderRadius: 'var(--radius-2xl)',
            background: 'linear-gradient(135deg, #1a237e, #283593, #3949ab)',
            color: 'white', textAlign: 'center', boxShadow: '0 8px 32px rgba(26,35,126,0.4)',
          }}>
          <Brain size={28} style={{ marginBottom: 8, opacity: 0.8 }} />
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Predicted Month-End Spending</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>₹{totalPredicted.toLocaleString()}</div>
          <div style={{ fontSize: 13, marginTop: 4, color: savingsEstimate >= 0 ? '#81C784' : '#EF5350' }}>
            {savingsEstimate >= 0 ? `🎯 ₹${savingsEstimate.toLocaleString()} under budget` : `⚠️ ₹${Math.abs(savingsEstimate).toLocaleString()} over budget`}
          </div>
          {overBudget.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
              ⚠️ {overBudget.length} categories predicted to exceed budget
            </div>
          )}
        </motion.div>

        {/* Category Predictions */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} /> Category Forecasts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {PREDICTIONS.map((pred, i) => (
            <motion.div key={pred.category} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{pred.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{pred.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Now: ₹{pred.current.toLocaleString()} → End: ₹{pred.predicted.toLocaleString()}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                  color: pred.trend === 'over' ? '#F44336' : '#4CAF50',
                  background: pred.trend === 'over' ? '#F4433618' : '#4CAF5018',
                }}>
                  {pred.trend === 'over' ? 'Over' : 'Safe'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Bills */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} /> Upcoming Bills
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {UPCOMING_BILLS.map((bill, i) => (
            <motion.div key={bill.name} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{bill.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{bill.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Due {new Date(bill.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>₹{bill.amount.toLocaleString()}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
