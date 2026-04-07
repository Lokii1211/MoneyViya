import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Globe, User, Briefcase, DollarSign, PiggyBank, Target, Shield, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
]

const PERSONAS = [
  { id: 'student', emoji: '🎓', label: 'Student', desc: 'College or school student' },
  { id: 'salaried', emoji: '💼', label: 'Salaried', desc: 'Regular job / monthly salary' },
  { id: 'freelancer', emoji: '🎯', label: 'Freelancer', desc: 'Gig worker / self-employed' },
  { id: 'business', emoji: '🏪', label: 'Business Owner', desc: 'Small or large business' },
  { id: 'homemaker', emoji: '🏠', label: 'Homemaker', desc: 'Managing household' },
  { id: 'retired', emoji: '🌴', label: 'Retired', desc: 'Pension / investments' },
]

const GOALS = [
  { id: 'emergency', emoji: '🛡️', label: 'Emergency Fund' },
  { id: 'house', emoji: '🏠', label: 'Buy a House' },
  { id: 'car', emoji: '🚗', label: 'Buy a Car' },
  { id: 'travel', emoji: '✈️', label: 'Travel Fund' },
  { id: 'education', emoji: '🎓', label: 'Education' },
  { id: 'wedding', emoji: '💍', label: 'Wedding' },
  { id: 'retire', emoji: '🌴', label: 'Retirement' },
  { id: 'invest', emoji: '📈', label: 'Start Investing' },
]

const STEPS = ['Language', 'Name', 'Persona', 'Income', 'Expenses', 'Savings', 'Goal', 'Done']

export default function Onboarding() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ language: 'en', name: '', persona: '', income: '', expenses: '', savings: '', goal: '' })

  function next() { if (step < STEPS.length - 1) setStep(step + 1) }
  function prev() { if (step > 0) setStep(step - 1) }
  function set(key, val) { setForm({ ...form, [key]: val }) }

  async function finish() {
    const msgs = [
      `my name is ${form.name}`,
      `I am a ${form.persona}`,
      `my monthly income is ${form.income}`,
      `my monthly expenses are ${form.expenses}`,
      `my current savings are ${form.savings}`,
      `my primary goal is ${form.goal}`,
    ]
    for (const m of msgs) {
      try { await api.chat(phone, m) } catch {}
    }
    nav('/')
  }

  return (
    <div className="onboarding">
      <div className="ob-progress">
        <div className="ob-bar" style={{ width: ((step + 1) / STEPS.length * 100) + '%' }} />
      </div>
      <div className="ob-step-label">Step {step + 1} of {STEPS.length}</div>

      {step === 0 && (
        <div className="ob-card">
          <Globe size={32} className="ob-icon" />
          <h2>Choose Language</h2>
          <p className="ob-sub">Select your preferred language</p>
          <div className="ob-options">
            {LANGUAGES.map(l => (
              <button key={l.code} className={'ob-option' + (form.language === l.code ? ' active' : '')} onClick={() => set('language', l.code)}>
                <span className="ob-opt-main">{l.native}</span><span className="ob-opt-sub">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="ob-card">
          <User size={32} className="ob-icon" />
          <h2>What's your name?</h2>
          <p className="ob-sub">We'll use this to personalize your experience</p>
          <input type="text" className="form-input ob-input" placeholder="Enter your name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>
      )}

      {step === 2 && (
        <div className="ob-card">
          <Briefcase size={32} className="ob-icon" />
          <h2>What describes you best?</h2>
          <p className="ob-sub">This helps us tailor financial advice for you</p>
          <div className="ob-grid">
            {PERSONAS.map(p => (
              <button key={p.id} className={'ob-persona' + (form.persona === p.id ? ' active' : '')} onClick={() => set('persona', p.id)}>
                <span className="ob-p-emoji">{p.emoji}</span>
                <span className="ob-p-label">{p.label}</span>
                <span className="ob-p-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="ob-card">
          <DollarSign size={32} className="ob-icon" />
          <h2>Monthly Income</h2>
          <p className="ob-sub">Your approximate monthly earnings</p>
          <div className="ob-amount-wrap"><span className="ob-currency">₹</span><input type="number" className="form-input ob-amount" placeholder="50000" value={form.income} onChange={e => set('income', e.target.value)} /></div>
        </div>
      )}

      {step === 4 && (
        <div className="ob-card">
          <DollarSign size={32} className="ob-icon" />
          <h2>Monthly Expenses</h2>
          <p className="ob-sub">Your approximate monthly spending</p>
          <div className="ob-amount-wrap"><span className="ob-currency">₹</span><input type="number" className="form-input ob-amount" placeholder="30000" value={form.expenses} onChange={e => set('expenses', e.target.value)} /></div>
        </div>
      )}

      {step === 5 && (
        <div className="ob-card">
          <PiggyBank size={32} className="ob-icon" />
          <h2>Current Savings</h2>
          <p className="ob-sub">Total savings across all accounts</p>
          <div className="ob-amount-wrap"><span className="ob-currency">₹</span><input type="number" className="form-input ob-amount" placeholder="100000" value={form.savings} onChange={e => set('savings', e.target.value)} /></div>
        </div>
      )}

      {step === 6 && (
        <div className="ob-card">
          <Target size={32} className="ob-icon" />
          <h2>Primary Financial Goal</h2>
          <p className="ob-sub">What do you want to achieve first?</p>
          <div className="ob-grid">
            {GOALS.map(g => (
              <button key={g.id} className={'ob-goal' + (form.goal === g.id ? ' active' : '')} onClick={() => set('goal', g.id)}>
                <span>{g.emoji}</span><span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="ob-card ob-success">
          <div className="ob-check"><Check size={40} /></div>
          <h2>You're All Set! 🎉</h2>
          <p className="ob-sub">Your private wealth manager is ready. Let's start building your financial future!</p>
          <div className="ob-summary">
            <div className="ob-sum-row"><span>Name</span><span>{form.name}</span></div>
            <div className="ob-sum-row"><span>Type</span><span>{form.persona}</span></div>
            <div className="ob-sum-row"><span>Income</span><span>₹{Number(form.income || 0).toLocaleString('en-IN')}</span></div>
            <div className="ob-sum-row"><span>Expenses</span><span>₹{Number(form.expenses || 0).toLocaleString('en-IN')}</span></div>
            <div className="ob-sum-row"><span>Savings</span><span>₹{Number(form.savings || 0).toLocaleString('en-IN')}</span></div>
            <div className="ob-sum-row"><span>Goal</span><span>{form.goal}</span></div>
          </div>
        </div>
      )}

      <div className="ob-nav">
        {step > 0 && step < 7 && <button className="btn-secondary ob-back" onClick={prev}><ChevronLeft size={18} /> Back</button>}
        {step < 7 && <button className="btn-primary ob-next" onClick={next}>Continue <ChevronRight size={18} /></button>}
        {step === 7 && <button className="btn-primary ob-next" onClick={finish}><Sparkles size={18} /> Start Using MoneyViya</button>}
      </div>
    </div>
  )
}
