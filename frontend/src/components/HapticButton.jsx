// HapticButton — button with native haptic feedback + press animation
import { motion } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'

export default function HapticButton({
  children, onClick, hapticType = 'light',
  variant = 'primary', size = 'md', fullWidth = false,
  disabled = false, style = {}, className = '', ...props
}) {
  const haptics = useHaptics()

  const baseStyles = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontWeight: 700, fontFamily: "'Inter', sans-serif",
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--radius-full)',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  const variants = {
    primary: { background: 'var(--gradient-primary)', color: 'white', boxShadow: 'var(--shadow-teal)' },
    secondary: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
    danger: { background: 'var(--viya-error)', color: 'white', boxShadow: '0 4px 16px rgba(255,59,48,0.3)' },
    success: { background: 'var(--viya-success)', color: 'white' },
  }

  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 24px', fontSize: 15 },
    lg: { padding: '16px 32px', fontSize: 17 },
  }

  const handleClick = (e) => {
    if (disabled) return
    haptics[hapticType]?.()
    onClick?.(e)
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{ ...baseStyles, ...variants[variant], ...sizes[size], ...style }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
