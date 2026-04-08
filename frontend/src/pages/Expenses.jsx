import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'

const CATEGORIES = ['🍔 Food', '🚗 Transport', '🛒 Shopping', '🏠 Rent', '💊 Health', '🎬 Entertainment', '📱 Recharge', '📚 Education', '👔 Work', '🎁 Other']

export default function Expenses() {
  const { phone } = useApp()
  const [txns, setTxns] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('🍔 Food')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  const load = async () => { const t = await api.getTransactions(phone); setTxns(t || []) }
  useEffect(() => { if (phone) load() }, [phone])

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

  const removeTxn = async (id) => { await api.deleteTransaction(id); showToast('Deleted'); load() }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2000) }

  const totalExp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalInc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

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
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Money</h2>
        <button className="btn-primary" style={{padding:'8px 16px', fontSize:13, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} style={{marginRight:4}} /> Add
        </button>
      </div>

      {/* Summary */}
      <div style={{display:'flex', gap:10, marginBottom:20}}>
        <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingUp size={14} color="var(--primary)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>INCOME</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--primary)'}}>₹{totalInc.toLocaleString('en-IN')}</div>
        </div>
        <div style={{flex:1, background:'var(--red-dim)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:12, padding:'14px 16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}><TrendingDown size={14} color="var(--red)" /><span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>SPENT</span></div>
          <div style={{fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--red)'}}>₹{totalExp.toLocaleString('en-IN')}</div>
        </div>
      </div>

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
          <div className="form-group"><label>Category</label>
            <div className="cat-grid">
              {(type === 'expense' ? CATEGORIES : ['💼 Salary', '🏦 Investment', '💸 Freelance', '🎁 Gift', '📱 Cashback', '🎁 Other']).map(c => (
                <button key={c} className={`cat-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
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
