import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, Flame, Check, Trash2, Snowflake, MessageCircle, X, Zap, Trophy, Calendar } from 'lucide-react'

const PRESETS = [
  { icon: '💰', name: 'Track expenses' },
  { icon: '🏋️', name: 'Workout' },
  { icon: '📖', name: 'Read 30 mins' },
  { icon: '🧘', name: 'Meditate' },
  { icon: '💧', name: 'Drink 3L water' },
  { icon: '🥗', name: 'Eat healthy' },
  { icon: '📝', name: 'Journal' },
  { icon: '🚫', name: 'No junk food' },
  { icon: '⏰', name: 'Wake up early' },
  { icon: '🏃', name: 'Run 2km' },
  { icon: '🧮', name: 'Study 2 hours' },
  { icon: '😴', name: 'Sleep by 11 PM' },
  { icon: '📱', name: 'No social media 1h' },
  { icon: '🚶', name: 'Walk 5000 steps' },
]

const MILESTONES = [
  { days: 3,   emoji: '🎩', label: 'Hat-trick!',   msg: '3 days strong!' },
  { days: 7,   emoji: '⚔️', label: 'Week Warrior', msg: '7 days! Habit forming!' },
  { days: 14,  emoji: '💎', label: 'Fortnight',    msg: '14 days! Almost locked in!' },
  { days: 21,  emoji: '🏆', label: 'Habit Formed', msg: '21 days! Science says you did it!' },
  { days: 30,  emoji: '👑', label: 'Legendary',    msg: '30 DAYS! Unstoppable!' },
  { days: 50,  emoji: '⚡', label: 'Titanium',     msg: '50 days! Top 1%!' },
  { days: 100, emoji: '🌟', label: 'Century',      msg: '100 days! Hall of Fame!' },
]

const MAX_FREEZES = 2

function getFreezeKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

function loadFreeze() {
  try {
    const raw = localStorage.getItem('mv_freeze')
    if (!raw) return { month: getFreezeKey(), used: 0, frozen: {} }
    const d = JSON.parse(raw)
    return d.month !== getFreezeKey() ? { month: getFreezeKey(), used: 0, frozen: {} } : d
  } catch { return { month: getFreezeKey(), used: 0, frozen: {} } }
}

function saveFreeze(d) { localStorage.setItem('mv_freeze', JSON.stringify(d)) }

// SVG ring for streak
function StreakRing({ pct, streak, icon, done }) {
  const r = 22, circ = 2 * Math.PI * r
  const filled = circ * (pct / 100)
  return (
    <div className="hb-ring-wrap">
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={r} fill="none" strokeWidth={4} stroke="var(--border)" />
        <circle
          cx={28} cy={28} r={r} fill="none" strokeWidth={4}
          stroke={done ? '#00E5B0' : '#7C6AF9'}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={28} y={28} textAnchor="middle" dominantBaseline="middle" fontSize={16} fill="white">
          {icon}
        </text>
      </svg>
      {streak > 0 && (
        <div className="hb-ring-streak">
          <Flame size={9} color="#FF9500" />
          <span>{streak}</span>
        </div>
      )}
    </div>
  )
}

export default function Habits() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [custom, setCustom] = useState('')
  const [toast, setToast] = useState(null)
  const [freezePrompt, setFreezePrompt] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [freeze, setFreeze] = useState(loadFreeze)
  const [tab, setTab] = useState('today') // 'today' | 'all'

  const loadData = useCallback(async () => {
    const [h, c] = await Promise.all([api.getHabits(phone), api.getCheckins(phone)])
    setHabits(h || [])
    const map = {}
    ;(c || []).forEach(ci => { map[ci.habit_id] = true })
    setCheckins(map)
    setLoading(false)
  }, [phone])

  useEffect(() => { if (phone) loadData() }, [loadData])

  const showT = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const addHabit = async (name, icon) => {
    if (!name.trim()) return
    if (habits.some(h => h.name.toLowerCase().trim() === name.toLowerCase().trim())) {
      showT('⚠️ Habit already exists!', 'warn'); return
    }
    const created = await api.addHabit(phone, name.trim(), icon)
    if (!created) {
      showT('❌ Could not save — check your connection and try again', 'warn')
      return
    }
    setCustom(''); setShowAdd(false)
    showT('🔥 Habit added! Start your streak today!')
    loadData()
  }

  const toggleCheckin = async (habitId) => {
    const result = await api.checkinHabit(habitId, phone)
    const habit = habits.find(h => h.id === habitId)
    if (result.checked) {
      const newStreak = (habit?.current_streak || 0) + 1
      setCheckins(prev => ({ ...prev, [habitId]: true }))
      const milestone = MILESTONES.find(m => m.days === newStreak)
      if (milestone) {
        setCelebration({ ...milestone, habitName: habit?.name, habitIcon: habit?.icon })
        setTimeout(() => setCelebration(null), 4500)
      } else {
        const msgs = [
          `${habit?.icon || '✅'} ${habit?.name} done! Keep the streak alive!`,
          `🔥 ${newStreak > 1 ? newStreak + ' days in a row!' : 'Day 1 — every streak starts here!'}`,
          `💪 ${habit?.name} checked! You're building something real.`,
          `⚡ Consistency is your superpower!`,
        ]
        showT(msgs[Math.floor(Math.random() * msgs.length)])
      }
    } else {
      setCheckins(prev => { const n = {...prev}; delete n[habitId]; return n })
      showT('Check-in removed', 'warn')
    }
    loadData()
  }

  const removeHabit = async (id) => {
    if (!confirm('Remove this habit? Your streak will be lost.')) return
    await api.deleteHabit(id)
    showT('Habit removed', 'warn')
    loadData()
  }

  const useFreeze = (habitId, habitName, habitIcon) => {
    const newFreeze = { ...freeze, used: freeze.used + 1, frozen: { ...freeze.frozen, [habitId]: true } }
    setFreeze(newFreeze); saveFreeze(newFreeze)
    setFreezePrompt(null)
    showT(`🧊 Streak frozen for ${habitName}! Protected for today.`)
  }

  const doneCount = Object.keys(checkins).length
  const totalCount = habits.length
  const bestStreak = habits.reduce((s, h) => Math.max(s, h.longest_streak || 0), 0)
  const totalStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0)
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const freezesLeft = MAX_FREEZES - freeze.used

  const getMotivation = () => {
    if (totalCount === 0) return null
    if (progressPct === 100) return { text: '🏆 Perfect day! All habits done!', color: '#00E5B0' }
    if (progressPct >= 75) return { text: '🔥 Almost there! A few more to go.', color: '#FF9500' }
    if (progressPct >= 50) return { text: '💪 Good progress! Keep it going.', color: '#FFB800' }
    if (progressPct > 0) return { text: '🌱 Good start! Every check-in counts.', color: '#7C6AF9' }
    return { text: '☀️ Fresh day! Tap a habit to check in.', color: 'var(--text2)' }
  }
  const motivation = getMotivation()

  // Get week dates for mini-calendar
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    return { label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }), isToday: i === 6 }
  })

  return (
    <div className="page">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className={`hb-toast ${toast.type || 'success'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Freeze Prompt */}
      <AnimatePresence>
        {freezePrompt && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="hb-freeze-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
              <div className="hb-freeze-icon">🧊</div>
              <div className="hb-freeze-title">Use Streak Freeze?</div>
              <div className="hb-freeze-habit">{freezePrompt.habitIcon} {freezePrompt.habitName}</div>
              <div className="hb-freeze-desc">
                Protect your streak for today without checking in.<br/>
                You have <strong style={{color:'#38bdf8'}}>{freezesLeft} freeze{freezesLeft !== 1 ? 's' : ''}</strong> left this month.
              </div>
              <div className="hb-freeze-btns">
                <button className="btn-secondary" onClick={() => setFreezePrompt(null)}>Cancel</button>
                <button className="hb-freeze-confirm" onClick={() => useFreeze(freezePrompt.habitId, freezePrompt.habitName, freezePrompt.habitIcon)}>
                  🧊 Use Freeze
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration */}
      <AnimatePresence>
        {celebration && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="hb-celebration" initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ type: 'spring', damping: 14 }}>
              <div className="hb-celeb-emoji">{celebration.emoji}</div>
              <div className="hb-celeb-title">{celebration.label}</div>
              <div className="hb-celeb-habit">{celebration.habitIcon} {celebration.habitName}</div>
              <div className="hb-celeb-msg">{celebration.msg}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Habit modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div className="hb-add-modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
              <div className="hb-add-header">
                <span className="hb-add-title">Add Habit</span>
                <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18}/></button>
              </div>

              <div className="hb-custom-row">
                <input
                  className="input-field"
                  placeholder="Custom habit name..."
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHabit(custom, '✅')}
                  autoFocus
                />
                <button className="btn-primary hb-custom-add" onClick={() => addHabit(custom, '✅')}>Add</button>
              </div>

              <div className="hb-presets-label">Or pick a preset:</div>
              <div className="hb-presets-grid">
                {PRESETS.map((p, i) => (
                  <button key={i} className="hb-preset-btn" onClick={() => addHabit(p.name, p.icon)}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div>
          <div className="skeleton mb-16" style={{height:120, borderRadius:20}} />
          <div className="skeleton mb-16" style={{height:60, borderRadius:14}} />
          {[0,1,2,3].map(i => <div key={i} className="skeleton mb-10" style={{height:80, borderRadius:16}} />)}
        </div>
      ) : (
        <>
          {/* Hero — Progress ring + stats */}
          <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} className="hb-hero-card">
            <div className="hb-hero-left">
              {/* Big radial progress */}
              <div className="hb-progress-ring-wrap">
                <svg width={96} height={96} viewBox="0 0 96 96">
                  <circle cx={48} cy={48} r={40} fill="none" strokeWidth={7} stroke="rgba(255,255,255,0.12)" />
                  <circle
                    cx={48} cy={48} r={40} fill="none" strokeWidth={7}
                    stroke={progressPct === 100 ? '#00E5B0' : '#7C6AF9'}
                    strokeDasharray={`${2 * Math.PI * 40 * progressPct / 100} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <div className="hb-progress-inner">
                  <div className="hb-progress-num">{doneCount}/{totalCount}</div>
                  <div className="hb-progress-sub">done</div>
                </div>
              </div>
            </div>
            <div className="hb-hero-right">
              <div className="hb-hero-stat">
                <div className="hb-hero-stat-val" style={{color:'#FF9500'}}>{bestStreak}<span className="hb-hero-stat-unit">d</span></div>
                <div className="hb-hero-stat-label">Best Streak</div>
              </div>
              <div className="hb-hero-stat">
                <div className="hb-hero-stat-val" style={{color:'#7C6AF9'}}>{totalStreak}</div>
                <div className="hb-hero-stat-label">Total Days</div>
              </div>
              <div className="hb-hero-stat">
                <div className="hb-hero-stat-val" style={{color:'#38bdf8'}}>{freezesLeft}</div>
                <div className="hb-hero-stat-label">Freezes Left</div>
              </div>
            </div>
          </motion.div>

          {/* Week mini-calendar */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.08}} className="hb-week-row">
            {weekDays.map((d, i) => (
              <div key={i} className={`hb-week-day${d.isToday ? ' today' : ''}`}>
                <div className="hb-week-label">{d.label}</div>
                <div className={`hb-week-dot ${d.isToday ? (progressPct > 0 ? 'done' : 'empty') : 'past'}`} />
              </div>
            ))}
          </motion.div>

          {/* Motivation bar */}
          {motivation && (
            <div className="hb-motivation" style={{ borderLeftColor: motivation.color }}>
              <span style={{ color: motivation.color }}>{motivation.text}</span>
              {progressPct > 0 && (
                <div className="hb-motivation-bar">
                  <div style={{ width: `${progressPct}%`, background: motivation.color }} />
                </div>
              )}
            </div>
          )}

          {/* Ask Viya shortcut */}
          <button className="hb-viya-bar" onClick={() => nav('/chat?q=done with workout')}>
            <MessageCircle size={15} color="#00E5B0" />
            <span>Tell Viya you're done → it marks automatically</span>
            <span className="hb-viya-arrow">→</span>
          </button>

          {/* Habits list */}
          <div className="section-head mb-12">
            <span className="title-m title-m-15">Today's Habits</span>
            <button className="btn-primary hb-add-trigger" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add
            </button>
          </div>

          {habits.length === 0 ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="hb-empty">
              <div className="hb-empty-icon">🌱</div>
              <div className="hb-empty-title">No habits yet</div>
              <div className="hb-empty-sub">Start small — even one habit changes everything.</div>
              <button className="btn-primary mt-16" onClick={() => setShowAdd(true)}>
                <Plus size={15}/> Add Your First Habit
              </button>
            </motion.div>
          ) : (
            <div className="hb-list">
              {habits.map((h, i) => {
                const done = !!checkins[h.id]
                const frozen = !!freeze.frozen[h.id]
                const streak = h.current_streak || 0
                const longestStreak = h.longest_streak || 0
                const pct = longestStreak > 0 ? Math.min(Math.round((streak / longestStreak) * 100), 100) : (streak > 0 ? 100 : 0)

                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`hb-item ${done ? 'done' : ''} ${frozen ? 'frozen' : ''}`}
                    onClick={() => !frozen && toggleCheckin(h.id)}
                  >
                    {/* Ring + icon */}
                    <StreakRing pct={pct} streak={streak} icon={h.icon || '✅'} done={done} />

                    {/* Content */}
                    <div className="hb-item-body">
                      <div className="hb-item-name">{h.name}</div>
                      <div className="hb-item-meta">
                        {streak > 0 && <span className="hb-streak-pill"><Flame size={10} color="#FF9500" />{streak}d streak</span>}
                        {frozen && <span className="hb-freeze-pill">🧊 Frozen</span>}
                        {!done && !frozen && <span className="hb-pending-pill">Pending</span>}
                        {done && <span className="hb-done-pill">✓ Done</span>}
                      </div>
                    </div>

                    {/* Check button */}
                    <div className={`hb-check-btn ${done ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); if (!frozen) toggleCheckin(h.id) }}>
                      {done ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                    </div>

                    {/* Actions */}
                    <div className="hb-item-actions" onClick={e => e.stopPropagation()}>
                      {!done && !frozen && freezesLeft > 0 && (
                        <button className="hb-action-btn freeze" onClick={() => setFreezePrompt({ habitId: h.id, habitName: h.name, habitIcon: h.icon })} title="Freeze streak">
                          <Snowflake size={13} />
                        </button>
                      )}
                      <button className="hb-action-btn delete" onClick={() => removeHabit(h.id)} title="Remove habit">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Milestone guide */}
          {habits.length > 0 && (
            <div className="hb-milestones">
              <div className="hb-milestones-title"><Trophy size={14} color="#FFB800" /> Milestones</div>
              <div className="hb-milestones-row">
                {MILESTONES.map((m, i) => {
                  const reached = bestStreak >= m.days
                  return (
                    <div key={i} className={`hb-milestone ${reached ? 'reached' : ''}`}>
                      <div className="hb-milestone-emoji">{m.emoji}</div>
                      <div className="hb-milestone-days">{m.days}d</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="spacer-20" />
        </>
      )}
    </div>
  )
}
