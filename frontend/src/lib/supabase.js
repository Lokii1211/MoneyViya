const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const REST = url ? `${url}/rest/v1` : ''
const hdrs = () => ({ 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })

async function query(table, params = '') {
  if (!REST) return []
  try { const r = await fetch(`${REST}/${table}${params}`, { headers: hdrs() }); return r.ok ? await r.json() : [] } catch { return [] }
}
async function insert(table, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}`, { method: 'POST', headers: { ...hdrs(), 'Prefer': 'return=representation' }, body: JSON.stringify(data) })
    const res = await r.json(); return Array.isArray(res) ? res[0] : res
  } catch { return null }
}
async function update(table, filter, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}?${filter}`, { method: 'PATCH', headers: { ...hdrs(), 'Prefer': 'return=representation' }, body: JSON.stringify(data) })
    const res = await r.json(); return Array.isArray(res) ? res[0] : res
  } catch { return null }
}
async function remove(table, filter) {
  if (!REST) return false
  try { await fetch(`${REST}/${table}?${filter}`, { method: 'DELETE', headers: hdrs() }); return true } catch { return false }
}
async function upsert(table, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}`, { method: 'POST', headers: { ...hdrs(), 'Prefer': 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify(data) })
    const res = await r.json(); return Array.isArray(res) ? res[0] : res
  } catch { return null }
}

// ===== COMPLETE API =====
export const api = {
  // AUTH
  async login(phone, password) {
    try {
      const users = await query('users', `?phone=eq.${phone}&select=*`)
      const user = users[0]
      if (!user) return { success: false, message: 'Account not found. Register first.' }
      if (user.password_hash !== password) return { success: false, message: 'Wrong password.' }
      localStorage.setItem('mv_token', 'sb_' + phone)
      localStorage.setItem('mv_phone', phone)
      localStorage.setItem('mv_user', JSON.stringify(user))
      return { success: true, token: 'sb_' + phone, user }
    } catch { return { success: false, message: 'Connection error.' } }
  },
  async register(phone, password, name = 'User') {
    try {
      const existing = await query('users', `?phone=eq.${phone}&select=phone`)
      if (existing.length) return { success: false, message: 'Account exists. Sign in.' }
      await upsert('users', { phone, password_hash: password, name })
      return { success: true, message: 'Account created! Sign in now.' }
    } catch { return { success: false, message: 'Connection error.' } }
  },

  // USER
  async getUser(phone) {
    const users = await query('users', `?phone=eq.${phone}&select=*`)
    const user = users[0]
    if (!user) return null
    const txns = await query('transactions', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=10`)
    return { ...user, recent_transactions: txns }
  },
  async updateUser(phone, data) { return update('users', `phone=eq.${phone}`, data) },

  // TRANSACTIONS
  async getTransactions(phone, limit = 50) {
    return query('transactions', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=${limit}`)
  },
  async addExpense(phone, amount, category, note) {
    const r = await insert('transactions', { phone, type: 'expense', amount, category, description: note || '' })
    // Update user totals
    const txns = await query('transactions', `?phone=eq.${phone}&type=eq.expense&select=amount`)
    const total = txns.reduce((s, t) => s + Number(t.amount), 0)
    await update('users', `phone=eq.${phone}`, { monthly_expenses: total })
    return r
  },
  async addIncome(phone, amount, source) {
    const r = await insert('transactions', { phone, type: 'income', amount, category: source, description: source })
    const txns = await query('transactions', `?phone=eq.${phone}&type=eq.income&select=amount`)
    const total = txns.reduce((s, t) => s + Number(t.amount), 0)
    await update('users', `phone=eq.${phone}`, { monthly_income: total })
    return r
  },
  async deleteTransaction(id) { return remove('transactions', `id=eq.${id}`) },

  // GOALS
  async getGoals(phone) { return query('goals', `?phone=eq.${phone}&status=eq.active&select=*&order=created_at.desc`) },
  async addGoal(phone, name, emoji, target, deadline) {
    return insert('goals', { phone, name, emoji, target_amount: target, deadline, current_amount: 0 })
  },
  async updateGoal(id, data) { return update('goals', `id=eq.${id}`, data) },
  async deleteGoal(id) { return remove('goals', `id=eq.${id}`) },
  async addToGoal(id, amount) {
    const goals = await query('goals', `?id=eq.${id}&select=*`)
    const goal = goals[0]
    if (!goal) return null
    const newAmt = Number(goal.current_amount) + Number(amount)
    const status = newAmt >= Number(goal.target_amount) ? 'completed' : 'active'
    return update('goals', `id=eq.${id}`, { current_amount: newAmt, status })
  },

  // HABITS
  async getHabits(phone) { return query('habits', `?phone=eq.${phone}&select=*&order=created_at.asc`) },
  async addHabit(phone, name, emoji, category) {
    return insert('habits', { phone, name, emoji, category: category || 'general' })
  },
  async deleteHabit(id) {
    await remove('habit_checkins', `habit_id=eq.${id}`)
    return remove('habits', `id=eq.${id}`)
  },

  // HABIT CHECK-INS
  async getCheckins(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    return query('habit_checkins', `?phone=eq.${phone}&checked_date=eq.${d}&select=*`)
  },
  async checkinHabit(habitId, phone) {
    const today = new Date().toISOString().split('T')[0]
    // Check if already done
    const existing = await query('habit_checkins', `?habit_id=eq.${habitId}&checked_date=eq.${today}&select=*`)
    if (existing.length) {
      // Undo check-in
      await remove('habit_checkins', `habit_id=eq.${habitId}&checked_date=eq.${today}`)
      // Decrease streak
      const habits = await query('habits', `?id=eq.${habitId}&select=*`)
      if (habits[0]) await update('habits', `id=eq.${habitId}`, { streak: Math.max(0, (habits[0].streak || 0) - 1) })
      return { checked: false }
    }
    // Do check-in
    await insert('habit_checkins', { habit_id: habitId, phone, checked_date: today })
    // Increase streak
    const habits = await query('habits', `?id=eq.${habitId}&select=*`)
    if (habits[0]) {
      const newStreak = (habits[0].streak || 0) + 1
      const bestStreak = Math.max(newStreak, habits[0].best_streak || 0)
      await update('habits', `id=eq.${habitId}`, { streak: newStreak, best_streak: bestStreak })
    }
    return { checked: true }
  },

  // NOTIFICATIONS
  async getNotifications(phone) { return query('notifications', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=20`) },
  async markNotifRead(id) { return update('notifications', `id=eq.${id}`, { is_read: true }) },
  async clearNotifications(phone) { return remove('notifications', `phone=eq.${phone}`) },

  // CHAT — In-app AI chat using Groq via webhook
  async chat(phone, message) {
    try {
      // Save user message
      await insert('chat_history', { phone, role: 'user', content: message, source: 'app' })
      // Call our webhook with chat action
      const r = await fetch(`/api/webhook?action=chat&phone=${phone}&message=${encodeURIComponent(message)}`)
      if (r.ok) {
        const data = await r.json()
        const reply = data.reply || data.message || 'I couldn\'t process that. Try again!'
        // Save assistant reply
        await insert('chat_history', { phone, role: 'assistant', content: reply, source: 'app' })
        return { reply }
      }
    } catch {}
    return { reply: '🤖 I\'m having connection issues. Please try again in a moment!' }
  },
  async getChatHistory(phone, limit = 30) {
    return query('chat_history', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=${limit}`)
  },

  // REMINDERS
  async getReminders(phone) { return query('reminders', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=20`) },
}
