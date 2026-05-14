/**
 * EmptyState — PRD Section 3.7 Flow 5
 * "Never just blank" — every empty screen has a clear CTA
 *
 * Variants:
 *   transactions: "Log your first expense — tap the + button above"
 *   goals: "What are you saving for? [Create first goal →]"
 *   emails: "Connect Gmail to see email intelligence [Connect →]"
 *   health: "Track your health starting today [Log now →]"
 *   chat: "Say hi to Viya — your personal AI assistant"
 *   reminders: "Never miss a thing — create your first reminder"
 *   generic: Custom title + subtitle + CTA
 */
import { useNavigate } from 'react-router-dom'

const VARIANTS = {
  transactions: {
    emoji: '💸',
    title: 'No expenses yet',
    subtitle: 'Log your first expense — tap the + button above',
    cta: 'Add Expense',
    link: '/expenses',
    color: 'var(--primary)',
  },
  goals: {
    emoji: '🎯',
    title: 'What are you saving for?',
    subtitle: 'Set a goal and watch your progress grow every day',
    cta: 'Create First Goal →',
    link: '/goals',
    color: 'var(--gold)',
  },
  emails: {
    emoji: '📧',
    title: 'Email Intelligence awaits',
    subtitle: 'Connect Gmail to see bills, meetings, and deliveries — automatically',
    cta: 'Connect Gmail →',
    link: '/email',
    color: 'var(--cyan)',
  },
  health: {
    emoji: '🏃',
    title: 'Start your health journey',
    subtitle: 'Track your health starting today — steps, sleep, meals, and more',
    cta: 'Log Now →',
    link: '/health',
    color: 'var(--rose)',
  },
  chat: {
    emoji: '💬',
    title: 'Say hi to Viya!',
    subtitle: 'Your personal AI assistant is ready to help with finances, health, and life',
    cta: 'Start Chatting →',
    link: '/chat',
    color: 'var(--primary)',
  },
  reminders: {
    emoji: '⏰',
    title: 'Never miss a thing',
    subtitle: 'Create your first reminder — Viya will nudge you via WhatsApp',
    cta: 'Set Reminder →',
    link: '/reminders',
    color: 'var(--orange)',
  },
  bills: {
    emoji: '📋',
    title: 'No bills tracked',
    subtitle: 'Add your recurring bills and never miss a payment again',
    cta: 'Add Bill →',
    link: '/bills',
    color: 'var(--red)',
  },
  investments: {
    emoji: '📈',
    title: 'Portfolio is empty',
    subtitle: 'Track your mutual funds, stocks, and FDs in one place',
    cta: 'Add Investment →',
    link: '/wealth',
    color: 'var(--violet)',
  },
}

export default function EmptyState({ variant = 'generic', title, subtitle, cta, link, onAction, color }) {
  const nav = useNavigate()
  const config = VARIANTS[variant] || {}

  const finalTitle = title || config.title || 'Nothing here yet'
  const finalSubtitle = subtitle || config.subtitle || 'Get started by adding your first item'
  const finalCta = cta || config.cta || 'Get Started'
  const finalLink = link || config.link
  const finalColor = color || config.color || 'var(--primary)'
  const emoji = config.emoji || '✨'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Animated emoji */}
      <div style={{
        fontSize: 56, marginBottom: 16,
        animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {emoji}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 18, fontWeight: 800, marginBottom: 8,
        letterSpacing: '-0.3px',
      }}>
        {finalTitle}
      </h3>

      {/* Subtitle */}
      <p style={{
        fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
        maxWidth: 280, marginBottom: 24,
      }}>
        {finalSubtitle}
      </p>

      {/* CTA Button */}
      <button
        onClick={() => onAction ? onAction() : finalLink && nav(finalLink)}
        style={{
          padding: '12px 28px', borderRadius: 99,
          background: `linear-gradient(135deg, ${finalColor}, ${finalColor}dd)`,
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px',
          boxShadow: `0 4px 16px ${finalColor}33`,
          transition: 'all 0.2s ease',
          minHeight: 48,
        }}
      >
        {finalCta}
      </button>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
