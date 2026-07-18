import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun, Shield, Bell, HelpCircle, ChevronRight, ChevronDown, Target, Flame, Wallet, TrendingUp, Edit3, Check, X, MapPin, Briefcase, Calendar, User, Sparkles, Star, Award, Crown, Clock, FileText, Lock, Smartphone, Mail, ImageUp, Settings } from 'lucide-react'
import { LANGUAGES, setLang, t, getLang } from '../lib/i18n'

const AVATARS = ['😎','🦊','🐱','🐶','🦁','🐼','🐨','🦄','🐸','🐵','🦋','🌺','🌈','⭐','🔥','💎','🎯','🚀','🎓','💼']

// Downscale + compress an uploaded image so it stays small in a TEXT column
function resizeImageToDataUrl(file, maxDim = 160, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => { img.src = reader.result }
    reader.onerror = reject
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { user, phone, logout, setUser, theme, toggleTheme } = useApp()
  const nav = useNavigate()
  const [stats, setStats] = useState({ income: 0, expenses: 0, habits: 0, goals: 0, streak: 0, chatCount: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(localStorage.getItem('mv_avatar') || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [toast, setToast] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwMode, setPwMode] = useState('current') // 'current' or 'otp'
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
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
      setLoading(false)
    }).catch(() => {
      setLoading(false)
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
    // Supabase is the source of truth across devices; local cache is just for instant paint
    if (user?.avatar) {
      setSelectedAvatar(user.avatar)
      localStorage.setItem('mv_avatar', user.avatar)
    }
  }, [user])

  function handleLogout() { localStorage.clear(); logout(); nav('/auth') }

  async function pickAvatar(emoji) {
    setSelectedAvatar(emoji)
    localStorage.setItem('mv_avatar', emoji)
    setShowAvatarPicker(false)
    setUser(prev => ({ ...prev, avatar: emoji }))
    await api.updateUser(phone, { avatar: emoji })
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setToast('Please choose an image file'); setTimeout(() => setToast(''), 2000); return }
    setUploadingAvatar(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setSelectedAvatar(dataUrl)
      localStorage.setItem('mv_avatar', dataUrl)
      setShowAvatarPicker(false)
      setUser(prev => ({ ...prev, avatar: dataUrl }))
      const ok = await api.updateUser(phone, { avatar: dataUrl })
      setToast(ok ? 'Profile photo updated!' : 'Saved on this device — sync failed, check your connection')
    } catch {
      setToast('Could not process that image')
    }
    setUploadingAvatar(false)
    setTimeout(() => setToast(''), 2000)
  }

  async function submitPasswordChange() {
    setPwError('')
    if (!pwForm.current) { setPwError('Enter your current password'); return }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    setPwSaving(true)
    const result = await api.changePassword(phone, pwForm.current, pwForm.next)
    setPwSaving(false)
    if (result.success) {
      setShowPasswordModal(false)
      setPwForm({ current: '', next: '', confirm: '' })
      setToast('Password updated!')
      setTimeout(() => setToast(''), 2000)
    } else {
      setPwError(result.message || 'Failed to update password')
    }
  }

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

  const connectedBanksCount = (() => { try { return JSON.parse(localStorage.getItem('mv_connected_banks') || '[]').length } catch { return 0 } })()

  const name = user?.name || 'User'
  const level = stats.streak >= 30 ? { label: 'Legend', icon: <Crown size={14}/>, color: '#ffd700' } :
                stats.streak >= 14 ? { label: 'Warrior', icon: <Award size={14}/>, color: '#00d1ff' } :
                stats.streak >= 7 ? { label: 'Hustler', icon: <Star size={14}/>, color: '#7c3aed' } :
                { label: 'Beginner', icon: <Sparkles size={14}/>, color: '#10b981' }

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'New'

  return (
    <div className="page profile-page">
      {toast && <div className="toast">{toast}</div>}
      <header className="page-header"><div className="header-left"><h2>{t('profile')}</h2></div></header>

      {/* Loading Skeleton */}
      {loading ? (
        <div>
          {/* Avatar skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="skeleton"
              style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 12 }}
            />
            {/* Name skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="skeleton"
              style={{ height: 20, width: 140, borderRadius: 8, marginBottom: 8 }}
            />
            {/* Phone skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="skeleton"
              style={{ height: 14, width: 120, borderRadius: 6, marginBottom: 6 }}
            />
            {/* Member since skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="skeleton"
              style={{ height: 12, width: 160, borderRadius: 6 }}
            />
          </div>

          {/* Stats grid skeleton (2x2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="skeleton"
                style={{ height: 80, borderRadius: 14 }}
              />
            ))}
          </div>

          {/* Life score skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="skeleton"
            style={{ height: 160, borderRadius: 20, marginBottom: 16 }}
          />

          {/* Settings skeleton */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="skeleton"
              style={{ height: 52, borderRadius: 12, marginBottom: 8 }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Profile Hero */}
          <div className="profile-hero">
            <div className="profile-avatar-lg" onClick={() => setShowAvatarPicker(!showAvatarPicker)} style={{cursor:'pointer', position:'relative'}}>
              <div className="profile-avatar-lg-inner">
                {selectedAvatar?.startsWith?.('data:image') ? (
                  <img src={selectedAvatar} alt={name} />
                ) : selectedAvatar ? (
                  <span style={{fontSize:36}}>{selectedAvatar}</span>
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{position:'absolute', bottom:-2, right:-2, width:22, height:22, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg)'}}>
                <Edit3 size={10} color="#fff"/>
              </div>
            </div>
            <div className="profile-name-lg">{name}</div>
            <div className="profile-phone-lg">+91 {phone}</div>
            <div className="profile-member">Member since {memberSince} · {level.label}</div>
            <button className="edit-profile-btn" onClick={() => setEditing(!editing)}>
              {editing ? <><X size={14}/> Cancel</> : <><Edit3 size={14}/> Edit Profile</>}
            </button>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="avatar-picker-card animate-slideUp">
              <label className="avatar-upload-btn">
                <input type="file" accept="image/*" className="sr-hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                <ImageUp size={14} /> {uploadingAvatar ? 'Uploading…' : 'Upload from Gallery'}
              </label>
              <div className="avatar-picker-title" style={{ marginTop: 14 }}>Or pick an avatar</div>
              <div className="avatar-picker-grid">
                {AVATARS.map((a, i) => (
                  <button key={i} onClick={() => pickAvatar(a)}
                    className={`avatar-option${selectedAvatar === a ? ' selected' : ''}`}>{a}</button>
                ))}
              </div>
              <button className="avatar-reset-btn" onClick={async () => {
                setSelectedAvatar(''); localStorage.removeItem('mv_avatar'); setShowAvatarPicker(false)
                setUser(prev => ({ ...prev, avatar: '' }))
                await api.updateUser(phone, { avatar: '' })
              }}>
                Use Letter Initial
              </button>
            </div>
          )}

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
              <div className="psg-val">₹{stats.income}</div>
              <div className="psg-label">Income</div>
            </div>
            <div className="psg-card" onClick={() => nav('/expenses')}>
              <Wallet size={18} className="psg-icon red"/>
              <div className="psg-val">₹{stats.expenses}</div>
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

          {/* Life Score Ring */}
          {(() => {
            const financial = Math.min(100, Math.round((stats.income > 0 ? (1 - stats.expenses / stats.income) : 0) * 100))
            const health = Math.min(100, Math.max(0, 50))
            const productivity = Math.min(100, stats.streak * 10 + stats.habits * 5)
            const relationships = Math.min(100, stats.chatCount > 0 ? 60 + Math.min(stats.chatCount, 40) : 40)
            const lifeScore = Math.round((financial + health + productivity + relationships) / 4)
            const r = 58, circ = 2 * Math.PI * r, pct = lifeScore / 100

            return (
              <div className="life-score-card">
                <div className="life-score-layout">
                  {/* Animated Ring */}
                  <div className="life-score-ring">
                    <svg width={130} height={130} className="life-score-svg">
                      <defs>
                        <linearGradient id="lifeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00E5B0" />
                          <stop offset="100%" stopColor="#5514FF" />
                        </linearGradient>
                      </defs>
                      <circle cx={65} cy={65} r={r} fill="none" stroke="var(--viya-neutral-100)" strokeWidth={10} />
                      <circle cx={65} cy={65} r={r} fill="none" stroke="url(#lifeGrad)" strokeWidth={10}
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                        strokeLinecap="round" className="life-score-arc" />
                    </svg>
                    <div className="life-score-center">
                      <div className="life-score-value">{lifeScore}</div>
                      <div className="life-score-label">Life Score</div>
                    </div>
                  </div>

                  {/* 4 Dimension Breakdown */}
                  <div className="life-score-dimensions">
                    {[
                      { label: 'Financial', score: financial, color: 'var(--viya-success)' },
                      { label: 'Health', score: health, color: '#FF7062' },
                      { label: 'Productivity', score: productivity, color: 'var(--viya-gold-500)' },
                      { label: 'Relationships', score: relationships, color: 'var(--viya-violet-500)' },
                    ].map((d, i) => (
                      <div key={i} className="life-score-bar">
                        <div className="life-score-bar-header">
                          <span className="life-score-bar-label">{d.label}</span>
                          <span style={{ color: d.color }}>{d.score}%</span>
                        </div>
                        <div className="life-score-bar-track">
                          <div className="life-score-bar-fill" style={{ width: `${d.score}%`, background: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* User Info Cards */}
          {(user?.city || user?.age || user?.occupation) && (
            <div className="user-info-card">
              {user?.occupation && <div className="uic-item"><Briefcase size={14}/> {user.occupation}</div>}
              {user?.city && <div className="uic-item"><MapPin size={14}/> {user.city}</div>}
              {user?.age && <div className="uic-item"><Calendar size={14}/> {user.age} years</div>}
            </div>
          )}

          {/* V2 Life Modules */}
          <div className="mb-16">
            <div className="section-label" style={{ marginBottom: 10, paddingLeft: 2 }}>Life Modules</div>
            <div className="life-modules-grid">
              {[
                { path: '/health', emoji: '❤️', label: 'Health' },
                { path: '/bills', emoji: '📋', label: 'Bills' },
                { path: '/wealth', emoji: '📈', label: 'Wealth' },
                { path: '/lending', emoji: '🤝', label: 'Lending' },
                { path: '/email', emoji: '📧', label: 'Email AI' },
                { path: '/calendar', emoji: '📅', label: 'Calendar' },
                { path: '/chat', emoji: '🧠', label: 'Viya AI' },
              ].map((mod, i) => (
                <button key={i} onClick={() => nav(mod.path)} className={`life-module-btn tone-${i % 3}`}>
                  <div className="life-module-emoji">{mod.emoji}</div>
                  <div className="life-module-label">{mod.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* More Tools */}
          <div className="mb-16">
            <button
              className="section-label-toggle"
              onClick={() => setShowMoreTools(v => !v)}
              aria-expanded={showMoreTools}
            >
              <span className="section-label" style={{ paddingLeft: 2 }}>More Tools</span>
              <ChevronDown size={16} className={`slt-chevron${showMoreTools ? ' open' : ''}`} />
            </button>
            {showMoreTools && (
              <div className="life-modules-grid" style={{ marginTop: 10 }}>
                {[
                  { path: '/journal', emoji: '📓', label: 'Journal' },
                  { path: '/medicine', emoji: '💊', label: 'Medicine' },
                  { path: '/sleep', emoji: '😴', label: 'Sleep' },
                  { path: '/meals', emoji: '🍽️', label: 'Meals' },
                  { path: '/subscriptions', emoji: '🔁', label: 'Subscriptions' },
                  { path: '/splits', emoji: '🧾', label: 'Splits' },
                  { path: '/portfolio', emoji: '💹', label: 'Portfolio' },
                  { path: '/predictions', emoji: '🔮', label: 'Predictions' },
                  { path: '/community', emoji: '👥', label: 'Community' },
                  { path: '/review', emoji: '⭐', label: 'Year in Review' },
                  { path: '/morning-brief', emoji: '☀️', label: 'Morning Brief' },
                  { path: '/weekly-report', emoji: '📊', label: 'Weekly Report' },
                ].map((mod, i) => (
                  <button key={i} onClick={() => nav(mod.path)} className={`life-module-btn tone-${i % 3}`}>
                    <div className="life-module-emoji">{mod.emoji}</div>
                    <div className="life-module-label">{mod.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connected Accounts */}
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>CONNECTED ACCOUNTS</div>
            <button className="settings-item" onClick={() => nav('/bank-connect')}>
              <div className="si-icon"><Smartphone size={18} /></div>
              <div className="si-info">
                <div className="si-label">Bank & SMS Tracking</div>
                <div className="si-sub">{connectedBanksCount > 0 ? `${connectedBanksCount} banks connected` : 'Connect to auto-track expenses'}</div>
              </div>
              <ChevronRight size={16} className="si-arrow" />
            </button>
            <button className="settings-item" onClick={() => nav('/wealth')}>
              <div className="si-icon"><TrendingUp size={18} /></div>
              <div className="si-info">
                <div className="si-label">Investments & Portfolio</div>
                <div className="si-sub">Track mutual funds, stocks, SIPs</div>
              </div>
              <ChevronRight size={16} className="si-arrow" />
            </button>
            <button className="settings-item" onClick={() => nav('/email')}>
              <div className="si-icon"><Mail size={18} /></div>
              <div className="si-info">
                <div className="si-label">Email Intelligence</div>
                <div className="si-sub">Auto-detect bills, meetings, deliveries</div>
              </div>
              <ChevronRight size={16} className="si-arrow" />
            </button>
          </div>

          {/* Settings */}
          <div className="settings-list">
            <button className="settings-item" onClick={toggleTheme}>
              <div className="si-icon">{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</div>
              <div className="si-info"><div className="si-label">Appearance</div><div className="si-sub">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div></div>
              <div className={`theme-toggle-pill ${theme}`}><div className="theme-toggle-dot"/></div>
            </button>
            <button className="settings-item" onClick={() => nav('/notifications')}>
              <div className="si-icon"><Bell size={18}/></div>
              <div className="si-info"><div className="si-label">Notifications</div><div className="si-sub">Push alerts & updates</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/reminders')}>
              <div className="si-icon"><Clock size={18}/></div>
              <div className="si-info"><div className="si-label">Reminders</div><div className="si-sub">Daily, weekly & monthly</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/onboarding')}>
              <div className="si-icon"><Sparkles size={18}/></div>
              <div className="si-info"><div className="si-label">Redo Setup</div><div className="si-sub">Change preferences</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/privacy')}>
              <div className="si-icon"><Shield size={18}/></div>
              <div className="si-info"><div className="si-label">Privacy & Security</div><div className="si-sub">Your data is encrypted</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/help')}>
              <div className="si-icon"><HelpCircle size={18}/></div>
              <div className="si-info"><div className="si-label">Help & Support</div><div className="si-sub">FAQs, contact us</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/settings')}>
              <div className="si-icon"><Settings size={18}/></div>
              <div className="si-info"><div className="si-label">All Settings</div><div className="si-sub">Premium, referrals, notifications, delete account</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
          </div>

          {/* Referral Card */}
          <div className="referral-card">
            <div className="referral-title">🎁 Invite Friends, Earn Rewards</div>
            <div className="referral-subtitle">Share your code — when friends join, you both level up!</div>
            <div className="referral-row">
              <div className="referral-code">
                VIYA{phone?.slice(-4) || '0000'}
              </div>
              <button className="referral-share-btn" onClick={() => {
                const code = `VIYA${phone?.slice(-4) || '0000'}`
                const text = `Hey! I use Viya — an AI friend that helps me save money & build habits. 🔥\n\nUse my code ${code} when you sign up!\n\nhttps://heyviya.vercel.app/auth?ref=${code}`
                if (navigator.share) navigator.share({ title: 'Join Viya!', text })
                else { navigator.clipboard.writeText(text); alert('Referral link copied! 📋') }
              }}>
                Share 🔗
              </button>
            </div>
          </div>

          {/* Language & Family */}
          <div className="section-head" style={{marginTop:16}}><h3>More Settings</h3></div>
          <div className="settings-group">
            <button className="settings-item" onClick={() => {
              const current = getLang()
              const idx = LANGUAGES.findIndex(l => l.code === current)
              const nextLang = LANGUAGES[(idx + 1) % LANGUAGES.length]
              setLang(nextLang.code)
              setToast(`Language changed to ${nextLang.native}`)
              setTimeout(() => setToast(''), 2500)
              setTimeout(() => window.location.reload(), 800)
            }}>
              <div className="si-icon">🌐</div>
              <div className="si-info"><div className="si-label">{t('language')}</div><div className="si-sub">{LANGUAGES.find(l => l.code === getLang())?.native || 'English'} — tap to switch</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/family')}>
              <div className="si-icon">👨‍👩‍👧‍👦</div>
              <div className="si-info"><div className="si-label">Family Mode</div><div className="si-sub">Track expenses for family members</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/friends')}>
              <div className="si-icon">🤝</div>
              <div className="si-info"><div className="si-label">Friends</div><div className="si-sub">Connect & motivate each other</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => nav('/terms')}>
              <div className="si-icon"><FileText size={18}/></div>
              <div className="si-info"><div className="si-label">Terms of Service</div><div className="si-sub">Usage policies & guidelines</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
            <button className="settings-item" onClick={() => { setPwError(''); setPwForm({ current: '', next: '', confirm: '' }); setShowPasswordModal(true) }}>
              <div className="si-icon"><Lock size={18}/></div>
              <div className="si-info"><div className="si-label">Change Password</div><div className="si-sub">Update your login password</div></div>
              <ChevronRight size={16} className="si-arrow"/>
            </button>
          </div>

          {showPasswordModal && (
            <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
              <div className="avatar-picker-card" style={{ width: '100%', maxWidth: 420, margin: 16 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="avatar-picker-title" style={{ margin: 0 }}>Change Password</div>
                  <button className="modal-close" onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
                </div>

                <div className="auth-mode-toggle" style={{ marginBottom: 14 }}>
                  <button className={`mode-btn${pwMode === 'current' ? ' active' : ''}`} onClick={() => { setPwMode('current'); setPwError('') }}>
                    <Lock size={14} /> Current Password
                  </button>
                  <button className={`mode-btn${pwMode === 'otp' ? ' active' : ''}`} onClick={() => { setPwMode('otp'); setPwError('') }}>
                    <Smartphone size={14} /> WhatsApp OTP <span style={{ opacity: 0.6, fontSize: 10 }}>(soon)</span>
                  </button>
                </div>

                {pwMode === 'current' ? (
                  <>
                    <input type="password" className="input-field" placeholder="Current password"
                      value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} style={{ marginBottom: 8 }} />
                    <input type="password" className="input-field" placeholder="New password (min 6 chars)"
                      value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} style={{ marginBottom: 8 }} />
                    <input type="password" className="input-field" placeholder="Confirm new password"
                      value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                    {pwError && <p className="auth-err">{pwError}</p>}
                    <button className="btn-primary full" style={{ marginTop: 12 }} onClick={submitPasswordChange} disabled={pwSaving}>
                      {pwSaving ? 'Updating…' : 'Update Password'}
                    </button>
                  </>
                ) : (
                  <div className="callout--note" style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                    Verifying via WhatsApp OTP needs the WhatsApp Business API connected first. Use "Current Password" for now — this option unlocks automatically once that's set up.
                  </div>
                )}
              </div>
            </div>
          )}

          <button className="logout-btn" onClick={handleLogout}><LogOut size={18}/> Sign Out</button>

          <div className="profile-footer">
            <p>Viya — Your AI Life & Wealth Partner</p>
          </div>
        </>
      )}
    </div>
  )
}
