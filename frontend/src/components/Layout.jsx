import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Home, AlarmClock, Wallet, Flame, User, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../stores'
import { useHaptics } from '../hooks/useHaptics'
import { t } from '../lib/i18n'

function getNavItems() {
  return [
    { to: '/', icon: Home, label: t('home'), end: true },
    { to: '/reminders', icon: AlarmClock, label: 'Reminders' },
    { to: '/wealth', icon: Wallet, label: 'Wealth', center: true },
    { to: '/habits', icon: Flame, label: 'Habits' },
    { to: '/profile', icon: User, label: t('profile') },
  ]
}

function AnimatedTabBar() {
  const location = useLocation()
  const haptics = useHaptics()
  const navItems = getNavItems()

  const activeIndex = navItems.findIndex(item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )

  return (
    <nav className="bottom-nav" style={{ position: 'relative' }}>
      {/* Animated active indicator */}
      <motion.div
        layoutId="tab-indicator"
        style={{
          position: 'absolute', top: 0, left: `${(activeIndex >= 0 ? activeIndex : 0) * 20}%`,
          width: '20%', height: 3, borderRadius: '0 0 3px 3px',
          background: 'var(--gradient-primary)',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      />

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          onClick={() => haptics.light()}
          style={item.center ? { position: 'relative' } : {}}
        >
          {item.center ? (
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-teal)',
                marginTop: -16,
              }}
            >
              <item.icon size={22} color="white" />
            </motion.div>
          ) : (
            <>
              <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }}>
                <item.icon size={22} className="nav-icon" />
              </motion.div>
              <span className="nav-label">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const nav = useNavigate()
  const location = useLocation()
  const unread = useNotificationStore(s => s.unreadCount)
  const mainRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const handler = () => setScrolled(el.scrollTop > 32)
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <header className={`app-header${scrolled ? ' scrolled' : ''}`} role="banner">
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => nav('/')}
          whileTap={{ scale: 0.97 }}
        >
          <img src="/logo.png" alt="Viya" className="app-header-logo" />
          <span className="app-header-title">Viya</span>
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="btn-ghost"
            style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}
            onClick={() => nav('/search')}
            aria-label="Search"
          >
            <Search size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="btn-ghost"
            style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', position: 'relative' }}
            onClick={() => nav('/notifications')}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="badge"
                style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, fontSize: 9 }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </motion.button>
        </div>
      </header>

      <main className="app-main" ref={mainRef} id="main-content" role="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ width: '100%', minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatedTabBar />
    </div>
  )
}
