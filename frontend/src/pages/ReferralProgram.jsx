import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Share2, Gift, Users, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react'

const REFERRAL_CODE = 'VIYA-RAHUL2026'
const REWARD_AMOUNT = 50

const REFERRAL_STATS = {
  invited: 12,
  joined: 5,
  earned: 250,
  pendingReward: 100,
}

const REFERRAL_HISTORY = [
  { name: 'Priya S.', status: 'joined', date: 'May 8', reward: '₹50', emoji: '🎉' },
  { name: 'Arjun K.', status: 'joined', date: 'May 5', reward: '₹50', emoji: '🎉' },
  { name: 'Sneha M.', status: 'pending', date: 'May 10', reward: 'Pending', emoji: '⏳' },
  { name: 'Vikram R.', status: 'joined', date: 'Apr 28', reward: '₹50', emoji: '🎉' },
  { name: 'Anita P.', status: 'expired', date: 'Apr 15', reward: '—', emoji: '❌' },
]

export default function ReferralProgram() {
  const nav = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard?.writeText(REFERRAL_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViya = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Try Viya AI',
        text: `I use Viya to manage my finances, health & emails — all in one AI app. Use my code ${REFERRAL_CODE} and we both get ₹${REWARD_AMOUNT}!`,
        url: `https://viya.app/ref/${REFERRAL_CODE}`,
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #FFD93D 0%, #F5A623 50%, #FF7062 100%)',
        padding: '50px 20px 28px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', top: -40, right: -30,
        }} />
        
        <button onClick={() => nav(-1)} style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}><ArrowLeft size={16} color="white" /></button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>🎁</div>
          <div style={{
            fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, color: 'white', marginBottom: 4,
          }}>Give ₹{REWARD_AMOUNT}, Get ₹{REWARD_AMOUNT}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            Invite friends to Viya. You both earn rewards.
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Referral Code Card */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 20,
          border: '2px dashed var(--gold-300)', marginTop: -20, position: 'relative',
          textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Your Referral Code
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 3, color: 'var(--gold-500)', marginBottom: 12,
          }}>{REFERRAL_CODE}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={copyCode} style={{
              padding: '10px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600,
              background: copied ? 'var(--emerald-500)' : 'var(--bg-secondary)',
              color: copied ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-light)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
            }}>
              {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
            <button onClick={shareViya} style={{
              padding: '10px 20px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600,
              background: 'var(--gradient-gold)', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(245,166,35,0.3)',
            }}>
              <Share2 size={14} /> Share via WhatsApp
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Invited', value: REFERRAL_STATS.invited, icon: <Users size={16} />, color: 'var(--info-500)' },
            { label: 'Joined', value: REFERRAL_STATS.joined, icon: <CheckCircle size={16} />, color: 'var(--emerald-500)' },
            { label: 'Earned', value: `₹${REFERRAL_STATS.earned}`, icon: <TrendingUp size={16} />, color: 'var(--gold-500)' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
              border: '1px solid var(--border-light)', textAlign: 'center',
            }}>
              <div style={{ color: s.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
            How it works
          </div>
          {[
            { step: '1', title: 'Share your code', desc: 'Send to friends via WhatsApp, Instagram, or anywhere' },
            { step: '2', title: 'Friend signs up', desc: 'They enter your code during onboarding' },
            { step: '3', title: 'Both earn ₹50', desc: 'Credited after 7 days of active usage' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-gold)',
                color: 'white', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral History */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
            Your referrals
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-light)', overflow: 'hidden',
          }}>
            {REFERRAL_HISTORY.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderBottom: i < REFERRAL_HISTORY.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <span style={{ fontSize: 20 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.date}</div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: r.status === 'joined' ? 'var(--emerald-500)' : r.status === 'pending' ? 'var(--amber-500)' : 'var(--text-tertiary)',
                }}>{r.reward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
