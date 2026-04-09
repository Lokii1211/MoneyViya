import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Globe, Shield, Bell, HelpCircle, ChevronRight, Target, Flame, Wallet, TrendingUp } from 'lucide-react'

export default function Profile() {
  const { user, phone, logout } = useApp()
  const nav = useNavigate()
  const name = user?.name || 'User'
  const [stats, setStats] = useState({ income: 0, expenses: 0, habits: 0, goals: 0, streak: 0 })

  useEffect(() => {
    if (!phone) return
    Promise.all([
      api.getTransactions(phone, 500),
      api.getHabits(phone),
      api.getGoals(phone),
    ]).then(([txns, habits, goals]) => {
      const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expenses = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
      setStats({ income, expenses, habits: (habits || []).length, goals: (goals || []).length, streak: maxStreak })
    })
  }, [phone])

  function handleLogout() { localStorage.clear(); logout(); nav('/auth') }

  const items = [
    { icon: <Moon size={18} />, label: 'Appearance', sub: 'Dark mode', action: () => {} },
    { icon: <Globe size={18} />, label: 'Language', sub: user?.language || 'English', action: () => {} },
    { icon: <Bell size={18} />, label: 'Notifications', sub: 'Push & reminders', action: () => nav('/notifications') },
    { icon: <Shield size={18} />, label: 'Security & Privacy', sub: 'Password, data', action: () => {} },
    { icon: <HelpCircle size={18} />, label: 'Help & Support', sub: 'FAQs, contact us', action: () => {} },
  ]

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Profile</h2></div></header>

      <div className="profile-card">
        <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <div className="profile-name">{name}</div>
          <div className="profile-phone">+91 {phone}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats">
        <div className="ps-card">
          <TrendingUp size={16} className="ps-icon green"/>
          <div className="ps-val">₹{stats.income.toLocaleString('en-IN')}</div>
          <div className="ps-label">Income</div>
        </div>
        <div className="ps-card">
          <Wallet size={16} className="ps-icon red"/>
          <div className="ps-val">₹{stats.expenses.toLocaleString('en-IN')}</div>
          <div className="ps-label">Expenses</div>
        </div>
        <div className="ps-card">
          <Flame size={16} className="ps-icon orange"/>
          <div className="ps-val">{stats.streak}🔥</div>
          <div className="ps-label">Best Streak</div>
        </div>
        <div className="ps-card">
          <Target size={16} className="ps-icon violet"/>
          <div className="ps-val">{stats.goals}</div>
          <div className="ps-label">Goals</div>
        </div>
      </div>

      <div className="settings-list">
        {items.map((it, i) => (
          <button key={i} className="settings-item" onClick={it.action}>
            <div className="si-icon">{it.icon}</div>
            <div className="si-info"><div className="si-label">{it.label}</div><div className="si-sub">{it.sub}</div></div>
            <ChevronRight size={16} className="si-arrow" />
          </button>
        ))}
      </div>
      <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /> Sign Out</button>

      <div className="profile-footer">
        <p>MoneyViya v6.0 — True Agentic AI</p>
        <p>Built with ❤️ by Lokesh</p>
      </div>
    </div>
  )
}
