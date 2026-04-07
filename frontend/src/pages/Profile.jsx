import { useApp } from '../lib/store'
import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Globe, Shield, Bell, HelpCircle, ChevronRight } from 'lucide-react'

export default function Profile() {
  const { user, phone, logout } = useApp()
  const nav = useNavigate()
  const name = user?.name || 'User'

  function handleLogout() { logout(); nav('/auth') }

  const items = [
    { icon: <Moon size={18} />, label: 'Appearance', sub: 'Dark mode', action: () => {} },
    { icon: <Globe size={18} />, label: 'Language', sub: user?.language || 'English', action: () => {} },
    { icon: <Bell size={18} />, label: 'Notifications', sub: 'Push & reminders', action: () => {} },
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
          <div className="profile-phone">{phone}</div>
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
    </div>
  )
}
