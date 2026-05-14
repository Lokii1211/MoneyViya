/**
 * PremiumTrigger — PRD Section 3.7 Flow 2
 * "Smart, not annoying" premium upgrade prompts
 *
 * Trigger points:
 *   - After 3rd "feature locked" encounter
 *   - After first goal milestone (emotional high)
 *   - After monthly report (shows value delivered)
 *   - After email detects a bill due (shows intelligence)
 *
 * Anti-patterns avoided:
 *   - No paywalls on safety features (medicine reminders)
 *   - No prompts during user stress
 *   - No dark patterns
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Crown, Zap, Shield, Star } from 'lucide-react'

// Safety features that NEVER get paywalled
const SAFETY_FEATURES = ['medicine_reminders', 'emergency_contacts', 'health_alerts']

/**
 * Hook: Track feature lock encounters
 * After 3rd lock → show upgrade prompt
 */
export function useUpgradeTrigger() {
  const [lockCount, setLockCount] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [triggerContext, setTriggerContext] = useState(null)

  const onFeatureLocked = (feature, context) => {
    // Never paywall safety features
    if (SAFETY_FEATURES.includes(feature)) return

    const newCount = lockCount + 1
    setLockCount(newCount)

    if (newCount >= 3) {
      setTriggerContext(context || feature)
      setShowUpgrade(true)
    }
  }

  const onGoalMilestone = (goalName, percent) => {
    if (percent >= 25 && percent <= 50) {
      setTriggerContext(`milestone:${goalName}`)
      setShowUpgrade(true)
    }
  }

  const onMonthlyReport = (savedAmount) => {
    if (savedAmount > 0) {
      setTriggerContext(`report:${savedAmount}`)
      setShowUpgrade(true)
    }
  }

  const dismiss = () => {
    setShowUpgrade(false)
    setTriggerContext(null)
  }

  return { showUpgrade, triggerContext, onFeatureLocked, onGoalMilestone, onMonthlyReport, dismiss }
}


/**
 * Smart Upgrade Sheet — slides up from bottom
 * Shows personalized value based on trigger context
 */
export default function PremiumTrigger({ context, savedAmount = 8200, onClose }) {
  const nav = useNavigate()
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => onClose?.(), 300)
  }

  // Personalized headline based on trigger
  let headline = 'Unlock the full power of Viya'
  let subtext = 'Premium members save 3x more on average'

  if (context?.startsWith('milestone:')) {
    const goal = context.replace('milestone:', '')
    headline = `You're crushing "${goal}"! 🔥`
    subtext = 'Premium users reach goals 2x faster with AI insights'
  } else if (context?.startsWith('report:')) {
    const amount = context.replace('report:', '')
    headline = `Viya saved you ₹${Number(amount).toLocaleString('en-IN')} this month!`
    subtext = 'Imagine what Premium could do — unlock unlimited AI & reports'
  } else if (context === 'email_bill') {
    headline = 'Viya found a bill in your email 📧'
    subtext = 'Premium auto-tracks all bills, investments, and deliveries'
  }

  const benefits = [
    { icon: <Zap size={16} />, text: 'Unlimited AI conversations', color: 'var(--primary)' },
    { icon: <Shield size={16} />, text: 'Full email intelligence', color: 'var(--cyan)' },
    { icon: <Star size={16} />, text: 'Investment AI & tax planning', color: 'var(--gold)' },
    { icon: <Crown size={16} />, text: 'Family mode (up to 4 members)', color: 'var(--violet)' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 500, animation: closing ? 'fadeOut 0.3s ease' : 'fadeIn 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 501,
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        padding: '24px 20px 36px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        animation: closing ? 'slideDown 0.3s ease' : 'slideUp 0.3s ease',
      }}>
        {/* Handle + Close */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 40, height: 4, borderRadius: 99, background: 'var(--surface3)',
          }} />
        </div>
        <button onClick={handleClose} style={{
          position: 'absolute', top: 16, right: 16, width: 32, height: 32,
          borderRadius: '50%', background: 'var(--surface2)', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} />
        </button>

        {/* Crown badge */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16',
          background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
        }}>
          <Crown size={28} color="white" />
        </div>

        {/* Headline */}
        <h3 style={{
          textAlign: 'center', fontSize: 20, fontWeight: 800,
          letterSpacing: '-0.5px', marginBottom: 6,
        }}>
          {headline}
        </h3>
        <p style={{
          textAlign: 'center', fontSize: 13, color: 'var(--text2)',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {subtext}
        </p>

        {/* Benefits */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          marginBottom: 20,
        }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--surface2)', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ color: b.color }}>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{
          textAlign: 'center', marginBottom: 16,
          padding: '12px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,215,0,0.08))',
          border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>START WITH</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
            14-day FREE trial • Then ₹149/month
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => { handleClose(); nav('/premium') }}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
            color: '#1a1a2e', border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px',
            boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
            minHeight: 56,
          }}
        >
          Start Free Trial →
        </button>

        <p style={{
          textAlign: 'center', fontSize: 11, color: 'var(--text3)',
          marginTop: 10,
        }}>
          Cancel anytime • No questions asked
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to { transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(0); }
          to { transform: translateX(-50%) translateY(100%); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </>
  )
}
