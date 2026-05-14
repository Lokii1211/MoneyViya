import { useState, useEffect } from 'react'
import '../design-system.css'

export default function Splash({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)

  const statuses = ['Organizing', 'Learning', 'Optimizing']

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200)   // Logo appears
    const t2 = setTimeout(() => setPhase(2), 600)   // Text appears
    const t3 = setTimeout(() => setPhase(3), 900)   // Progress bar
    const t4 = setTimeout(() => setPhase(4), 1100)  // Status text

    // Progress bar animation
    const progressTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100 }
          return p + 3
        })
      }, 20)
      return () => clearInterval(interval)
    }, 1000)

    // Rotate status text
    const statusTimer = setInterval(() => {
      setStatusIdx(i => (i + 1) % 3)
    }, 400)

    const t5 = setTimeout(() => { setPhase(5); onComplete?.() }, 2200)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5)
      clearTimeout(progressTimer); clearInterval(statusTimer)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #080015 0%, #0a1628 40%, #0d1f20 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 5 ? 0 : 1, transition: 'opacity 0.4s ease',
      overflow: 'hidden',
    }}>

      {/* Neural network dots/lines background */}
      <svg viewBox="0 0 400 400" style={{
        position: 'absolute', width: 360, height: 360, opacity: phase >= 1 ? 0.25 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(0,229,212,0.08)" strokeWidth="1" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0,229,212,0.06)" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(100,100,255,0.05)" strokeWidth="0.5" />
        {/* Constellation dots */}
        {[
          [80, 120], [140, 60], [260, 70], [320, 130], [340, 210],
          [310, 300], [200, 350], [100, 310], [60, 230], [160, 150],
          [240, 140], [280, 200], [250, 280], [150, 270], [120, 200],
          [200, 100], [300, 160], [180, 310], [90, 170], [330, 270],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="2.5" fill="rgba(0,180,220,0.4)"
              style={{ animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite` }}
            />
          </g>
        ))}
        {/* Connection lines */}
        {[
          [80, 120, 140, 60], [140, 60, 260, 70], [260, 70, 320, 130],
          [320, 130, 340, 210], [340, 210, 310, 300], [310, 300, 200, 350],
          [200, 350, 100, 310], [100, 310, 60, 230], [60, 230, 80, 120],
          [160, 150, 240, 140], [240, 140, 280, 200], [280, 200, 250, 280],
          [250, 280, 150, 270], [150, 270, 120, 200], [120, 200, 160, 150],
          [200, 100, 300, 160], [90, 170, 180, 310], [330, 270, 280, 200],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(0,180,220,0.12)" strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Glowing circle behind logo */}
      <div style={{
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,180,220,0.08) 0%, transparent 70%)',
        position: 'absolute',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }} />

      {/* Logo — infinity icon (no circle bg) */}
      <div style={{
        position: 'relative', zIndex: 2,
        transform: phase === 0 ? 'scale(0.5)' : phase === 1 ? 'scale(1.08)' : 'scale(1)',
        opacity: phase === 0 ? 0 : 1,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}>
        <img src="/logo.png" alt="Viya AI" style={{
          width: 140, height: 140, objectFit: 'contain',
          filter: 'drop-shadow(0 0 30px rgba(0,180,220,0.4)) drop-shadow(0 0 60px rgba(0,229,212,0.15))',
        }} />
      </div>

      {/* "Viya AI" text */}
      <div style={{
        marginTop: 16, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28,
        color: 'white', letterSpacing: 2, textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.4s ease',
      }}>Viya AI</div>

      {/* Tagline */}
      <div style={{
        marginTop: 6, fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: 'rgba(255,255,255,0.5)', fontWeight: 400,
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.4s ease 0.1s',
      }}>Your second brain.</div>

      {/* "Preparing your second brain..." */}
      <div style={{
        marginTop: 40, fontSize: 15, fontWeight: 500,
        color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif",
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>Preparing your second brain...</div>

      {/* Progress Bar */}
      <div style={{
        marginTop: 14, width: 200, height: 4, borderRadius: 99,
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.2s',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #0066FF 0%, #00CCAA 50%, #00E5D4 100%)',
          width: `${progress}%`, transition: 'width 0.03s linear',
          boxShadow: '0 0 12px rgba(0,204,170,0.5)',
        }} />
      </div>

      {/* Status dots: Organizing • Learning • Optimizing */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 400,
        fontFamily: "'Inter', sans-serif",
        opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        {statuses.map((s, i) => (
          <span key={i} style={{
            color: statusIdx === i ? 'rgba(0,204,170,0.8)' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s ease',
            fontWeight: statusIdx === i ? 600 : 400,
          }}>
            {i > 0 && <span style={{ margin: '0 4px', color: 'rgba(255,255,255,0.2)' }}>•</span>}
            {s}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
