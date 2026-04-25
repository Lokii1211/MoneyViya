import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Calendar as CalIcon, Clock, MapPin, Users, Video, Plus, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENT_COLORS = {
  meeting: 'var(--viya-info)',
  personal: 'var(--viya-primary-500)',
  health: '#FF6B6B',
  bill: 'var(--viya-warning)',
  reminder: 'var(--viya-violet-500)',
}

export default function CalendarScreen() {
  const { phone } = useApp()
  const nav = useNavigate()
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [events, setEvents] = useState([])
  const [weekEvents, setWeekEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Generate week dates
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const loadData = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const selectedStr = selectedDate.toISOString().split('T')[0]
      const [dayEvents, upcoming] = await Promise.all([
        api.getCalendarEvents(phone, selectedStr),
        api.getUpcomingEvents(phone, 7),
      ])
      if (dayEvents?.length) setEvents(dayEvents)
      else setEvents([])
      if (upcoming?.length) setWeekEvents(upcoming)
    } catch (e) { console.error('Calendar load error:', e) }
    setLoading(false)
  }, [phone, selectedDate])

  useEffect(() => { loadData() }, [loadData])

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  const isToday = selectedDateStr === todayStr

  // Find next upcoming event
  const now = today.getHours() * 60 + today.getMinutes()
  const nextEvent = isToday ? events.find(e => {
    if (!e.start_time) return false
    const [h, m] = e.start_time.split(':').map(Number)
    return h * 60 + m > now
  }) : null

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Calendar</h1>
          <p className="body-s text-secondary">{today.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => nav('/chat?q=schedule+meeting')} style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-teal)',
        }}><Plus size={18}/></button>
      </div>

      {/* Week Strip */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16, padding: '12px 4px',
        background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)',
      }}>
        {weekDates.map((d, i) => {
          const dateStr = d.toISOString().split('T')[0]
          const isSelected = dateStr === selectedDateStr
          const isTodayDate = dateStr === todayStr
          const hasEvents = weekEvents.some(e => e.event_date === dateStr)
          return (
            <button key={i} onClick={() => setSelectedDate(new Date(d))} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: 'none',
              background: isSelected ? 'var(--gradient-primary)' : 'transparent',
              color: isSelected ? 'white' : 'var(--text-primary)',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, opacity: isSelected ? 0.8 : 0.5 }}>{DAYS[i]}</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{d.getDate()}</span>
              {hasEvents && !isSelected && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--viya-primary-500)' }} />
              )}
              {isTodayDate && !isSelected && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--viya-error)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Next Event Card (if today) */}
      {nextEvent && isToday && (
        <div style={{
          background: EVENT_COLORS[nextEvent.event_type] || 'var(--viya-primary-500)',
          borderRadius: 'var(--radius-xl)', padding: 18, marginBottom: 16, color: 'white',
          boxShadow: `0 6px 20px ${EVENT_COLORS[nextEvent.event_type] || 'var(--viya-primary-500)'}40`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Up Next
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{nextEvent.title}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, opacity: 0.85, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13}/> {nextEvent.start_time}{nextEvent.end_time ? ` — ${nextEvent.end_time}` : ''}</span>
            {nextEvent.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13}/> {nextEvent.location}</span>}
          </div>
          {nextEvent.meeting_link && (
            <button onClick={() => window.open(nextEvent.meeting_link)} style={{
              marginTop: 10, padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}><Video size={14}/> Join Meeting</button>
          )}

          {/* AI Pre-meeting Brief */}
          {nextEvent.ai_brief && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.12)', fontSize: 12, lineHeight: 1.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, opacity: 0.8 }}>
                <Zap size={12}/> <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Brief</span>
              </div>
              {nextEvent.ai_brief}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div style={{ marginBottom: 16 }}>
        <div className="title-m" style={{ fontSize: 15, marginBottom: 12 }}>
          {isToday ? "Today's Schedule" : selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>

        {events.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
            No events scheduled. Say "Schedule a meeting" to Viya! 📅
          </div>
        )}

        {events.map((event, i) => {
          const color = EVENT_COLORS[event.event_type] || 'var(--viya-primary-500)'
          const [h] = (event.start_time || '00:00').split(':').map(Number)
          const isPast = isToday && h * 60 < now
          const attendees = Array.isArray(event.attendees) ? event.attendees : []

          return (
            <div key={event.id} style={{
              display: 'flex', gap: 12, marginBottom: 12, opacity: isPast ? 0.5 : 1,
            }}>
              {/* Time Column */}
              <div style={{ width: 50, textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {event.is_all_day ? 'All day' : event.start_time || '—'}
                </div>
              </div>

              {/* Timeline bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-light)', marginTop: 4 }} />}
              </div>

              {/* Event Card */}
              <div style={{
                flex: 1, padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, textDecoration: isPast ? 'line-through' : 'none' }}>{event.title}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {event.end_time && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11}/> {event.start_time} — {event.end_time}</span>}
                  {event.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11}/> {event.location}</span>}
                  {attendees.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11}/> {attendees.map(a => typeof a === 'string' ? a : a.name || a.email).join(', ')}</span>}
                  {event.recurring && <span style={{ padding: '1px 6px', borderRadius: 99, background: color + '15', color, fontSize: 10, fontWeight: 600 }}>Recurring</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
