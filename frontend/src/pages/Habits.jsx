import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, Flame, Check, Trash2 } from 'lucide-react'

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
    await api.addHabit(phone, name.trim(), icon)
    setCustom(''); setShowAdd(false)
    showToast('Habit added! 🔥')
    loadData()
  }

  const toggleCheckin = async (habitId) => {
    const result = await api.checkinHabit(habitId, phone)
    showToast(result.checked ? 'Great job! ✅' : 'Check-in removed')
    loadData()
  }

  const removeHabit = async (id) => {
    await api.deleteHabit(id)
    showToast('Habit removed')
    loadData()
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const doneCount = Object.keys(checkins).length
  const totalCount = habits.length
  const totalStreak = habits.reduce((s, h) => s + (h.current_streak || 0), 0)

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
      <div style={{display:'flex', gap:10, marginBottom:20}}>
        <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
          <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--primary)'}}>{doneCount}/{totalCount}</div>
          <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>TODAY</div>
        </div>
        <div style={{flex:1, background:'var(--orange-dim)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
          <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--orange)'}}>{totalStreak}🔥</div>
          <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>STREAK</div>
        </div>
        <div style={{flex:1, background:'var(--gold-dim)', border:'1px solid rgba(255,193,7,0.2)', borderRadius:12, padding:'14px 16px', textAlign:'center'}}>
          <div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--gold)'}}>{totalCount > 0 ? Math.round((doneCount/totalCount)*100) : 0}%</div>
          <div style={{fontSize:11, color:'var(--text2)', fontWeight:600}}>DONE</div>
        </div>
      </div>

      {/* Add Habit Panel */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:20}}>
          <h3 style={{fontSize:15, fontWeight:700, marginBottom:12}}>Choose a habit</h3>
          <div className="preset-grid">
            {PRESETS.map((p, i) => (
              <button key={i} className="preset-btn" onClick={() => addHabit(p.name, p.icon)}>
                <span>{p.icon}</span> {p.name}
              </button>
            ))}
          </div>
          <div style={{borderTop:'1px solid var(--border)', marginTop:14, paddingTop:14}}>
            <div style={{display:'flex', gap:8}}>
              <input className="form-input" placeholder="Custom habit..." value={custom} onChange={e => setCustom(e.target.value)} style={{flex:1}} />
              <button className="btn-primary" style={{padding:'0 16px'}} onClick={() => addHabit(custom, '✅')}>Add</button>
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
                <div className="habit-streak"><Flame size={12} /> {h.current_streak || 0} day streak</div>
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
