// SwipeCard — swipe-to-delete/edit gesture card
import { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'
import { Trash2, Edit3 } from 'lucide-react'

export default function SwipeCard({ children, onDelete, onEdit, style = {} }) {
  const haptics = useHaptics()
  const x = useMotionValue(0)
  const [swiped, setSwiped] = useState(null)

  const deleteOpacity = useTransform(x, [-120, -60, 0], [1, 0.5, 0])
  const editOpacity = useTransform(x, [0, 60, 120], [0, 0.5, 1])
  const deleteBg = useTransform(x, [-120, -60, 0], ['rgba(255,59,48,0.2)', 'rgba(255,59,48,0.1)', 'transparent'])
  const editBg = useTransform(x, [0, 60, 120], ['transparent', 'rgba(0,176,182,0.1)', 'rgba(0,176,182,0.2)'])

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -100) {
      haptics.heavy()
      setSwiped('delete')
      setTimeout(() => onDelete?.(), 200)
    } else if (info.offset.x > 100) {
      haptics.medium()
      onEdit?.()
    }
  }

  return (
    <AnimatePresence>
      {swiped !== 'delete' && (
        <motion.div
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: 8 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0, transition: { duration: 0.3 } }}
        >
          {/* Delete bg */}
          <motion.div style={{
            position: 'absolute', inset: 0, background: deleteBg,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px',
          }}>
            <motion.div style={{ opacity: deleteOpacity, color: 'var(--viya-error)' }}>
              <Trash2 size={20} />
            </motion.div>
          </motion.div>

          {/* Edit bg */}
          <motion.div style={{
            position: 'absolute', inset: 0, background: editBg,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 20px',
          }}>
            <motion.div style={{ opacity: editOpacity, color: 'var(--viya-primary-500)' }}>
              <Edit3 size={20} />
            </motion.div>
          </motion.div>

          {/* Card content */}
          <motion.div
            style={{ x, background: 'var(--bg-card)', position: 'relative', zIndex: 1, ...style }}
            drag="x"
            dragConstraints={{ left: -120, right: 120 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
