// Leaderboard — Weekly rankings among friends
import { motion } from 'framer-motion'
import { Trophy, Medal, TrendingUp, Crown } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import { listItem } from '../animations/pageVariants'

const LEADERBOARD = [
  { rank: 1, name: 'You', xp: 1250, streak: 14, avatar: '😎', isYou: true },
  { rank: 2, name: 'Priya', xp: 1180, streak: 12, avatar: '👩' },
  { rank: 3, name: 'Arun', xp: 980, streak: 8, avatar: '👨' },
  { rank: 4, name: 'Karthik', xp: 850, streak: 5, avatar: '🧑' },
  { rank: 5, name: 'Sneha', xp: 720, streak: 3, avatar: '👧' },
  { rank: 6, name: 'Rohit', xp: 650, streak: 7, avatar: '👦' },
]

const RANK_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function Leaderboard() {
  const topThree = LEADERBOARD.slice(0, 3)
  const rest = LEADERBOARD.slice(3)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Leaderboard</h1>
          <p className="body-s text-secondary">This week's rankings 🏆</p>
        </div>

        {/* Podium */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 28, padding: '0 10px' }}>
          {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((user, i) => {
            const heights = [100, 130, 80]
            const rank = user.rank
            return (
              <motion.div key={user.name}
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring', damping: 15 }}
                style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 4 }}>{user.avatar}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>{user.xp} XP</div>
                <div style={{
                  height: heights[i], borderRadius: '14px 14px 0 0',
                  background: rank === 1 ? 'linear-gradient(180deg, #FFD700, #FFA000)' :
                    rank === 2 ? 'linear-gradient(180deg, #C0C0C0, #808080)' :
                    'linear-gradient(180deg, #CD7F32, #8B4513)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12,
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>#{rank}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Rest of rankings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((user, i) => (
            <motion.div key={user.name} variants={listItem} initial="initial" animate="animate"
              className="card" style={{
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                border: user.isYou ? '1.5px solid var(--viya-primary-500)' : undefined,
              }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                #{user.rank}
              </div>
              <div style={{ fontSize: 28 }}>{user.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{user.name} {user.isYou && '(You)'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>🔥 {user.streak} day streak</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color:'var(--viya-primary-700)' }}>{user.xp} XP</div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
