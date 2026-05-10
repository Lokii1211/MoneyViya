// PageTransition — wraps route content with Framer Motion AnimatePresence
import { motion } from 'framer-motion'
import { fadeUp } from '../animations/pageVariants'

export default function PageTransition({ children, variant = fadeUp, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variant}
      className={className}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}
