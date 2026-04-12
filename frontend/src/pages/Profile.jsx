import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Globe, Shield, Bell, HelpCircle, ChevronRight, Target, Flame, Wallet, TrendingUp, Edit3, Check, X, MapPin, Briefcase, Calendar, User, Sparkles, Star, Award, Crown } from 'lucide-react'

export default function Profile() {
  const { user, phone, logout, setUser } = useApp()
  const nav = useNavigate()
  const [stats, setStats] = useState({ income: 0, expenses: 0, habits: 0, goals: 0, streak: 0, chatCount: 0 })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', age: '', city: '', occupation: '', monthly_income: '', daily_budget: ''
  })

  useEffect(() => {
    if (!phone) return
    Promise.all([
      api.getTransactions(phone, 500),
      api.getHabits(phone),
      api.getGoals(phone),
      api.getChatHistory(phone, 100),
    ]).then(([txns, habits, goals, chats]) => {
      const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expenses = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.longest_streak || h.current_streak || 0), 0)
      setStats({ income, expenses, habits: (habits || []).length, goals: (goals || []).length, streak: maxStreak, chatCount: (chats || []).length })
    })
  }, [phone])

  useEffect(() => {
    setEditForm({
      name: user?.name || '',
      age: user?.age || '',
      city: user?.city || '',
      occupation: user?.occupation || user?.persona || '',
      monthly_income: user?.monthly_income || '',
      daily_budget: user?.daily_budget || ''
    })
  }, [user])

  function handleLogout() { localStorage.clear(); logout(); nav('/auth') }

  async function saveProfile() {
    setSaving(true)
    try {
      const updateData = {
        name: editForm.name || 'User',
        age: editForm.age ? Number(editForm.age) : null,
        city: editForm.city || null,
        occupation: editForm.occupation || null,
        monthly_income: editForm.monthly_income ? Number(editForm.monthly_income) : 0,
        daily_budget: editForm.daily_budget ? Number(editForm.daily_budget) : 1000,
      }
      await api.updateUser(phone, updateData)
      setUser(prev => ({ ...prev, ...updateData }))
      setEditing(false)
    } catch (e) { console.error('Save error:', e) }
    setSaving(false)
  }

  const name = user?.name || 'User'
  const level = stats.streak >= 30 ? { label: 'Legend', icon: <Crown size={14}/>, color: '#ffd700' } :
                stats.streak >= 14 ? { label: 'Warrior', icon: <Award size={14}/>, color: '#00d1ff' } :
                stats.streak >= 7 ? { label: 'Hustler', icon: <Star size={14}/>, color: '#7c3aed' } :
                { label: 'Beginner', icon: <Sparkles size={14}/>, color: '#10b981' }

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'New'

  return (
    <div className="page profile-page">
      <header className="page-header"><div className="header-left"><h2>Profile</h2></div></header>

      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">
          <span>{name.charAt(0).toUpperCase()}</span>
          <div className="profile-level-badge" style={{ background: level.color }}>
            {level.icon}
          </div>
        </div>
        <div className="profile-name-lg">{name}</div>
        <div className="profile-phone-lg">+91 {phone}</div>
        <div className="profile-member">Member since {memberSince} · {level.label}</div>
        <button className="edit-profile-btn" onClick={() => setEditing(!editing)}>
          {editing ? <><X size={14}/> Cancel</> : <><Edit3 size={14}/> Edit Profile</>}
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="profile-edit-card animate-slideUp">
          <div className="edit-field">
            <label><User size={14}/> Full Name</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Your name" />
          </div>
          <div className="edit-row">
            <div className="edit-field">
              <label><Calendar size={14}/> Age</label>
              <input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} placeholder="25" />
            </div>
            <div className="edit-field">
              <label><MapPin size={14}/> City</label>
              <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} placeholder="Chennai" />
            </div>
          </div>
          <div className="edit-field">
            <label><Briefcase size={14}/> Occupation</label>
            <input type="text" value={editForm.occupation} onChange={e => setEditForm({...editForm, occupation: e.target.value})} placeholder="Software Engineer" />
          </div>
          <div className="edit-row">
            <div className="edit-field">
              <label><TrendingUp size={14}/> Monthly Income</label>
              <input type="number" value={editForm.monthly_income} onChange={e => setEditForm({...editForm, monthly_income: e.target.value})} placeholder="35000" />
            </div>
            <div className="edit-field">
              <label><Wallet size={14}/> Daily Budget</label>
              <input type="number" value={editForm.daily_budget} onChange={e => setEditForm({...editForm, daily_budget: e.target.value})} placeholder="1000" />
            </div>
          </div>
          <button className="save-profile-btn" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : <><Check size={16}/> Save Changes</>}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="psg-card" onClick={() => nav('/expenses')}>
          <TrendingUp size={18} className="psg-icon green"/>
          <div className="psg-val">₹{stats.income.toLocaleString('en-IN')}</div>
          <div className="psg-label">Income</div>
        </div>
        <div className="psg-card" onClick={() => nav('/expenses')}>
          <Wallet size={18} className="psg-icon red"/>
          <div className="psg-val">₹{stats.expenses.toLocaleString('en-IN')}</div>
          <div className="psg-label">Expenses</div>
        </div>
        <div className="psg-card" onClick={() => nav('/habits')}>
          <Flame size={18} className="psg-icon orange"/>
          <div className="psg-val">{stats.streak}🔥</div>
          <div className="psg-label">Best Streak</div>
        </div>
        <div className="psg-card" onClick={() => nav('/goals')}>
          <Target size={18} className="psg-icon violet"/>
          <div className="psg-val">{stats.goals}</div>
          <div className="psg-label">Goals</div>
        </div>
      </div>

      {/* User Info Cards */}
      {(user?.city || user?.age || user?.occupation) && (
        <div className="user-info-card">
          {user?.occupation && <div className="uic-item"><Briefcase size={14}/> {user.occupation}</div>}
          {user?.city && <div className="uic-item"><MapPin size={14}/> {user.city}</div>}
          {user?.age && <div className="uic-item"><Calendar size={14}/> {user.age} years</div>}
        </div>
      )}

      {/* Settings */}
      <div className="settings-list">
        <button className="settings-item" onClick={() => nav('/notifications')}>
          <div className="si-icon"><Bell size={18}/></div>
          <div className="si-info"><div className="si-label">Notifications</div><div className="si-sub">Push & reminders</div></div>
          <ChevronRight size={16} className="si-arrow"/>
        </button>
        <button className="settings-item" onClick={() => nav('/onboarding')}>
          <div className="si-icon"><Sparkles size={18}/></div>
          <div className="si-info"><div className="si-label">Redo Setup</div><div className="si-sub">Change preferences</div></div>
          <ChevronRight size={16} className="si-arrow"/>
        </button>
        <button className="settings-item">
          <div className="si-icon"><Shield size={18}/></div>
          <div className="si-info"><div className="si-label">Privacy & Security</div><div className="si-sub">Your data is encrypted</div></div>
          <ChevronRight size={16} className="si-arrow"/>
        </button>
        <button className="settings-item">
          <div className="si-icon"><HelpCircle size={18}/></div>
          <div className="si-info"><div className="si-label">Help & Support</div><div className="si-sub">FAQs, contact us</div></div>
          <ChevronRight size={16} className="si-arrow"/>
        </button>
      </div>

      <button className="logout-btn" onClick={handleLogout}><LogOut size={18}/> Sign Out</button>

      <div className="profile-footer">
        <p>MoneyViya v10.0 — Production AI Engine</p>
        <p>ML: TF-IDF + VADER + EMA</p>
        <p>Built with ❤️ by Lokesh</p>
      </div>
    </div>
  )
}
