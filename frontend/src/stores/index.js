import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(persist((set, get) => ({
  user: null, phone: '', token: '', isLoggedIn: false, theme: 'light', language: 'en',
  persona: '', ageRange: '', city: '', activeAgents: [], onboardingCompleted: false, isPremium: false,
  login: (phone, token, user) => {
    const clean = phone.replace(/[+\s]/g, '').replace(/^91/, '').slice(-10)
    set({ phone: clean, token, user, isLoggedIn: true })
  },
  logout: () => set({ user: null, phone: '', token: '', isLoggedIn: false, persona: '', activeAgents: [], onboardingCompleted: false }),
  setUser: (user) => set({ user }),
  setTheme: (theme) => { document.documentElement.setAttribute('data-theme', theme); set({ theme }) },
  toggleTheme: () => { const n = get().theme === 'light' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', n); set({ theme: n }) },
  setLanguage: (l) => set({ language: l }),
  setPersona: (p) => set({ persona: p }),
  setActiveAgents: (a) => set({ activeAgents: a }),
  completeOnboarding: () => set({ onboardingCompleted: true }),
}), { name: 'viya-user' }))

export const useFinanceStore = create(persist((set, get) => ({
  transactions: [], goals: [], monthlyIncome: 0, monthlyExpenses: 0, dailyBudget: 0,
  setTransactions: (t) => set({ transactions: t }),
  addTransaction: (t) => set(s => ({ transactions: [t, ...s.transactions] })),
  removeTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  setGoals: (g) => set({ goals: g }),
  addGoal: (g) => set(s => ({ goals: [g, ...s.goals] })),
  updateGoal: (id, data) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g) })),
  removeGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),
  setMonthlyIncome: (v) => set({ monthlyIncome: v }),
  setMonthlyExpenses: (v) => set({ monthlyExpenses: v }),
  getTodaySpent: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().transactions.filter(t => t.type === 'expense' && t.created_at?.startsWith(today)).reduce((s, t) => s + Number(t.amount), 0)
  },
  getMonthSpent: () => {
    const m = new Date().toISOString().slice(0, 7)
    return get().transactions.filter(t => t.type === 'expense' && t.created_at?.startsWith(m)).reduce((s, t) => s + Number(t.amount), 0)
  },
  getCategoryTotals: () => {
    const m = new Date().toISOString().slice(0, 7)
    const cats = {}
    get().transactions.filter(t => t.type === 'expense' && t.created_at?.startsWith(m)).forEach(t => { cats[t.category] = (cats[t.category] || 0) + Number(t.amount) })
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  },
}), { name: 'viya-finance' }))

export const useChatStore = create((set) => ({
  messages: [], isTyping: false, sessionId: null,
  setMessages: (m) => set({ messages: m }),
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  setTyping: (v) => set({ isTyping: v }),
  clearChat: () => set({ messages: [], sessionId: null }),
}))

export const useTaskStore = create(persist((set) => ({
  tasks: [], reminders: [], habits: [], checkins: {},
  setTasks: (t) => set({ tasks: t }),
  addTask: (t) => set(s => ({ tasks: [t, ...s.tasks] })),
  updateTask: (id, data) => set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) })),
  removeTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
  setReminders: (r) => set({ reminders: r }),
  setHabits: (h) => set({ habits: h }),
  addHabit: (h) => set(s => ({ habits: [...s.habits, h] })),
  removeHabit: (id) => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),
  setCheckins: (date, c) => set(s => ({ checkins: { ...s.checkins, [date]: c } })),
}), { name: 'viya-tasks' }))

export const useHealthStore = create(persist((set) => ({
  steps: 0, sleepHours: 0, waterGlasses: 0, moodScore: null, moodLabel: '', logs: [],
  setSteps: (v) => set({ steps: v }),
  setSleep: (v) => set({ sleepHours: v }),
  addWater: () => set(s => ({ waterGlasses: s.waterGlasses + 1 })),
  setMood: (score, label) => set({ moodScore: score, moodLabel: label }),
  addLog: (log) => set(s => ({ logs: [log, ...s.logs] })),
  resetDaily: () => set({ steps: 0, waterGlasses: 0, moodScore: null }),
}), { name: 'viya-health' }))

export const useNotificationStore = create((set) => ({
  notifications: [], unreadCount: 0,
  setNotifications: (n) => set({ notifications: n, unreadCount: n.filter(x => !x.is_read).length }),
  markRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
