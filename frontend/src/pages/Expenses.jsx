import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
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

  const load = async () => { const t = await api.getTransactions(phone); setTxns(t || []) }
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
          <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} style={{marginRight:4}} /> Add
          </button>
        </div>
      </div>

      {/* 💰 MONEY LEFT TODAY — Primary Display */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:18, padding:'24px 20px', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:-20, right:-20, width:100, height:100, background:'var(--primary)', opacity:0.05, borderRadius:'50%'}} />
        <div style={{fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)', marginBottom:4}}>MONEY LEFT TODAY</div>
        <div style={{fontFamily:'var(--mono)', fontSize:42, fontWeight:900, color: moneyLeft >= 0 ? 'var(--primary)' : 'var(--red)', lineHeight:1.1}}>
          ₹{Math.abs(moneyLeft).toLocaleString('en-IN')}
        </div>
        {moneyLeft < 0 && <div style={{fontSize:12, color:'var(--red)', fontWeight:700, marginTop:4}}>⚠️ Over budget by ₹{Math.abs(moneyLeft)}</div>}
        <div style={{fontSize:12, color:'var(--text2)', marginTop:6}}>Daily budget: ₹{dailyBudget.toLocaleString('en-IN')} · Spent: ₹{todayExpenses.toLocaleString('en-IN')}</div>
      </div>

      {/* Summary Cards */}
      <div style={{display:'flex', gap:10, marginBottom:16}}>
        <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingUp size={14} color="var(--primary)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>INCOME</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--primary)'}}>₹{totalInc.toLocaleString('en-IN')}</div>
        </div>
        <div style={{flex:1, background:'var(--red-dim)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingDown size={14} color="var(--red)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>SPENT</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--red)'}}>₹{totalExp.toLocaleString('en-IN')}</div>
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
                      <button key={t} onClick={() => setOcrResult({...ocrResult, type: t})} style={{padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, border:'1px solid', cursor:'pointer', fontFamily:'inherit', borderColor: ocrResult.type === t ? (t==='expense'?'var(--red)':'var(--primary)') : 'var(--border)', color: ocrResult.type === t ? (t==='expense'?'var(--red)':'var(--primary)') : 'var(--text3)', background: ocrResult.type === t ? (t==='expense'?'var(--red-dim)':'var(--primary-dim)') : 'transparent'}}>{t}</button>
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
          <div key={t.id} className="txn-item">
            <div className="txn-icon">{t.category?.split(' ')[0] || (t.type === 'income' ? '💰' : '🛒')}</div>
            <div className="txn-info">
              <div className="txn-name">{t.description || t.category?.split(' ').slice(1).join(' ') || t.category}</div>
              <div className="txn-cat">{formatDate(t.created_at)}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}</div>
              <button style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer', opacity:0.4, padding:4}} onClick={() => removeTxn(t.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
