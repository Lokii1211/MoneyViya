import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Phone, Lock, Sparkles } from 'lucide-react'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const nav = useNavigate()

  async function handleLogin(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const d = await api.login(phone, pass)
      if(d.success) { login(phone, d.token, d.user); nav('/') }
      else setErr(d.error||'Login failed')
    } catch{ setErr('Network error') }
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault(); setErr('')
    if(pass!==pass2){ setErr('Passwords do not match'); return }
    setLoading(true)
    try {
      const d = await api.register(phone, pass)
      if(d.success){ setTab('login'); setErr('Account created! Sign in now.') }
      else setErr(d.error)
    } catch{ setErr('Network error') }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo"><Sparkles size={28}/></div>
        <h1 className="auth-title">MoneyViya</h1>
        <p className="auth-sub">Your Digital Private Wealth Manager</p>
        <div className="auth-tabs">
          <button className={'auth-tab'+(tab==='login'?' active':'')} onClick={()=>setTab('login')}>Sign In</button>
          <button className={'auth-tab'+(tab==='register'?' active':'')} onClick={()=>setTab('register')}>Register</button>
        </div>
        <form onSubmit={tab==='login'?handleLogin:handleRegister} className="auth-form">
          <div className="input-wrap"><Phone size={16}/><input type="tel" placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} required/></div>
          <div className="input-wrap"><Lock size={16}/><input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6}/></div>
          {tab==='register'&&<div className="input-wrap"><Lock size={16}/><input type="password" placeholder="Confirm password" value={pass2} onChange={e=>setPass2(e.target.value)} required/></div>}
          {err&&<p className="auth-err">{err}</p>}
          <button type="submit" className="btn-primary full" disabled={loading}>{loading?'Please wait...':tab==='login'?'Sign In':'Create Account'}</button>
        </form>
      </div>
    </div>
  )
}
