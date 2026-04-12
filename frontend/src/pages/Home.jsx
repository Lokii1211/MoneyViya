import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { TrendingUp, Plus, Sun, Flame, Target, Wallet, BarChart3, Landmark, CalendarCheck, ArrowUpRight, Sparkles, MessageCircle, Zap, Phone } from 'lucide-react'

// Daily tips based on time of day — keeps users coming back
const DAILY_TIPS = {
  morning: [
    '☀️ Morning is the best time to review your goals. What will you achieve today?',
    '💪 Start strong! Log your first habit check-in for today.',
    '📊 Quick tip: Track your morning expenses to stay on budget!',
    '🧠 Those who plan their day earn 25% more on average.',
  ],
  afternoon: [
    '🍱 Tracked your lunch expense yet? Small habits = big savings!',
    '📈 Fun fact: ₹100/day saved = ₹36,500/year. That\'s an iPhone!',
    '💡 Afternoon slump? Take a 10-min walk — it boosts productivity by 40%.',
    '🎯 Check your goals progress. Even ₹500 added today matters!',
  ],
  evening: [
    '🌅 Great day? Log your expenses before they slip from memory!',
    '🏋️ Hit the gym tonight? Tell Viya "gym done" to track it!',
    '📖 Reading tonight? Just 20 mins/day = 30 books/year!',
    '💰 Evening review: How much did you spend today?',
  ],
  night: [
    '🌙 Time to reflect! How many habits did you complete today?',
    '😴 Good sleep = better financial decisions tomorrow.',
    '📝 Journal your wins today — even small ones count!',
    '🧘 5-minute meditation before bed improves focus by 30%.',
  ],
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 5) return { greeting: 'Good Night', period: 'night', emoji: '🌙' }
  if (h < 12) return { greeting: 'Good Morning', period: 'morning', emoji: '☀️' }
  if (h < 17) return { greeting: 'Good Afternoon', period: 'afternoon', emoji: '🌤️' }
  if (h < 21) return { greeting: 'Good Evening', period: 'evening', emoji: '🌅' }
  return { greeting: 'Good Night', period: 'night', emoji: '🌙' }
}

function getDailyTip(period) {
  const tips = DAILY_TIPS[period] || DAILY_TIPS.morning
  const idx = Math.floor(Date.now() / 3600000) % tips.length // Changes every hour
  return tips[idx]
}

export default function Home() {
  const { phone, user, setUser } = useApp()
  const [data, setData] = useState(null)
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState([])
  const nav = useNavigate()
  const { greeting, period, emoji } = getTimeGreeting()
  const tip = getDailyTip(period)

  useEffect(() => {
    if (phone) {
      api.getUser(phone).then(d => { if (d) { setData(d); setUser(p => ({ ...p, ...d })) } })
      api.getHabits(phone).then(h => { if (h) setHabits(h) })
      api.getCheckins(phone).then(c => { if (c) setCheckins(c) })
    }
  }, [phone])

  const income = data?.monthly_income || 0, expense = data?.monthly_expenses || 0
  const savings = data?.current_savings || 0, budget = data?.daily_budget || 1000
  const name = data?.name || user?.name || 'User'
  const todaySpent = (data?.recent_transactions || []).filter(t => {
    if (t.type !== 'expense') return false
    return new Date(t.created_at).toDateString() === new Date().toDateString()
  }).reduce((s, t) => s + Number(t.amount), 0)
  const spent = expense, weeklyBudget = budget * 7
  const weekPct = weeklyBudget > 0 ? Math.min((spent / weeklyBudget) * 100, 100) : 0
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
  const totalHabits = habits.length
  const todayDone = checkins.length
  const completionPct = totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0

  // Streak messages with personality
  const streakMsg = maxStreak >= 30 ? '👑 Legend Status!' : maxStreak >= 7 ? '🗡️ Week Warrior!' : maxStreak >= 3 ? '🎩 Hat-trick!' : maxStreak > 0 ? `${maxStreak} Day Streak!` : 'Start Your Streak!'
  const streakSub = maxStreak >= 7 ? 'You\'re unstoppable! Keep crushing it!' : maxStreak > 0 ? 'Consistency is your superpower 💪' : 'Complete habits daily to build streaks'

  const actions = [
    { icon: <Plus size={18} />, label: 'Add Expense', color: 'green', to: '/expenses' },
    { icon: <Sun size={18} />, label: 'Briefing', color: 'cyan', to: '/chat?q=morning+briefing' },
    { icon: <Flame size={18} />, label: 'Habits', color: 'gold', to: '/habits' },
    { icon: <Wallet size={18} />, label: 'Earn More', color: 'violet', to: '/chat?q=passive+income+ideas' },
    { icon: <Target size={18} />, label: 'Goals', color: 'rose', to: '/goals' },
    { icon: <BarChart3 size={18} />, label: 'Review', color: 'cyan', to: '/chat?q=weekly+financial+review' },
    { icon: <Landmark size={18} />, label: 'Tax Save', color: 'green', to: '/chat?q=tax+saving+tips+for+salaried' },
    { icon: <CalendarCheck size={18} />, label: 'Plan Day', color: 'violet', to: '/chat?q=plan+my+day+productively' },
  ]

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-left">
          <div className="avatar">{localStorage.getItem('mv_avatar') || name.charAt(0).toUpperCase()}</div>
          <div><div className="header-name">{greeting}, {name.split(' ')[0]}! {emoji}</div><div className="header-sub">Your AI Life Assistant</div></div>
        </div>
      </header>

      {/* Daily Tip Card — Changes every hour, keeps users engaged */}
      <div className="daily-tip-card" onClick={() => nav('/chat')}>
        <Sparkles size={16} className="tip-icon"/>
        <div className="tip-text">{tip}</div>
        <ArrowUpRight size={14} className="tip-arrow"/>
      </div>

      {/* 💰 MONEY LEFT TODAY — THE #1 number (Blueprint Core Feature #2) */}
      <div className="wealth-card" onClick={() => nav('/expenses')}>
        <div className="wealth-label">MONEY LEFT TODAY</div>
        <div className="wealth-amount" style={{color: (budget/30 - todaySpent) >= 0 ? 'var(--primary)' : 'var(--red)', fontSize:38}}>
          ₹{Math.abs(Math.round(budget/30 - todaySpent)).toLocaleString('en-IN')}
        </div>
        <div className={`wealth-change ${(budget/30 - todaySpent) >= 0 ? 'up' : 'down'}`}>
          <TrendingUp size={14} /> {(budget/30 - todaySpent) >= 0 ? `₹${Math.round(budget/30)} daily budget` : `Over budget by ₹${Math.abs(Math.round(budget/30 - todaySpent))}`}
        </div>
        <div className="wealth-stats">
          <div><div className="ws-label">INCOME</div><div className="ws-val green">₹{income.toLocaleString('en-IN')}</div></div>
          <div><div className="ws-label">EXPENSES</div><div className="ws-val red">₹{expense.toLocaleString('en-IN')}</div></div>
          <div><div className="ws-label">SAVED</div><div className="ws-val accent">₹{savings.toLocaleString('en-IN')}</div></div>
        </div>
      </div>

      {/* Streak Card — Gamification */}
      <div className="streak-card" onClick={() => nav('/habits')}>
        <div className="streak-fire">🔥</div>
        <div className="streak-info">
          <div className="streak-count">{streakMsg}</div>
          <div className="streak-label">{streakSub}</div>
        </div>
        <ArrowUpRight size={20} />
      </div>

      {/* Today's Habits Progress */}
      {totalHabits > 0 && (
        <div className="habit-progress-card" onClick={() => nav('/habits')}>
          <div className="hp-header">
            <span className="hp-title">Today's Habits</span>
            <span className="hp-count">{todayDone}/{totalHabits}</span>
          </div>
          <div className="weekly-bar"><div className={`weekly-fill ${completionPct >= 80 ? 'safe' : completionPct >= 40 ? 'warning' : 'danger'}`} style={{width: completionPct + '%'}} /></div>
          <div className="hp-msg">{completionPct === 100 ? '🎉 All done! You\'re a champion!' : completionPct >= 50 ? '💪 Almost there! Keep going!' : '📋 Tap to check in your habits'}</div>
        </div>
      )}

      {/* Weekly Spending */}
      <div className="weekly-card">
        <div className="weekly-header">
          <div className="weekly-title">This Week</div>
          <div className="weekly-amount">₹{spent.toLocaleString('en-IN')} / ₹{weeklyBudget.toLocaleString('en-IN')}</div>
        </div>
        <div className="weekly-bar">
          <div className={`weekly-fill ${weekPct < 60 ? 'safe' : weekPct < 85 ? 'warning' : 'danger'}`} style={{width: weekPct + '%'}} />
        </div>
      </div>

      {/* Ask Viya — Sticky engagement */}
      <div className="ask-viya-card" onClick={() => nav('/chat')}>
        <div className="av-icon"><MessageCircle size={20}/></div>
        <div className="av-text">
          <div className="av-title">Ask Viya anything</div>
          <div className="av-sub">Gym diet, study plan, tax tips, mental health...</div>
        </div>
        <Zap size={16} className="av-zap"/>
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
        {(!data?.recent_transactions?.length) && <p className="empty-text">No transactions yet. Say "spent 500 on food" to start! 🚀</p>}
      </section>

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/917305021304?text=Hi%20Viya!" target="_blank" rel="noopener" className="whatsapp-fab" title="Chat on WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  )
}
