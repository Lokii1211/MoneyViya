// Insights — Deep spending analytics with AI
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart3, PieChart, ArrowRight } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop, listItem } from '../animations/pageVariants'

const CATEGORIES = [
  { name: 'Food', amount: 8200, budget: 10000, pct: 82, color: '#FF5722', icon: '🍕' },
  { name: 'Transport', amount: 3400, budget: 5000, pct: 68, color: '#2196F3', icon: '🚗' },
  { name: 'Shopping', amount: 5600, budget: 5000, pct: 112, color: '#E91E63', icon: '🛍️' },
  { name: 'Bills', amount: 4200, budget: 5000, pct: 84, color: '#FF9800', icon: '📄' },
  { name: 'Entertainment', amount: 2100, budget: 3000, pct: 70, color: '#9C27B0', icon: '🎬' },
]

const AI_INSIGHTS = [
  { type: 'warning', text: 'Shopping is 12% over budget this month. Consider pausing non-essential purchases.', icon: '⚠️' },
  { type: 'positive', text: 'Transport spending dropped 25% compared to last month — great job! 🎉', icon: '📉' },
  { type: 'tip', text: 'You spend 40% more on food during weekends. Try meal prepping on Sundays.', icon: '💡' },
  { type: 'prediction', text: 'At current rate, you\'ll save ₹12,400 this month — ₹2,400 above target!', icon: '🎯' },
]

export default function Insights() {
  const totalSpent = CATEGORIES.reduce((s, c) => s + c.amount, 0)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Insights</h1>
          <p className="body-s text-secondary">AI-powered spending analytics 🧠</p>
        </div>

        {/* Total Spending Card */}
        <motion.div variants={cardPop} initial="initial" animate="animate"
          className="card" style={{ padding: 20, marginBottom: 20, background: 'var(--gradient-night)', color: 'white', borderRadius: 'var(--radius-2xl)' }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Total Spent This Month</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>₹{totalSpent.toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <TrendingDown size={14} color="#4CAF50" />
            <span style={{ color: '#4CAF50' }}>8% less than last month</span>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Category Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.name} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>₹{cat.amount.toLocaleString()} / ₹{cat.budget.toLocaleString()}</div>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: cat.pct > 100 ? '#F44336' : cat.pct > 80 ? '#FF9800' : '#4CAF50',
                }}>{cat.pct}%</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(cat.pct, 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: cat.pct > 100 ? '#F44336' : cat.pct > 80 ? '#FF9800' : cat.color,
                  }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Insights */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          🧠 AI Insights
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AI_INSIGHTS.map((insight, i) => (
            <motion.div key={i} variants={listItem} initial="initial" animate="animate"
              style={{
                padding: '12px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                background: insight.type === 'warning' ? '#FFF3E018' : insight.type === 'positive' ? '#E8F5E918' : 'var(--bg-card)',
                borderLeft: `3px solid ${insight.type === 'warning' ? '#FF9800' : insight.type === 'positive' ? '#4CAF50' : 'var(--viya-primary-500)'}`,
                color: 'var(--text-secondary)',
              }}>
              <span style={{ marginRight: 6 }}>{insight.icon}</span>
              {insight.text}
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
