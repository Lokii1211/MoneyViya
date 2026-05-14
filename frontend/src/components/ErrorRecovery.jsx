/**
 * ErrorRecovery — PRD Section 3.7 Flow 5
 * "90% of failed actions offer a clear next step"
 *
 * Types:
 *   network: "Couldn't save — will retry automatically"
 *   payment: "Payment didn't go through — no charge was made"
 *   ai_timeout: "Viya is taking too long. [Show simplified response]"
 *   generic: Custom error with retry
 *
 * Features:
 *   - Optimistic UI: Shows "Saving..." during action
 *   - Auto-retry: 3 attempts with exponential backoff
 *   - Clear CTAs: [Retry] [Try Different] [Cancel]
 */
import { useState, useEffect, useCallback } from 'react'
import { WifiOff, RefreshCw, CreditCard, AlertCircle, Clock } from 'lucide-react'

// Retry delays: 1s, 3s, 8s (exponential backoff)
const RETRY_DELAYS = [1000, 3000, 8000]

export function useRetry(asyncFn, { maxRetries = 3, onSuccess, onFinalFail } = {}) {
  const [status, setStatus] = useState('idle') // idle | loading | retrying | success | failed
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus('loading')
    setAttempt(0)
    setError(null)

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await asyncFn(...args)
        setStatus('success')
        onSuccess?.(result)
        return result
      } catch (err) {
        setAttempt(i + 1)
        setError(err.message || 'Something went wrong')

        if (i < maxRetries - 1) {
          setStatus('retrying')
          await new Promise(r => setTimeout(r, RETRY_DELAYS[i] || 8000))
        } else {
          setStatus('failed')
          onFinalFail?.(err)
        }
      }
    }
  }, [asyncFn, maxRetries, onSuccess, onFinalFail])

  return { execute, status, attempt, error, retry: execute }
}


export default function ErrorRecovery({
  type = 'network',
  error,
  onRetry,
  onAlternative,
  onCancel,
  alternativeLabel,
}) {
  const configs = {
    network: {
      icon: <WifiOff size={20} />,
      title: "Couldn't save your changes",
      subtitle: 'Will retry automatically when connection improves',
      retryLabel: 'Tap to Retry',
      color: 'var(--orange)',
      colorDim: 'rgba(249,115,22,0.08)',
    },
    payment: {
      icon: <CreditCard size={20} />,
      title: "Payment didn't go through",
      subtitle: error || 'No charge was made to your account',
      retryLabel: 'Try Again',
      color: 'var(--red)',
      colorDim: 'rgba(239,68,68,0.06)',
    },
    ai_timeout: {
      icon: <Clock size={20} />,
      title: 'Viya is taking too long',
      subtitle: 'The AI is busy right now',
      retryLabel: 'Try Again',
      color: 'var(--violet)',
      colorDim: 'rgba(124,58,237,0.08)',
    },
    generic: {
      icon: <AlertCircle size={20} />,
      title: 'Something went wrong',
      subtitle: error || 'Please try again',
      retryLabel: 'Retry',
      color: 'var(--red)',
      colorDim: 'rgba(239,68,68,0.06)',
    },
  }

  const config = configs[type] || configs.generic

  return (
    <div style={{
      background: config.colorDim, borderRadius: 16, padding: 20,
      border: `1px solid ${config.color}22`, margin: '12px 0',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ color: config.color }}>{config.icon}</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{config.title}</div>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 16 }}>
        {config.subtitle}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onRetry && (
          <button onClick={onRetry} style={{
            padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
            background: config.color, color: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, minHeight: 44,
          }}>
            <RefreshCw size={14} />
            {config.retryLabel}
          </button>
        )}

        {onAlternative && (
          <button onClick={onAlternative} style={{
            padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
            background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
            cursor: 'pointer', minHeight: 44,
          }}>
            {alternativeLabel || 'Try Different Method'}
          </button>
        )}

        {onCancel && (
          <button onClick={onCancel} style={{
            padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
            background: 'transparent', color: 'var(--text3)', border: 'none',
            cursor: 'pointer', minHeight: 44,
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}


/**
 * AI Timeout Handler — PRD Flow 5: AI API TIMEOUT
 * Shows progressive loading states at 0s, 5s, 10s
 */
export function AIThinkingIndicator({ onTimeout, onSimplified }) {
  const [stage, setStage] = useState(0) // 0: thinking, 1: slow, 2: too long

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 5000)
    const t2 = setTimeout(() => {
      setStage(2)
      onTimeout?.()
    }, 10000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onTimeout])

  const messages = [
    'Viya is thinking...',
    'Taking a bit longer than usual...',
    'Viya is taking too long.',
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 16,
      background: 'var(--surface2)',
      animation: 'fadeIn 0.3s ease',
    }}>
      {stage < 2 ? (
        <>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--primary)',
            animation: 'pulse 1s infinite',
          }} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{messages[stage]}</span>
        </>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
            {messages[2]}
          </div>
          {onSimplified && (
            <button onClick={onSimplified} style={{
              padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: 'var(--primary)', color: 'white', border: 'none',
              cursor: 'pointer', minHeight: 44,
            }}>
              Show Simplified Response
            </button>
          )}
        </div>
      )}
    </div>
  )
}
