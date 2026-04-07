import { useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, TrendingUp, Flame, Target, Trash2 } from 'lucide-react'

const MOCK_NOTIFS = [
  { id: 1, type: 'alert', icon: <AlertTriangle size={16} />, title: 'Budget Warning', desc: 'Food spending is at 85% of your budget', time: '2h ago', read: false },
  { id: 2, type: 'success', icon: <CheckCircle size={16} />, title: 'Goal Progress', desc: 'Emergency Fund reached 50%! Keep going 🎉', time: '5h ago', read: false },
  { id: 3, type: 'info', icon: <TrendingUp size={16} />, title: 'Market Update', desc: 'Nifty up 1.2% today. Your portfolio is growing.', time: '8h ago', read: true },
  { id: 4, type: 'habit', icon: <Flame size={16} />, title: 'Habit Reminder', desc: 'Don\'t forget to track expenses today! 🔥 3-day streak', time: '1d ago', read: true },
  { id: 5, type: 'info', icon: <Target size={16} />, title: 'Weekly Review Ready', desc: 'Your weekly financial review is ready to view', time: '2d ago', read: true },
]

export default function Notifications() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS)

  function markRead(id) { setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)) }
  function remove(id) { setNotifs(prev => prev.filter(n => n.id !== id)) }
  function markAllRead() { setNotifs(prev => prev.map(n => ({ ...n, read: true }))) }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-left"><h2>Notifications</h2>{unread > 0 && <span className="notif-badge">{unread}</span>}</div>
        {unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}
      </header>

      {notifs.length === 0 ? (
        <div className="empty-state"><Bell size={48} className="empty-icon" /><h3>All caught up!</h3><p>No new notifications</p></div>
      ) : (
        notifs.map(n => (
          <div key={n.id} className={'notif-card' + (n.read ? '' : ' unread')} onClick={() => markRead(n.id)}>
            <div className={'notif-icon ' + n.type}>{n.icon}</div>
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-desc">{n.desc}</div>
              <div className="notif-time">{n.time}</div>
            </div>
            <button className="notif-dismiss" onClick={e => { e.stopPropagation(); remove(n.id) }}><Trash2 size={14} /></button>
          </div>
        ))
      )}
    </div>
  )
}
