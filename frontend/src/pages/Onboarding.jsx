import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const GOALS = [
  { id: 'emergency', emoji: '🛡️', label: 'Save Emergency Fund' },
  { id: 'home', emoji: '🏠', label: 'Buy Home' },
  { id: 'car', emoji: '🚗', label: 'Buy Car' },
  { id: 'wedding', emoji: '💍', label: 'Wedding' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'business', emoji: '🏪', label: 'Start Business' },
  { id: 'education', emoji: '🎓', label: 'Education' },
  { id: 'retirement', emoji: '🌴', label: 'Retirement' },
]

const STEPS = ['Welcome', 'Name & Age', 'Income', 'Goals', 'Complete']

const stepVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
}

export default function Onboarding() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    age: '',
    income: '',
    goals: [],
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function toggleGoal(id) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(id)
        ? f.goals.filter(g => g !== id)
        : [...f.goals, id],
    }))
  }

  function validate() {
    const errs = {}
    if (step === 1) {
      if (!form.name.trim()) errs.name = 'Name is required'
      if (!form.age) errs.age = 'Age is required'
      else if (Number(form.age) < 10 || Number(form.age) > 120) errs.age = 'Enter a valid age'
    }
    if (step === 2) {
      if (!form.income) errs.income = 'Income is required'
      else if (Number(form.income) <= 0) errs.income = 'Enter a valid income'
    }
    if (step === 3) {
      if (form.goals.length === 0) errs.goals = 'Select at least one goal'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (step === 0) {
      setStep(1)
      return
    }
    if (!validate()) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  async function finish() {
    setSaving(true)
    try {
      const selectedGoalLabels = form.goals
        .map(id => GOALS.find(g => g.id === id)?.label)
        .filter(Boolean)

      await api.updateUser(phone, {
        name: form.name.trim() || 'User',
        age: Number(form.age) || null,
        monthly_income: Number(form.income) || 0,
        goals: selectedGoalLabels,
        onboarding_complete: true,
      })

      // Create goal entries
      const targets = {
        emergency: 100000,
        home: 2000000,
        car: 500000,
        wedding: 1000000,
        travel: 100000,
        business: 500000,
        education: 300000,
        retirement: 5000000,
      }
      for (const goalId of form.goals) {
        const g = GOALS.find(x => x.id === goalId)
        if (g) {
          await api.addGoal(phone, g.label, g.emoji, targets[goalId] || 100000)
        }
      }
    } catch (e) {
      console.error('Onboarding save error:', e)
    }
    setSaving(false)
    nav('/')
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="onboarding">
      {/* Progress bar */}
      <div className="ob-progress">
        <div className="ob-bar" style={{ width: progress + '%' }} />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            className="ob-card"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ob-check">
              <Sparkles size={36} />
            </div>
            <h2>Welcome to Viya</h2>
            <p className="ob-sub">
              Your AI-powered life and wealth partner. Let's set up your
              profile in just a few steps so Viya can give you personalized
              advice.
            </p>
          </motion.div>
        )}

        {/* Step 1: Name & Age */}
        {step === 1 && (
          <motion.div
            key="name-age"
            className="ob-card"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>About You</h2>
            <p className="ob-sub">Tell us your name and age to personalize your experience</p>

            <input
              type="text"
              className="form-input ob-input"
              placeholder="Your name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
            {errors.name && <p className="ob-error">{errors.name}</p>}

            <input
              type="number"
              className="form-input ob-input"
              placeholder="Your age"
              value={form.age}
              onChange={e => set('age', e.target.value)}
              min="10"
              max="120"
            />
            {errors.age && <p className="ob-error">{errors.age}</p>}
          </motion.div>
        )}

        {/* Step 2: Income */}
        {step === 2 && (
          <motion.div
            key="income"
            className="ob-card"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Monthly Income</h2>
            <p className="ob-sub">Your approximate monthly earnings help Viya plan better</p>

            <div className="ob-amount-wrap">
              <span className="ob-currency">₹</span>
              <input
                type="number"
                className="form-input ob-amount"
                placeholder="25000"
                value={form.income}
                onChange={e => set('income', e.target.value)}
                autoFocus
              />
            </div>
            {errors.income && <p className="ob-error">{errors.income}</p>}

            {Number(form.income) > 0 && (
              <div className="ob-insight">
                <Sparkles size={14} />
                50-30-20 split: <strong>₹{Math.round(Number(form.income) * 0.5).toLocaleString('en-IN')}</strong> needs,{' '}
                <strong>₹{Math.round(Number(form.income) * 0.3).toLocaleString('en-IN')}</strong> wants,{' '}
                <strong>₹{Math.round(Number(form.income) * 0.2).toLocaleString('en-IN')}</strong> savings
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <motion.div
            key="goals"
            className="ob-card"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>Your Goals</h2>
            <p className="ob-sub">What do you want to achieve? Select all that apply.</p>

            <div className="ob-grid">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  className={'ob-goal' + (form.goals.includes(g.id) ? ' active' : '')}
                  onClick={() => toggleGoal(g.id)}
                >
                  <span>{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
            {errors.goals && <p className="ob-error">{errors.goals}</p>}
          </motion.div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <motion.div
            key="complete"
            className="ob-card ob-success"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ob-check">
              <Check size={40} />
            </div>
            <h2>You're All Set!</h2>
            <p className="ob-sub">Viya is ready to help you manage your life and wealth.</p>

            <div className="ob-summary">
              <div className="ob-sum-row">
                <span>Name</span>
                <span>{form.name || 'User'}</span>
              </div>
              <div className="ob-sum-row">
                <span>Age</span>
                <span>{form.age || '-'}</span>
              </div>
              <div className="ob-sum-row">
                <span>Income</span>
                <span>{'₹'}{Number(form.income || 0).toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="ob-sum-row">
                <span>Goals</span>
                <span>
                  {form.goals
                    .map(id => GOALS.find(g => g.id === id)?.label)
                    .filter(Boolean)
                    .join(', ') || '-'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="ob-nav">
        {step > 0 && step < 4 && (
          <button className="btn-secondary ob-back" onClick={prev}>
            <ChevronLeft size={18} /> Back
          </button>
        )}
        {step < 4 && (
          <button className="btn-primary ob-next" onClick={next}>
            {step === 0 ? 'Get Started' : 'Continue'} <ChevronRight size={18} />
          </button>
        )}
        {step === 4 && (
          <button className="btn-primary ob-next" onClick={finish} disabled={saving}>
            <Sparkles size={18} /> {saving ? 'Setting up...' : 'Start Using Viya'}
          </button>
        )}
      </div>
    </div>
  )
}
