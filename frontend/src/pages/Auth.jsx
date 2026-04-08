import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Phone, Lock, Sparkles, MessageCircle, ArrowRight, Shield } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('otp') // 'otp' or 'password'
  const [step, setStep] = useState('phone') // 'phone', 'otp', 'done'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [tab, setTab] = useState('login')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const nav = useNavigate()

  // OTP LOGIN
  async function sendOTP(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    if (phone.length < 10) { setErr('Enter valid 10-digit number'); setLoading(false); return }
    try {
      const r = await fetch(`/api/webhook?action=send_otp&phone=${phone}`)
      const d = await r.json()
      if (d.success) { setStep('otp'); setInfo('OTP sent to your WhatsApp! 📱') }
      else setErr(d.message || 'Failed to send OTP')
    } catch { setErr('Network error') }
    setLoading(false)
  }

  async function verifyOTP(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const r = await fetch(`/api/webhook?action=verify_otp&phone=${phone}&otp=${otp}`)
      const d = await r.json()
      if (d.success) {
        // Auto-login after OTP verification
        const user = await api.getUser(phone)
        login(phone, 'sb_' + phone, user || {})
        localStorage.setItem('mv_token', 'sb_' + phone)
        localStorage.setItem('mv_phone', phone)
        nav('/')
      } else setErr(d.message || 'Invalid OTP')
    } catch { setErr('Network error') }
    setLoading(false)
  }

  // PASSWORD LOGIN
  async function handleLogin(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const d = await api.login(phone, pass)
      if (d.success) { login(phone, d.token, d.user); nav('/') }
      else setErr(d.message || 'Login failed')
    } catch { setErr('Network error') }
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault(); setErr('')
    if (pass !== pass2) { setErr('Passwords do not match'); return }
    setLoading(true)
    try {
      const d = await api.register(phone, pass)
      if (d.success) { setTab('login'); setInfo('Account created! Sign in now.') }
      else setErr(d.message)
    } catch { setErr('Network error') }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo"><Sparkles size={28}/></div>
        <h1 className="auth-title">MoneyViya</h1>
        <p className="auth-sub">Your AI Personal Assistant</p>

        {/* Mode Toggle */}
        <div className="auth-mode-toggle">
          <button className={`mode-btn${mode==='otp'?' active':''}`} onClick={() => { setMode('otp'); setStep('phone'); setErr(''); setInfo('') }}>
            <MessageCircle size={14}/> WhatsApp OTP
          </button>
          <button className={`mode-btn${mode==='password'?' active':''}`} onClick={() => { setMode('password'); setErr(''); setInfo('') }}>
            <Lock size={14}/> Password
          </button>
        </div>

        {mode === 'otp' ? (
          // OTP LOGIN FLOW
          <div className="auth-form">
            {step === 'phone' ? (
              <form onSubmit={sendOTP}>
                <div className="otp-info">
                  <Shield size={18} className="otp-shield"/>
                  <span>Login securely via WhatsApp OTP</span>
                </div>
                <div className="input-wrap"><Phone size={16}/><input type="tel" placeholder="Your 10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} required maxLength={10}/></div>
                {err && <p className="auth-err">{err}</p>}
                {info && <p className="auth-info">{info}</p>}
                <button type="submit" className="btn-primary full" disabled={loading}>
                  {loading ? 'Sending OTP...' : <><MessageCircle size={16}/> Send OTP via WhatsApp</>}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOTP}>
                <div className="otp-info">
                  <MessageCircle size={18} className="otp-shield"/>
                  <span>Enter the 6-digit OTP sent to your WhatsApp</span>
                </div>
                <div className="otp-phone-display">+91 {phone}</div>
                <div className="input-wrap otp-input"><Lock size={16}/><input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required maxLength={6} style={{letterSpacing:'8px', fontSize:22, fontFamily:'var(--mono)', textAlign:'center'}}/></div>
                {err && <p className="auth-err">{err}</p>}
                {info && <p className="auth-info">{info}</p>}
                <button type="submit" className="btn-primary full" disabled={loading}>
                  {loading ? 'Verifying...' : <><ArrowRight size={16}/> Verify & Login</>}
                </button>
                <button type="button" className="link-btn resend-btn" onClick={sendOTP}>Resend OTP</button>
                <button type="button" className="link-btn resend-btn" onClick={() => setStep('phone')}>Change number</button>
              </form>
            )}
          </div>
        ) : (
          // PASSWORD LOGIN/REGISTER
          <>
            <div className="auth-tabs">
              <button className={'auth-tab'+(tab==='login'?' active':'')} onClick={() => setTab('login')}>Sign In</button>
              <button className={'auth-tab'+(tab==='register'?' active':'')} onClick={() => setTab('register')}>Register</button>
            </div>
            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="auth-form">
              <div className="input-wrap"><Phone size={16}/><input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} required/></div>
              <div className="input-wrap"><Lock size={16}/><input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} required minLength={6}/></div>
              {tab === 'register' && <div className="input-wrap"><Lock size={16}/><input type="password" placeholder="Confirm password" value={pass2} onChange={e => setPass2(e.target.value)} required/></div>}
              {err && <p className="auth-err">{err}</p>}
              {info && <p className="auth-info">{info}</p>}
              <button type="submit" className="btn-primary full" disabled={loading}>{loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
