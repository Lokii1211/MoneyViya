import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CreditCard, Calendar, Package, Clock, ArrowLeft, ShieldCheck, Sparkles, MessageSquare, BellRing, CheckCircle2 } from 'lucide-react'
import PageTransition from '../components/PageTransition'

export default function EmailIntelligence() {
  const nav = useNavigate()
  const [notified, setNotified] = useState(false)

  const handleNotify = () => {
    setNotified(true)
  }

  const features = [
    { icon: <CreditCard size={20} color="#FF6B6B" />, title: 'Credit Card & Utility Bills', desc: 'Auto-extracts total amount, due date, and minimum due so you never pay late fees.', tag: 'Auto-detected', color: '#FF6B6B' },
    { icon: <Package size={20} color="#FBBF24" />, title: 'Deliveries & Order Tracking', desc: 'Tracks Amazon, Flipkart, Swiggy Instamart and courier packages with real-time status.', tag: 'Live tracking', color: '#FBBF24' },
    { icon: <Calendar size={20} color="#60A5FA" />, title: 'Calendar & Meeting Invites', desc: 'Detects Zoom, Google Meet & doctor appointment invites and adds them to your daily schedule.', tag: 'Schedule sync', color: '#60A5FA' },
    { icon: <Mail size={20} color="#34D399" />, title: 'Investment & Mutual Fund CAS', desc: 'Parses monthly CAMS/KFintech statements to keep your net worth cockpit always updated.', tag: 'Wealth auto-sync', color: '#34D399' },
  ]

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>
                Email Intelligence
              </h1>
              <span style={{
                background: 'rgba(245, 166, 35, 0.15)', color: '#F5A623',
                fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                border: '1px solid rgba(245, 166, 35, 0.3)', textTransform: 'uppercase', letterSpacing: 0.5
              }}>
                Coming Soon
              </span>
            </div>
            <p className="body-s text-secondary">Your inbox, decoded by AI ✨</p>
          </div>
        </div>

        {/* Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
          borderRadius: 24, padding: 28, marginBottom: 24, color: 'white', textAlign: 'center',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)',
            borderRadius: '50%'
          }} />

          <div style={{ fontSize: 50, marginBottom: 12 }}>📬</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8, color: '#FFFFFF' }}>
            Zero-Effort Inbox Automation
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, maxWidth: 330, margin: '0 auto 20px' }}>
            Gmail integration is currently undergoing Google's sensitive-scope CASA Tier-2 security review. Once approved, Viya will securely read receipts, deliveries, and meeting invites.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleNotify}
              disabled={notified}
              style={{
                padding: '12px 24px', borderRadius: 30, fontSize: 13, fontWeight: 800,
                background: notified ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(135deg, #00E5B0 0%, #00B4D8 100%)',
                color: notified ? '#34D399' : '#050508', border: notified ? '1px solid #34D399' : 'none',
                cursor: notified ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: notified ? 'none' : '0 4px 16px rgba(0, 229, 176, 0.3)', transition: 'all 0.3s ease'
              }}
            >
              {notified ? <><CheckCircle2 size={16} /> Notification Enabled</> : <><BellRing size={16} /> Notify Me When Live</>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>
              <ShieldCheck size={14} color="#34D399" /> Bank-grade AES-256 encryption • Read-only access
            </div>
          </div>
        </div>

        {/* Feature Preview List */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            ⚡ What Viya Will Detect For You
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 18, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: f.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {f.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.title}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: f.color, background: f.color + '18', padding: '2px 6px', borderRadius: 6 }}>
                      {f.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Action Card */}
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--primary)',
          borderRadius: 18, padding: 18, textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
            💬 Log Bills & Events Instantly in Chat
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 14, maxWidth: 300, margin: '0 auto 14px' }}>
            You can already tell Viya e.g. <span style={{ color: 'var(--text)', fontWeight: 600 }}>"Electricity bill ₹1200 due on 15th"</span> or scan a receipt photo!
          </div>
          <button
            className="btn-primary"
            onClick={() => nav('/chat')}
            style={{ padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <MessageSquare size={14} /> Open AI Chat
          </button>
        </div>
      </div>
    </PageTransition>
  )
}
