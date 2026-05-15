// Journal — Daily reflection + AI mood analysis
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { BookOpen, Plus, Smile, Frown, Meh, Heart, Zap } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#4CAF50', icon: Smile },
  { emoji: '😌', label: 'Calm', color: '#2196F3', icon: Heart },
  { emoji: '😐', label: 'Neutral', color: '#FF9800', icon: Meh },
  { emoji: '😔', label: 'Sad', color: '#9E9E9E', icon: Frown },
  { emoji: '⚡', label: 'Energetic', color: '#FF5722', icon: Zap },
]

const MOCK_ENTRIES = [
  { id: 1, date: '2026-05-10', mood: '😊', entry: 'Had a great morning workout. Feeling productive and focused. Completed 3 tasks before lunch.', tags: ['productive', 'exercise'], aiInsight: 'Your mood improves 40% on days you exercise before 9 AM.' },
  { id: 2, date: '2026-05-09', mood: '😐', entry: 'Normal day at work. Nothing special happened. Need to plan the weekend better.', tags: ['work', 'routine'], aiInsight: 'Consider adding a midday break — users with breaks report 25% better mood.' },
  { id: 3, date: '2026-05-08', mood: '😊', entry: 'Met old friends after long time. Amazing dinner together. Feeling grateful.', tags: ['friends', 'social'], aiInsight: 'Social connections boost your happiness. You feel best after meeting friends.' },
]

export default function Journal() {
  const [entries, setEntries] = useState(MOCK_ENTRIES)
  const [showNew, setShowNew] = useState(false)
  const [newEntry, setNewEntry] = useState('')
  const [selectedMood, setSelectedMood] = useState(null)
  const toast = useToast()

  const handleSave = () => {
    if (!newEntry.trim() || !selectedMood) return
    const entry = {
      id: Date.now(), date: new Date().toISOString().split('T')[0],
      mood: selectedMood, entry: newEntry, tags: [], aiInsight: 'Analyzing your entry...',
    }
    setEntries(prev => [entry, ...prev])
    setNewEntry(''); setSelectedMood(null); setShowNew(false)
    toast.show('Journal entry saved ✨', 'success')
  }

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Journal</h1>
            <p className="body-s text-secondary">Daily reflections & AI insights 📓</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Write
          </HapticButton>
        </div>

        {/* Mood Streak */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>This Week's Moods</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{day}</div>
                <div style={{ fontSize: 22 }}>{i < entries.length ? entries[i]?.mood || '·' : '·'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((entry, i) => (
            <motion.div key={entry.id} variants={listItem} initial="initial" animate="animate"
              className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{entry.mood}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{entry.entry}</p>
              {entry.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>#{tag}</span>
                  ))}
                </div>
              )}
              {entry.aiInsight && (
                <div style={{ fontSize: 12, color:'var(--viya-primary-700)', background: 'var(--viya-primary-500)08', padding: '8px 12px', borderRadius: 10, borderLeft: '3px solid var(--viya-primary-500)' }}>
                  🧠 {entry.aiInsight}
                </div>
              )}
            </motion.div>
          ))}
        </div>

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
            <HapticButton fullWidth onClick={handleSave} disabled={!newEntry.trim() || !selectedMood}>
              Save Entry ✨
            </HapticButton>
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
