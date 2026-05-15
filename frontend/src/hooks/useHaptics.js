// Haptic feedback hook — uses Capacitor Haptics on native, noop on web
import { useCallback } from 'react'

let Haptics = null
try {
  import('@capacitor/haptics').then(m => { Haptics = m.Haptics })
} catch (e) { /* web fallback */ }

export function useHaptics() {
  const light = useCallback(() => {
    try { Haptics?.impact({ style: 'light' }) } catch {}
  }, [])

  const medium = useCallback(() => {
    try { Haptics?.impact({ style: 'medium' }) } catch {}
  }, [])

  const heavy = useCallback(() => {
    try { Haptics?.impact({ style: 'heavy' }) } catch {}
  }, [])

  const success = useCallback(() => {
    try { Haptics?.notification({ type: 'success' }) } catch {}
  }, [])

  const error = useCallback(() => {
    try { Haptics?.notification({ type: 'error' }) } catch {}
  }, [])

  const warning = useCallback(() => {
    try { Haptics?.notification({ type: 'warning' }) } catch {}
  }, [])

  const selection = useCallback(() => {
    try { Haptics?.selectionChanged() } catch {}
  }, [])

  return { light, medium, heavy, success, warning, error, selection }
}

export default useHaptics
