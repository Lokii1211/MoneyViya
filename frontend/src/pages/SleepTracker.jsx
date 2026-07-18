// SleepTracker — Sleep tracking with quality score
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, TrendingUp, Clock, Loader, ArrowLeft } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { listItem } from '../animations/pageVariants'
import { useToast } from '../components/Toast'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

function QualityBadge({ score }) {
  const s = Number(score) || 0
  const color = s >= 80 ? '#4CAF50' : s >= 60 ? '#FF9800' : '#F44336'
  const label = s >= 80 ? 'Great' : s >= 60 ? 'OK' : 'Poor'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '3px 8px', borderRadius: 8 }}>
      {label} {s}%
    </span>
  )
}

const QUALITY_OPTIONS = [
  { value: 90, label: 'Excellent', emoji: '😴' },
  { value: 75, label: 'Good', emoji: '😌' },
  { value: 60, label: 'Fair', emoji: '😐' },
  { value: 40, label: 'Poor', emoji: '😫' },
]

export default function SleepTracker() {
  const { phone } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [sleepData, setSleepData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [sleepHours, setSleepHours] = useState('7')
  const [sleepQuality, setSleepQuality] = useState(75)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadSleepData()
  }, [phone])

  const loadSleepData = async () => {
    setLoading(true)
    setError(null)
    try {
      const history = await api.getHealthHistory(phone, 30)
      // Filter to entries that have sleep data
      const sleepLogs = (history || []).filter(h => h.sleep_hours != null && Number(h.sleep_hours) > 0)
      setSleepData(sleepLogs)
    } catch (e) {
      console.error('Failed to load sleep data:', e)
      setError('Failed to load sleep data')
      toast.show('Could not load sleep data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogSleep = async () => {
    const hours = parseFloat(sleepHours)
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast.show('Please enter valid sleep hours', 'warning')
      return
    }
    setSaving(true)
    try {
      const result = await api.upsertHealthLog(phone, {
        sleep_hours: hours,
        sleep_quality: sleepQuality,
      })
      if (result) {
        // Refresh data to show updated entry
        await loadSleepData()
        setShowLog(false)
        setSleepHours('7')
        setSleepQuality(75)
        toast.show('Sleep logged!', 'success')
      } else {
        toast.show('Failed to log sleep', 'error')
      }
    } catch (e) {
      console.error('Failed to log sleep:', e)
      toast.show('Failed to log sleep', 'error')
    } finally {
      setSaving(false)
    }
  }

  const avgHours = sleepData.length > 0
    ? (sleepData.reduce((s, d) => s + (Number(d.sleep_hours) || 0), 0) / sleepData.length).toFixed(1)
    : '0.0'
  const avgQuality = sleepData.length > 0
    ? Math.round(sleepData.reduce((s, d) => s + (Number(d.sleep_quality) || 0), 0) / sleepData.length)
    : 0

  const recentWeek = sleepData.slice(0, 7)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Sleep Tracker</h1>
              <p className="body-s text-secondary">Track your rest, improve your life</p>
            </div>
          </div>
          <HapticButton size="sm" onClick={() => setShowLog(true)}>
            <Moon size={14} /> Log
          </HapticButton>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <Moon size={20} color="var(--viya-primary-500)" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
              {loading ? '...' : `${avgHours}h`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Avg Sleep</div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <TrendingUp size={20} color="var(--viya-success)" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
              {loading ? '...' : `${avgQuality}%`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Avg Quality</div>
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
            <motion.button whileTap={{ scale: 0.95 }} onClick={loadSleepData}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--viya-primary-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Sleep Chart Visual */}
            {recentWeek.length > 0 && (
              <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>This Week</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 100 }}>
                  {recentWeek.slice(0, 7).reverse().map((d, i) => {
                    const hours = Number(d.sleep_hours) || 0
                    const quality = Number(d.sleep_quality) || 0
                    return (
                      <div key={d.log_date || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: (hours / 10) * 80 }}
                          transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                          style={{
                            width: 24, borderRadius: 6,
                            background: quality >= 80 ? 'var(--viya-primary-500)' : quality >= 60 ? 'var(--viya-warning)' : 'var(--viya-error)',
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                          {d.log_date ? new Date(d.log_date).toLocaleDateString('en', { weekday: 'narrow' }) : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sleep Log */}
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Sleep Log</div>

            {sleepData.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <Moon size={32} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No sleep data yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Log your sleep to start tracking</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sleepData.map((d, i) => {
                const hours = Number(d.sleep_hours) || 0
                const quality = Number(d.sleep_quality) || 0
                return (
                  <motion.div key={d.id || i} variants={listItem} initial="initial" animate="animate"
                    className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1a1a3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Moon size={18} color="#7C4DFF" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {d.log_date ? new Date(d.log_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Today'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {hours}h sleep
                      </div>
                    </div>
                    {quality > 0 && <QualityBadge score={quality} />}
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* Log Sleep Sheet */}
        <BottomSheet isOpen={showLog} onClose={() => setShowLog(false)} title="Log Sleep">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sleep Hours */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Hours Slept</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setSleepHours(prev => String(Math.max(0, parseFloat(prev) - 0.5)))}
                  style={{
                    width: 44, height: 44, borderRadius: 14, border: '1.5px solid var(--border-light)',
                    background: 'var(--bg-secondary)', fontSize: 20, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
                  }}>
                  -
                </motion.button>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Sora',sans-serif", minWidth: 80, textAlign: 'center' }}>
                  {sleepHours}h
                </div>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setSleepHours(prev => String(Math.min(24, parseFloat(prev) + 0.5)))}
                  style={{
                    width: 44, height: 44, borderRadius: 14, border: '1.5px solid var(--border-light)',
                    background: 'var(--bg-secondary)', fontSize: 20, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
                  }}>
                  +
                </motion.button>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Sleep Quality</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {QUALITY_OPTIONS.map(opt => (
                  <motion.button key={opt.value} whileTap={{ scale: 0.9 }}
                    onClick={() => setSleepQuality(opt.value)}
                    style={{
                      flex: 1, padding: '12px 6px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      border: sleepQuality === opt.value ? '2px solid var(--viya-primary-500)' : '2px solid var(--border-light)',
                      background: sleepQuality === opt.value ? 'var(--viya-primary-500)11' : 'transparent',
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{opt.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            <HapticButton fullWidth onClick={handleLogSleep} disabled={saving}>
              {saving ? 'Saving...' : 'Log Sleep'}
            </HapticButton>
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
