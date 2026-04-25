import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Activity, Droplets, Moon, Footprints, Flame, Apple, Pill, Plus, TrendingUp, ChevronRight, Heart, Dumbbell, Brain } from 'lucide-react'

const HEALTH_TIPS = [
  '💧 Drink water first thing in the morning — boosts metabolism 30%',
  '🏃 10,000 steps = ~400 calories burned',
  '😴 7-9 hours sleep = optimal cognitive function',
  '🥗 Eat protein within 30 min of waking up',
  '🧘 5 min meditation reduces cortisol by 25%',
]

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' }

function CircleProgress({ value, max, size = 120, stroke = 10, color, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-light)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function PillarCard({ icon, label, value, unit, target, color, onClick }) {
  const pct = target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 16,
      border: '1px solid var(--border-light)', cursor: 'pointer',
      boxShadow: 'var(--shadow-1)', transition: 'transform 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: color + '15', color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 24, color: 'var(--text-primary)', marginBottom: 2 }}>
        {value.toLocaleString('en-IN')}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--viya-neutral-100)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
      </div>
    </div>
  )
}

// Defaults when no DB data exists yet
const DEFAULT_HEALTH = {
  score: 50, steps: 0, water_glasses: 0, sleep_hours: 0, calories: 0,
  weight: 0, heart_rate: 0, health_score: 50, mood: 'neutral',
}

export default function Health() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const tip = HEALTH_TIPS[Math.floor(Date.now() / 3600000) % HEALTH_TIPS.length]

  const [healthData, setHealthData] = useState(DEFAULT_HEALTH)
  const [meals, setMeals] = useState([])
  const [medicines, setMedicines] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  // Goals (user-configurable later)
  const goals = { steps: 10000, water: 8, sleep: 8, calories: 2200 }

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const [log, mealsData, medsData, medCheckins] = await Promise.all([
        api.getHealthLog(phone),
        api.getMeals(phone),
        api.getMedicines(phone),
        api.getMedicineCheckins(phone),
      ])
      if (log) setHealthData(log)
      if (mealsData?.length) setMeals(mealsData)
      if (medsData?.length) setMedicines(medsData)
      if (medCheckins?.length) setCheckins(medCheckins)
    } catch (e) { console.error('Health load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  // Quick log helpers
  const quickLogWater = async () => {
    const newVal = (healthData.water_glasses || 0) + 1
    setHealthData(d => ({ ...d, water_glasses: newVal }))
    await api.upsertHealthLog(phone, { water_glasses: newVal })
  }

  const takeMedicine = async (med) => {
    await api.checkinMedicine(med.id, phone)
    setCheckins(prev => [...prev, { medicine_id: med.id }])
  }

  const isMedTaken = (medId) => checkins.some(c => c.medicine_id === medId)

  // Computed
  const score = healthData.health_score || healthData.score || 50
  const steps = healthData.steps || 0
  const water = healthData.water_glasses || 0
  const sleep = healthData.sleep_hours || 0
  const calories = healthData.calories || 0
  const totalMealCals = meals.reduce((s, m) => s + (m.calories || 0), 0) || calories
  const streak = 0 // TODO: calculate from health_logs history

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'diet', label: 'Diet' },
    { id: 'medicine', label: 'Medicine' },
  ]

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Health Center</h1>
          <p className="body-s text-secondary">Your wellness command center 💪</p>
        </div>
        <button onClick={() => nav('/chat?q=health+tips')} style={{
          padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
          background: 'var(--gradient-health)', color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
        }}>Ask Viya 🧠</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            background: tab === t.id ? 'var(--bg-card)' : 'transparent',
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
            transition: 'all 0.2s', cursor: 'pointer', border: 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Health Score Circle */}
          <div style={{
            background: 'var(--gradient-health)', borderRadius: 'var(--radius-2xl)', padding: 24,
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, color: 'white',
            boxShadow: '0 8px 24px rgba(255,107,107,0.3)',
          }}>
            <CircleProgress value={score} max={100} size={100} stroke={8} color="white">
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 28, color: 'white' }}>{score}</div>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>SCORE</div>
            </CircleProgress>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                {score >= 80 ? 'Excellent! 🌟' : score >= 60 ? 'Good Shape! 👍' : 'Needs Work 💪'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4, marginBottom: 8 }}>
                {streak > 0 ? `🔥 ${streak}-day streak! Keep going.` : 'Start tracking today!'}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                {healthData.heart_rate > 0 && <span>❤️ {healthData.heart_rate} bpm</span>}
                {healthData.weight > 0 && <span>⚖️ {healthData.weight} kg</span>}
              </div>
            </div>
          </div>

          {/* 4 Pillar Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <PillarCard icon={<Footprints size={16}/>} label="Steps" value={steps} unit="steps" target={goals.steps} color="var(--viya-primary-500)" />
            <PillarCard icon={<Droplets size={16}/>} label="Water" value={water} unit="glasses" target={goals.water} color="#0091FF" onClick={quickLogWater} />
            <PillarCard icon={<Moon size={16}/>} label="Sleep" value={sleep} unit="hrs" target={goals.sleep} color="var(--viya-violet-500)" />
            <PillarCard icon={<Flame size={16}/>} label="Calories" value={totalMealCals} unit="kcal" target={goals.calories} color="var(--viya-gold-500)" />
          </div>

          {/* Health Tip */}
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-lg)', marginBottom: 16,
            background: 'var(--viya-primary-50)', border: '1px solid var(--viya-primary-200)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--viya-primary-700)',
          }}>
            <Activity size={16} color="var(--viya-primary-500)" />
            <span style={{ flex: 1 }}>{tip}</span>
          </div>

          {/* Quick Log Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { emoji: '💧', label: '+Water', action: () => quickLogWater() },
              { emoji: '🏃', label: 'Steps', action: () => nav('/chat?q=log+steps') },
              { emoji: '😴', label: 'Sleep', action: () => nav('/chat?q=log+sleep') },
              { emoji: '🍎', label: 'Meal', action: () => setTab('diet') },
            ].map((a, i) => (
              <button key={i} onClick={a.action} style={{
                flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-lg)', textAlign: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'diet' && (
        <>
          {/* Calories Summary */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 20,
            border: '1px solid var(--border-light)', marginBottom: 16, textAlign: 'center',
          }}>
            <CircleProgress value={totalMealCals} max={goals.calories} size={110} stroke={10} color="var(--viya-gold-500)">
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 22 }}>{totalMealCals}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>of {goals.calories}</div>
            </CircleProgress>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
              {[
                { label: 'Protein', val: `${meals.reduce((s,m) => s + (Number(m.protein) || 0), 0)}g`, color: '#FF6B6B' },
                { label: 'Carbs', val: `${meals.reduce((s,m) => s + (Number(m.carbs) || 0), 0)}g`, color: '#FFB800' },
                { label: 'Fat', val: `${meals.reduce((s,m) => s + (Number(m.fat) || 0), 0)}g`, color: '#0091FF' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Meals */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="title-m" style={{ fontSize: 15 }}>Today's Meals</span>
              <button onClick={() => nav('/chat?q=log+meal')} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                background: 'var(--viya-gold-100)', color: 'var(--viya-gold-500)', border: 'none', cursor: 'pointer',
              }}>+ Log Meal</button>
            </div>
            {meals.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>
                No meals logged yet. Tell Viya what you ate! 🍎
              </div>
            )}
            {meals.map((m, i) => (
              <div key={m.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: i < meals.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <span style={{ fontSize: 24 }}>{MEAL_ICONS[m.meal_type] || '🍽️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                  <div className="body-s text-secondary">{(m.meal_type || '').charAt(0).toUpperCase() + (m.meal_type || '').slice(1)}{m.time ? ` · ${m.time}` : ''}</div>
                </div>
                <span className="num-s" style={{ fontWeight: 600, color: 'var(--viya-gold-500)' }}>{m.calories || 0} kcal</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'medicine' && (
        <>
          {/* Medicine Tracker */}
          <div style={{
            background: 'var(--gradient-card)', borderRadius: 'var(--radius-xl)', padding: 16,
            border: '1px solid var(--border-light)', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="title-m" style={{ fontSize: 15 }}>💊 Today's Medicines</span>
              <span className="body-s" style={{ color: 'var(--viya-success)', fontWeight: 600 }}>
                {medicines.filter(m => isMedTaken(m.id)).length}/{medicines.length} taken
              </span>
            </div>
            {medicines.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>
                No medicines tracked. Tell Viya to add one! 💊
              </div>
            )}
            {medicines.map((m, i) => {
              const taken = isMedTaken(m.id)
              return (
                <div key={m.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8,
                  borderRadius: 'var(--radius-md)', background: taken ? 'var(--viya-success-light)' : 'var(--bg-secondary)',
                  border: `1px solid ${taken ? 'var(--viya-success)20' : 'var(--border-light)'}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: taken ? 'var(--viya-success)' : 'var(--viya-neutral-200)', color: 'white', fontSize: 14,
                  }}>{taken ? '✓' : '·'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, textDecoration: taken ? 'line-through' : 'none', opacity: taken ? 0.6 : 1 }}>{m.name}</div>
                    <div className="body-s text-secondary">{m.dosage || ''}{m.time ? ` · ${m.time}` : ''}</div>
                  </div>
                  {!taken && (
                    <button onClick={() => takeMedicine(m)} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                      background: 'var(--viya-success)', color: 'white', border: 'none', cursor: 'pointer',
                    }}>Take</button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
