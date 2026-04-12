import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Target, Plus, Trash2, TrendingUp, Trophy, Share2, Star } from 'lucide-react'

const ICONS = ['🏍️','💻','🏠','✈️','📱','🎓','💍','🚗','👶','💊','💎','🎸','📷','🏋️','🎮']

// Micro-milestones: 10%, 25%, 50%, 75%, 90%, 100%
const MILESTONES = [
  { pct: 10, label: 'First Steps!', emoji: '🌱', msg: 'Journey of 1000 miles begins with 1 step!' },
  { pct: 25, label: 'Quarter Way!', emoji: '🚀', msg: 'You\'re building momentum! Keep going!' },
  { pct: 50, label: 'HALFWAY!', emoji: '🔥', msg: 'You\'re unstoppable! Half done already!' },
  { pct: 75, label: 'Almost There!', emoji: '⚡', msg: 'The finish line is in sight! Don\'t stop!' },
  { pct: 90, label: 'SO CLOSE!', emoji: '💎', msg: 'Just a little more! You\'re a champion!' },
  { pct: 100, label: 'GOAL ACHIEVED!', emoji: '🏆', msg: 'YOU DID IT! Time to celebrate!' }
]

export default function Goals() {
  const { phone } = useApp()
  const [goals, setGoals] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addAmt, setAddAmt] = useState({})
  const [form, setForm] = useState({ name: '', icon: '🎯', target: '', deadline: '' })
  const [toast, setToast] = useState('')
  const [celebration, setCelebration] = useState(null)

  const load = async () => { const g = await api.getGoals(phone); setGoals(g || []) }
  useEffect(() => { if (phone) load() }, [phone])

  const createGoal = async () => {
    if (!form.name || !form.target) return
    await api.addGoal(phone, form.name, form.icon, Number(form.target), form.deadline)
    setForm({ name: '', icon: '🎯', target: '', deadline: '' }); setShowAdd(false)
    showToast('Goal created! 🎯'); load()
  }

  const contribute = async (id) => {
    const amt = Number(addAmt[id])
    if (!amt || amt <= 0) return
    const goal = goals.find(g => g.id === id)
    const oldPct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
    
    await api.addToGoal(id, amt)
    setAddAmt(p => ({ ...p, [id]: '' }))
    
    // Check milestone
    const newAmt = Number(goal.current_amount) + amt
    const newPct = goal.target_amount > 0 ? (newAmt / goal.target_amount) * 100 : 0
    const milestone = MILESTONES.find(m => oldPct < m.pct && newPct >= m.pct)
    
    if (milestone) {
      setCelebration({ ...milestone, goalName: goal.name, goalIcon: goal.icon })
      setTimeout(() => setCelebration(null), 4000)
    } else {
      showToast(`₹${amt} added! 💪`)
    }
    load()
  }

  const removeGoal = async (id) => { await api.deleteGoal(id); showToast('Goal removed'); load() }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2000) }

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount || 0), 0)

  const shareGoal = (g) => {
    const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0
    const text = `${g.icon} I've saved ₹${Number(g.current_amount).toLocaleString('en-IN')} towards my "${g.name}" goal (${pct}%)! 🎯\n\nTracking with Viya — my AI money friend 💚\nhttps://moneyviya.vercel.app`
    if (navigator.share) {
      navigator.share({ title: 'My Savings Goal', text })
    } else {
      navigator.clipboard.writeText(text)
      showToast('Copied to clipboard! 📋')
    }
  }

  const getNextMilestone = (pct) => MILESTONES.find(m => pct < m.pct) || MILESTONES[MILESTONES.length - 1]

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      
      {/* Milestone Celebration Overlay */}
      {celebration && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s'}}>
          <div style={{background:'var(--surface)', borderRadius:24, padding:32, textAlign:'center', maxWidth:320, animation:'scaleIn 0.4s var(--ease)', margin:16}}>
            <div style={{fontSize:64, marginBottom:8}}>{celebration.emoji}</div>
            <div style={{fontSize:22, fontWeight:900, color:'var(--primary)', marginBottom:4}}>{celebration.label}</div>
            <div style={{fontSize:14, color:'var(--text2)', marginBottom:12}}>{celebration.goalIcon} {celebration.goalName}</div>
            <div style={{fontSize:13, color:'var(--text3)', lineHeight:1.5}}>{celebration.msg}</div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Savings Goals</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> New Goal
        </button>
      </div>

      {goals.length > 0 && (
        <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:18, padding:24, marginBottom:20, textAlign:'center'}}>
          <div style={{fontSize:11, color:'var(--text3)', letterSpacing:2, fontWeight:700}}>TOTAL SAVED</div>
          <div style={{fontFamily:'var(--mono)', fontSize:36, fontWeight:900, color:'var(--primary)', margin:'4px 0'}}>₹{totalSaved.toLocaleString('en-IN')}</div>
          <div style={{fontSize:13, color:'var(--text2)'}}>of ₹{totalTarget.toLocaleString('en-IN')} target</div>
          <div className="progress-bar" style={{marginTop:12}}>
            <div className="progress-fill" style={{width: totalTarget > 0 ? Math.min((totalSaved/totalTarget)*100, 100) + '%' : '0%'}} />
          </div>
        </div>
      )}

      {showAdd && (
        <div className="entry-form" style={{marginBottom:20}}>
          <h3 style={{fontSize:15, fontWeight:700, marginBottom:14}}>Create Goal</h3>
          <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:12}}>
            {ICONS.map(e => (
              <button key={e} className={`cat-chip icon-chip${form.icon === e ? ' active' : ''}`} onClick={() => setForm(p => ({...p, icon: e}))}>{e}</button>
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

      {goals.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <h3>Set Your First Goal</h3>
          <p>What are you saving for? A bike, laptop, trip? Start today! 🎯</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Create Goal</button>
        </div>
      ) : (
        goals.map(g => {
          const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
          const nextMs = getNextMilestone(pct)
          const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount))
          const toNext = Math.max(0, Math.ceil(g.target_amount * (nextMs.pct / 100)) - Number(g.current_amount))
          
          return (
            <div key={g.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-icon">{g.icon || '🎯'}</div>
                <div className="goal-info">
                  <div className="goal-name">{g.name}</div>
                  <div className="goal-deadline">{g.deadline ? `By ${g.deadline}` : 'No deadline'}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text3)'}} onClick={() => shareGoal(g)}><Share2 size={14}/></button>
                  <div className="goal-pct">{Math.round(pct)}%</div>
                </div>
              </div>
              
              {/* Progress with milestone markers */}
              <div style={{position:'relative', marginBottom:4}}>
                <div className="progress-bar"><div className="progress-fill" style={{width: pct + '%'}} /></div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
                  {MILESTONES.filter(m => m.pct <= 100).map(m => (
                    <div key={m.pct} style={{fontSize:9, color: pct >= m.pct ? 'var(--primary)' : 'var(--text3)', fontWeight: pct >= m.pct ? 700 : 400}}>
                      {pct >= m.pct ? '✓' : m.pct + '%'}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="goal-amounts">
                <span>₹{Number(g.current_amount).toLocaleString('en-IN')}</span>
                <span>₹{Number(g.target_amount).toLocaleString('en-IN')}</span>
              </div>
              
              {/* Next milestone prompt */}
              {pct < 100 && (
                <div style={{background:'var(--primary-dim)', borderRadius:10, padding:'8px 12px', marginTop:8, display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                  <span>{nextMs.emoji}</span>
                  <span style={{color:'var(--text2)'}}>₹{toNext.toLocaleString('en-IN')} to <strong style={{color:'var(--primary)'}}>{nextMs.label}</strong></span>
                </div>
              )}
              {pct >= 100 && (
                <div style={{background:'linear-gradient(135deg, #FFD700, #FFA500)', borderRadius:10, padding:'10px 12px', marginTop:8, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#1a1a1a', fontWeight:700}}>
                  <Trophy size={16}/> Goal Achieved! You're amazing! 🎉
                </div>
              )}
              
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
