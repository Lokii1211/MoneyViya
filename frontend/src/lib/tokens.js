/**
 * Viya Design Tokens — PRD Section 3.6
 * Centralized token system for all design values.
 * Access via: import { tokens } from './tokens'
 */

export const tokens = {
  // ─── Color Palette ───
  color: {
    // Brand
    primary: { light: '#00B870', dark: '#00D084' },
    primaryDim: { light: 'rgba(0,184,112,0.08)', dark: 'rgba(0,208,132,0.12)' },
    primaryGlow: { light: 'rgba(0,184,112,0.20)', dark: 'rgba(0,208,132,0.25)' },

    // Emotional Moods (PRD 3.1)
    money: '#00B870',    // emerald/gold → abundance
    health: '#FF6B6B',   // warm → energy
    alert: '#F97316',    // coral/amber → urgency
    achievement: '#F59E0B', // gold → dopamine

    // Semantic
    success: '#00C853',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',

    // Neutrals
    text: { light: '#111827', dark: '#F5F5F7' },
    textSecondary: { light: '#6B7280', dark: '#A0A0B0' },
    textTertiary: { light: '#9CA3AF', dark: '#606070' },
    surface: { light: '#FFFFFF', dark: '#111118' },
    background: { light: '#F8F9FB', dark: '#050508' },

    // WCAG 3.3: Brand teal safe for text on light bg
    brandTextSafe: '#008B6A', // 4.5:1 on white ✓
    brandTeal: '#00E5B0',     // ONLY for borders/icons/fills
  },

  // ─── Typography ───
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, system-ui, sans-serif",
      brand: "'Outfit', 'Inter', sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', monospace",
    },
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 22,
      '2xl': 28,
      '3xl': 38,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  // ─── Spacing ───
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },

  // ─── Border Radius ───
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },

  // ─── Shadows ───
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 30px rgba(0,0,0,0.10)',
    teal: '0 4px 24px rgba(0,184,112,0.20)',
  },

  // ─── Animation (PRD: Stripe-quality, under 300ms) ───
  animation: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'cubic-bezier(0.22, 1, 0.36, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  // ─── Z-Index Hierarchy ───
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 50,
    header: 50,
    nav: 100,
    fab: 160,
    toast: 200,
    overlay: 300,
    splash: 9999,
  },

  // ─── Touch Targets (PRD 3.3: 44pt iOS / 48dp Android min) ───
  touchTarget: {
    minimum: 44,      // Absolute minimum (WCAG)
    recommended: 48,   // Android Material
    primary: 56,       // Primary actions
    spacing: 8,        // Min gap between targets
  },

  // ─── Performance Budgets (PRD 3.4) ───
  performance: {
    jsBundle: '2MB',
    lazyChunk: '200KB',
    coldStart: '2500ms',
    warmStart: '800ms',
    apiResponse: '500ms',
    frameRate: 60,
    memoryMax: '200MB',
  },

  // ─── Festival Themes (PRD 3.6) ───
  festivals: {
    diwali: {
      accent: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF4500 100%)',
      emoji: '🪔',
    },
    holi: {
      accent: '#FF1493',
      gradient: 'linear-gradient(135deg, #FF1493 0%, #00FF7F 50%, #FFD700 100%)',
      emoji: '🎨',
    },
    newYear: {
      accent: '#FFD700',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      emoji: '🎆',
    },
  },
}

/**
 * Helper: Get theme-aware color
 * @param {string} colorKey - Key from tokens.color (e.g. 'primary')
 * @param {'light'|'dark'} theme - Current theme
 */
export function getColor(colorKey, theme = 'light') {
  const color = tokens.color[colorKey]
  if (typeof color === 'string') return color
  return color?.[theme] || color?.light || color
}

/**
 * Helper: Indian number formatting
 * PRD: "Indian number formatting mandatory everywhere"
 */
export function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount)}`
}

export default tokens
