import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { PieChart, AlertTriangle, TrendingDown, ChevronRight, Wallet } from 'lucide-react'

const BUDGET_CATS = [
  { name: 'Food & Dining', emoji: '🍕', budget: 8000, spent: 0, color: '#F59E0B' },
  { name: 'Transport', emoji: '🚗', budget: 3000, spent: 0, color: '#06B6D4' },
  { name: 'Shopping', emoji: '🛍️', budget: 5000, spent: 0, color: '#F43F5E' },
  { name: 'Bills & Utilities', emoji: '💡', budget: 4000, spent: 0, color: '#8B5CF6' },
  { name: 'Entertainment', emoji: '🎬', budget: 2000, spent: 0, color: '#10B981' },
  { name: 'Health', emoji: '🏥', budget: 2000, spent: 0, color: '#EF4444' },
  { name: 'Education', emoji: '📚', budget: 3000, spent: 0, color: '#3B82F6' },
  { name: 'Other', emoji: '📦', budget: 3000, spent: 0, color: '#9CA3AF' },
]

export default function Budget() {
  const { phone, user } = useApp()
  const [cats, setCats] = useState(BUDGET_CATS)
  const totalBudget = cats.reduce((s, c) => s + c.budget, 0)
  const totalSpent = cats.reduce((s, c) => s + c.spent, 0)
  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const isOver = pct > 90

  useEffect(() => {
    if (phone) {
      api.getUser(phone).then(d => {
        if (d?.monthly_expenses) {
          setCats(prev => prev.map((c, i) => ({
            ...c,
            spent: i === 0 ? Math.round(d.monthly_expenses * 0.3) :
              i === 1 ? Math.round(d.monthly_expenses * 0.1) :
              i === 2 ? Math.round(d.monthly_expenses * 0.15) :
              i === 3 ? Math.round(d.monthly_expenses * 0.15) :
              i === 4 ? Math.round(d.monthly_expenses * 0.1) :
              i === 5 ? Math.round(d.monthly_expenses * 0.05) :
              i === 6 ? Math.round(d.monthly_expenses * 0.05) :
              Math.round(d.monthly_expenses * 0.1)
          })))
        }
      })
    }
  }, [phone])

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Budget</h2></div></header>

      <div className="budget-overview">
        <div className="budget-ring-wrap">
          <svg viewBox="0 0 100 100" className="budget-ring">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface2)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={isOver ? 'var(--red)' : 'var(--violet)'} strokeWidth="8"
              strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`} strokeDashoffset="66" strokeLinecap="round" />
          </svg>
          <div className="budget-ring-text">
            <div className="budget-ring-pct">{pct}%</div>
            <div className="budget-ring-label">used</div>
          </div>
        </div>
        <div className="budget-meta">
          <div className="bm-row"><span className="bm-label">Total Budget</span><span className="bm-val">₹{totalBudget.toLocaleString('en-IN')}</span></div>
          <div className="bm-row"><span className="bm-label">Spent</span><span className="bm-val red">₹{totalSpent.toLocaleString('en-IN')}</span></div>
          <div className="bm-row"><span className="bm-label">Remaining</span><span className="bm-val green">₹{remaining.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      {isOver && (
        <div className="budget-alert">
          <AlertTriangle size={16} /> <span>You've used {pct}% of your budget! Consider cutting back on non-essentials.</span>
        </div>
      )}

      <section className="section">
        <div className="section-head"><h3>Category Budgets</h3></div>
        {cats.map((c, i) => {
          const catPct = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0
          return (
            <div key={i} className="budget-cat-card">
              <div className="bc-header">
                <span className="bc-emoji">{c.emoji}</span>
                <div className="bc-info">
                  <div className="bc-name">{c.name}</div>
                  <div className="bc-amounts">₹{c.spent.toLocaleString('en-IN')} / ₹{c.budget.toLocaleString('en-IN')}</div>
                </div>
                <div className={'bc-pct' + (catPct > 90 ? ' over' : '')}>{catPct}%</div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: catPct + '%', background: c.color }} /></div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
