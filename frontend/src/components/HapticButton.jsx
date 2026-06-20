import { motion } from 'framer-motion'
import { haptic } from '../lib/utils'

export default function HapticButton({ children, onClick, size, variant, className, style, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`btn-primary${className ? ' ' + className : ''}`}
      style={{ padding: size === 'sm' ? '8px 16px' : '14px 20px', fontSize: size === 'sm' ? 13 : 15, minHeight: size === 'sm' ? 36 : 48, ...style }}
      onClick={(e) => { haptic(); onClick?.(e) }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
