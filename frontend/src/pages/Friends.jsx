import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, UserPlus, Send, Check, X, Flame, PiggyBank, Trash2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Friends() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [friends, setFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [friendPhone, setFriendPhone] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => { if (phone) loadAll() }, [phone])

  const loadAll = async () => {
    const sent = await api.getFamilyConnections(phone)
    const received = await api.getFamilyInvitesReceived(phone)
    const sentF = (sent || []).filter(c => c.connection_type === 'friend')
    const recvF = (received || []).filter(c => c.connection_type === 'friend')

    // Build accepted friends with overview stats
    const accepted = []
    for (const c of sentF.filter(c => c.status === 'accepted')) {
      const u = await api.getUser(c.member_phone)
      const habits = await api.getHabits(c.member_phone)
      const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
      const goals = await api.getGoals(c.member_phone)
      const totalSaved = (goals || []).reduce((s, g) => s + Number(g.current_amount || 0), 0)
      accepted.push({ ...c, friendPhone: c.member_phone, name: u?.name || c.member_phone, maxStreak, totalSaved, totalHabits: (habits || []).length })
    }
    for (const c of recvF.filter(c => c.status === 'accepted')) {
      const u = await api.getUser(c.owner_phone)
      const habits = await api.getHabits(c.owner_phone)
      const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
      const goals = await api.getGoals(c.owner_phone)
      const totalSaved = (goals || []).reduce((s, g) => s + Number(g.current_amount || 0), 0)
      accepted.push({ ...c, friendPhone: c.owner_phone, name: u?.name || c.owner_phone, maxStreak, totalSaved, totalHabits: (habits || []).length })
    }
    setFriends(accepted)

    const pRecv = []
    for (const c of recvF.filter(c => c.status === 'pending')) {
      const u = await api.getUser(c.owner_phone)
      pRecv.push({ ...c, name: u?.name || c.owner_phone })
    }
    setPendingReceived(pRecv)
    setPendingSent(sentF.filter(c => c.status === 'pending'))
  }

  const sendRequest = async () => {
    const clean = friendPhone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10)
    if (clean.length !== 10) { showToast('❌ Enter valid 10-digit number'); return }
    if (clean === phone) { showToast("❌ Can't add yourself!"); return }
    const target = await api.getUser(clean)
    if (!target) { showToast('❌ Not on Viya yet. Ask them to join!'); return }
    const existing = await api.getFamilyConnections(phone)
    const received = await api.getFamilyInvitesReceived(phone)
    if ([...(existing || []), ...(received || [])].some(c => c.connection_type === 'friend' && (c.member_phone === clean || c.owner_phone === clean))) {
      showToast('❌ Already connected!'); return
    }
    await api.sendFriendRequest(phone, clean)
    await api.addNotification(clean, `🤝 ${user?.name || phone} sent you a friend request!`, 'friend_request')
    showToast(`✅ Request sent to ${target.name || clean}!`)
    setFriendPhone(''); setShowAdd(false); loadAll()
  }

  const accept = async (inv) => {
    await api.respondFamilyInvite(inv.id, 'accepted')
    await api.addNotification(inv.owner_phone, `✅ ${user?.name || phone} accepted your friend request!`, 'friend_accepted')
    showToast(`✅ Now friends with ${inv.name}! 🤝`); loadAll()
  }
  const reject = async (inv) => { await api.respondFamilyInvite(inv.id, 'rejected'); showToast('Declined'); loadAll() }
  const removeFriend = async (f) => {
    if (!confirm(`Remove ${f.name}?`)) return
    await api.removeFamilyConnection(f.id); showToast('Removed'); loadAll()
  }
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>🤝 Friends</h2>
        </div>
        <button className="btn-primary" style={{padding:'8px 14px', fontSize:12, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <UserPlus size={14} style={{marginRight:4}}/> Add
        </button>
      </div>

      {/* Add Friend */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'2px solid var(--primary)', borderRadius:14, padding:16, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{fontSize:14, fontWeight:800, marginBottom:4}}>Add by Phone Number</div>
          <div style={{fontSize:11, color:'var(--text3)', marginBottom:12}}>See each other's streaks & savings overview</div>
          <div style={{display:'flex', alignItems:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'0 12px', marginBottom:10}}>
            <span style={{fontSize:13, color:'var(--text3)', marginRight:4}}>+91</span>
            <input type="tel" maxLength={10} value={friendPhone} onChange={e => setFriendPhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone number" style={{flex:1, padding:'12px 0', border:'none', background:'none', fontSize:14, color:'var(--text)', fontFamily:'var(--mono)', outline:'none'}}/>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{flex:1, padding:10, borderRadius:10, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" style={{flex:2, padding:10, borderRadius:10}} onClick={sendRequest} disabled={friendPhone.length !== 10}>
              <Send size={14} style={{marginRight:4}}/> Send Request
            </button>
          </div>
        </div>
      )}

      {/* Pending Received */}
      {pendingReceived.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:0.5, marginBottom:8}}>📩 FRIEND REQUESTS</div>
          {pendingReceived.map(inv => (
            <div key={inv.id} style={{background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:12, padding:14, marginBottom:8}}>
              <div style={{fontSize:14, fontWeight:700, marginBottom:6}}>{inv.name}</div>
              <div style={{display:'flex', gap:8}}>
                <button className="btn-primary" style={{flex:1, padding:8, borderRadius:8, fontSize:12}} onClick={() => accept(inv)}><Check size={14}/> Accept</button>
                <button style={{flex:1, padding:8, borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer'}} onClick={() => reject(inv)}><X size={14}/> Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8}}>⏳ SENT</div>
          {pendingSent.map(inv => (
            <div key={inv.id} style={{background:'var(--surface)', borderRadius:12, padding:12, marginBottom:6, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontSize:13, fontWeight:700}}>📱 {inv.member_phone}</span>
              <span style={{fontSize:11, color:'var(--text3)'}}>Waiting...</span>
            </div>
          ))}
        </div>
      )}

      {/* Friends List — ONLY streaks, savings, overview */}
      {friends.length > 0 && (
        <div>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>🤝 YOUR FRIENDS ({friends.length})</div>
          {friends.map(f => (
            <div key={f.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, marginBottom:10}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:40, height:40, borderRadius:12, background:'var(--primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800}}>
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:14, fontWeight:700}}>{f.name}</div>
                    <div style={{display:'flex', gap:12, marginTop:2}}>
                      <span style={{fontSize:12, color:'var(--gold)', fontWeight:700}}>🔥 {f.maxStreak} streak</span>
                      <span style={{fontSize:12, color:'var(--primary)', fontWeight:700}}>💰 ₹{f.totalSaved > 999 ? Math.round(f.totalSaved/1000) + 'K' : f.totalSaved} saved</span>
                    </div>
                  </div>
                </div>
                <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--red)', padding:4}} onClick={() => removeFriend(f)}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && !showAdd && (
        <div style={{textAlign:'center', padding:'40px 20px'}}>
          <div style={{fontSize:48, marginBottom:12}}>🤝</div>
          <div style={{fontSize:16, fontWeight:800, marginBottom:4}}>Connect with Friends</div>
          <div style={{fontSize:13, color:'var(--text3)', lineHeight:1.6, marginBottom:20, maxWidth:280, margin:'0 auto 20px'}}>
            Add friends by phone to see each other's streaks & savings. Motivate each other! 💪
          </div>
          <button className="btn-primary" style={{padding:'12px 24px', borderRadius:12, fontSize:14}} onClick={() => setShowAdd(true)}>
            <UserPlus size={16} style={{marginRight:6}}/> Add Your First Friend
          </button>
        </div>
      )}
    </div>
  )
}
