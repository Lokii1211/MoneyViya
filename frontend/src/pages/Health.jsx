import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Droplets, Moon, Footprints, Flame, Plus, TrendingUp, Heart, Scale, Smile } from 'lucide-react'

const HEALTH_TIPS = [
  'Drink water first thing in the morning -- boosts metabolism 30%',
  '10,000 steps = ~400 calories burned',
  '7-9 hours sleep = optimal cognitive function',
  'Eat protein within 30 min of waking up',
  '5 min meditation reduces cortisol by 25%',
]

const MOODS = [
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😟', label: 'Low', value: 'low' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
]

const DEFAULT_HEALTH = {
  steps: 0, water_glasses: 0, sleep_hours: 0, calories: 0,
  weight: 0, heart_rate: 0, health_score: 50, mood: null,
}

const goals = { steps: 10000, water: 8, sleep: 8, calories: 2200 }

function ProgressRing({ value, max, size = 100, stroke = 8, color = 'var(--primary)', children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s var(--ease)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="skeleton" style={{ height: 140, borderRadius: 20, marginBottom: 16 }} />
      <div className="stat-grid">
        {[0, 1, 2, 3].map(i => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="skeleton" style={{ height: 48, borderRadius: 12, marginBottom: 12 }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="skeleton" style={{ height: 120, borderRadius: 16 }} />
    </div>
  )
}

export default function Health() {
  const { phone } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [mood, setMood] = useState(null)
  const [healthData, setHealthData] = useState(DEFAULT_HEALTH)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Weight / Water form state
  const [weightInput, setWeightInput] = useState('')
  const [waterGoal, setWaterGoal] = useState(8)

  const tip = HEALTH_TIPS[Math.floor(Date.now() / 3600000) % HEALTH_TIPS.length]

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const [log, hist] = await Promise.all([
        api.getHealthLog(phone),
        api.getHealthHistory(phone),
      ])
      if (log) setHealthData(log)
      if (hist?.length) setHistory(hist)
    } catch (e) { console.error('Health load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  const score = healthData.health_score || 50
  const steps = healthData.steps || 0
  const water = healthData.water_glasses || 0
  const sleep = healthData.sleep_hours || 0
  const calories = healthData.calories || 0

  const quickLogWater = async () => {
    const newVal = water + 1
    setHealthData(d => ({ ...d, water_glasses: newVal }))
    try {
      await api.upsertHealthLog(phone, { water_glasses: newVal })
      toast.show('+1 glass logged!', 'success')
    } catch { toast.show('Failed to log water', 'error') }
  }

  const saveWeight = async () => {
    const w = parseFloat(weightInput)
    if (!w || w < 20 || w > 300) return toast.show('Enter valid weight (20-300 kg)', 'error')
    setHealthData(d => ({ ...d, weight: w }))
    try {
      await api.upsertHealthLog(phone, { weight: w })
      toast.show(`Weight updated: ${w} kg`, 'success')
      setWeightInput('')
    } catch { toast.show('Failed to save weight', 'error') }
  }

  const saveMood = async (m) => {
    setMood(m.value)
    try {
      await api.upsertHealthLog(phone, { mood: m.value })
      toast.show(`Mood logged: ${m.emoji} ${m.label}`, 'success')
    } catch { toast.show('Failed to log mood', 'error') }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'weight', label: 'Weight' },
    { id: 'water', label: 'Water' },
    { id: 'mood', label: 'Mood' },
  ]

  const pillars = [
    { icon: <Footprints size={16} />, label: 'Steps', value: steps, unit: 'steps', target: goals.steps, cls: 'steps' },
    { icon: <Flame size={16} />, label: 'Calories', value: calories, unit: 'kcal', target: goals.calories, cls: 'calories' },
    { icon: <Moon size={16} />, label: 'Sleep', value: sleep, unit: 'hrs', target: goals.sleep, cls: 'sleep' },
    { icon: <Droplets size={16} />, label: 'Water', value: water, unit: 'glasses', target: goals.water, cls: 'water', onClick: quickLogWater },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Health Center</h2>
          <p className="body-s text-secondary">Your wellness command center</p>
        </div>
        <button className="pill-btn active" onClick={() => nav('/chat?q=health+tips')}>Ask Viya</button>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : (
        <AnimatePresence mode="wait">
          {/* === OVERVIEW TAB === */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Health Score Hero */}
              <div className="hero-card health flex items-center gap-4 mb-4" style={{ padding: 20 }}>
                <ProgressRing value={score} max={100} size={120} stroke={10} color="white">
                  <span className="currency" style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{score}</span>
                  <span className="stat-card-label" style={{ opacity: 0.8 }}>SCORE</span>
                </ProgressRing>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                    {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Shape!' : 'Needs Work'}
                  </div>
                  <p className="body-s" style={{ opacity: 0.85, marginBottom: 6 }}>
                    Track daily to improve your score
                  </p>
                  <div className="flex gap-3" style={{ fontSize: 12 }}>
                    {healthData.heart_rate > 0 && <span>❤️ {healthData.heart_rate} bpm</span>}
                    {healthData.weight > 0 && <span>⚖️ {healthData.weight} kg</span>}
                  </div>
                </div>
              </div>

              {/* 4 Pillar Cards */}
              <div className="stat-grid">
                {pillars.map(p => {
                  const pct = p.target > 0 ? Math.min(Math.round((p.value / p.target) * 100), 100) : 0
                  return (
                    <div key={p.label} className={`health-card ${p.cls}`}
                      onClick={p.onClick} style={p.onClick ? { cursor: 'pointer' } : {}}>
                      <div className="health-label">{p.label}</div>
                      <div className="health-value">
                        {p.value}<span className="health-sub" style={{ fontSize: 13, marginLeft: 2 }}>{p.unit}</span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.8)' }} />
                      </div>
                      <div className="health-sub" style={{ marginTop: 4, fontSize: 11 }}>{pct}% of goal</div>
                    </div>
                  )
                })}
              </div>

              {/* Health Tip */}
              <div className="insight-card mt-2">
                <Activity size={16} className="insight-icon" />
                <span className="insight-text">{tip}</span>
              </div>

              {/* Quick Log Buttons */}
              <div className="flex gap-2 mt-2">
                {[
                  { emoji: '💧', label: '+Water', action: quickLogWater },
                  { emoji: '🏃', label: 'Steps', action: () => nav('/chat?q=log+steps') },
                  { emoji: '😴', label: 'Sleep', action: () => nav('/chat?q=log+sleep') },
                  { emoji: '🍎', label: 'Calories', action: () => nav('/chat?q=log+calories') },
                ].map((a, i) => (
                  <button key={i} className="qa-btn normal" onClick={a.action} style={{ flex: 1 }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <span className="qa-btn-label">{a.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* === WEIGHT TAB === */}
          {tab === 'weight' && (
            <motion.div key="weight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Current Weight */}
              <div className="hero-card coral text-center mb-4" style={{ padding: 24 }}>
                <div className="stat-card-label" style={{ opacity: 0.7 }}>Current Weight</div>
                <div className="currency" style={{ fontSize: 40, fontWeight: 800 }}>
                  {healthData.weight > 0 ? `${healthData.weight} kg` : '-- kg'}
                </div>
              </div>

              {/* Log Weight Form */}
              <div className="entry-form mb-4">
                <div className="form-group">
                  <label>Log Today's Weight (kg)</label>
                  <input className="form-input" type="number" placeholder="e.g. 72.5"
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    min="20" max="300" step="0.1" />
                </div>
                <button className="btn-primary full" onClick={saveWeight}>Save Weight</button>
              </div>

              {/* Weight History */}
              <div className="section">
                <div className="section-head">
                  <h3>Recent Entries</h3>
                </div>
                {history.filter(h => h.weight > 0).length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-emoji">⚖️</div>
                    <h3>No weight data yet</h3>
                    <p>Log your weight above to start tracking trends</p>
                  </div>
                ) : (
                  history.filter(h => h.weight > 0).slice(0, 7).map((h, i) => (
                    <div key={i} className="info-row">
                      <div className="info-icon gold"><Scale size={16} /></div>
                      <div className="info-body">
                        <div className="info-title">{h.weight} kg</div>
                        <div className="info-sub">{new Date(h.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* === WATER TAB === */}
          {tab === 'water' && (
            <motion.div key="water" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Water Progress */}
              <div className="hero-card text-center mb-4 health-card water" style={{ padding: 24 }}>
                <ProgressRing value={water} max={waterGoal} size={140} stroke={12} color="white">
                  <span className="currency" style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{water}</span>
                  <span className="body-s" style={{ opacity: 0.8 }}>of {waterGoal} glasses</span>
                </ProgressRing>
                <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>
                  {water >= waterGoal ? 'Goal reached! Great job!' : `${waterGoal - water} more glasses to go`}
                </p>
              </div>

              {/* Quick Add */}
              <button className="btn-primary full mb-4" onClick={quickLogWater}>
                <Droplets size={16} /> + Add Glass of Water
              </button>

              {/* Water History */}
              <div className="section">
                <div className="section-head"><h3>This Week</h3></div>
                {history.slice(0, 7).map((h, i) => (
                  <div key={i} className="info-row">
                    <div className="info-icon cyan"><Droplets size={16} /></div>
                    <div className="info-body">
                      <div className="info-title">{h.water_glasses || 0} glasses</div>
                      <div className="info-sub">{new Date(h.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <span className={`info-value ${(h.water_glasses || 0) >= waterGoal ? 'green' : ''}`}>
                      {(h.water_glasses || 0) >= waterGoal ? 'Done' : `${waterGoal - (h.water_glasses || 0)} left`}
                    </span>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="empty-state-card">
                    <div className="empty-emoji">💧</div>
                    <h3>No water data yet</h3>
                    <p>Tap the button above to start logging your water intake</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* === MOOD TAB === */}
          {tab === 'mood' && (
            <motion.div key="mood" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card text-center mb-4" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>How are you feeling?</h3>
                <p className="body-s text-secondary mb-4">Tap to log your mood for today</p>
                <div className="flex gap-2 justify-center">
                  {MOODS.map(m => (
                    <button key={m.value} onClick={() => saveMood(m)}
                      className={`cat-chip flex-col items-center ${mood === m.value ? 'active' : ''}`}
                      style={{ fontSize: 28, padding: '8px 10px' }}>
                      <span>{m.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{m.label}</span>
                    </button>
                  ))}
                </div>
                {mood && (
                  <p className="text-success mt-2" style={{ fontWeight: 600, fontSize: 13 }}>
                    Mood logged for today!
                  </p>
                )}
              </div>

              {/* Mood History */}
              <div className="section">
                <div className="section-head"><h3>Mood History</h3></div>
                {history.filter(h => h.mood).length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-emoji">😊</div>
                    <h3>No mood data yet</h3>
                    <p>Log your mood above to see patterns over time</p>
                  </div>
                ) : (
                  history.filter(h => h.mood).slice(0, 7).map((h, i) => {
                    const moodObj = MOODS.find(m => m.value === h.mood) || { emoji: '😐', label: h.mood }
                    return (
                      <div key={i} className="info-row">
                        <div className="info-icon" style={{ fontSize: 24 }}>{moodObj.emoji}</div>
                        <div className="info-body">
                          <div className="info-title">{moodObj.label}</div>
                          <div className="info-sub">{new Date(h.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
