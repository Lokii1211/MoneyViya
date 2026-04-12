import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, Flame, Check, Trash2, Calendar, TrendingUp } from 'lucide-react'

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
  { icon: '📱', name: 'No social media 1h' },
  { icon: '🏃', name: 'Run 2km' },
  { icon: '🧮', name: 'Study 2 hours' },
  { icon: '😴', name: 'Sleep by 11 PM' },
  { icon: '🚶', name: 'Walk 5000 steps' },
]

export default function Habits() {
  const { phone } = useApp()
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [custom, setCustom] = useState('')
  const [toast, setToast] = useState('')

  const loadData = async () => {
    const h = await api.getHabits(phone)
    setHabits(h || [])
    const c = await api.getCheckins(phone)
    const map = {}
    ;(c || []).forEach(ci => { map[ci.habit_id] = true })
    setCheckins(map)
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

  const toggleCheckin = async (habitId) => {
    const result = await api.checkinHabit(habitId, phone)
    if (result.checked) {
      const habit = habits.find(h => h.id === habitId)
      const msgs = [
        `Great job! ${habit?.icon || '✅'} Keep going!`,
        `You're on fire! 🔥`,
        `${habit?.name} done! 💪 Consistency is key!`,
        `Awesome! One more step towards your best self ✨`,
        `${habit?.icon || '✅'} Checked! Viya is proud of you 🙌`,
      ]
      showToast(msgs[Math.floor(Math.random() * msgs.length)])
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
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Daily Habits</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> Add
        </button>
      </div>

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
      </div>

      {/* Motivation bar */}
      {motivation && (
        <div style={{padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:16, fontSize:13, color:motivation.color, fontWeight:600, textAlign:'center'}}>
          {motivation.text}
        </div>
      )}

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={{height:6, background:'var(--surface2)', borderRadius:3, marginBottom:20, overflow:'hidden'}}>
          <div style={{height:'100%', width:`${totalCount > 0 ? (doneCount/totalCount)*100 : 0}%`, background:'linear-gradient(90deg, var(--primary), #34D399)', borderRadius:3, transition:'width 0.5s var(--ease)'}} />
        </div>
      )}

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
          <h3>Start Building Habits</h3>
          <p>Add your first daily habit and start your streak! 🔥</p>
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
    </div>
  )
}
