import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Smartphone, Building2, TrendingUp, FileText, Shield, Lock, RefreshCw, Check, Upload, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

/* ─── All Indian Banks (PRD complete list) ─── */
const BANKS_TIER1 = [
  { name: 'HDFC', icon: '🏦', senders: ['HDFCBK'], tier: 1 },
  { name: 'ICICI', icon: '🏛️', senders: ['ICICIB'], tier: 1 },
  { name: 'SBI', icon: '🏦', senders: ['SBIINB', 'SBIBNK'], tier: 1 },
  { name: 'Axis', icon: '🏛️', senders: ['AXISBK'], tier: 1 },
  { name: 'Kotak', icon: '🏦', senders: ['KOTAKB'], tier: 1 },
  { name: 'IndusInd', icon: '🏛️', senders: ['INDUSB'], tier: 1 },
  { name: 'Yes Bank', icon: '🏦', senders: ['YESBK'], tier: 1 },
]
const BANKS_TIER2 = [
  { name: 'PNB', icon: '🏦', senders: ['PNBSMS'], tier: 2 },
  { name: 'Canara', icon: '🏦', senders: ['CANBNK'], tier: 2 },
  { name: 'BOB', icon: '🏛️', senders: ['BARBK'], tier: 2 },
  { name: 'BOI', icon: '🏦', senders: ['BOIIND'], tier: 2 },
  { name: 'Union Bank', icon: '🏛️', senders: ['UBIBNK'], tier: 2 },
  { name: 'Central Bank', icon: '🏦', senders: ['CBIBNK'], tier: 2 },
]
const BANKS_TIER3 = [
  { name: 'Federal', icon: '🏛️', senders: ['FEDBNK'], tier: 3 },
  { name: 'Bandhan', icon: '🏦', senders: ['BANDHN'], tier: 3 },
  { name: 'RBL', icon: '🏛️', senders: ['RBLBNK'], tier: 3 },
  { name: 'IDFC First', icon: '🏦', senders: ['IDFCFB'], tier: 3 },
]
const BANKS_PAYMENT = [
  { name: 'Paytm', icon: '💰', senders: ['PAYTMB'], tier: 'payment' },
  { name: 'Airtel', icon: '📱', senders: ['AIRTEL'], tier: 'payment' },
  { name: 'Jio', icon: '📶', senders: ['JIOFIN'], tier: 'payment' },
]

const TOP_BANKS = [...BANKS_TIER1, BANKS_TIER2[0], BANKS_TIER2[1]] // top 9
const ALL_BANKS = [...BANKS_TIER1, ...BANKS_TIER2, ...BANKS_TIER3, ...BANKS_PAYMENT]

/* ─── UPI Apps ─── */
const UPI_APPS = [
  { id: 'gpay', name: 'GPay', icon: '💳', senders: ['GPAY', 'GOOGLEPAY'] },
  { id: 'phonepe', name: 'PhonePe', icon: '💜', senders: ['PHONEPE', 'PHNEPE'] },
  { id: 'paytm', name: 'Paytm', icon: '💰', senders: ['PAYTM'] },
  { id: 'bhim', name: 'BHIM', icon: '🇮🇳', senders: ['BHIMUPI'] },
]

/* ─── Investment types ─── */
const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'stock', label: 'Stock' },
  { value: 'fd', label: 'FD' },
  { value: 'ppf', label: 'PPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
]

function parseBankSMS(text) {
  if (!text || text.length < 20) return null
  const patterns = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|withdrawn|deducted)/i,
    /(?:debited|charged|spent|withdrawn|deducted).*?(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
    /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)\s*(?:has been|was)?\s*(?:debited|credited)/i,
    /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
  ]
  let amount = 0
  for (const p of patterns) { const m = text.match(p); if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break } }
  if (!amount || amount <= 0) return null

  const lower = text.toLowerCase()
  const isIncome = /credit|received|deposit|salary|refund|cashback/i.test(lower)
  let category = '💳 Other'
  if (/swiggy|zomato|food|restaurant|lunch|dinner|cafe|eat/i.test(lower)) category = '🍔 Food'
  else if (/uber|ola|rapido|cab|petrol|metro|fuel|fastag/i.test(lower)) category = '🚗 Transport'
  else if (/amazon|flipkart|myntra|shop|mall|meesho/i.test(lower)) category = '🛍️ Shopping'
  else if (/hospital|pharmacy|doctor|medical|1mg|pharmeasy/i.test(lower)) category = '💊 Health'
  else if (/netflix|hotstar|movie|spotify|prime|entertainment/i.test(lower)) category = '🎬 Entertainment'
  else if (/recharge|jio|airtel|bsnl|electricity|water|gas|internet/i.test(lower)) category = '📱 Bills'
  else if (/college|school|course|udemy|education|tuition/i.test(lower)) category = '📚 Education'
  else if (/sip|mutual|fund|stock|invest|fd|ppf/i.test(lower)) category = '📈 Investment'
  else if (/emi|loan|repayment/i.test(lower)) category = '🏦 EMI'
  else if (/rent|house/i.test(lower)) category = '🏠 Rent'
  else if (/salary|income/i.test(lower)) category = '💼 Salary'

  const merchantMatch = text.match(/(?:at|to|towards|for|@|VPA)\s+([A-Za-z][A-Za-z0-9\s.*-]+)/i)
  const merchant = merchantMatch ? merchantMatch[1].trim().replace(/\*+/g, ' ').split(/\s+/).slice(0, 3).join(' ') : ''

  return { amount, category, merchant, isIncome, raw: text }
}

const anim = (d) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.35 } })

const inputStyle = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid var(--glass-border, #333)',
  background: 'var(--glass-bg, #1a1a1a)', color: 'var(--text1, #fff)', fontSize: 14, width: '100%', boxSizing: 'border-box',
}

export default function BankConnect() {
  const nav = useNavigate()
  const { phone } = useApp()
  const toast = useToast()
  const fileRef = useRef(null)

  // SMS Auto-Track
  const [smsEnabled, setSmsEnabled] = useState(() => localStorage.getItem('mv_sms_enabled') === 'true')

  // Banks
  const [connectedBanks, setConnectedBanks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_connected_banks') || '[]') } catch { return [] }
  })
  const [showAllBanks, setShowAllBanks] = useState(false)

  // UPI Apps
  const [upiApps, setUpiApps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_upi_apps') || '{}') } catch { return {} }
  })

  // Investment form
  const [invForm, setInvForm] = useState({
    name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '',
  })
  const [invSaving, setInvSaving] = useState(false)
  const [recentInvestments, setRecentInvestments] = useState([])

  // Import
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pastedSms, setPastedSms] = useState('')
  const [parsedResult, setParsedResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recentImports, setRecentImports] = useState([])

  /* ─── SMS Toggle ─── */
  const toggleSms = () => {
    const next = !smsEnabled
    setSmsEnabled(next)
    localStorage.setItem('mv_sms_enabled', String(next))
    toast.show(next ? 'SMS Auto-Track enabled! Bank SMS will be auto-detected.' : 'SMS Auto-Track disabled', next ? 'success' : 'info')
  }

  /* ─── Bank Connect ─── */
  const connectBank = (bank) => {
    if (connectedBanks.includes(bank.name)) {
      const updated = connectedBanks.filter(b => b !== bank.name)
      setConnectedBanks(updated)
      localStorage.setItem('mv_connected_banks', JSON.stringify(updated))
      toast.show(`${bank.name} disconnected`, 'info')
    } else {
      const updated = [...connectedBanks, bank.name]
      setConnectedBanks(updated)
      localStorage.setItem('mv_connected_banks', JSON.stringify(updated))
      toast.show(`${bank.name} connected! SMS from this bank will be auto-tracked.`, 'success')
    }
  }

  /* ─── UPI Toggle ─── */
  const toggleUpiApp = (appId) => {
    const updated = { ...upiApps, [appId]: !upiApps[appId] }
    setUpiApps(updated)
    localStorage.setItem('mv_upi_apps', JSON.stringify(updated))
    const app = UPI_APPS.find(a => a.id === appId)
    toast.show(
      updated[appId] ? `${app.name} tracking enabled` : `${app.name} tracking disabled`,
      updated[appId] ? 'success' : 'info'
    )
  }

  /* ─── Investment Form ─── */
  const handleAddInvestment = async () => {
    if (!invForm.name.trim()) { toast.show('Enter investment name', 'warning'); return }
    if (!invForm.invested_amount || Number(invForm.invested_amount) <= 0) { toast.show('Enter invested amount', 'warning'); return }
    if (!phone) { toast.show('Please log in first', 'error'); return }

    setInvSaving(true)
    try {
      const data = {
        name: invForm.name.trim(),
        investment_type: invForm.investment_type,
        invested_amount: Number(invForm.invested_amount),
        current_value: Number(invForm.current_value || invForm.invested_amount),
        is_sip: invForm.is_sip,
      }
      if (invForm.is_sip) {
        data.sip_amount = Number(invForm.sip_amount || 0)
        data.sip_date = invForm.sip_date || ''
      }
      await api.addInvestment(phone, data)
      setRecentInvestments(prev => [
        { ...data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ])
      toast.show(`${data.name} added to portfolio!`, 'success')
      setInvForm({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '' })
    } catch {
      toast.show('Failed to save investment. Try again.', 'error')
    }
    setInvSaving(false)
  }

  /* ─── SMS Parse ─── */
  const handleParseSMS = () => {
    if (!pastedSms.trim()) { toast.show('Paste a bank SMS first', 'warning'); return }
    const result = parseBankSMS(pastedSms)
    if (result) {
      setParsedResult(result)
    } else {
      toast.show('Could not parse this SMS. Try a different bank debit/credit SMS.', 'error')
    }
  }

  const confirmParsedTransaction = async () => {
    if (!parsedResult || !phone) return
    setSaving(true)
    try {
      if (parsedResult.isIncome) {
        await api.addIncome(phone, parsedResult.amount, parsedResult.category)
      } else {
        await api.addExpense(phone, parsedResult.amount, parsedResult.category, parsedResult.merchant)
      }
      setRecentImports(prev => [{ ...parsedResult, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)])
      toast.show(`₹${parsedResult.amount.toLocaleString('en-IN')} ${parsedResult.isIncome ? 'income' : 'expense'} added!`, 'success')
      setParsedResult(null)
      setPastedSms('')
    } catch {
      toast.show('Failed to save. Try again.', 'error')
    }
    setSaving(false)
  }

  /* ─── CSV Upload ─── */
  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { toast.show('CSV file is empty or invalid', 'error'); return }

    let imported = 0, skipped = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
      if (cols.length < 3) { skipped++; continue }
      const amount = parseFloat(cols.find(c => /^\d+\.?\d*$/.test(c.replace(/,/g, '')))?.replace(/,/g, '') || '0')
      if (!amount || amount <= 0) { skipped++; continue }
      const desc = cols.find(c => c.length > 5 && !/^\d/.test(c)) || 'CSV Import'
      const isDebit = /debit|dr|spent|paid|withdraw/i.test(lines[i])
      try {
        if (isDebit) {
          await api.addExpense(phone, amount, '💳 Other', desc.slice(0, 100))
        } else {
          await api.addIncome(phone, amount, '💼 Salary')
        }
        imported++
      } catch { skipped++ }
    }
    toast.show(`Imported ${imported} transactions, ${skipped} skipped`, imported > 0 ? 'success' : 'warning')
    e.target.value = ''
  }

  const visibleBanks = showAllBanks ? ALL_BANKS : TOP_BANKS

  return (
    <div className="page page-padded">
      <input type="file" ref={fileRef} accept=".csv,.txt" className="sr-hidden" onChange={handleCSVUpload} />

      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20} /></button>
          <h2>Connect Accounts</h2>
        </div>
      </div>

      <motion.div {...anim(0)} className="bc-hero">
        <h2>Auto-track every rupee</h2>
        <p>Connect bank SMS, track UPI payments, add investments, or import statements to automatically track all your money.</p>
      </motion.div>

      {/* ═══════ Section 1: SMS Auto-Track ═══════ */}
      <motion.div {...anim(0.08)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="info-icon green"><Smartphone size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>SMS Auto-Track</div>
              <div className="body-s text-secondary">Auto-detect bank transactions from SMS</div>
            </div>
          </div>
          <button onClick={toggleSms} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: smsEnabled ? 'var(--primary)' : 'var(--surface3)', position: 'relative', transition: 'background 0.3s' }}>
            <span style={{ position: 'absolute', top: 3, left: smsEnabled ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s var(--ease)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {smsEnabled && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--primary-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Active — monitoring bank SMS</span>
          </div>
        )}
      </motion.div>

      {/* ═══════ Section 2: Select Banks ═══════ */}
      <motion.div {...anim(0.12)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon violet"><Building2 size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Select Your Banks</div>
            <div className="body-s text-secondary">Tap banks you use — we'll track their SMS</div>
          </div>
        </div>
        <div className="bank-grid" style={{ maxHeight: showAllBanks ? 'none' : 280, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
          {visibleBanks.map(b => {
            const connected = connectedBanks.includes(b.name)
            return (
              <button key={b.name} className="bank-card" onClick={() => connectBank(b)} style={connected ? { borderColor: 'var(--primary)', background: 'var(--primary-dim)' } : {}}>
                <span className="bank-icon">{b.icon}</span>
                <span className="bank-name">{b.name}</span>
                {connected && <Check size={14} style={{ color: 'var(--primary)' }} />}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowAllBanks(!showAllBanks)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '8px 0', marginTop: 8,
            background: 'none', border: 'none', color: 'var(--primary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showAllBanks ? (
            <><ChevronUp size={16} /> Show less</>
          ) : (
            <><ChevronDown size={16} /> Show all {ALL_BANKS.length} banks</>
          )}
        </button>
        {connectedBanks.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
            {connectedBanks.length} bank{connectedBanks.length > 1 ? 's' : ''} connected
          </div>
        )}
        <div className="trust-row">
          <div className="trust-badge"><Shield size={12} /> RBI regulated</div>
          <div className="trust-badge"><Lock size={12} /> Read-only</div>
          <div className="trust-badge"><RefreshCw size={12} /> Revoke anytime</div>
        </div>
      </motion.div>

      {/* ═══════ Section 3: UPI Auto-Track ═══════ */}
      <motion.div {...anim(0.16)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon cyan"><Smartphone size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>UPI Auto-Track</div>
            <div className="body-s text-secondary">70%+ of Indian transactions are UPI — track them all</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {UPI_APPS.map(app => (
            <div key={app.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12,
              background: upiApps[app.id] ? 'var(--primary-dim)' : 'var(--surface2, rgba(255,255,255,0.05))',
              border: `1px solid ${upiApps[app.id] ? 'var(--primary)' : 'var(--glass-border, rgba(255,255,255,0.08))'}`,
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{app.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Track SMS from {app.name}</div>
                </div>
              </div>
              <button onClick={() => toggleUpiApp(app.id)} style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: upiApps[app.id] ? 'var(--primary)' : 'var(--surface3)',
                position: 'relative', transition: 'background 0.3s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: upiApps[app.id] ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.3s var(--ease)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </div>
        {Object.values(upiApps).some(Boolean) && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            {Object.values(upiApps).filter(Boolean).length} UPI app{Object.values(upiApps).filter(Boolean).length > 1 ? 's' : ''} being tracked
          </div>
        )}
      </motion.div>

      {/* ═══════ Section 4: Add Investment ═══════ */}
      <motion.div {...anim(0.2)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}><TrendingUp size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Add Investment</div>
            <div className="body-s text-secondary">Track your stocks, mutual funds, FDs and more</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Investment name (e.g. Axis Bluechip Fund)"
            value={invForm.name}
            onChange={e => setInvForm({ ...invForm, name: e.target.value })}
            style={inputStyle}
          />

          <select
            value={invForm.investment_type}
            onChange={e => setInvForm({ ...invForm, investment_type: e.target.value })}
            style={inputStyle}
          >
            {INVESTMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>₹</span>
              <input
                type="number"
                placeholder="Invested amount"
                value={invForm.invested_amount}
                onChange={e => setInvForm({ ...invForm, invested_amount: e.target.value })}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>₹</span>
              <input
                type="number"
                placeholder="Current value"
                value={invForm.current_value}
                onChange={e => setInvForm({ ...invForm, current_value: e.target.value })}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>

          {/* SIP Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--surface2, rgba(255,255,255,0.05))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Is this a SIP?</span>
            <button onClick={() => setInvForm({ ...invForm, is_sip: !invForm.is_sip })} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: invForm.is_sip ? 'var(--primary)' : 'var(--surface3)',
              position: 'relative', transition: 'background 0.3s',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: invForm.is_sip ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.3s var(--ease)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* SIP fields */}
          <AnimatePresence>
            {invForm.is_sip && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, pointerEvents: 'none' }}>₹</span>
                    <input
                      type="number"
                      placeholder="SIP amount/month"
                      value={invForm.sip_amount}
                      onChange={e => setInvForm({ ...invForm, sip_amount: e.target.value })}
                      style={{ ...inputStyle, paddingLeft: 28 }}
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    placeholder="SIP date (1-28)"
                    value={invForm.sip_date}
                    onChange={e => setInvForm({ ...invForm, sip_date: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn-primary full" onClick={handleAddInvestment} disabled={invSaving} style={{ marginTop: 4 }}>
            {invSaving ? 'Saving...' : <><Plus size={14} /> Save Investment</>}
          </button>
        </div>

        {/* Recently added investments */}
        {recentInvestments.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text2)' }}>Recently Added</div>
            {recentInvestments.map((inv, i) => (
              <div key={i} className="info-row" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>
                  {INVESTMENT_TYPES.find(t => t.value === inv.investment_type)?.label?.[0] || '📈'}
                </span>
                <div className="info-body">
                  <div className="info-title">{inv.name}</div>
                  <div className="info-sub">
                    {INVESTMENT_TYPES.find(t => t.value === inv.investment_type)?.label}
                    {inv.is_sip ? ` · SIP ₹${Number(inv.sip_amount).toLocaleString('en-IN')}/mo` : ''}
                  </div>
                </div>
                <div className="info-value">₹{Number(inv.invested_amount).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══════ Section 5: Import Transactions ═══════ */}
      <motion.div {...anim(0.24)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon cyan"><FileText size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Import Transactions</div>
            <div className="body-s text-secondary">Upload bank statement or paste SMS</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
            <Upload size={14} /> Upload CSV
          </button>
          <button className={`btn-secondary ${pasteOpen ? 'active' : ''}`} onClick={() => { setPasteOpen(!pasteOpen); setParsedResult(null) }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
            <Smartphone size={14} /> Paste SMS
          </button>
        </div>

        <AnimatePresence>
          {pasteOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <textarea
                value={pastedSms}
                onChange={e => { setPastedSms(e.target.value); setParsedResult(null) }}
                placeholder="Paste bank SMS here, e.g.:&#10;&#10;Rs.450 debited from A/c XX1234 on 21-06-26 for UPI/Swiggy"
                className="form-input"
                style={{ minHeight: 80, resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
              />
              <button className="btn-primary full" onClick={handleParseSMS} style={{ marginTop: 10 }}>
                Parse & Detect Transaction
              </button>

              {parsedResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, padding: 16, background: 'var(--primary-dim)', borderRadius: 14, border: '1px solid rgba(0,229,176,0.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--primary)' }}>Transaction Detected!</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: 'var(--text3)' }}>Type:</span> <strong>{parsedResult.isIncome ? 'Income' : 'Expense'}</strong></div>
                    <div><span style={{ color: 'var(--text3)' }}>Amount:</span> <strong style={{ fontFamily: 'var(--mono)' }}>₹{parsedResult.amount.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: 'var(--text3)' }}>Category:</span> <strong>{parsedResult.category}</strong></div>
                    {parsedResult.merchant && <div><span style={{ color: 'var(--text3)' }}>Merchant:</span> <strong>{parsedResult.merchant}</strong></div>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button className="btn-primary" onClick={confirmParsedTransaction} disabled={saving} style={{ flex: 1 }}>
                      {saving ? 'Saving...' : <><Check size={14} /> Add Transaction</>}
                    </button>
                    <button className="btn-secondary" onClick={() => setParsedResult(null)} style={{ padding: '10px 16px' }}>
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recently Imported */}
      {recentImports.length > 0 && (
        <motion.div {...anim(0.28)} className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Recently Added</div>
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

      {/* Help text */}
      <motion.div {...anim(0.32)} style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
        <p>Your financial data is encrypted and never shared.</p>
        <p>We only read bank transaction SMS — personal messages are never accessed.</p>
      </motion.div>
    </div>
  )
}
