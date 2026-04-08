import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = (url && key) ? createClient(url, key) : null

const API = import.meta.env.VITE_API_URL || ''

async function post(path, body) {
  try {
    const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return r.ok ? r.json() : { success: false }
  } catch { return { success: false } }
}
async function get(path) {
  try { const r = await fetch(API + path); return r.ok ? r.json() : null } catch { return null }
}

// Direct Supabase REST API (bypasses client library key issues)
const SUPABASE_REST = url ? `${url}/rest/v1` : ''

async function supaRest(table, method = 'GET', query = '', body = null) {
  if (!SUPABASE_REST || !key) return null
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : undefined,
  }
  // Remove undefined headers
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k])
  
  try {
    const r = await fetch(`${SUPABASE_REST}/${table}${query}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!r.ok) return null
    const data = await r.json()
    return data
  } catch { return null }
}

// DB operations via REST API
const db = {
  async getUser(phone) {
    // Try Supabase client first
    if (supabase) {
      const { data } = await supabase.from('users').select('*').eq('phone', phone).single()
      if (data) return data
    }
    // Fallback to REST
    const data = await supaRest('users', 'GET', `?phone=eq.${phone}&select=*`)
    return data && data.length > 0 ? data[0] : null
  },
  async createUser(phone, hash, name = 'User') {
    if (supabase) {
      const { data } = await supabase.from('users').upsert({ phone, password_hash: hash, name }).select().single()
      if (data) return data
    }
    const data = await supaRest('users', 'POST', '', { phone, password_hash: hash, name })
    return data && data.length > 0 ? data[0] : null
  },
  async getTransactions(phone, limit = 30) {
    if (supabase) {
      const { data } = await supabase.from('transactions').select('*').eq('phone', phone).order('created_at', { ascending: false }).limit(limit)
      if (data) return data
    }
    const data = await supaRest('transactions', 'GET', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=${limit}`)
    return data || []
  },
  async getGoals(phone) {
    if (supabase) {
      const { data } = await supabase.from('goals').select('*').eq('phone', phone)
      if (data) return data
    }
    return await supaRest('goals', 'GET', `?phone=eq.${phone}&select=*`) || []
  },
  async getHabits(phone) {
    if (supabase) {
      const { data } = await supabase.from('habits').select('*').eq('phone', phone)
      if (data) return data
    }
    return await supaRest('habits', 'GET', `?phone=eq.${phone}&select=*`) || []
  },
  async getNotifications(phone) {
    if (supabase) {
      const { data } = await supabase.from('notifications').select('*').eq('phone', phone).order('created_at', { ascending: false }).limit(20)
      if (data) return data
    }
    return await supaRest('notifications', 'GET', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=20`) || []
  }
}

export const api = {
  base: API, db, supabase,

  // AUTH
  async login(phone, password) {
    // Try backend API
    const r = await post('/api/auth/login', { phone, password })
    if (r.success) return r
    // Direct DB check
    const user = await db.getUser(phone)
    if (user && user.password_hash === password) {
      return { success: true, token: 'sb_' + phone, user }
    }
    return { success: false, message: 'Invalid phone number or password' }
  },
  async register(phone, password, name = 'User') {
    const r = await post('/api/auth/register', { phone, password })
    if (r.success) return r
    const existing = await db.getUser(phone)
    if (existing) return { success: false, message: 'Account already exists. Please sign in.' }
    await db.createUser(phone, password, name)
    return { success: true, message: 'Account created! Sign in now.' }
  },

  // CORE
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
  health: () => get('/api/moneyview/health'),
}
