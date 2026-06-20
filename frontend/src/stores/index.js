import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(persist((set, get) => ({
  user: null, phone: '', token: '', isLoggedIn: false,
  theme: 'light', language: 'en', persona: '',
  onboardingCompleted: false, isPremium: false,

  login: (phone, token, user) => {
    const clean = phone.replace(/[+\s]/g, '').replace(/^91/, '').slice(-10)
    localStorage.setItem('mv_phone', clean)
    localStorage.setItem('mv_token', token)
    localStorage.setItem('mv_user', JSON.stringify(user || {}))
    set({ phone: clean, token, user, isLoggedIn: true })
  },
  logout: () => {
    localStorage.removeItem('mv_phone')
    localStorage.removeItem('mv_token')
    localStorage.removeItem('mv_user')
    set({ user: null, phone: '', token: '', isLoggedIn: false, persona: '', onboardingCompleted: false })
  },
  setUser: (user) => set(s => ({ user: typeof user === 'function' ? user(s.user) : user })),
  setTheme: (theme) => { document.documentElement.setAttribute('data-theme', theme); set({ theme }) },
  toggleTheme: () => {
    const n = get().theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', n)
    set({ theme: n })
  },
  setLanguage: (l) => set({ language: l }),
  setPersona: (p) => set({ persona: p }),
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
}), { name: 'viya-finance' }))

export const useChatStore = create((set) => ({
  messages: [], isTyping: false,
  setMessages: (m) => set({ messages: m }),
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  setTyping: (v) => set({ isTyping: v }),
  clearChat: () => set({ messages: [] }),
}))

export const useNotificationStore = create((set) => ({
  notifications: [], unreadCount: 0,
  setNotifications: (n) => set({ notifications: n, unreadCount: n.filter(x => !x.is_read).length }),
  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
