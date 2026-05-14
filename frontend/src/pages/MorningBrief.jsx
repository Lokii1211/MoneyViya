import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Cloud, Zap, ChevronRight, Bell, Calendar, CreditCard, Heart, Mail, TrendingUp } from 'lucide-react'

const BRIEF_DATA = {
  greeting: 'Good Morning, Rahul! ☀️',
  date: 'Wednesday, May 14, 2026',
  weather: '28°C, Partly Cloudy',
  quote: '"The secret of getting ahead is getting started." — Mark Twain',
}

const TODAY_ITEMS = [
  {
    type: 'bill', priority: 'high', emoji: '🧾', color: 'var(--coral-500)',
    title: 'Electricity bill due today',
    detail: '₹2,340 · BESCOM · Auto-pay OFF',
    action: 'Pay Now',
    actionRoute: '/bills',
  },
  {
    type: 'meeting', priority: 'medium', emoji: '📅', color: 'var(--info-500)',
    title: '2 meetings today',
    detail: '10:00 AM Team Standup · 3:00 PM Client Demo',
    action: 'View Calendar',
    actionRoute: '/calendar',
  },
  {
    type: 'medicine', priority: 'high', emoji: '💊', color: 'var(--emerald-500)',
    title: 'Morning medicines',
    detail: 'Vitamin D3, Omega-3 — Take after breakfast',
    action: 'Mark Taken',
    actionRoute: '/medicine',
  },
  {
    type: 'goal', priority: 'low', emoji: '🎯', color: 'var(--teal-500)',
    title: 'Emergency Fund milestone!',
    detail: 'You crossed 60%! ₹1,85,000 of ₹3,00,000',
    action: 'View Goal',
    actionRoute: '/goals',
  },
  {
    type: 'email', priority: 'medium', emoji: '📧', color: 'var(--amber-500)',
    title: '3 action emails overnight',
    detail: 'Amazon delivery · Flipkart refund · SBI statement',
    action: 'Review',
    actionRoute: '/email',
  },
  {
    type: 'health', priority: 'low', emoji: '🏃', color: 'var(--cosmos-500)',
    title: 'Yesterday: 8,420 steps',
    detail: 'Above your 7,500 goal! Streak: 4 days 🔥',
    action: 'View Health',
    actionRoute: '/health',
  },
]

const PROACTIVE_TIPS = [
  { emoji: '💡', text: 'Your Swiggy spend is ₹2,400 this week. Last week was ₹1,800. Cook one meal today to stay on track.' },
  { emoji: '📈', text: 'Nifty 50 is up 1.2% today. Your portfolio gained ₹4,200 since Monday.' },
  { emoji: '⏰', text: 'FD maturity in 5 days: ₹50,000 from SBI. Reinvest or transfer to goals?' },
]

const SPENDING_SNAPSHOT = {
  todayBudget: 1500,
  spentSoFar: 320,
  weekTotal: 18400,
  weekBudget: 25000,
}

export default function MorningBrief() {
  const nav = useNavigate()

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...TODAY_ITEMS].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 30%, #FFD54F 60%, #FFF176 100%)',
        padding: '50px 20px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', top: 20, right: -20,
        }} />
        <div style={{
          position: 'absolute', width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', top: 60, right: 50,
        }} />

        <button onClick={() => nav(-1)} style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.3)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}><ArrowLeft size={16} color="white" /></button>

        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, color: 'white', marginBottom: 2 }}>
          {BRIEF_DATA.greeting}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
          {BRIEF_DATA.date}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          <Cloud size={14} /> {BRIEF_DATA.weather}
        </div>

        {/* Quote */}
        <div style={{
          marginTop: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-lg)',
          padding: '10px 14px', fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.5,
        }}>
          {BRIEF_DATA.quote}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Budget Snapshot */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
          border: '1px solid var(--border-light)', marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            💳 Today's Budget
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--emerald-500)' }}>
              ₹{(SPENDING_SNAPSHOT.todayBudget - SPENDING_SNAPSHOT.spentSoFar).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>remaining today</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${(SPENDING_SNAPSHOT.spentSoFar / SPENDING_SNAPSHOT.todayBudget) * 100}%`,
              background: 'var(--emerald-500)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span>₹{SPENDING_SNAPSHOT.spentSoFar} spent</span>
            <span>Week: ₹{SPENDING_SNAPSHOT.weekTotal.toLocaleString('en-IN')} / ₹{SPENDING_SNAPSHOT.weekBudget.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Today's Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            📋 Your Day at a Glance
          </div>
          {sorted.map((item, i) => (
            <div key={i} onClick={() => nav(item.actionRoute)} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
              border: '1px solid var(--border-light)', marginBottom: 8,
              borderLeft: `4px solid ${item.color}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.detail}
                </div>
              </div>
              {item.priority === 'high' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                  background: 'rgba(255,82,82,0.1)', color: 'var(--coral-500)',
                }}>URGENT</span>
              )}
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </div>
          ))}
        </div>

        {/* Proactive Tips */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            🧠 Viya Proactive Tips
          </div>
          {PROACTIVE_TIPS.map((tip, i) => (
            <div key={i} style={{
              background: 'var(--cosmos-50)', borderRadius: 'var(--r-lg)', padding: 12,
              border: '1px solid var(--cosmos-100)', marginBottom: 6,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.emoji}</span>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.text}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Log Expense', emoji: '💸', route: '/expenses' },
            { label: 'Ask Viya', emoji: '💬', route: '/chat' },
            { label: 'View Report', emoji: '📊', route: '/weekly-report' },
            { label: 'Scan Food', emoji: '📷', route: '/health' },
          ].map((a, i) => (
            <button key={i} onClick={() => nav(a.route)} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
              border: '1px solid var(--border-light)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
