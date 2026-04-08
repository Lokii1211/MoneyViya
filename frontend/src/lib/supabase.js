import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = (url && key) ? createClient(url, key) : null

// Direct REST API — guaranteed to work with any key format
const REST = url ? `${url}/rest/v1` : ''
const hdrs = () => ({
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
})

async function query(table, params = '') {
  if (!REST) return []
  try {
    const r = await fetch(`${REST}/${table}${params}`, { headers: hdrs() })
    return r.ok ? await r.json() : []
  } catch { return [] }
}

async function insert(table, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}`, {
      method: 'POST', headers: { ...hdrs(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    })
    const res = await r.json()
    return Array.isArray(res) ? res[0] : res
  } catch { return null }
}

async function upsert(table, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}`, {
      method: 'POST',
      headers: { ...hdrs(), 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(data)
    })
    const res = await r.json()
    return Array.isArray(res) ? res[0] : res
  } catch { return null }
}

// ===== DATABASE OPS =====
const db = {
  getUser: (phone) => query('users', `?phone=eq.${phone}&select=*`).then(d => d[0] || null),
  createUser: (phone, hash, name = 'User') => upsert('users', { phone, password_hash: hash, name }),
  getTransactions: (phone, limit = 30) => query('transactions', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=${limit}`),
  getGoals: (phone) => query('goals', `?phone=eq.${phone}&select=*`),
  getHabits: (phone) => query('habits', `?phone=eq.${phone}&select=*`),
  getNotifications: (phone) => query('notifications', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=20`),
  addTransaction: (phone, type, amount, category, desc) => insert('transactions', { phone, type, amount, category, description: desc }),
}

// ===== API =====
export const api = {
  db, supabase,

  // AUTH — 100% Supabase direct (no backend needed)
  async login(phone, password) {
    try {
      const user = await db.getUser(phone)
      if (!user) return { success: false, message: 'Account not found. Please register first.' }
      if (user.password_hash !== password) return { success: false, message: 'Wrong password. Try again.' }
      localStorage.setItem('mv_token', 'sb_' + phone)
      localStorage.setItem('mv_phone', phone)
      return { success: true, token: 'sb_' + phone, user }
    } catch (e) {
      console.error('Login error:', e)
      return { success: false, message: 'Connection error. Please try again.' }
    }
  },

  async register(phone, password, name = 'User') {
    try {
      const existing = await db.getUser(phone)
      if (existing) return { success: false, message: 'Account already exists. Please sign in.' }
      await db.createUser(phone, password, name)
      return { success: true, message: 'Account created! Sign in now.' }
    } catch (e) {
      console.error('Register error:', e)
      return { success: false, message: 'Connection error. Please try again.' }
    }
  },

  async getUser(phone) {
    const user = await db.getUser(phone)
    if (!user) return null
    const txns = await db.getTransactions(phone, 10)
    return { ...user, recent_transactions: txns }
  },

  // Chat — try backend, fallback to just returning a message
  async chat(phone, message) {
    try {
      const r = await fetch('/api/moneyview/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, sender_name: 'App' })
      })
      if (r.ok) return r.json()
    } catch {}
    return { reply: 'Chat is available on WhatsApp! Message the bot for AI-powered financial advice. 💬' }
  },

  getHabits: (phone) => db.getHabits(phone),
  getGoals: (phone) => db.getGoals(phone),
  getTransactions: (phone) => db.getTransactions(phone),
  getNotifications: (phone) => db.getNotifications(phone),

  async addExpense(phone, amount, category, note) {
    return db.addTransaction(phone, 'expense', amount, category, note)
  },
  async addIncome(phone, amount, source) {
    return db.addTransaction(phone, 'income', amount, source, source)
  },
}
