import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, UserPlus, Send, Check, X, Flame, PiggyBank, Target, Eye, Trash2, Users, Phone } from 'lucide-react'
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
  const [viewFriend, setViewFriend] = useState(null)
  const [friendProfile, setFriendProfile] = useState(null)

  useEffect(() => { if (phone) loadAll() }, [phone])

  const loadAll = async () => {
    // Connections I sent
    const sent = await api.getFamilyConnections(phone)
    // Connections I received
    const received = await api.getFamilyInvitesReceived(phone)

    // Filter by connection_type = 'friend'
    const sentFriends = (sent || []).filter(c => c.connection_type === 'friend')
    const recvFriends = (received || []).filter(c => c.connection_type === 'friend')

    // Accepted friends — merge both directions
    const acceptedList = []
    for (const c of sentFriends.filter(c => c.status === 'accepted')) {
      const u = await api.getUser(c.member_phone)
      if (u) acceptedList.push({ ...c, friendPhone: c.member_phone, name: u.name || c.member_phone, userData: u })
    }
    for (const c of recvFriends.filter(c => c.status === 'accepted')) {
      const u = await api.getUser(c.owner_phone)
      if (u) acceptedList.push({ ...c, friendPhone: c.owner_phone, name: u.name || c.owner_phone, userData: u })
    }
    setFriends(acceptedList)

    // Pending I received
    const pRecv = []
    for (const c of recvFriends.filter(c => c.status === 'pending')) {
      const u = await api.getUser(c.owner_phone)
      pRecv.push({ ...c, name: u?.name || c.owner_phone })
    }
    setPendingReceived(pRecv)

    // Pending I sent
    setPendingSent(sentFriends.filter(c => c.status === 'pending'))
  }

  const sendRequest = async () => {
    const clean = friendPhone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10)
    if (clean.length !== 10) { showToast('❌ Enter valid 10-digit number'); return }
    if (clean === phone) { showToast("❌ Can't add yourself!"); return }

    const target = await api.getUser(clean)
    if (!target) { showToast('❌ Not on Viya yet. Ask them to join!'); return }

    // Check existing
    const existing = await api.getFamilyConnections(phone)
    const received = await api.getFamilyInvitesReceived(phone)
    if ([...(existing || []), ...(received || [])].some(c => c.connection_type === 'friend' && (c.member_phone === clean || c.owner_phone === clean))) {
      showToast('❌ Already connected or invited!'); return
    }

    await api.sendFriendRequest(phone, clean)
    // Create notification for the receiver
    const senderName = user?.name || phone
    await api.addNotification(clean, `🤝 ${senderName} sent you a friend request!`, 'friend_request')
    showToast(`✅ Friend request sent to ${target.name || clean}!`)
    setFriendPhone(''); setShowAdd(false)
    loadAll()
  }

  const accept = async (inv) => {
    await api.respondFamilyInvite(inv.id, 'accepted')
    // Notify the sender that their request was accepted
    const myName = user?.name || phone
    await api.addNotification(inv.owner_phone, `✅ ${myName} accepted your friend request!`, 'friend_accepted')
    showToast(`✅ You're now friends with ${inv.name}! 🤝`)
    loadAll()
  }

  const reject = async (inv) => {
    await api.respondFamilyInvite(inv.id, 'rejected')
    showToast('Request declined')
    loadAll()
  }

  const removeFriend = async (f) => {
    if (!confirm(`Remove ${f.name} from friends?`)) return
    await api.removeFamilyConnection(f.id)
    showToast('Friend removed'); setViewFriend(null); setFriendProfile(null)
    loadAll()
  }

  const openProfile = async (f) => {
    setViewFriend(f)
    const habits = await api.getHabits(f.friendPhone)
    const goals = await api.getGoals(f.friendPhone)
    const txns = await api.getTransactions(f.friendPhone, 20)
    const maxStreak = (habits || []).reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
    const totalSaved = (goals || []).reduce((s, g) => s + Number(g.current_amount || 0), 0)
    const totalExpense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const totalIncome = Number(f.userData?.monthly_income || 0)
    setFriendProfile({ habits: habits || [], goals: goals || [], maxStreak, totalSaved, totalExpense, totalIncome, totalHabits: (habits || []).length })
  }

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Friends</h2>
        </div>
        <button className="btn-primary" style={{padding:'8px 14px', fontSize:12, borderRadius:10}} onClick={() => setShowAdd(!showAdd)}>
          <UserPlus size={14} style={{marginRight:4}}/> Add
        </button>
      </div>

      {/* Send Friend Request */}
      {showAdd && (
        <div style={{background:'var(--surface)', border:'2px solid var(--primary)', borderRadius:14, padding:16, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
            <UserPlus size={18} color="var(--primary)"/>
            <div>
              <div style={{fontSize:14, fontWeight:800}}>Add Friend by Phone</div>
              <div style={{fontSize:11, color:'var(--text3)'}}>See each other's streaks, savings & goals for motivation!</div>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'0 12px', marginBottom:10}}>
            <span style={{fontSize:13, color:'var(--text3)', marginRight:4}}>+91</span>
            <input type="tel" maxLength={10} value={friendPhone} onChange={e => setFriendPhone(e.target.value.replace(/\D/g, ''))} placeholder="Enter phone number" style={{flex:1, padding:'12px 0', border:'none', background:'none', fontSize:14, color:'var(--text)', fontFamily:'var(--mono)', outline:'none'}}/>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{flex:1, padding:10, borderRadius:10, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" style={{flex:2, padding:10, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={sendRequest} disabled={friendPhone.length !== 10}>
              <Send size={14}/> Send Request
            </button>
          </div>
        </div>
      )}

      {/* Pending Requests Received */}
      {pendingReceived.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:0.5, marginBottom:8}}>📩 FRIEND REQUESTS</div>
          {pendingReceived.map(inv => (
            <div key={inv.id} style={{background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:12, padding:14, marginBottom:8}}>
              <div style={{fontSize:14, fontWeight:700, marginBottom:2}}>{inv.name}</div>
              <div style={{fontSize:11, color:'var(--text3)', marginBottom:10}}>Wants to connect — you'll see each other's streaks & savings</div>
              <div style={{display:'flex', gap:8}}>
                <button style={{flex:1, padding:'8px', borderRadius:8, background:'var(--primary)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={() => accept(inv)}>
                  <Check size={14}/> Accept
                </button>
                <button style={{flex:1, padding:'8px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={() => reject(inv)}>
                  <X size={14}/> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>⏳ SENT REQUESTS</div>
          {pendingSent.map(inv => (
            <div key={inv.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:12, marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:13, fontWeight:700}}>📱 {inv.member_phone}</div>
                <div style={{fontSize:11, color:'var(--text3)'}}>Waiting for them to accept...</div>
              </div>
              <span style={{fontSize:16}}>⏳</span>
            </div>
          ))}
        </div>
      )}

      {/* Connected Friends List */}
      {friends.length > 0 && !viewFriend && (
        <div>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>🤝 YOUR FRIENDS ({friends.length})</div>
          {friends.map(f => {
            const streak = (f.userData?.current_streak || 0)
            return (
              <div key={f.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, marginBottom:10, cursor:'pointer'}} onClick={() => openProfile(f)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{width:40, height:40, borderRadius:12, background:'var(--primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>🤝</div>
                    <div>
                      <div style={{fontSize:14, fontWeight:700}}>{f.name}</div>
                      <div style={{fontSize:11, color:'var(--text3)'}}>{f.friendPhone}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <Eye size={14} color="var(--primary)"/>
                    <span style={{fontSize:12, color:'var(--primary)', fontWeight:600}}>View</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Friend Profile View */}
      {viewFriend && friendProfile && (
        <div style={{animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--primary)', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:4}} onClick={() => { setViewFriend(null); setFriendProfile(null) }}>
              <ArrowLeft size={16}/> Back to list
            </button>
            <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:12, display:'flex', alignItems:'center', gap:4}} onClick={() => removeFriend(viewFriend)}>
              <Trash2 size={14}/> Remove
            </button>
          </div>

          {/* Profile Header */}
          <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:16, textAlign:'center'}}>
            <div style={{fontSize:40, marginBottom:4}}>🤝</div>
            <div style={{fontSize:18, fontWeight:800}}>{viewFriend.name}</div>
            <div style={{fontSize:12, color:'var(--text3)'}}>Friend · {viewFriend.friendPhone}</div>
          </div>

          {/* Stats Grid */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
            <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, textAlign:'center'}}>
              <Flame size={20} color="var(--gold)" style={{marginBottom:4}}/>
              <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:900, color:'var(--gold)'}}>{friendProfile.maxStreak}🔥</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>BEST STREAK</div>
            </div>
            <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, textAlign:'center'}}>
              <PiggyBank size={20} color="var(--primary)" style={{marginBottom:4}}/>
              <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:900, color:'var(--primary)'}}>₹{friendProfile.totalSaved > 999 ? Math.round(friendProfile.totalSaved/1000) + 'K' : friendProfile.totalSaved}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>SAVED</div>
            </div>
            <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, textAlign:'center'}}>
              <Target size={20} color="var(--violet)" style={{marginBottom:4}}/>
              <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:900, color:'var(--violet)'}}>{friendProfile.goals.length}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>GOALS</div>
            </div>
            <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:14, textAlign:'center'}}>
              <Users size={20} color="var(--cyan)" style={{marginBottom:4}}/>
              <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:900, color:'var(--cyan)'}}>{friendProfile.totalHabits}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>HABITS</div>
            </div>
          </div>

          {/* Habits & Streaks */}
          {friendProfile.habits.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12, fontWeight:700, marginBottom:8}}>🔥 Habits & Streaks</div>
              {friendProfile.habits.map((h, i) => (
                <div key={i} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontSize:16}}>{h.icon || '✅'}</span>
                    <span style={{fontSize:13, fontWeight:600}}>{h.name}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span style={{fontFamily:'var(--mono)', fontSize:13, fontWeight:800, color: (h.current_streak || 0) >= 7 ? 'var(--gold)' : 'var(--text2)'}}>{h.current_streak || 0}🔥</span>
                    <span style={{fontSize:10, color:'var(--text3)'}}>best: {h.longest_streak || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Goals */}
          {friendProfile.goals.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12, fontWeight:700, marginBottom:8}}>🎯 Goals</div>
              {friendProfile.goals.map((g, i) => {
                const pct = g.target_amount > 0 ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100) : 0
                return (
                  <div key={i} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 12px', marginBottom:6}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                      <div style={{display:'flex', alignItems:'center', gap:6}}>
                        <span style={{fontSize:16}}>{g.icon || '🎯'}</span>
                        <span style={{fontSize:13, fontWeight:600}}>{g.name}</span>
                      </div>
                      <span style={{fontFamily:'var(--mono)', fontSize:12, fontWeight:800, color:'var(--primary)'}}>{pct}%</span>
                    </div>
                    <div style={{height:4, background:'var(--border)', borderRadius:2, overflow:'hidden'}}>
                      <div style={{height:'100%', width: pct + '%', background:'var(--primary)', borderRadius:2, transition:'width 0.5s var(--ease)'}}/>
                    </div>
                    <div style={{fontSize:10, color:'var(--text3)', marginTop:4}}>₹{Number(g.current_amount || 0).toLocaleString('en-IN')} / ₹{Number(g.target_amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Motivation Message */}
          <div style={{background:'linear-gradient(135deg, #1a1a3e, #2d1b69)', borderRadius:14, padding:16, textAlign:'center'}}>
            <div style={{fontSize:24, marginBottom:4}}>{friendProfile.maxStreak >= 7 ? '🏆' : '💪'}</div>
            <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:4}}>
              {friendProfile.maxStreak >= 7
                ? `${viewFriend.name} has a ${friendProfile.maxStreak}-day streak! Can you beat it?`
                : `${viewFriend.name} is building habits. Let's motivate each other!`}
            </div>
            <div style={{fontSize:11, color:'rgba(255,255,255,0.5)'}}>Stay consistent. Stay accountable. 🔥</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && !showAdd && (
        <div style={{textAlign:'center', padding:'40px 20px'}}>
          <div style={{fontSize:48, marginBottom:12}}>🤝</div>
          <div style={{fontSize:16, fontWeight:800, marginBottom:4}}>Connect with Friends</div>
          <div style={{fontSize:13, color:'var(--text3)', lineHeight:1.6, marginBottom:20, maxWidth:280, margin:'0 auto 20px'}}>
            Add friends by phone number to see their streaks, savings & goals. Motivate each other to save more and build better habits!
          </div>
          <button className="btn-primary" style={{padding:'12px 24px', borderRadius:12, fontSize:14}} onClick={() => setShowAdd(true)}>
            <UserPlus size={16} style={{marginRight:6}}/> Add Your First Friend
          </button>
        </div>
      )}
    </div>
  )
}
