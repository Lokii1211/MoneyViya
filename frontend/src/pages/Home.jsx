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
  const [bills, setBills] = useState([])
  const [fabOpen, setFabOpen] = useState(false)

  const nav = useNavigate()
  const period = getPeriod()
  const festival = getCurrentFestival()

  useEffect(() => {
    if (phone) {
      api.getUser(phone).then(d => { if (d) { setData(d); setUser(p => ({ ...p, ...d })) } })
      api.getHabits(phone).then(h => { if (h) setHabits(h) })
      api.getCheckins(phone).then(c => { if (c) setCheckins(c) })
      api.getGoals(phone).then(g => { if (g) setGoals(g) })
      api.getBills(phone).then(b => { if (b) setBills(b) })
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
    if (g) briefItems.push({ icon: '🎯', text: `${g.name}: ₹${Number(g.current_amount)} of ₹${Number(g.target_amount)}` })
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
            {formatINR(moneyLeft < 0 ? -animatedMoney : animatedMoney)}
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
            <div className="num-l" style={{ fontSize: 32, color: 'white', lineHeight: 1.1 }}>{formatINR(animatedIncome)}</div>
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
            <span style={{ fontSize: 12, opacity: 0.85 }}>Spent {formatINR(animatedExpense)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDE68A' }} />
            <span style={{ fontSize: 12, opacity: 0.85 }}>Saved {formatINR(savings)}</span>
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
                    <span className="body-s text-secondary">₹{Number(g.current_amount)} / ₹{Number(g.target_amount)}</span>
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
              {t.type === 'income' ? '+' : '-'}₹{Number(t.amount)}
            </div>
          </div>
        ))}
        {(!data?.recent_transactions?.length) && (
          <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>
            No transactions yet. Say "spent 500 on food" to start! 🚀
          </div>
        )}
      </div>

      {/* ═══ GOALS ROW (horizontal scroll) ═══ */}
      {goals.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="title-m" style={{ fontSize: 15 }}>🎯 Your Goals</span>
            <button onClick={() => nav('/goals')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--viya-primary-500)', background: 'none', border: 'none', cursor: 'pointer' }}>All Goals →</button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
            {goals.slice(0, 5).map(g => {
              const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0
              return (
                <div key={g.id} onClick={() => nav('/goals')} style={{
                  minWidth: 200, padding: 16, borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-2)', cursor: 'pointer', scrollSnapAlign: 'start',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{g.icon || '🎯'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{g.name}</div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--viya-neutral-100)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--gradient-primary)', transition: 'width 0.6s ease' }} />
                  </div>
                  <div className="num-s" style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(g.current_amount)} / {formatINR(g.target_amount)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ HEALTH TODAY (2-card row) ═══ */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div onClick={() => nav('/health')} style={{
          flex: 1, padding: 16, borderRadius: 'var(--radius-xl)', cursor: 'pointer',
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF9800 100%)', color: 'white',
          boxShadow: '0 4px 16px rgba(255,107,107,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Droplets size={14} /> <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>STEPS</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 22, lineHeight: 1 }}>0</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>/ 10,000 steps</div>
          <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, opacity: 0.85 }}>Open Health 💪</div>
        </div>
        <div onClick={() => nav('/health')} style={{
          flex: 1, padding: 16, borderRadius: 'var(--radius-xl)', cursor: 'pointer',
          background: 'linear-gradient(135deg, #00C853 0%, #00B0B6 100%)', color: 'white',
          boxShadow: '0 4px 16px rgba(0,200,83,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Heart size={14} /> <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>CALORIES</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 22, lineHeight: 1 }}>0</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>/ 2,200 kcal</div>
          <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, opacity: 0.85 }}>Log Meal 🍽️</div>
        </div>
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

      {/* ═══ FAB — Talk to Viya ═══ */}
      {/* EMAIL ACTION STRIP (PRD lines 581-608) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="title-m" style={{ fontSize: 15, color: 'var(--coral-500)' }}>📧 Needs Attention</span>
          <button onClick={() => nav('/email')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--viya-primary-500)', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { icon: '🔴', title: 'Credit Card Due', sub: 'Check your bills section', border: 'var(--coral-500)', actions: ['Pay Now', 'Remind'] },
            { icon: '📅', title: 'Upcoming Meetings', sub: 'Check calendar for details', border: 'var(--info-500)', actions: ['View', 'Dismiss'] },
            { icon: '📦', title: 'Package Updates', sub: 'Track your deliveries', border: 'var(--cosmos-400)', actions: ['Track', 'Alert'] },
          ].map((c, i) => (
            <div key={i} onClick={() => nav('/email')} style={{
              minWidth: 260, padding: 14, borderRadius: 'var(--r-xl)', background: 'var(--bg-card)',
              border: '1px solid var(--border-light)', borderLeft: `4px solid ${c.border}`,
              boxShadow: 'var(--sh-2)', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span>{c.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{c.sub}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {c.actions.map((a, j) => (
                  <button key={j} style={{
                    padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
                    background: j === 0 ? c.border : 'var(--bg-secondary)',
                    color: j === 0 ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer',
                  }}>{a}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BILLS DUE STRIP (PRD lines 666-673) */}
      {bills.filter(b => b.status !== 'paid').length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="title-m" style={{ fontSize: 15 }}>🧾 Upcoming Bills</span>
            <button onClick={() => nav('/bills')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--viya-primary-500)', background: 'none', border: 'none', cursor: 'pointer' }}>All Bills →</button>
          </div>
          {bills.filter(b => b.status !== 'paid').slice(0, 4).map((b, i) => {
            const daysLeft = b.due_date ? Math.ceil((new Date(b.due_date) - Date.now()) / 86400000) : 99
            const dotColor = daysLeft <= 1 ? 'var(--coral-500)' : daysLeft <= 3 ? 'var(--amber-500)' : 'var(--emerald-500)'
            return (
              <div key={b.id || i} onClick={() => nav('/bills')} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{b.name}</div>
                  <div className="body-s text-secondary">{b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}</div>
                </div>
                <div className="num-s" style={{ fontWeight: 600, color: dotColor }}>{formatINR(b.amount)}</div>
                {daysLeft <= 1 && <button style={{ padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600, background: 'var(--coral-500)', color: 'white', border: 'none' }}>Pay Now</button>}
              </div>
            )
          })}
        </div>
      )}

      {/* FAB with Radial Menu (PRD lines 674-693) */}
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 140 }} />}
      <div style={{ position: 'fixed', bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 20px)', right: 'calc(50% - 195px)', zIndex: 160 }}>
        {fabOpen && [
          { emoji: '🎤', label: 'Voice', to: '/chat', angle: -90 },
          { emoji: '➕', label: 'Expense', to: '/expenses', angle: -144 },
          { emoji: '🔔', label: 'Remind', to: '/reminders', angle: -198 },
          { emoji: '✅', label: 'Task', to: '/reminders', angle: -252 },
          { emoji: '📝', label: 'Note', to: '/chat', angle: -306 },
          { emoji: '📸', label: 'Scan', to: '/chat?q=scan', angle: -360 },
        ].map((item, i) => {
          const rad = (item.angle * Math.PI) / 180
          const x = Math.cos(rad) * 80, y = Math.sin(rad) * 80
          return (
            <div key={i} onClick={() => { setFabOpen(false); nav(item.to) }} style={{
              position: 'absolute', bottom: 30 - y, left: 30 + x - 25,
              width: 50, height: 50, borderRadius: '50%', background: 'var(--bg-card)',
              boxShadow: 'var(--sh-3)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              animation: `scaleIn 0.2s var(--ease-spring) ${i * 40}ms both`,
            }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          )
        })}
        <div
          onClick={() => { if (!fabOpen) nav('/chat') }}
          onContextMenu={(e) => { e.preventDefault(); setFabOpen(!fabOpen) }}
          onTouchStart={() => { const t = setTimeout(() => setFabOpen(true), 400); window._fabTimer = t }}
          onTouchEnd={() => clearTimeout(window._fabTimer)}
          style={{
            width: 60, height: 60, borderRadius: 'var(--r-full)',
            background: fabOpen ? 'var(--coral-500)' : 'var(--gradient-hero)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--sh-teal)', cursor: 'pointer', transition: 'transform 0.15s, background 0.2s',
            transform: fabOpen ? 'rotate(45deg)' : 'scale(1)',
            animation: fabOpen ? 'none' : 'fabBreathe 4s ease-in-out infinite',
          }}
          aria-label="Talk to Viya"
        >
          {fabOpen ? <Plus size={26} /> : <img src="/logo.png" alt="Viya" style={{ width: 30, height: 30, objectFit: 'contain' }} />}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}
