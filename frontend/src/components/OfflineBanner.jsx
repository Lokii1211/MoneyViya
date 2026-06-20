/**
 * OfflineBanner — PRD Section 3.5
 * Shows amber banner when user goes offline.
 * "No internet — changes will sync when connected"
 */
import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }
    const goOffline = () => {
      setOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online && !showReconnected) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 9000,
        padding: '8px 16px',
        background: online
          ? 'linear-gradient(135deg, #00E87E, #00E5B0)'
          : 'linear-gradient(135deg, #F59E0B, #FF6B35)',
        color: 'white',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 600,
        animation: 'slideDown 0.3s ease',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span style={{ flex: 1 }}>
        {online
          ? 'Back online — syncing your changes ✓'
          : 'No internet — changes will sync when connected'}
      </span>
      {!online && (
        <span style={{ fontSize: 10, opacity: 0.7 }}>
          Last: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); }
          to { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
