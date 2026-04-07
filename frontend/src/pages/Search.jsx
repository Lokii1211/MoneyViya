import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, TrendingUp, Clock, ArrowRight } from 'lucide-react'

const SUGGESTIONS = [
  { q: 'My balance', icon: '💰' },
  { q: 'Weekly review', icon: '📊' },
  { q: 'Tax saving tips', icon: '🏛️' },
  { q: 'Passive income ideas', icon: '💡' },
  { q: 'How to invest in mutual funds', icon: '📈' },
  { q: 'Cut my expenses', icon: '✂️' },
  { q: 'Emergency fund plan', icon: '🛡️' },
  { q: 'Best credit cards', icon: '💳' },
]

const RECENT = ['spent 200 on food', 'my goals', 'weekly review']

export default function Search() {
  const [query, setQuery] = useState('')
  const nav = useNavigate()

  function go(q) { nav('/chat?q=' + encodeURIComponent(q)) }

  const filtered = query ? SUGGESTIONS.filter(s => s.q.toLowerCase().includes(query.toLowerCase())) : SUGGESTIONS

  return (
    <div className="page">
      <div className="search-bar">
        <SearchIcon size={18} className="search-icon" />
        <input type="text" placeholder="Search or ask Viya..." value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && query && go(query)} className="search-input" autoFocus />
      </div>

      {!query && RECENT.length > 0 && (
        <section className="section">
          <div className="section-head"><h3>Recent</h3></div>
          {RECENT.map((r, i) => (
            <button key={i} className="search-recent" onClick={() => go(r)}>
              <Clock size={14} /> <span>{r}</span> <ArrowRight size={14} />
            </button>
          ))}
        </section>
      )}

      <section className="section">
        <div className="section-head"><h3>{query ? 'Results' : 'Popular'}</h3></div>
        <div className="search-grid">
          {filtered.map((s, i) => (
            <button key={i} className="search-chip" onClick={() => go(s.q)}>
              <span className="sc-emoji">{s.icon}</span>
              <span className="sc-text">{s.q}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
