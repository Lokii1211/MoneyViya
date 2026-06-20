// §5.1 — Premium Interaction Hooks
import { useState, useCallback, useRef } from 'react'
import { useHaptics } from './useHaptics'

/**
 * Double-tap to copy amount — §5.1
 * Returns { handleDoubleTap, flashClass }
 */
export function useDoubleTapCopy() {
  const lastTap = useRef(0)
  const [flashClass, setFlashClass] = useState('')
  const haptics = useHaptics()

  const handleDoubleTap = useCallback((text) => {
    const now = Date.now()
    if (now - lastTap.current < 400) {
      // Double tap detected
      navigator.clipboard?.writeText(String(text)).catch(() => {})
      haptics.selection()
      setFlashClass('copy-flash')
      setTimeout(() => setFlashClass(''), 300)

      // Show mini toast
      const toast = document.createElement('div')
      toast.textContent = 'Amount copied'
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:99px;background:rgba(0,0,0,0.8);color:#fff;font-size:12px;font-weight:600;z-index:9999;animation:fadeIn .2s ease'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    }
    lastTap.current = now
  }, [haptics])

  return { handleDoubleTap, flashClass }
}

/**
 * Swipe-to-reveal actions — §5.1
 * Returns touch handlers and transform state
 */
export function useSwipeActions({ onDelete, onEdit, onDone, threshold = 60, fullSwipe = 0.8 }) {
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(0)
  const containerWidth = useRef(0)
  const haptics = useHaptics()
  const triggered = useRef(false)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    containerWidth.current = e.currentTarget.offsetWidth
    triggered.current = false
    setSwiping(true)
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!swiping) return
    const dx = startX.current - e.touches[0].clientX
    if (dx > 0) {
      // Elastic feel: diminish after threshold
      const elastic = dx > threshold ? threshold + (dx - threshold) * 0.4 : dx
      setOffsetX(elastic)

      // Haptic at threshold
      if (dx >= threshold && !triggered.current) {
        haptics.light()
        triggered.current = true
      }
    }
  }, [swiping, threshold, haptics])

  const onTouchEnd = useCallback(() => {
    setSwiping(false)
    const fullWidth = containerWidth.current * fullSwipe

    if (offsetX >= fullWidth && onDelete) {
      haptics.medium()
      onDelete()
    } else {
      // Spring back
      setOffsetX(0)
    }
  }, [offsetX, fullSwipe, onDelete, haptics])

  const reset = useCallback(() => setOffsetX(0), [])

  return {
    offsetX,
    swiping,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    reset,
    revealed: offsetX >= threshold,
  }
}

/**
 * Phone input auto-formatter — §5.1
 * "9876543210" → "98765 43210"
 */
export function formatPhoneDisplay(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 5) return digits
  return digits.slice(0, 5) + ' ' + digits.slice(5)
}

/**
 * Amount input auto-formatter — §5.1
 * "150000" → "₹1,50,000"
 */
export function formatAmountLive(raw) {
  const digits = raw.replace(/[^\d-]/g, '')
  if (!digits || digits === '-') return digits
  const isNeg = digits.startsWith('-')
  const abs = isNeg ? digits.slice(1) : digits
  // Indian number formatting
  const num = parseInt(abs, 10)
  if (isNaN(num)) return ''
  const formatted = num.toLocaleString('en-IN')
  return (isNeg ? '−₹' : '₹') + formatted
}
