// Toast — native-style slide-down toast notifications
import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle size={18} color="#4CAF50" />,
  error: <AlertTriangle size={18} color="#F44336" />,
  info: <Info size={18} color="#2196F3" />,
  warning: <AlertTriangle size={18} color="#FF9800" />,
}

const COLORS = {
  success: { bg: '#E8F5E9', border: '#4CAF50' },
  error: { bg: '#FFEBEE', border: '#F44336' },
  info: { bg: '#E3F2FD', border: '#2196F3' },
  warning: { bg: '#FFF3E0', border: '#FF9800' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 'env(safe-area-inset-top, 12px)',
        left: 12, right: 12, zIndex: 9999, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8,
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ y: -60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 250 }}
              onClick={() => dismiss(toast.id)}
              style={{
                padding: '12px 16px', borderRadius: 14,
                background: COLORS[toast.type]?.bg || COLORS.info.bg,
                borderLeft: `4px solid ${COLORS[toast.type]?.border || COLORS.info.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 10,
                pointerEvents: 'auto', cursor: 'pointer',
              }}
            >
              {ICONS[toast.type]}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{toast.message}</span>
              <X size={14} color="#999" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
