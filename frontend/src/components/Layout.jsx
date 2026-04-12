import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Receipt, Flame, MessageCircle, User, Bell, Search } from 'lucide-react'

export default function Layout() {
  const nav = useNavigate()
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand" onClick={() => nav('/')} style={{cursor:'pointer'}}>
          <img src="/logo.png" alt="Viya" className="app-header-logo" />
          <span className="app-header-title">Viya</span>
        </div>
        <div className="app-header-actions">
          <button className="header-icon-btn" onClick={() => nav('/search')} aria-label="Search">
            <Search size={18}/>
          </button>
          <button className="header-icon-btn" onClick={() => nav('/notifications')} aria-label="Notifications">
            <Bell size={18}/>
            <span className="notif-dot"></span>
          </button>
        </div>
      </header>
      <main className="app-main"><Outlet /></main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({isActive})=>'nav-item'+(isActive?' active':'')}>
          <Home size={20}/><span>Home</span>
        </NavLink>
        <NavLink to="/expenses" className={({isActive})=>'nav-item'+(isActive?' active':'')}>
          <Receipt size={20}/><span>Money</span>
        </NavLink>
        <NavLink to="/chat" className="nav-fab">
          <MessageCircle size={22}/>
        </NavLink>
        <NavLink to="/habits" className={({isActive})=>'nav-item'+(isActive?' active':'')}>
          <Flame size={20}/><span>Habits</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive})=>'nav-item'+(isActive?' active':'')}>
          <User size={20}/><span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
