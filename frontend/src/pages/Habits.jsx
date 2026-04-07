import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, CheckCircle, Flame, Circle } from 'lucide-react'

const PRESETS = [
  { name: 'Track Expenses', emoji: '📝' },
  { name: 'Save Daily', emoji: '🐷' },
  { name: 'Read Books', emoji: '📚' },
  { name: 'Exercise', emoji: '🏋️' },
  { name: 'No Junk Food', emoji: '🥗' },
  { name: 'Morning Walk', emoji: '🌅' },
]

export default function Habits() {
  const { phone } = useApp()
  const [habits, setHabits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🔥')
  const [msg, setMsg] = useState('')

  useEffect(() => { if (phone) api.getHabits(phone).then(d => setHabits(d?.habits || [])) }, [phone])

  async function addHabit(habitName, habitEmoji) {
    const r = await api.chat(phone, `add habit ${habitName}`)
    setMsg(r.reply || 'Habit added!')
    setShowForm(false); setName('')
    api.getHabits(phone).then(d => setHabits(d?.habits || []))
    setTimeout(() => setMsg(''), 3000)
  }

  async function checkin(habitName) {
    const r = await api.chat(phone, `done ${habitName}`)
    setMsg(r.reply || 'Checked in!')
    api.getHabits(phone).then(d => setHabits(d?.habits || []))
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Habit Tracker</h2></div></header>
      {msg && <div className="toast">{msg}</div>}
      {habits.length === 0 && !showForm && (
        <div className="empty-state">
          <Flame size={48} className="empty-icon" />
          <h3>Build Better Habits</h3>
          <p>Start with a preset or create your own</p>
          <div className="preset-grid">{PRESETS.map((p, i) => (
            <button key={i} className="preset-btn" onClick={() => addHabit(p.name, p.emoji)}><span>{p.emoji}</span> {p.name}</button>
          ))}</div>
        </div>
      )}
      {habits.map((h, i) => {
        const today = new Date().toISOString().split('T')[0]
        const done = h.last_checked === today
        return (
          <div key={i} className={'habit-card' + (done ? ' done' : '')}>
            <div className="habit-left">
              <span className="habit-emoji">{h.emoji || '🔥'}</span>
              <div className="habit-info"><div className="habit-name">{h.name}</div><div className="habit-streak"><Flame size={12} /> {h.streak || 0} day streak</div></div>
            </div>
            <button className={'checkin-btn' + (done ? ' checked' : '')} onClick={() => !done && checkin(h.name)}>
              {done ? <CheckCircle size={24} /> : <Circle size={24} />}
            </button>
          </div>
        )
      })}
      {habits.length > 0 && !showForm && <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={20} /> Add Habit</button>}
      {showForm && (
        <form className="entry-form" onSubmit={e => { e.preventDefault(); addHabit(name, emoji) }}>
          <div className="form-group"><label>Habit Name</label><input type="text" className="form-input" placeholder="e.g. Meditate" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Habit</button>
          </div>
        </form>
      )}
    </div>
  )
}
