import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR, useCountUp } from '../lib/utils'
import { useToast } from '../components/Toast'
import { Plus, TrendingDown, TrendingUp, Trash2, Camera, X, Check, Sparkles } from 'lucide-react'

const CATEGORIES = ['🍔 Food', '🚗 Transport', '🛒 Shopping', '🏠 Rent', '💊 Health', '🎬 Entertainment', '📱 Recharge', '📚 Education', '👔 Work', '🎁 Other']
const INCOME_CATS = ['💼 Salary', '🏦 Investment', '💸 Freelance', '🎁 Gift', '📱 Cashback', '🎁 Other']
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

const CAT_MAP = { Food: '🍔 Food', Transport: '🚗 Transport', Shopping: '🛒 Shopping', Rent: '🏠 Rent', Health: '💊 Health', Entertainment: '🎬 Entertainment', Recharge: '📱 Recharge', Education: '📚 Education', Work: '👔 Work', Salary: '💼 Salary', Investment: '🏦 Investment', Other: '🎁 Other' }

export default function Expenses() {
  const { phone, user } = useApp()
  const toast = useToast()
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('🍔 Food')
  const [note, setNote] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const fileRef = useRef(null)
  const [showSMS, setShowSMS] = useState(false)
  const [smsText, setSmsText] = useState('')
  const [smsResult, setSmsResult] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])

  const load = async () => {
    setLoading(true)
    const t = await api.getTransactions(phone); setTxns(t || [])
    if (t && t.length > 10) {
      const cats = {}
      ;(t || []).filter(x => x.type === 'expense').forEach(x => {
        const k = (x.category || '').split(' ').slice(1).join(' ') || x.category
        if (!cats[k]) cats[k] = { name: k, icon: (x.category || '').split(' ')[0], count: 0, total: 0 }
        cats[k].count++; cats[k].total += Number(x.amount)
      })
      setSubscriptions(Object.values(cats).filter(c => c.count >= 3).sort((a,b) => b.total - a.total).slice(0, 5))
    }
    setLoading(false)
  }
  useEffect(() => { if (phone) load() }, [phone])

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return
    type === 'expense' ? await api.addExpense(phone, Number(amount), category, note) : await api.addIncome(phone, Number(amount), category || 'Salary')
    setAmount(''); setNote(''); setShowAdd(false)
    toast.show(type === 'expense' ? 'Expense added!' : 'Income recorded!', 'success'); load()
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setOcrLoading(true); setShowOCR(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise((res, rej) => { reader.readAsDataURL(file); reader.onload = () => res(reader.result.split(',')[1]); reader.onerror = rej })
      const resp = await fetch(`/api/webhook?action=ocr_bill`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, phone }) })
      const parsed = await resp.json()
      if (parsed.error) { toast.show('Could not read bill. Try clearer image.', 'warning'); setShowOCR(false) }
      else if (parsed.amount) { setOcrResult({ amount: parsed.amount, type: parsed.type || 'expense', category: CAT_MAP[parsed.category] || '🎁 Other', description: parsed.description || parsed.merchant || '', merchant: parsed.merchant || '' }) }
      else { toast.show('Could not detect amount.', 'warning'); setShowOCR(false) }
    } catch { toast.show('OCR failed. Add manually.', 'error'); setShowOCR(false) }
    setOcrLoading(false)
  }

  const confirmOCR = async () => {
    if (!ocrResult) return
    ocrResult.type === 'income' ? await api.addIncome(phone, ocrResult.amount, ocrResult.category, ocrResult.description) : await api.addExpense(phone, ocrResult.amount, ocrResult.category, ocrResult.description)
    toast.show(`₹${ocrResult.amount} added from bill!`, 'success')
    setOcrResult(null); setShowOCR(false); load()
  }

  const removeTxn = async (id) => { await api.deleteTransaction(id); toast.show('Deleted', 'info'); load() }

  const parseBankSMS = (text) => {
    const patterns = [/(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|withdrawn)/i, /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)\s*(?:has been|was)?\s*(?:debited|charged|spent)/i, /(?:debited|charged|spent|withdrawn).*?(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i, /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i]
    let amt = 0
    for (const p of patterns) { const m = text.match(p); if (m) { amt = parseFloat(m[1].replace(/,/g, '')); break } }
    if (!amt) return null
    const l = text.toLowerCase()
    let cat = '🎁 Other'
    if (/swiggy|zomato|food|restaurant|lunch|dinner/i.test(l)) cat = '🍔 Food'
    else if (/uber|ola|rapido|cab|petrol|metro/i.test(l)) cat = '🚗 Transport'
    else if (/amazon|flipkart|myntra|shop|mall/i.test(l)) cat = '🛒 Shopping'
    else if (/rent|house|emi/i.test(l)) cat = '🏠 Rent'
    else if (/hospital|pharmacy|doctor/i.test(l)) cat = '💊 Health'
    else if (/netflix|hotstar|movie|spotify/i.test(l)) cat = '🎬 Entertainment'
    else if (/recharge|jio|airtel|bsnl/i.test(l)) cat = '📱 Recharge'
    else if (/college|school|course|udemy/i.test(l)) cat = '📚 Education'
    const mm = text.match(/(?:at|to|towards|for|@)\s+([A-Za-z][A-Za-z\s]+)/i)
    return { amount: amt, category: cat, merchant: mm ? mm[1].trim().split(/\s+/).slice(0,3).join(' ') : '', isIncome: /credit|received|deposit|salary|refund/i.test(l) }
  }

  const handleSMSParse = () => { const r = parseBankSMS(smsText); r ? setSmsResult(r) : toast.show('Could not parse. Try a bank debit SMS.', 'error') }
  const confirmSMS = async () => {
    if (!smsResult) return
    smsResult.isIncome ? await api.addIncome(phone, smsResult.amount, '🏦 Bank Transfer') : await api.addExpense(phone, smsResult.amount, smsResult.category, smsResult.merchant)
    toast.show(`₹${smsResult.amount} auto-detected from SMS!`, 'success')
    setSmsResult(null); setShowSMS(false); setSmsText(''); load()
  }

  const totalExp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalInc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const dailyBudget = Number(user?.daily_budget) || 1000
  const todayExp = txns.filter(t => t.type === 'expense' && new Date(t.created_at).toLocaleDateString() === new Date().toLocaleDateString()).reduce((s, t) => s + Number(t.amount), 0)
  const moneyLeft = dailyBudget - todayExp
  const animatedMoneyLeft = useCountUp(Math.abs(moneyLeft), 800)
  const animatedIncome = useCountUp(totalInc, 700)
  const animatedExpense = useCountUp(totalExp, 700)

  const formatDate = (d) => {
    const dt = new Date(d), today = new Date()
    if (dt.toDateString() === today.toDateString()) return 'Today'
    const y = new Date(today); y.setDate(y.getDate() - 1)
    if (dt.toDateString() === y.toDateString()) return 'Yesterday'
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="page">
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="sr-hidden" onChange={handleImageUpload} />

      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Money</h2>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm ripple" onClick={() => fileRef.current?.click()}><Camera size={15}/> Scan</button>
          <button className="btn-secondary btn-sm ripple" onClick={() => setShowSMS(!showSMS)}>📱 SMS</button>
          <button className="btn-primary btn-sm-primary" onClick={() => setShowAdd(!showAdd)}><Plus size={16}/> Add</button>
        </div>
      </div>

      {loading && !txns.length ? (
        <div>
          <div className="skeleton mb-16" style={{ height: 120, borderRadius: 18 }} />
          <div className="stat-grid">
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          </div>
          {[0,1,2].map(i => <div key={i} className="skeleton mb-8" style={{ height: 64, borderRadius: 12 }} />)}
        </div>
      ) : (
        <>
          <div className="money-left-card">
            <div className="section-label">MONEY LEFT TODAY</div>
            <div className="stat-value num-42" style={{ color: moneyLeft >= 0 ? 'var(--primary)' : 'var(--red)' }}>₹{animatedMoneyLeft}</div>
            {moneyLeft < 0 && <div className="text-error body-s" style={{ fontWeight: 700, marginTop: 4 }}>⚠️ Over budget by ₹{Math.abs(moneyLeft)}</div>}
            <div className="body-s text-secondary mt-2">Daily budget: ₹{dailyBudget} · Spent: ₹{todayExp}</div>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} color="var(--primary)" /><span className="stat-label">INCOME</span></div>
              <div className="stat-value text-success">₹{animatedIncome}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} color="var(--cosmos-400)" /><span className="stat-label">SPENT</span></div>
              <div className="stat-value" style={{ color: 'var(--cosmos-400)' }}>₹{animatedExpense}</div>
            </div>
          </div>

          <div className="home-section">
            <div className="section-label mb-2">⚡ QUICK ADD EXPENSE</div>
            <div className="pill-bar">
              {QUICK_AMOUNTS.map(a => <button key={a} className="pill-btn" onClick={() => { setAmount(String(a)); setShowAdd(true) }}>₹{a}</button>)}
            </div>
          </div>

          {showOCR && (
            <div className="entry-form mb-16" style={{ borderColor: 'var(--violet)' }}>
              {ocrLoading ? (
                <div className="text-center" style={{ padding: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div className="form-title">Scanning bill...</div>
                  <div className="form-subtitle">AI is reading your receipt</div>
                </div>
              ) : ocrResult ? (
                <>
                  <div className="flex items-center gap-2 mb-14"><Sparkles size={18} color="var(--violet)"/><span className="form-title">Bill Detected!</span></div>
                  <div className="info-row info-row-vertical">
                    <div className="info-pair"><span className="body-s text-tertiary">Amount</span>
                      <input type="number" value={ocrResult.amount} onChange={e => setOcrResult({...ocrResult, amount: Number(e.target.value)})} className="form-input" style={{ background:'none', border:'none', fontSize:20, fontWeight:800, textAlign:'right', width:120, padding:0 }} />
                    </div>
                    <div className="info-pair"><span className="body-s text-tertiary">Type</span>
                      <div className="flex gap-1">{['expense','income'].map(t => <button key={t} onClick={() => setOcrResult({...ocrResult, type: t})} className={`pill-btn ${ocrResult.type === t ? 'active' : ''}`}>{t}</button>)}</div>
                    </div>
                    <div className="info-pair"><span className="body-s text-tertiary">Category</span><span style={{ fontWeight: 700 }}>{ocrResult.category}</span></div>
                    {ocrResult.description && <div className="info-pair"><span className="body-s text-tertiary">Description</span><span className="body-s text-secondary">{ocrResult.description}</span></div>}
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => { setShowOCR(false); setOcrResult(null) }}><X size={14}/> Cancel</button>
                    <button className="btn-primary" style={{ flex: 2 }} onClick={confirmOCR}><Check size={16}/> Confirm</button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {showSMS && (
            <div className="entry-form mb-16" style={{ borderColor: 'var(--cyan)' }}>
              <div className="flex items-center gap-2 mb-12">
                <span style={{ fontSize: 20 }}>📱</span>
                <div><div className="form-title">Paste Bank SMS</div><div className="form-subtitle">Auto-detect amount & category</div></div>
              </div>
              <textarea value={smsText} onChange={e => setSmsText(e.target.value)}
                placeholder={'Paste bank SMS here, e.g.:\nINR 450.00 debited from A/c XX1234 to SWIGGY'}
                className="form-input" style={{ minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }}/>
              {smsResult && (
                <div className="info-row info-row-vertical mt-4 mb-4">
                  <div className="info-pair"><span className="body-s text-tertiary">Detected</span>
                    <span className="stat-value" style={{ fontSize: 18, color: smsResult.isIncome ? 'var(--primary)' : 'var(--cosmos-400)' }}>{smsResult.isIncome ? '+' : '-'}₹{smsResult.amount}</span></div>
                  <div className="info-pair"><span className="body-s text-tertiary">Category</span><span style={{ fontWeight: 700 }}>{smsResult.category}</span></div>
                  {smsResult.merchant && <div className="info-pair"><span className="body-s text-tertiary">Merchant</span><span className="body-s text-secondary">{smsResult.merchant}</span></div>}
                </div>
              )}
              <div className="form-actions mt-2">
                <button className="btn-secondary" onClick={() => { setShowSMS(false); setSmsText(''); setSmsResult(null) }}><X size={14}/> Cancel</button>
                {!smsResult
                  ? <button className="btn-primary" style={{ flex: 2 }} onClick={handleSMSParse} disabled={!smsText.trim()}>🔍 Parse SMS</button>
                  : <button className="btn-primary" style={{ flex: 2 }} onClick={confirmSMS}><Check size={14}/> Confirm</button>}
              </div>
            </div>
          )}

          {subscriptions.length > 0 && !showAdd && !showSMS && !showOCR && (
            <div className="home-section">
              <div className="section-label mb-8">🔄 RECURRING EXPENSES DETECTED</div>
              <div className="hscroll">
                {subscriptions.map((s, i) => (
                  <div key={i} className="stat-card sub-card">
                    <div className="sub-icon">{s.icon}</div>
                    <div className="sub-name">{s.name}</div>
                    <div className="stat-value sub-avg" style={{ color: 'var(--cosmos-400)' }}>₹{Math.round(s.total/s.count)}/avg</div>
                    <div className="body-s text-tertiary">{s.count}x logged</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAdd && (
            <div className="entry-form mb-20">
              <div className="type-tabs">
                <button className={`type-tab${type === 'expense' ? ' active expense' : ''}`} onClick={() => setType('expense')}><TrendingDown size={16} /> Expense</button>
                <button className={`type-tab${type === 'income' ? ' active income' : ''}`} onClick={() => setType('income')}><TrendingUp size={16} /> Income</button>
              </div>
              <div className="form-group"><label>Amount (₹)</label>
                <input className="form-input big-input" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
              </div>
              <div className="form-group"><label>Category {amount && '(tap to auto-save)'}</label>
                <div className="cat-grid">
                  {(type === 'expense' ? CATEGORIES : INCOME_CATS).map(c => (
                    <button key={c} className={`cat-chip${category === c ? ' active' : ''}`} onClick={() => {
                      setCategory(c)
                      if (amount && Number(amount) > 0) {
                        const fn = type === 'expense' ? api.addExpense : api.addIncome
                        fn(phone, Number(amount), c, note).then(() => {
                          setAmount(''); setNote(''); setShowAdd(false)
                          toast.show(`₹${amount} ${c.split(' ')[1]} added!`, 'success'); load()
                        })
                      }
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label>Note (optional)</label>
                <input className="form-input" placeholder="What was this for?" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" onClick={submit}>{type === 'expense' ? 'Add Expense' : 'Add Income'}</button>
              </div>
            </div>
          )}

          {txns.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-emoji">💰</div>
              <h3>No transactions yet</h3>
              <p>Tap + to add your first entry!</p>
            </div>
          ) : txns.map(t => (
            <div key={t.id} className="txn-item" style={{ position: 'relative', overflow: 'hidden' }}
              onTouchStart={e => { e.currentTarget.dataset.startX = e.touches[0].clientX; e.currentTarget.dataset.swiped = 'false' }}
              onTouchMove={e => {
                const diff = Number(e.currentTarget.dataset.startX) - e.touches[0].clientX
                if (diff > 60) { e.currentTarget.dataset.swiped = 'true'; e.currentTarget.style.transform = 'translateX(-80px)'; e.currentTarget.style.transition = 'transform 0.2s' }
                else { e.currentTarget.style.transform = 'translateX(0)' }
              }}
              onTouchEnd={e => { if (e.currentTarget.dataset.swiped !== 'true') { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.transition = 'transform 0.3s' } }}
            >
              <div className="txn-icon">{t.category?.split(' ')[0] || (t.type === 'income' ? '💰' : '🛒')}</div>
              <div className="txn-info">
                <div className="txn-name">{t.description || t.category?.split(' ').slice(1).join(' ') || t.category}</div>
                <div className="txn-cat">{formatDate(t.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}₹{Number(t.amount)}</div>
                <button className="btn-ghost delete-ghost" onClick={() => removeTxn(t.id)}><Trash2 size={14} /></button>
              </div>
              <div className="swipe-delete-bg" onClick={() => removeTxn(t.id)}><Trash2 size={18} color="#fff" /></div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
