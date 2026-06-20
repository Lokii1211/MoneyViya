import { useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * SL-001 — Splash Screen
 * Background: var(--bg) which is #050508 in dark mode (matches Capacitor splash config)
 * Center: Viya logo with fade-in + breathing/pulsing animation
 * "Viya" text with gradient
 * "AI Life & Wealth Partner" subtitle
 * Auto-dismisses after 2 seconds via onComplete prop
 * Uses CSS classes + framer-motion, NO inline colors
 */
export default function Splash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="splash-screen">
      {/* Logo with fade-in + breathing animation */}
      <motion.div
        className="splash-logo-wrap"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src="/logo.png"
          alt="Viya"
          className="splash-logo"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* "Viya" text with gradient */}
      <motion.h1
        className="splash-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        Viya
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="splash-subtitle"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        AI Life & Wealth Partner
      </motion.p>

      {/* Fade-out before dismissal */}
      <motion.div
        className="splash-fade-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 1.6 }}
      />
    </div>
  )
}
