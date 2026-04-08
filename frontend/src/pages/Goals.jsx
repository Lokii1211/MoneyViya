import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react'

const EMOJIS = ['🏍️','💻','🏠','✈️','📱','🎓','💍','🚗','👶','💊']

export default function Goals() {
  const { phone } = useApp()
  const [goals, setGoals] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addAmt, setAddAmt] = useState({})
  const [form, setForm] = useState({ name: '', emoji: '🎯', target: '', deadline: '' })
  const [toast, setToast] = useState('')

  const load = async () => { const g = await api.getGoals(phone); setGoals(g || []) }
  useEffect(() => { if (phone) load() }, [phone])

  const createGoal = async () => {
    if (!form.name || !form.target) return
    await api.addGoal(phone, form.name, form.emoji, Number(form.target), form.deadline)
    setForm({ name: '', emoji: '🎯', target: '', deadline: '' }); setShowAdd(false)
    showToast('Goal created! 🎯'); load()
  }

  const contribute = async (id) => {
    const amt = Number(addAmt[id])
    if (!amt || amt <= 0) return
    await api.addToGoal(id, amt)
    setAddAmt(p => ({ ...p, [id]: '' }))
    showToast(`₹${amt} added! 💪`); load()
  }

  const removeGoal = async (id) => { await api.deleteGoal(id); showToast('Goal removed'); load() }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2000) }

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount || 0), 0)

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Savings Goals</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> New Goal
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:20, textAlign:'center'}}>
          <div style={{fontSize:11, color:'var(--text3)', letterSpacing:2, fontWeight:700}}>TOTAL SAVED</div>
          <div style={{fontFamily:'var(--mono)', fontSize:32, fontWeight:800, color:'var(--primary)', margin:'4px 0'}}>₹{totalSaved.toLocaleString('en-IN')}</div>
          <div style={{fontSize:13, color:'var(--text2)'}}>of ₹{totalTarget.toLocaleString('en-IN')} target</div>
          <div className="progress-bar" style={{marginTop:12}}>
            <div className="progress-fill" style={{width: totalTarget > 0 ? Math.min((totalSaved/totalTarget)*100, 100) + '%' : '0%'}} />
          </div>
        </div>
      )}

      {/* Add Goal */}
      {showAdd && (
        <div className="entry-form" style={{marginBottom:20}}>
          <h3 style={{fontSize:15, fontWeight:700, marginBottom:14}}>Create Goal</h3>
          <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:12}}>
            {EMOJIS.map(e => (
              <button key={e} className={`cat-chip icon-chip${form.emoji === e ? ' active' : ''}`} onClick={() => setForm(p => ({...p, emoji: e}))}>{e}</button>
            ))}
          </div>
          <div className="form-group"><label>Goal Name</label>
            <input className="form-input" placeholder="e.g. Buy iPhone, Trip to Goa" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
          </div>
          <div className="form-group"><label>Target Amount (₹)</label>
            <input className="form-input big-input" type="number" placeholder="50,000" value={form.target} onChange={e => setForm(p => ({...p, target: e.target.value}))} />
          </div>
          <div className="form-group"><label>Deadline (optional)</label>
            <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={createGoal}>Create Goal</button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <h3>Set Your First Goal</h3>
          <p>What are you saving for? A bike, laptop, trip? Start saving today! 🎯</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Create Goal</button>
        </div>
      ) : (
        goals.map(g => {
          const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
          return (
            <div key={g.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-icon">{g.emoji}</div>
                <div className="goal-info">
                  <div className="goal-name">{g.name}</div>
                  <div className="goal-deadline">{g.deadline ? `By ${g.deadline}` : 'No deadline'}</div>
                </div>
                <div className="goal-pct">{Math.round(pct)}%</div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width: pct + '%'}} /></div>
              <div className="goal-amounts">
                <span>₹{Number(g.current_amount).toLocaleString('en-IN')}</span>
                <span>₹{Number(g.target_amount).toLocaleString('en-IN')}</span>
              </div>
              <div style={{display:'flex', gap:8, marginTop:12}}>
                <input className="form-input" type="number" placeholder="Add ₹..." style={{flex:1, padding:'8px 12px', fontSize:14}} value={addAmt[g.id] || ''} onChange={e => setAddAmt(p => ({...p, [g.id]: e.target.value}))} />
                <button className="btn-primary" style={{padding:'8px 16px', fontSize:13}} onClick={() => contribute(g.id)}><TrendingUp size={14} /> Add</button>
                <button style={{padding:'8px', background:'var(--red-dim)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:8, color:'var(--red)', cursor:'pointer'}} onClick={() => removeGoal(g.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
