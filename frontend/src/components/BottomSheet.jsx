// BottomSheet — native-feel drag-to-dismiss bottom sheet
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'

export default function BottomSheet({ isOpen, onClose, title, children, height = '70vh' }) {
  const haptics = useHaptics()
  const sheetRef = useRef(null)
  const [dragY, setDragY] = useState(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      haptics.light()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleDragEnd = useCallback((e, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      haptics.medium()
      onClose()
    }
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)', zIndex: 200,
            }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: height, zIndex: 201,
              background: 'var(--bg-primary)',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
              touchAction: 'none',
            }}
          >
            {/* Drag Handle */}
            <div style={{
              display: 'flex', justifyContent: 'center', padding: '12px 0 8px',
              cursor: 'grab',
            }}>
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'var(--text-tertiary)', opacity: 0.4,
              }} />
            </div>

            {/* Title */}
            {title && (
              <div style={{
                padding: '0 20px 12px', fontSize: 18, fontWeight: 700,
                fontFamily: "'Sora', sans-serif", borderBottom: '1px solid var(--border-light)',
              }}>
                {title}
              </div>
            )}

            {/* Content */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
