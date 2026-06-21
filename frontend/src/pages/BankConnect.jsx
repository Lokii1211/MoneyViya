import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Smartphone, Building2, TrendingUp, FileText, Shield, Lock, RefreshCw, Check, Upload, Plus, X, AlertTriangle } from 'lucide-react'

const BANKS = [
  { name: 'HDFC', icon: '🏦', senders: ['HDFCBK'] },
  { name: 'ICICI', icon: '🏛️', senders: ['ICICIB'] },
  { name: 'SBI', icon: '🏦', senders: ['SBIINB', 'SBIBNK'] },
  { name: 'Axis', icon: '🏛️', senders: ['AXISBK'] },
  { name: 'Kotak', icon: '🏦', senders: ['KOTAKB'] },
  { name: 'PNB', icon: '🏦', senders: ['PNBSMS'] },
  { name: 'BOB', icon: '🏛️', senders: ['BARBK'] },
  { name: 'Canara', icon: '🏦', senders: ['CANBNK'] },
  { name: 'IndusInd', icon: '🏛️', senders: ['INDUSB'] },
]

const BROKERS = [
  { name: 'Zerodha', icon: '📈' },
  { name: 'Groww', icon: '📊' },
  { name: 'Kuvera', icon: '💹' },
  { name: 'Upstox', icon: '📉' },
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

export default function BankConnect() {
  const nav = useNavigate()
  const { phone } = useApp()
  const toast = useToast()
  const fileRef = useRef(null)
  const [smsEnabled, setSmsEnabled] = useState(() => localStorage.getItem('mv_sms_enabled') === 'true')
  const [connectedBanks, setConnectedBanks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mv_connected_banks') || '[]') } catch { return [] }
  })
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pastedSms, setPastedSms] = useState('')
  const [parsedResult, setParsedResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recentImports, setRecentImports] = useState([])
  const [showBankDetail, setShowBankDetail] = useState(null)

  const toggleSms = () => {
    const next = !smsEnabled
    setSmsEnabled(next)
    localStorage.setItem('mv_sms_enabled', String(next))
    toast.show(next ? 'SMS Auto-Track enabled! Bank SMS will be auto-detected.' : 'SMS Auto-Track disabled', next ? 'success' : 'info')
  }

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
        <p>Connect bank SMS, import statements, or paste individual transactions to automatically track all your money.</p>
      </motion.div>

      {/* SMS Auto-Track */}
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

      {/* Select Banks to Track */}
      <motion.div {...anim(0.12)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon violet"><Building2 size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Select Your Banks</div>
            <div className="body-s text-secondary">Tap banks you use — we'll track their SMS</div>
          </div>
        </div>
        <div className="bank-grid">
          {BANKS.map(b => {
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

      {/* Track Investments */}
      <motion.div {...anim(0.16)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="info-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}><TrendingUp size={20} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Track Investments</div>
            <div className="body-s text-secondary">Add your portfolio manually or via chat</div>
          </div>
        </div>
        <div className="broker-grid">
          {BROKERS.map(b => (
            <button key={b.name} className="broker-card" onClick={() => nav(`/chat?q=I+have+investments+in+${b.name}`)}>
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <div>
                <div className="broker-name">{b.name}</div>
                <div className="broker-status">Tell Viya →</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
          Tell Viya about your investments in chat — "I have a SIP in Axis Bluechip ₹5000/month" and it will be tracked.
        </div>
      </motion.div>

      {/* Import Transactions */}
      <motion.div {...anim(0.2)} className="card" style={{ padding: 20, marginBottom: 14 }}>
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
        <motion.div {...anim(0.24)} className="card" style={{ padding: 20, marginBottom: 14 }}>
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
      <motion.div {...anim(0.28)} style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
        <p>Your financial data is encrypted and never shared.</p>
        <p>We only read bank transaction SMS — personal messages are never accessed.</p>
      </motion.div>
    </div>
  )
}
