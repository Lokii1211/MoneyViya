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
import Profile from './pages/Profile'
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
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

