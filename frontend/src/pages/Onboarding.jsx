import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Globe, User, Briefcase, DollarSign, PiggyBank, Target, Shield, ChevronRight, ChevronLeft, Check, Sparkles, Smartphone, Bell } from 'lucide-react'

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

const STARTER_HABITS = [
  { id: 'track', emoji: '💰', label: 'Track expenses daily' },
  { id: 'water', emoji: '💧', label: 'Drink 3L water' },
  { id: 'workout', emoji: '🏋️', label: 'Workout / Exercise' },
  { id: 'read', emoji: '📖', label: 'Read 30 mins' },
  { id: 'meditate', emoji: '🧘', label: 'Meditate' },
  { id: 'healthy', emoji: '🥗', label: 'Eat healthy' },
  { id: 'nosocial', emoji: '📵', label: 'No social media 1h' },
  { id: 'sleep', emoji: '😴', label: 'Sleep by 11 PM' },
]

const STEPS = ['Language', 'Name', 'Persona', 'Income', 'Budget', 'Goal', 'Habits', 'Permissions', 'Done']

export default function Onboarding() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    language: 'en', name: '', age: '', city: '', occupation: '', persona: '', income: '', daily_budget: '',
    goal: '', selectedHabits: [], notifyAllowed: false
  })
  const [saving, setSaving] = useState(false)

  function next() { if (step < STEPS.length - 1) setStep(step + 1) }
  function prev() { if (step > 0) setStep(step - 1) }
  function set(key, val) { setForm({ ...form, [key]: val }) }
  function toggleHabit(id) {
    setForm(f => ({ ...f, selectedHabits: f.selectedHabits.includes(id)
      ? f.selectedHabits.filter(h => h !== id) : [...f.selectedHabits, id] }))
  }

  async function finish() {
    setSaving(true)
    try {
      await api.updateUser(phone, {
        name: form.name || 'User',
        age: form.age ? Number(form.age) : null,
        city: form.city || null,
        occupation: form.occupation || null,
        persona: form.persona,
        monthly_income: Number(form.income) || 0,
        daily_budget: Number(form.daily_budget) || 1000,
        language: form.language,
        current_savings: 0,
        monthly_expenses: 0,
        onboarding_complete: true,
      })

      for (const hId of form.selectedHabits) {
        const h = STARTER_HABITS.find(x => x.id === hId)
        if (h) await api.addHabit(phone, h.label, h.emoji)
      }

      if (form.goal) {
        const g = GOALS.find(x => x.id === form.goal)
        if (g) {
          const targets = { emergency: 100000, house: 2000000, car: 500000, travel: 50000, education: 200000, wedding: 500000, retire: 5000000, invest: 50000 }
          await api.addGoal(phone, g.label, g.emoji, targets[form.goal] || 100000)
        }
      }

      if (form.notifyAllowed && 'Notification' in window) {
        try { await Notification.requestPermission() } catch {}
      }
    } catch (e) { console.error('Onboarding save error:', e) }
    setSaving(false)
    nav('/')
  }

  const monthlyIncome = Number(form.income) || 0
  const suggestedBudget = monthlyIncome > 0 ? Math.round(monthlyIncome / 30) : 1000

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
          <h2>Tell us about yourself</h2>
          <p className="ob-sub">Viya will personalize your entire experience</p>
          <input type="text" className="form-input ob-input" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          <div className="ob-input-row">
            <input type="number" className="form-input ob-input" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)} />
            <input type="text" className="form-input ob-input" placeholder="City (e.g. Chennai)" value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <input type="text" className="form-input ob-input" placeholder="Occupation (e.g. Software Engineer)" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div className="ob-card">
          <Briefcase size={32} className="ob-icon" />
          <h2>What describes you best?</h2>
          <p className="ob-sub">This helps Viya give you personalized AI advice</p>
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
          <p className="ob-sub">Approximate monthly earnings (salary/freelance/pocket money)</p>
          <div className="ob-amount-wrap"><span className="ob-currency">₹</span><input type="number" className="form-input ob-amount" placeholder="25000" value={form.income} onChange={e => set('income', e.target.value)} /></div>
          {monthlyIncome > 0 && (
            <div className="ob-insight">
              <Sparkles size={14}/> 50-30-20 split: <strong>₹{Math.round(monthlyIncome*0.5).toLocaleString('en-IN')}</strong> needs, <strong>₹{Math.round(monthlyIncome*0.3).toLocaleString('en-IN')}</strong> wants, <strong>₹{Math.round(monthlyIncome*0.2).toLocaleString('en-IN')}</strong> savings
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="ob-card">
          <PiggyBank size={32} className="ob-icon" />
          <h2>Daily Budget</h2>
          <p className="ob-sub">How much can you spend per day?</p>
          <div className="ob-amount-wrap"><span className="ob-currency">₹</span><input type="number" className="form-input ob-amount" placeholder={suggestedBudget.toString()} value={form.daily_budget} onChange={e => set('daily_budget', e.target.value)} /></div>
          {suggestedBudget > 0 && <p className="ob-hint">💡 Suggested: ₹{suggestedBudget.toLocaleString('en-IN')}/day based on your income</p>}
        </div>
      )}

      {step === 5 && (
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

      {step === 6 && (
        <div className="ob-card">
          <Shield size={32} className="ob-icon" />
          <h2>Pick Your Habits</h2>
          <p className="ob-sub">Select habits you want to track daily. Viya will auto-detect these from your chats! 🤖</p>
          <div className="ob-grid">
            {STARTER_HABITS.map(h => (
              <button key={h.id} className={'ob-goal' + (form.selectedHabits.includes(h.id) ? ' active' : '')} onClick={() => toggleHabit(h.id)}>
                <span>{h.emoji}</span><span>{h.label}</span>
              </button>
            ))}
          </div>
          <p className="ob-hint">💡 Say "gym done" or "ate eggs" in chat → Viya auto-tracks it!</p>
        </div>
      )}

      {step === 7 && (
        <div className="ob-card">
          <Smartphone size={32} className="ob-icon" />
          <h2>Smart Permissions</h2>
          <p className="ob-sub">Enable features for the best experience</p>
          <div className="ob-permissions">
            <button className={'ob-perm' + (form.notifyAllowed ? ' active' : '')} onClick={() => set('notifyAllowed', !form.notifyAllowed)}>
              <Bell size={20}/>
              <div>
                <div className="ob-perm-title">🔔 Push Notifications</div>
                <div className="ob-perm-desc">Get habit reminders, budget alerts, daily tips</div>
              </div>
              <div className={'ob-toggle' + (form.notifyAllowed ? ' on' : '')}><div className="ob-toggle-dot"/></div>
            </button>
            <div className="ob-perm-info">
              <Sparkles size={14}/> <strong>Coming soon:</strong> Auto-detect bank SMS to track expenses automatically! 🏦
            </div>
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="ob-card ob-success">
          <div className="ob-check"><Check size={40} /></div>
          <h2>You're All Set! 🎉</h2>
          <p className="ob-sub">Viya is ready to be your AI best friend!</p>
          <div className="ob-summary">
            <div className="ob-sum-row"><span>Name</span><span>{form.name || 'User'}</span></div>
            <div className="ob-sum-row"><span>Type</span><span>{PERSONAS.find(p => p.id === form.persona)?.label || '-'}</span></div>
            <div className="ob-sum-row"><span>Income</span><span>₹{Number(form.income || 0).toLocaleString('en-IN')}/mo</span></div>
            <div className="ob-sum-row"><span>Budget</span><span>₹{Number(form.daily_budget || suggestedBudget).toLocaleString('en-IN')}/day</span></div>
            <div className="ob-sum-row"><span>Goal</span><span>{GOALS.find(g => g.id === form.goal)?.label || '-'}</span></div>
            <div className="ob-sum-row"><span>Habits</span><span>{form.selectedHabits.length} selected</span></div>
          </div>
        </div>
      )}

      <div className="ob-nav">
        {step > 0 && step < 8 && <button className="btn-secondary ob-back" onClick={prev}><ChevronLeft size={18} /> Back</button>}
        {step < 8 && <button className="btn-primary ob-next" onClick={next}>Continue <ChevronRight size={18} /></button>}
        {step === 8 && <button className="btn-primary ob-next" onClick={finish} disabled={saving}><Sparkles size={18} /> {saving ? 'Setting up...' : 'Start Using Viya'}</button>}
      </div>
    </div>
  )
}
