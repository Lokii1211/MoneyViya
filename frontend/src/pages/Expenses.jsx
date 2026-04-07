import { useState } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

const CATEGORIES = ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Rent','Other']

export default function Expenses() {
  const { phone } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [desc, setDesc] = useState('')
  const [msg, setMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount) return
    const text = type === 'expense' ? `spent ${amount} on ${category} ${desc}` : `earned ${amount} from ${category} ${desc}`
    const r = await api.chat(phone, text)
    setMsg(r.reply || 'Saved!')
    setAmount(''); setDesc(''); setShowForm(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Money Tracker</h2></div></header>
      {msg && <div className="toast">{msg}</div>}
      <div className="type-tabs">
        <button className={'type-tab' + (type === 'expense' ? ' active expense' : '')} onClick={() => setType('expense')}><ArrowDownLeft size={16} /> Expense</button>
        <button className={'type-tab' + (type === 'income' ? ' active income' : '')} onClick={() => setType('income')}><ArrowUpRight size={16} /> Income</button>
      </div>
      {!showForm ? (
        <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={20} /> Add {type === 'expense' ? 'Expense' : 'Income'}</button>
      ) : (
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" className="form-input big-input" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <div className="cat-grid">{CATEGORIES.map(c => (<button type="button" key={c} className={'cat-chip' + (category === c ? ' active' : '')} onClick={() => setCategory(c)}>{c}</button>))}</div>
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input type="text" className="form-input" placeholder="e.g. Swiggy order" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save {type}</button>
          </div>
        </form>
      )}
    </div>
  )
}
