// Rewards — XP, levels, badges (40+), achievements, streak celebrations
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Zap, Target, TrendingUp, Award, Shield, Heart, Gift } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { cardPop } from '../animations/pageVariants'

const LEVEL_NAMES = ['Beginner', 'Saver', 'Planner', 'Investor', 'Master', 'Legend', 'Mythic']
const LEVEL_THRESHOLDS = [0, 500, 1000, 2000, 4000, 8000, 15000]

const BADGES = [
  // Onboarding (1-5)
  { id: 1, name: 'First Steps', icon: '👋', desc: 'Signed up for Viya', earned: true, date: '2026-04-01' },
  { id: 2, name: 'First Expense', icon: '💰', desc: 'Logged your first expense', earned: true, date: '2026-04-01' },
  { id: 3, name: 'Profile Pro', icon: '📝', desc: 'Completed your profile', earned: true, date: '2026-04-01' },
  { id: 4, name: 'Goal Setter', icon: '🎯', desc: 'Created your first savings goal', earned: true, date: '2026-04-02' },
  { id: 5, name: 'WhatsApp Ready', icon: '💬', desc: 'Sent your first bot message', earned: true, date: '2026-04-02' },
  // Streaks (6-12)
  { id: 6, name: '3-Day Spark', icon: '✨', desc: '3 days of daily logging', earned: true, date: '2026-04-04' },
  { id: 7, name: '7-Day Streak', icon: '🔥', desc: '7 days of daily logging', earned: true, date: '2026-04-08' },
  { id: 8, name: '14-Day Fire', icon: '🌟', desc: '14 consecutive days', earned: true, date: '2026-04-15' },
  { id: 9, name: '30-Day Legend', icon: '👑', desc: '30 consecutive days', earned: false },
  { id: 10, name: '60-Day Titan', icon: '⚡', desc: '60 consecutive days', earned: false },
  { id: 11, name: '90-Day Master', icon: '🏆', desc: '90 consecutive days', earned: false },
  { id: 12, name: '365-Day Mythic', icon: '🌈', desc: 'A full year of consistency', earned: false },
  // Budget (13-18)
  { id: 13, name: 'Budget Rookie', icon: '📊', desc: 'Set your first budget', earned: true, date: '2026-04-03' },
  { id: 14, name: 'Budget Master', icon: '🎖️', desc: 'Stayed under budget for a month', earned: true, date: '2026-04-30' },
  { id: 15, name: 'Savings Star', icon: '💎', desc: 'Saved ₹5,000 in a month', earned: false },
  { id: 16, name: 'Frugal Hero', icon: '🛡️', desc: 'Spent 20% below budget', earned: false },
  { id: 17, name: 'No-Spend Champion', icon: '🚫', desc: 'Completed a no-spend weekend', earned: false },
  { id: 18, name: 'Investment Guru', icon: '📈', desc: 'Started a SIP or investment', earned: false },
  // Health (19-26)
  { id: 19, name: 'Health Starter', icon: '💚', desc: 'First health log', earned: true, date: '2026-04-05' },
  { id: 20, name: 'Health Warrior', icon: '💪', desc: 'Logged health for 14 days', earned: true, date: '2026-05-01' },
  { id: 21, name: 'Hydration Hero', icon: '💧', desc: '8+ glasses for 7 days', earned: false },
  { id: 22, name: 'Sleep Master', icon: '😴', desc: '7+ hours sleep for 14 days', earned: false },
  { id: 23, name: 'Night Owl', icon: '🦉', desc: 'Logged sleep for 7 days', earned: false },
  { id: 24, name: 'Step Counter', icon: '🚶', desc: '10K steps for 5 days', earned: false },
  { id: 25, name: 'Mood Tracker', icon: '🌤️', desc: 'Logged mood for 14 days', earned: false },
  { id: 26, name: 'Zen Master', icon: '🧘', desc: '30 days of mood tracking', earned: false },
  // Habits (27-32)
  { id: 27, name: 'Habit Starter', icon: '🌱', desc: 'Created your first habit', earned: true, date: '2026-04-03' },
  { id: 28, name: 'Habit Machine', icon: '⚡', desc: '30-day habit streak', earned: false },
  { id: 29, name: 'Multi-Habit Pro', icon: '🎪', desc: 'Track 5+ habits simultaneously', earned: false },
  { id: 30, name: 'Early Bird', icon: '🐦', desc: 'Morning habit done before 7 AM', earned: false },
  { id: 31, name: 'Consistency King', icon: '♛', desc: '100% habits done for a week', earned: false },
  { id: 32, name: 'Freeze Saver', icon: '🧊', desc: 'Used a streak freeze wisely', earned: false },
  // Food (33-36)
  { id: 33, name: 'Chef Mode', icon: '👨‍🍳', desc: 'Logged all meals for a week', earned: false },
  { id: 34, name: 'Calorie Counter', icon: '🔢', desc: 'Hit calorie target for 7 days', earned: false },
  { id: 35, name: 'Breakfast Champion', icon: '🥞', desc: 'Never skipped breakfast for 14 days', earned: false },
  { id: 36, name: 'Meal Planner', icon: '📋', desc: 'Pre-logged meals for a week', earned: false },
  // Medicine (37-38)
  { id: 37, name: 'Medicine Pro', icon: '💊', desc: 'Never missed a dose for 30 days', earned: false },
  { id: 38, name: 'Vitamin Champ', icon: '🌞', desc: '14 days of vitamin tracking', earned: false },
  // Social (39-42)
  { id: 39, name: 'Social Butterfly', icon: '🦋', desc: 'Added 5 friends', earned: false },
  { id: 40, name: 'Family First', icon: '👨‍👩‍👧', desc: 'Connected a family member', earned: false },
  { id: 41, name: 'Split Master', icon: '🤝', desc: 'Settled 10 splits', earned: false },
  { id: 42, name: 'Community Star', icon: '⭐', desc: 'Joined the Viya community', earned: false },
  // Intelligence (43-46)
  { id: 43, name: 'Email Ninja', icon: '📧', desc: 'Connected email intelligence', earned: false },
  { id: 44, name: 'SMS Scanner', icon: '📱', desc: 'Auto-logged 50 SMS expenses', earned: false },
  { id: 45, name: 'Receipt Scanner', icon: '📸', desc: 'Scanned 10 receipts', earned: false },
  { id: 46, name: 'Prediction Pro', icon: '🔮', desc: 'Checked predictions 10 times', earned: false },
  // Milestones (47-50)
  { id: 47, name: 'Centurion', icon: '💯', desc: 'Logged 100 expenses', earned: false },
  { id: 48, name: 'Viya Veteran', icon: '🎗️', desc: '6 months on Viya', earned: false },
  { id: 49, name: 'Level 5 Master', icon: '🏅', desc: 'Reach Level 5', earned: false },
  { id: 50, name: 'Viya Legend', icon: '👑', desc: 'Reach Level 6 — Legendary!', earned: false },
]

const CHALLENGES = [
  { id: 1, title: 'No-Spend Weekend', desc: 'Don\'t spend anything this weekend', xp: 100, progress: 0.5, icon: '🚫💸', deadline: '2d left' },
  { id: 2, title: 'Log All Meals', desc: 'Log breakfast, lunch, dinner for 3 days', xp: 75, progress: 0.33, icon: '🍽️', deadline: '5d left' },
  { id: 3, title: '10K Steps Daily', desc: 'Walk 10,000 steps for 5 days', xp: 150, progress: 0.6, icon: '🚶', deadline: '3d left' },
  { id: 4, title: 'Hydration Hero', desc: 'Drink 8 glasses of water for 7 days', xp: 100, progress: 0.28, icon: '💧', deadline: '5d left' },
  { id: 5, title: 'Budget Master', desc: 'Stay under budget for the month', xp: 500, progress: 0.4, icon: '🏆', deadline: '20d left' },
]

// Confetti particle component
function ConfettiParticle({ delay, x }) {
  const colors = ['#FFD700', '#FF6B6B', '#00B870', '#7C4DFF', '#00B0B6', '#FF9800']
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
  const [showCelebration, setShowCelebration] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [activeTab, setActiveTab] = useState('badges')
  
  const xp = 1250
  const level = 3
  const nextLevelXp = LEVEL_THRESHOLDS[level] || 2000
  const prevLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const pct = Math.round(((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)
  const earnedBadges = BADGES.filter(b => b.earned).length
  const streak = 14

  // Show celebration on mount if streak milestone
  useEffect(() => {
    if (streak === 7 || streak === 14 || streak === 30 || streak === 60 || streak === 90) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [])

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

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Rewards</h1>
          <p className="body-s text-secondary">Level up your life 🏆</p>
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
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>{LEVEL_NAMES[level - 1]}</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 12 }}>{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #00B0B6, #7C4DFF)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>{earnedBadges}</div><div style={{ fontSize: 11, opacity: 0.5 }}>Badges</div></div>
            <div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                style={{ fontSize: 20, fontWeight: 700 }}
              >{streak} 🔥</motion.div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Streak</div>
            </div>
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>{CHALLENGES.length}</div><div style={{ fontSize: 11, opacity: 0.5 }}>Challenges</div></div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'badges', label: `Badges (${earnedBadges}/${BADGES.length})`, icon: <Award size={14} /> },
            { key: 'challenges', label: 'Challenges', icon: <Target size={14} /> },
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

        {/* Active Challenges */}
        <AnimatePresence mode="wait">
          {activeTab === 'challenges' && (
            <motion.div key="challenges" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {CHALLENGES.map(ch => (
                  <motion.div key={ch.id} variants={cardPop} initial="initial" animate="animate"
                    className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 24 }}>{ch.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{ch.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{ch.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--viya-warning)' }}>+{ch.xp} XP</span>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{ch.deadline}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${ch.progress * 100}%` }}
                          transition={{ duration: 0.8 }}
                          style={{ height: '100%', borderRadius: 3, background: 'var(--gradient-primary)' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{Math.round(ch.progress * 100)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Badges Grid */}
          {activeTab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {BADGES.map(badge => (
                  <motion.div key={badge.id} whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedBadge(badge)}
                    style={{
                      padding: '12px 4px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                      background: badge.earned ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      opacity: badge.earned ? 1 : 0.4,
                      border: badge.earned ? '1.5px solid rgba(0,176,182,0.15)' : '1px solid var(--border-light)',
                    }}>
                    <motion.div
                      animate={badge.earned ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 5, delay: badge.id * 0.2 }}
                      style={{ fontSize: 28, marginBottom: 4 }}
                    >{badge.icon}</motion.div>
                    <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.2 }}>{badge.name}</div>
                  </motion.div>
                ))}
              </div>
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
                <div style={{ fontSize: 56, marginBottom: 12 }}>{selectedBadge.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>{selectedBadge.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{selectedBadge.desc}</div>
                {selectedBadge.earned ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(0,184,112,0.1)', color: '#00B870', fontSize: 13, fontWeight: 700 }}>
                    ✅ Earned on {selectedBadge.date}
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600 }}>
                    🔒 Not yet earned
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
