import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Plus, Clock, Calendar, Trash2, Repeat, Sun,
  X, Smartphone, MessageCircle, AlarmClock, ChevronRight,
} from 'lucide-react'

/* ─── Constants ──────────────────────────────────────────────── */

const PRESETS = [
  { icon: '💸', title: 'Track Daily Expenses',  desc: 'Log your spending before bed',             freq: 'daily',   time: '21:30' },
  { icon: '💧', title: 'Drink Water',            desc: '8 glasses a day keeps the doctor away',    freq: 'daily',   time: '08:00' },
  { icon: '📊', title: 'Weekly Finance Review',  desc: 'Check your spending & goals every week',   freq: 'weekly',  time: '10:00', weekday: 'Sunday' },
  { icon: '💳', title: 'Pay Credit Card',        desc: "Don't miss payment deadlines",             freq: 'monthly', time: '09:00', month_date: 1 },
  { icon: '🎯', title: 'Goal Check-in',          desc: 'Review your savings progress',             freq: 'weekly',  time: '18:00', weekday: 'Friday' },
  { icon: '🏃', title: 'Morning Workout',        desc: 'Stay consistent with your fitness habit',  freq: 'daily',   time: '06:30' },
  { icon: '🧘', title: 'Evening Reflection',     desc: 'Mindful moment before sleep',              freq: 'daily',   time: '22:00' },
  { icon: '📱', title: 'SIP Reminder',           desc: 'Check your monthly SIP investment status', freq: 'monthly', time: '09:00', month_date: 5 },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const FREQ_OPTIONS = [
  { v: 'daily',   l: 'Daily',     icon: <Sun size={12} /> },
  { v: 'weekly',  l: 'Weekly',    icon: <Calendar size={12} /> },
  { v: 'monthly', l: 'Monthly',   icon: <Repeat size={12} /> },
  { v: 'once',    l: 'One-time',  icon: <Clock size={12} /> },
]

const EMPTY_FORM = {
  title: '', desc: '', freq: 'daily', time: '09:00',
  weekday: 'Monday', month_date: 1, fire_date: '',
}

/* ─── Helpers ────────────────────────────────────────────────── */

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function scheduleText(r) {
  if (r.freq === 'daily')   return `Every day at ${r.time}`
  if (r.freq === 'weekly')  return `Every ${r.weekday || 'week'} at ${r.time}`
  if (r.freq === 'monthly') return `${ordinal(r.month_date || 1)} of every month at ${r.time}`
  if (r.freq === 'once' && r.fire_date) return `Once on ${fmtDate(r.fire_date)} at ${r.time}`
  return r.freq
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nextFire(r) {
  if (r.freq === 'once' && r.fire_date) return `on ${fmtDate(r.fire_date)}`
  const [h, m] = (r.time || '09:00').split(':').map(Number)
  const now = new Date(), t = new Date()
  t.setHours(h, m, 0, 0)
  if (t <= now) t.setDate(t.getDate() + 1)
  const diff = (t - now) / 1000
  if (diff < 60)    return 'any moment'
  if (diff < 3600)  return `in ${Math.round(diff / 60)}m`
  if (diff < 86400) return `in ${Math.round(diff / 3600)}h`
  return 'tomorrow'
}

function freqColor(freq) {
  if (freq === 'daily')   return 'var(--primary)'
  if (freq === 'weekly')  return 'var(--cyan, #22D3EE)'
  if (freq === 'once')    return '#f59e0b'
  return 'var(--violet, #5514FF)'
}

function freqBadgeClass(freq) {
  if (freq === 'weekly')  return 'rm-badge rm-badge--cyan'
  if (freq === 'monthly') return 'rm-badge rm-badge--violet'
  if (freq === 'once')    return 'rm-badge rm-badge--amber'
  return 'rm-badge'
}

/* ─── Toggle ─────────────────────────────────────────────────── */

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="rm-toggle"
      data-on={on ? 'true' : 'false'}
      aria-checked={on}
      role="switch"
    >
      <span className="rm-toggle-thumb" />
    </button>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Reminders() {
  const { phone } = useApp()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const timersRef = useRef({})

  /* Load on mount */
  useEffect(() => { if (phone) load() }, [phone])

  /* 30-second poll for due in-app notifications */
  useEffect(() => {
    const id = setInterval(() => {
      if (!reminders.length || Notification.permission !== 'granted') return
      const now = new Date()
      reminders.filter(r => r.enabled).forEach(r => {
        const [h, m] = (r.time || '09:00').split(':').map(Number)
        const t = new Date(); t.setHours(h, m, 0, 0)
        if (t - now >= 0 && t - now < 60000) {
          new Notification(`${r.icon || '⏰'} ${r.title}`, {
            body: r.description || r.desc || 'Time for your reminder!',
            icon: '/logo-192.png', tag: `rc-${r.id}`,
          })
        }
      })
    }, 30000)
    return () => clearInterval(id)
  }, [reminders])

  /* Cleanup timers on unmount */
  useEffect(() => () => Object.values(timersRef.current).forEach(clearTimeout), [])

  const load = async () => {
    setLoading(true)
    const data = await api.getUserReminders(phone)
    setReminders(data || [])
    setLoading(false)
  }

  const scheduleLocalNotif = (r) => {
    if (Notification.permission !== 'granted' || !r.id) return
    const [h, m] = (r.time || '09:00').split(':').map(Number)
    const now = new Date(), t = new Date()

    if (r.freq === 'once' && r.fire_date) {
      const [yr, mo, da] = r.fire_date.split('-').map(Number)
      t.setFullYear(yr, mo - 1, da)
    }
    t.setHours(h, m, 0, 0)
    if (t <= now) {
      if (r.freq !== 'once') t.setDate(t.getDate() + 1)
      else return
    }
    const delay = t - now
    if (delay > 0 && delay < 86400000) {
      clearTimeout(timersRef.current[r.id])
      timersRef.current[r.id] = setTimeout(() => {
        new Notification(`${r.icon || '⏰'} ${r.title}`, {
          body: r.description || 'Reminder from Viya!',
          icon: '/logo-192.png', tag: `r-${r.id}`, requireInteraction: true,
        })
        if (r.freq === 'daily') scheduleLocalNotif(r)
      }, delay)
    }
  }

  const requestNotif = async () => {
    const p = await Notification.requestPermission()
    setNotifPerm(p)
    if (p === 'granted') reminders.filter(r => r.enabled).forEach(scheduleLocalNotif)
  }

  const addReminder = async (preset = null) => {
    let data
    if (preset) {
      data = {
        phone, title: preset.title, description: preset.desc, icon: preset.icon,
        freq: preset.freq, time: preset.time,
        weekday: preset.weekday || null,
        month_date: preset.month_date || null,
        fire_date: null, enabled: true,
      }
    } else {
      if (!form.title.trim()) return
      data = {
        phone, title: form.title.trim(), description: form.desc.trim(), icon: '⏰',
        freq: form.freq, time: form.time,
        weekday: form.freq === 'weekly' ? form.weekday : null,
        month_date: form.freq === 'monthly' ? form.month_date : null,
        fire_date: form.freq === 'once' ? form.fire_date : null,
        enabled: true,
      }
      if (form.freq === 'once' && !form.fire_date) return
    }
    if (reminders.some(r => r.title?.toLowerCase() === data.title?.toLowerCase())) {
      setShowAdd(false); setForm(EMPTY_FORM); return
    }
    setSaving(true)
    const created = await api.createUserReminder(data)
    if (created) scheduleLocalNotif({ ...data, id: created.id })
    setForm(EMPTY_FORM); setShowAdd(false); setSaving(false)
    load()
  }

  const removeReminder = async (id) => {
    clearTimeout(timersRef.current[id]); delete timersRef.current[id]
    await api.deleteUserReminder(id)
    load()
  }

  const toggleReminder = async (id, current) => {
    clearTimeout(timersRef.current[id]); delete timersRef.current[id]
    const updated = !current
    await api.updateUserReminder(id, { enabled: updated })
    if (updated) {
      const r = reminders.find(x => x.id === id)
      if (r) scheduleLocalNotif({ ...r, enabled: true })
    }
    load()
  }

  const activeCount = reminders.filter(r => r.enabled).length
  const todayISO = new Date().toISOString().split('T')[0]

  return (
    <div className="page page-padded">

      {/* ── Add Reminder Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay"
            onClick={() => setShowAdd(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="rm-modal"
              onClick={e => e.stopPropagation()}
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              <div className="rm-modal-hdr">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlarmClock size={18} style={{ color: 'var(--primary)' }} />
                  <span className="rm-modal-title">New Reminder</span>
                </div>
                <button className="modal-close" onClick={() => setShowAdd(false)}><X size={16} /></button>
              </div>

              <div className="rm-modal-body">

                {/* Quick presets */}
                {PRESETS.filter(p => !reminders.some(r => r.title === p.title)).length > 0 && (
                  <>
                    <div className="rm-section-label">Quick presets</div>
                    <div className="rm-presets">
                      {PRESETS.filter(p => !reminders.some(r => r.title === p.title))
                        .slice(0, 6)
                        .map((p, i) => (
                          <button key={i} className="rm-preset-chip" onClick={() => addReminder(p)}>
                            <span>{p.icon}</span>
                            <span>{p.title}</span>
                          </button>
                        ))
                      }
                    </div>
                    <div className="rm-or-divider"><span>or create custom</span></div>
                  </>
                )}

                {/* Title */}
                <input
                  className="input-field"
                  placeholder="What do you want to be reminded about?"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />

                {/* Note */}
                <input
                  className="input-field"
                  placeholder="Add a note (optional)"
                  value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  style={{ marginTop: 8 }}
                />

                {/* Frequency selector */}
                <div className="rm-section-label" style={{ marginTop: 14 }}>Repeat</div>
                <div className="rm-freq-row">
                  {FREQ_OPTIONS.map(f => (
                    <button
                      key={f.v}
                      className={`rm-freq-btn ${form.freq === f.v ? 'rm-freq-btn--active' : ''}`}
                      onClick={() => setForm({ ...form, freq: f.v })}
                    >
                      {f.icon} {f.l}
                    </button>
                  ))}
                </div>

                {/* Day of week (weekly) */}
                {form.freq === 'weekly' && (
                  <>
                    <div className="rm-section-label" style={{ marginTop: 12 }}>Day of week</div>
                    <div className="rm-day-row">
                      {WEEKDAYS.map(d => (
                        <button
                          key={d}
                          className={`rm-day-btn ${form.weekday === d ? 'rm-day-btn--active' : ''}`}
                          onClick={() => setForm({ ...form, weekday: d })}
                        >
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Day of month (monthly) */}
                {form.freq === 'monthly' && (
                  <>
                    <div className="rm-section-label" style={{ marginTop: 12 }}>Day of month</div>
                    <div className="rm-day-row">
                      {[1, 2, 3, 5, 7, 10, 14, 15, 20, 21, 25, 28].map(d => (
                        <button
                          key={d}
                          className={`rm-day-btn ${form.month_date === d ? 'rm-day-btn--active rm-day-btn--violet' : ''}`}
                          onClick={() => setForm({ ...form, month_date: d })}
                        >
                          {ordinal(d)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Specific date (once) */}
                {form.freq === 'once' && (
                  <>
                    <div className="rm-section-label" style={{ marginTop: 12 }}>Date</div>
                    <input
                      type="date"
                      className="input-field"
                      min={todayISO}
                      value={form.fire_date}
                      onChange={e => setForm({ ...form, fire_date: e.target.value })}
                    />
                  </>
                )}

                {/* Time */}
                <div className="rm-section-label" style={{ marginTop: 12 }}>Time</div>
                <div className="rm-time-row">
                  <Clock size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <input
                    type="time"
                    className="input-field"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>

                {/* Preview */}
                {form.title.trim() && (
                  <div className="rm-preview">
                    <span style={{ opacity: 0.6, fontSize: 11 }}>Preview</span>
                    <span style={{ fontWeight: 700 }}>⏰ {form.title}</span>
                    <span style={{ fontSize: 12, color: freqColor(form.freq) }}>
                      {scheduleText({ ...form, description: form.desc })}
                    </span>
                  </div>
                )}

                {/* CTA */}
                <button
                  className="btn-primary full"
                  onClick={() => addReminder()}
                  disabled={saving || !form.title.trim() || (form.freq === 'once' && !form.fire_date)}
                  style={{ marginTop: 14 }}
                >
                  {saving ? 'Saving…' : <><Bell size={14} /> Set Reminder</>}
                </button>

                <div className="rm-wa-hint">
                  <MessageCircle size={10} />
                  Fires on WhatsApp at the exact minute — even when the app is closed
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="header-left">
          <AlarmClock size={22} style={{ color: 'var(--primary)' }} />
          <h2>Reminders</h2>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: 13, gap: 5 }}
          onClick={() => setShowAdd(true)}
        >
          <Plus size={15} /> New
        </button>
      </div>

      {/* ── Stats Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rm-stats-card"
      >
        <div className="rm-stats-row">
          <div>
            <div className="rm-stats-num">{activeCount}</div>
            <div className="rm-stats-lbl">Active</div>
          </div>
          <div>
            <div className="rm-stats-num">{reminders.filter(r => r.freq === 'daily').length}</div>
            <div className="rm-stats-lbl">Daily</div>
          </div>
          <div>
            <div className="rm-stats-num">{reminders.filter(r => r.freq === 'weekly').length}</div>
            <div className="rm-stats-lbl">Weekly</div>
          </div>
          <div>
            <div className="rm-stats-num">{reminders.filter(r => r.freq === 'monthly').length}</div>
            <div className="rm-stats-lbl">Monthly</div>
          </div>
        </div>
        <div className="rm-stats-channels">
          <div className="rm-channel-pill">
            <MessageCircle size={11} style={{ color: 'var(--primary)' }} />
            <span>WhatsApp delivery</span>
          </div>
          <div className="rm-channel-pill">
            <Smartphone size={11} style={{ color: '#22D3EE' }} />
            <span>Browser push</span>
          </div>
        </div>
        <p className="rm-stats-sub">
          Reminders fire on WhatsApp to the exact minute — even when the app is closed.
        </p>
      </motion.div>

      {/* ── Notification Permission Banner ── */}
      {typeof Notification !== 'undefined' && notifPerm === 'default' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rm-notif-banner"
        >
          <Bell size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Enable browser notifications</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Get in-app push notifications even when this tab is in the background
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '7px 12px', fontSize: 12, flexShrink: 0 }}
            onClick={requestNotif}
          >
            Enable
          </button>
        </motion.div>
      )}

      {/* ── Reminder List ── */}
      {loading ? (
        <div>
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16, marginBottom: 10 }} />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
          <AlarmClock size={52} className="empty-icon" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--primary)', opacity: 0.5 }} />
          <h3>No reminders yet</h3>
          <p>
            Set reminders for bills, habits, goals, medicines, or anything you want.
            They fire on WhatsApp — no need to open the app.
          </p>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Your First Reminder
          </button>
        </motion.div>
      ) : (
        <div className="rm-list">
          <AnimatePresence>
            {reminders.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.04, type: 'spring', damping: 22, stiffness: 260 }}
                className={`rm-item ${r.enabled ? '' : 'rm-item--off'}`}
              >
                <div className="rm-item-left">
                  <div className="rm-item-icon">{r.icon || '⏰'}</div>
                  <div className="rm-item-body">
                    <div className="rm-item-title">{r.title}</div>
                    {r.description && (
                      <div className="rm-item-desc">{r.description}</div>
                    )}
                    <div className="rm-item-row">
                      <span className={freqBadgeClass(r.freq)}>{r.freq}</span>
                      <span className="rm-item-sched" style={{ color: freqColor(r.freq) }}>
                        {scheduleText(r)}
                      </span>
                    </div>
                    {r.enabled && (
                      <div className="rm-item-next">
                        <Clock size={9} /> Next: {nextFire(r)}
                        <span className="rm-item-wa-dot"><MessageCircle size={9} /> WhatsApp</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rm-item-actions">
                  <Toggle on={!!r.enabled} onToggle={() => toggleReminder(r.id, r.enabled)} />
                  <button className="rm-delete-btn" onClick={() => removeReminder(r.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
