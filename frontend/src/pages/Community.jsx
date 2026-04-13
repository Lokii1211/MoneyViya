import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, Users, Trophy, Share2, Heart, MessageCircle, Crown, Flame, Target, Medal, Star, Award, Zap } from 'lucide-react'

// Achievement Badges System
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
  { id: 'referral', emoji: '🤝', label: 'Networker', desc: 'Invited a friend', check: () => false },
]

// Simulated community feed (from achievements & milestones)
function generateFeed(userData) {
  const feed = []
  const names = ['Rahul', 'Priya', 'Karan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Divya']
  const cities = ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune']
  const achievements = [
    { text: 'just hit a 14-day streak! 🔥', emoji: '💎', type: 'streak' },
    { text: 'saved ₹25,000 this month! 💰', emoji: '🏆', type: 'savings' },
    { text: 'completed their Bike goal! 🏍️', emoji: '🎉', type: 'goal' },
    { text: 'tracked expenses for 30 days straight! 📊', emoji: '👑', type: 'streak' },
    { text: 'reduced food spending by 40%! 🍽️', emoji: '⚡', type: 'insight' },
    { text: 'started investing in SIPs! 📈', emoji: '🚀', type: 'investment' },
    { text: 'built 5 daily habits! 💪', emoji: '🌟', type: 'habits' },
    { text: 'went under budget for 2 weeks! ✅', emoji: '🎯', type: 'budget' },
  ]
  for (let i = 0; i < 8; i++) {
    const a = achievements[i % achievements.length]
    feed.push({
      id: i,
      name: names[i % names.length],
      city: cities[i % cities.length],
      avatar: ['😎','🦊','🐱','🦁','🐼','🦄','🐸','🦋'][i],
      ...a,
      time: i === 0 ? '2m ago' : i < 3 ? `${i}h ago` : `${i}h ago`,
      likes: Math.floor(Math.random() * 50) + 5,
    })
  }
  return feed
}

export default function Community() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('feed')
  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [txns, setTxns] = useState([])
  const [liked, setLiked] = useState({})

  useEffect(() => {
    if (phone) {
      api.getHabits(phone).then(h => setHabits(h || []))
      api.getGoals(phone).then(g => setGoals(g || []))
      api.getTransactions(phone).then(t => setTxns(t || []))
    }
  }, [phone])

  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount || 0), 0)
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const totalHabits = habits.length
  const totalTxns = txns.length
  const badgeData = { maxStreak, totalSaved, completedGoals, totalHabits, totalTxns }
  const earned = BADGES.filter(b => b.check(badgeData))
  const feed = generateFeed(badgeData)

  const name = user?.name || 'User'
  const referralCode = 'VIYA' + (phone || '0000').slice(-4)

  const shareAchievement = (text) => {
    const msg = `🏆 ${name} on Viya: ${text}\n\nJoin me on Viya and start saving! 💚\nhttps://heyviya.vercel.app/?ref=${referralCode}`
    if (navigator.share) navigator.share({ text: msg })
    else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }

  // Leaderboard (simulated with real user data mixed)
  const leaderboard = [
    { rank: 1, name: 'Priya K.', city: 'Bangalore', streak: 47, saved: 125000, avatar: '🦊' },
    { rank: 2, name: 'Arjun M.', city: 'Mumbai', streak: 35, saved: 98000, avatar: '🦁' },
    { rank: 3, name: 'Sneha R.', city: 'Delhi', streak: 28, saved: 76000, avatar: '🦋' },
    { rank: 4, name: name.split(' ')[0], city: user?.city || 'India', streak: maxStreak, saved: totalSaved, avatar: localStorage.getItem('mv_avatar') || '😎', isMe: true },
    { rank: 5, name: 'Vikram S.', city: 'Chennai', streak: maxStreak > 5 ? maxStreak - 2 : 12, saved: 42000, avatar: '🐼' },
    { rank: 6, name: 'Divya P.', city: 'Pune', streak: 8, saved: 31000, avatar: '🌺' },
  ].sort((a, b) => b.saved - a.saved).map((l, i) => ({ ...l, rank: i + 1 }))

  return (
    <div className="page">
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Community</h2>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button onClick={() => shareAchievement(`saved ₹${totalSaved.toLocaleString('en-IN')} and built a ${maxStreak}-day streak!`)} className="btn-primary" style={{padding:'6px 12px', fontSize:12, borderRadius:8}}><Share2 size={14}/> Share</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderRadius:10, border:'1px solid var(--border)', overflow:'hidden', marginBottom:16}}>
        {[{id:'feed', label:'Feed', icon:<Users size={14}/>}, {id:'leaderboard', label:'Rankings', icon:<Trophy size={14}/>}, {id:'badges', label:'Badges', icon:<Award size={14}/>}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{flex:1, padding:'10px 0', background: tab === t.id ? 'var(--primary)' : 'var(--surface)', color: tab === t.id ? '#fff' : 'var(--text2)', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div>
          {/* Your stats card */}
          <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:14, padding:16, marginBottom:16}}>
            <div style={{display:'flex', justifyContent:'space-around', textAlign:'center'}}>
              <div><div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--primary)'}}>{maxStreak}🔥</div><div style={{fontSize:10, color:'var(--text3)'}}>STREAK</div></div>
              <div><div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--gold)'}}>₹{totalSaved > 999 ? Math.round(totalSaved/1000) + 'K' : totalSaved}</div><div style={{fontSize:10, color:'var(--text3)'}}>SAVED</div></div>
              <div><div style={{fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:'var(--violet)'}}>{earned.length}/{BADGES.length}</div><div style={{fontSize:10, color:'var(--text3)'}}>BADGES</div></div>
            </div>
          </div>

          {/* Community Feed */}
          {feed.map(f => (
            <div key={f.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, marginBottom:10}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
                <div style={{width:36, height:36, borderRadius:10, background:'var(--primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}}>{f.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700}}>{f.name}</div>
                  <div style={{fontSize:10, color:'var(--text3)'}}>{f.city} · {f.time}</div>
                </div>
                <span style={{fontSize:20}}>{f.emoji}</span>
              </div>
              <div style={{fontSize:13, color:'var(--text)', marginBottom:10, lineHeight:1.5}}>
                <strong>{f.name}</strong> {f.text}
              </div>
              <div style={{display:'flex', gap:16}}>
                <button style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, color: liked[f.id] ? 'var(--red)' : 'var(--text3)'}} onClick={() => setLiked(p => ({...p, [f.id]: !p[f.id]}))}>
                  <Heart size={14} fill={liked[f.id] ? 'var(--red)' : 'none'}/> {f.likes + (liked[f.id] ? 1 : 0)}
                </button>
                <button style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text3)'}} onClick={() => shareAchievement(f.text)}>
                  <Share2 size={14}/> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div>
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:11, color:'var(--text3)', letterSpacing:1}}>SAVINGS LEADERBOARD</div>
          </div>
          {leaderboard.map(l => (
            <div key={l.rank} style={{background: l.isMe ? 'var(--primary-dim)' : 'var(--surface)', border: l.isMe ? '2px solid var(--primary)' : '1px solid var(--border2)', borderRadius:12, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:12}}>
              <div style={{width:28, textAlign:'center', fontSize: l.rank <= 3 ? 20 : 14, fontWeight:800, color: l.rank === 1 ? '#FFD700' : l.rank === 2 ? '#C0C0C0' : l.rank === 3 ? '#CD7F32' : 'var(--text3)'}}>
                {l.rank <= 3 ? ['🥇','🥈','🥉'][l.rank-1] : `#${l.rank}`}
              </div>
              <div style={{width:32, height:32, borderRadius:8, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}}>{l.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:700}}>{l.name} {l.isMe && <span style={{fontSize:10, color:'var(--primary)', fontWeight:800}}>YOU</span>}</div>
                <div style={{fontSize:10, color:'var(--text3)'}}>{l.city} · {l.streak}🔥 streak</div>
              </div>
              <div style={{fontFamily:'var(--mono)', fontSize:14, fontWeight:800, color:'var(--primary)'}}>₹{l.saved.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div>
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:32}}>{earned.length > 0 ? '🏆' : '🎯'}</div>
            <div style={{fontSize:14, fontWeight:800}}>{earned.length} of {BADGES.length} Earned</div>
            <div style={{fontSize:12, color:'var(--text3)'}}>Keep going to unlock more!</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {BADGES.map(b => {
              const unlocked = b.check(badgeData)
              return (
                <div key={b.id} style={{background: unlocked ? 'var(--primary-dim)' : 'var(--surface)', border: unlocked ? '1px solid var(--primary)' : '1px solid var(--border2)', borderRadius:14, padding:16, textAlign:'center', opacity: unlocked ? 1 : 0.5}}>
                  <div style={{fontSize:32, marginBottom:4}}>{unlocked ? b.emoji : '🔒'}</div>
                  <div style={{fontSize:12, fontWeight:700, marginBottom:2}}>{b.label}</div>
                  <div style={{fontSize:10, color:'var(--text3)'}}>{b.desc}</div>
                  {unlocked && (
                    <button style={{marginTop:8, background:'var(--primary)', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', fontSize:10, cursor:'pointer', fontWeight:700}} onClick={() => shareAchievement(`earned the "${b.label}" badge! ${b.emoji}`)}>
                      Share
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
