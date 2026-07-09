import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet, Flame, Heart, Bell, MessageCircle, Target,
  Shield, ArrowRight,
} from 'lucide-react'

const FEATURES = [
  { icon: <Wallet size={20} />, title: 'Expenses & Budget', desc: 'Log spending in seconds, track budgets by category, see where your money actually goes.' },
  { icon: <Target size={20} />, title: 'Savings Goals', desc: 'Set a target, add money as you save, watch real progress with milestone celebrations.' },
  { icon: <Flame size={20} />, title: 'Habits & Streaks', desc: 'Build daily habits with streak tracking — workouts, reading, water, anything you want to stick to.' },
  { icon: <Heart size={20} />, title: 'Health Log', desc: 'Steps, sleep, water, weight, mood — one place for your daily wellness, with a real health score.' },
  { icon: <Bell size={20} />, title: 'Smart Reminders', desc: 'Daily, weekly, monthly, or one-time — reminders that reach you on WhatsApp, not just in-app.' },
  { icon: <MessageCircle size={20} />, title: 'Ask Viya', desc: 'An AI you can talk to in plain language — log an expense, check in on a habit, ask for advice.' },
]

export default function Landing() {
  const nav = useNavigate()

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <img src="/logo.png" alt="Viya" className="landing-logo" />
          <span>Viya</span>
        </div>
        <button className="btn-secondary landing-nav-cta" onClick={() => nav('/auth')}>Sign In</button>
      </header>

      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="landing-h1">Your money, habits, and health — in one place, run by AI.</h1>
          <p className="landing-lede">
            Viya is a personal life assistant: track expenses and savings goals, build daily habits,
            log your health, and get reminders that actually reach you — on WhatsApp or in the app.
          </p>
          <div className="landing-cta-row">
            <button className="btn-primary landing-cta" onClick={() => nav('/auth')}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="btn-secondary landing-cta" onClick={() => nav('/auth')}>Sign In</button>
          </div>
        </motion.div>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">Everything in one app</h2>
        <div className="landing-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <p className="landing-feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="landing-privacy">
        <Shield size={18} />
        <span>Your data is yours. We never sell it, and you can delete your account and everything in it, anytime.</span>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a href="/terms">Terms</a>
          <span>·</span>
          <a href="/privacy">Privacy</a>
          <span>·</span>
          <a href="/help">Help</a>
        </div>
        <div className="landing-footer-copy">© {new Date().getFullYear()} Viya</div>
      </footer>
    </div>
  )
}
