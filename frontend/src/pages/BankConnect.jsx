import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Smartphone, Building2, TrendingUp, FileText,
  Shield, Lock, RefreshCw, Check, Upload, Plus, X,
  ChevronDown, ChevronUp, Zap, Link2, MessageSquare, Clock,
} from 'lucide-react'

/* ─── Data ─── */
const BANKS_TIER1 = [
  { name: 'HDFC',     icon: '🏦' },
  { name: 'ICICI',    icon: '🏛️' },
  { name: 'SBI',      icon: '🏦' },
  { name: 'Axis',     icon: '🏛️' },
  { name: 'Kotak',    icon: '🏦' },
  { name: 'IndusInd', icon: '🏛️' },
  { name: 'Yes Bank', icon: '🏦' },
]
const BANKS_TIER2 = [
  { name: 'PNB',          icon: '🏦' },
  { name: 'Canara',       icon: '🏦' },
  { name: 'BOB',          icon: '🏛️' },
  { name: 'Union Bank',   icon: '🏛️' },
]
const BANKS_TIER3 = [
  { name: 'Federal',    icon: '🏛️' },
  { name: 'Bandhan',    icon: '🏦' },
  { name: 'RBL',        icon: '🏛️' },
  { name: 'IDFC First', icon: '🏦' },
]
const BANKS_PAYMENT = [
  { name: 'Paytm',  icon: '💰' },
  { name: 'Airtel', icon: '📱' },
  { name: 'Jio',    icon: '📶' },
]
const TOP_BANKS = [...BANKS_TIER1, BANKS_TIER2[0], BANKS_TIER2[1]]
const ALL_BANKS  = [...BANKS_TIER1, ...BANKS_TIER2, ...BANKS_TIER3, ...BANKS_PAYMENT]

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay',  icon: '🟦', color: '#4285F4', txns: '2B+/month' },
  { id: 'phonepe', name: 'PhonePe',     icon: '💜', color: '#5F259F', txns: '#1 in India' },
  { id: 'paytm',   name: 'Paytm',       icon: '💰', color: '#002970', txns: 'Wallet + UPI' },
  { id: 'bhim',    name: 'BHIM',        icon: '🇮🇳', color: '#FF6B35', txns: 'NPCI Official' },
]

const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: '📊 Mutual Fund' },
  { value: 'stock',       label: '📈 Stock' },
  { value: 'fd',          label: '🏦 Fixed Deposit' },
  { value: 'ppf',         label: '📋 PPF' },
  { value: 'nps',         label: '🛡️ NPS' },
  { value: 'gold',        label: '🥇 Gold' },
  { value: 'crypto',      label: '🔷 Crypto' },
]

/* ─── SMS Parser ─── */
function parseBankSMS(text) {
  if (!text || text.length < 20) return null
  const patterns = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|withdrawn|deducted)/i,
    /(?:debited|charged|spent|withdrawn|deducted).*?(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
    /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)\s*(?:has been|was)?\s*(?:debited|credited)/i,
    /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
  ]
  let amount = 0
  for (const p of patterns) {
    const m = text.match(p)
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break }
  }
  if (!amount || amount <= 0) return null
  const lower = text.toLowerCase()
  const isIncome = /credit|received|deposit|salary|refund|cashback/i.test(lower)
  let category = '💳 Other'
  if (/swiggy|zomato|food|restaurant|lunch|dinner|cafe/i.test(lower))               category = '🍔 Food'
  else if (/uber|ola|rapido|cab|petrol|metro|fuel|fastag/i.test(lower))             category = '🚗 Transport'
  else if (/amazon|flipkart|myntra|shop|mall|meesho/i.test(lower))                  category = '🛍️ Shopping'
  else if (/hospital|pharmacy|doctor|medical|1mg/i.test(lower))                     category = '💊 Health'
  else if (/netflix|hotstar|movie|spotify|prime/i.test(lower))                      category = '🎬 Entertainment'
  else if (/recharge|jio|airtel|bsnl|electricity|water|gas|internet/i.test(lower)) category = '📱 Bills'
  else if (/sip|mutual|fund|stock|invest|fd|ppf/i.test(lower))                     category = '📈 Investment'
  else if (/emi|loan|repayment/i.test(lower))                                       category = '🏦 EMI'
  else if (/salary|income/i.test(lower))                                            category = '💼 Salary'
  const m = text.match(/(?:at|to|towards|for|@|VPA)\s+([A-Za-z][A-Za-z0-9\s.*-]+)/i)
  const merchant = m ? m[1].trim().replace(/\*+/g, ' ').split(/\s+/).slice(0, 3).join(' ') : ''
  return { amount, category, merchant, isIncome, raw: text }
}

const anim = (d = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
})

/* ─── Premium Toggle ─── */
function Toggle({ on, onToggle, size = 'sm' }) {
  const s = size === 'sm'
    ? { w: 40, h: 22, r: 11, tw: 16, tTop: 3, tOn: 21, tOff: 3 }
    : { w: 48, h: 26, r: 13, tw: 20, tTop: 3, tOn: 25, tOff: 3 }
  return (
    <button
      onClick={onToggle}
      style={{
        width: s.w, height: s.h, minHeight: s.h, minWidth: s.w, borderRadius: s.r, border: 'none',
        cursor: onToggle ? 'pointer' : 'default',
        background: on ? 'var(--primary, #00E5B0)' : 'var(--surface3, #2a2a2a)',
        position: 'relative', transition: 'background 0.25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0,
        boxShadow: on ? '0 0 10px rgba(0,229,176,0.35)' : 'none',
      }}
      aria-label={on ? 'Disable' : 'Enable'}
    >
      <span style={{
        position: 'absolute', top: s.tTop, left: on ? s.tOn : s.tOff,
        width: s.tw, height: s.tw, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  )
}

/* ─── UPI SMS Import Drawer ─── */
function UpiImportDrawer({ app, phone, toast, onClose }) {
  const [sms, setSms]         = useState('')
  const [parsed, setParsed]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const detect = () => {
    const r = parseBankSMS(sms)
    if (r) setParsed(r)
    else toast.show('Could not detect transaction from this SMS', 'error')
  }

  const save = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      const ok = parsed.isIncome ? await api.addIncome(phone, parsed.amount, parsed.category) : await api.addExpense(phone, parsed.amount, parsed.category, parsed.merchant)
      if (!ok) { toast.show('Failed to save', 'error'); setSaving(false); return }
      toast.show(`₹${parsed.amount.toLocaleString('en-IN')} from ${app.name} imported!`, 'success')
      setSms(''); setParsed(null); onClose()
    } catch { toast.show('Failed to save', 'error') }
    setSaving(false)
  }

  return (
    <motion.div className="modal-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bc2-modal" onClick={e => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}>
        <div className="bc2-modal-hdr">
          <div style={{ fontSize: 28 }}>{app.icon}</div>
          <div>
            <div className="bc2-modal-title">Import from {app.name}</div>
            <div className="bc2-modal-sub">Paste a payment confirmation SMS</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="bc2-modal-body">
          <div className="bc2-native-hint">
            <Smartphone size={13} />
            <span>On the Android app, {app.name} SMS are auto-read. On web, paste below.</span>
          </div>
          <textarea className="form-input" style={{ minHeight: 80, resize: 'vertical', fontSize: 13, marginTop: 10 }}
            placeholder={`Paste ${app.name} payment SMS here…\ne.g. Paid Rs.250 via ${app.name} to Zomato`}
            value={sms} onChange={e => { setSms(e.target.value); setParsed(null) }} />
          {!parsed && sms.trim() && (
            <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={detect}>
              Detect Transaction
            </button>
          )}
          <AnimatePresence>
            {parsed && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bc2-parsed" style={{ marginTop: 10 }}>
                <div className="bc2-parsed-type">{parsed.isIncome ? '💚 Income' : '🔴 Expense'} · ₹{parsed.amount.toLocaleString('en-IN')}</div>
                <div className="bc2-parsed-meta">{parsed.category}{parsed.merchant ? ` · ${parsed.merchant}` : ''}</div>
                <button className="btn-primary full" onClick={save} disabled={saving} style={{ marginTop: 10 }}>
                  {saving ? 'Saving…' : <><Check size={14} /> Add to Transactions</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function BankConnect() {
  const nav   = useNavigate()
  const { phone } = useApp()
  const toast = useToast()
  const fileRef = useRef(null)

  const [loading, setLoading]           = useState(true)
  const [showAllBanks, setShowAllBanks] = useState(false)
  const [upiDrawer, setUpiDrawer]       = useState(null) // app object | null

  // Investment form
  const [invForm, setInvForm]           = useState({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '' })
  const [invSaving, setInvSaving]       = useState(false)
  const [recentInvestments, setRecentInvestments] = useState([])
  const [investmentsCount, setInvestmentsCount] = useState(0)

  // Import
  const [pasteOpen, setPasteOpen]       = useState(false)
  const [pastedSms, setPastedSms]       = useState('')
  const [parsedResult, setParsedResult] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [recentImports, setRecentImports] = useState([])

  /* ─── Load from Supabase ─── */
  useEffect(() => {
    if (!phone) { setLoading(false); return }
    api.getInvestments(phone).then(inv => setInvestmentsCount(inv?.length || 0)).catch(() => {})
    setLoading(false)
  }, [phone])

  /* ─── Coming Soon — direct bank/UPI/SMS auto-connect isn't live yet.
     SMS permissions were removed from the Android manifest (Play Protect
     blocks sideloaded APKs requesting READ_SMS) and there's no AA/bank
     API wired up. Real, working paths below: paste-SMS import, CSV
     upload, and manual investment entry — all write directly to Supabase. ─── */
  const comingSoon = (what) => {
    toast.show(`${what} is coming soon! Use "Import Transactions" below to add data right now.`, 'info')
    document.getElementById('bc2-import')?.scrollIntoView({ behavior: 'smooth' })
  }

  /* ─── Investment ─── */
  const handleAddInvestment = async () => {
    if (!invForm.name.trim()) { toast.show('Enter investment name', 'warning'); return }
    if (!invForm.invested_amount || Number(invForm.invested_amount) <= 0) { toast.show('Enter amount', 'warning'); return }
    setInvSaving(true)
    try {
      const data = { name: invForm.name.trim(), investment_type: invForm.investment_type, invested_amount: Number(invForm.invested_amount), current_value: Number(invForm.current_value || invForm.invested_amount), is_sip: invForm.is_sip }
      if (invForm.is_sip) { data.sip_amount = Number(invForm.sip_amount || 0); data.sip_date = invForm.sip_date || '' }
      const ok = await api.addInvestment(phone, data)
      if (!ok) { toast.show('Failed to save. Try again.', 'error'); setInvSaving(false); return }
      setRecentInvestments(p => [{ ...data, time: new Date().toLocaleTimeString() }, ...p.slice(0, 4)])
      toast.show(`${data.name} added!`, 'success')
      setInvForm({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '' })
    } catch { toast.show('Failed to save. Try again.', 'error') }
    setInvSaving(false)
  }

  /* ─── SMS Import ─── */
  const handleParseSMS = () => {
    const r = parseBankSMS(pastedSms)
    if (r) setParsedResult(r)
    else toast.show('Could not parse. Try a bank debit/credit SMS.', 'error')
  }

  const confirmParsedTransaction = async () => {
    if (!parsedResult || !phone) return
    setSaving(true)
    try {
      const ok = parsedResult.isIncome ? await api.addIncome(phone, parsedResult.amount, parsedResult.category) : await api.addExpense(phone, parsedResult.amount, parsedResult.category, parsedResult.merchant)
      if (!ok) { toast.show('Failed. Try again.', 'error'); setSaving(false); return }
      setRecentImports(p => [{ ...parsedResult, time: new Date().toLocaleTimeString() }, ...p.slice(0, 4)])
      toast.show(`₹${parsedResult.amount.toLocaleString('en-IN')} ${parsedResult.isIncome ? 'income' : 'expense'} added!`, 'success')
      setParsedResult(null); setPastedSms('')
    } catch { toast.show('Failed. Try again.', 'error') }
    setSaving(false)
  }

  /* ─── CSV Upload ─── */
  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const lines = (await file.text()).split('\n').filter(l => l.trim())
    if (lines.length < 2) { toast.show('CSV empty or invalid', 'error'); return }
    let ok = 0, skip = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
      if (cols.length < 3) { skip++; continue }
      const amt = parseFloat(cols.find(c => /^\d+\.?\d*$/.test(c.replace(/,/g, '')))?.replace(/,/g, '') || '0')
      if (!amt) { skip++; continue }
      const desc = cols.find(c => c.length > 5 && !/^\d/.test(c)) || 'CSV'
      const isDebit = /debit|dr|spent|paid|withdraw/i.test(lines[i])
      try {
        const saved = isDebit ? await api.addExpense(phone, amt, '💳 Other', desc.slice(0, 100)) : await api.addIncome(phone, amt, '💼 Salary')
        saved ? ok++ : skip++
      } catch { skip++ }
    }
    toast.show(`Imported ${ok} transactions, ${skip} skipped`, ok > 0 ? 'success' : 'warning')
    e.target.value = ''
  }

  const visibleBanks = showAllBanks ? ALL_BANKS : TOP_BANKS

  return (
    <div className="page page-padded">
      <input type="file" ref={fileRef} accept=".csv,.txt" className="sr-hidden" onChange={handleCSVUpload} />

      {/* Modals */}
      <AnimatePresence>
        {upiDrawer && (
          <UpiImportDrawer app={upiDrawer} phone={phone} toast={toast}
            onClose={() => setUpiDrawer(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20} /></button>
          <h2>Connect Accounts</h2>
        </div>
      </div>

      {/* Hero */}
      <motion.div {...anim(0)} className="bc2-hero">
        <div className="bc2-hero-text">
          <h2>Track every rupee</h2>
          <p>Import via SMS or CSV, add investments manually — direct bank/UPI auto-sync is coming soon.</p>
        </div>
        <div className="bc2-hero-stats">
          <div className="bc2-stat">
            <span className="bc2-stat-val">{investmentsCount}</span>
            <span className="bc2-stat-lbl">Investments</span>
          </div>
          <div className="bc2-stat">
            <span className="bc2-stat-val">{recentImports.length}</span>
            <span className="bc2-stat-lbl">Imported</span>
          </div>
          <div className="bc2-stat">
            <span className="bc2-stat-val">Soon</span>
            <span className="bc2-stat-lbl">Bank Sync</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ Section 1: SMS Auto-Track ═══ */}
      <motion.div {...anim(0.06)} className="card bc2-card">
        <div className="bc2-row">
          <div className="bc2-row-icon" style={{ background: 'rgba(0,229,176,0.1)', color: 'var(--primary)' }}>
            <Smartphone size={18} />
          </div>
          <div className="bc2-row-body">
            <div className="bc2-row-title">SMS Auto-Track</div>
            <div className="bc2-row-sub">Automatic background reading isn't live yet</div>
          </div>
          <span className="bc2-soon-badge"><Clock size={11} /> Soon</span>
        </div>
        <div className="bc2-sms-note">
          <Smartphone size={12} style={{ flexShrink: 0 }} />
          <span>
            Real-time auto-read needs Play Store SMS approval (in progress).
            For now, use <button className="bc2-inline-btn" onClick={() => { setPasteOpen(true); document.getElementById('bc2-import')?.scrollIntoView({ behavior: 'smooth' }) }}>Paste Import ↓</button> below — it works instantly.
          </span>
        </div>
        <div className="bc2-trust">
          <span><Shield size={10} /> RBI regulated</span>
          <span><Lock size={10} /> Read-only</span>
          <span><RefreshCw size={10} /> Revoke anytime</span>
        </div>
      </motion.div>

      {/* ═══ Section 2: Select Banks ═══ */}
      <motion.div {...anim(0.1)} className="card bc2-card">
        <div className="bc2-section-hdr">
          <div className="bc2-row-icon" style={{ background: 'rgba(85,20,255,0.1)', color: 'var(--violet)' }}>
            <Building2 size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="bc2-row-title">Select Your Banks</div>
            <div className="bc2-row-sub">Direct bank connection — coming soon</div>
          </div>
          <span className="bc2-soon-badge"><Clock size={11} /> Soon</span>
        </div>

        <div className="bc2-bank-grid" style={{ maxHeight: showAllBanks ? 'none' : 210, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
          {visibleBanks.map(b => (
            <button key={b.name} className="bc2-bank-card bc2-bank-card--soon" onClick={() => comingSoon(`${b.name} connection`)}>
              <span className="bc2-bank-icon">{b.icon}</span>
              <span className="bc2-bank-name">{b.name}</span>
            </button>
          ))}
        </div>

        <button className="bc2-show-more" onClick={() => setShowAllBanks(!showAllBanks)}>
          {showAllBanks ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all {ALL_BANKS.length} banks</>}
        </button>
      </motion.div>

      {/* ═══ Section 3: UPI Apps ═══ */}
      <motion.div {...anim(0.14)} className="card bc2-card">
        <div className="bc2-section-hdr">
          <div className="bc2-row-icon" style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}>
            <Zap size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="bc2-row-title">UPI Apps</div>
            <div className="bc2-row-sub">Auto-detect — coming soon. Import manually for now.</div>
          </div>
          <span className="bc2-soon-badge"><Clock size={11} /> Soon</span>
        </div>

        <div className="bc2-upi-list">
          {UPI_APPS.map(app => (
            <div key={app.id} className="bc2-upi-row">
              <div className="bc2-upi-left">
                <span className="bc2-upi-icon">{app.icon}</span>
                <div>
                  <div className="bc2-upi-name">{app.name}</div>
                  <div className="bc2-upi-meta">{app.txns}</div>
                </div>
              </div>
              <button className="bc2-import-btn" onClick={() => setUpiDrawer(app)}>
                <MessageSquare size={12} /> Import SMS
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Section 4: Account Aggregator ═══ */}
      <motion.div {...anim(0.18)} className="card bc2-card bc2-aa-card">
        <div className="bc2-aa-badge">RBI REGULATED</div>
        <div className="bc2-section-hdr" style={{ marginBottom: 10 }}>
          <div className="bc2-row-icon" style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800' }}>
            <Link2 size={18} />
          </div>
          <div>
            <div className="bc2-row-title">Account Aggregator</div>
            <div className="bc2-row-sub">Fetch live bank data — no SMS needed</div>
          </div>
        </div>
        <p className="bc2-aa-desc">
          Account Aggregator (AA) is RBI's official open-banking framework. Apps like CRED and Jupiter use it to securely fetch your real bank data with one-time consent.
        </p>
        <div className="bc2-aa-steps">
          <div className="bc2-aa-step"><span className="bc2-aa-num">1</span><span>Select your bank</span></div>
          <div className="bc2-aa-step-arrow">→</div>
          <div className="bc2-aa-step"><span className="bc2-aa-num">2</span><span>Give consent via bank OTP</span></div>
          <div className="bc2-aa-step-arrow">→</div>
          <div className="bc2-aa-step"><span className="bc2-aa-num">3</span><span>Live data fetched automatically</span></div>
        </div>
        <button className="bc2-aa-btn" onClick={() => toast.show('AA integration coming soon — requires Setu FIU registration', 'info')}>
          <Clock size={14} /> Coming Soon — AA Integration
        </button>
      </motion.div>

      {/* ═══ Section 5: Add Investment ═══ */}
      <motion.div {...anim(0.22)} className="card bc2-card">
        <div className="bc2-section-hdr">
          <div className="bc2-row-icon" style={{ background: 'rgba(255,184,0,0.12)', color: '#FFB800' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="bc2-row-title">Add Investment</div>
            <div className="bc2-row-sub">Track stocks, MFs, FDs and more</div>
          </div>
        </div>

        <div className="bc2-inv-form">
          <input className="input-field" type="text" placeholder="Investment name (e.g. Axis Bluechip Fund)"
            value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
          <select className="input-field" value={invForm.investment_type}
            onChange={e => setInvForm({ ...invForm, investment_type: e.target.value })}>
            {INVESTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="bc2-two-col">
            <div style={{ position: 'relative' }}>
              <span className="bc-rupee">₹</span>
              <input className="input-field" type="number" placeholder="Invested" style={{ paddingLeft: 26 }}
                value={invForm.invested_amount} onChange={e => setInvForm({ ...invForm, invested_amount: e.target.value })} />
            </div>
            <div style={{ position: 'relative' }}>
              <span className="bc-rupee">₹</span>
              <input className="input-field" type="number" placeholder="Current value" style={{ paddingLeft: 26 }}
                value={invForm.current_value} onChange={e => setInvForm({ ...invForm, current_value: e.target.value })} />
            </div>
          </div>
          <div className="bc2-sip-row">
            <span className="bc2-sip-label">SIP?</span>
            <Toggle on={invForm.is_sip} onToggle={() => setInvForm({ ...invForm, is_sip: !invForm.is_sip })} />
          </div>
          <AnimatePresence>
            {invForm.is_sip && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div className="bc2-two-col" style={{ marginTop: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <span className="bc-rupee">₹</span>
                    <input className="input-field" type="number" placeholder="Amount/month" style={{ paddingLeft: 26 }}
                      value={invForm.sip_amount} onChange={e => setInvForm({ ...invForm, sip_amount: e.target.value })} />
                  </div>
                  <input className="input-field" type="number" min="1" max="28" placeholder="SIP date (1-28)"
                    value={invForm.sip_date} onChange={e => setInvForm({ ...invForm, sip_date: e.target.value })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button className="btn-primary full" onClick={handleAddInvestment} disabled={invSaving}>
            {invSaving ? 'Saving…' : <><Plus size={14} /> Save Investment</>}
          </button>
        </div>

        {recentInvestments.length > 0 && (
          <div className="bc2-recent">
            {recentInvestments.map((inv, i) => (
              <div key={i} className="info-row" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{INVESTMENT_TYPES.find(t => t.value === inv.investment_type)?.label?.[0] || '📈'}</span>
                <div className="info-body">
                  <div className="info-title">{inv.name}</div>
                  <div className="info-sub">{INVESTMENT_TYPES.find(t => t.value === inv.investment_type)?.label}</div>
                </div>
                <div className="info-value">₹{Number(inv.invested_amount).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══ Section 6: Import Transactions ═══ */}
      <motion.div {...anim(0.26)} className="card bc2-card" id="bc2-import">
        <div className="bc2-section-hdr">
          <div className="bc2-row-icon" style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}>
            <FileText size={18} />
          </div>
          <div>
            <div className="bc2-row-title">Import Transactions</div>
            <div className="bc2-row-sub">Bank CSV · Paste SMS · Auto-parse</div>
          </div>
        </div>

        <div className="bc2-import-row">
          <button className="btn-secondary" style={{ flex: 1, gap: 6, fontSize: 13 }} onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> Upload CSV
          </button>
          <button className={`btn-secondary ${pasteOpen ? 'bc2-active-btn' : ''}`}
            style={{ flex: 1, gap: 6, fontSize: 13 }}
            onClick={() => { setPasteOpen(!pasteOpen); setParsedResult(null) }}>
            <MessageSquare size={13} /> Paste SMS
          </button>
        </div>

        <AnimatePresence>
          {pasteOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <textarea className="form-input" style={{ minHeight: 76, resize: 'vertical', fontSize: 13, marginTop: 10 }}
                value={pastedSms} onChange={e => { setPastedSms(e.target.value); setParsedResult(null) }}
                placeholder="Paste bank SMS here&#10;e.g. Rs.450 debited from A/c XX1234 for UPI/Swiggy" />
              <button className="btn-primary full" onClick={handleParseSMS} style={{ marginTop: 8 }}>
                Parse & Import
              </button>
              <AnimatePresence>
                {parsedResult && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bc2-parsed" style={{ marginTop: 12 }}>
                    <div className="bc2-parsed-type">{parsedResult.isIncome ? '💚' : '🔴'} {parsedResult.isIncome ? 'Income' : 'Expense'} · ₹{parsedResult.amount.toLocaleString('en-IN')}</div>
                    <div className="bc2-parsed-meta">{parsedResult.category}{parsedResult.merchant ? ` · ${parsedResult.merchant}` : ''}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn-primary" onClick={confirmParsedTransaction} disabled={saving} style={{ flex: 1 }}>
                        {saving ? 'Saving…' : <><Check size={13} /> Add</>}
                      </button>
                      <button className="btn-secondary" onClick={() => setParsedResult(null)} style={{ padding: '10px 14px' }}><X size={14} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {recentImports.length > 0 && (
        <motion.div {...anim(0.3)} className="card bc2-card">
          <div className="bc2-row-title" style={{ marginBottom: 10 }}>Recently Imported</div>
          {recentImports.map((item, i) => (
            <div key={i} className="info-row" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{item.category.split(' ')[0]}</span>
              <div className="info-body">
                <div className="info-title">{item.merchant || item.category.split(' ').slice(1).join(' ')}</div>
                <div className="info-sub">{item.time}</div>
              </div>
              <div className="info-value" style={{ color: item.isIncome ? 'var(--primary)' : 'var(--expense)' }}>
                {item.isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div {...anim(0.34)} style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
        <p>Your financial data is encrypted and never shared with third parties.</p>
        <p>Bank SMS are read only for transaction amounts — personal messages are never accessed.</p>
      </motion.div>
    </div>
  )
}
