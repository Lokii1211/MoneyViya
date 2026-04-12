import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Expenses from './pages/Expenses'
import Budget from './pages/Budget'
import Goals from './pages/Goals'
import Habits from './pages/Habits'
import Chat from './pages/Chat'
import Review from './pages/Review'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Reminders from './pages/Reminders'
import Privacy from './pages/Privacy'
import Help from './pages/Help'
import Profile from './pages/Profile'
import Report from './pages/Report'
import Family from './pages/Family'
import Terms from './pages/Terms'
import Community from './pages/Community'
import Onboarding from './pages/Onboarding'
import Layout from './components/Layout'
import './index.css'

function Protected({ children }) {
  const { isLoggedIn } = useApp()
  return isLoggedIn ? children : <Navigate to="/auth" />
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
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
<Route path="community" element={<Community />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
