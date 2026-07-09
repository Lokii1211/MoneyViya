import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, Users, Trophy, Share2, UserPlus, Award } from 'lucide-react'

function Avatar({ value, size = 18 }) {
  if (value?.startsWith?.('data:image')) {
    return <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
  }
  return <span style={{ fontSize: size }}>{value}</span>
}

// Achievement Badges System — derived entirely from real Supabase data
const BADGES = [
  { id: 'first_expense', emoji: '🎯', label: 'First Step', desc: 'Logged your first expense', check: (d) => d.totalTxns > 0 },
  { id: 'streak_3', emoji: '🎩', label: 'Hat-Trick', desc: '3-day habit streak', check: (d) => d.maxStreak >= 3 },
  { id: 'streak_7', emoji: '🗡️', label: 'Week Warrior', desc: '7-day habit streak', check: (d) => d.maxStreak >= 7 },
  { id: 'streak_14', emoji: '💎', label: 'Two Weeks', desc: '14-day habit streak', check: (d) => d.maxStreak >= 14 },
  { id: 'streak_30', emoji: '👑', label: 'Monthly Master', desc: '30-day habit streak', check: (d) => d.maxStreak >= 30 },
  { id: 'saver_1k', emoji: '💰', label: 'First ₹1K', desc: 'Saved ₹1,000', check: (d) => d.totalSaved >= 1000 },
  { id: 'saver_10k', emoji: '🏆', label: '₹10K Club', desc: 'Saved ₹10,000', check: (d) => d.totalSaved >= 10000 },
  { id: 'saver_50k', emoji: '🌟', label: '₹50K Star', desc: 'Saved ₹50,000', check: (d) => d.totalSaved >= 50000 },
  { id: 'goal_done', emoji: '🎉', label: 'Goal Getter', desc: 'Completed a goal', check: (d) => d.completedGoals > 0 },
  { id: 'habits_5', emoji: '⚡', label: 'Habit Builder', desc: 'Tracking 5+ habits', check: (d) => d.totalHabits >= 5 },
  { id: 'tracker_100', emoji: '📊', label: 'Data Nerd', desc: '100+ transactions', check: (d) => d.totalTxns >= 100 },
  { id: 'friend', emoji: '🤝', label: 'Networker', desc: 'Added a real friend', check: (d) => d.friendCount > 0 },
]

function computeBadgeData(habits, goals, txns) {
  const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
  const totalSaved = (goals || []).reduce((s, g) => s + Number(g.current_amount || 0), 0)
  const completedGoals = (goals || []).filter(g => g.status === 'completed').length
  return { maxStreak, totalSaved, completedGoals, totalHabits: (habits || []).length, totalTxns: (txns || []).length }
}

export default function Community() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('achievements')
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState({ name: 'You', avatar: '😎', badgeData: {}, friendCount: 0 })
  const [friends, setFriends] = useState([])

  useEffect(() => { if (phone) loadAll() }, [phone])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [habits, goals, txns, sent, received] = await Promise.all([
        api.getHabits(phone), api.getGoals(phone), api.getTransactions(phone),
        api.getFamilyConnections(phone), api.getFamilyInvitesReceived(phone),
      ])

      const sentF = (sent || []).filter(c => c.connection_type === 'friend' && c.status === 'accepted')
      const recvF = (received || []).filter(c => c.connection_type === 'friend' && c.status === 'accepted')
      const friendPhones = [
        ...sentF.map(c => c.member_phone),
        ...recvF.map(c => c.owner_phone),
      ]

      const friendData = await Promise.all(friendPhones.map(async (fp) => {
        const [u, h, g, t] = await Promise.all([
          api.getUser(fp), api.getHabits(fp), api.getGoals(fp), api.getTransactions(fp),
        ])
        return {
          phone: fp,
          name: u?.name || fp,
          avatar: u?.avatar || '🙂',
          badgeData: computeBadgeData(h, g, t),
        }
      }))

      setMe({
        name: user?.name || 'You',
        avatar: localStorage.getItem('mv_avatar') || '😎',
        badgeData: { ...computeBadgeData(habits, goals, txns), friendCount: friendData.length },
        friendCount: friendData.length,
      })
      setFriends(friendData.map(f => ({ ...f, badgeData: { ...f.badgeData, friendCount: 1 } })))
    } catch { /* keep defaults */ }
    setLoading(false)
  }

  const referralCode = 'VIYA' + (phone || '0000').slice(-4)
  const shareAchievement = (text) => {
    const msg = `🏆 ${me.name} on Viya: ${text}\n\nJoin me on Viya and start saving! 💚\nhttps://heyviya.vercel.app/?ref=${referralCode}`
    if (navigator.share) navigator.share({ text: msg })
    else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }

  const myEarned = BADGES.filter(b => b.check(me.badgeData))
  const leaderboard = [
    { ...me, isMe: true, rank: 0 },
    ...friends,
  ]
    .sort((a, b) => (b.badgeData.totalSaved || 0) - (a.badgeData.totalSaved || 0))
    .map((p, i) => ({ ...p, rank: i + 1 }))

  const people = [{ ...me, isMe: true }, ...friends]

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }} onClick={() => nav(-1)}><ArrowLeft size={20} /></button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Community</h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => shareAchievement(`saved ₹${me.badgeData.totalSaved || 0} and built a ${me.badgeData.maxStreak || 0}-day streak!`)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}><Share2 size={14} /> Share</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
        {[{ id: 'achievements', label: 'Achievements', icon: <Users size={14} /> }, { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={14} /> }, { id: 'badges', label: 'Badges', icon: <Award size={14} /> }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 0', background: tab === t.id ? 'var(--primary)' : 'var(--surface)', color: tab === t.id ? '#fff' : 'var(--text2)', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[0, 1, 2].map(i => <div key={i} className="skeleton mb-10" style={{ height: 90, borderRadius: 14 }} />)}</div>
      ) : (
      <>
      {/* Achievements Tab — real snapshot of you + real friends */}
      {tab === 'achievements' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border: '1px solid var(--border2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div><div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{me.badgeData.maxStreak || 0}🔥</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>STREAK</div></div>
              <div><div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>₹{(me.badgeData.totalSaved || 0) > 999 ? Math.round(me.badgeData.totalSaved / 1000) + 'K' : (me.badgeData.totalSaved || 0)}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>SAVED</div></div>
              <div><div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: 'var(--violet)' }}>{myEarned.length}/{BADGES.length}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>BADGES</div></div>
            </div>
          </div>

          {people.map((p, i) => {
            const earned = BADGES.filter(b => b.check(p.badgeData))
            const top = earned[earned.length - 1]
            return (
              <div key={p.phone || 'me'} style={{ background: 'var(--surface)', border: p.isMe ? '1.5px solid var(--primary)' : '1px solid var(--border2)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Avatar value={p.avatar} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.isMe ? 'You' : p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{earned.length} of {BADGES.length} badges earned</div>
                  </div>
                  {top && <span style={{ fontSize: 22 }}>{top.emoji}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                  {top
                    ? <>Currently on <strong>{top.label}</strong> — {top.desc.toLowerCase()}</>
                    : <>Just getting started — log an expense or start a habit to earn your first badge.</>}
                </div>
                {p.isMe && top && (
                  <button style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }} onClick={() => shareAchievement(`earned the "${top.label}" badge! ${top.emoji}`)}>
                    <Share2 size={13} /> Share this
                  </button>
                )}
              </div>
            )
          })}

          <button className="btn-secondary" style={{ width: '100%', marginTop: 4 }} onClick={() => nav('/friends')}>
            <UserPlus size={14} /> Add real friends to see them here
          </button>
        </div>
      )}

      {/* Leaderboard Tab — real people only */}
      {tab === 'leaderboard' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>SAVINGS LEADERBOARD</div>
          </div>
          {leaderboard.map(l => (
            <div key={l.phone || 'me'} style={{ background: l.isMe ? 'var(--primary-dim)' : 'var(--surface)', border: l.isMe ? '2px solid var(--primary)' : '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: l.rank <= 3 ? 20 : 14, fontWeight: 800, color: l.rank === 1 ? '#FFD700' : l.rank === 2 ? '#C0C0C0' : l.rank === 3 ? '#CD7F32' : 'var(--text3)' }}>
                {l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : `#${l.rank}`}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Avatar value={l.avatar} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.isMe ? 'You' : l.name} {l.isMe && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800 }}>YOU</span>}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{l.badgeData.maxStreak || 0}🔥 streak</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>₹{l.badgeData.totalSaved || 0}</div>
            </div>
          ))}
          {friends.length === 0 && (
            <div className="empty-state-card" style={{ marginTop: 8 }}>
              <div className="empty-emoji">🏆</div>
              <h3>It's just you for now</h3>
              <p>Add real friends and this becomes an actual leaderboard — no placeholder names.</p>
              <button className="btn-primary" onClick={() => nav('/friends')}><UserPlus size={14} /> Add Friends</button>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab — unchanged, already 100% real */}
      {tab === 'badges' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32 }}>{myEarned.length > 0 ? '🏆' : '🎯'}</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{myEarned.length} of {BADGES.length} Earned</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Keep going to unlock more!</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BADGES.map(b => {
              const unlocked = b.check(me.badgeData)
              return (
                <div key={b.id} style={{ background: unlocked ? 'var(--primary-dim)' : 'var(--surface)', border: unlocked ? '1px solid var(--primary)' : '1px solid var(--border2)', borderRadius: 14, padding: 16, textAlign: 'center', opacity: unlocked ? 1 : 0.5 }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{unlocked ? b.emoji : '🔒'}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{b.desc}</div>
                  {unlocked && (
                    <button style={{ marginTop: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }} onClick={() => shareAchievement(`earned the "${b.label}" badge! ${b.emoji}`)}>
                      Share
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
