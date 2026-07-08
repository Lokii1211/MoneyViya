import { useState } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, Shield, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'

const STEPS = { INFO: 1, CONFIRM: 2, PROCESSING: 3, DONE: 4 }

export default function DeleteAccount() {
  const { phone, logout } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(STEPS.INFO)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setStep(STEPS.PROCESSING)

    try {
      const result = await api.deleteAccount(phone)
      if (!result.success) throw new Error('Deletion did not complete')

      setStep(STEPS.DONE)

      setTimeout(() => {
        localStorage.clear()
        logout()
        nav('/auth')
      }, 3000)
    } catch (err) {
      console.error('Delete account error:', err)
      toast.show('Something went wrong deleting your account. Please try again or email lokesh@viya.app.', 'error')
      setStep(STEPS.CONFIRM)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => step === STEPS.INFO ? nav(-1) : setStep(STEPS.INFO)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-primary)', display: 'flex',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora',sans-serif" }}>Delete Account</h2>
      </div>

      {/* Step Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[STEPS.INFO, STEPS.CONFIRM, STEPS.PROCESSING, STEPS.DONE].map((s) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: step >= s ? '#F44336' : 'var(--bg-secondary)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Info */}
        {step === STEPS.INFO && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(244,67,54,0.08), rgba(244,67,54,0.02))',
              border: '1px solid rgba(244,67,54,0.2)',
              borderRadius: 16, padding: 24, marginBottom: 20, textAlign: 'center',
            }}>
              <Trash2 size={40} style={{ color: '#F44336', marginBottom: 12 }} />
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
                Delete Your Account
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                This action is <strong>permanent and irreversible</strong>. All your data will be erased and cannot be recovered.
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>What will be deleted:</div>

            {[
              { icon: '💰', label: 'All transactions & expenses' },
              { icon: '🔥', label: 'Habits, streaks & check-ins' },
              { icon: '🎯', label: 'Goals & savings progress' },
              { icon: '💬', label: 'Chat history with Viya' },
              { icon: '💚', label: 'Health & meal logs' },
              { icon: '👤', label: 'Profile & account data' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-card)',
                border: '1px solid var(--border-light)', borderRadius: 12, marginBottom: 8,
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}

            <div style={{
              background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)',
              borderRadius: 12, padding: 14, marginTop: 16, display: 'flex', gap: 10,
            }}>
              <AlertTriangle size={18} style={{ color: '#FF9800', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>Warning:</strong> This cannot be undone. Consider exporting your data first. If you just want to take a break, you can log out instead.
              </div>
            </div>

            <button
              className="logout-btn"
              onClick={() => setStep(STEPS.CONFIRM)}
              style={{
                width: '100%', padding: 16, marginTop: 24,
                background: '#F44336', color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Trash2 size={16} /> I understand, continue
            </button>
          </motion.div>
        )}

        {/* Step 2: Confirm */}
        {step === STEPS.CONFIRM && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div style={{
              background: 'rgba(244,67,54,0.06)',
              border: '2px solid #F44336', borderRadius: 16,
              padding: 24, textAlign: 'center', marginBottom: 24,
            }}>
              <AlertTriangle size={44} style={{ color: '#F44336', marginBottom: 12 }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#F44336', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
                Are you absolutely sure?
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                All data for <strong>+91 {phone}</strong> will be permanently deleted. This action cannot be undone.
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                Type <span style={{ color: '#F44336', fontFamily: 'monospace', letterSpacing: 2 }}>DELETE</span> to confirm:
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                autoFocus
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '2px solid #F44336', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 18, fontWeight: 800,
                  fontFamily: 'monospace', textAlign: 'center', letterSpacing: 6,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setStep(STEPS.INFO); setConfirmText('') }}
                style={{
                  flex: 1, padding: 14, background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)', borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  color: 'var(--text-primary)', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                className="logout-btn"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE'}
                style={{
                  flex: 2, padding: 14,
                  background: confirmText === 'DELETE' ? '#F44336' : 'var(--bg-secondary)',
                  color: confirmText === 'DELETE' ? '#fff' : 'var(--text-tertiary)',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800,
                  cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', opacity: confirmText === 'DELETE' ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Trash2 size={16} /> Delete Forever
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {step === STEPS.PROCESSING && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <Loader2 size={48} style={{ color: '#F44336', marginBottom: 20, animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
              Deleting your account...
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Please wait while we remove all your data. This may take a moment.
            </div>
          </motion.div>
        )}

        {/* Step 4: Done */}
        {step === STEPS.DONE && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <CheckCircle size={56} style={{ color: '#4CAF50', marginBottom: 16 }} />
            </motion.div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
              Account Deleted
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
              All your data has been permanently removed. You will be redirected to the login screen.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Redirecting in 3 seconds...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Footer */}
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Your privacy matters. Data deletion is processed immediately.
        <br />For questions, email{' '}
        <a href="mailto:lokesh@viya.app" style={{ color: 'var(--viya-primary-500)' }}>lokesh@viya.app</a>
      </div>
    </div>
  )
}
