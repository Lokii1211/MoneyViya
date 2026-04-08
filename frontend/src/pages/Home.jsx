import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { TrendingUp, Plus, Sun, Flame, Target, Wallet, BarChart3, Landmark, CalendarCheck, ArrowUpRight } from 'lucide-react'

export default function Home() {
  const { phone, user, setUser } = useApp()
  const [data, setData] = useState(null)
  const [habits, setHabits] = useState([])
  const nav = useNavigate()
  useEffect(() => {
    if (phone) {
      api.getUser(phone).then(d => { if (d) { setData(d); setUser(p => ({ ...p, ...d })) } })
      api.getHabits(phone).then(h => { if (h) setHabits(h) })
    }
  }, [phone])
  const income = data?.monthly_income || 0, expense = data?.monthly_expenses || 0
  const savings = data?.current_savings || 0, budget = data?.daily_budget || 1000
  const name = data?.name || user?.name || 'User'
  const spent = expense, weeklyBudget = budget * 7
  const weekPct = weeklyBudget > 0 ? Math.min((spent / weeklyBudget) * 100, 100) : 0
  const totalStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0)

  const actions = [
    { icon: <Plus size={18} />, label: 'Add Expense', color: 'green', to: '/expenses' },
    { icon: <Sun size={18} />, label: 'Briefing', color: 'cyan', to: '/chat?q=morning+briefing' },
    { icon: <Flame size={18} />, label: 'Habits', color: 'gold', to: '/habits' },
    { icon: <Wallet size={18} />, label: 'Earn More', color: 'violet', to: '/chat?q=passive+income' },
    { icon: <Target size={18} />, label: 'Goals', color: 'rose', to: '/goals' },
    { icon: <BarChart3 size={18} />, label: 'Review', color: 'cyan', to: '/chat?q=weekly+review' },
    { icon: <Landmark size={18} />, label: 'Tax Save', color: 'green', to: '/chat?q=tax+saving' },
    { icon: <CalendarCheck size={18} />, label: 'Plan Day', color: 'violet', to: '/chat?q=plan+my+day' },
  ]

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-left">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div><div className="header-name">{name}</div><div className="header-sub">Private Wealth Manager</div></div>
        </div>
      </header>

      {/* Wealth Card — Stitch: Money Left Today */}
      <div className="wealth-card">
        <div className="wealth-label">NET WORTH</div>
        <div className="wealth-amount">₹{savings.toLocaleString('en-IN')}</div>
        <div className="wealth-change up"><TrendingUp size={14} /> Growing</div>
        <div className="wealth-stats">
          <div><div className="ws-label">INCOME</div><div className="ws-val green">₹{income.toLocaleString('en-IN')}</div></div>
          <div><div className="ws-label">EXPENSES</div><div className="ws-val red">₹{expense.toLocaleString('en-IN')}</div></div>
          <div><div className="ws-label">BUDGET</div><div className="ws-val accent">₹{budget.toLocaleString('en-IN')}</div></div>
        </div>
      </div>

      {/* Streak Card — Stitch: Orange gamification */}
      <div className="streak-card" onClick={() => nav('/habits')}>
        <div className="streak-fire">🔥</div>
        <div className="streak-info">
          <div className="streak-count">{totalStreak > 0 ? `${totalStreak} Day Streak!` : 'Start Your Streak!'}</div>
          <div className="streak-label">{totalStreak > 0 ? 'Keep going! Every day counts' : 'Complete habits daily to build streaks'}</div>
        </div>
        <ArrowUpRight size={20} />
      </div>

      {/* Weekly Progress — Stitch */}
      <div className="weekly-card">
        <div className="weekly-header">
          <div className="weekly-title">This Week</div>
          <div className="weekly-amount">₹{spent.toLocaleString('en-IN')} / ₹{weeklyBudget.toLocaleString('en-IN')}</div>
        </div>
        <div className="weekly-bar">
          <div className={`weekly-fill ${weekPct < 60 ? 'safe' : weekPct < 85 ? 'warning' : 'danger'}`} style={{width: weekPct + '%'}} />
        </div>
      </div>

      {/* Quick Actions */}
      <section className="section">
        <div className="section-head"><h3>Quick Actions</h3></div>
        <div className="qa-grid">{actions.map((a, i) => (<button key={i} className="qa-item" onClick={() => nav(a.to)}><div className={'qa-icon ' + a.color}>{a.icon}</div><span className="qa-label">{a.label}</span></button>))}</div>
      </section>

      {/* Recent Transactions */}
      <section className="section">
        <div className="section-head"><h3>Recent Transactions</h3><button className="link-btn" onClick={() => nav('/expenses')}>See All</button></div>
        {(data?.recent_transactions || []).slice(0, 5).map((t, i) => (
          <div key={i} className="txn-item">
            <div className="txn-icon">{t.type === 'income' ? '💰' : '🛒'}</div>
            <div className="txn-info"><div className="txn-name">{t.description || t.category}</div><div className="txn-cat">{t.category}</div></div>
            <div className={'txn-amount ' + (t.type === 'income' ? 'income' : 'expense')}>{t.type === 'income' ? '+' : '-'}₹{t.amount}</div>
          </div>
        ))}
        {(!data?.recent_transactions?.length) && <p className="empty-text">No transactions yet. Add your first expense! 🚀</p>}
      </section>
    </div>
  )
}
