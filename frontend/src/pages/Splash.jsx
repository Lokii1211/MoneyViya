import { useState, useEffect } from 'react'
import '../design-system.css'

export default function Splash({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150)  // Orb pops
    const t2 = setTimeout(() => setPhase(2), 500)  // Rings + text
    const t3 = setTimeout(() => setPhase(3), 700)  // Tagline
    const t4 = setTimeout(() => {                   // Progress bar
      setPhase(4)
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100 }
          return p + 4
        })
      }, 25)
      return () => clearInterval(interval)
    }, 900)
    const t5 = setTimeout(() => { setPhase(5); onComplete?.() }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #0A0019 0%, #001917 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 5 ? 0 : 1, transition: 'opacity 0.3s ease',
    }}>
      {/* Pulse Rings */}
      {phase >= 2 && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', width: 96, height: 96, borderRadius: '50%',
          border: '1.5px solid rgba(0,229,212,0.2)',
          animation: `pulseRing 2s ease-out ${i * 0.25}s infinite`,
        }} />
      ))}

      {/* Viya Orb */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, #00E5D4 0%, #6B00FF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(0,229,212,0.3), 0 8px 24px rgba(0,229,212,0.3)',
        transform: phase === 0 ? 'scale(0)' : phase === 1 ? 'scale(1.15)' : 'scale(1)',
        opacity: phase === 0 ? 0 : 1,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
      }}>
        <img src="/logo.png" alt="Viya" style={{
          width: 64, height: 64, objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.3))',
        }} />
      </div>

      {/* VIYA text */}
      <div style={{
        marginTop: 20, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 36,
        color: 'white', letterSpacing: 4, textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s ease',
      }}>VIYA</div>

      {/* Tagline */}
      <div style={{
        marginTop: 8, fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: 'rgba(255,255,255,0.6)', fontWeight: 400,
        opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s ease',
      }}>AI Life & Wealth Partner</div>

      {/* Progress Bar */}
      <div style={{
        position: 'absolute', bottom: 60, width: 100, height: 2, borderRadius: 99,
        background: 'rgba(255,255,255,0.15)', overflow: 'hidden',
        opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.2s',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(135deg, #00E5D4, #6B00FF)',
          width: `${progress}%`, transition: 'width 0.04s linear',
        }} />
      </div>

      {/* Powered by */}
      <div style={{
        position: 'absolute', bottom: 36, fontSize: 10, fontWeight: 500,
        letterSpacing: 0.5, color: 'rgba(255,255,255,0.25)',
        opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.3s',
      }}>Powered by AI</div>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
