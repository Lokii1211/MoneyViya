import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Splash from './pages/Splash'
import { HomeSkeleton } from './components/SkeletonLoader'
import OfflineBanner from './components/OfflineBanner'
import './index.css'

// Core pages
const Auth = lazy(() => import('./pages/Auth'))
const Home = lazy(() => import('./pages/Home'))
const Onboarding = lazy(() => import('./pages/Onboarding'))

// Money
const Expenses = lazy(() => import('./pages/Expenses'))
const Budget = lazy(() => import('./pages/Budget'))
const Goals = lazy(() => import('./pages/Goals'))
const Bills = lazy(() => import('./pages/Bills'))
const Wealth = lazy(() => import('./pages/Wealth'))
const Report = lazy(() => import('./pages/Report'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Splits = lazy(() => import('./pages/Splits'))
const Lending = lazy(() => import('./pages/Lending'))
const BankConnect = lazy(() => import('./pages/BankConnect'))
const PortfolioDashboard = lazy(() => import('./pages/PortfolioDashboard'))

// Life
const Habits = lazy(() => import('./pages/Habits'))
const Health = lazy(() => import('./pages/Health'))
const CalendarScreen = lazy(() => import('./pages/CalendarScreen'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Journal = lazy(() => import('./pages/Journal'))
const Medicine = lazy(() => import('./pages/Medicine'))
const SleepTracker = lazy(() => import('./pages/SleepTracker'))
const Meals = lazy(() => import('./pages/Meals'))

// Intelligence
const Chat = lazy(() => import('./pages/Chat'))
const EmailIntelligence = lazy(() => import('./pages/EmailIntelligence'))
const Insights = lazy(() => import('./pages/Insights'))
const Predictions = lazy(() => import('./pages/Predictions'))

// Social
const Friends = lazy(() => import('./pages/Friends'))
const Family = lazy(() => import('./pages/Family'))
const Community = lazy(() => import('./pages/Community'))

// Profile & Settings
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Rewards = lazy(() => import('./pages/Rewards'))
const PremiumUpgrade = lazy(() => import('./pages/PremiumUpgrade'))
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'))
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'))
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'))
const MorningBrief = lazy(() => import('./pages/MorningBrief'))
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'))

// Utility
const Search = lazy(() => import('./pages/Search'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Review = lazy(() => import('./pages/Review'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Help = lazy(() => import('./pages/Help'))
const Terms = lazy(() => import('./pages/Terms'))

function PageLoader() {
  return <div className="page"><HomeSkeleton /></div>
}

function Protected({ children }) {
  const { isLoggedIn } = useApp()
  return isLoggedIn ? children : <Navigate to="/auth" />
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const { theme } = useApp()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light')
  }, [theme])

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />
  }

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <OfflineBanner />
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
            <Route path="bank-connect" element={<BankConnect />} />
            <Route path="portfolio" element={<PortfolioDashboard />} />
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
            {/* Profile & Settings */}
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="premium" element={<PremiumUpgrade />} />
            <Route path="notification-settings" element={<NotificationSettings />} />
            <Route path="referral" element={<ReferralProgram />} />
            <Route path="weekly-report" element={<WeeklyReport />} />
            <Route path="morning-brief" element={<MorningBrief />} />
            <Route path="review" element={<Review />} />
            <Route path="search" element={<Search />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="delete-account" element={<DeleteAccount />} />
            {/* Static */}
            <Route path="privacy" element={<Privacy />} />
            <Route path="help" element={<Help />} />
            <Route path="terms" element={<Terms />} />
          </Route>
        </Routes>
      </Suspense>
    </>
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
