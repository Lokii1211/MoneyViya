import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Bell, Plus, Clock, Calendar, Trash2, Check, Repeat, Sun, Moon, X } from 'lucide-react'

const REMINDER_PRESETS = [
  { icon: '💰', title: 'Track expenses', desc: 'Log your daily spending', freq: 'daily', time: '21:00' },
  { icon: '💧', title: 'Drink water', desc: 'Stay hydrated!', freq: 'daily', time: '09:00' },
  { icon: '📊', title: 'Weekly review', desc: 'Check your financial health', freq: 'weekly', time: '10:00' },
  { icon: '💳', title: 'Pay bills', desc: 'Don\'t miss payment deadlines', freq: 'monthly', time: '09:00' },
  { icon: '🎯', title: 'Goal check-in', desc: 'Review savings progress', freq: 'weekly', time: '18:00' },
  { icon: '🧘', title: 'Mindful moment', desc: 'Take a breath, reflect', freq: 'daily', time: '07:00' },
]

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily', icon: <Sun size={14}/> },
  { value: 'weekly', label: 'Weekly', icon: <Calendar size={14}/> },
  { value: 'monthly', label: 'Monthly', icon: <Repeat size={14}/> },
]

export default function Reminders() {
  const { phone } = useApp()
  const [reminders, setReminders] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title: '', desc: '', freq: 'daily', time: '09:00', enabled: true })

  useEffect(() => {
    // Load from localStorage (client-side reminders for now)
    const saved = JSON.parse(localStorage.getItem('mv_reminders') || '[]')
    setReminders(saved)
  }, [])

  const saveReminders = (list) => {
    setReminders(list)
    localStorage.setItem('mv_reminders', JSON.stringify(list))
  }

  const addReminder = (r = null) => {
    const newR = r || { ...form, id: Date.now(), icon: '⏰' }
    if (!newR.title.trim()) { showMsg('Enter a reminder title'); return }
    const exists = reminders.some(x => x.title.toLowerCase() === newR.title.toLowerCase())
    if (exists) { showMsg('⚠️ Reminder already exists'); return }
    saveReminders([...reminders, { ...newR, id: newR.id || Date.now(), enabled: true }])
    setForm({ title: '', desc: '', freq: 'daily', time: '09:00', enabled: true })
    setShowAdd(false)
    showMsg('✅ Reminder added!')

    // Schedule browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotification(newR)
    }
  }

  const removeReminder = (id) => {
    saveReminders(reminders.filter(r => r.id !== id))
    showMsg('Reminder removed')
  }

  const toggleReminder = (id) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const scheduleNotification = (r) => {
    // Simple daily notification scheduling
    const [hours, mins] = r.time.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(hours, mins, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const delay = target - now
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        new Notification(`${r.icon} ${r.title}`, { body: r.desc || 'Time for your reminder!', icon: '/logo.png' })
      }, delay)
    }
  }

  const showMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const getFreqLabel = (freq) => {
    if (freq === 'daily') return 'Every day'
    if (freq === 'weekly') return 'Every week'
    if (freq === 'monthly') return 'Every month'
    return freq
  }

  const getFreqColor = (freq) => {
    if (freq === 'daily') return 'var(--primary)'
    if (freq === 'weekly') return 'var(--cyan)'
    if (freq === 'monthly') return 'var(--violet)'
    return 'var(--text2)'
  }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Reminders</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}}/> New
        </button>
      </div>

      {/* Morning Greeting Card */}
      <div style={{
        background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))',
        border:'1px solid var(--border2)', borderRadius:16, padding:'18px 20px', marginBottom:20
      }}>
        <div style={{fontSize:13, fontWeight:700, color:'var(--primary)', marginBottom:4}}>
          <Bell size={14} style={{marginRight:4}}/> DAILY VIYA REMINDER
        </div>
        <div style={{fontSize:14, color:'var(--text)', lineHeight:1.6}}>
          {new Date().getHours() < 12
            ? "☀️ Good morning! Viya will remind you about your habits and expenses throughout the day. Stay consistent!"
            : new Date().getHours() < 18
            ? "🌤️ Afternoon check: Have you logged your expenses today? Your future self will thank you!"
            : "🌙 Evening wrap-up: Complete your remaining habits before bed. You've got this!"}
        </div>
      </div>

      {/* Quick Add Presets */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:20, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <h3 style={{fontSize:15, fontWeight:700}}>Add Reminder</h3>
            <button style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer'}} onClick={() => setShowAdd(false)}><X size={18}/></button>
          </div>

          {/* Presets */}
          <div style={{fontSize:12, fontWeight:700, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5}}>Quick Add</div>
          <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:16}}>
            {REMINDER_PRESETS.filter(p => !reminders.some(r => r.title === p.title)).map((p, i) => (
              <button key={i} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10,
                cursor:'pointer', fontFamily:'inherit', color:'var(--text)', textAlign:'left', width:'100%',
                transition:'all 0.2s'
              }} onClick={() => addReminder(p)}>
                <span style={{fontSize:18}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700}}>{p.title}</div>
                  <div style={{fontSize:11, color:'var(--text3)'}}>{p.desc}</div>
                </div>
                <span style={{fontSize:11, color:getFreqColor(p.freq), fontWeight:700, padding:'3px 8px', background:'var(--surface)', borderRadius:6}}>{p.freq}</span>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div style={{fontSize:12, fontWeight:700, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5}}>Custom Reminder</div>
          <input className="form-input" placeholder="Reminder title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{marginBottom:8}} />
          <input className="form-input" placeholder="Description (optional)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} style={{marginBottom:8}} />
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>FREQUENCY</div>
              <div style={{display:'flex', gap:4}}>
                {FREQ_OPTIONS.map(f => (
                  <button key={f.value} style={{
                    flex:1, padding:'8px', border:`1px solid ${form.freq === f.value ? 'var(--primary)' : 'var(--border)'}`,
                    background:form.freq === f.value ? 'var(--primary-dim)' : 'var(--bg2)',
                    borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    color:form.freq === f.value ? 'var(--primary)' : 'var(--text2)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:4
                  }} onClick={() => setForm({...form, freq: f.value})}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{width:100}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>TIME</div>
              <input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{padding:'8px 10px', fontSize:13}} />
            </div>
          </div>
          <button className="btn-primary" style={{width:'100%', padding:12}} onClick={() => addReminder()}>
            <Bell size={16}/> Set Reminder
          </button>
        </div>
      )}

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} className="empty-icon" />
          <h3>No Reminders Yet</h3>
          <p>Set reminders to stay on track with your habits, expenses, and goals.</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Your First Reminder</button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {reminders.map(r => (
            <div key={r.id} style={{
              display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
              background:'var(--surface)', border:`1px solid ${r.enabled ? 'var(--border)' : 'var(--border)'}`,
              borderRadius:14, opacity:r.enabled ? 1 : 0.5, transition:'all 0.3s var(--ease)'
            }}>
              <span style={{fontSize:22}}>{r.icon || '⏰'}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:700}}>{r.title}</div>
                <div style={{display:'flex', alignItems:'center', gap:8, marginTop:2}}>
                  <span style={{fontSize:11, color:getFreqColor(r.freq), fontWeight:700}}>{getFreqLabel(r.freq)}</span>
                  <span style={{fontSize:11, color:'var(--text3)'}}>• {r.time}</span>
                </div>
              </div>
              <button onClick={() => toggleReminder(r.id)} style={{
                width:38, height:22, borderRadius:11, padding:2, cursor:'pointer', border:'none',
                background:r.enabled ? 'var(--primary)' : 'var(--surface3)', transition:'all 0.3s'
              }}>
                <div style={{width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform 0.3s', transform:r.enabled ? 'translateX(16px)' : 'translateX(0)', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
              </button>
              <button onClick={() => removeReminder(r.id)} style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4}}>
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notification permission prompt */}
      {'Notification' in window && Notification.permission !== 'granted' && reminders.length > 0 && (
        <button style={{
          width:'100%', marginTop:20, padding:'12px', background:'var(--gold-dim)', border:'1px solid rgba(245,158,11,0.2)',
          borderRadius:12, color:'var(--gold)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8
        }} onClick={() => Notification.requestPermission()}>
          <Bell size={16}/> Enable notifications for reminders to work
        </button>
      )}
    </div>
  )
}
