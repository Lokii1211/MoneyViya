import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
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
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addAmt, setAddAmt] = useState({})
  const [form, setForm] = useState({ name: '', icon: '🎯', target: '', deadline: '' })
  const [toast, setToast] = useState('')
  const [celebration, setCelebration] = useState(null)

  const load = async () => {
    const g = await api.getGoals(phone)
    setGoals(g || [])
    setLoading(false)
  }
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
    const text = `${g.icon} I've saved ₹${Number(g.current_amount)} towards my "${g.name}" goal (${pct}%)! 🎯\n\nTracking with Viya — my AI money friend 💚\nhttps://heyviya.vercel.app`
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
        <div className="celebration-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background: celebration.pct >= 100 ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.3s'}}>
          {/* Confetti particles for 100% */}
          {celebration.pct >= 100 && (
            <div style={{position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none'}}>
              {Array.from({length: 40}).map((_, i) => (
                <div key={i} style={{
                  position:'absolute',
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  width: Math.random() * 8 + 4,
                  height: Math.random() * 8 + 4,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  background: ['#FFD700','#FF6B6B','#00E5B0','#5514FF','#FF9F43','#54A0FF','#FF78C4'][i % 7],
                  animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }} />
              ))}
            </div>
          )}
          <div style={{
            background: celebration.pct >= 100
              ? 'linear-gradient(145deg, #1a1a2e, #16213e)'
              : 'var(--surface)',
            borderRadius:24, padding:40, textAlign:'center', maxWidth:340,
            animation:'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            margin:16, position:'relative', overflow:'hidden',
            border: celebration.pct >= 100 ? '2px solid #FFD700' : '1px solid var(--border)',
            boxShadow: celebration.pct >= 100 ? '0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,215,0,0.1)' : 'none'
          }}>
            {celebration.pct >= 100 && (
              <div style={{position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,215,0,0.08), transparent, rgba(255,165,0,0.08))', pointerEvents:'none'}} />
            )}
            <div style={{fontSize:72, marginBottom:12, animation:'bounceIn 0.6s ease'}}>{celebration.emoji}</div>
            <div style={{fontSize:24, fontWeight:900, color: celebration.pct >= 100 ? '#FFD700' : 'var(--primary)', marginBottom:6, letterSpacing:1}}>{celebration.label}</div>
            <div style={{fontSize:15, color:'var(--text2)', marginBottom:14}}>{celebration.goalIcon} {celebration.goalName}</div>
            <div style={{fontSize:14, color:'var(--text3)', lineHeight:1.6, marginBottom:16}}>{celebration.msg}</div>
            {celebration.pct >= 100 && (
              <div style={{display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,215,0,0.15)', padding:'8px 18px', borderRadius:20, fontSize:13, color:'#FFD700', fontWeight:700}}>
                <Trophy size={16} /> Achievement Unlocked!
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Savings Goals</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> New Goal
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="skeleton"
              style={{ height: 120, borderRadius: 16, marginBottom: 12 }}
            />
          ))}
        </div>
      ) : (
        <>
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

          {goals.length > 0 && (
            <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:18, padding:24, marginBottom:20, textAlign:'center'}}>
              <div style={{fontSize:11, color:'var(--text3)', letterSpacing:2, fontWeight:700}}>TOTAL SAVED</div>
              <div style={{fontFamily:'var(--mono)', fontSize:36, fontWeight:900, color:'var(--primary)', margin:'4px 0'}}>₹{totalSaved}</div>
              <div style={{fontSize:13, color:'var(--text2)'}}>of ₹{totalTarget} target</div>
              <div className="progress-bar" style={{marginTop:12}}>
                <div className="progress-fill" style={{width: totalTarget > 0 ? Math.min((totalSaved/totalTarget)*100, 100) + '%' : '0%'}} />
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="empty-state">
              <Target size={48} className="empty-icon" />
              <h3>No goals yet</h3>
              <p>Create your first savings goal</p>
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
                    <div className="progress-bar" style={{position:'relative', overflow:'visible', height:8, marginBottom:16}}>
                      <div className="progress-fill" style={{width: pct + '%', height:'100%'}} />
                      {/* Milestone dots on the bar */}
                      {[25, 50, 75, 100].map(m => (
                        <div key={m} style={{
                          position:'absolute',
                          left: `${m}%`,
                          top:'50%',
                          transform:'translate(-50%, -50%)',
                          width: pct >= m ? 14 : 10,
                          height: pct >= m ? 14 : 10,
                          borderRadius:'50%',
                          background: pct >= m ? 'var(--primary)' : 'var(--bg2)',
                          border: pct >= m ? '2px solid var(--primary-light)' : '2px solid var(--border2)',
                          boxShadow: pct >= m ? '0 0 8px var(--primary-glow)' : 'none',
                          transition:'all 0.4s var(--ease)',
                          zIndex:2,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:7, color:'#fff', fontWeight:800,
                        }}>
                          {pct >= m && '✓'}
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', paddingLeft:2, paddingRight:0}}>
                      {[25, 50, 75, 100].map(m => (
                        <div key={m} style={{textAlign:'center', width:30, color: pct >= m ? 'var(--primary)' : 'var(--text3)', fontWeight: pct >= m ? 700 : 400}}>
                          {m}%
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="goal-amounts">
                    <span style={{color:'var(--primary)', fontWeight:700}}>₹{Number(g.current_amount).toLocaleString('en-IN')}</span>
                    <span>of ₹{Number(g.target_amount).toLocaleString('en-IN')}</span>
                  </div>
                  {remaining > 0 && (
                    <div style={{fontSize:13, color:'var(--text2)', marginTop:6, fontWeight:600}}>
                      ₹{remaining.toLocaleString('en-IN')} left to reach your goal
                    </div>
                  )}

                  {/* Next milestone prompt */}
                  {pct < 100 && (
                    <div style={{background:'var(--primary-dim)', borderRadius:10, padding:'8px 12px', marginTop:8, display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                      <span>{nextMs.emoji}</span>
                      <span style={{color:'var(--text2)'}}>₹{toNext} to <strong style={{color:'var(--primary)'}}>{nextMs.label}</strong></span>
                    </div>
                  )}
                  {pct >= 100 && (
                    <div style={{background:'linear-gradient(135deg, #FFD700, #FFA500)', borderRadius:10, padding:'10px 12px', marginTop:8, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#1a1a1a', fontWeight:700}}>
                      <Trophy size={16}/> Goal Achieved! You're amazing! 🎉
                    </div>
                  )}

                  <div style={{display:'flex', gap:8, marginTop:12, alignItems:'center'}}>
                    <input className="form-input" type="number" placeholder="₹ amount" style={{flex:1, padding:'8px 12px', fontSize:14}} value={addAmt[g.id] || ''} onChange={e => setAddAmt(p => ({...p, [g.id]: e.target.value}))} />
                    <button className="btn-primary" style={{padding:'8px 18px', fontSize:13, fontWeight:700, whiteSpace:'nowrap'}} onClick={() => contribute(g.id)}>
                      <Plus size={14} style={{marginRight:2}} /> Add Money
                    </button>
                    <button style={{padding:'8px', background:'var(--red-dim)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:8, color:'var(--red)', cursor:'pointer', flexShrink:0}} onClick={() => removeGoal(g.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}
