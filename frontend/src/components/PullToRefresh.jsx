// PullToRefresh — elastic pull-down gesture with haptic feedback
import { useState, useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'

const THRESHOLD = 80

export default function PullToRefresh({ onRefresh, children }) {
  const haptics = useHaptics()
  const [refreshing, setRefreshing] = useState(false)
  const pullY = useMotionValue(0)
  const rotate = useTransform(pullY, [0, THRESHOLD], [0, 360])
  const opacity = useTransform(pullY, [0, THRESHOLD / 2, THRESHOLD], [0, 0.5, 1])
  const scale = useTransform(pullY, [0, THRESHOLD], [0.5, 1])
  const touchStart = useRef(0)
  const scrollRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStart.current = e.touches[0].clientY
    } else {
      touchStart.current = 0
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (touchStart.current === 0 || refreshing) return
    const delta = e.touches[0].clientY - touchStart.current
    if (delta > 0) {
      const dampened = Math.min(delta * 0.5, 120)
      pullY.set(dampened)
      if (dampened >= THRESHOLD) haptics.selection()
    }
  }, [refreshing, pullY])

  const handleTouchEnd = useCallback(async () => {
    const val = pullY.get()
    if (val >= THRESHOLD && !refreshing && onRefresh) {
      setRefreshing(true)
      haptics.medium()
      pullY.set(60)
      try { await onRefresh() } catch {}
      setRefreshing(false)
    }
    pullY.set(0)
    touchStart.current = 0
  }, [pullY, refreshing, onRefresh])

  return (
    <div
      ref={scrollRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Spinner */}
      <motion.div style={{
        position: 'absolute', top: -50, left: '50%', marginLeft: -16,
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity, scale, y: pullY,
      }}>
        <motion.div style={{
          width: 24, height: 24, border: '3px solid var(--viya-primary-500)',
          borderTopColor: 'transparent', borderRadius: '50%',
          rotate, ...(refreshing ? { animation: 'spin 0.7s linear infinite' } : {}),
        }} />
      </motion.div>

      {/* Content pushed down by pull */}
      <motion.div style={{ y: useTransform(pullY, v => Math.min(v * 0.3, 40)) }}>
        {children}
      </motion.div>
    </div>
  )
}
