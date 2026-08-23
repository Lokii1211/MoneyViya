import { describe, it, expect } from 'vitest'
import { formatINR, formatINRShort, formatPhone, streakText, getCategoryIcon } from '../lib/utils.js'

describe('Utility Functions', () => {
  it('formats Indian Rupees with proper comma grouping', () => {
    expect(formatINR(0)).toBe('₹0')
    expect(formatINR(500)).toBe('₹500')
    expect(formatINR(1500)).toBe('₹1,500')
    expect(formatINR(150000)).toBe('₹1,50,000')
    expect(formatINR(10000000)).toBe('₹1,00,00,000')
    expect(formatINR(-500)).toBe('-₹500')
    expect(formatINR(500, true)).toBe('+₹500')
  })

  it('formats short currency representations', () => {
    expect(formatINRShort(500)).toBe('₹500')
    expect(formatINRShort(5000)).toBe('₹5.0K')
    expect(formatINRShort(250000)).toBe('₹2.5L')
    expect(formatINRShort(15000000)).toBe('₹1.5Cr')
  })

  it('formats Indian phone numbers cleanly', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210')
    expect(formatPhone('919876543210')).toBe('+91 98765 43210')
    expect(formatPhone('+91 98765 43210')).toBe('+91 98765 43210')
  })

  it('provides habit streak motivational labels', () => {
    expect(streakText(0)).toBe('')
    expect(streakText(1)).toBe('✨ Started!')
    expect(streakText(5)).toBe('🔥 Building!')
    expect(streakText(10)).toBe('🔥 Great!')
    expect(streakText(20)).toBe('🔥 On fire!')
    expect(streakText(45)).toBe('🔥 Legendary!')
  })

  it('returns appropriate category emojis', () => {
    expect(getCategoryIcon('Food')).toBe('🍔')
    expect(getCategoryIcon('Transport')).toBe('🚗')
    expect(getCategoryIcon('Shopping')).toBe('🛍️')
    expect(getCategoryIcon('Bills & Utilities')).toBe('📱')
    expect(getCategoryIcon('Investment')).toBe('📈')
    expect(getCategoryIcon('UnknownCategory')).toBe('💳')
  })
})
