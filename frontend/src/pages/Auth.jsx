import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Phone, Lock, Sparkles, MessageCircle, ArrowRight, Shield, Eye, EyeOff, User } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('otp') // 'otp' or 'password'
  const [step, setStep] = useState('phone') // 'phone', 'otp', 'done'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [name, setName] = useState('')
  const [tab, setTab] = useState('login')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const { login } = useApp()
  const nav = useNavigate()

  const WA_NUMBER = '917305021304' // Your WhatsApp Business number
  const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hi`

  // OTP LOGIN
  async function sendOTP(e) {
    e?.preventDefault(); setErr(''); setLoading(true)
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
        const user = await api.getUser(phone)
        login(phone, 'sb_' + phone, user || {})
        localStorage.setItem('mv_token', 'sb_' + phone)
        localStorage.setItem('mv_phone', phone)
        if (!user?.onboarding_complete && !user?.persona) {
          nav('/onboarding')
        } else {
          nav('/')
        }
      } else setErr(d.message || 'Invalid OTP')
    } catch { setErr('Network error') }
    setLoading(false)
  }

  // PASSWORD LOGIN
  async function handleLogin(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const d = await api.login(phone, pass)
      if (d.success) {
        login(phone, d.token, d.user)
        if (!d.user?.onboarding_complete && !d.user?.persona) {
          nav('/onboarding')
        } else {
          nav('/')
        }
      }
      else setErr(d.message || 'Login failed')
    } catch { setErr('Network error') }
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault(); setErr('')
    if (phone.length < 10) { setErr('Enter valid 10-digit number'); return }
    if (pass.length < 6) { setErr('Password must be at least 6 characters'); return }
    if (pass !== pass2) { setErr('Passwords do not match'); return }
    setLoading(true)
    try {
      const d = await api.register(phone, pass, name || 'User')
      if (d.success) {
        // Auto-login and go to onboarding
        login(phone, 'sb_' + phone, { phone, name: name || 'User' })
        localStorage.setItem('mv_token', 'sb_' + phone)
        localStorage.setItem('mv_phone', phone)
        nav('/onboarding')
      }
      else setErr(d.message)
    } catch { setErr('Network error') }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <img src="/logo.png" alt="Viya" className="auth-logo-img" />
        <h1 className="auth-title">Viya</h1>
        <p className="auth-sub">Your AI Life & Wealth Partner</p>

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
                
                {/* WhatsApp First-Time Instruction */}
                <div style={{marginTop:12, padding:'10px 14px', background:'#e8f5e9', borderRadius:10, border:'1px solid #c8e6c9'}}>
                  <p style={{fontSize:12, color:'#2e7d32', margin:0, lineHeight:1.6, textAlign:'center'}}>
                    <strong>⚠️ First time?</strong> You must message us on WhatsApp before requesting OTP.
                  </p>
                  <a 
                    href={WA_LINK} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, padding:'8px 16px', background:'#25D366', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600}}
                  >
                    <MessageCircle size={16}/> Chat with Viya on WhatsApp
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={verifyOTP}>
                <div className="otp-info">
                  <MessageCircle size={18} className="otp-shield"/>
                  <span>Enter the 6-digit OTP sent to your WhatsApp</span>
                </div>
                <div className="otp-phone-display">+91 {phone}</div>
                <div className="input-wrap otp-input"><Lock size={16}/><input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required maxLength={6} style={{letterSpacing:'4px', fontSize:16, fontFamily:'var(--mono)', textAlign:'center'}}/></div>
                {err && <p className="auth-err">{err}</p>}
                {info && <p className="auth-info">{info}</p>}
                <button type="submit" className="btn-primary full" disabled={loading}>
                  {loading ? 'Verifying...' : <><ArrowRight size={16}/> Verify & Login</>}
                </button>
                <div style={{display:'flex', gap:16, justifyContent:'center', marginTop:8}}>
                  <button type="button" className="link-btn resend-btn" onClick={sendOTP}>Resend OTP</button>
                  <span style={{color:'var(--text4)'}}>|</span>
                  <button type="button" className="link-btn resend-btn" onClick={() => setStep('phone')}>Change number</button>
                </div>
                {/* Didn't receive hint */}
                <div style={{marginTop:10, padding:'8px 12px', background:'#fff3e0', borderRadius:8, textAlign:'center'}}>
                  <p style={{fontSize:11, color:'#e65100', margin:0, lineHeight:1.5}}>
                    Didn't receive OTP? <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{color:'#25D366', fontWeight:600, textDecoration:'underline'}}>Message us on WhatsApp first</a>, then resend.
                  </p>
                </div>
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
              {tab === 'register' && (
                <div className="input-wrap"><User size={16}/><input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required/></div>
              )}
              <div className="input-wrap"><Phone size={16}/><input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} required maxLength={10}/></div>
              <div className="input-wrap">
                <Lock size={16}/>
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} required minLength={6}/>
                <button type="button" onClick={() => setShowPass(!showPass)} style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text3)'}}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {tab === 'register' && (
                <div className="input-wrap">
                  <Lock size={16}/>
                  <input type={showPass2 ? 'text' : 'password'} placeholder="Confirm password" value={pass2} onChange={e => setPass2(e.target.value)} required/>
                  <button type="button" onClick={() => setShowPass2(!showPass2)} style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text3)'}}>
                    {showPass2 ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              )}
              {err && <p className="auth-err">{err}</p>}
              {info && <p className="auth-info">{info}</p>}
              <button type="submit" className="btn-primary full" disabled={loading}>
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : '🚀 Create Account & Setup Profile'}
              </button>
              {tab === 'login' && <button type="button" className="link-btn" style={{marginTop:8, fontSize:13}} onClick={() => { setMode('otp'); setStep('phone'); setInfo('Use WhatsApp OTP to reset access') }}>Forgot password?</button>}
              {tab === 'register' && (
                <p style={{fontSize:11, color:'var(--text4)', marginTop:8, textAlign:'center', lineHeight:1.5}}>
                  After registration, you'll set up your profile with name, age, goals & habits.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
