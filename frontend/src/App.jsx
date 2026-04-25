import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store'
import Layout from './components/Layout'
import Splash from './pages/Splash'
import './design-system.css'
import './index.css'

// Lazy load pages for code splitting
const Auth = lazy(() => import('./pages/Auth'))
const Home = lazy(() => import('./pages/Home'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Budget = lazy(() => import('./pages/Budget'))
const Goals = lazy(() => import('./pages/Goals'))
const Habits = lazy(() => import('./pages/Habits'))
const Chat = lazy(() => import('./pages/Chat'))
const Review = lazy(() => import('./pages/Review'))
const Search = lazy(() => import('./pages/Search'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Help = lazy(() => import('./pages/Help'))
const Profile = lazy(() => import('./pages/Profile'))
const Report = lazy(() => import('./pages/Report'))
const Family = lazy(() => import('./pages/Family'))
const Terms = lazy(() => import('./pages/Terms'))
const Friends = lazy(() => import('./pages/Friends'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))
const Community = lazy(() => import('./pages/Community'))
const Health = lazy(() => import('./pages/Health'))
const Bills = lazy(() => import('./pages/Bills'))
const Wealth = lazy(() => import('./pages/Wealth'))
const EmailIntelligence = lazy(() => import('./pages/EmailIntelligence'))
const CalendarScreen = lazy(() => import('./pages/CalendarScreen'))

// Loading fallback with skeleton
function PageLoader() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <div className="skeleton" style={{ width: '60%', height: 28 }} />
      <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 20 }} />
      <div className="skeleton" style={{ width: '100%', height: 80, borderRadius: 16 }} />
      <div className="skeleton" style={{ width: '100%', height: 80, borderRadius: 16 }} />
    </div>
  )
}

function Protected({ children }) {
  const { isLoggedIn } = useApp()
  return isLoggedIn ? children : <Navigate to="/auth" />
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const { theme } = useApp()

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light')
  }, [theme])

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route index element={<Home />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="budget" element={<Budget />} />
          <Route path="goals" element={<Goals />} />
          <Route path="habits" element={<Habits />} />
          <Route path="chat" element={<Chat />} />
          <Route path="review" element={<Review />} />
          <Route path="search" element={<Search />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="help" element={<Help />} />
          <Route path="profile" element={<Profile />} />
          <Route path="report" element={<Report />} />
          <Route path="family" element={<Family />} />
          <Route path="terms" element={<Terms />} />
          <Route path="friends" element={<Friends />} />
          <Route path="community" element={<Community />} />
          <Route path="delete-account" element={<DeleteAccount />} />
          <Route path="health" element={<Health />} />
          <Route path="bills" element={<Bills />} />
          <Route path="wealth" element={<Wealth />} />
          <Route path="email" element={<EmailIntelligence />} />
          <Route path="calendar" element={<CalendarScreen />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  )
}
