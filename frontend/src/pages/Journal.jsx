// Journal — Daily reflection + AI mood analysis
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { BookOpen, Plus, Smile, Frown, Meh, Heart, Zap, Loader } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#4CAF50', icon: Smile },
  { emoji: '😌', label: 'Calm', color: '#2196F3', icon: Heart },
  { emoji: '😐', label: 'Neutral', color: '#FF9800', icon: Meh },
  { emoji: '😔', label: 'Sad', color: '#9E9E9E', icon: Frown },
  { emoji: '⚡', label: 'Energetic', color: '#FF5722', icon: Zap },
]

export default function Journal() {
  const { phone } = useApp()
  const toast = useToast()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newEntry, setNewEntry] = useState('')
  const [selectedMood, setSelectedMood] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadEntries()
  }, [phone])

  const loadEntries = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMemories(phone, 'journal')
      setEntries(data || [])
    } catch (e) {
      console.error('Failed to load journal entries:', e)
      setError('Failed to load journal entries')
      toast.show('Could not load journal', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!newEntry.trim() || !selectedMood) return
    setSaving(true)
    try {
      const content = `${selectedMood} ${newEntry}`
      const result = await api.addMemory(phone, content, 'journal', 'personal')
      if (result) {
        setEntries(prev => [result, ...prev])
        setNewEntry('')
        setSelectedMood(null)
        setShowNew(false)
        toast.show('Journal entry saved', 'success')
      } else {
        toast.show('Failed to save entry', 'error')
      }
    } catch (e) {
      console.error('Failed to save journal entry:', e)
      toast.show('Failed to save entry', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Parse mood emoji from content (stored as "emoji text")
  const parseMood = (entry) => {
    const content = entry.content || ''
    const moodMatch = MOODS.find(m => content.startsWith(m.emoji))
    return {
      mood: moodMatch ? moodMatch.emoji : '📝',
      text: moodMatch ? content.slice(moodMatch.emoji.length).trim() : content,
    }
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Journal</h1>
            <p className="body-s text-secondary">Daily reflections & insights</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Write
          </HapticButton>
        </div>

        {/* Mood Streak */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>This Week's Moods</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const parsed = i < entries.length ? parseMood(entries[i]) : null
              return (
                <div key={day} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{day}</div>
                  <div style={{ fontSize: 22 }}>{parsed ? parsed.mood : '·'}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--viya-primary-500)" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--viya-error)', marginBottom: 12 }}>{error}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={loadEntries}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--viya-primary-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <BookOpen size={32} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No journal entries yet</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Start writing to track your mood and thoughts</p>
          </div>
        )}

        {/* Entries */}
        {!loading && !error && entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map((entry, i) => {
              const { mood, text } = parseMood(entry)
              const entryDate = entry.created_at ? new Date(entry.created_at) : new Date()
              return (
                <motion.div key={entry.id || i} variants={listItem} initial="initial" animate="animate"
                  className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{mood}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {entryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{text}</p>
                  {entry.category && entry.category !== 'journal' && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                        #{entry.category}
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* New Entry Sheet */}
        <BottomSheet isOpen={showNew} onClose={() => setShowNew(false)} title="New Journal Entry" height="80vh">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>How are you feeling?</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {MOODS.map(mood => (
                  <motion.button key={mood.emoji} whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedMood(mood.emoji)}
                    style={{
                      width: 56, height: 56, borderRadius: 16, border: selectedMood === mood.emoji ? `2px solid ${mood.color}` : '2px solid var(--border-light)',
                      background: selectedMood === mood.emoji ? mood.color + '18' : 'transparent',
                      fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {mood.emoji}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>What's on your mind?</div>
              <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)}
                placeholder="Write about your day, thoughts, gratitude..."
                style={{
                  width: '100%', minHeight: 150, padding: 14, borderRadius: 14,
                  border: '1.5px solid var(--border-light)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 15, resize: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
            <HapticButton fullWidth onClick={handleSave} disabled={!newEntry.trim() || !selectedMood || saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </HapticButton>
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
