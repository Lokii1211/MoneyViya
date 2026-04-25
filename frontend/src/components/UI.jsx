import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const success = useCallback((msg) => show(msg, 'success'), [show])
  const error = useCallback((msg) => show(msg, 'error'), [show])
  const info = useCallback((msg) => show(msg, 'info'), [show])

  return (
    <ToastCtx.Provider value={{ show, success, error, info }}>
      {children}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '100%', maxWidth: 430, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

// Bottom Sheet component
export function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {title && <h3 className="title-m" style={{ marginBottom: 16 }}>{title}</h3>}
        {children}
      </div>
    </>
  )
}

// Empty state component
export function EmptyState({ icon, title, subtitle, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div className="title-m" style={{ marginBottom: 8 }}>{title}</div>
      {subtitle && <div className="body-s text-secondary" style={{ marginBottom: 20 }}>{subtitle}</div>}
      {action && <button className="btn btn-primary" onClick={onAction}>{action}</button>}
    </div>
  )
}

// Skeleton loader presets
export function SkeletonCard({ height = 120 }) {
  return <div className="skeleton" style={{ width: '100%', height, borderRadius: 20, marginBottom: 12 }} />
}

export function SkeletonList({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '40%', height: 12 }} />
      </div>
    </div>
  ))
}

// Section header
export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 20 }}>
      <span className="title-m">{title}</span>
      {action && <button className="btn-ghost body-s" onClick={onAction} style={{ fontWeight: 600 }}>{action}</button>}
    </div>
  )
}

// Stat card
export function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div className="num-s" style={{ color: color || 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
      <div className="caption" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{label}</div>
    </div>
  )
}
