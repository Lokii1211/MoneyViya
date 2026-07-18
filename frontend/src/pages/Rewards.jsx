import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Target, Loader2, Trophy, ArrowLeft } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop } from '../animations/pageVariants'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

const LEVEL_NAMES = ['Beginner', 'Saver', 'Planner', 'Investor', 'Master', 'Legend', 'Mythic']
const LEVEL_THRESHOLDS = [0, 500, 1000, 2000, 4000, 8000, 15000]

function getLevel(xp) {
  let lvl = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { lvl = i + 1; break }
  }
  return Math.min(lvl, LEVEL_NAMES.length)
}

function buildBadges(data) {
  const { user, txnCount, goalCount, streak, savingsRate, hasHealthLogs } = data
  return [
    {
      id: 1, name: 'First Steps', icon: '👋', desc: 'Signed up for Viya',
      earned: !!user, condition: 'Create an account',
    },
    {
      id: 2, name: 'First Expense', icon: '💰', desc: 'Logged your first expense',
      earned: txnCount > 0, condition: 'Log 1 expense',
    },
    {
      id: 3, name: 'Goal Setter', icon: '🎯', desc: 'Created your first savings goal',
      earned: goalCount > 0, condition: 'Create a goal',
    },
    {
      id: 4, name: '3-Day Spark', icon: '✨', desc: '3 days of daily logging',
      earned: streak >= 3, condition: `${Math.min(streak, 3)}/3 days`,
    },
    {
      id: 5, name: '7-Day Streak', icon: '🔥', desc: '7 days of daily logging',
      earned: streak >= 7, condition: `${Math.min(streak, 7)}/7 days`,
    },
    {
      id: 6, name: 'Streak Master', icon: '👑', desc: '14 consecutive days of logging',
      earned: streak >= 14, condition: `${Math.min(streak, 14)}/14 days`,
    },
    {
      id: 7, name: '30-Day Legend', icon: '🏆', desc: '30 consecutive days',
      earned: streak >= 30, condition: `${Math.min(streak, 30)}/30 days`,
    },
    {
      id: 8, name: 'Budget Pro', icon: '📊', desc: 'Save more than 20% of income',
      earned: savingsRate > 20, condition: `Currently ${Math.round(savingsRate)}%`,
    },
    {
      id: 9, name: 'Health Conscious', icon: '💚', desc: 'Start tracking your health',
      earned: hasHealthLogs, condition: 'Log health data',
    },
    {
      id: 10, name: 'Centurion', icon: '💯', desc: 'Logged 100 expenses',
      earned: txnCount >= 100, condition: `${Math.min(txnCount, 100)}/100 logged`,
    },
    {
      id: 11, name: 'Multi-Goal Pro', icon: '🎪', desc: 'Track 3+ goals simultaneously',
      earned: goalCount >= 3, condition: `${Math.min(goalCount, 3)}/3 goals`,
    },
    {
      id: 12, name: 'Viya Legend', icon: '🌟', desc: 'Reach Level 5 - Master!',
      earned: getLevel(user?.xp || 0) >= 5, condition: 'Reach Level 5',
    },
  ]
}

// Confetti particle
function ConfettiParticle({ delay, x }) {
  const colors = ['#FFD700', '#FF7062', '#00B870', '#7C4DFF', '#00B0B6', '#FF9800']
  const color = colors[Math.floor(Math.random() * colors.length)]
  return (
    <motion.div
      initial={{ y: -20, x, opacity: 1, rotate: 0 }}
      animate={{ y: 400, opacity: 0, rotate: 720 }}
      transition={{ duration: 2.5, delay, ease: 'easeIn' }}
      style={{
        position: 'fixed', top: 0, left: x, width: 8, height: 8,
        borderRadius: Math.random() > 0.5 ? '50%' : 2,
        background: color, zIndex: 9999, pointerEvents: 'none',
      }}
    />
  )
}

export default function Rewards() {
  const nav = useNavigate()
  const { phone } = useApp()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [badges, setBadges] = useState([])
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [activeTab, setActiveTab] = useState('badges')
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadData()
  }, [phone])

  const loadData = async () => {
    setLoading(true)
    try {
      const [user, txns, goals, habits, healthLog] = await Promise.all([
        api.getUser(phone),
        api.getTransactions(phone, 200),
        api.getGoals(phone),
        api.getHabits(phone),
        api.getHealthLog(phone),
      ])

      const xp = Number(user?.xp || user?.monthly_expenses || 0)
      const income = Number(user?.monthly_income || 0)
      const expenses = Number(user?.monthly_expenses || 0)
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
      const streak = Number(user?.streak || habits?.[0]?.current_streak || 0)

      const enrichedUser = { ...user, xp }
      setUserData({
        user: enrichedUser,
        txnCount: (txns || []).length,
        goalCount: (goals || []).length,
        streak,
        savingsRate,
        hasHealthLogs: !!healthLog,
        xp,
      })

      const builtBadges = buildBadges({
        user: enrichedUser,
        txnCount: (txns || []).length,
        goalCount: (goals || []).length,
        streak,
        savingsRate,
        hasHealthLogs: !!healthLog,
      })
      setBadges(builtBadges)

      // Trigger celebration for streak milestones
      if ([7, 14, 30, 60, 90].includes(streak)) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    } catch (err) {
      console.error('Rewards load error:', err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 size={28} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
        </div>
      </PageTransition>
    )
  }

  const xp = userData?.xp || 0
  const level = getLevel(xp)
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const prevThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const range = nextThreshold - prevThreshold
  const pct = range > 0 ? Math.min(Math.round(((xp - prevThreshold) / range) * 100), 100) : 100
  const earnedBadges = badges.filter(b => b.earned)
  const streak = userData?.streak || 0

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        {/* Celebration Confetti */}
        <AnimatePresence>
          {showCelebration && (
            <>
              {Array.from({ length: 30 }).map((_, i) => (
                <ConfettiParticle key={i} delay={Math.random() * 0.5} x={Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400)} />
              ))}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                style={{
                  position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
                  zIndex: 10000, textAlign: 'center', padding: '24px 32px',
                  background: 'linear-gradient(135deg, #0d0020, #2d1b69)',
                  borderRadius: 24, color: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Sora',sans-serif" }}>
                  {streak}-Day Streak!
                </div>
                <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>You're on fire! Keep going!</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FFD700', marginTop: 8 }}>+{streak >= 30 ? 100 : 25} XP 🏆</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
            <div>
              <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Rewards</h1>
              <p className="body-s text-secondary">Level up your life 🏆</p>
            </div>
          </div>
          <button onClick={() => nav('/leaderboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--primary-dim)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 10, color: 'var(--primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Trophy size={14} /> Leaderboard
          </button>
        </div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 24, marginBottom: 20, borderRadius: 'var(--radius-2xl)',
            background: 'linear-gradient(135deg, #0d0020, #1a0a3e, #2d1b69)',
            color: 'white', textAlign: 'center', boxShadow: '0 8px 32px rgba(13,0,32,0.5)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{ fontSize: 48, marginBottom: 8 }}
          >⚡</motion.div>
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 2 }}>Level {level}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>
            {LEVEL_NAMES[level - 1] || 'Mythic'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 12 }}>
            {xp.toLocaleString()} / {nextThreshold.toLocaleString()} XP
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #FFD700, #7C4DFF)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{earnedBadges.length}</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Badges</div>
            </div>
            <div>
              <motion.div
                animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 20, fontWeight: 700 }}
              >
                {streak} 🔥
              </motion.div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Streak</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{badges.length}</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Total</div>
            </div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'badges', label: `Badges (${earnedBadges.length}/${badges.length})`, icon: <Award size={14} /> },
            { key: 'locked', label: 'Locked', icon: <Target size={14} /> },
          ].map(tab => (
            <motion.button key={tab.key} whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none',
                background: activeTab === tab.key ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer',
              }}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Badge Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {earnedBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No badges yet!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Start logging expenses, setting goals, and building streaks to earn badges
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {badges.map(badge => (
                    <motion.div key={badge.id} whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedBadge(badge)}
                      style={{
                        padding: '12px 4px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                        background: badge.earned ? 'var(--bg-card)' : 'var(--bg-secondary)',
                        opacity: badge.earned ? 1 : 0.35,
                        border: badge.earned
                          ? '1.5px solid rgba(255,215,0,0.3)'
                          : '1px solid var(--border-light)',
                        boxShadow: badge.earned ? '0 2px 8px rgba(255,215,0,0.1)' : 'none',
                      }}>
                      <motion.div
                        animate={badge.earned ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5, delay: badge.id * 0.3 }}
                        style={{ fontSize: 28, marginBottom: 4 }}
                      >
                        {badge.earned ? badge.icon : '🔒'}
                      </motion.div>
                      <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.2 }}>{badge.name}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'locked' && (
            <motion.div key="locked" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {badges.filter(b => !b.earned).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>All badges unlocked!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {badges.filter(b => !b.earned).map(badge => (
                    <motion.div key={badge.id} variants={cardPop} initial="initial" animate="animate"
                      className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-secondary)', fontSize: 22, opacity: 0.5,
                      }}>
                        🔒
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{badge.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{badge.desc}</div>
                        <div style={{ fontSize: 11, color: 'var(--viya-primary-500)', fontWeight: 600, marginTop: 2 }}>
                          {badge.condition}
                        </div>
                      </div>
                      <span style={{ fontSize: 20, opacity: 0.4 }}>{badge.icon}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge Detail Bottom Sheet */}
        <AnimatePresence>
          {selectedBadge && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedBadge(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
              />
              <motion.div
                initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                  background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0',
                  padding: '32px 24px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-light)', margin: '0 auto 20px' }} />
                <motion.div
                  animate={selectedBadge.earned ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.6 }}
                  style={{ fontSize: 56, marginBottom: 12 }}
                >
                  {selectedBadge.icon}
                </motion.div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>
                  {selectedBadge.name}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  {selectedBadge.desc}
                </div>
                {selectedBadge.earned ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 20,
                    background: 'rgba(0,184,112,0.1)', color: '#00B870',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    ✅ Unlocked!
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 20,
                      background: 'var(--bg-secondary)', color: 'var(--text-tertiary)',
                      fontSize: 13, fontWeight: 600, marginBottom: 8,
                    }}>
                      🔒 Not yet earned
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--viya-primary-500)', fontWeight: 600, marginTop: 8 }}>
                      {selectedBadge.condition}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
