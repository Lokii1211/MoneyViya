import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Smartphone, Building2, TrendingUp, FileText,
  Shield, Lock, RefreshCw, Check, Upload, Plus, X,
  ChevronDown, ChevronUp, Wifi, WifiOff,
} from 'lucide-react'

const BANKS_TIER1 = [
  { name: 'HDFC',     icon: '🏦', senders: ['HDFCBK'] },
  { name: 'ICICI',    icon: '🏛️', senders: ['ICICIB'] },
  { name: 'SBI',      icon: '🏦', senders: ['SBIINB', 'SBIBNK'] },
  { name: 'Axis',     icon: '🏛️', senders: ['AXISBK'] },
  { name: 'Kotak',    icon: '🏦', senders: ['KOTAKB'] },
  { name: 'IndusInd', icon: '🏛️', senders: ['INDUSB'] },
  { name: 'Yes Bank', icon: '🏦', senders: ['YESBK'] },
]
const BANKS_TIER2 = [
  { name: 'PNB',          icon: '🏦', senders: ['PNBSMS'] },
  { name: 'Canara',       icon: '🏦', senders: ['CANBNK'] },
  { name: 'BOB',          icon: '🏛️', senders: ['BARBK'] },
  { name: 'BOI',          icon: '🏦', senders: ['BOIIND'] },
  { name: 'Union Bank',   icon: '🏛️', senders: ['UBIBNK'] },
  { name: 'Central Bank', icon: '🏦', senders: ['CBIBNK'] },
]
const BANKS_TIER3 = [
  { name: 'Federal',   icon: '🏛️', senders: ['FEDBNK'] },
  { name: 'Bandhan',   icon: '🏦', senders: ['BANDHN'] },
  { name: 'RBL',       icon: '🏛️', senders: ['RBLBNK'] },
  { name: 'IDFC First',icon: '🏦', senders: ['IDFCFB'] },
]
const BANKS_PAYMENT = [
  { name: 'Paytm',  icon: '💰', senders: ['PAYTMB'] },
  { name: 'Airtel', icon: '📱', senders: ['AIRTEL'] },
  { name: 'Jio',    icon: '📶', senders: ['JIOFIN'] },
]
const TOP_BANKS = [...BANKS_TIER1, BANKS_TIER2[0], BANKS_TIER2[1]]
const ALL_BANKS  = [...BANKS_TIER1, ...BANKS_TIER2, ...BANKS_TIER3, ...BANKS_PAYMENT]

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay', icon: '🟦', desc: 'Most popular UPI app' },
  { id: 'phonepe', name: 'PhonePe',    icon: '💜', desc: 'India\'s #1 by volume' },
  { id: 'paytm',   name: 'Paytm',      icon: '💰', desc: 'Payments + wallet' },
  { id: 'bhim',    name: 'BHIM',       icon: '🇮🇳', desc: 'Official NPCI app' },
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
  if (/swiggy|zomato|food|restaurant|lunch|dinner|cafe|eat/i.test(lower))            category = '🍔 Food'
  else if (/uber|ola|rapido|cab|petrol|metro|fuel|fastag/i.test(lower))              category = '🚗 Transport'
  else if (/amazon|flipkart|myntra|shop|mall|meesho/i.test(lower))                   category = '🛍️ Shopping'
  else if (/hospital|pharmacy|doctor|medical|1mg|pharmeasy/i.test(lower))            category = '💊 Health'
  else if (/netflix|hotstar|movie|spotify|prime|entertainment/i.test(lower))         category = '🎬 Entertainment'
  else if (/recharge|jio|airtel|bsnl|electricity|water|gas|internet/i.test(lower))  category = '📱 Bills'
  else if (/college|school|course|udemy|education|tuition/i.test(lower))             category = '📚 Education'
  else if (/sip|mutual|fund|stock|invest|fd|ppf/i.test(lower))                      category = '📈 Investment'
  else if (/emi|loan|repayment/i.test(lower))                                        category = '🏦 EMI'
  else if (/rent|house/i.test(lower))                                                category = '🏠 Rent'
  else if (/salary|income/i.test(lower))                                             category = '💼 Salary'

  const merchantMatch = text.match(/(?:at|to|towards|for|@|VPA)\s+([A-Za-z][A-Za-z0-9\s.*-]+)/i)
  const merchant = merchantMatch
    ? merchantMatch[1].trim().replace(/\*+/g, ' ').split(/\s+/).slice(0, 3).join(' ')
    : ''

  return { amount, category, merchant, isIncome, raw: text }
}

const anim = d => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.35 } })

/* ─── Reusable toggle switch ─── */
function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`bc-toggle ${on ? 'bc-toggle--on' : ''}`}
      aria-label={on ? 'Disable' : 'Enable'}
    >
      <span className="bc-toggle-thumb" />
    </button>
  )
}

/* ─── Bank setup modal ─── */
function BankSetupModal({ bank, phone, onClose, onConnected, toast }) {
  const [balance, setBalance]   = useState('')
  const [smsText, setSmsText]   = useState('')
  const [parsed, setParsed]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [step, setStep]         = useState('form') // form | success

  const handleParse = () => {
    if (!smsText.trim()) { toast.show('Paste a bank SMS first', 'warning'); return }
    const r = parseBankSMS(smsText)
    if (r) setParsed(r)
    else toast.show('Could not parse this SMS. Try a bank debit/credit message.', 'error')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const connectedBanks = JSON.parse(localStorage.getItem('mv_connected_banks') || '[]')
      if (!connectedBanks.includes(bank.name)) connectedBanks.push(bank.name)
      const bankBalances = JSON.parse(localStorage.getItem('mv_bank_balances') || '{}')
      if (balance) bankBalances[bank.name] = Number(balance)

      // Persist to Supabase
      await api.updateUser(phone, {
        connected_banks: JSON.stringify(connectedBanks),
        bank_balances: JSON.stringify(bankBalances),
        sms_enabled: true,
      })
      localStorage.setItem('mv_connected_banks', JSON.stringify(connectedBanks))
      localStorage.setItem('mv_bank_balances', JSON.stringify(bankBalances))

      // Import SMS transaction if parsed
      if (parsed) {
        if (parsed.isIncome) await api.addIncome(phone, parsed.amount, parsed.category)
        else await api.addExpense(phone, parsed.amount, parsed.category, parsed.merchant)
      }

      onConnected(bank.name, bankBalances)
      setStep('success')
      setTimeout(onClose, 1400)
    } catch {
      toast.show('Failed to save. Check connection.', 'error')
    }
    setSaving(false)
  }

  return (
    <motion.div className="modal-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="bc-bank-modal"
        onClick={e => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      >
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bc-modal-success">
              <div className="bc-modal-success-icon">✅</div>
              <div className="bc-modal-success-title">{bank.name} Connected!</div>
              <div className="bc-modal-success-sub">SMS from this bank will be tracked</div>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="bc-modal-hdr">
                <div className="bc-modal-bank-icon">{bank.icon}</div>
                <div>
                  <div className="bc-modal-title">Set up {bank.name}</div>
                  <div className="bc-modal-sub">Enter balance + verify with an SMS</div>
                </div>
                <button className="modal-close" onClick={onClose}><X size={18} /></button>
              </div>

              <div className="bc-modal-body">
                {/* Balance */}
                <div className="bc-modal-section">
                  <label className="bc-modal-label">Current Balance (optional)</label>
                  <div className="bc-modal-input-wrap">
                    <span className="bc-modal-prefix">₹</span>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 45000"
                      value={balance}
                      onChange={e => setBalance(e.target.value)}
                      style={{ paddingLeft: 28 }}
                    />
                  </div>
                </div>

                {/* SMS import */}
                <div className="bc-modal-section">
                  <label className="bc-modal-label">Paste a recent bank SMS to verify + import</label>
                  <textarea
                    className="form-input"
                    placeholder={`Paste SMS from ${bank.name}, e.g.:\n\nRs.1500 debited from A/c XX1234 on 30-06-26 for UPI/Swiggy`}
                    value={smsText}
                    onChange={e => { setSmsText(e.target.value); setParsed(null) }}
                    style={{ minHeight: 72, resize: 'vertical', fontSize: 13 }}
                  />
                  <button className="btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={handleParse}>
                    Detect Transaction from SMS
                  </button>
                </div>

                <AnimatePresence>
                  {parsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="bc-parsed-card"
                    >
                      <div className="bc-parsed-title">{parsed.isIncome ? '💚 Income Detected' : '🔴 Expense Detected'}</div>
                      <div className="bc-parsed-row">
                        <span>Amount</span><strong>₹{parsed.amount.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="bc-parsed-row">
                        <span>Category</span><strong>{parsed.category}</strong>
                      </div>
                      {parsed.merchant && (
                        <div className="bc-parsed-row">
                          <span>Merchant</span><strong>{parsed.merchant}</strong>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className="btn-primary full" onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
                  {saving ? 'Connecting…' : <><Check size={14} /> Connect {bank.name}</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ─── UPI SMS Paste section ─── */
function UpiPasteSection({ app, phone, toast }) {
  const [smsText, setSmsText] = useState('')
  const [parsed, setParsed]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const handleParse = () => {
    if (!smsText.trim()) { toast.show('Paste a UPI SMS first', 'warning'); return }
    const r = parseBankSMS(smsText)
    if (r) setParsed(r)
    else toast.show('Could not parse SMS. Try a UPI payment confirmation message.', 'error')
  }

  const handleSave = async () => {
    if (!parsed || !phone) return
    setSaving(true)
    try {
      if (parsed.isIncome) await api.addIncome(phone, parsed.amount, parsed.category)
      else await api.addExpense(phone, parsed.amount, parsed.category, parsed.merchant)
      toast.show(`₹${parsed.amount.toLocaleString('en-IN')} imported from ${app.name}!`, 'success')
      setSmsText('')
      setParsed(null)
    } catch {
      toast.show('Failed to save. Try again.', 'error')
    }
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="bc-upi-paste"
    >
      <textarea
        className="form-input"
        placeholder={`Paste ${app.name} payment SMS here, e.g.:\nPaid Rs.250 via GPay to Zomato`}
        value={smsText}
        onChange={e => { setSmsText(e.target.value); setParsed(null) }}
        style={{ minHeight: 68, resize: 'vertical', fontSize: 13 }}
      />
      <button className="btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={handleParse}>
        Detect Transaction
      </button>
      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bc-parsed-card"
            style={{ marginTop: 10 }}
          >
            <div className="bc-parsed-title">{parsed.isIncome ? '💚 Income' : '🔴 Expense'} — ₹{parsed.amount.toLocaleString('en-IN')}</div>
            <div className="bc-parsed-row"><span>Category</span><strong>{parsed.category}</strong></div>
            {parsed.merchant && <div className="bc-parsed-row"><span>Merchant</span><strong>{parsed.merchant}</strong></div>}
            <button className="btn-primary full" onClick={handleSave} disabled={saving} style={{ marginTop: 10 }}>
              {saving ? 'Saving…' : <><Check size={14} /> Add to Transactions</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function BankConnect() {
  const nav   = useNavigate()
  const { phone } = useApp()
  const toast = useToast()
  const fileRef = useRef(null)

  const [loading, setLoading] = useState(true)

  // SMS toggle — persisted to Supabase
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smsSaving, setSmsSaving]   = useState(false)

  // Banks — persisted to Supabase
  const [connectedBanks, setConnectedBanks]   = useState([])
  const [bankBalances, setBankBalances]         = useState({})
  const [showAllBanks, setShowAllBanks]         = useState(false)
  const [bankModal, setBankModal]               = useState(null) // bank object | null

  // UPI — persisted to Supabase
  const [upiApps, setUpiApps] = useState({})
  const [upiSaving, setUpiSaving] = useState({})

  // Investment form (already writes to Supabase)
  const [invForm, setInvForm] = useState({
    name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '',
  })
  const [invSaving, setInvSaving]           = useState(false)
  const [recentInvestments, setRecentInvestments] = useState([])

  // Import SMS
  const [pasteOpen, setPasteOpen]     = useState(false)
  const [pastedSms, setPastedSms]     = useState('')
  const [parsedResult, setParsedResult] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [recentImports, setRecentImports] = useState([])

  /* ─── Load state from Supabase on mount ─── */
  useEffect(() => {
    if (!phone) { setLoading(false); return }
    api.getUser(phone).then(user => {
      if (user) {
        setSmsEnabled(!!user.sms_enabled)
        try { setConnectedBanks(JSON.parse(user.connected_banks || '[]')) } catch { setConnectedBanks([]) }
        try { setBankBalances(JSON.parse(user.bank_balances || '{}')) } catch { setBankBalances({}) }
        try { setUpiApps(JSON.parse(user.upi_apps || '{}')) } catch { setUpiApps({}) }
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [phone])

  /* ─── SMS Toggle — real Supabase write ─── */
  const toggleSms = async () => {
    const next = !smsEnabled
    setSmsEnabled(next)
    setSmsSaving(true)
    try {
      await api.updateUser(phone, { sms_enabled: next })
      localStorage.setItem('mv_sms_enabled', String(next))
      toast.show(
        next ? 'SMS tracking enabled — paste bank messages below to auto-import' : 'SMS tracking disabled',
        next ? 'success' : 'info'
      )
    } catch {
      setSmsEnabled(!next) // revert on fail
      toast.show('Failed to save. Check connection.', 'error')
    }
    setSmsSaving(false)
  }

  /* ─── Bank Connect — opens setup modal ─── */
  const handleBankClick = bank => {
    if (connectedBanks.includes(bank.name)) {
      // Disconnect
      const updated = connectedBanks.filter(b => b !== bank.name)
      const updatedBalances = { ...bankBalances }
      delete updatedBalances[bank.name]
      setConnectedBanks(updated)
      setBankBalances(updatedBalances)
      api.updateUser(phone, {
        connected_banks: JSON.stringify(updated),
        bank_balances: JSON.stringify(updatedBalances),
      })
      toast.show(`${bank.name} disconnected`, 'info')
    } else {
      setBankModal(bank)
    }
  }

  const handleBankConnected = (bankName, newBalances) => {
    if (!connectedBanks.includes(bankName)) {
      setConnectedBanks(prev => [...prev, bankName])
    }
    setBankBalances(newBalances)
  }

  /* ─── UPI Toggle — real Supabase write ─── */
  const toggleUpiApp = async (appId) => {
    const next = !upiApps[appId]
    const updated = { ...upiApps, [appId]: next }
    setUpiApps(updated)
    setUpiSaving(s => ({ ...s, [appId]: true }))
    try {
      await api.updateUser(phone, { upi_apps: JSON.stringify(updated) })
      localStorage.setItem('mv_upi_apps', JSON.stringify(updated))
      const app = UPI_APPS.find(a => a.id === appId)
      toast.show(next ? `${app.name} tracking enabled — paste SMS below` : `${app.name} tracking disabled`, next ? 'success' : 'info')
    } catch {
      setUpiApps(prev => ({ ...prev, [appId]: !next })) // revert
      toast.show('Failed to save', 'error')
    }
    setUpiSaving(s => ({ ...s, [appId]: false }))
  }

  /* ─── Investment form ─── */
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
        data.sip_date   = invForm.sip_date || ''
      }
      await api.addInvestment(phone, data)
      setRecentInvestments(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)])
      toast.show(`${data.name} added to portfolio!`, 'success')
      setInvForm({ name: '', investment_type: 'mutual_fund', invested_amount: '', current_value: '', is_sip: false, sip_amount: '', sip_date: '' })
    } catch {
      toast.show('Failed to save investment. Try again.', 'error')
    }
    setInvSaving(false)
  }

  /* ─── SMS Import ─── */
  const handleParseSMS = () => {
    if (!pastedSms.trim()) { toast.show('Paste a bank SMS first', 'warning'); return }
    const result = parseBankSMS(pastedSms)
    if (result) setParsedResult(result)
    else toast.show('Could not parse this SMS. Try a debit/credit message.', 'error')
  }

  const confirmParsedTransaction = async () => {
    if (!parsedResult || !phone) return
    setSaving(true)
    try {
      if (parsedResult.isIncome) await api.addIncome(phone, parsedResult.amount, parsedResult.category)
      else await api.addExpense(phone, parsedResult.amount, parsedResult.category, parsedResult.merchant)
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
        if (isDebit) await api.addExpense(phone, amount, '💳 Other', desc.slice(0, 100))
        else await api.addIncome(phone, amount, '💼 Salary')
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

      {/* Bank setup modal */}
      <AnimatePresence>
        {bankModal && (
          <BankSetupModal
            bank={bankModal}
            phone={phone}
            onClose={() => setBankModal(null)}
            onConnected={handleBankConnected}
            toast={toast}
          />
        )}
      </AnimatePresence>

      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => nav(-1)}><ArrowLeft size={20} /></button>
          <h2>Connect Accounts</h2>
        </div>
      </div>

      <motion.div {...anim(0)} className="bc-hero">
        <h2>Auto-track every rupee</h2>
        <p>Connect bank SMS, UPI apps, add investments, or import statements — all saved to your account.</p>
      </motion.div>

      {/* ═══════ Section 1: SMS Auto-Track ═══════ */}
      <motion.div {...anim(0.08)} className="card bc-section">
        <div className="bc-row">
          <div className="info-icon green"><Smartphone size={20} /></div>
          <div className="bc-row-body">
            <div className="bc-row-title">SMS Auto-Track</div>
            <div className="bc-row-sub">
              {smsEnabled ? <span className="bc-status-dot green" /> : null}
              {smsEnabled ? 'Active — monitoring bank SMS' : 'Auto-detect bank transactions from SMS'}
            </div>
          </div>
          <Toggle on={smsEnabled} onToggle={smsSaving ? undefined : toggleSms} />
        </div>

        <AnimatePresence>
          {smsEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bc-sms-active"
            >
              <div className="bc-sms-tip">
                <Wifi size={14} />
                On Android app: SMS are auto-detected. On web: paste SMS below to import transactions.
              </div>
              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => { setPasteOpen(true); document.getElementById('bc-import-section')?.scrollIntoView({ behavior: 'smooth' }) }}
              >
                Paste Bank SMS to Import
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bc-trust-row">
          <span className="bc-trust"><Shield size={11} /> RBI regulated</span>
          <span className="bc-trust"><Lock size={11} /> Read-only</span>
          <span className="bc-trust"><RefreshCw size={11} /> Revoke anytime</span>
        </div>
      </motion.div>

      {/* ═══════ Section 2: Select Banks ═══════ */}
      <motion.div {...anim(0.12)} className="card bc-section">
        <div className="bc-section-hdr">
          <div className="info-icon violet"><Building2 size={20} /></div>
          <div>
            <div className="bc-row-title">Select Your Banks</div>
            <div className="bc-row-sub">
              {connectedBanks.length > 0
                ? `${connectedBanks.length} bank${connectedBanks.length > 1 ? 's' : ''} connected`
                : 'Tap banks you use — we\'ll track their SMS'}
            </div>
          </div>
        </div>

        <div className="bank-grid" style={{ maxHeight: showAllBanks ? 'none' : 284, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
          {visibleBanks.map(b => {
            const connected = connectedBanks.includes(b.name)
            const bal = bankBalances[b.name]
            return (
              <button
                key={b.name}
                className={`bank-card ${connected ? 'bank-card--connected' : ''}`}
                onClick={() => handleBankClick(b)}
              >
                <span className="bank-icon">{b.icon}</span>
                <span className="bank-name">{b.name}</span>
                {connected
                  ? <>
                      <Check size={12} className="bank-check" />
                      {bal && <span className="bank-bal">₹{Number(bal).toLocaleString('en-IN')}</span>}
                    </>
                  : <Plus size={12} style={{ color: 'var(--text3)', opacity: 0.6 }} />
                }
              </button>
            )
          })}
        </div>

        <button className="bc-show-more" onClick={() => setShowAllBanks(!showAllBanks)}>
          {showAllBanks ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show all {ALL_BANKS.length} banks</>}
        </button>
      </motion.div>

      {/* ═══════ Section 3: UPI Auto-Track ═══════ */}
      <motion.div {...anim(0.16)} className="card bc-section">
        <div className="bc-section-hdr">
          <div className="info-icon cyan"><Smartphone size={20} /></div>
          <div>
            <div className="bc-row-title">UPI Auto-Track</div>
            <div className="bc-row-sub">70%+ of Indian transactions are UPI — track them all</div>
          </div>
        </div>

        <div className="bc-upi-list">
          {UPI_APPS.map(app => {
            const on = !!upiApps[app.id]
            return (
              <div key={app.id} className={`bc-upi-item ${on ? 'bc-upi-item--on' : ''}`}>
                <div className="bc-upi-main">
                  <span className="bc-upi-icon">{app.icon}</span>
                  <div className="bc-upi-info">
                    <div className="bc-upi-name">{app.name}</div>
                    <div className="bc-upi-desc">{app.desc}</div>
                  </div>
                  <Toggle on={on} onToggle={() => !upiSaving[app.id] && toggleUpiApp(app.id)} />
                </div>

                <AnimatePresence>
                  {on && (
                    <UpiPasteSection app={app} phone={phone} toast={toast} />
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {Object.values(upiApps).some(Boolean) && (
          <div className="bc-upi-count">
            {Object.values(upiApps).filter(Boolean).length} UPI app{Object.values(upiApps).filter(Boolean).length > 1 ? 's' : ''} being tracked
          </div>
        )}
      </motion.div>

      {/* ═══════ Section 4: Add Investment ═══════ */}
      <motion.div {...anim(0.2)} className="card bc-section">
        <div className="bc-section-hdr">
          <div className="info-icon gold"><TrendingUp size={20} /></div>
          <div>
            <div className="bc-row-title">Add Investment</div>
            <div className="bc-row-sub">Track stocks, mutual funds, FDs and more</div>
          </div>
        </div>

        <div className="bc-inv-form">
          <input
            type="text"
            className="input-field"
            placeholder="Investment name (e.g. Axis Bluechip Fund)"
            value={invForm.name}
            onChange={e => setInvForm({ ...invForm, name: e.target.value })}
          />

          <select
            className="input-field"
            value={invForm.investment_type}
            onChange={e => setInvForm({ ...invForm, investment_type: e.target.value })}
          >
            {INVESTMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div className="bc-inv-row2">
            <div className="bc-amount-wrap">
              <span className="bc-rupee">₹</span>
              <input
                type="number"
                className="input-field"
                placeholder="Invested amount"
                value={invForm.invested_amount}
                onChange={e => setInvForm({ ...invForm, invested_amount: e.target.value })}
                style={{ paddingLeft: 26 }}
              />
            </div>
            <div className="bc-amount-wrap">
              <span className="bc-rupee">₹</span>
              <input
                type="number"
                className="input-field"
                placeholder="Current value"
                value={invForm.current_value}
                onChange={e => setInvForm({ ...invForm, current_value: e.target.value })}
                style={{ paddingLeft: 26 }}
              />
            </div>
          </div>

          <div className="bc-sip-toggle-row">
            <span className="bc-sip-label">Is this a SIP?</span>
            <Toggle on={invForm.is_sip} onToggle={() => setInvForm({ ...invForm, is_sip: !invForm.is_sip })} />
          </div>

          <AnimatePresence>
            {invForm.is_sip && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div className="bc-inv-row2" style={{ marginTop: 8 }}>
                  <div className="bc-amount-wrap">
                    <span className="bc-rupee">₹</span>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="SIP/month"
                      value={invForm.sip_amount}
                      onChange={e => setInvForm({ ...invForm, sip_amount: e.target.value })}
                      style={{ paddingLeft: 26 }}
                    />
                  </div>
                  <input
                    type="number"
                    className="input-field"
                    min="1" max="28"
                    placeholder="SIP date (1-28)"
                    value={invForm.sip_date}
                    onChange={e => setInvForm({ ...invForm, sip_date: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn-primary full" onClick={handleAddInvestment} disabled={invSaving}>
            {invSaving ? 'Saving…' : <><Plus size={14} /> Save Investment</>}
          </button>
        </div>

        {recentInvestments.length > 0 && (
          <div className="bc-recent">
            <div className="bc-recent-title">Recently Added</div>
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
      <motion.div {...anim(0.24)} className="card bc-section" id="bc-import-section">
        <div className="bc-section-hdr">
          <div className="info-icon cyan"><FileText size={20} /></div>
          <div>
            <div className="bc-row-title">Import Transactions</div>
            <div className="bc-row-sub">Upload bank statement CSV or paste bank SMS</div>
          </div>
        </div>

        <div className="bc-import-btns">
          <button className="btn-secondary" onClick={() => fileRef.current?.click()} style={{ flex: 1, gap: 6 }}>
            <Upload size={14} /> Upload CSV
          </button>
          <button
            className={`btn-secondary ${pasteOpen ? 'btn-secondary--active' : ''}`}
            onClick={() => { setPasteOpen(!pasteOpen); setParsedResult(null) }}
            style={{ flex: 1, gap: 6 }}
          >
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
                style={{ minHeight: 80, resize: 'vertical', fontSize: 13, lineHeight: 1.6, marginTop: 10 }}
              />
              <button className="btn-primary full" onClick={handleParseSMS} style={{ marginTop: 10 }}>
                Parse & Detect Transaction
              </button>

              <AnimatePresence>
                {parsedResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bc-parsed-card" style={{ marginTop: 14 }}>
                    <div className="bc-parsed-title">Transaction Detected!</div>
                    <div className="bc-parsed-grid">
                      <div><span>Type</span><strong>{parsedResult.isIncome ? 'Income' : 'Expense'}</strong></div>
                      <div><span>Amount</span><strong>₹{parsedResult.amount.toLocaleString('en-IN')}</strong></div>
                      <div><span>Category</span><strong>{parsedResult.category}</strong></div>
                      {parsedResult.merchant && <div><span>Merchant</span><strong>{parsedResult.merchant}</strong></div>}
                    </div>
                    <div className="bc-parsed-actions">
                      <button className="btn-primary" onClick={confirmParsedTransaction} disabled={saving} style={{ flex: 1 }}>
                        {saving ? 'Saving…' : <><Check size={14} /> Add Transaction</>}
                      </button>
                      <button className="btn-secondary" onClick={() => setParsedResult(null)} style={{ padding: '10px 16px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recently Imported */}
      {recentImports.length > 0 && (
        <motion.div {...anim(0.28)} className="card bc-section">
          <div className="bc-recent-title">Recently Added</div>
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

      <motion.div {...anim(0.32)} className="bc-footer">
        <p>Your financial data is encrypted and never shared.</p>
        <p>We only read bank transaction SMS — personal messages are never accessed.</p>
      </motion.div>
    </div>
  )
}
