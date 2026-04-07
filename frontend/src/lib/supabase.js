import { createClient } from '@supabase/supabase-js'

// Supabase (when configured)
const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = url ? createClient(url, key) : null

// API Base — empty string uses Vite proxy (/api/* → localhost:8000)
const API = import.meta.env.VITE_API_URL || ''

// Helper
async function post(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return r.json()
}
async function get(path) {
  const r = await fetch(API + path)
  return r.ok ? r.json() : null
}

export const api = {
  base: API,

  // ===== AUTH =====
  login: (phone, password) => post('/api/auth/login', { phone, password }),
  register: (phone, password) => post('/api/auth/register', { phone, password }),

  // ===== CORE =====
  getUser: (phone) => get(`/api/moneyview/user/${phone}`),
  chat: (phone, message) => post('/api/moneyview/process', { phone, message, sender_name: 'App' }),

  // ===== LIFE AGENTS =====
  getHabits: (phone) => get(`/api/moneyview/life/habits/${phone}`),
  getGoals: (phone) => get(`/api/moneyview/life/goals/${phone}`),
  getReview: (phone, period) => post('/api/moneyview/process', { phone, message: `${period} review`, sender_name: 'App' }),

  // ===== TRANSACTIONS =====
  addExpense: (phone, amount, category, note) =>
    post('/api/moneyview/process', { phone, message: `spent ${amount} on ${category} ${note || ''}`.trim(), sender_name: 'App' }),
  addIncome: (phone, amount, source) =>
    post('/api/moneyview/process', { phone, message: `received ${amount} as ${source}`, sender_name: 'App' }),
  getTransactions: (phone) => get(`/api/moneyview/user/${phone}`),

  // ===== FOUNDER EDITION =====
  subscriptionAudit: (phone) => get(`/api/moneyview/founder/subscriptions/${phone}`),
  explainConcept: (concept) => post('/api/moneyview/founder/explain', { concept }),
  purchaseDecision: (phone, item, price) => post('/api/moneyview/founder/purchase-decision', { phone, item, price }),
  morningBrief: (phone) => get(`/api/moneyview/founder/morning/${phone}`),
  eveningCheckin: (phone) => get(`/api/moneyview/founder/evening/${phone}`),
  salaryDetect: (phone, amount) => post('/api/moneyview/founder/salary-detect', { phone, amount }),
  getReminders: (phone) => get(`/api/moneyview/founder/reminders/${phone}`),
  coupleLink: (phone1, phone2) => post('/api/moneyview/founder/couple', { phone1, phone2, action: 'link' }),
  coupleStatus: (phone) => post('/api/moneyview/founder/couple', { phone1: phone, phone2: '', action: 'status' }),

  // ===== HEALTH =====
  health: () => get('/api/moneyview/health'),
}
