import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, Flame, Check, Trash2, Calendar, TrendingUp, Snowflake } from 'lucide-react'

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

const MAX_FREE_FREEZES = 2

// Get the current month key for freeze tracking (e.g. "2026-06")
function getFreezeMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Load freeze data from localStorage (persists across sessions, resets monthly)
function loadFreezeData() {
  try {
    const raw = localStorage.getItem('mv_freeze_data')
    if (!raw) return { month: getFreezeMonthKey(), used: 0, frozenHabits: {} }
    const data = JSON.parse(raw)
    // Reset if it's a new month (2 free freezes per month)
    if (data.month !== getFreezeMonthKey()) {
      return { month: getFreezeMonthKey(), used: 0, frozenHabits: {} }
    }
    return data
  } catch { return { month: getFreezeMonthKey(), used: 0, frozenHabits: {} } }
}

function saveFreezeData(data) {
  localStorage.setItem('mv_freeze_data', JSON.stringify(data))
}

export default function Habits() {
  const { phone } = useApp()
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [custom, setCustom] = useState('')
  const [toast, setToast] = useState('')
  const [freezePrompt, setFreezePrompt] = useState(null) // { habitId, habitName }

  // Load freeze state from localStorage with monthly reset
  const [freezeData, setFreezeData] = useState(loadFreezeData)
  const freezesLeft = MAX_FREE_FREEZES - freezeData.used
  const frozenHabits = freezeData.frozenHabits || {}

  const loadData = async () => {
    const [h, c] = await Promise.all([
      api.getHabits(phone),
      api.getCheckins(phone),
    ])
    setHabits(h || [])
    const map = {}
    ;(c || []).forEach(ci => { map[ci.habit_id] = true })
    setCheckins(map)
    setLoading(false)
  }
  useEffect(() => { if (phone) loadData() }, [phone])

  const addHabit = async (name, icon) => {
    if (!name.trim()) return
    // Check for duplicate in current habits list (client-side too)
    const exists = habits.some(h => h.name.toLowerCase().trim() === name.toLowerCase().trim())
    if (exists) {
      showToast('⚠️ Habit already exists!')
      return
    }
    await api.addHabit(phone, name.trim(), icon)
    setCustom(''); setShowAdd(false)
    showToast('Habit added! 🔥')
    loadData()
  }

  const [celebration, setCelebration] = useState(null)

  const STREAK_MILESTONES = [
    { days: 3, emoji: '🎩', label: 'Hat-trick!', msg: '3 days strong! Keep going!' },
    { days: 7, emoji: '🗡️', label: 'Week Warrior!', msg: '7 days! A new habit is forming!' },
    { days: 14, emoji: '💎', label: 'Two Weeks!', msg: 'Science says 21 days = permanent. Almost there!' },
    { days: 21, emoji: '🏆', label: 'HABIT FORMED!', msg: '21 days! This is who you are now!' },
    { days: 30, emoji: '👑', label: 'LEGENDARY!', msg: '30 DAYS! You are absolutely unstoppable!' },
    { days: 50, emoji: '⚡', label: 'TITANIUM!', msg: '50 days! You\'re in the top 1%!' },
    { days: 100, emoji: '🌟', label: 'CENTURY!', msg: '100 DAYS! Hall of Fame status!' },
  ]

  const toggleCheckin = async (habitId) => {
    const result = await api.checkinHabit(habitId, phone)
    if (result.checked) {
      const habit = habits.find(h => h.id === habitId)
      const newStreak = (habit?.current_streak || 0) + 1

      // Check streak milestone
      const milestone = STREAK_MILESTONES.find(m => m.days === newStreak)
      if (milestone) {
        setCelebration({ ...milestone, habitName: habit?.name, habitIcon: habit?.icon })
        setTimeout(() => setCelebration(null), 4000)
      } else {
        const msgs = [
          `Great job! ${habit?.icon || '✅'} Keep going!`,
          `You're on fire! 🔥`,
          `${habit?.name} done! 💪 Consistency is key!`,
          `Awesome! One more step towards your best self ✨`,
          `${habit?.icon || '✅'} Checked! Viya is proud of you 🙌`,
        ]
        showToast(msgs[Math.floor(Math.random() * msgs.length)])
      }
    } else {
      showToast('Check-in removed')
    }
    loadData()
  }

  const removeHabit = async (id) => {
    if (!confirm('Remove this habit? Your streak will be lost.')) return
    await api.deleteHabit(id)
    showToast('Habit removed')
    loadData()
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const doneCount = Object.keys(checkins).length
  const totalCount = habits.length
  const totalStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0)
  const bestStreak = habits.reduce((s, h) => Math.max(s, h.longest_streak || 0), 0)

  // Motivational messages based on progress
  const getMotivation = () => {
    if (totalCount === 0) return null
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
    if (pct === 100) return { text: "🏆 Perfect day! All habits done. You're unstoppable!", color: 'var(--primary)' }
    if (pct >= 75) return { text: "🔥 Almost there! Just a few more to go!", color: 'var(--orange)' }
    if (pct >= 50) return { text: "💪 Good progress! Keep the momentum going!", color: 'var(--gold)' }
    if (pct > 0) return { text: "🌱 Great start! Every small step counts.", color: 'var(--cyan)' }
    return { text: "☀️ New day, fresh start! Tap to check in.", color: 'var(--text2)' }
  }
  const motivation = getMotivation()

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      {/* Streak Freeze Prompt */}
      {freezePrompt && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s'}}>
          <div style={{background:'var(--surface)', borderRadius:20, padding:28, textAlign:'center', maxWidth:300, animation:'scaleIn 0.3s var(--ease)', margin:16, border:'1px solid rgba(56,189,248,0.3)'}}>
            <div style={{fontSize:48, marginBottom:8}}>🧊</div>
            <div style={{fontSize:17, fontWeight:800, color:'#38bdf8', marginBottom:6}}>Use Streak Freeze?</div>
            <div style={{fontSize:13, color:'var(--text2)', marginBottom:4}}>
              {freezePrompt.habitIcon || '✅'} {freezePrompt.habitName}
            </div>
            <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.5, marginBottom:16}}>
              This will preserve your streak for today without checking in. You have <strong style={{color:'#38bdf8'}}>{freezesLeft} freeze{freezesLeft !== 1 ? 's' : ''}</strong> left this month.
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'center'}}>
              <button className="btn-secondary" style={{padding:'8px 20px', fontSize:13, borderRadius:10}} onClick={() => setFreezePrompt(null)}>
                Cancel
              </button>
              <button className="btn-primary" style={{padding:'8px 20px', fontSize:13, borderRadius:10, background:'#38bdf8'}} onClick={() => {
                const newData = {
                  ...freezeData,
                  used: freezeData.used + 1,
                  frozenHabits: { ...freezeData.frozenHabits, [freezePrompt.habitId]: true },
                }
                setFreezeData(newData)
                saveFreezeData(newData)
                showToast(`🧊 Streak frozen for ${freezePrompt.habitName}! Protected.`)
                setFreezePrompt(null)
              }}>
                Use Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Milestone Celebration with confetti */}
      {celebration && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s', overflow:'hidden'}}>
          {/* Confetti particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              position:'absolute',
              top: -10,
              left: `${Math.random() * 100}%`,
              width: 8 + Math.random() * 6,
              height: 8 + Math.random() * 6,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: ['#00B870','#F59E0B','#38bdf8','#EF4444','#A855F7','#EC4899','#10B981','#F97316'][i % 8],
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }} />
          ))}
          <div style={{background:'var(--surface)', borderRadius:24, padding:32, textAlign:'center', maxWidth:320, animation:'scaleIn 0.4s var(--ease)', margin:16, position:'relative', zIndex:1}}>
            <div style={{fontSize:64, marginBottom:8}}>{celebration.emoji}</div>
            <div style={{fontSize:22, fontWeight:900, color:'var(--primary)', marginBottom:4}}>{celebration.label}</div>
            <div style={{fontSize:14, color:'var(--text2)', marginBottom:12}}>{celebration.habitIcon} {celebration.habitName}</div>
            <div style={{fontSize:13, color:'var(--text3)', lineHeight:1.5}}>{celebration.msg}</div>
            <div style={{marginTop:16, fontSize:11, color:'var(--text3)'}}>🔥 {celebration.days} day streak!</div>
          </div>
        </div>
      )}
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Daily Habits</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> Add
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div>
          {/* Streak card skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="skeleton"
            style={{ height: 80, borderRadius: 14, marginBottom: 16 }}
          />
          {/* Habit card skeletons */}
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="skeleton"
              style={{ height: 64, borderRadius: 12, marginBottom: 10 }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{display:'flex', gap:10, marginBottom:16}}>
            <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,184,112,0.15)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--primary)'}}>{doneCount}/{totalCount}</div>
              <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>TODAY</div>
            </div>
            <div style={{flex:1, background:'var(--orange-dim)', border:'1px solid rgba(249,115,22,0.15)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--orange)'}}>{totalStreak}🔥</div>
              <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>STREAK</div>
            </div>
            <div style={{flex:1, background:'var(--gold-dim)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--gold)'}}>{bestStreak}⭐</div>
              <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>BEST</div>
            </div>
            <div style={{flex:1, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'#38bdf8'}}>{freezesLeft}🧊</div>
              <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>FREEZES</div>
            </div>
          </div>

          {/* Motivation bar */}
          {motivation && (
            <div style={{padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:16, fontSize:13, color:motivation.color, fontWeight:600, textAlign:'center'}}>
              {motivation.text}
            </div>
          )}

          {/* Progress bar */}
          {totalCount > 0 && (
            <div style={{height:6, background:'var(--surface2)', borderRadius:3, marginBottom:12, overflow:'hidden'}}>
              <div style={{height:'100%', width:`${totalCount > 0 ? (doneCount/totalCount)*100 : 0}%`, background:'linear-gradient(90deg, var(--primary), #34D399)', borderRadius:3, transition:'width 0.5s var(--ease)'}} />
            </div>
          )}

          {/* 7-Day Streak Calendar */}
          {habits.length > 0 && (() => {
            const days = []
            const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
            for (let i = 6; i >= 0; i--) {
              const d = new Date()
              d.setDate(d.getDate() - i)
              const dateStr = d.toISOString().split('T')[0]
              const isToday = i === 0
              days.push({ date: dateStr, day: dayNames[d.getDay()], num: d.getDate(), isToday })
            }
            return (
              <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:'14px 12px', marginBottom:16}}>
                <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:10, letterSpacing:1}}>7-DAY STREAK</div>
                <div style={{display:'flex', justifyContent:'space-between', gap:4}}>
                  {days.map(d => {
                    const hasDone = d.isToday ? doneCount > 0 : totalStreak > (6 - days.indexOf(d))
                    return (
                      <div key={d.date} style={{flex:1, textAlign:'center'}}>
                        <div style={{fontSize:10, color: d.isToday ? 'var(--primary)' : 'var(--text3)', fontWeight: d.isToday ? 700 : 400, marginBottom:4}}>{d.day}</div>
                        <div style={{width:32, height:32, borderRadius:8, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                          background: d.isToday ? (doneCount > 0 ? 'var(--primary)' : 'var(--primary-dim)') : (hasDone ? 'var(--primary-dim)' : 'var(--surface2)'),
                          color: d.isToday && doneCount > 0 ? '#fff' : hasDone ? 'var(--primary)' : 'var(--text3)',
                          border: d.isToday ? '2px solid var(--primary)' : '1px solid transparent',
                          fontWeight: 700
                        }}>
                          {hasDone ? '✓' : d.num}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Add Habit Panel */}
          {showAdd && (
            <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:20, animation:'slideUp 0.3s var(--ease)'}}>
              <h3 style={{fontSize:15, fontWeight:700, marginBottom:12}}>Choose a habit</h3>
              <div className="preset-grid">
                {PRESETS.filter(p => !habits.some(h => h.name.toLowerCase() === p.name.toLowerCase())).map((p, i) => (
                  <button key={i} className="preset-btn" onClick={() => addHabit(p.name, p.icon)}>
                    <span>{p.icon}</span> {p.name}
                  </button>
                ))}
              </div>
              <div style={{borderTop:'1px solid var(--border)', marginTop:14, paddingTop:14}}>
                <div style={{display:'flex', gap:8}}>
                  <input className="form-input" placeholder="Custom habit..." value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit(custom, '⭐')} style={{flex:1}} />
                  <button className="btn-primary" style={{padding:'0 16px'}} onClick={() => addHabit(custom, '⭐')}>Add</button>
                </div>
              </div>
            </div>
          )}

          {/* Habits List */}
          {habits.length === 0 ? (
            <div className="empty-state">
              <Flame size={48} className="empty-icon" />
              <h3>No habits tracked</h3>
              <p>Start building daily habits</p>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Your First Habit</button>
            </div>
          ) : (
            habits.map(h => (
              <div key={h.id} className={`habit-card${checkins[h.id] ? ' done' : ''}`}>
                <div className="habit-left">
                  <span className="habit-emoji">{h.icon || '✅'}</span>
                  <div>
                    <div className="habit-name" style={checkins[h.id] ? {textDecoration:'line-through', opacity:0.6} : {}}>{h.name}</div>
                    <div className="habit-streak">
                      <Flame size={12} /> {h.current_streak || 0} day streak
                      {h.longest_streak > 0 && <span style={{color:'var(--gold)', marginLeft:6}}>⭐ Best: {h.longest_streak}</span>}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  {!checkins[h.id] && !frozenHabits[h.id] && freezesLeft > 0 && (h.current_streak || 0) > 0 && (
                    <button className="checkin-btn" onClick={() => {
                      setFreezePrompt({ habitId: h.id, habitName: h.name, habitIcon: h.icon })
                    }} style={{color:'#38bdf8', opacity:0.7}} title="Freeze streak">
                      <Snowflake size={16} />
                    </button>
                  )}
                  {frozenHabits[h.id] && (
                    <span style={{fontSize:11, color:'#38bdf8', fontWeight:700, padding:'4px 8px', borderRadius:6, background:'rgba(56,189,248,0.1)'}}>🧊 Frozen</span>
                  )}
                  <button className={`checkin-btn${checkins[h.id] ? ' checked' : ''}`} onClick={() => toggleCheckin(h.id)}>
                    {checkins[h.id] ? <Check size={24} /> : <div style={{width:24, height:24, borderRadius:6, border:'2px solid var(--text3)'}} />}
                  </button>
                  <button className="checkin-btn" onClick={() => removeHabit(h.id)} style={{color:'var(--text3)', opacity:0.5}}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
