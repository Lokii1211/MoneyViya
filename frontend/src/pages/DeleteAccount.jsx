import { useState } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Trash2, AlertTriangle, Shield, CheckCircle, ArrowLeft } from 'lucide-react'

export default function DeleteAccount() {
  const { phone, user, logout } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(1)    // 1=info, 2=confirm, 3=done
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleteData, setDeleteData] = useState({
    transactions: true, habits: true, goals: true, chat: true, profile: true
  })

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      // Delete user data from Supabase tables
      const tables = []
      if (deleteData.transactions) tables.push('transactions')
      if (deleteData.habits) tables.push('habits', 'habit_checkins')
      if (deleteData.goals) tables.push('goals')
      if (deleteData.chat) tables.push('chat_history')
      if (deleteData.profile) tables.push('users')

      for (const table of tables) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?phone=eq.${phone}`, {
            method: 'DELETE',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (e) { console.error(`Delete ${table}:`, e) }
      }

      setStep(3)
      // Auto logout after 3 seconds
      setTimeout(() => {
        localStorage.clear()
        logout()
        nav('/auth')
      }, 3000)
    } catch (err) {
      console.error('Delete error:', err)
      alert('Something went wrong. Please contact support.')
    }
    setDeleting(false)
  }

  return (
    <div className="page" style={{maxWidth:480, margin:'0 auto'}}>
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Account Deletion</h2>
        </div>
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div style={{animation:'slideUp 0.3s ease'}}>
          <div style={{background:'linear-gradient(135deg, rgba(255,82,82,0.08), rgba(255,82,82,0.02))', border:'1px solid rgba(255,82,82,0.2)', borderRadius:16, padding:20, marginBottom:20, textAlign:'center'}}>
            <Trash2 size={36} style={{color:'var(--red)', marginBottom:8}}/>
            <div style={{fontSize:18, fontWeight:800, marginBottom:4}}>Delete Your Account</div>
            <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.6}}>
              This action is permanent. All your data will be erased and cannot be recovered.
            </div>
          </div>

          <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>What gets deleted:</div>

          {[
            { key: 'transactions', icon: '💰', label: 'All transactions & expenses', desc: 'Income, expenses, bill scans' },
            { key: 'habits', icon: '🔥', label: 'Habits & streaks', desc: 'All habit data and check-in history' },
            { key: 'goals', icon: '🎯', label: 'Goals & savings', desc: 'Goal progress and saved amounts' },
            { key: 'chat', icon: '💬', label: 'Chat history', desc: 'All AI conversation history' },
            { key: 'profile', icon: '👤', label: 'Profile & account', desc: 'Name, phone, preferences' },
          ].map(item => (
            <label key={item.key} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:8, cursor:'pointer'}}>
              <input type="checkbox" checked={deleteData[item.key]} onChange={e => setDeleteData({...deleteData, [item.key]: e.target.checked})} style={{width:18, height:18, accentColor:'var(--red)'}}/>
              <span style={{fontSize:20}}>{item.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:700}}>{item.label}</div>
                <div style={{fontSize:11, color:'var(--text3)'}}>{ item.desc}</div>
              </div>
            </label>
          ))}

          <div style={{background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:14, marginTop:16, display:'flex', gap:10}}>
            <AlertTriangle size={18} style={{color:'var(--gold)', flexShrink:0, marginTop:2}}/>
            <div style={{fontSize:12, color:'var(--text2)', lineHeight:1.6}}>
              <strong>Note:</strong> If you only want to delete specific data (like transactions), uncheck the items you want to keep. Only checked items will be removed.
            </div>
          </div>

          <button onClick={() => setStep(2)} style={{width:'100%', padding:14, marginTop:20, background:'var(--red)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
            <Trash2 size={16}/> Continue to Delete
          </button>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div style={{animation:'slideUp 0.3s ease'}}>
          <div style={{background:'rgba(255,82,82,0.06)', border:'2px solid var(--red)', borderRadius:16, padding:24, textAlign:'center', marginBottom:20}}>
            <AlertTriangle size={40} style={{color:'var(--red)', marginBottom:8}}/>
            <div style={{fontSize:18, fontWeight:900, color:'var(--red)', marginBottom:8}}>Are you absolutely sure?</div>
            <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:16}}>
              This will permanently delete {Object.values(deleteData).filter(Boolean).length} categories of data for account <strong>+91 {phone}</strong>. This action cannot be undone.
            </div>
            <div style={{fontSize:13, fontWeight:700, marginBottom:8}}>Type <span style={{color:'var(--red)', fontFamily:'var(--mono)'}}>DELETE</span> to confirm:</div>
            <input 
              type="text" value={confirmText} onChange={e => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              style={{width:'100%', padding:'12px 16px', borderRadius:10, border:'2px solid var(--red)', background:'var(--bg)', color:'var(--text)', fontSize:16, fontWeight:800, fontFamily:'var(--mono)', textAlign:'center', letterSpacing:4, outline:'none', boxSizing:'border-box'}}
            />
          </div>

          <div style={{display:'flex', gap:10}}>
            <button onClick={() => { setStep(1); setConfirmText('') }} style={{flex:1, padding:14, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'var(--text)', fontFamily:'inherit'}}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={confirmText !== 'DELETE' || deleting} style={{flex:2, padding:14, background: confirmText === 'DELETE' ? 'var(--red)' : 'var(--border)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily:'inherit', opacity: confirmText === 'DELETE' ? 1 : 0.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
              {deleting ? 'Deleting...' : <><Trash2 size={16}/> Delete Forever</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div style={{textAlign:'center', padding:'60px 20px', animation:'slideUp 0.3s ease'}}>
          <CheckCircle size={56} style={{color:'var(--primary)', marginBottom:16}}/>
          <div style={{fontSize:20, fontWeight:900, marginBottom:8}}>Account Deleted</div>
          <div style={{fontSize:14, color:'var(--text2)', lineHeight:1.6, marginBottom:8}}>
            All selected data has been permanently removed. You will be redirected to the login screen shortly.
          </div>
          <div style={{fontSize:12, color:'var(--text3)'}}>Redirecting in 3 seconds...</div>
        </div>
      )}

      {/* Privacy Footer */}
      <div style={{textAlign:'center', marginTop:32, fontSize:11, color:'var(--text3)', lineHeight:1.6}}>
        <Shield size={14} style={{verticalAlign:'middle', marginRight:4}}/>
        Your privacy matters. Data deletion is processed immediately.
        <br/>For questions, email <a href="mailto:lokesh@viya.app" style={{color:'var(--primary)'}}>lokesh@viya.app</a>
      </div>
    </div>
  )
}
