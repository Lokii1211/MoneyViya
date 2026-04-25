import { useState, useEffect } from 'react'
import '../design-system.css'

export default function Splash({ onComplete }) {
  const [phase, setPhase] = useState(0) // 0=logo, 1=text, 2=bar, 3=done
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100 }
          return p + 5
        })
      }, 30)
      return () => clearInterval(interval)
    }, 900)
    const t4 = setTimeout(() => { setPhase(3); onComplete?.() }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #0D0D2B 0%, #1A0633 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 3 ? 0 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{
        width: 110, height: 110, borderRadius: 28,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 40px rgba(0, 176, 182, 0.35), 0 0 80px rgba(100,34,204,0.15)',
        border: '1px solid rgba(255,255,255,0.1)',
        transform: phase === 0 ? 'scale(0.3)' : phase === 1 ? 'scale(1)' : 'scale(1)',
        opacity: phase === 0 ? 0 : 1,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}>
        <img src="/logo.png" alt="Viya" style={{
          width: 88, height: 88, objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(0,176,182,0.4))',
        }} />
      </div>

      {/* Brand Text */}
      <div style={{
        marginTop: 20,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease 0.2s',
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 32,
          color: 'white', letterSpacing: -0.5, textAlign: 'center',
        }}>VIYA</div>
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s ease 0.1s',
        fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)',
        fontWeight: 400, letterSpacing: 0.5,
      }}>Your AI Second Brain</div>

      {/* Loading Bar */}
      <div style={{
        position: 'absolute', bottom: 32,
        width: 120, height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(135deg, #00B0B6, #6422CC)',
          width: `${progress}%`,
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  )
}
