import { useState, useEffect, useRef } from 'react'

// ===== COUNTING ANIMATION HOOK =====
// Animates a number from 0 to target over duration
export function useCountUp(target, duration = 800, startOnMount = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!startOnMount || target === 0) { setValue(target); return }
    
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    
    startRef.current = null
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, startOnMount])

  return value
}

// ===== FESTIVAL THEME DETECTION =====
// Returns current Indian festival with theme colors
export function getCurrentFestival() {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-based
  const day = now.getDate()
  
  // Major Indian festivals (approximate dates — vary each year)
  const festivals = [
    // Diwali season (Oct-Nov)
    { name: 'Diwali', emoji: '🪔', check: () => (month === 10 && day >= 20) || (month === 11 && day <= 15), 
      colors: { primary: '#FFD700', accent: '#FF6B35', bg: 'linear-gradient(135deg, #1a0a2e, #2d1b69)', greeting: 'Happy Diwali! 🪔✨' }},
    // Holi (March)
    { name: 'Holi', emoji: '🎨', check: () => month === 3 && day >= 20 && day <= 30,
      colors: { primary: '#FF1493', accent: '#00FF7F', bg: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)', greeting: 'Happy Holi! 🎨🌈' }},
    // New Year (Jan 1-3)
    { name: 'New Year', emoji: '🎉', check: () => month === 1 && day <= 3,
      colors: { primary: '#FFD700', accent: '#00D4FF', bg: 'linear-gradient(135deg, #0c0c1d, #1a1a3e)', greeting: 'Happy New Year! 🎉' }},
    // Republic Day (Jan 26)
    { name: 'Republic Day', emoji: '🇮🇳', check: () => month === 1 && day === 26,
      colors: { primary: '#FF9933', accent: '#138808', bg: 'linear-gradient(135deg, #FF9933, #FFFFFF, #138808)', greeting: 'Happy Republic Day! 🇮🇳' }},
    // Independence Day (Aug 15)
    { name: 'Independence Day', emoji: '🇮🇳', check: () => month === 8 && day === 15,
      colors: { primary: '#FF9933', accent: '#138808', bg: 'linear-gradient(135deg, #FF9933, #fff, #138808)', greeting: 'Happy Independence Day! 🇮🇳' }},
    // Navratri (Oct)
    { name: 'Navratri', emoji: '🪘', check: () => month === 10 && day >= 3 && day <= 12,
      colors: { primary: '#E94B3C', accent: '#FFD700', bg: 'linear-gradient(135deg, #8B0000, #FF4500)', greeting: 'Happy Navratri! 🪘' }},
    // Christmas (Dec 24-26)
    { name: 'Christmas', emoji: '🎄', check: () => month === 12 && day >= 24 && day <= 26,
      colors: { primary: '#C41E3A', accent: '#228B22', bg: 'linear-gradient(135deg, #1a3a1a, #2d0f0f)', greeting: 'Merry Christmas! 🎄' }},
    // Ganesh Chaturthi (Sep)
    { name: 'Ganesh Chaturthi', emoji: '🙏', check: () => month === 9 && day >= 5 && day <= 15,
      colors: { primary: '#FF6B35', accent: '#FFD700', bg: 'linear-gradient(135deg, #FF6B35, #FFA07A)', greeting: 'Ganpati Bappa Morya! 🙏' }},
    // Pongal / Makar Sankranti (Jan 14-16)
    { name: 'Pongal', emoji: '🌾', check: () => month === 1 && day >= 14 && day <= 16,
      colors: { primary: '#FF9933', accent: '#228B22', bg: 'linear-gradient(135deg, #FFD700, #FF9933)', greeting: 'Happy Pongal! 🌾' }},
  ]
  
  return festivals.find(f => f.check()) || null
}

// ===== INDIAN NUMBER FORMAT =====
export function formatINR(num) {
  if (num === undefined || num === null) return '₹0'
  const abs = Math.abs(Number(num))
  if (abs >= 10000000) return `₹${(abs/10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `₹${(abs/100000).toFixed(1)}L`
  return `₹${abs.toLocaleString('en-IN')}`
}

// ===== SAVINGS RATE SCORE =====
export function getSavingsGrade(income, expenses) {
  if (income <= 0) return { grade: '?', color: 'var(--text3)', msg: 'Add income to see your grade' }
  const rate = ((income - expenses) / income) * 100
  if (rate >= 30) return { grade: 'A+', color: '#00D084', msg: 'Outstanding! You\'re a savings machine! 🏆' }
  if (rate >= 20) return { grade: 'A', color: '#00D084', msg: 'Excellent savings rate! Keep it up! 💪' }
  if (rate >= 10) return { grade: 'B', color: '#FFD700', msg: 'Good, but aim for 20%+ savings rate 📈' }
  if (rate >= 0) return { grade: 'C', color: '#FF9933', msg: 'Try to cut 1-2 unnecessary expenses 🤔' }
  return { grade: 'D', color: '#FF3366', msg: 'Spending more than earning — let\'s fix this! ⚠️' }
}
