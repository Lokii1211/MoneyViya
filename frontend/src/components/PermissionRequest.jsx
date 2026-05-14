/**
 * PermissionRequest — PRD Section 3.7 Flow 3
 * "Ask in context, explain value, never ask more than once on rejection"
 * Target: 75% accept rate per permission
 *
 * Strategy:
 *   SMS: After first bank account setup
 *   Notifications: After first reminder creation
 *   Camera: When user taps Scan Food/Receipt (implied)
 */
import { useState } from 'react'
import { X, MessageSquare, Bell, Camera, Shield } from 'lucide-react'

const PERMISSION_CONFIGS = {
  sms: {
    icon: <MessageSquare size={24} />,
    title: 'Auto-track your expenses',
    description: 'To automatically log expenses from bank SMS, allow SMS reading. Only financial SMS is read — nothing personal.',
    benefit: '✨ Zero manual logging needed',
    cta: 'Allow SMS Reading',
    deny: 'I\'ll log manually',
    color: 'var(--primary)',
    context: 'bank_account_setup',
  },
  notifications: {
    icon: <Bell size={24} />,
    title: 'Never miss your reminders',
    description: 'To send you this reminder, allow notifications. Viya sends max 3 notifications per day.',
    benefit: '🔔 WhatsApp as fallback if disabled',
    cta: 'Allow Notifications',
    deny: 'Use WhatsApp instead',
    color: 'var(--orange)',
    context: 'first_reminder',
  },
  camera: {
    icon: <Camera size={24} />,
    title: 'Scan food & receipts',
    description: 'Camera access lets you scan food for nutrition tracking and receipts for expense logging.',
    benefit: '📸 AI identifies food + calories instantly',
    cta: 'Allow Camera',
    deny: 'Not now',
    color: 'var(--cyan)',
    context: 'scan_feature',
  },
}

export default function PermissionRequest({ permission, onAllow, onDeny, onClose }) {
  const [closing, setClosing] = useState(false)
  const config = PERMISSION_CONFIGS[permission]
  
  if (!config) return null

  const handleClose = (action) => {
    setClosing(true)
    setTimeout(() => {
      action?.()
      onClose?.()
    }, 250)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => handleClose(onDeny)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 600, animation: closing ? 'fadeOut 0.25s ease' : 'fadeIn 0.25s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', bottom: '50%', left: '50%',
        transform: 'translate(-50%, 50%)',
        width: 'calc(100% - 40px)', maxWidth: 360, zIndex: 601,
        background: 'var(--surface)', borderRadius: 24,
        padding: '28px 24px 24px', boxShadow: '0 16px 60px rgba(0,0,0,0.2)',
        animation: closing ? 'scaleOut 0.25s ease' : 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Close */}
        <button onClick={() => handleClose(onDeny)} style={{
          position: 'absolute', top: 12, right: 12, width: 28, height: 28,
          borderRadius: '50%', background: 'var(--surface2)', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={14} />
        </button>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16',
          background: `${config.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: config.color,
        }}>
          {config.icon}
        </div>

        {/* Content */}
        <h3 style={{
          textAlign: 'center', fontSize: 18, fontWeight: 800,
          letterSpacing: '-0.3px', marginBottom: 8,
        }}>
          {config.title}
        </h3>
        <p style={{
          textAlign: 'center', fontSize: 13, color: 'var(--text2)',
          lineHeight: 1.6, marginBottom: 12,
        }}>
          {config.description}
        </p>

        {/* Privacy badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 99, margin: '0 auto 20',
          background: 'var(--primary-dim)', width: 'fit-content',
        }}>
          <Shield size={12} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>
            {config.benefit}
          </span>
        </div>

        {/* Buttons */}
        <button onClick={() => handleClose(onAllow)} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: config.color, color: 'white', border: 'none',
          cursor: 'pointer', fontSize: 15, fontWeight: 700,
          marginBottom: 8, minHeight: 48,
          boxShadow: `0 4px 16px ${config.color}33`,
        }}>
          {config.cta}
        </button>

        <button onClick={() => handleClose(onDeny)} style={{
          width: '100%', padding: '12px', borderRadius: 14,
          background: 'transparent', color: 'var(--text3)', border: 'none',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 44,
        }}>
          {config.deny}
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: translate(-50%, 50%) scale(0.8); opacity: 0; }
          to { transform: translate(-50%, 50%) scale(1); opacity: 1; }
        }
        @keyframes scaleOut {
          from { transform: translate(-50%, 50%) scale(1); opacity: 1; }
          to { transform: translate(-50%, 50%) scale(0.9); opacity: 0; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </>
  )
}
