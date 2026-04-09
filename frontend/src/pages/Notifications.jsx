import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Bell, CheckCircle, AlertTriangle, Clock, Flame, Target, Trash2 } from 'lucide-react'

const TYPE_ICON = {
  alert: <AlertTriangle size={16} />,
  success: <CheckCircle size={16} />,
  info: <Clock size={16} />,
  habit: <Flame size={16} />,
  goal: <Target size={16} />,
  otp: null, // hide OTPs
  reminder: <Clock size={16} />,
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function Notifications() {
  const { phone } = useApp()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone) return
    api.getNotifications(phone).then(data => {
      // Filter out OTP notifications
      setNotifs((data || []).filter(n => n.type !== 'otp'))
      setLoading(false)
    })
  }, [phone])

  function markRead(id) {
    api.markNotifRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }
  function remove(id) {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }
  function markAllRead() {
    notifs.forEach(n => { if (!n.is_read) api.markNotifRead(n.id) })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-left"><h2>Notifications</h2>{unread > 0 && <span className="notif-badge">{unread}</span>}</div>
        {unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}
      </header>

      {loading ? <p className="empty-text">Loading...</p> : notifs.length === 0 ? (
        <div className="empty-state"><Bell size={48} className="empty-icon" /><h3>All caught up!</h3><p>No new notifications</p></div>
      ) : (
        notifs.map(n => (
          <div key={n.id} className={'notif-card' + (n.is_read ? '' : ' unread')} onClick={() => markRead(n.id)}>
            <div className={'notif-icon ' + (n.type || 'info')}>{TYPE_ICON[n.type] || <Bell size={16} />}</div>
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-desc">{n.description}</div>
              <div className="notif-time">{timeAgo(n.created_at)}</div>
            </div>
            <button className="notif-dismiss" onClick={e => { e.stopPropagation(); remove(n.id) }}><Trash2 size={14} /></button>
          </div>
        ))
      )}
    </div>
  )
}
