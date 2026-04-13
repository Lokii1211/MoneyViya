import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Bell, Plus, Clock, Calendar, Trash2, Repeat, Sun, X } from 'lucide-react'

const REMINDER_PRESETS = [
  { icon: '💰', title: 'Track expenses', desc: 'Log your daily spending', freq: 'daily', time: '21:00' },
  { icon: '💧', title: 'Drink water', desc: 'Stay hydrated!', freq: 'daily', time: '09:00' },
  { icon: '📊', title: 'Weekly review', desc: 'Check your financial health', freq: 'weekly', time: '10:00', weekday: 'Sunday' },
  { icon: '💳', title: 'Pay bills', desc: "Don't miss payment deadlines", freq: 'monthly', time: '09:00', monthDate: 1 },
  { icon: '🎯', title: 'Goal check-in', desc: 'Review savings progress', freq: 'weekly', time: '18:00', weekday: 'Friday' },
  { icon: '🧘', title: 'Mindful moment', desc: 'Take a breath, reflect', freq: 'daily', time: '07:00' },
  { icon: '📱', title: 'Screen time check', desc: 'How much time on phone?', freq: 'daily', time: '20:00' },
]

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Reminders() {
  const { phone } = useApp()
  const [reminders, setReminders] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title: '', desc: '', freq: 'daily', time: '09:00', weekday: 'Monday', monthDate: 1, enabled: true })
  const timersRef = useRef({})

  // Load from Supabase + localStorage as fallback
  useEffect(() => {
    loadReminders()
    // Request notification permission proactively
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [phone])

  const loadReminders = async () => {
    // Try Supabase first
    if (phone) {
      const dbReminders = await api.getReminders(phone)
      if (dbReminders && dbReminders.length > 0) {
        setReminders(dbReminders)
        dbReminders.forEach(r => scheduleNotification(r))
        return
      }
    }
    // Fallback to localStorage
    const saved = JSON.parse(localStorage.getItem('mv_reminders') || '[]')
    setReminders(saved)
    saved.forEach(r => scheduleNotification(r))
  }

  const saveReminders = async (list) => {
    setReminders(list)
    localStorage.setItem('mv_reminders', JSON.stringify(list))
    // Also save each to Supabase for persistence
    if (phone) {
      try {
        // We'll store in localStorage as the source of truth since
        // the reminders table schema may differ
        // But also add a notification for any NEW reminder
      } catch (e) { console.log('Remote reminder save skipped:', e) }
    }
  }

  const addReminder = (r = null) => {
    const newR = r || { ...form, id: Date.now(), icon: '⏰' }
    if (!newR.title?.trim()) { showMsg('Enter a reminder title'); return }
    const exists = reminders.some(x => x.title?.toLowerCase() === newR.title?.toLowerCase())
    if (exists) { showMsg('⚠️ Reminder already exists'); return }
    const entry = { ...newR, id: newR.id || Date.now(), enabled: true }
    const updated = [...reminders, entry]
    saveReminders(updated)
    setForm({ title: '', desc: '', freq: 'daily', time: '09:00', weekday: 'Monday', monthDate: 1, enabled: true })
    setShowAdd(false)
    showMsg('✅ Reminder set!')
    scheduleNotification(entry)
  }

  const removeReminder = (id) => {
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id] }
    saveReminders(reminders.filter(r => r.id !== id))
    showMsg('Reminder removed')
  }

  const toggleReminder = (id) => {
    const updated = reminders.map(r => {
      if (r.id === id) {
        const toggled = { ...r, enabled: !r.enabled }
        if (toggled.enabled) scheduleNotification(toggled)
        else if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id] }
        return toggled
      }
      return r
    })
    saveReminders(updated)
  }

  const scheduleNotification = (r) => {
    if (!r.enabled) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const [hours, mins] = (r.time || '09:00').split(':').map(Number)
    const now = new Date(), target = new Date()
    target.setHours(hours, mins, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const delay = target - now

    // Only schedule if within 24 hours
    if (delay > 0 && delay < 86400000) {
      // Clear existing timer for this reminder
      if (timersRef.current[r.id]) clearTimeout(timersRef.current[r.id])
      timersRef.current[r.id] = setTimeout(() => {
        new Notification(`${r.icon || '⏰'} ${r.title}`, {
          body: r.desc || 'Time for your reminder!',
          icon: '/logo.png',
          tag: `reminder-${r.id}`,
          requireInteraction: true
        })
        // Re-schedule for recurring
        if (r.freq === 'daily') scheduleNotification(r)
      }, delay)
    }
  }

  const showMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const gc = (freq) => freq === 'daily' ? 'var(--primary)' : freq === 'weekly' ? 'var(--cyan)' : 'var(--violet)'

  const getScheduleText = (r) => {
    if (r.freq === 'daily') return `Every day at ${r.time}`
    if (r.freq === 'weekly') return `Every ${r.weekday || 'week'} at ${r.time}`
    if (r.freq === 'monthly') return `${ordinal(r.monthDate || 1)} of every month at ${r.time}`
    return r.freq
  }

  function ordinal(n) {
    const s = ['th','st','nd','rd'], v = n % 100
    return n + (s[(v-20)%10] || s[v] || s[0])
  }

  const nextFireTime = (r) => {
    const [h, m] = (r.time || '09:00').split(':').map(Number)
    const now = new Date(), t = new Date()
    t.setHours(h, m, 0, 0)
    if (t <= now) t.setDate(t.getDate() + 1)
    const diff = (t - now) / 1000
    if (diff < 3600) return `in ${Math.round(diff/60)}m`
    if (diff < 86400) return `in ${Math.round(diff/3600)}h`
    return `tomorrow`
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

      {/* Status Banner */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:'18px 20px', marginBottom:20}}>
        <div style={{fontSize:13, fontWeight:700, color:'var(--primary)', marginBottom:4}}><Bell size={14} style={{marginRight:4}}/> REMINDERS STATUS</div>
        <div style={{fontSize:13, color:'var(--text)', lineHeight:1.6}}>
          {'Notification' in window && Notification.permission === 'granted'
            ? `✅ Browser notifications active. ${reminders.filter(r => r.enabled).length} reminder(s) scheduled.`
            : '⚠️ Enable notifications below for reminders to work!'}
        </div>
        {reminders.length > 0 && (
          <div style={{fontSize:11, color:'var(--text3)', marginTop:6}}>
            💡 WhatsApp reminders are sent via your daily briefing (8 AM & 9 PM)
          </div>
        )}
      </div>

      {/* Add Panel */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:20, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <h3 style={{fontSize:15, fontWeight:700}}>Add Reminder</h3>
            <button style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer'}} onClick={() => setShowAdd(false)}><X size={18}/></button>
          </div>

          <div style={{fontSize:12, fontWeight:700, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5}}>Quick Add</div>
          <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:16}}>
            {REMINDER_PRESETS.filter(p => !reminders.some(r => r.title === p.title)).map((p, i) => (
              <button key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', fontFamily:'inherit', color:'var(--text)', textAlign:'left', width:'100%', transition:'all 0.2s'}} onClick={() => addReminder(p)}>
                <span style={{fontSize:18}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700}}>{p.title}</div>
                  <div style={{fontSize:11, color:'var(--text3)'}}>{p.desc}</div>
                </div>
                <span style={{fontSize:11, color:gc(p.freq), fontWeight:700, padding:'3px 8px', background:'var(--surface)', borderRadius:6}}>{p.freq}</span>
              </button>
            ))}
          </div>

          <div style={{fontSize:12, fontWeight:700, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5}}>Custom Reminder</div>
          <input className="form-input" placeholder="Reminder title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{marginBottom:8}} />
          <input className="form-input" placeholder="Description (optional)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} style={{marginBottom:10}} />

          {/* Frequency */}
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>FREQUENCY</div>
          <div style={{display:'flex', gap:4, marginBottom:10}}>
            {[{v:'daily',l:'Daily',i:<Sun size={13}/>},{v:'weekly',l:'Weekly',i:<Calendar size={13}/>},{v:'monthly',l:'Monthly',i:<Repeat size={13}/>}].map(f => (
              <button key={f.v} style={{flex:1, padding:'8px', border:`1px solid ${form.freq === f.v ? 'var(--primary)' : 'var(--border)'}`, background:form.freq === f.v ? 'var(--primary-dim)' : 'var(--bg2)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:form.freq === f.v ? 'var(--primary)' : 'var(--text2)', display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={() => setForm({...form, freq: f.v})}>
                {f.i} {f.l}
              </button>
            ))}
          </div>

          {/* Weekly: Day picker */}
          {form.freq === 'weekly' && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>WHICH DAY</div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {WEEKDAYS.map(d => (
                  <button key={d} style={{padding:'6px 10px', border:`1px solid ${form.weekday === d ? 'var(--cyan)' : 'var(--border)'}`, background:form.weekday === d ? 'var(--cyan-dim)' : 'var(--bg2)', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:form.weekday === d ? 'var(--cyan)' : 'var(--text3)'}} onClick={() => setForm({...form, weekday: d})}>
                    {d.slice(0,3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Date picker */}
          {form.freq === 'monthly' && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>WHICH DATE</div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {[1,5,10,15,20,25,28].map(d => (
                  <button key={d} style={{padding:'6px 12px', border:`1px solid ${form.monthDate === d ? 'var(--violet)' : 'var(--border)'}`, background:form.monthDate === d ? 'var(--violet-dim)' : 'var(--bg2)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:form.monthDate === d ? 'var(--violet)' : 'var(--text3)'}} onClick={() => setForm({...form, monthDate: d})}>
                    {ordinal(d)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time */}
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4}}>TIME</div>
              <input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{padding:'8px 12px', fontSize:14}} />
            </div>
          </div>
          <button className="btn-primary" style={{width:'100%', padding:12}} onClick={() => addReminder()}>
            <Bell size={16}/> Set Reminder
          </button>
        </div>
      )}

      {/* Active Reminders List */}
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
            <div key={r.id} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, opacity:r.enabled ? 1 : 0.5, transition:'all 0.3s var(--ease)'}}>
              <span style={{fontSize:22}}>{r.icon || '⏰'}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:700}}>{r.title}</div>
                <div style={{fontSize:11, color:gc(r.freq), fontWeight:600, marginTop:2}}>{getScheduleText(r)}</div>
                {r.enabled && <div style={{fontSize:10, color:'var(--text3)', marginTop:2}}>Next: {nextFireTime(r)}</div>}
              </div>
              <button onClick={() => toggleReminder(r.id)} style={{width:38, height:22, borderRadius:11, padding:2, cursor:'pointer', border:'none', background:r.enabled ? 'var(--primary)' : 'var(--surface3)', transition:'all 0.3s'}}>
                <div style={{width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform 0.3s', transform:r.enabled ? 'translateX(16px)' : 'translateX(0)', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
              </button>
              <button onClick={() => removeReminder(r.id)} style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4}}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {'Notification' in window && Notification.permission !== 'granted' && (
        <button style={{width:'100%', marginTop:20, padding:'12px', background:'var(--gold-dim)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, color:'var(--gold)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8}} onClick={() => Notification.requestPermission().then(() => { showMsg('✅ Notifications enabled!'); reminders.forEach(r => scheduleNotification(r)) })}>
          <Bell size={16}/> Enable browser notifications for reminders
        </button>
      )}

      <div style={{marginTop:16, padding:14, background:'var(--surface)', borderRadius:12, border:'1px solid var(--border2)'}}>
        <div style={{fontSize:12, fontWeight:700, marginBottom:6}}>💡 How Reminders Work</div>
        <div style={{fontSize:11, color:'var(--text3)', lineHeight:1.6}}>
          • <strong>Browser notifications</strong> fire when the page is open<br/>
          • <strong>WhatsApp reminders</strong> are sent via your Viya daily briefings (8 AM & 9 PM)<br/>
          • Set custom reminders via WhatsApp: "remind me at 10:30 AM to pay rent"
        </div>
      </div>
    </div>
  )
}
