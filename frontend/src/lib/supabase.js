const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const REST = url ? `${url}/rest/v1` : ''
const hdrs = () => ({ 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })

// Phone format helper — WhatsApp stores as 919003360494, app stores as 9003360494
function phoneFilter(phone) {
  const clean = phone.replace(/[^\d]/g, '').replace(/^\+/, '')
  const short = clean.replace(/^91/, '').slice(-10)
  const long = '91' + short
  return `or=(phone.eq.${short},phone.eq.${long})`
}

async function query(table, params = '') {
  if (!REST) return []
  try { const r = await fetch(`${REST}/${table}${params}`, { headers: hdrs() }); return r.ok ? await r.json() : [] } catch { return [] }
}
async function insert(table, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}`, { method: 'POST', headers: { ...hdrs(), 'Prefer': 'return=representation' }, body: JSON.stringify(data) })
    if (!r.ok) { console.error(`INSERT ${table} failed:`, r.status, await r.text()); return null }
    const res = await r.json(); return Array.isArray(res) ? res[0] : res
  } catch (e) { console.error(`INSERT ${table} error:`, e); return null }
}
async function update(table, filter, data) {
  if (!REST) return null
  try {
    const r = await fetch(`${REST}/${table}?${filter}`, { method: 'PATCH', headers: { ...hdrs(), 'Prefer': 'return=representation' }, body: JSON.stringify(data) })
    if (!r.ok) { console.error(`UPDATE ${table} failed:`, r.status); return null }
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

// ===== COMPLETE API — MATCHES REAL DB SCHEMA =====
export const api = {
  // AUTH — uses 'password_hash' column (actual DB schema)
  async login(phone, password) {
    try {
      // Normalize phone: remove +91, spaces, dashes
      const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10);
      // Try both formats: 10-digit and with country code
      let users = await query('users', `?phone=eq.${cleanPhone}&select=*`)
      if (!users.length) users = await query('users', `?phone=eq.91${cleanPhone}&select=*`)
      if (!users.length) users = await query('users', `?phone=eq.${phone}&select=*`)
      const user = users[0]
      if (!user) return { success: false, message: 'Account not found. Register first.' }
      if (user.password_hash !== password) return { success: false, message: 'Wrong password.' }
      localStorage.setItem('mv_token', 'sb_' + user.phone)
      localStorage.setItem('mv_phone', user.phone)
      localStorage.setItem('mv_user', JSON.stringify(user))
      return { success: true, token: 'sb_' + user.phone, user }
    } catch { return { success: false, message: 'Connection error.' } }
  },
  async register(phone, password, name = 'User') {
    try {
      const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10);
      const existing = await query('users', `?phone=eq.${cleanPhone}&select=phone`)
      if (existing.length) return { success: false, message: 'Account exists. Sign in.' }
      await insert('users', { phone: cleanPhone, password_hash: password, name })
      return { success: true, message: 'Account created! Sign in now.' }
    } catch { return { success: false, message: 'Connection error.' } }
  },

  // USER
  async getUser(phone) {
    const users = await query('users', `?${phoneFilter(phone)}&select=*`)
    const user = users[0]
    if (!user) return null
    const txns = await query('transactions', `?${phoneFilter(phone)}&select=*&order=created_at.desc&limit=100`)
    return { ...user, recent_transactions: txns }
  },
  async updateUser(phone, data) { return update('users', `phone=eq.${phone}`, data) },

  // TRANSACTIONS — columns: id, phone, type, amount, category, description, source, merchant, created_at
  async getTransactions(phone, limit = 50) {
    return query('transactions', `?${phoneFilter(phone)}&select=*&order=created_at.desc&limit=${limit}`)
  },
  async addExpense(phone, amount, category, note) {
    const r = await insert('transactions', { phone, type: 'expense', amount, category, description: note || '' })
    // Update user totals
    const txns = await query('transactions', `?${phoneFilter(phone)}&type=eq.expense&select=amount`)
    const total = txns.reduce((s, t) => s + Number(t.amount), 0)
    await update('users', `phone=eq.${phone}`, { monthly_expenses: total })
    return r
  },
  async addIncome(phone, amount, source) {
    const r = await insert('transactions', { phone, type: 'income', amount, category: source, description: source })
    const txns = await query('transactions', `?${phoneFilter(phone)}&type=eq.income&select=amount`)
    const total = txns.reduce((s, t) => s + Number(t.amount), 0)
    await update('users', `phone=eq.${phone}`, { monthly_income: total })
    return r
  },
  async deleteTransaction(id) { return remove('transactions', `id=eq.${id}`) },

  // GOALS — columns: id, phone, name, icon, target_amount, current_amount, deadline, priority, status, created_at
  async getGoals(phone) { return query('goals', `?${phoneFilter(phone)}&status=eq.active&select=*&order=created_at.desc`) },
  async addGoal(phone, name, icon, target, deadline) {
    return insert('goals', { phone, name, icon: icon || '🎯', target_amount: target, deadline: deadline || '', current_amount: 0, status: 'active', priority: 'medium' })
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

  // HABITS — columns: id, phone, name, icon, frequency, current_streak, longest_streak, last_completed, created_at
  async getHabits(phone) { return query('habits', `?${phoneFilter(phone)}&select=*&order=created_at.asc`) },
  async addHabit(phone, name, icon) {
    // Prevent duplicate habits
    const existing = await query('habits', `?phone=eq.${phone}&name=eq.${encodeURIComponent(name.trim())}&select=id`)
    if (existing.length) return existing[0] // Already exists, return it
    return insert('habits', { phone, name: name.trim(), icon: icon || '✅', frequency: 'daily', current_streak: 0, longest_streak: 0 })
  },
  async deleteHabit(id) {
    await remove('habit_checkins', `habit_id=eq.${id}`)
    return remove('habits', `id=eq.${id}`)
  },

  // HABIT CHECK-INS — columns: id, habit_id, phone, checked_date, status, created_at
  async getCheckins(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    return query('habit_checkins', `?${phoneFilter(phone)}&checked_date=eq.${d}&select=*`)
  },
  async checkinHabit(habitId, phone) {
    const today = new Date().toISOString().split('T')[0]
    const existing = await query('habit_checkins', `?habit_id=eq.${habitId}&checked_date=eq.${today}&select=*`)
    if (existing.length) {
      // Unchecking — remove today's checkin
      await remove('habit_checkins', `habit_id=eq.${habitId}&checked_date=eq.${today}`)
      // Recalculate streak from history
      const streak = await this._calcStreak(habitId)
      await update('habits', `id=eq.${habitId}`, { current_streak: streak })
      return { checked: false }
    }
    // Checking in
    await insert('habit_checkins', { habit_id: habitId, phone, checked_date: today, status: 'done' })
    // Recalculate streak from history
    const streak = await this._calcStreak(habitId)
    const habits = await query('habits', `?id=eq.${habitId}&select=*`)
    const longestStreak = Math.max(streak, habits[0]?.longest_streak || 0)
    await update('habits', `id=eq.${habitId}`, { current_streak: streak, longest_streak: longestStreak, last_completed: today })
    return { checked: true }
  },
  // Calculate consecutive daily streak from checkin history
  async _calcStreak(habitId) {
    const checkins = await query('habit_checkins', `?habit_id=eq.${habitId}&select=checked_date&order=checked_date.desc&limit=60`)
    if (!checkins.length) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (checkins.some(c => c.checked_date === ds)) streak++
      else if (i > 0) break // Gap found, stop counting (skip today if not checked yet)
      else continue // Today might not be checked yet, check yesterday
    }
    return streak
  },

  // NOTIFICATIONS — columns: id, phone, type, title, description, is_read, action_url, created_at
  async getNotifications(phone) { return query('notifications', `?${phoneFilter(phone)}&select=*&order=created_at.desc&limit=20`) },
  async markNotifRead(id) { return update('notifications', `id=eq.${id}`, { is_read: true }) },
  async clearNotifications(phone) { return remove('notifications', `phone=eq.${phone}`) },

  // CHAT — uses webhook for Groq AI
  async chat(phone, message) {
    try {
      await insert('chat_history', { phone, role: 'user', content: message, source: 'app' })
      const r = await fetch(`/api/webhook?action=chat&phone=${phone}&message=${encodeURIComponent(message)}`)
      if (r.ok) {
        const data = await r.json()
        const reply = data.reply || data.message || "I couldn't process that. Try again!"
        await insert('chat_history', { phone, role: 'assistant', content: reply, source: 'app' })
        return { reply }
      }
    } catch {}
    return { reply: "🤖 I'm having connection issues. Please try again!" }
  },
  async getChatHistory(phone, limit = 30) {
    return query('chat_history', `?${phoneFilter(phone)}&select=*&order=created_at.desc&limit=${limit}`)
  },

  // REMINDERS
  async getReminders(phone) { return query('reminders', `?${phoneFilter(phone)}&select=*&order=created_at.desc&limit=20`) },

  // FAMILY CONNECTIONS — columns: id, owner_phone, member_phone, relation, status (pending/accepted/rejected), created_at
  async getFamilyConnections(phone) {
    return query('family_connections', `?owner_phone=eq.${phone}&select=*&order=created_at.desc`)
  },
  async getFamilyInvitesReceived(phone) {
    return query('family_connections', `?member_phone=eq.${phone}&select=*&order=created_at.desc`)
  },
  async sendFamilyInvite(ownerPhone, memberPhone, relation) {
    return insert('family_connections', { owner_phone: ownerPhone, member_phone: memberPhone, relation, status: 'pending' })
  },
  async respondFamilyInvite(id, status) {
    return update('family_connections', `id=eq.${id}`, { status })
  },
  async removeFamilyConnection(id) {
    return remove('family_connections', `id=eq.${id}`)
  },
  async sendFriendRequest(ownerPhone, memberPhone) {
    return insert('family_connections', { owner_phone: ownerPhone, member_phone: memberPhone, relation: 'Friend', connection_type: 'friend', status: 'pending' })
  },
  // NOTIFICATIONS (uses existing table: id, phone, type, title, description, is_read, created_at)
  async addNotification(phone, message, type = 'general') {
    return insert('notifications', { phone, title: message, description: message, type, is_read: false })
  },

  // USER REMINDERS (synced to WhatsApp via cron)
  async getUserReminders(phone) {
    return query('user_reminders', `?phone=eq.${phone}&select=*&order=time.asc`)
  },
  async createUserReminder(data) {
    return insert('user_reminders', data)
  },
  async updateUserReminder(id, data) {
    return update('user_reminders', `id=eq.${id}`, data)
  },
  async deleteUserReminder(id) {
    return remove('user_reminders', `id=eq.${id}`)
  },

  // ===== V2 APIS — NEW TABLES =====

  // HEALTH LOGS
  async getHealthLog(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    const logs = await query('health_logs', `?${phoneFilter(phone)}&log_date=eq.${d}&select=*`)
    return logs[0] || null
  },
  async upsertHealthLog(phone, data) {
    return upsert('health_logs', { phone, log_date: new Date().toISOString().split('T')[0], ...data })
  },
  async getHealthHistory(phone, days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    return query('health_logs', `?${phoneFilter(phone)}&log_date=gte.${since}&select=*&order=log_date.desc`)
  },

  // MEALS
  async getMeals(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    return query('meals', `?${phoneFilter(phone)}&meal_date=eq.${d}&select=*&order=created_at.asc`)
  },
  async addMeal(phone, data) { return insert('meals', { phone, meal_date: new Date().toISOString().split('T')[0], ...data }) },
  async deleteMeal(id) { return remove('meals', `id=eq.${id}`) },

  // MEDICINES
  async getMedicines(phone) { return query('medicines', `?${phoneFilter(phone)}&active=eq.true&select=*&order=time.asc`) },
  async addMedicine(phone, data) { return insert('medicines', { phone, ...data }) },
  async deleteMedicine(id) { return remove('medicines', `id=eq.${id}`) },
  async getMedicineCheckins(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    return query('medicine_checkins', `?${phoneFilter(phone)}&checked_date=eq.${d}&select=*`)
  },
  async checkinMedicine(medicineId, phone) {
    const today = new Date().toISOString().split('T')[0]
    return upsert('medicine_checkins', { medicine_id: medicineId, phone, checked_date: today, taken: true })
  },

  // BILLS & DUES
  async getBills(phone) { return query('bills_and_dues', `?${phoneFilter(phone)}&select=*&order=due_date.asc`) },
  async addBill(phone, data) { return insert('bills_and_dues', { phone, ...data }) },
  async updateBill(id, data) { return update('bills_and_dues', `id=eq.${id}`, data) },
  async deleteBill(id) { return remove('bills_and_dues', `id=eq.${id}`) },
  async markBillPaid(id) { return update('bills_and_dues', `id=eq.${id}`, { status: 'paid', last_paid_at: new Date().toISOString() }) },

  // INVESTMENTS
  async getInvestments(phone) { return query('investments', `?${phoneFilter(phone)}&select=*&order=created_at.desc`) },
  async addInvestment(phone, data) { return insert('investments', { phone, ...data }) },
  async updateInvestment(id, data) { return update('investments', `id=eq.${id}`, data) },
  async deleteInvestment(id) { return remove('investments', `id=eq.${id}`) },
  async getSIPs(phone) { return query('investments', `?${phoneFilter(phone)}&is_sip=eq.true&select=*&order=name.asc`) },

  // EMAILS
  async getEmails(phone, limit = 20) { return query('emails', `?${phoneFilter(phone)}&select=*&order=received_at.desc&limit=${limit}`) },
  async getActionEmails(phone) { return query('emails', `?${phoneFilter(phone)}&action_required=eq.true&is_handled=eq.false&select=*&order=received_at.desc`) },
  async markEmailHandled(id) { return update('emails', `id=eq.${id}`, { is_handled: true }) },
  async markEmailRead(id) { return update('emails', `id=eq.${id}`, { is_read: true }) },

  // CALENDAR EVENTS
  async getCalendarEvents(phone, date) {
    const d = date || new Date().toISOString().split('T')[0]
    return query('calendar_events', `?${phoneFilter(phone)}&event_date=eq.${d}&select=*&order=start_time.asc`)
  },
  async getUpcomingEvents(phone, days = 7) {
    const today = new Date().toISOString().split('T')[0]
    const end = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
    return query('calendar_events', `?${phoneFilter(phone)}&event_date=gte.${today}&event_date=lte.${end}&select=*&order=event_date.asc,start_time.asc`)
  },
  async addCalendarEvent(phone, data) { return insert('calendar_events', { phone, ...data }) },
  async deleteCalendarEvent(id) { return remove('calendar_events', `id=eq.${id}`) },

  // AI MEMORY
  async getMemories(phone, category) {
    const filter = category ? `&category=eq.${category}` : ''
    return query('viya_memory', `?${phoneFilter(phone)}${filter}&select=*&order=importance.desc,created_at.desc&limit=50`)
  },
  async addMemory(phone, content, type = 'fact', category = 'general', importance = 5) {
    return insert('viya_memory', { phone, content, memory_type: type, category, importance })
  },
  async searchMemories(phone, searchTerm) {
    return query('viya_memory', `?${phoneFilter(phone)}&content=ilike.*${encodeURIComponent(searchTerm)}*&select=*&order=importance.desc&limit=20`)
  },
  async deleteMemory(id) { return remove('viya_memory', `id=eq.${id}`) },

  // AGENT LOGS
  async logAgentCall(phone, data) { return insert('agent_logs', { phone, ...data }) },
}
