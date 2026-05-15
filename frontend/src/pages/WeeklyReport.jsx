import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2, TrendingUp, TrendingDown, Target, Heart, Mail, Calendar, ChevronRight, Star } from 'lucide-react'

const WEEK_DATA = {
  period: 'May 5 – May 11, 2026',
  healthScore: 72,
  financeScore: 84,
  productivityScore: 68,
  overallScore: 75,
}

const FINANCE_SUMMARY = {
  income: 85000,
  spent: 32400,
  saved: 52600,
  savingsRate: 62,
  topCategories: [
    { name: 'Food & Dining', amount: 8200, pct: 25, emoji: '🍕' },
    { name: 'Transport', amount: 5600, pct: 17, emoji: '🚗' },
    { name: 'Shopping', amount: 4800, pct: 15, emoji: '🛍️' },
    { name: 'Bills & Utilities', amount: 3200, pct: 10, emoji: '💡' },
    { name: 'Entertainment', amount: 2800, pct: 9, emoji: '🎬' },
  ],
  goalProgress: [
    { name: 'Emergency Fund', target: 300000, current: 185000, added: 15000 },
    { name: 'Goa Trip', target: 50000, current: 38000, added: 5000 },
  ],
  billsPaid: 3,
  billsUpcoming: 2,
}

const HEALTH_SUMMARY = {
  avgSteps: 7234,
  avgSleep: '6h 45m',
  mealsLogged: 18,
  waterAvg: '2.1L',
  medicineTaken: '85%',
  bestDay: 'Wednesday (10,234 steps)',
  worstDay: 'Sunday (2,100 steps)',
}

const EMAIL_SUMMARY = {
  processed: 142,
  actionTaken: 28,
  billsDetected: 5,
  meetingsScheduled: 3,
  deliveriesTracked: 7,
}

const AI_INSIGHTS = [
  { emoji: '💰', text: 'Your food spending is 18% higher than last week. You ordered Swiggy 5 times — try cooking twice to save ₹1,500.' },
  { emoji: '🏃', text: 'Steps dropped 22% on weekends. A 20-min evening walk on Sat/Sun would boost your health score to 80+.' },
  { emoji: '🎯', text: 'Emergency Fund goal is 62% done! At this rate, you\'ll hit it by August 12.' },
  { emoji: '📧', text: 'You have 2 subscription renewal emails this week — Headspace (₹499) and Adobe (₹1,675). Consider cancelling Headspace.' },
]

export default function WeeklyReport() {
  const nav = useNavigate()
  const [expandedSection, setExpandedSection] = useState(null)

  const ScoreRing = ({ score, size = 80, label, color }) => {
    const circumference = 2 * Math.PI * (size / 2 - 6)
    const offset = circumference - (score / 100) * circumference
    return (
      <div style={{ textAlign: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={size/2 - 6} fill="none"
            stroke="var(--bg-secondary)" strokeWidth="5" />
          <circle cx={size/2} cy={size/2} r={size/2 - 6} fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ marginTop: -size/2 - 8, fontSize: size > 60 ? 20 : 16, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
          {score}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: size > 60 ? 16 : 10 }}>{label}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'var(--gradient-night)', padding: '50px 20px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,212,0.12) 0%, transparent 70%)',
          top: -50, right: -40,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => nav(-1)} style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLeft size={16} color="white" /></button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              padding: '6px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}><Download size={12} /> PDF</button>
            <button style={{
              padding: '6px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}><Share2 size={12} /> Share</button>
          </div>
        </div>

        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: 'white', marginBottom: 2 }}>
          📊 Weekly Report
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{WEEK_DATA.period}</div>

        {/* Score Overview */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', marginTop: 20,
          background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--r-xl)', padding: '16px 8px',
        }}>
          <ScoreRing score={WEEK_DATA.overallScore} size={72} label="Overall" color="var(--teal-500)" />
          <ScoreRing score={WEEK_DATA.financeScore} size={56} label="Finance" color="var(--emerald-500)" />
          <ScoreRing score={WEEK_DATA.healthScore} size={56} label="Health" color="var(--coral-500)" />
          <ScoreRing score={WEEK_DATA.productivityScore} size={56} label="Productivity" color="var(--info-500)" />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* AI Insights */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            🧠 Viya's Insights
          </div>
          {AI_INSIGHTS.map((insight, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 12,
              border: '1px solid var(--border-light)', marginBottom: 6,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{insight.emoji}</span>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight.text}</div>
            </div>
          ))}
        </div>

        {/* Finance Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            💰 Finance Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Income', value: `₹${(FINANCE_SUMMARY.income/1000).toFixed(0)}K`, color: 'var(--emerald-500)' },
              { label: 'Spent', value: `₹${(FINANCE_SUMMARY.spent/1000).toFixed(1)}K`, color: 'var(--coral-500)' },
              { label: 'Saved', value: `₹${(FINANCE_SUMMARY.saved/1000).toFixed(1)}K`, color:'var(--viya-primary-700)' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 12,
                border: '1px solid var(--border-light)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Top Categories */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 14,
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Top Spending</div>
            {FINANCE_SUMMARY.topCategories.map((cat, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{cat.emoji} {cat.name}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>₹{cat.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${cat.pct}%`, borderRadius: 99,
                    background: i === 0 ? 'var(--coral-500)' : i === 1 ? 'var(--amber-500)' : 'var(--teal-500)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            🎯 Goal Progress
          </div>
          {FINANCE_SUMMARY.goalProgress.map((g, i) => {
            const pct = Math.round((g.current / g.target) * 100)
            return (
              <div key={i} style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
                border: '1px solid var(--border-light)', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--emerald-500)' }}>+₹{g.added.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'var(--teal-500)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>₹{g.current.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}</span>
                  <span>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Health Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            🏥 Health Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Avg Steps', value: HEALTH_SUMMARY.avgSteps.toLocaleString(), emoji: '👟' },
              { label: 'Avg Sleep', value: HEALTH_SUMMARY.avgSleep, emoji: '😴' },
              { label: 'Meals Logged', value: HEALTH_SUMMARY.mealsLogged, emoji: '🍎' },
              { label: 'Water Avg', value: HEALTH_SUMMARY.waterAvg, emoji: '💧' },
              { label: 'Medicine', value: HEALTH_SUMMARY.medicineTaken, emoji: '💊' },
              { label: 'Best Day', value: 'Wed', emoji: '🏆' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 12,
                border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>
            📧 Email Intelligence
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 14,
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
              {[
                { label: 'Processed', value: EMAIL_SUMMARY.processed, color: 'var(--info-500)' },
                { label: 'Actions', value: EMAIL_SUMMARY.actionTaken, color:'var(--viya-primary-700)' },
                { label: 'Bills Found', value: EMAIL_SUMMARY.billsDetected, color: 'var(--coral-500)' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button onClick={() => nav('/chat?q=give+me+a+detailed+weekly+review')} style={{
          width: '100%', padding: 14, borderRadius: 'var(--r-full)',
          background: 'var(--gradient-hero)', color: 'white', border: 'none',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,229,212,0.3)',
        }}>💬 Ask Viya for Detailed Review</button>
      </div>
    </div>
  )
}
