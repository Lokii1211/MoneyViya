// APPENDIX QA — Reusable Skeleton & Error State Components
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Skeleton Loading — shimmer placeholders
 * Usage: <Skeleton type="card" /> or <Skeleton type="list" rows={5} />
 */
export function Skeleton({ type = 'card', rows = 3 }) {
  if (type === 'card') {
    return <div className="skeleton skeleton-card" />
  }

  if (type === 'hero') {
    return (
      <div style={{ padding: 20 }}>
        <div className="skeleton skeleton-text xl" />
        <div className="skeleton skeleton-text lg" />
        <div className="skeleton skeleton-text sm" />
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton-circle" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-text lg" />
              <div className="skeleton skeleton-text sm" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />
        ))}
      </div>
    )
  }

  // Default: text block
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-text ${i === rows - 1 ? 'sm' : ''}`} />
      ))}
    </div>
  )
}

/**
 * Page-level loading skeleton
 * Usage: <PageSkeleton /> — renders full page skeleton
 */
export function PageSkeleton() {
  return (
    <div className="page" style={{ opacity: 0.7 }}>
      <Skeleton type="hero" />
      <Skeleton type="grid" />
      <div style={{ marginTop: 16 }}>
        <Skeleton type="list" rows={4} />
      </div>
    </div>
  )
}

/**
 * Error State — friendly error display with retry
 * Usage: <ErrorState message="Something went wrong" onRetry={() => reload()} />
 */
export function ErrorState({ title = 'Something went wrong', message = 'Please try again or check your connection.', onRetry, emoji = '😕' }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <AlertTriangle size={28} />
      </div>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      <div className="error-state-title">{title}</div>
      <div className="error-state-msg">{message}</div>
      {onRetry && (
        <button className="error-state-btn" onClick={onRetry}>
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Try Again
        </button>
      )}
    </div>
  )
}

/**
 * Empty State — premium empty view
 * Usage: <EmptyState emoji="📝" title="No entries" message="Start tracking!" />
 */
export function EmptyState({ emoji = '📭', title = 'Nothing here yet', message = 'Start adding items to see them here.', action, actionLabel }) {
  return (
    <div className="empty-state-premium">
      <div className="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <button className="error-state-btn" onClick={action}>
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}
