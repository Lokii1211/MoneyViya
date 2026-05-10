import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Splash from './pages/Splash'
import { HomeSkeleton } from './components/SkeletonLoader'
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

// V3 New Screens
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Splits = lazy(() => import('./pages/Splits'))
const Journal = lazy(() => import('./pages/Journal'))
const Medicine = lazy(() => import('./pages/Medicine'))
const SleepTracker = lazy(() => import('./pages/SleepTracker'))
const Meals = lazy(() => import('./pages/Meals'))
const Rewards = lazy(() => import('./pages/Rewards'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Insights = lazy(() => import('./pages/Insights'))
const Predictions = lazy(() => import('./pages/Predictions'))
const Settings = lazy(() => import('./pages/Settings'))
const Lending = lazy(() => import('./pages/Lending'))

// Loading fallback with V3 skeleton
function PageLoader() {
  return (
    <div className="page">
      <HomeSkeleton />
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
          {/* Money */}
          <Route path="expenses" element={<Expenses />} />
          <Route path="budget" element={<Budget />} />
          <Route path="goals" element={<Goals />} />
          <Route path="bills" element={<Bills />} />
          <Route path="wealth" element={<Wealth />} />
          <Route path="report" element={<Report />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="splits" element={<Splits />} />
          <Route path="lending" element={<Lending />} />
          {/* Life */}
          <Route path="habits" element={<Habits />} />
          <Route path="health" element={<Health />} />
          <Route path="calendar" element={<CalendarScreen />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="journal" element={<Journal />} />
          <Route path="medicine" element={<Medicine />} />
          <Route path="sleep" element={<SleepTracker />} />
          <Route path="meals" element={<Meals />} />
          {/* Intelligence */}
          <Route path="chat" element={<Chat />} />
          <Route path="email" element={<EmailIntelligence />} />
          <Route path="insights" element={<Insights />} />
          <Route path="predictions" element={<Predictions />} />
          {/* Social */}
          <Route path="friends" element={<Friends />} />
          <Route path="family" element={<Family />} />
          <Route path="community" element={<Community />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          {/* Profile & Settings */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="review" element={<Review />} />
          <Route path="search" element={<Search />} />
          <Route path="notifications" element={<Notifications />} />
          {/* Static */}
          <Route path="privacy" element={<Privacy />} />
          <Route path="help" element={<Help />} />
          <Route path="terms" element={<Terms />} />
          <Route path="delete-account" element={<DeleteAccount />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  )
}
