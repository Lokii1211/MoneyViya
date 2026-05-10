import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useCountUp, getCurrentFestival, formatINR, getGreeting, getGreetingEmoji } from '../lib/utils'
import { TrendingUp, TrendingDown, Plus, Flame, Target, Wallet, BarChart3, Zap, PiggyBank, Users, Heart, ArrowUpRight, Sparkles, Bell, MessageCircle, ClipboardList, AlertTriangle, Activity, Droplets, Moon, CreditCard } from 'lucide-react'

const BRIEF_ITEMS_POOL = {
  morning: [
    { icon: '💳', text: 'Review your pending bills before the day starts' },
    { icon: '💪', text: 'Morning workout streak — keep it going!' },
    { icon: '📊', text: 'Check your weekly spending report' },
  ],
  afternoon: [
    { icon: '🍱', text: 'Log your lunch expense to stay on budget' },
    { icon: '📈', text: '₹100/day saved = ₹36,500/year!' },
    { icon: '💡', text: 'Take a 10-min walk — boosts productivity 40%' },
  ],
  evening: [
    { icon: '🌅', text: 'Log expenses before they slip away' },
    { icon: '🏋️', text: 'Hit the gym? Log your workout!' },
    { icon: '📖', text: '20 mins reading/day = 30 books/year!' },
  ],
  night: [
    { icon: '🌙', text: 'Review today\'s habits before bed' },
    { icon: '😴', text: 'Good sleep = better financial decisions' },
    { icon: '📝', text: 'Journal your wins — even small ones!' },
  ],
}

function getPeriod() {
  const h = new Date().getHours()
  if (h < 5) return 'night'; if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; if (h < 21) return 'evening'; return 'night'
}

function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) +
    ', ' + new Date().toLocaleDateString('en-IN', { weekday: 'long' })
}

export default function Home() {
  const { phone, user, setUser } = useApp()
  const [data, setData] = useState(null)
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState([])
  const [goals, setGoals] = useState([])

  const nav = useNavigate()
  const period = getPeriod()
  const festival = getCurrentFestival()

  useEffect(() => {
    if (phone) {
      api.getUser(phone).then(d => { if (d) { setData(d); setUser(p => ({ ...p, ...d })) } })
      api.getHabits(phone).then(h => { if (h) setHabits(h) })
      api.getCheckins(phone).then(c => { if (c) setCheckins(c) })
      api.getGoals(phone).then(g => { if (g) setGoals(g) })
    }
  }, [phone])

  const allTxns = data?.recent_transactions || []
  const income = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || data?.monthly_income || 0
  const expense = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || data?.monthly_expenses || 0
  const savings = Math.max(income - expense, 0)
  const budget = data?.daily_budget || 1000
  const name = data?.name || user?.name || 'User'
  const todaySpent = allTxns.filter(t => t.type === 'expense' && new Date(t.created_at).toDateString() === new Date().toDateString()).reduce((s, t) => s + Number(t.amount), 0)
  const moneyLeft = Math.round(budget - todaySpent)
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
  const totalHabits = habits.length
  const todayDone = checkins.length
  const budgetPct = income > 0 ? Math.round((expense / income) * 100) : 0

  const animatedMoney = useCountUp(Math.abs(moneyLeft), 900)
  const animatedIncome = useCountUp(income, 700)
  const animatedExpense = useCountUp(expense, 700)

  // Build dynamic brief items
  const briefItems = []
  if (moneyLeft < 200 && moneyLeft > 0) briefItems.push({ icon: '⚠️', text: `Only ₹${moneyLeft} left in today's budget — spend wisely!` })
  if (moneyLeft < 0) briefItems.push({ icon: '🔴', text: `Over budget by ₹${Math.abs(moneyLeft)} today — review expenses` })
  if (maxStreak > 0) briefItems.push({ icon: '🔥', text: `${maxStreak}-day streak going strong — don't break it!` })
  if (goals.length > 0) {
    const g = goals.find(g => g.current_amount < g.target_amount)
    if (g) briefItems.push({ icon: '🎯', text: `${g.name}: ₹${Number(g.current_amount).toLocaleString('en-IN')} of ₹${Number(g.target_amount).toLocaleString('en-IN')}` })
  }
  // Pad with period tips
  const poolItems = BRIEF_ITEMS_POOL[period]
  while (briefItems.length < 3 && poolItems.length > 0) {
    briefItems.push(poolItems[briefItems.length % poolItems.length])
    if (briefItems.length >= 3) break
  }

  const actions = [
    { icon: <Plus size={18}/>, label: 'Add Expense', to: '/expenses', color: 'var(--viya-success)' },
    { icon: <Sparkles size={18}/>, label: 'AI Briefing', to: '/chat?q=morning+briefing', color: 'var(--viya-primary-500)' },
    { icon: <Flame size={18}/>, label: 'Habits', to: '/habits', color: 'var(--viya-gold-500)' },
    { icon: <Target size={18}/>, label: 'Goals', to: '/goals', color: 'var(--viya-error)' },
    { icon: <Activity size={18}/>, label: 'Health', to: '/health', color: '#FF6B6B' },
    { icon: <CreditCard size={18}/>, label: 'Bills', to: '/bills', color: 'var(--viya-warning)' },
    { icon: <Users size={18}/>, label: 'Lending', to: '/lending', color: '#f59e0b' },
    { icon: <BarChart3 size={18}/>, label: 'Report', to: '/report', color: 'var(--viya-primary-400)' },
  ]


  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
            {localStorage.getItem('mv_avatar') || name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{getGreeting()}, {name.split(' ')[0]}! {getGreetingEmoji()}</div>
            <div className="body-s text-secondary">Your AI Life Assistant</div>
          </div>
        </div>
      </div>

      {/* Festival Banner */}
      {festival && (
        <div onClick={() => nav('/chat?q=' + encodeURIComponent(festival.greeting))} className="card" style={{
          background: festival.colors.bg, border: 'none', padding: '14px 16px',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'white',
        }}>
          <span style={{ fontSize: 28 }}>{festival.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{festival.greeting}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Tap for festive money tips! 🎁</div>
          </div>
        </div>
      )}

      {/* ═══ SECTION A: Daily Brief Card ═══ */}
      <div onClick={() => nav('/chat?q=daily+briefing')} style={{
        background: 'var(--gradient-night)', borderRadius: 'var(--radius-2xl)',
        padding: 24, marginBottom: 16, cursor: 'pointer', color: 'white',
        boxShadow: '0 8px 32px rgba(13,0,32,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, opacity: 0.6, textTransform: 'uppercase' }}>
            {period === 'morning' ? '☀️' : period === 'evening' ? '🌅' : period === 'night' ? '🌙' : '🌤️'} Daily Brief
          </span>
          <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 500 }}>{formatTime()}</span>
        </div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.3, marginBottom: 16, letterSpacing: -0.3 }}>
          You have {briefItems.length} things that need you today
        </div>
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {briefItems.slice(0, 4).map((item, i) => (
            <div key={i} className="animate-slideUp" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: 0.85, fontSize: 14, lineHeight: 1.4,
              animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div style={{
            padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            background: 'var(--viya-violet-500)', color: 'white', cursor: 'pointer',
          }}>Handle All →</div>
          <div style={{
            padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer',
          }}>Show details</div>
        </div>
      </div>

      {/* ═══ SECTION B: Today's Overview — Money + Tasks ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Money Today */}
        <div onClick={() => nav('/expenses')} style={{
          background: 'var(--gradient-primary)', borderRadius: 'var(--radius-xl)',
          padding: 16, cursor: 'pointer', color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Money Left</div>
          <div className="num-m" style={{ color: moneyLeft >= 0 ? '#fff' : '#FFB3B3', fontSize: 28, fontWeight: 700 }}>
            {moneyLeft < 0 ? '-' : ''}₹{animatedMoney.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {moneyLeft >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            ₹{budget} daily budget
          </div>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        {/* Habits Today */}
        <div onClick={() => nav('/habits')} style={{
          background: 'var(--viya-violet-500)', borderRadius: 'var(--radius-xl)',
          padding: 16, cursor: 'pointer', color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Today's Habits</div>
          <div className="num-m" style={{ fontSize: 28, fontWeight: 700 }}>{todayDone}/{totalHabits || 7}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Flame size={12}/> {maxStreak}-day streak
          </div>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        </div>
      </div>

      {/* ═══ SECTION C: Wealth Snapshot ═══ */}
      <div onClick={() => nav('/expenses')} style={{
        background: 'var(--gradient-wealth)', borderRadius: 'var(--radius-xl)',
        padding: 20, marginBottom: 16, cursor: 'pointer', color: 'white',
        boxShadow: '0 6px 20px rgba(76,175,80,0.25)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Monthly Overview</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <div className="num-l" style={{ fontSize: 32, color: 'white', lineHeight: 1.1 }}>₹{animatedIncome.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Total Income</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: budgetPct > 80 ? '#FFB3B3' : '#A7F3D0' }}>
              {budgetPct}% used
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 1, marginBottom: 8, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.2)' }}>
          <div style={{ width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 80 ? '#FFB3B3' : 'rgba(255,255,255,0.9)', borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCA5A5' }} />
            <span style={{ fontSize: 12, opacity: 0.85 }}>Spent ₹{animatedExpense.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDE68A' }} />
            <span style={{ fontSize: 12, opacity: 0.85 }}>Saved ₹{savings.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* ═══ SECTION D: Active Goals (Horizontal scroll) ═══ */}
      {goals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="title-m" style={{ fontSize: 15 }}>🎯 Your Goals</span>
            <button className="btn-ghost body-s" onClick={() => nav('/goals')} style={{ fontWeight: 600, fontSize: 13 }}>All Goals →</button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
            {goals.slice(0, 4).map((g, i) => {
              const pct = g.target_amount > 0 ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100) : 0
              return (
                <div key={i} onClick={() => nav('/goals')} className="card" style={{
                  minWidth: 200, padding: 16, cursor: 'pointer', scrollSnapAlign: 'start', flexShrink: 0,
                  background: 'var(--gradient-card)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{g.icon || '🎯'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6, marginBottom: 8 }}>
                    <div className="progress-fill" style={{ width: pct + '%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="body-s text-secondary">₹{Number(g.current_amount).toLocaleString('en-IN')} / ₹{Number(g.target_amount).toLocaleString('en-IN')}</span>
                    <span className="num-s" style={{ color: 'var(--viya-primary-500)', fontWeight: 700, fontSize: 13 }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ SECTION E: Ask Viya ═══ */}
      <div className="card" onClick={() => nav('/chat')} style={{
        padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--gradient-night)', color: 'white', border: 'none',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          <img src="/logo.png" alt="Viya" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Ask Viya anything</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Diet, study plan, tax tips, mental health...</div>
        </div>
        <Zap size={16} color="var(--viya-gold-500)" />
      </div>

      {/* ═══ SECTION F: Quick Actions Grid (2×4) ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div className="title-m" style={{ marginBottom: 10, fontSize: 15 }}>What do you need?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {actions.map((a, i) => (
            <button key={i} onClick={() => nav(a.to)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', borderRadius: 'var(--radius-lg)',
              background: i === 0 ? 'var(--gradient-primary)' : 'var(--bg-card)',
              border: i === 0 ? 'none' : '1px solid var(--border-light)',
              cursor: 'pointer', transition: 'transform 0.1s',
              color: i === 0 ? 'white' : 'inherit',
              boxShadow: i === 0 ? 'var(--shadow-teal)' : 'var(--shadow-1)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: i === 0 ? 'rgba(255,255,255,0.2)' : a.color + '15',
                color: i === 0 ? 'white' : a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{a.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 500, color: i === 0 ? 'white' : 'var(--text-secondary)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SECTION G: Recent Transactions ═══ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="title-m" style={{ fontSize: 15 }}>Recent Activity</span>
          <button className="btn-ghost body-s" onClick={() => nav('/expenses')} style={{ fontWeight: 600, fontSize: 13 }}>See All</button>
        </div>
        {(data?.recent_transactions || []).slice(0, 5).map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: t.type === 'income' ? 'var(--viya-success-light)' : 'var(--viya-neutral-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {t.type === 'income' ? '💰' : '🛒'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.description || t.category}</div>
              <div className="body-s text-secondary">{t.category}</div>
            </div>
            <div className="num-s" style={{
              color: t.type === 'income' ? 'var(--viya-success)' : 'var(--viya-error)',
              fontWeight: 600,
            }}>
              {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
        {(!data?.recent_transactions?.length) && (
          <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>
            No transactions yet. Say "spent 500 on food" to start! 🚀
          </div>
        )}
      </div>

      {/* ═══ Quick Add Bar (inline, scrollable) ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div className="title-m" style={{ marginBottom: 10, fontSize: 15 }}>⚡ Quick Add</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: <Plus size={18}/>, label: 'Expense', to: '/expenses', bg: 'var(--gradient-primary)', color: 'white' },
            { icon: <ClipboardList size={18}/>, label: 'Task', to: '/reminders', bg: 'var(--bg-card)', color: 'var(--viya-violet-500)' },
            { icon: <Bell size={18}/>, label: 'Reminder', to: '/reminders', bg: 'var(--bg-card)', color: 'var(--viya-gold-500)' },
            { icon: <Activity size={18}/>, label: 'Health Log', to: '/health', bg: 'var(--bg-card)', color: '#FF6B6B' },
          ].map((a, i) => (
            <button key={i} onClick={() => nav(a.to)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 8px', borderRadius: 'var(--radius-lg)',
              background: a.bg, color: a.color,
              border: i === 0 ? 'none' : '1px solid var(--border-light)',
              boxShadow: i === 0 ? 'var(--shadow-teal)' : 'var(--shadow-1)',
              cursor: 'pointer', transition: 'transform 0.1s',
            }}>
              {a.icon}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom spacing for nav bar */}
      <div style={{ height: 20 }} />
    </div>
  )
}

