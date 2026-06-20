// SleepTracker — Sleep tracking with quality score
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, TrendingUp, Clock } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { listItem } from '../animations/pageVariants'

const MOCK_SLEEP = [
  { date: '2026-05-10', bedtime: '23:30', wakeup: '07:00', hours: 7.5, quality: 85 },
  { date: '2026-05-09', bedtime: '00:15', wakeup: '07:30', hours: 7.25, quality: 72 },
  { date: '2026-05-08', bedtime: '23:00', wakeup: '06:30', hours: 7.5, quality: 90 },
  { date: '2026-05-07', bedtime: '01:00', wakeup: '08:00', hours: 7, quality: 65 },
  { date: '2026-05-06', bedtime: '23:15', wakeup: '06:45', hours: 7.5, quality: 88 },
]

function QualityBadge({ score }) {
  const color = score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336'
  const label = score >= 80 ? 'Great' : score >= 60 ? 'OK' : 'Poor'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '3px 8px', borderRadius: 8 }}>
      {label} {score}%
    </span>
  )
}

export default function SleepTracker() {
  const [sleepData] = useState(MOCK_SLEEP)
  const avgHours = (sleepData.reduce((s, d) => s + d.hours, 0) / sleepData.length).toFixed(1)
  const avgQuality = Math.round(sleepData.reduce((s, d) => s + d.quality, 0) / sleepData.length)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Sleep Tracker</h1>
          <p className="body-s text-secondary">Track your rest, improve your life 🌙</p>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <Moon size={20} color="var(--viya-primary-500)" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{avgHours}h</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Avg Sleep</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <TrendingUp size={20} color="var(--viya-success)" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{avgQuality}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Avg Quality</div>
          </div>
        </div>

        {/* Sleep Chart Visual */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>This Week</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 100 }}>
            {sleepData.slice(0, 7).reverse().map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: (d.hours / 10) * 80 }}
                  transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                  style={{
                    width: 24, borderRadius: 6,
                    background: d.quality >= 80 ? 'var(--viya-primary-500)' : d.quality >= 60 ? 'var(--viya-warning)' : 'var(--viya-error)',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {new Date(d.date).toLocaleDateString('en', { weekday: 'narrow' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Log */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Sleep Log</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sleepData.map((d, i) => (
            <motion.div key={i} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1a1a3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Moon size={18} color="#7C4DFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {d.bedtime} → {d.wakeup} · {d.hours}h
                </div>
              </div>
              <QualityBadge score={d.quality} />
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
