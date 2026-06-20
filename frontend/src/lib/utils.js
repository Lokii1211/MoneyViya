// Indian number format: ₹1,50,000
export function formatINR(num, showSign = false) {
  if (num == null || isNaN(num)) return '₹0'
  const n = Number(num), abs = Math.abs(n)
  const sign = n < 0 ? '-' : (showSign && n > 0 ? '+' : '')
  const str = abs.toFixed(0)
  if (str.length <= 3) return `${sign}₹${str}`
  const last3 = str.slice(-3), rest = str.slice(0, -3)
  return `${sign}₹${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`
}
export function formatINRShort(num) {
  const n = Math.abs(Number(num))
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'; if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'; return 'Good evening'
}
export function getGreetingEmoji() {
  const h = new Date().getHours()
  if (h < 5) return '🌙'; if (h < 12) return '☀️'; if (h < 17) return '🌤️'; return '🌙'
}
export function timeAgo(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'Just now'; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; if (diff < 172800) return 'Yesterday'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
export function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '' }
export function formatTime(d) { return d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : '' }
export function getCategoryIcon(c) {
  const m = { 'Food & Dining':'🍔','Food':'🍔','food':'🍔','Transport':'🚗','transport':'🚗','Shopping':'🛍️','shopping':'🛍️','Groceries':'🥦','groceries':'🥦','Health':'💊','health':'💊','Entertainment':'🎬','entertainment':'🎬','Bills & Utilities':'📱','bills':'📱','Education':'📚','education':'📚','Travel':'✈️','travel':'✈️','Finance':'📊','finance':'📊','Family':'👨‍👩‍👧','family':'👨‍👩‍👧','Income':'💰','income':'💰','Rent':'🏠','rent':'🏠','Investment':'📈' }
  return m[c] || '💳'
}
export function getCategoryColor(c) {
  const m = { 'Food & Dining':'#FF6B6B','Food':'#FF6B6B','food':'#FF6B6B','Transport':'#4ECDC4','transport':'#4ECDC4','Shopping':'#A78BFA','shopping':'#A78BFA','Groceries':'#34D399','groceries':'#34D399','Health':'#F472B6','health':'#F472B6','Entertainment':'#FBBF24','entertainment':'#FBBF24','Bills & Utilities':'#60A5FA','bills':'#60A5FA','Education':'#818CF8' }
  return m[c] || '#94A3B8'
}
export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }
export function haptic(type = 'light') { if (navigator.vibrate) navigator.vibrate({ light: 10, medium: 25, heavy: 50 }[type] || 10) }
export function formatPhone(p) { const c = p?.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10) || ''; return c.length === 10 ? `+91 ${c.slice(0, 5)} ${c.slice(5)}` : p || '' }
export function streakText(s) { if (s >= 30) return '🔥 Legendary!'; if (s >= 14) return '🔥 On fire!'; if (s >= 7) return '🔥 Great!'; if (s >= 3) return '🔥 Building!'; return s > 0 ? '✨ Started!' : '' }

// Animated count-up hook
import { useState, useEffect, useRef } from 'react'
export function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current, diff = target - start
    if (diff === 0) return
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setVal(Math.round(start + diff * eased))
      if (progress >= 1) { clearInterval(timer); prev.current = target }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return val
}

// Indian festival detection
export function getCurrentFestival() {
  const now = new Date()
  const m = now.getMonth() + 1, d = now.getDate()
  const festivals = [
    { month: 1, day: 1, name: 'New Year', emoji: '🎉', greeting: 'Happy New Year!', colors: { bg: 'linear-gradient(135deg,#667eea,#764ba2)' } },
    { month: 1, day: 14, name: 'Makar Sankranti', emoji: '🪁', greeting: 'Happy Makar Sankranti!', colors: { bg: 'linear-gradient(135deg,#f093fb,#f5576c)' } },
    { month: 1, day: 15, name: 'Pongal', emoji: '🍚', greeting: 'Happy Pongal!', colors: { bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' } },
    { month: 1, day: 26, name: 'Republic Day', emoji: '🇮🇳', greeting: 'Happy Republic Day!', colors: { bg: 'linear-gradient(135deg,#ff6a00,#138808)' } },
    { month: 3, day: 8, name: 'Women\'s Day', emoji: '👩', greeting: 'Happy Women\'s Day!', colors: { bg: 'linear-gradient(135deg,#f093fb,#f5576c)' } },
    { month: 3, day: 25, name: 'Holi', emoji: '🎨', greeting: 'Happy Holi!', colors: { bg: 'linear-gradient(135deg,#f5af19,#f12711)' } },
    { month: 8, day: 15, name: 'Independence Day', emoji: '🇮🇳', greeting: 'Jai Hind!', colors: { bg: 'linear-gradient(135deg,#ff6a00,#138808)' } },
    { month: 10, day: 2, name: 'Gandhi Jayanti', emoji: '🕊️', greeting: 'Happy Gandhi Jayanti!', colors: { bg: 'linear-gradient(135deg,#667eea,#764ba2)' } },
    { month: 10, day: 12, name: 'Dussehra', emoji: '🏹', greeting: 'Happy Dussehra!', colors: { bg: 'linear-gradient(135deg,#f093fb,#f5576c)' } },
    { month: 10, day: 31, name: 'Diwali', emoji: '🪔', greeting: 'Happy Diwali!', colors: { bg: 'linear-gradient(135deg,#f5af19,#f12711)' } },
    { month: 11, day: 1, name: 'Diwali', emoji: '🪔', greeting: 'Happy Diwali!', colors: { bg: 'linear-gradient(135deg,#f5af19,#f12711)' } },
    { month: 12, day: 25, name: 'Christmas', emoji: '🎄', greeting: 'Merry Christmas!', colors: { bg: 'linear-gradient(135deg,#11998e,#38ef7d)' } },
  ]
  const today = festivals.find(f => f.month === m && Math.abs(f.day - d) <= 1)
  return today || null
}
