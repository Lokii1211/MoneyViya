import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Bell, Plus, Clock, Calendar, Trash2, Repeat, Sun, X, Smartphone, MessageCircle, Check } from 'lucide-react'

const REMINDER_PRESETS = [
  { icon: '💰', title: 'Track expenses', description: 'Log your daily spending', freq: 'daily', time: '21:00' },
  { icon: '💧', title: 'Drink water', description: 'Stay hydrated!', freq: 'daily', time: '09:00' },
  { icon: '📊', title: 'Weekly review', description: 'Check your financial health', freq: 'weekly', time: '10:00', weekday: 'Sunday' },
  { icon: '💳', title: 'Pay bills', description: "Don't miss payment deadlines", freq: 'monthly', time: '09:00', month_date: 1 },
  { icon: '🎯', title: 'Goal check-in', description: 'Review savings progress', freq: 'weekly', time: '18:00', weekday: 'Friday' },
  { icon: '🧘', title: 'Mindful moment', description: 'Take a breath, reflect', freq: 'daily', time: '07:00' },
  { icon: '📱', title: 'Screen time check', description: 'How much time on phone?', freq: 'daily', time: '20:00' },
]

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Reminders() {
  const { phone } = useApp()
  const [reminders, setReminders] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', freq: 'daily', time: '09:00', weekday: 'Monday', month_date: 1 })
  const timersRef = useRef({})

  useEffect(() => {
    if (phone) loadReminders()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [phone])

  // Check for due reminders every 30 seconds while the page is open
  useEffect(() => {
    function checkReminders() {
      const now = new Date()
      reminders.forEach(r => {
        if (!r.enabled) return
        const [hours, mins] = (r.time || '09:00').split(':').map(Number)
        const target = new Date()
        target.setHours(hours, mins, 0, 0)
        const diff = target - now
        // Due within the next 60 seconds (so 30s interval catches it)
        if (diff >= 0 && diff < 60000) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${r.icon || '⏰'} ${r.title}`, {
              body: r.description || 'Time for your reminder!',
              icon: '/logo-192.png',
              tag: `reminder-check-${r.id}`,
            })
          }
          showMsg(`⏰ ${r.title} - it's time!`)
        }
      })
    }
    const interval = setInterval(checkReminders, 30000)
    return () => clearInterval(interval)
  }, [reminders])

  const loadReminders = async () => {
    setLoading(true)
    const data = await api.getUserReminders(phone)
    setReminders(data || [])
    // Schedule browser notifications for all enabled reminders
    ;(data || []).forEach(r => r.enabled && scheduleNotification(r))
    setLoading(false)
  }

  const addReminder = async (preset = null) => {
    const newR = preset || { ...form, icon: '⏰' }
    if (!newR.title?.trim()) { showMsg('Enter a reminder title'); return }
    const exists = reminders.some(x => x.title?.toLowerCase() === newR.title?.toLowerCase())
    if (exists) { showMsg('⚠️ Reminder already exists'); return }

    // Save to Supabase — this gets picked up by the cron for WhatsApp delivery
    const entry = {
      phone,
      title: newR.title,
      description: newR.description || '',
      icon: newR.icon || '⏰',
      freq: newR.freq || 'daily',
      time: newR.time || '09:00',
      weekday: newR.weekday || null,
      month_date: newR.month_date || null,
      fire_date: newR.fire_date || null,
      enabled: true,
    }

    await api.createUserReminder(entry)
    showMsg('✅ Reminder set! You\'ll get it on WhatsApp too 📱')
    setForm({ title: '', description: '', freq: 'daily', time: '09:00', weekday: 'Monday', month_date: 1 })
    setShowAdd(false)
    loadReminders()
  }

  const removeReminder = async (id) => {
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id] }
    await api.deleteUserReminder(id)
    showMsg('Reminder removed')
    loadReminders()
  }

  const toggleReminder = async (id, currentEnabled) => {
    await api.updateUserReminder(id, { enabled: !currentEnabled })
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id] }
    loadReminders()
  }

  const scheduleNotification = (r) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const [hours, mins] = (r.time || '09:00').split(':').map(Number)
    const now = new Date(), target = new Date()
    target.setHours(hours, mins, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const delay = target - now
    if (delay > 0 && delay < 86400000) {
      if (timersRef.current[r.id]) clearTimeout(timersRef.current[r.id])
      timersRef.current[r.id] = setTimeout(() => {
        new Notification(`${r.icon || '⏰'} ${r.title}`, {
          body: r.description || 'Time for your reminder!',
          icon: '/logo.png',
          tag: `reminder-${r.id}`,
          requireInteraction: true
        })
        if (r.freq === 'daily') scheduleNotification(r)
      }, delay)
    }
  }

  const showMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const gc = (freq) => freq === 'daily' ? 'var(--primary)' : freq === 'weekly' ? 'var(--cyan)' : 'var(--violet)'

  const getScheduleText = (r) => {
    if (r.freq === 'daily') return `Every day at ${r.time}`
    if (r.freq === 'weekly') return `Every ${r.weekday || 'week'} at ${r.time}`
    if (r.freq === 'monthly') return `${ordinal(r.month_date || 1)} of every month at ${r.time}`
    if (r.freq === 'once') return `Once at ${r.time}${r.fire_date ? ` on ${r.fire_date}` : ''}`
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
    if (diff < 60) return 'any moment'
    if (diff < 3600) return `in ${Math.round(diff/60)}m`
    if (diff < 86400) return `in ${Math.round(diff/3600)}h`
    return 'tomorrow'
  }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      <div className="page-header">
        <h2 className="header-left">Reminders</h2>
        <button className="btn-primary btn-sm-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New
        </button>
      </div>

      {/* Status */}
      <div className="reminder-status-card">
        <div className="reminder-status-header">
          <Bell size={14} color="var(--primary)"/>
          <span className="reminder-status-title">SMART REMINDERS</span>
        </div>
        <div className="reminder-status-channels">
          <div className="reminder-channel">
            <MessageCircle size={12} color="var(--primary)"/>
            <span><strong>WhatsApp</strong> — exact time delivery</span>
          </div>
          <div className="reminder-channel">
            <Smartphone size={12} color="var(--cyan)"/>
            <span><strong>Browser</strong> — when tab is open</span>
          </div>
        </div>
        <div className="reminder-status-count">
          ✅ {reminders.filter(r => r.enabled).length} active reminder(s) — fires on WhatsApp accurately to the minute
        </div>
      </div>

      {/* Notification Permission Prompt */}
      {'Notification' in window && Notification.permission !== 'granted' && (
        <div className="notif-permission-banner">
          <Bell size={18} color="var(--primary)"/>
          <div className="notif-permission-body">
            <div className="notif-permission-title">Enable browser notifications</div>
            <div className="notif-permission-desc">Get notified when your reminders are due, even if the tab is in the background.</div>
          </div>
          <button className="btn-primary btn-sm" onClick={() => {
            Notification.requestPermission().then(p => {
              if (p === 'granted') showMsg('Notifications enabled!')
              else showMsg('Notifications blocked. Enable in browser settings.')
            })
          }}>Enable</button>
        </div>
      )}

      {/* Add Panel */}
      {showAdd && (
        <div className="reminder-add-panel">
          <div className="reminder-add-header">
            <h3 className="reminder-add-title">Add Reminder</h3>
            <button className="reminder-close-btn" onClick={() => setShowAdd(false)}><X size={18}/></button>
          </div>

          <div className="reminder-section-label">Quick Add</div>
          <div className="preset-list">
            {REMINDER_PRESETS.filter(p => !reminders.some(r => r.title === p.title)).map((p, i) => (
              <button key={i} className="preset-item" onClick={() => addReminder(p)}>
                <span className="preset-emoji">{p.icon}</span>
                <div className="preset-body">
                  <div className="preset-title">{p.title}</div>
                  <div className="preset-desc">{p.description}</div>
                </div>
                <span className="preset-freq" style={{ color: gc(p.freq) }}>{p.freq}</span>
              </button>
            ))}
          </div>

          <div className="reminder-section-label">Custom Reminder</div>
          <input className="form-input mb-8" placeholder="Reminder title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input className="form-input mb-10" placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

          <div className="time-label">FREQUENCY</div>
          <div className="reminder-freq-bar">
            {[{v:'daily',l:'Daily',i:<Sun size={13}/>},{v:'weekly',l:'Weekly',i:<Calendar size={13}/>},{v:'monthly',l:'Monthly',i:<Repeat size={13}/>}].map(f => (
              <button key={f.v} className="reminder-freq-btn"
                style={{
                  border: `1px solid ${form.freq === f.v ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.freq === f.v ? 'var(--primary-dim)' : 'var(--bg2)',
                  color: form.freq === f.v ? 'var(--primary)' : 'var(--text2)',
                }}
                onClick={() => setForm({...form, freq: f.v})}>
                {f.i} {f.l}
              </button>
            ))}
          </div>

          {form.freq === 'weekly' && (
            <div className="mb-10">
              <div className="time-label">WHICH DAY</div>
              <div className="day-selector">
                {WEEKDAYS.map(d => (
                  <button key={d} className="day-btn"
                    style={{
                      border: `1px solid ${form.weekday === d ? 'var(--cyan)' : 'var(--border)'}`,
                      background: form.weekday === d ? 'var(--cyan-dim)' : 'var(--bg2)',
                      color: form.weekday === d ? 'var(--cyan)' : 'var(--text3)',
                    }}
                    onClick={() => setForm({...form, weekday: d})}>
                    {d.slice(0,3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.freq === 'monthly' && (
            <div className="mb-10">
              <div className="time-label">WHICH DATE</div>
              <div className="day-selector">
                {[1,5,10,15,20,25,28].map(d => (
                  <button key={d} className="date-btn"
                    style={{
                      border: `1px solid ${form.month_date === d ? 'var(--violet)' : 'var(--border)'}`,
                      background: form.month_date === d ? 'var(--violet-dim)' : 'var(--bg2)',
                      color: form.month_date === d ? 'var(--violet)' : 'var(--text3)',
                    }}
                    onClick={() => setForm({...form, month_date: d})}>
                    {ordinal(d)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="time-input-row">
            <div className="time-input-col">
              <div className="time-label">TIME</div>
              <input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
          </div>

          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => addReminder()}>
            <Bell size={16}/> Set Reminder (App + WhatsApp)
          </button>
          <div className="reminder-hint">
            📱 You'll receive this on WhatsApp at the exact time
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <p className="loading-center">Loading...</p> : reminders.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} className="empty-icon" />
          <h3>No Reminders Yet</h3>
          <p>Set reminders — they fire on WhatsApp at the exact minute!</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Your First Reminder</button>
        </div>
      ) : (
        <div className="reminder-list">
          {reminders.map(r => (
            <div key={r.id} className={`reminder-item${r.enabled ? '' : ' disabled'}`}>
              <span className="reminder-emoji">{r.icon || '⏰'}</span>
              <div className="reminder-body">
                <div className="reminder-title">{r.title}</div>
                <div className="reminder-schedule" style={{ color: gc(r.freq) }}>{getScheduleText(r)}</div>
                {r.enabled && (
                  <div className="reminder-meta">
                    <span className="reminder-next">Next: {nextFireTime(r)}</span>
                    <span className="reminder-wa">
                      <MessageCircle size={9}/> WhatsApp ✓
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => toggleReminder(r.id, r.enabled)}
                className={`reminder-toggle ${r.enabled ? 'on' : 'off'}`}>
                <div className="reminder-toggle-dot" style={{ transform: r.enabled ? 'translateX(16px)' : 'translateX(0)' }} />
              </button>
              <button onClick={() => removeReminder(r.id)} className="reminder-delete-btn"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
