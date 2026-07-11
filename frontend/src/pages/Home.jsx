import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useCountUp, getCurrentFestival, formatINR, getGreeting, getGreetingEmoji, getGreetingKey } from '../lib/utils'
import { t } from '../lib/i18n'
import { TrendingUp, TrendingDown, Plus, Flame, Target, BarChart3, Zap, Activity, CreditCard, MessageCircle, Link2, Bell, PieChart, ChevronRight, HandCoins } from 'lucide-react'

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

function formatDateLine() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })
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

  const smsEnabled = localStorage.getItem('mv_sms_enabled') === 'true'

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
  if (moneyLeft < 0) briefItems.push({ icon: '\u{1F534}', text: `Over budget by ₹${Math.abs(moneyLeft)} — review expenses`, to: '/expenses' })
  else if (moneyLeft < 200) briefItems.push({ icon: '⚠️', text: `Only ₹${moneyLeft} left today — spend wisely!`, to: '/expenses' })
  const overdueBills = bills.filter(b => b.status !== 'paid' && b.due_date && new Date(b.due_date) < Date.now())
  const dueSoonBills = bills.filter(b => b.status !== 'paid' && b.due_date && !overdueBills.includes(b) && (new Date(b.due_date) - Date.now()) / 86400000 <= 2)
  if (overdueBills.length) briefItems.push({ icon: '\u{1F9FE}', text: `${overdueBills.length} bill${overdueBills.length > 1 ? 's' : ''} overdue — pay now`, to: '/bills' })
  else if (dueSoonBills.length) briefItems.push({ icon: '\u{1F9FE}', text: `${dueSoonBills.map(b => b.name).slice(0, 2).join(', ')} due soon`, to: '/bills' })
  if (totalHabits > 0 && todayDone < totalHabits) briefItems.push({ icon: '\u{1F525}', text: `${totalHabits - todayDone} habit${totalHabits - todayDone > 1 ? 's' : ''} left today${maxStreak > 0 ? ` — keep your ${maxStreak}-day streak!` : ''}`, to: '/habits' })
  else if (maxStreak > 0) briefItems.push({ icon: '\u{1F525}', text: `${maxStreak}-day streak — don't break it!`, to: '/habits' })
  if (goals.length > 0) {
    const g = goals.find(g => g.current_amount < g.target_amount)
    if (g) briefItems.push({ icon: '\u{1F3AF}', text: `${g.name}: ₹${Number(g.current_amount)} of ₹${Number(g.target_amount)}`, to: '/goals' })
  }
  const poolItems = BRIEF_ITEMS_POOL[period]
  while (briefItems.length < 3) { briefItems.push({ ...poolItems[briefItems.length % poolItems.length], to: '/chat?q=' + encodeURIComponent(poolItems[briefItems.length % poolItems.length].text) }); if (briefItems.length >= 3) break }

  const actions = [
    { icon: <Plus size={18}/>,        label: 'Add Expense', to: '/expenses',  color: 'var(--viya-success)' },
    { icon: <Target size={18}/>,      label: 'Goals',       to: '/goals',     color: 'var(--viya-error)' },
    { icon: <Flame size={18}/>,       label: 'Habits',      to: '/habits',    color: 'var(--viya-gold-500)' },
    { icon: <Bell size={18}/>,        label: 'Reminders',   to: '/reminders', color: 'var(--primary)' },
    { icon: <CreditCard size={18}/>,  label: 'Bills',       to: '/bills',     color: 'var(--viya-warning)' },
    { icon: <PieChart size={18}/>,    label: 'Budget',      to: '/budget',    color: '#22D3EE' },
    { icon: <HandCoins size={18}/>,   label: 'Lending',     to: '/lending',   color: '#A78BFA' },
    { icon: <Activity size={18}/>,    label: 'Health',      to: '/health',    color: '#FF7062' },
    { icon: <BarChart3 size={18}/>,   label: 'Report',      to: '/report',    color: 'var(--viya-primary-400)' },
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
            {[0,1,2,3,4,5].map(i => (
              <motion.div key={i} {...anim(0.3 + i * 0.04)} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
            ))}
          </div>
          <motion.div {...anim(0.5)} className="skeleton mb-12" style={{ height: 80, borderRadius: 14 }} />
          <motion.div {...anim(0.55)} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        </div>
      ) : (
        <>
          {/* Greeting */}
          <div className="home-greeting">
            <div className="avatar">
              {localStorage.getItem('mv_avatar')?.startsWith('data:image')
                ? <img src={localStorage.getItem('mv_avatar')} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                : localStorage.getItem('mv_avatar') || name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="home-greeting-name">{t(getGreetingKey())}, {name.split(' ')[0]}! {getGreetingEmoji()}</div>
              <div className="body-s text-secondary">{formatDateLine()}</div>
            </div>
          </div>

          {/* Connect Bank card — show if no SMS and no bank connected */}
          {!smsEnabled && (
            <div className="insight-card" onClick={() => nav('/bank-connect')}>
              <div className="insight-icon">
                <Link2 size={20} />
              </div>
              <div className="insight-text">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Auto-track expenses</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Connect bank SMS or sync bank account</div>
              </div>
              <button
                className="btn-primary"
                onClick={(e) => { e.stopPropagation(); nav('/bank-connect') }}
                style={{ padding: '8px 16px', fontSize: 12, borderRadius: 10 }}
              >
                Connect
              </button>
            </div>
          )}

          {/* Festival banner */}
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

          {/* Daily Brief */}
          <div className="daily-brief" style={{ borderRadius: 20 }}>
            <div className="brief-top">
              <span className="brief-label">
                {period === 'morning' ? '☀️' : period === 'evening' ? '\u{1F305}' : period === 'night' ? '\u{1F319}' : '\u{1F324}️'} Daily Brief
              </span>
              <button className="brief-viewall" onClick={() => nav('/reminders')}>Reminders {'→'}</button>
            </div>
            <div className="brief-headline">{briefItems.length} things need you today</div>
            <div className="brief-list stagger">
              {briefItems.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="brief-item brief-item-clickable animate-slideUp"
                  style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards' }}
                  onClick={() => nav(item.to || '/chat?q=daily+briefing')}
                >
                  <span className="brief-item-icon">{item.icon}</span><span>{item.text}</span>
                  <ChevronRight size={14} className="brief-item-chevron" />
                </div>
              ))}
            </div>
          </div>

          {/* Hero stat cards */}
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

          {/* Monthly Overview */}
          <div onClick={() => nav('/expenses')} className="hero-card green wealth-overview clickable">
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

          {/* Goals */}
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

          {/* Ask Viya */}
          <div className="card-press ask-viya-bar hero-card night clickable" onClick={() => nav('/chat')}>
            <img src="/logo.png" alt="Viya AI" className="ask-viya-logo" />
            <div className="flex-1">
              <div className="ask-viya-title">Ask Viya anything</div>
              <div className="ask-viya-sub">Create, update, delete, check-in — all in chat</div>
            </div>
            <Zap size={16} color="var(--viya-gold-500)" />
          </div>

          {/* Quick Actions */}
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

          {/* Recent Activity */}
          <div className="home-section-20">
            <div className="section-head">
              <span className="title-m title-m-15">Recent Activity</span>
              <button className="btn-ghost body-s" onClick={() => nav('/expenses')}>See All</button>
            </div>
            {(data?.recent_transactions || []).slice(0, 4).map((t, i) => (
              <div key={i} className="txn-list-item" style={{ borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
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
              <div className="empty-txn card" style={{ textAlign: 'center', padding: '24px 16px', opacity: 0.7 }}>
                No transactions yet — say "spent 500 on food" to Viya to start tracking.
              </div>
            )}
          </div>

          {/* Upcoming Bills */}
          {unpaidBills.length > 0 && (
            <div className="home-section-20">
              <div className="section-head">
                <span className="title-m title-m-15">{'\u{1F9FE}'} Upcoming Bills</span>
                <button className="link-right" onClick={() => nav('/bills')}>All Bills {'→'}</button>
              </div>
              {unpaidBills.slice(0, 3).map((b, i) => {
                const daysLeft = b.due_date ? Math.ceil((new Date(b.due_date) - Date.now()) / 86400000) : 99
                const dotColor = daysLeft <= 1 ? 'var(--coral-500)' : daysLeft <= 3 ? 'var(--amber-500)' : 'var(--emerald-500)'
                return (
                  <div key={b.id || i} onClick={() => nav('/bills')} className="bill-row"
                    style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
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
    {/* WhatsApp FAB — bottom-left */}
    <a href="https://wa.me/917305021304?text=Hi" target="_blank" rel="noopener" className="whatsapp-fab" aria-label="Chat on WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
    {/* Ask Viya FAB — bottom-right */}
    <button className="viya-fab-fixed" onClick={() => nav('/chat')} aria-label="Ask Viya" title="Ask Viya">
      <MessageCircle size={22} />
    </button>
    </>
  )
}
