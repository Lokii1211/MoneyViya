import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useCountUp, getCurrentFestival, formatINR, getGreeting, getGreetingEmoji } from '../lib/utils'
import { TrendingUp, TrendingDown, Plus, Flame, Target, BarChart3, Zap, Users, Heart, Sparkles, Bell, MessageCircle, ClipboardList, Activity, Droplets, CreditCard } from 'lucide-react'

const BRIEF_ITEMS_POOL = {
  morning: [
    { icon: '\u{1F4B3}', text: 'Review your pending bills before the day starts' },
    { icon: '\u{1F4AA}', text: 'Morning workout streak — keep it going!' },
    { icon: '\u{1F4CA}', text: 'Check your weekly spending report' },
  ],
  afternoon: [
    { icon: '\u{1F371}', text: 'Log your lunch expense to stay on budget' },
    { icon: '\u{1F4C8}', text: '₹100/day saved = ₹36,500/year!' },
    { icon: '\u{1F4A1}', text: 'Take a 10-min walk — boosts productivity 40%' },
  ],
  evening: [
    { icon: '\u{1F305}', text: 'Log expenses before they slip away' },
    { icon: '\u{1F3CB}️', text: 'Hit the gym? Log your workout!' },
    { icon: '\u{1F4D6}', text: '20 mins reading/day = 30 books/year!' },
  ],
  night: [
    { icon: '\u{1F319}', text: 'Review today\'s habits before bed' },
    { icon: '\u{1F634}', text: 'Good sleep = better financial decisions' },
    { icon: '\u{1F4DD}', text: 'Journal your wins — even small ones!' },
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
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const period = getPeriod()
  const festival = getCurrentFestival()

  useEffect(() => {
    if (phone) {
      Promise.all([
        api.getUser(phone), api.getHabits(phone), api.getCheckins(phone),
        api.getGoals(phone), api.getBills(phone),
      ]).then(([d, h, c, g, b]) => {
        if (d) { setData(d); setUser(p => ({ ...p, ...d })) }
        if (h) setHabits(h); if (c) setCheckins(c)
        if (g) setGoals(g); if (b) setBills(b)
        setLoading(false)
      }).catch(() => setLoading(false))
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

  const briefItems = []
  if (moneyLeft < 200 && moneyLeft > 0) briefItems.push({ icon: '⚠️', text: `Only ₹${moneyLeft} left today — spend wisely!` })
  if (moneyLeft < 0) briefItems.push({ icon: '\u{1F534}', text: `Over budget by ₹${Math.abs(moneyLeft)} — review expenses` })
  if (maxStreak > 0) briefItems.push({ icon: '\u{1F525}', text: `${maxStreak}-day streak — don't break it!` })
  if (goals.length > 0) {
    const g = goals.find(g => g.current_amount < g.target_amount)
    if (g) briefItems.push({ icon: '\u{1F3AF}', text: `${g.name}: ₹${Number(g.current_amount)} of ₹${Number(g.target_amount)}` })
  }
  const poolItems = BRIEF_ITEMS_POOL[period]
  while (briefItems.length < 3) { briefItems.push(poolItems[briefItems.length % poolItems.length]); if (briefItems.length >= 3) break }

  const actions = [
    { icon: <Plus size={18}/>, label: 'Add Expense', to: '/expenses', color: 'var(--viya-success)' },
    { icon: <Flame size={18}/>, label: 'Habits', to: '/habits', color: 'var(--viya-gold-500)' },
    { icon: <Target size={18}/>, label: 'Goals', to: '/goals', color: 'var(--viya-error)' },
    { icon: <Activity size={18}/>, label: 'Health', to: '/health', color: '#FF7062' },
    { icon: <CreditCard size={18}/>, label: 'Bills', to: '/bills', color: 'var(--viya-warning)' },
    { icon: <Users size={18}/>, label: 'Lending', to: '/lending', color: '#f59e0b' },
    { icon: <BarChart3 size={18}/>, label: 'Report', to: '/report', color: 'var(--viya-primary-400)' },
    { icon: <Sparkles size={18}/>, label: 'Premium', to: '/premium', color:'var(--viya-primary-700)' },
  ]
  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const anim = (d) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: d } })

  return (
    <>
    <div className="page page-padded">
      {loading ? (
        <div>
          <motion.div {...anim(0)} className="home-greeting">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div className="flex-1">
              <div className="skeleton mb-2" style={{ height: 18, width: '60%', borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
            </div>
          </motion.div>
          <motion.div {...anim(0.1)} className="skeleton mb-16" style={{ height: 160, borderRadius: 20 }} />
          <div className="stat-grid">
            <motion.div {...anim(0.2)} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            <motion.div {...anim(0.25)} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
          </div>
          <div className="qa-grid-4 mb-16">
            {[0,1,2,3,4,5,6,7].map(i => (
              <motion.div key={i} {...anim(0.3 + i * 0.04)} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
            ))}
          </div>
          <motion.div {...anim(0.5)} className="skeleton mb-12" style={{ height: 80, borderRadius: 14 }} />
          <motion.div {...anim(0.55)} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        </div>
      ) : (
        <>
          <div className="home-greeting">
            <div className="avatar">{localStorage.getItem('mv_avatar') || name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="home-greeting-name">{getGreeting()}, {name.split(' ')[0]}! {getGreetingEmoji()}</div>
              <div className="body-s text-secondary">Your AI Life & Wealth Partner</div>
            </div>
          </div>

          <div className="home-section">
            <div className="section-head">
              <span className="title-m title-m-15" style={{ color: 'var(--coral-500)' }}>{'\u{1F514}'} Needs Attention</span>
              <button className="link-right" onClick={() => nav('/email')}>View All {'→'}</button>
            </div>
            <div className="scroll-snap-x gap-3">
              {[
                { icon: '\u{1F534}', title: 'Credit Card Due', sub: 'Check your bills section', border: 'var(--coral-500)', actions: ['Pay Now', 'Remind'], to: '/bills' },
                { icon: '\u{1F4C5}', title: 'Upcoming Meetings', sub: 'Check calendar for details', border: 'var(--info-500)', actions: ['View', 'Dismiss'], to: '/calendar' },
                { icon: '\u{1F4E6}', title: 'Package Updates', sub: 'Track your deliveries', border: 'var(--cosmos-400)', actions: ['Track', 'Alert'], to: '/email' },
              ].map((c, i) => (
                <div key={i} onClick={() => nav(c.to)} className="attention-card card-press" style={{ borderLeft: `4px solid ${c.border}` }}>
                  <div className="attention-header"><span>{c.icon}</span><span className="attention-title">{c.title}</span></div>
                  <div className="attention-sub">{c.sub}</div>
                  <div className="attention-actions">
                    {c.actions.map((a, j) => (
                      <button key={j} className={`attention-btn ripple ${j === 0 ? 'primary' : 'secondary'}`}
                        style={j === 0 ? { background: c.border } : undefined}>{a}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {festival && (
            <div onClick={() => nav('/chat?q=' + encodeURIComponent(festival.greeting))}
              className="card festival-banner" style={{ background: festival.colors.bg }}>
              <span className="festival-emoji">{festival.emoji}</span>
              <div className="festival-body">
                <div className="festival-title">{festival.greeting}</div>
                <div className="festival-sub">Tap for festive money tips! {'\u{1F381}'}</div>
              </div>
            </div>
          )}

          <div onClick={() => nav('/chat?q=daily+briefing')} className="daily-brief">
            <div className="brief-top">
              <span className="brief-label">
                {period === 'morning' ? '☀️' : period === 'evening' ? '\u{1F305}' : period === 'night' ? '\u{1F319}' : '\u{1F324}️'} Daily Brief
              </span>
              <span className="brief-time">{formatTime()}</span>
            </div>
            <div className="brief-headline">{briefItems.length} things need you today</div>
            <div className="brief-list stagger">
              {briefItems.slice(0, 4).map((item, i) => (
                <div key={i} className="brief-item animate-slideUp" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards' }}>
                  <span className="brief-item-icon">{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
            <button className="brief-cta">Handle All with Viya {'→'}</button>
          </div>

          <div className="stat-grid">
            <div onClick={() => nav('/expenses')} className="hero-card green clickable">
              <div className="stat-card-label">Money Left</div>
              <div className="num-m num-28" style={{ color: moneyLeft >= 0 ? '#fff' : '#FFB3B3' }}>
                {formatINR(moneyLeft < 0 ? -animatedMoney : animatedMoney)}
              </div>
              <div className="stat-card-sub">
                {moneyLeft >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} ₹{budget} daily budget
              </div>
              <div className="hero-orb" />
            </div>
            <div onClick={() => nav('/habits')} className="hero-card violet clickable">
              <div className="stat-card-label">Today's Habits</div>
              <div className="num-m num-28">{todayDone}/{totalHabits || 7}</div>
              <div className="stat-card-sub"><Flame size={12}/> {maxStreak}-day streak</div>
              <div className="hero-orb" />
            </div>
          </div>

          <div onClick={() => nav('/expenses')} className="hero-card green wealth-overview clickable"
            style={{ padding: 20, boxShadow: '0 6px 20px rgba(76,175,80,0.25)' }}>
            <div className="stat-card-label">Monthly Overview</div>
            <div className="wealth-overview-top">
              <div>
                <div className="num-l num-32">{formatINR(animatedIncome)}</div>
                <div className="wealth-income-label">Total Income</div>
              </div>
              <div className="text-right">
                <span style={{ fontSize: 13, fontWeight: 600, color: budgetPct > 80 ? '#FFB3B3' : '#A7F3D0' }}>{budgetPct}% used</span>
              </div>
            </div>
            <div className="wealth-bar-track">
              <div style={{ width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 80 ? '#FFB3B3' : 'rgba(255,255,255,0.9)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
            <div className="wealth-legend">
              <div className="wealth-legend-item">
                <div className="wealth-legend-dot" style={{ background: '#FCA5A5' }} />
                <span className="wealth-legend-text">Spent {formatINR(animatedExpense)}</span>
              </div>
              <div className="wealth-legend-item">
                <div className="wealth-legend-dot" style={{ background: '#FDE68A' }} />
                <span className="wealth-legend-text">Saved {formatINR(savings)}</span>
              </div>
            </div>
          </div>

          {goals.length > 0 && (
            <div className="home-section">
              <div className="section-head">
                <span className="title-m title-m-15">{'\u{1F3AF}'} Your Goals</span>
                <button className="btn-ghost body-s" onClick={() => nav('/goals')}>All Goals {'→'}</button>
              </div>
              <div className="goal-scroll">
                {goals.slice(0, 4).map((g, i) => {
                  const pct = g.target_amount > 0 ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100) : 0
                  return (
                    <div key={i} onClick={() => nav('/goals')} className="card goal-scroll-card clickable">
                      <div className="goal-header-row">
                        <span className="goal-icon-lg">{g.icon || '\u{1F3AF}'}</span>
                        <span className="goal-name-text">{g.name}</span>
                      </div>
                      <div className="progress-bar mb-8" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: pct + '%' }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="body-s text-secondary">₹{Number(g.current_amount)} / ₹{Number(g.target_amount)}</span>
                        <span className="goal-pct-text num-s">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card-press ask-viya-bar hero-card night clickable" onClick={() => nav('/chat')}>
            <img src="/logo.png" alt="Viya AI" className="ask-viya-logo" />
            <div className="flex-1">
              <div className="ask-viya-title">Ask Viya anything</div>
              <div className="ask-viya-sub">Create, update, delete, check-in — all in chat</div>
            </div>
            <Zap size={16} color="var(--viya-gold-500)" />
          </div>

          <div className="stagger-children home-section">
            <div className="title-m title-m-14 mb-8">{'⚡'} Quick Actions</div>
            <div className="qa-grid-4">
              {actions.map((a, i) => (
                <button key={i} onClick={() => nav(a.to)} className={`qa-btn ripple ${i === 0 ? 'highlight' : 'normal'}`}>
                  <div className="qa-icon-wrap" style={i !== 0 ? { background: a.color + '15', color: a.color } : undefined}>
                    {a.icon}
                  </div>
                  <span className="qa-btn-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="home-section">
            <div className="title-m title-m-15 mb-10">{'\u{1F680}'} Explore More</div>
            <div className="explore-grid">
              {[
                { emoji: '\u{1F4CA}', label: 'Weekly Report', to: '/weekly-report' },
                { emoji: '☀️', label: 'Morning Brief', to: '/morning-brief' },
                { emoji: '✂️', label: 'Sub Audit', to: '/subscription-audit' },
                { emoji: '\u{1F381}', label: 'Refer & Earn', to: '/referral' },
              ].map((l, i) => (
                <button key={i} onClick={() => nav(l.to)} className="feature-card ripple">
                  <span className="feature-emoji">{l.emoji}</span>
                  <span className="feature-label">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="home-section-20">
            <div className="section-head">
              <span className="title-m title-m-15">Recent Activity</span>
              <button className="btn-ghost body-s" onClick={() => nav('/expenses')}>See All</button>
            </div>
            {(data?.recent_transactions || []).slice(0, 5).map((t, i) => (
              <div key={i} className="txn-list-item" style={{ borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                <div className={`txn-icon-box ${t.type}`}>{t.type === 'income' ? '\u{1F4B0}' : '\u{1F6D2}'}</div>
                <div className="flex-1">
                  <div className="txn-desc">{t.description || t.category}</div>
                  <div className="body-s text-secondary">{t.category}</div>
                </div>
                <div className="num-s" style={{ color: t.type === 'income' ? 'var(--viya-success)' : 'var(--viya-error)', fontWeight: 600 }}>
                  {t.type === 'income' ? '+' : '-'}₹{Number(t.amount)}
                </div>
              </div>
            ))}
            {(!data?.recent_transactions?.length) && (
              <div className="empty-txn card">No transactions yet. Say "spent 500 on food" to start! {'\u{1F680}'}</div>
            )}
          </div>

          <div className="health-pair">
            <div onClick={() => nav('/health')} className="health-card steps health-card-home clickable">
              <div className="flex items-center gap-1 mb-8"><Droplets size={14} /> <span className="health-label">STEPS</span></div>
              <div className="health-value">0</div>
              <div className="health-sub">/ 10,000 steps</div>
              <div className="health-cta">Open Health {'\u{1F4AA}'}</div>
            </div>
            <div onClick={() => nav('/health')} className="health-card calories health-card-home clickable">
              <div className="flex items-center gap-1 mb-8"><Heart size={14} /> <span className="health-label">CALORIES</span></div>
              <div className="health-value">0</div>
              <div className="health-sub">/ 2,200 kcal</div>
              <div className="health-cta">Log Meal {'\u{1F37D}️'}</div>
            </div>
          </div>

          <div className="home-section-20">
            <div className="title-m title-m-14 mb-8">{'✏️'} Manual Quick Add</div>
            <div className="quick-add-bar">
              {[
                { icon: <Plus size={18}/>, label: 'Expense', to: '/expenses', bg: 'var(--gradient-primary)', color: 'white', primary: true },
                { icon: <ClipboardList size={18}/>, label: 'Task', to: '/reminders', bg: 'var(--surface)', color: 'var(--violet)' },
                { icon: <Bell size={18}/>, label: 'Reminder', to: '/reminders', bg: 'var(--surface)', color: 'var(--gold)' },
                { icon: <Activity size={18}/>, label: 'Health', to: '/health', bg: 'var(--surface)', color: 'var(--red)' },
              ].map((a, i) => (
                <button key={i} onClick={() => nav(a.to)} className={`quick-add-btn ripple ${a.primary ? 'primary-bg' : 'normal-bg'}`}
                  style={{ background: a.bg, color: a.color }}>
                  {a.icon}<span className="quick-add-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {unpaidBills.length > 0 && (
            <div className="home-section-20">
              <div className="section-head">
                <span className="title-m title-m-15">{'\u{1F9FE}'} Upcoming Bills</span>
                <button className="link-right" onClick={() => nav('/bills')}>All Bills {'→'}</button>
              </div>
              {unpaidBills.slice(0, 4).map((b, i) => {
                const daysLeft = b.due_date ? Math.ceil((new Date(b.due_date) - Date.now()) / 86400000) : 99
                const dotColor = daysLeft <= 1 ? 'var(--coral-500)' : daysLeft <= 3 ? 'var(--amber-500)' : 'var(--emerald-500)'
                return (
                  <div key={b.id || i} onClick={() => nav('/bills')} className="bill-row"
                    style={{ borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <div className="bill-dot" style={{ background: dotColor }} />
                    <div className="flex-1">
                      <div className="bill-name">{b.name}</div>
                      <div className="body-s text-secondary">{b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date'}</div>
                    </div>
                    <div className="num-s" style={{ fontWeight: 600, color: dotColor }}>{formatINR(b.amount)}</div>
                    {daysLeft <= 1 && <button className="bill-pay-btn ripple">Pay Now</button>}
                  </div>
                )
              })}
            </div>
          )}
          <div className="spacer-20" />
        </>
      )}
    </div>
    <button className="viya-fab-fixed" onClick={() => nav('/chat')} aria-label="Talk to Viya"><MessageCircle size={26} /></button>
    </>
  )
}
