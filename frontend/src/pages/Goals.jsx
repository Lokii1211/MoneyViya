import { useState } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, Target, Trophy, Trash2 } from 'lucide-react'

const ICONS = ['🎯','🏠','🚗','💍','🎓','🏖️','💰','🏋️','📚','🌍']

export default function Goals() {
  const { phone } = useApp()
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [msg, setMsg] = useState('')

  useState(() => { if (phone) api.getGoals(phone).then(d => setGoals(d?.goals || [])) }, [phone])

  async function handleSubmit(e) {
    e.preventDefault()
    const text = `set goal ${name} target ${target} by ${deadline}`
    const r = await api.chat(phone, text)
    setMsg(r.reply || 'Goal created!')
    setShowForm(false); setName(''); setTarget(''); setDeadline('')
    api.getGoals(phone).then(d => setGoals(d?.goals || []))
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Goals</h2></div></header>
      {msg && <div className="toast">{msg}</div>}
      {!showForm ? (
        <>
          <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={20} /> Create New Goal</button>
          {goals.length === 0 && (
            <div className="empty-state">
              <Trophy size={48} className="empty-icon" />
              <h3>No goals yet</h3>
              <p>Set your first financial goal and start tracking progress!</p>
            </div>
          )}
          {goals.map((g, i) => {
            const pct = g.target_amount ? Math.min(100, Math.round((g.current_amount || 0) / g.target_amount * 100)) : 0
            return (
              <div key={i} className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon">{g.icon || '🎯'}</span>
                  <div className="goal-info"><div className="goal-name">{g.name}</div><div className="goal-deadline">{g.deadline || 'No deadline'}</div></div>
                  <div className="goal-pct">{pct}%</div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
                <div className="goal-amounts"><span>₹{(g.current_amount || 0).toLocaleString('en-IN')}</span><span>₹{(g.target_amount || 0).toLocaleString('en-IN')}</span></div>
              </div>
            )
          })}
        </>
      ) : (
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-group"><label>Goal Name</label><input type="text" className="form-input" placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>Icon</label><div className="cat-grid">{ICONS.map(ic => (<button type="button" key={ic} className={'cat-chip icon-chip' + (icon === ic ? ' active' : '')} onClick={() => setIcon(ic)}>{ic}</button>))}</div></div>
          <div className="form-group"><label>Target Amount (₹)</label><input type="number" className="form-input" placeholder="100000" value={target} onChange={e => setTarget(e.target.value)} required /></div>
          <div className="form-group"><label>Deadline</label><input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Goal</button>
          </div>
        </form>
      )}
    </div>
  )
}
