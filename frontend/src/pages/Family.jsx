import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, Plus, Users, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MEMBER_ICONS = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑']

export default function Family() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [members, setMembers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('Spouse')
  const [icon, setIcon] = useState('👩')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('mv_family') || '[]')
    setMembers(saved)
  }, [])

  const saveMembers = (list) => {
    setMembers(list)
    localStorage.setItem('mv_family', JSON.stringify(list))
  }

  const addMember = () => {
    if (!name.trim()) return
    if (members.length >= 4) { showToast('Maximum 4 family members!'); return }
    const newMember = {
      id: Date.now(),
      name: name.trim(),
      relation,
      icon,
      budget: Math.round((user?.daily_budget || 1000) * 0.5),
      expenses: []
    }
    saveMembers([...members, newMember])
    setName(''); setShowAdd(false)
    showToast(`${icon} ${name} added to family! 👨‍👩‍👧‍👦`)
  }

  const removeMember = (id) => {
    if (!confirm('Remove this family member?')) return
    saveMembers(members.filter(m => m.id !== id))
    showToast('Member removed')
  }

  const addExpenseToMember = (memberId) => {
    const amt = prompt('Enter expense amount (₹):')
    if (!amt || isNaN(amt) || Number(amt) <= 0) return
    const cat = prompt('Category (Food/Transport/Shopping/Other):') || 'Other'
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, expenses: [...(m.expenses || []), { amount: Number(amt), category: cat, date: new Date().toISOString() }] }
      }
      return m
    })
    saveMembers(updated)
    showToast(`₹${amt} added for ${members.find(m => m.id === memberId)?.name}`)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const totalFamilySpend = members.reduce((s, m) => s + (m.expenses || []).reduce((ss, e) => ss + e.amount, 0), 0)

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Family Mode</h2>
        </div>
        {members.length < 4 && (
          <button className="btn-primary" style={{padding:'8px 14px', fontSize:12, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} style={{marginRight:4}}/> Add Member
          </button>
        )}
      </div>

      {/* Family Summary */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--violet-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:16, textAlign:'center'}}>
        <div style={{fontSize:32, marginBottom:4}}>👨‍👩‍👧‍👦</div>
        <div style={{fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)'}}>FAMILY EXPENSES</div>
        <div style={{fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:'var(--primary)', margin:'4px 0'}}>
          ₹{totalFamilySpend.toLocaleString('en-IN')}
        </div>
        <div style={{fontSize:12, color:'var(--text2)'}}>{members.length} member{members.length !== 1 ? 's' : ''} · This month</div>
      </div>

      {/* Add Member Form */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:16, marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:10}}>Add Family Member</div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:10}}>
            {MEMBER_ICONS.map(e => (
              <button key={e} onClick={() => setIcon(e)} style={{fontSize:24, padding:6, borderRadius:8, border: icon === e ? '2px solid var(--primary)' : '2px solid transparent', background: icon === e ? 'var(--primary-dim)' : 'var(--bg)', cursor:'pointer'}}>
                {e}
              </button>
            ))}
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={{width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:14, fontFamily:'inherit', marginBottom:8, boxSizing:'border-box'}} />
          <select value={relation} onChange={e => setRelation(e.target.value)} style={{width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:14, fontFamily:'inherit', marginBottom:10, boxSizing:'border-box'}}>
            <option>Spouse</option><option>Parent</option><option>Child</option><option>Sibling</option><option>Other</option>
          </select>
          <button className="btn-primary" style={{width:'100%', padding:'12px', borderRadius:10}} onClick={addMember}>Add {icon} {name || 'Member'}</button>
        </div>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <div style={{textAlign:'center', padding:'40px 20px'}}>
          <Users size={48} style={{color:'var(--text3)', marginBottom:12}} />
          <div style={{fontSize:15, fontWeight:700, marginBottom:4}}>No Family Members Yet</div>
          <div style={{fontSize:12, color:'var(--text3)'}}>Add up to 4 family members to track their expenses separately</div>
        </div>
      ) : members.map(m => {
        const memberSpend = (m.expenses || []).reduce((s, e) => s + e.amount, 0)
        const recentExpenses = (m.expenses || []).slice(-3).reverse()
        return (
          <div key={m.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:16, marginBottom:10}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span style={{fontSize:28}}>{m.icon}</span>
                <div>
                  <div style={{fontSize:14, fontWeight:700}}>{m.name}</div>
                  <div style={{fontSize:11, color:'var(--text3)'}}>{m.relation}</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{fontFamily:'var(--mono)', fontSize:16, fontWeight:800, color:'var(--red)'}}>₹{memberSpend.toLocaleString('en-IN')}</div>
                <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4}} onClick={() => removeMember(m.id)}><Trash2 size={14}/></button>
              </div>
            </div>
            {recentExpenses.length > 0 && (
              <div style={{marginBottom:8}}>
                {recentExpenses.map((e, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', padding:'3px 0'}}>
                    <span>{e.category}</span>
                    <span style={{fontFamily:'var(--mono)', color:'var(--red)'}}>-₹{e.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <button style={{width:'100%', padding:'8px', borderRadius:8, border:'1px dashed var(--border2)', background:'var(--bg)', color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit'}} onClick={() => addExpenseToMember(m.id)}>
              + Add expense for {m.name}
            </button>
          </div>
        )
      })}
    </div>
  )
}
