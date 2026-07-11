import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Droplets, Moon, Footprints, Flame, Plus, Heart, Scale, X, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const MOODS = [
  { emoji: '😄', label: 'Great',  value: 'great' },
  { emoji: '😊', label: 'Good',   value: 'good' },
  { emoji: '😐', label: 'Okay',   value: 'okay' },
  { emoji: '😟', label: 'Low',    value: 'low' },
  { emoji: '😔', label: 'Sad',    value: 'sad' },
]

const STEP_PRESETS  = [2000, 4000, 6000, 8000, 10000, 12000]
const SLEEP_PRESETS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
const CAL_PRESETS   = [1200, 1500, 1800, 2000, 2200, 2500]
const GOALS = { steps: 10000, water: 8, sleep: 8, calories: 2200 }

const HEALTH_TIPS = [
  'Drink water first thing in the morning — boosts metabolism 30%',
  '10,000 steps = ~400 calories burned',
  '7-9 hours sleep = optimal cognitive function',
  'Eat protein within 30 min of waking up',
  '5 min meditation reduces cortisol by 25%',
  'Cold water after workout reduces muscle soreness 20%',
]

/* ── Progress ring ── */
function Ring({ value, max, size = 100, stroke = 8, color, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / (max || 1), 1)
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Inline log modal ── */
function LogModal({ title, icon, onClose, children }) {
  return (
    <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="hl-modal" initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:60, opacity:0 }}>
        <div className="hl-modal-hdr">
          <div className="hl-modal-title">{icon} {title}</div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── 7-day sparkline bar ── */
function WeekBar({ history, field, color, max }) {
  const last7 = history.slice(0, 7).reverse()
  const days = ['M','T','W','T','F','S','S']
  return (
    <div className="hl-week-bar">
      {last7.map((h, i) => {
        const val = Number(h[field] || 0)
        const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0
        return (
          <div key={i} className="hl-week-col">
            <div className="hl-week-track">
              <div className="hl-week-fill" style={{ height:`${pct}%`, background: color }} />
            </div>
            <div className="hl-week-label">{days[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function Health() {
  const { phone } = useApp()
  const toast = useToast()
  const [tab, setTab] = useState('today')
  const [data, setData] = useState({ steps:0, water_glasses:0, sleep_hours:0, calories:0, weight:0, heart_rate:0, mood:null, health_score:50 })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states — each opens inline form instead of navigating
  const [modal, setModal] = useState(null) // 'steps' | 'sleep' | 'calories' | 'weight' | 'water' | 'heart'

  // Form values
  const [stepsInput, setStepsInput] = useState('')
  const [sleepInput, setSleepInput] = useState('')
  const [calInput, setCalInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [heartInput, setHeartInput] = useState('')

  const tip = HEALTH_TIPS[Math.floor(Date.now() / 3600000) % HEALTH_TIPS.length]

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    const [log, hist] = await Promise.all([api.getHealthLog(phone), api.getHealthHistory(phone, 14)])
    if (log) setData(log)
    if (hist?.length) setHistory(hist)
    setLoading(false)
  }, [phone])

  useEffect(() => { loadData() }, [loadData])

  /* ── Log helpers ── */
  const logField = async (field, value, label) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    setModal(null)
    try {
      const ok = await api.upsertHealthLog(phone, { [field]: value })
      if (!ok) { toast.show('Save failed', 'error'); return }
      // Recalculate health score
      const score = calcScore({ ...data, [field]: value })
      await api.upsertHealthLog(phone, { health_score: score })
      setData(d => ({ ...d, health_score: score }))
      toast.show(`✅ ${label} logged!`, 'success')
      loadData()
    } catch { toast.show('Save failed', 'error') }
  }

  const addWater = async () => {
    const next = (data.water_glasses || 0) + 1
    setData(d => ({ ...d, water_glasses: next }))
    try {
      const ok = await api.upsertHealthLog(phone, { water_glasses: next })
      if (!ok) { toast.show('Save failed', 'error'); return }
      toast.show(`💧 +1 glass (${next} total)`, 'success')
    } catch { toast.show('Save failed', 'error') }
  }

  const saveMood = async (m) => {
    setData(d => ({ ...d, mood: m.value }))
    try {
      const ok = await api.upsertHealthLog(phone, { mood: m.value })
      if (!ok) { toast.show('Save failed', 'error'); return }
      toast.show(`${m.emoji} Mood logged: ${m.label}`, 'success')
    } catch { toast.show('Save failed', 'error') }
  }

  function calcScore(d) {
    let s = 0
    if (d.steps >= 10000) s += 25; else if (d.steps >= 5000) s += 12
    if (d.water_glasses >= 8) s += 20; else if (d.water_glasses >= 4) s += 10
    if (d.sleep_hours >= 7 && d.sleep_hours <= 9) s += 25; else if (d.sleep_hours >= 6) s += 12
    if (d.calories >= 1500 && d.calories <= 2200) s += 20; else if (d.calories > 0) s += 10
    if (d.mood === 'great') s += 10; else if (d.mood === 'good') s += 7; else if (d.mood) s += 3
    return Math.min(s, 100)
  }

  const score = data.health_score || calcScore(data)
  const steps = data.steps || 0
  const water = data.water_glasses || 0
  const sleep = data.sleep_hours || 0
  const calories = data.calories || 0
  const weight = data.weight || 0

  const metrics = [
    { key:'steps',    icon:'🏃', label:'Steps',    value:steps,    unit:'steps',  target:GOALS.steps,    color:'#FF7062', onLog:() => setModal('steps') },
    { key:'sleep',    icon:'😴', label:'Sleep',    value:sleep,    unit:'hrs',    target:GOALS.sleep,    color:'#7C6AF9', onLog:() => setModal('sleep') },
    { key:'calories', icon:'🔥', label:'Calories', value:calories, unit:'kcal',   target:GOALS.calories, color:'#FF9500', onLog:() => setModal('calories') },
    { key:'water',    icon:'💧', label:'Water',    value:water,    unit:'glasses',target:GOALS.water,    color:'#38bdf8', onLog:addWater },
  ]

  const tabs = [
    { id:'today',   label:'Today' },
    { id:'history', label:'History' },
    { id:'weight',  label:'Weight' },
    { id:'mood',    label:'Mood' },
  ]

  return (
    <div className="page">
      {/* Modals */}
      <AnimatePresence>
        {modal === 'steps' && (
          <LogModal title="Log Steps" icon="🏃" onClose={() => setModal(null)}>
            <div className="hl-presets-row">
              {STEP_PRESETS.map(v => (
                <button key={v} className={`hl-preset-chip ${stepsInput==v?'active':''}`}
                  onClick={() => setStepsInput(String(v))}>{v.toLocaleString('en-IN')}</button>
              ))}
            </div>
            <div className="hl-input-row">
              <input className="input-field" type="number" placeholder="Or enter custom steps"
                value={stepsInput} onChange={e => setStepsInput(e.target.value)} autoFocus/>
            </div>
            <button className="btn-primary full mt-12"
              onClick={() => stepsInput && logField('steps', Number(stepsInput), `${Number(stepsInput).toLocaleString()} steps`)}>
              Save Steps
            </button>
          </LogModal>
        )}
        {modal === 'sleep' && (
          <LogModal title="Log Sleep" icon="😴" onClose={() => setModal(null)}>
            <div className="hl-presets-row">
              {SLEEP_PRESETS.map(v => (
                <button key={v} className={`hl-preset-chip ${sleepInput==v?'active':''}`}
                  onClick={() => setSleepInput(String(v))}>{v}h</button>
              ))}
            </div>
            <div className="hl-input-row">
              <input className="input-field" type="number" step="0.5" min="1" max="12" placeholder="Custom hours"
                value={sleepInput} onChange={e => setSleepInput(e.target.value)}/>
            </div>
            <button className="btn-primary full mt-12"
              onClick={() => sleepInput && logField('sleep_hours', Number(sleepInput), `${sleepInput}h sleep`)}>
              Save Sleep
            </button>
          </LogModal>
        )}
        {modal === 'calories' && (
          <LogModal title="Log Calories" icon="🔥" onClose={() => setModal(null)}>
            <div className="hl-presets-row">
              {CAL_PRESETS.map(v => (
                <button key={v} className={`hl-preset-chip ${calInput==v?'active':''}`}
                  onClick={() => setCalInput(String(v))}>{v} kcal</button>
              ))}
            </div>
            <div className="hl-input-row">
              <input className="input-field" type="number" placeholder="Custom calories"
                value={calInput} onChange={e => setCalInput(e.target.value)}/>
            </div>
            <button className="btn-primary full mt-12"
              onClick={() => calInput && logField('calories', Number(calInput), `${Number(calInput).toLocaleString()} kcal`)}>
              Save Calories
            </button>
          </LogModal>
        )}
        {modal === 'weight' && (
          <LogModal title="Log Weight" icon="⚖️" onClose={() => setModal(null)}>
            <div className="hl-input-row">
              <input className="input-field" type="number" step="0.1" min="20" max="300"
                placeholder="Weight in kg (e.g. 72.5)" value={weightInput}
                onChange={e => setWeightInput(e.target.value)} autoFocus/>
            </div>
            <button className="btn-primary full mt-12"
              onClick={() => weightInput && logField('weight', Number(weightInput), `${weightInput} kg`)}>
              Save Weight
            </button>
          </LogModal>
        )}
        {modal === 'heart' && (
          <LogModal title="Log Heart Rate" icon="❤️" onClose={() => setModal(null)}>
            <div className="hl-presets-row">
              {[60,65,70,72,75,80,85,90].map(v => (
                <button key={v} className={`hl-preset-chip ${heartInput==v?'active':''}`}
                  onClick={() => setHeartInput(String(v))}>{v}</button>
              ))}
            </div>
            <div className="hl-input-row">
              <input className="input-field" type="number" placeholder="BPM" min="40" max="200"
                value={heartInput} onChange={e => setHeartInput(e.target.value)}/>
            </div>
            <button className="btn-primary full mt-12"
              onClick={() => heartInput && logField('heart_rate', Number(heartInput), `${heartInput} BPM`)}>
              Save Heart Rate
            </button>
          </LogModal>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Health</h2>
          <p className="body-s text-secondary">Your daily wellness log</p>
        </div>
        <button className="hl-score-badge" style={{ background: score >= 70 ? 'rgba(0,229,176,0.15)' : score >= 40 ? 'rgba(255,149,0,0.15)' : 'rgba(255,112,98,0.15)', color: score >= 70 ? '#00E5B0' : score >= 40 ? '#FF9500' : '#FF7062' }}>
          {score} score
        </button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>
          {[0,1,2,3].map(i => <div key={i} className="skeleton mb-10" style={{height:80,borderRadius:16}} />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* ══ TODAY TAB ══ */}
          {tab === 'today' && (
            <motion.div key="today" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>

              {/* Health score hero */}
              <div className="hl-hero">
                <Ring value={score} max={100} size={110} stroke={9} color={score>=70?'#00E5B0':score>=40?'#FF9500':'#FF7062'}>
                  <span style={{fontSize:26,fontWeight:800,color:'#fff'}}>{score}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.6)',letterSpacing:1}}>SCORE</span>
                </Ring>
                <div className="hl-hero-right">
                  <div className="hl-hero-label">
                    {score>=80?'Excellent! 🏆':score>=60?'Good Shape 💪':score>=40?'Keep Going 🌱':'Needs Attention ⚠️'}
                  </div>
                  <div className="hl-hero-sub">Log all 4 metrics to improve your score</div>
                  <div className="hl-hero-vitals">
                    {data.heart_rate > 0 && <span className="hl-vital"><Heart size={11} color="#FF7062"/> {data.heart_rate} bpm</span>}
                    {weight > 0 && <span className="hl-vital"><Scale size={11} color="#7C6AF9"/> {weight} kg</span>}
                    <span className="hl-vital-btn" onClick={() => setModal('heart')}>+ Heart rate</span>
                    {weight === 0 && <span className="hl-vital-btn" onClick={() => setModal('weight')}>+ Weight</span>}
                  </div>
                </div>
              </div>

              {/* 4 Metric cards */}
              <div className="hl-metrics-grid">
                {metrics.map(m => {
                  const pct = GOALS[m.key] > 0 ? Math.min(Math.round((m.value / GOALS[m.key]) * 100), 100) : 0
                  const done = pct >= 100
                  return (
                    <motion.div key={m.key} className={`hl-metric-card ${done?'done':''}`}
                      whileTap={{ scale: 0.97 }}
                      onClick={m.onLog}
                      style={{ borderColor: done ? m.color + '50' : undefined }}>
                      <div className="hl-metric-top">
                        <span className="hl-metric-icon">{m.icon}</span>
                        {done && <span className="hl-metric-done-badge">✓</span>}
                      </div>
                      <div className="hl-metric-value" style={{ color: done ? m.color : 'var(--text1)' }}>
                        {m.key === 'steps' ? m.value.toLocaleString('en-IN') : m.value}
                        <span className="hl-metric-unit">{m.unit}</span>
                      </div>
                      <div className="hl-metric-label">{m.label}</div>
                      <div className="hl-metric-bar">
                        <div style={{ width:`${pct}%`, background:m.color, height:'100%', borderRadius:99, transition:'width 0.6s ease' }}/>
                      </div>
                      <div className="hl-metric-pct">{pct}% of {m.key==='steps'?GOALS[m.key].toLocaleString():GOALS[m.key]} goal</div>
                      <div className="hl-metric-tap">
                        {m.key === 'water' ? '+ Add glass' : 'Tap to log'}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Quick log row */}
              <div className="hl-quick-row">
                {[
                  { emoji:'🏃', label:'Steps',    action:() => setModal('steps') },
                  { emoji:'😴', label:'Sleep',    action:() => setModal('sleep') },
                  { emoji:'🔥', label:'Calories', action:() => setModal('calories') },
                  { emoji:'⚖️', label:'Weight',   action:() => setModal('weight') },
                ].map((a,i) => (
                  <button key={i} className="hl-quick-btn" onClick={a.action}>
                    <span className="hl-quick-emoji">{a.emoji}</span>
                    <span className="hl-quick-label">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Tip */}
              <div className="insight-card">
                <Activity size={16} color="var(--primary)"/>
                <span className="insight-text">{tip}</span>
              </div>

              {/* Mood */}
              <div className="hl-mood-section">
                <div className="hl-mood-title">How are you feeling today?</div>
                <div className="hl-mood-row">
                  {MOODS.map(m => (
                    <button key={m.value} className={`hl-mood-btn ${data.mood===m.value?'active':''}`}
                      onClick={() => saveMood(m)}>
                      <span className="hl-mood-emoji">{m.emoji}</span>
                      <span className="hl-mood-label">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ HISTORY TAB ══ */}
          {tab === 'history' && (
            <motion.div key="history" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="hl-history-grid">
                <div className="hl-chart-card">
                  <div className="hl-chart-title">🏃 Steps (7 days)</div>
                  <WeekBar history={history} field="steps" color="#FF7062" max={GOALS.steps}/>
                </div>
                <div className="hl-chart-card">
                  <div className="hl-chart-title">💧 Water (7 days)</div>
                  <WeekBar history={history} field="water_glasses" color="#38bdf8" max={GOALS.water}/>
                </div>
                <div className="hl-chart-card">
                  <div className="hl-chart-title">😴 Sleep (7 days)</div>
                  <WeekBar history={history} field="sleep_hours" color="#7C6AF9" max={GOALS.sleep}/>
                </div>
                <div className="hl-chart-card">
                  <div className="hl-chart-title">🔥 Calories</div>
                  <WeekBar history={history} field="calories" color="#FF9500" max={GOALS.calories}/>
                </div>
              </div>
              {history.length === 0 && (
                <div className="empty-state-card">
                  <div className="empty-emoji">📊</div>
                  <h3>No history yet</h3>
                  <p>Log daily metrics to see your trends</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ WEIGHT TAB ══ */}
          {tab === 'weight' && (
            <motion.div key="weight" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="hl-weight-hero">
                <div className="hl-weight-current">
                  {weight > 0 ? `${weight} kg` : '— kg'}
                </div>
                <div className="hl-weight-sub">Current weight</div>
                {history.length >= 2 && (() => {
                  const prev = history.find((h,i) => i > 0 && h.weight > 0)?.weight
                  if (!prev) return null
                  const diff = weight - prev
                  return (
                    <div className="hl-weight-change" style={{ color: diff <= 0 ? '#00E5B0' : '#FF7062' }}>
                      {diff > 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg from last entry
                    </div>
                  )
                })()}
              </div>
              <button className="btn-primary full mb-16" onClick={() => setModal('weight')}>
                <Scale size={16}/> Log Today's Weight
              </button>
              <div className="section-head mb-8">
                <span className="title-m title-m-14">Recent Entries</span>
              </div>
              {history.filter(h => h.weight > 0).length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-emoji">⚖️</div>
                  <h3>No weight data yet</h3>
                  <p>Log your weight to start tracking trends</p>
                </div>
              ) : (
                history.filter(h => h.weight > 0).slice(0, 10).map((h, i) => (
                  <div key={i} className="info-row">
                    <div className="info-icon gold"><Scale size={16}/></div>
                    <div className="info-body">
                      <div className="info-title">{h.weight} kg</div>
                      <div className="info-sub">{new Date(h.log_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ══ MOOD TAB ══ */}
          {tab === 'mood' && (
            <motion.div key="mood" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="card text-center mb-16" style={{ padding:28 }}>
                <h3 style={{fontSize:17,fontWeight:800,marginBottom:6}}>How are you feeling?</h3>
                <p className="body-s text-secondary mb-16">Tracking mood helps you understand patterns</p>
                <div className="hl-mood-row">
                  {MOODS.map(m => (
                    <button key={m.value} className={`hl-mood-btn large ${data.mood===m.value?'active':''}`} onClick={() => saveMood(m)}>
                      <span className="hl-mood-emoji">{m.emoji}</span>
                      <span className="hl-mood-label">{m.label}</span>
                    </button>
                  ))}
                </div>
                {data.mood && (
                  <div className="text-success mt-12" style={{fontWeight:600,fontSize:13}}>
                    Today's mood logged! ✓
                  </div>
                )}
              </div>
              <div className="section-head mb-8">
                <span className="title-m title-m-14">Mood History</span>
              </div>
              {history.filter(h => h.mood).length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-emoji">😊</div>
                  <h3>No mood history yet</h3>
                  <p>Log daily to see your mood patterns</p>
                </div>
              ) : (
                history.filter(h => h.mood).slice(0, 10).map((h, i) => {
                  const m = MOODS.find(x => x.value === h.mood) || { emoji:'😐', label:h.mood }
                  return (
                    <div key={i} className="info-row">
                      <div style={{fontSize:26,width:36,textAlign:'center'}}>{m.emoji}</div>
                      <div className="info-body">
                        <div className="info-title">{m.label}</div>
                        <div className="info-sub">{new Date(h.log_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  )
}
