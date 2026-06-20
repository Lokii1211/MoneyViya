import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
import { useCountUp } from '../lib/utils'
import { Plus, TrendingDown, TrendingUp, Trash2, Camera, Upload, X, Check, Sparkles } from 'lucide-react'

const CATEGORIES = ['🍔 Food', '🚗 Transport', '🛒 Shopping', '🏠 Rent', '💊 Health', '🎬 Entertainment', '📱 Recharge', '📚 Education', '👔 Work', '🎁 Other']
const INCOME_CATS = ['💼 Salary', '🏦 Investment', '💸 Freelance', '🎁 Gift', '📱 Cashback', '🎁 Other']
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

export default function Expenses() {
  const { phone, user } = useApp()
  const [txns, setTxns] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('🍔 Food')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const fileRef = useRef(null)
  const [showSMS, setShowSMS] = useState(false)
  const [smsText, setSmsText] = useState('')
  const [smsResult, setSmsResult] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])

  const load = async () => {
    const t = await api.getTransactions(phone); setTxns(t || [])
    // Detect subscriptions (recurring expenses)
    if (t && t.length > 10) {
      const cats = {}; (t || []).filter(x => x.type === 'expense').forEach(x => {
        const k = (x.category || '').split(' ').slice(1).join(' ') || x.category
        if (!cats[k]) cats[k] = { name: k, icon: (x.category || '').split(' ')[0], count: 0, total: 0 }
        cats[k].count++; cats[k].total += Number(x.amount)
      })
      setSubscriptions(Object.values(cats).filter(c => c.count >= 3).sort((a,b) => b.total - a.total).slice(0, 5))
    }
  }
  useEffect(() => { if (phone) load() }, [phone])

  // Quick add — auto-save on category tap
  const quickAdd = async (amt, cat) => {
    await api.addExpense(phone, amt, cat, '')
    showToast(`₹${amt} ${cat.split(' ')[1]} added! ⚡`)
    load()
  }

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return
    if (type === 'expense') {
      await api.addExpense(phone, Number(amount), category, note)
    } else {
      await api.addIncome(phone, Number(amount), category || 'Salary')
    }
    setAmount(''); setNote(''); setShowAdd(false)
    showToast(type === 'expense' ? 'Expense added! 📝' : 'Income recorded! 💰')
    load()
  }

  // OCR Bill Scanner
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setShowOCR(true)
    
    try {
      const base64 = await fileToBase64(file)
      
      // Use server-side OCR endpoint (keeps API key secure)
      const resp = await fetch(`/api/webhook?action=ocr_bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, phone })
      })
      
      const parsed = await resp.json()
      
      if (parsed.error) {
        showToast('⚠️ Could not read the bill. Try a clearer image.')
        setShowOCR(false)
      } else if (parsed.amount) {
        setOcrResult({
          amount: parsed.amount || 0,
          type: parsed.type || 'expense',
          category: mapCategory(parsed.category),
          description: parsed.description || parsed.merchant || '',
          merchant: parsed.merchant || ''
        })
      } else {
        showToast('⚠️ Could not detect amount. Add manually.')
        setShowOCR(false)
      }
    } catch (err) {
      console.error('OCR error:', err)
      showToast('⚠️ OCR failed. Add manually.')
      setShowOCR(false)
    }
    setOcrLoading(false)
  }

  const confirmOCR = async () => {
    if (!ocrResult) return
    if (ocrResult.type === 'income') {
      await api.addIncome(phone, ocrResult.amount, ocrResult.category, ocrResult.description)
    } else {
      await api.addExpense(phone, ocrResult.amount, ocrResult.category, ocrResult.description)
    }
    showToast(`✅ ₹${ocrResult.amount} ${ocrResult.type} added from bill!`)
    setOcrResult(null); setShowOCR(false)
    load()
  }

  const mapCategory = (cat) => {
    const map = { Food: '🍔 Food', Transport: '🚗 Transport', Shopping: '🛒 Shopping', Rent: '🏠 Rent', Health: '💊 Health', Entertainment: '🎬 Entertainment', Recharge: '📱 Recharge', Education: '📚 Education', Work: '👔 Work', Salary: '💼 Salary', Investment: '🏦 Investment', Other: '🎁 Other' }
    return map[cat] || '🎁 Other'
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })

  const removeTxn = async (id) => { await api.deleteTransaction(id); showToast('Deleted'); load() }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  // 📱 Bank SMS Auto-Parser — Blueprint core feature
  const parseBankSMS = (text) => {
    const patterns = [
      // HDFC: "INR X.XX debited from A/c XX1234 on DD-MM-YY to MERCHANT"
      /(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:debited|spent|withdrawn)/i,
      // ICICI: "Rs X.XX spent on ICICI Card"
      /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)\s*(?:has been|was)?\s*(?:debited|charged|spent)/i,
      // SBI: "Dear Customer, Rs X.XX debited"
      /(?:debited|charged|spent|withdrawn).*?(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
      // Generic: any amount pattern
      /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/i,
    ]
    let amount = 0
    for (const p of patterns) {
      const m = text.match(p)
      if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break }
    }
    if (!amount) return null
    // Detect merchant/category
    const lower = text.toLowerCase()
    let category = '🎁 Other'
    if (/swiggy|zomato|food|restaurant|eat|lunch|dinner|breakfast/i.test(lower)) category = '🍔 Food'
    else if (/uber|ola|rapido|cab|auto|petrol|fuel|metro/i.test(lower)) category = '🚗 Transport'
    else if (/amazon|flipkart|myntra|shop|mall|mart/i.test(lower)) category = '🛒 Shopping'
    else if (/rent|house|flat|room|emi/i.test(lower)) category = '🏠 Rent'
    else if (/hospital|medical|pharmacy|doctor|health|med/i.test(lower)) category = '💊 Health'
    else if (/netflix|hotstar|prime|movie|spotify|game/i.test(lower)) category = '🎬 Entertainment'
    else if (/recharge|jio|airtel|vi|bsnl|mobile/i.test(lower)) category = '📱 Recharge'
    else if (/college|school|course|udemy|book|fee/i.test(lower)) category = '📚 Education'
    // Extract merchant name
    const merchantMatch = text.match(/(?:at|to|towards|for|@)\s+([A-Za-z][A-Za-z\s]+)/i)
    const merchant = merchantMatch ? merchantMatch[1].trim().split(/\s+/).slice(0,3).join(' ') : ''
    return { amount, category, merchant, isIncome: /credit|received|deposit|salary|refund/i.test(lower) }
  }

  const handleSMSParse = () => {
    const result = parseBankSMS(smsText)
    if (result) {
      setSmsResult(result)
    } else {
      showToast('❌ Could not parse this message. Try a bank debit SMS.')
    }
  }

  const confirmSMS = async () => {
    if (!smsResult) return
    if (smsResult.isIncome) {
      await api.addIncome(phone, smsResult.amount, '🏦 Bank Transfer')
    } else {
      await api.addExpense(phone, smsResult.amount, smsResult.category, smsResult.merchant)
    }
    showToast(`✅ ₹${smsResult.amount} auto-detected from SMS!`)
    setSmsResult(null); setShowSMS(false); setSmsText(''); load()
  }

  // Calculations
  const totalExp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalInc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const dailyBudget = Number(user?.daily_budget) || 1000
  const todayExpenses = txns.filter(t => {
    if (t.type !== 'expense') return false
    const d = new Date(t.created_at).toLocaleDateString()
    return d === new Date().toLocaleDateString()
  }).reduce((s, t) => s + Number(t.amount), 0)
  const moneyLeft = dailyBudget - todayExpenses

  const animatedMoneyLeft = useCountUp(Math.abs(moneyLeft), 800)
  const animatedIncome = useCountUp(totalInc, 700)
  const animatedExpense = useCountUp(totalExp, 700)

  const formatDate = (d) => {
    const dt = new Date(d)
    const today = new Date()
    if (dt.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (dt.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      <input type="file" ref={fileRef} accept="image/*" capture="environment" style={{display:'none'}} onChange={handleImageUpload} />
      
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Money</h2>
        <div style={{display:'flex', gap:6}}>
          <button style={{padding:'8px 12px', fontSize:13, borderRadius:10, background:'var(--violet-dim)', border:'1px solid rgba(139,92,246,0.2)', color:'var(--violet)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4}} onClick={() => fileRef.current?.click()}>
            <Camera size={15}/> Scan Bill
          </button>
          <button style={{padding:'8px 12px', fontSize:13, borderRadius:10, background:'var(--cyan-dim)', border:'1px solid rgba(0,200,200,0.2)', color:'var(--cyan)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4}} onClick={() => setShowSMS(!showSMS)}>
            📱 SMS
          </button>
          <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} style={{marginRight:4}} /> Add
          </button>
        </div>
      </div>

      {/* 💰 MONEY LEFT TODAY — animated */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:18, padding:'24px 20px', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:-20, right:-20, width:100, height:100, background:'var(--primary)', opacity:0.05, borderRadius:'50%'}} />
        <div style={{fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:4}}>MONEY LEFT TODAY</div>
        <div style={{fontFamily:'var(--mono)', fontSize:42, fontWeight:900, color: moneyLeft >= 0 ? 'var(--primary)' : 'var(--red)', lineHeight:1.1}}>
          ₹{animatedMoneyLeft}
        </div>
        {moneyLeft < 0 && <div style={{fontSize:12, color:'var(--red)', fontWeight:700, marginTop:4}}>⚠️ Over budget by ₹{Math.abs(moneyLeft)}</div>}
        <div style={{fontSize:12, color:'var(--text2)', marginTop:6}}>Daily budget: ₹{dailyBudget} · Spent: ₹{todayExpenses}</div>
      </div>

      {/* Summary Cards */}
      <div style={{display:'flex', gap:10, marginBottom:16}}>
        <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingUp size={14} color="var(--primary)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>INCOME</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--primary)'}}>₹{animatedIncome}</div>
        </div>
        <div style={{flex:1, background:'var(--cosmos-50)', border:'1px solid rgba(85,20,255,0.15)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingDown size={14} color="var(--cosmos-400)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>SPENT</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--cosmos-400)'}}>₹{animatedExpense}</div>
        </div>
      </div>

      {/* ⚡ Quick Expense — One-tap amounts */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, letterSpacing:0.5}}>⚡ QUICK ADD EXPENSE</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {QUICK_AMOUNTS.map(a => (
            <button key={a} style={{padding:'8px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--text)', cursor:'pointer', transition:'all 0.2s'}} onClick={() => {
              setAmount(String(a)); setShowAdd(true)
            }}>₹{a}</button>
          ))}
        </div>
      </div>

      {/* OCR Result Confirmation */}
      {showOCR && (
        <div style={{background:'var(--surface)', border:'2px solid var(--violet)', borderRadius:16, padding:20, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          {ocrLoading ? (
            <div style={{textAlign:'center', padding:20}}>
              <div style={{fontSize:32, marginBottom:8}}>🔍</div>
              <div style={{fontSize:14, fontWeight:700}}>Scanning bill...</div>
              <div style={{fontSize:12, color:'var(--text2)'}}>AI is reading your receipt</div>
            </div>
          ) : ocrResult ? (
            <>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
                <Sparkles size={18} color="var(--violet)"/>
                <div style={{fontSize:14, fontWeight:800}}>Bill Detected!</div>
              </div>
              <div style={{background:'var(--bg2)', borderRadius:12, padding:14, marginBottom:12}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:12, color:'var(--text3)'}}>Amount</span>
                  <input type="number" value={ocrResult.amount} onChange={e => setOcrResult({...ocrResult, amount: Number(e.target.value)})} style={{background:'none', border:'none', fontSize:20, fontWeight:800, fontFamily:'var(--mono)', color:'var(--primary)', textAlign:'right', width:120, outline:'none'}} />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:12, color:'var(--text3)'}}>Type</span>
                  <div style={{display:'flex', gap:4}}>
                    {['expense','income'].map(t => (
                      <button key={t} onClick={() => setOcrResult({...ocrResult, type: t})} style={{padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, border:'1px solid', cursor:'pointer', fontFamily:'inherit', borderColor: ocrResult.type === t ? (t==='expense'?'var(--cosmos-400)':'var(--primary)') : 'var(--border)', color: ocrResult.type === t ? (t==='expense'?'var(--cosmos-400)':'var(--primary)') : 'var(--text3)', background: ocrResult.type === t ? (t==='expense'?'var(--cosmos-50)':'var(--primary-dim)') : 'transparent'}}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:12, color:'var(--text3)'}}>Category</span>
                  <span style={{fontSize:13, fontWeight:700}}>{ocrResult.category}</span>
                </div>
                {ocrResult.description && <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span style={{fontSize:12, color:'var(--text3)'}}>Description</span>
                  <span style={{fontSize:12, color:'var(--text2)'}}>{ocrResult.description}</span>
                </div>}
              </div>
              <div style={{display:'flex', gap:8}}>
                <button style={{flex:1, padding:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'var(--text2)', display:'flex', alignItems:'center', justifyContent:'center', gap:6}} onClick={() => { setShowOCR(false); setOcrResult(null) }}>
                  <X size={14}/> Cancel
                </button>
                <button className="btn-primary" style={{flex:2, padding:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6}} onClick={confirmOCR}>
                  <Check size={16}/> Confirm & Add
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* 📱 Bank SMS Auto-Parser */}
      {showSMS && (
        <div style={{background:'var(--surface)', border:'2px solid var(--cyan)', borderRadius:16, padding:20, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
            <span style={{fontSize:20}}>📱</span>
            <div><div style={{fontSize:14, fontWeight:800}}>Paste Bank SMS</div><div style={{fontSize:11, color:'var(--text3)'}}>Auto-detect amount & category from bank messages</div></div>
          </div>
          <textarea value={smsText} onChange={e => setSmsText(e.target.value)} placeholder={'Paste your bank SMS here, e.g.:\nINR 450.00 debited from A/c XX1234 on 12-04-26 to SWIGGY'} style={{width:'100%', minHeight:80, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:12, fontSize:13, fontFamily:'monospace', color:'var(--text)', resize:'vertical', outline:'none'}}/>
          {smsResult && (
            <div style={{background:'var(--bg2)', borderRadius:12, padding:14, marginTop:10, marginBottom:10}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                <span style={{fontSize:12, color:'var(--text3)'}}>Detected</span>
                <span style={{fontFamily:'var(--mono)', fontSize:18, fontWeight:800, color: smsResult.isIncome ? 'var(--primary)' : 'var(--cosmos-400)'}}>
                  {smsResult.isIncome ? '+' : '-'}₹{smsResult.amount}
                </span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{fontSize:12, color:'var(--text3)'}}>Category</span>
                <span style={{fontSize:13, fontWeight:700}}>{smsResult.category}</span>
              </div>
              {smsResult.merchant && <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
                <span style={{fontSize:12, color:'var(--text3)'}}>Merchant</span>
                <span style={{fontSize:12, color:'var(--text2)'}}>{smsResult.merchant}</span>
              </div>}
            </div>
          )}
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button style={{flex:1, padding:10, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--text2)'}} onClick={() => { setShowSMS(false); setSmsText(''); setSmsResult(null) }}>
              <X size={14} style={{marginRight:4}}/> Cancel
            </button>
            {!smsResult ? (
              <button className="btn-primary" style={{flex:2, padding:10}} onClick={handleSMSParse} disabled={!smsText.trim()}>
                🔍 Parse SMS
              </button>
            ) : (
              <button className="btn-primary" style={{flex:2, padding:10}} onClick={confirmSMS}>
                <Check size={14} style={{marginRight:4}}/> Confirm & Add
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔄 Recurring Subscriptions Detection */}
      {subscriptions.length > 0 && !showAdd && !showSMS && !showOCR && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:0.5}}>🔄 RECURRING EXPENSES DETECTED</div>
          <div style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4}}>
            {subscriptions.map((s, i) => (
              <div key={i} style={{minWidth:120, background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:'10px 12px', flexShrink:0}}>
                <div style={{fontSize:18, marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:12, fontWeight:700, marginBottom:2}}>{s.name}</div>
                <div style={{fontFamily:'var(--mono)', fontSize:13, fontWeight:800, color:'var(--cosmos-400)'}}>₹{Math.round(s.total/s.count)}/avg</div>
                <div style={{fontSize:10, color:'var(--text3)'}}>{s.count}x logged</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <div className="entry-form" style={{marginBottom:20}}>
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
                  // Auto-save on category tap if amount exists
                  if (amount && Number(amount) > 0) {
                    const fn = type === 'expense' ? api.addExpense : api.addIncome
                    fn(phone, Number(amount), c, note).then(() => {
                      setAmount(''); setNote(''); setShowAdd(false)
                      showToast(type === 'expense' ? `₹${amount} ${c.split(' ')[1]} added! ⚡` : `₹${amount} income added! 💰`)
                      load()
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

      {/* Transactions */}
      {txns.length === 0 ? (
        <div className="empty-text">No transactions yet. Tap + to add your first entry! 💰</div>
      ) : (
        txns.map(t => (
          <div key={t.id} className="txn-item" style={{position:'relative', overflow:'hidden'}}
            onTouchStart={e => { e.currentTarget.dataset.startX = e.touches[0].clientX; e.currentTarget.dataset.swiped = 'false' }}
            onTouchMove={e => {
              const startX = Number(e.currentTarget.dataset.startX)
              const diff = startX - e.touches[0].clientX
              if (diff > 60) { e.currentTarget.dataset.swiped = 'true'; e.currentTarget.style.transform = 'translateX(-80px)'; e.currentTarget.style.transition = 'transform 0.2s' }
              else { e.currentTarget.style.transform = 'translateX(0)' }
            }}
            onTouchEnd={e => {
              if (e.currentTarget.dataset.swiped !== 'true') { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.transition = 'transform 0.3s' }
            }}
          >
            <div className="txn-icon">{t.category?.split(' ')[0] || (t.type === 'income' ? '💰' : '🛒')}</div>
            <div className="txn-info">
              <div className="txn-name">{t.description || t.category?.split(' ').slice(1).join(' ') || t.category}</div>
              <div className="txn-cat">{formatDate(t.created_at)}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}₹{Number(t.amount)}</div>
              <button style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer', opacity:0.4, padding:4}} onClick={() => removeTxn(t.id)}><Trash2 size={14} /></button>
            </div>
            {/* Swipe delete background */}
            <div style={{position:'absolute', right:0, top:0, bottom:0, width:80, background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'0 12px 12px 0', zIndex:-1}} onClick={() => removeTxn(t.id)}>
              <Trash2 size={18} color="#fff" />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
