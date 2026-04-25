import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Receipt, Flame, MessageCircle, User, Bell, Search } from 'lucide-react'
import { useNotificationStore } from '../stores'

export default function Layout() {
  const nav = useNavigate()
  const unread = useNotificationStore(s => s.unreadCount)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => nav('/')}>
          <img src="/logo.png" alt="Viya" style={{
            width: 34, height: 34, borderRadius: 10, objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0,176,182,0.3))',
          }} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: -0.5 }}>Viya</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }} onClick={() => nav('/search')} aria-label="Search">
            <Search size={20} />
          </button>
          <button className="btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', position: 'relative' }} onClick={() => nav('/notifications')} aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && <span className="badge" style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, fontSize: 9 }}>{unread > 9 ? '9+' : unread}</span>}
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <Home size={22} className="nav-icon" />
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <Receipt size={22} className="nav-icon" />
          <span className="nav-label">Money</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} style={{ position: 'relative' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-teal)',
            marginTop: -16,
            transition: 'transform 0.15s var(--ease)',
          }}>
            <MessageCircle size={22} color="white" />
          </div>
        </NavLink>
        <NavLink to="/habits" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <Flame size={22} className="nav-icon" />
          <span className="nav-label">Habits</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <User size={22} className="nav-icon" />
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
