import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { AlertTriangle } from 'lucide-react'

const CAT_META = {
  '🍕 Food': { name: 'Food & Dining', emoji: '🍕', budget: 8000, color: '#F59E0B' },
  '🚗 Transport': { name: 'Transport', emoji: '🚗', budget: 3000, color: '#06B6D4' },
  '🛒 Shopping': { name: 'Shopping', emoji: '🛍️', budget: 5000, color: '#F43F5E' },
  '💡 Bills': { name: 'Bills & Utilities', emoji: '💡', budget: 4000, color: '#8B5CF6' },
  '🎬 Entertainment': { name: 'Entertainment', emoji: '🎬', budget: 2000, color: '#10B981' },
  '💊 Health': { name: 'Health', emoji: '🏥', budget: 2000, color: '#EF4444' },
  '📚 Education': { name: 'Education', emoji: '📚', budget: 3000, color: '#3B82F6' },
  '📱 Recharge': { name: 'Recharge', emoji: '📱', budget: 1000, color: '#EC4899' },
  '🏠 Rent': { name: 'Rent & Housing', emoji: '🏠', budget: 10000, color: '#F97316' },
  '📦 General': { name: 'Other', emoji: '📦', budget: 3000, color: '#9CA3AF' },
}

export default function Budget() {
  const { phone } = useApp()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone) return
    api.getTransactions(phone, 200).then(txns => {
      const expenses = (txns || []).filter(t => t.type === 'expense')
      // Group by category
      const grouped = {}
      expenses.forEach(t => {
        const cat = t.category || '📦 General'
        if (!grouped[cat]) grouped[cat] = 0
        grouped[cat] += Number(t.amount)
      })
      // Build category list
      const result = Object.entries(CAT_META).map(([key, meta]) => ({
        ...meta, spent: grouped[key] || 0
      })).filter(c => c.spent > 0 || c.budget > 3000)
      // Add any unknown categories
      Object.entries(grouped).forEach(([cat, amt]) => {
        if (!CAT_META[cat]) result.push({ name: cat, emoji: '📦', budget: 3000, color: '#9CA3AF', spent: amt })
      })
      setCats(result.sort((a, b) => b.spent - a.spent))
      setLoading(false)
    })
  }, [phone])

  const totalBudget = cats.reduce((s, c) => s + c.budget, 0) || 30000
  const totalSpent = cats.reduce((s, c) => s + c.spent, 0)
  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0
  const isOver = pct > 90

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
          <div className="bm-row"><span className="bm-label">Remaining</span><span className={'bm-val ' + (remaining >= 0 ? 'green' : 'red')}>₹{remaining.toLocaleString('en-IN')}</span></div>
        </div>
      </div>
      {isOver && <div className="budget-alert"><AlertTriangle size={16} /> <span>You've used {pct}% of your budget!</span></div>}
      <section className="section">
        <div className="section-head"><h3>Spending by Category</h3></div>
        {loading ? <p className="empty-text">Loading...</p> : cats.length === 0 ? (
          <p className="empty-text">No expenses tracked yet. Start with "spent 500 on food" 🚀</p>
        ) : cats.map((c, i) => {
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
