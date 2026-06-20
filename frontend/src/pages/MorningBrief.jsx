import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR, getGreeting, getGreetingEmoji } from '../lib/utils'
import { ArrowLeft, ChevronRight, Sun, Cloud, Target, CreditCard, CheckCircle, Flame } from 'lucide-react'

const TIPS = [
  'Track every expense, no matter how small. Small leaks sink big ships.',
  'Review your subscriptions monthly. Cancel what you don\'t use.',
  'The 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
  'Automate your savings. What you don\'t see, you won\'t spend.',
  'Cook at home 3 times this week to save on food delivery.',
  'Set a 24-hour rule: wait a day before non-essential purchases.',
  'Round up your savings. Every small amount adds up over time.',
]

export default function MorningBrief() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [bills, setBills] = useState([])
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState([])
  const [goals, setGoals] = useState([])

  useEffect(() => {
    if (!phone) return
    setLoading(true)
    Promise.all([
      api.getUser(phone),
      api.getBills(phone),
      api.getHabits(phone),
      api.getCheckins(phone),
      api.getGoals(phone),
    ]).then(([u, b, h, c, g]) => {
      setUserData(u)
      setBills(b || [])
      setHabits(h || [])
      setCheckins(c || [])
      setGoals(g || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [phone])

  const greeting = getGreeting()
  const emoji = getGreetingEmoji()
  const name = userData?.name || user?.name || 'there'
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Budget status: calculate from recent transactions
  const todayStr = today.toISOString().split('T')[0]
  const monthPrefix = today.toISOString().slice(0, 7)
  const recentTxns = userData?.recent_transactions || []
  const monthExpenses = recentTxns.filter(t => t.type === 'expense' && t.created_at?.startsWith(monthPrefix)).reduce((s, t) => s + Number(t.amount), 0)
  const monthIncome = Number(userData?.monthly_income) || recentTxns.filter(t => t.type === 'income' && t.created_at?.startsWith(monthPrefix)).reduce((s, t) => s + Number(t.amount), 0)
  const todaySpent = recentTxns.filter(t => t.type === 'expense' && t.created_at?.startsWith(todayStr)).reduce((s, t) => s + Number(t.amount), 0)
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1
  const dailyBudget = monthIncome > 0 ? Math.round((monthIncome - monthExpenses) / Math.max(daysLeft, 1)) : 0
  const moneyLeft = Math.max(dailyBudget - todaySpent, 0)

  // Pending bills (due within 3 days)
  const pendingBills = useMemo(() => {
    const in3Days = new Date(today)
    in3Days.setDate(in3Days.getDate() + 3)
    return bills.filter(b => {
      if (b.status === 'paid') return false
      if (!b.due_date) return false
      const due = new Date(b.due_date)
      return due <= in3Days && due >= new Date(today.toISOString().split('T')[0])
    })
  }, [bills, today])

  // Habits not checked in today
  const checkedHabitIds = new Set(checkins.map(c => c.habit_id))
  const pendingHabits = habits.filter(h => !checkedHabitIds.has(h.id))

  // Random tip
  const tip = TIPS[today.getDate() % TIPS.length]

  if (loading) return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div style={{ height: 140, background: 'linear-gradient(135deg, var(--bg-secondary), var(--border))', borderRadius: 18, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 60, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  )

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Hero Greeting */}
      <div style={{
        background: greeting.includes('morning') ? 'linear-gradient(135deg, #FF9800, #FFB74D, #FFD54F)' :
          greeting.includes('afternoon') ? 'linear-gradient(135deg, #42A5F5, #66BB6A)' :
          greeting.includes('evening') ? 'linear-gradient(135deg, #5C6BC0, #7E57C2)' :
          'linear-gradient(135deg, #37474F, #546E7A)',
        borderRadius: 20, padding: '28px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', top: -20, right: -10 }} />
        <button onClick={() => nav(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 2 }}>
          {greeting}, {name}! {emoji}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{dateLabel}</div>
      </div>

      {/* Today's Budget */}
      <div style={{ background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3, var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={14} /> Today's Budget
        </div>
        {dailyBudget > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', color: moneyLeft > 0 ? 'var(--primary, var(--emerald-500))' : 'var(--cosmos-400, #FF5252)' }}>
                {formatINR(moneyLeft)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3, var(--text-tertiary))' }}>left today</span>
            </div>
            <div className="progress-bar" style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div className="progress-fill" style={{
                height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
                width: `${Math.min((todaySpent / Math.max(dailyBudget, 1)) * 100, 100)}%`,
                background: todaySpent > dailyBudget ? 'var(--cosmos-400, #FF5252)' : 'var(--primary, var(--emerald-500))',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3, var(--text-tertiary))' }}>
              <span>{formatINR(todaySpent)} spent</span>
              <span>Budget: {formatINR(dailyBudget)}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text2, var(--text-secondary))' }}>
            Add your income to see daily budget.
          </div>
        )}
      </div>

      {/* Pending Bills */}
      {pendingBills.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#FF5252' }}>!</span> Bills Due Soon
          </div>
          {pendingBills.map((bill, i) => {
            const due = new Date(bill.due_date)
            const daysUntil = Math.ceil((due - new Date(todayStr)) / 86400000)
            const urgentLabel = daysUntil <= 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `In ${daysUntil} days`
            return (
              <div key={bill.id || i} onClick={() => nav('/bills')} style={{
                background: 'var(--bg-card, var(--surface))', borderRadius: 12, padding: 14,
                border: '1px solid var(--border-light, var(--border))', marginBottom: 6,
                borderLeft: `4px solid ${daysUntil <= 1 ? '#FF5252' : '#FF9800'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>{bill.icon || '🧾'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{bill.name || bill.title || 'Bill'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3, var(--text-tertiary))' }}>
                    {formatINR(bill.amount)} -- {urgentLabel}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text3)" />
              </div>
            )
          })}
        </div>
      )}

      {/* Pending Habits */}
      {pendingHabits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} color="#FF9800" /> Habits to Complete
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pendingHabits.map((h, i) => (
              <div key={h.id || i} onClick={() => nav('/habits')} style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
              }}>
                <span>{h.icon || '✅'}</span> {h.name}
              </div>
            ))}
          </div>
          {habits.length > 0 && checkins.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--primary, var(--emerald-500))', marginTop: 6, fontWeight: 600 }}>
              <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {checkins.length}/{habits.length} completed today
            </div>
          )}
        </div>
      )}

      {/* Goal Progress */}
      {goals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={16} color="var(--primary)" /> Goals Progress
          </div>
          {goals.slice(0, 3).map((g, i) => {
            const pct = Number(g.target_amount) > 0 ? Math.min(Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100), 100) : 0
            return (
              <div key={g.id || i} onClick={() => nav('/goals')} style={{
                background: 'var(--bg-card, var(--surface))', border: '1px solid var(--border-light, var(--border))',
                borderRadius: 12, padding: 14, marginBottom: 6, cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{g.icon || '🎯'} {g.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary, var(--emerald-500))' }}>{pct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'var(--primary, var(--teal-500))', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3, var(--text-tertiary))' }}>
                  <span>{formatINR(g.current_amount)}</span>
                  <span>{formatINR(g.target_amount)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Motivational Tip */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,208,132,0.06), rgba(0,150,255,0.06))',
        border: '1px solid rgba(0,208,132,0.15)', borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary, var(--emerald-500))', marginBottom: 6 }}>Tip of the Day</div>
        <div style={{ fontSize: 13, color: 'var(--text2, var(--text-secondary))', lineHeight: 1.5, fontStyle: 'italic' }}>
          "{tip}"
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Add Expense', emoji: '💸', route: '/expenses' },
          { label: 'Ask Viya', emoji: '💬', route: '/chat' },
          { label: 'View Report', emoji: '📊', route: '/report' },
          { label: 'My Goals', emoji: '🎯', route: '/goals' },
        ].map((a, i) => (
          <button key={i} onClick={() => nav(a.route)} style={{
            background: 'var(--bg-card, var(--surface))', borderRadius: 12, padding: 14,
            border: '1px solid var(--border-light, var(--border))', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'inherit', color: 'var(--text)',
          }}>
            <span style={{ fontSize: 18 }}>{a.emoji}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
