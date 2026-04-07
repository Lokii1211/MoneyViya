import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = (url && key) ? createClient(url, key) : null

const API = import.meta.env.VITE_API_URL || ''

async function post(path, body) {
  try {
    const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return r.ok ? r.json() : { success: false, reply: 'Server unavailable' }
  } catch { return { success: false, reply: 'Cannot reach server' } }
}
async function get(path) {
  try { const r = await fetch(API + path); return r.ok ? r.json() : null } catch { return null }
}

// Direct Supabase queries (works on Vercel without backend)
const db = {
  async getUser(phone) {
    if (!supabase) return null
    const { data } = await supabase.from('users').select('*').eq('phone', phone).single()
    return data
  },
  async createUser(phone, hash) {
    if (!supabase) return null
    const { data } = await supabase.from('users').upsert({ phone, password_hash: hash }).select().single()
    return data
  },
  async getTransactions(phone, limit = 30) {
    if (!supabase) return []
    const { data } = await supabase.from('transactions').select('*').eq('phone', phone).order('created_at', { ascending: false }).limit(limit)
    return data || []
  },
  async addTransaction(phone, type, amount, category, desc) {
    if (!supabase) return null
    const { data } = await supabase.from('transactions').insert({ phone, type, amount, category, description: desc }).select().single()
    return data
  },
  async getGoals(phone) {
    if (!supabase) return []
    const { data } = await supabase.from('goals').select('*').eq('phone', phone).eq('status', 'active')
    return data || []
  },
  async getHabits(phone) {
    if (!supabase) return []
    const { data } = await supabase.from('habits').select('*').eq('phone', phone)
    return data || []
  },
  async getNotifications(phone) {
    if (!supabase) return []
    const { data } = await supabase.from('notifications').select('*').eq('phone', phone).order('created_at', { ascending: false }).limit(20)
    return data || []
  }
}

export const api = {
  base: API, db, supabase,

  // AUTH — Try API first, fallback to Supabase direct
  async login(phone, password) {
    const r = await post('/api/auth/login', { phone, password })
    if (r.success) return r
    // Fallback: check Supabase directly
    const user = await db.getUser(phone)
    if (user && user.password_hash === password) return { success: true, token: 'local_' + phone, user }
    return { success: false, message: 'Invalid credentials' }
  },
  async register(phone, password) {
    const r = await post('/api/auth/register', { phone, password })
    if (r.success) return r
    // Fallback
    const existing = await db.getUser(phone)
    if (existing) return { success: false, message: 'Account exists' }
    await db.createUser(phone, password)
    return { success: true, message: 'Account created! Sign in now.' }
  },

  // CORE — Try API first, fallback to Supabase
  async getUser(phone) {
    const r = await get(`/api/moneyview/user/${phone}`)
    if (r) return r
    const user = await db.getUser(phone)
    if (user) {
      const txns = await db.getTransactions(phone, 10)
      return { ...user, recent_transactions: txns }
    }
    return null
  },
  chat: (phone, message) => post('/api/moneyview/process', { phone, message, sender_name: 'App' }),

  getHabits: (phone) => db.getHabits(phone),
  getGoals: (phone) => db.getGoals(phone),
  getTransactions: (phone) => db.getTransactions(phone),
  getNotifications: (phone) => db.getNotifications(phone),

  addExpense: (phone, amount, category, note) =>
    post('/api/moneyview/process', { phone, message: `spent ${amount} on ${category} ${note || ''}`.trim(), sender_name: 'App' }),

  // FOUNDER
  subscriptionAudit: (phone) => get(`/api/moneyview/founder/subscriptions/${phone}`),
  explainConcept: (concept) => post('/api/moneyview/founder/explain', { concept }),
  morningBrief: (phone) => get(`/api/moneyview/founder/morning/${phone}`),
  health: () => get('/api/moneyview/health'),
}
