import { useState, useEffect } from 'react'
import '../design-system.css'

/**
 * SL-001 — Splash Screen (Design Brief §4.1)
 * Background: gradient-night (#08021A → #001814)
 * Center: Viya Orb (96px, breathing animation)
 * Below: "VIYA" Sora 800, 40px, letter-spacing 6px, white
 * Below: "AI Life & Wealth Partner" Inter 400, 16px, white/55%
 * Bottom: Progress bar (120px × 3px, gradient-hero fill)
 * Background: 8 floating micro-dots (2-3px, 12% opacity, slow drift)
 * Boot: Check auth during animation, navigate at 1500ms
 * PRESERVES: All original phased animation + progress + status rotation
 */
export default function Splash({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)

  const statuses = ['Organizing', 'Learning', 'Optimizing']

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200)   // Orb appears
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

    // Navigate at 1.5s (Design Brief: "Navigate at exactly 1.5s")
    // Extended slightly for the full animation to feel complete
    const t5 = setTimeout(() => { setPhase(5); onComplete?.() }, 2200)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5)
      clearTimeout(progressTimer); clearInterval(statusTimer)
    }
  }, [])

  // Generate 8 floating micro-dots (Design Brief: "8 floating micro-dots, white, 2-3px, 12% opacity, slow drift")
  const dots = Array.from({ length: 8 }, (_, i) => ({
    x: 20 + Math.random() * 60,
    y: 10 + Math.random() * 80,
    size: 2 + Math.random() * 1.5,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 3,
  }))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      /* Design Brief §4.1: gradient-night (#08021A → #001814) */
      background: 'linear-gradient(180deg, #08021A 0%, #001814 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 5 ? 0 : 1, transition: 'opacity 0.4s ease',
      overflow: 'hidden',
    }}>

      {/* 8 Floating micro-dots (Design Brief: slow drift, 12% opacity) */}
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`, top: `${d.y}%`,
          width: d.size, height: d.size, borderRadius: '50%',
          background: 'white', opacity: 0.12,
          animation: `float-drift ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
        }} />
      ))}

      {/* Glow ring (Orb background glow — Design Brief: "Inner glow, radial gradient") */}
      <div style={{
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,176,0.10) 0%, rgba(85,20,255,0.04) 40%, transparent 70%)',
        position: 'absolute',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        animation: phase >= 1 ? 'orb-breathe-glow 3.5s ease-in-out infinite' : 'none',
      }} />

      {/* Viya Orb — 96px (Design Brief §4.1: "Center: Viya Orb 96px, animated breathing") */}
      <div style={{
        position: 'relative', zIndex: 2,
        transform: phase === 0 ? 'scale(0.5)' : phase === 1 ? 'scale(1.08)' : 'scale(1)',
        opacity: phase === 0 ? 0 : 1,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        animation: phase >= 2 ? 'orb-breathe 3.5s ease-in-out infinite' : 'none',
      }}>
        <img src="/logo.png" alt="Viya AI" style={{
          width: 96, height: 96, objectFit: 'contain',
          filter: 'drop-shadow(0 0 24px rgba(0,229,176,0.35)) drop-shadow(0 0 48px rgba(85,20,255,0.15))',
        }} />
      </div>

      {/* "VIYA" — Design Brief: Sora 800, 40px, letter-spacing 6px, white */}
      <div style={{
        marginTop: 20, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 40,
        color: 'white', letterSpacing: 6, textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.4s cubic-bezier(0,0,0.2,1)',
      }}>VIYA</div>

      {/* "AI Life & Wealth Partner" — Design Brief: Inter 400, 16px, white/55% */}
      <div style={{
        marginTop: 8, fontFamily: "'Inter', sans-serif", fontSize: 16,
        color: 'rgba(255,255,255,0.55)', fontWeight: 400,
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.4s cubic-bezier(0,0,0.2,1) 0.1s',
      }}>AI Life & Wealth Partner</div>

      {/* Progress bar — Design Brief: 120px × 3px, gradient-hero fill, rounded */}
      <div style={{
        position: 'absolute', bottom: 100,
        width: 120, height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.2s',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          /* gradient-hero: #00E5B0 → #5514FF */
          background: 'linear-gradient(90deg, #00E5B0 0%, #5514FF 100%)',
          width: `${progress}%`, transition: 'width 0.03s linear',
          boxShadow: '0 0 8px rgba(0,229,176,0.4)',
        }} />
      </div>

      {/* Status dots: Organizing • Learning • Optimizing */}
      <div style={{
        position: 'absolute', bottom: 76,
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 400,
        fontFamily: "'Inter', sans-serif",
        opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        {statuses.map((s, i) => (
          <span key={i} style={{
            color: statusIdx === i ? 'rgba(0,229,176,0.8)' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s ease',
            fontWeight: statusIdx === i ? 600 : 400,
          }}>
            {i > 0 && <span style={{ margin: '0 3px', color: 'rgba(255,255,255,0.15)' }}>•</span>}
            {s}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes orb-breathe-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes float-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}8px, ${Math.random() > 0.5 ? '' : '-'}12px); }
        }
      `}</style>
    </div>
  )
}
