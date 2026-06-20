import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'
import { formatINR, getCategoryIcon, timeAgo } from '../lib/utils'

const STORAGE_KEY = 'mv_recent_searches'
const MAX_RECENT = 5

const QUICK_ACTIONS = [
  { emoji: '💸', label: 'Expenses', path: '/expenses' },
  { emoji: '📊', label: 'Budget', path: '/report' },
  { emoji: '🎯', label: 'Goals', path: '/goals' },
  { emoji: '🔥', label: 'Habits', path: '/habits' },
  { emoji: '📄', label: 'Bills', path: '/bills' },
  { emoji: '💚', label: 'Health', path: '/health' },
  { emoji: '💬', label: 'Chat', path: '/chat' },
  { emoji: '⚙️', label: 'Settings', path: '/profile' },
]

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').slice(0, MAX_RECENT)
  } catch { return [] }
}

function saveRecentSearch(q) {
  const trimmed = q.trim()
  if (!trimmed) return
  const recent = getRecentSearches().filter(s => s !== trimmed)
  recent.unshift(trimmed)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function removeRecentSearch(q) {
  const recent = getRecentSearches().filter(s => s !== q)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
}

export default function Search() {
  const { phone } = useApp()
  const nav = useNavigate()
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ transactions: [], goals: [], habits: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)

  const totalResults = results.transactions.length + results.goals.length + results.habits.length

  const doSearch = useCallback(async (q) => {
    const term = q.trim().toLowerCase()
    if (!term || !phone) {
      setResults({ transactions: [], goals: [], habits: [] })
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const [txns, goals, habits] = await Promise.all([
        api.getTransactions(phone, 50),
        api.getGoals(phone),
        api.getHabits(phone),
      ])

      const filteredTxns = (txns || []).filter(t =>
        (t.description || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term) ||
        (t.type || '').toLowerCase().includes(term)
      ).slice(0, 8)

      const filteredGoals = (goals || []).filter(g =>
        (g.name || '').toLowerCase().includes(term)
      ).slice(0, 5)

      const filteredHabits = (habits || []).filter(h =>
        (h.name || '').toLowerCase().includes(term)
      ).slice(0, 5)

      setResults({
        transactions: filteredTxns,
        goals: filteredGoals,
        habits: filteredHabits,
      })

      saveRecentSearch(q.trim())
      setRecentSearches(getRecentSearches())
    } catch (err) {
      console.error('Search error:', err)
    }
    setLoading(false)
  }, [phone])

  const handleQueryChange = (val) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setResults({ transactions: [], goals: [], habits: [] })
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  const handleRecentClick = (term) => {
    setQuery(term)
    doSearch(term)
  }

  const clearQuery = () => {
    setQuery('')
    setResults({ transactions: [], goals: [], habits: [] })
    setSearched(false)
    inputRef.current?.focus()
  }

  const removeRecent = (e, term) => {
    e.stopPropagation()
    removeRecentSearch(term)
    setRecentSearches(getRecentSearches())
  }

  useEffect(() => {
    inputRef.current?.focus()
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const showEmpty = query.trim() === ''
  const showNoResults = searched && !loading && totalResults === 0

  return (
    <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
      {/* Search Bar */}
      <div className="search-bar" style={{ position: 'relative', marginBottom: 20 }}>
        <SearchIcon size={18} className="search-icon" style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)', pointerEvents: 'none',
        }} />
        <input
          ref={inputRef}
          className="search-input input"
          style={{ paddingLeft: 44, paddingRight: query ? 40 : 16, borderRadius: 'var(--radius-full)' }}
          placeholder="Search transactions, goals, habits..."
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          autoFocus
        />
        {query && (
          <button onClick={clearQuery} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-tertiary)',
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {!loading && searched && totalResults > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Transactions */}
            {results.transactions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="title-m" style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  Transactions ({results.transactions.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.transactions.map((t, i) => (
                    <motion.div
                      key={t.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => nav('/expenses')}
                      className="card"
                      style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <span style={{ fontSize: 22 }}>{getCategoryIcon(t.category)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description || t.category || 'Transaction'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {t.category} {t.created_at ? `· ${timeAgo(t.created_at)}` : ''}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: t.type === 'income' ? 'var(--viya-success)' : 'var(--text-primary)',
                      }}>
                        {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {results.goals.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="title-m" style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  Goals ({results.goals.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.goals.map((g, i) => {
                    const pct = g.target_amount ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0
                    return (
                      <motion.div
                        key={g.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => nav('/goals')}
                        className="card"
                        style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <span style={{ fontSize: 22 }}>{g.icon || '🎯'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {formatINR(g.current_amount)} / {formatINR(g.target_amount)} ({pct}%)
                          </div>
                        </div>
                        <ArrowRight size={16} color="var(--text-tertiary)" />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Habits */}
            {results.habits.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="title-m" style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  Habits ({results.habits.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.habits.map((h, i) => (
                    <motion.div
                      key={h.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => nav('/habits')}
                      className="card"
                      style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <span style={{ fontSize: 22 }}>{h.icon || '✅'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Streak: {h.current_streak || 0} days
                        </div>
                      </div>
                      <ArrowRight size={16} color="var(--text-tertiary)" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* No Results */}
        {showNoResults && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No results found</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Try searching for a category, expense name, or habit
            </div>
          </motion.div>
        )}

        {/* Empty State: Recent Searches + Quick Actions */}
        {showEmpty && !loading && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="search-recent" style={{ marginBottom: 24 }}>
                <div className="title-m" style={{ marginBottom: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Recent Searches
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      className="search-chip"
                      onClick={() => handleRecentClick(term)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <Clock size={12} />
                      {term}
                      <span
                        onClick={(e) => removeRecent(e, term)}
                        style={{ marginLeft: 2, opacity: 0.5, display: 'flex' }}
                      >
                        <X size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="search-grid" style={{ marginBottom: 24 }}>
              <div className="title-m" style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Quick Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => nav(action.path)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '16px 4px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{action.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
