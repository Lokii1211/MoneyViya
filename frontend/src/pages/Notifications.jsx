import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useNotificationStore } from '../stores'
import { timeAgo } from '../lib/utils'
import { Bell, CheckCheck, Trash2, Sparkles, TrendingUp, AlertTriangle, Target, Flame } from 'lucide-react'

const ICON_MAP = {
  'finance': { icon: '💰', color: 'var(--viya-success)' },
  'habit': { icon: '🔥', color: 'var(--viya-gold-500)' },
  'goal': { icon: '🎯', color: 'var(--viya-violet-500)' },
  'alert': { icon: '⚠️', color: 'var(--viya-warning)' },
  'insight': { icon: '🧠', color: 'var(--viya-primary-500)' },
  'general': { icon: '📣', color: 'var(--viya-neutral-400)' },
}

export default function Notifications() {
  const { phone } = useApp()
  const { notifications, setNotifications, markRead, clearAll } = useNotificationStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (phone) {
      api.getNotifications(phone).then(n => {
        setNotifications(n || [])
        setLoading(false)
      })
    }
  }, [phone])

  const handleMarkRead = async (id) => {
    markRead(id)
    await api.markNotifRead(id)
  }

  const handleClearAll = async () => {
    clearAll()
    await api.clearNotifications(phone)
  }

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="display-m">Notifications</h2>
        {notifications.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearAll} style={{ gap: 4 }}>
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <div className="title-m" style={{ marginBottom: 8 }}>All caught up!</div>
          <div className="body-s text-secondary">No new notifications. Check back later.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = ICON_MAP[n.type] || ICON_MAP.general
            return (
              <div key={n.id} onClick={() => handleMarkRead(n.id)} className="card" style={{
                padding: '14px 16px', cursor: 'pointer',
                opacity: n.is_read ? 0.6 : 1,
                borderLeft: n.is_read ? 'none' : `3px solid ${meta.color}`,
                animation: 'slideUp 0.2s ease',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: meta.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{n.title}</div>
                    {n.description && n.description !== n.title && (
                      <div className="body-s text-secondary">{n.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
