import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, TrendingUp, Clock, ArrowRight } from 'lucide-react'

const QUICK_LINKS = [
  { emoji: '💰', label: 'Add Expense', path: '/expenses' },
  { emoji: '🎯', label: 'My Goals', path: '/goals' },
  { emoji: '🔥', label: 'Habits', path: '/habits' },
  { emoji: '📊', label: 'Reports', path: '/report' },
  { emoji: '💬', label: 'Chat with Viya', path: '/chat' },
  { emoji: '👨‍👩‍👧', label: 'Family', path: '/family' },
  { emoji: '🔔', label: 'Reminders', path: '/reminders' },
  { emoji: '⚙️', label: 'Settings', path: '/profile' },
]

const TRENDING = [
  'How to save ₹1 lakh in 6 months?',
  'Best SIP mutual funds 2026',
  'Tax saving tips for salaried',
  'Budget plan for students',
  'Side income ideas India',
]

export default function Search() {
  const [query, setQuery] = useState('')
  const nav = useNavigate()

  const filtered = query.trim()
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_LINKS

  const handleSearch = (q) => {
    nav('/chat?q=' + encodeURIComponent(q || query))
  }

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          className="input"
          style={{ paddingLeft: 44, borderRadius: 'var(--radius-full)' }}
          placeholder="Search pages, ask Viya..."
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && query.trim() && handleSearch()}
          autoFocus
        />
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 24 }}>
        <div className="title-m" style={{ marginBottom: 12, fontSize: 15 }}>Quick Access</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {filtered.map((l, i) => (
            <button key={i} onClick={() => nav(l.path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 4px', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 24 }}>{l.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <TrendingUp size={16} color="var(--viya-primary-500)" />
          <span className="title-m" style={{ fontSize: 15 }}>Trending Questions</span>
        </div>
        {TRENDING.map((t, i) => (
          <button key={i} onClick={() => handleSearch(t)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 0', borderBottom: '1px solid var(--border-light)',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <Clock size={14} color="var(--text-tertiary)" />
            <span className="body-s" style={{ flex: 1 }}>{t}</span>
            <ArrowRight size={14} color="var(--text-tertiary)" />
          </button>
        ))}
      </div>
    </div>
  )
}
