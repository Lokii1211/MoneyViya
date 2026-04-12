import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, Plus, Users, Trash2, TrendingUp, TrendingDown, Phone, Check, X, Send, UserPlus, Eye, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const RELATIONS = ['Spouse', 'Partner', 'Parent', 'Child', 'Sibling', 'Friend', 'Other']
const RELATION_ICONS = { Spouse: '💑', Partner: '❤️', Parent: '👨‍👩‍👧', Child: '👶', Sibling: '🧑‍🤝‍🧑', Friend: '🤝', Other: '👤' }

export default function Family() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRelation, setInviteRelation] = useState('Spouse')
  const [toast, setToast] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberData, setMemberData] = useState(null)

  // Load family data
  useEffect(() => {
    if (phone) loadAll()
  }, [phone])

  const loadAll = async () => {
    // Load accepted connections (I sent or they sent, both accepted)
    const sent = await api.getFamilyConnections(phone)
    const received = await api.getFamilyInvitesReceived(phone)
    
    // Accepted members
    const acceptedSent = (sent || []).filter(c => c.status === 'accepted')
    const acceptedReceived = (received || []).filter(c => c.status === 'accepted')
    
    // Build member list — each connection has the OTHER person's data
    const membersList = []
    for (const c of acceptedSent) {
      const u = await api.getUser(c.member_phone)
      if (u) membersList.push({ ...c, name: u.name || c.member_phone, phone: c.member_phone, userData: u, icon: RELATION_ICONS[c.relation] || '👤' })
    }
    for (const c of acceptedReceived) {
      const u = await api.getUser(c.owner_phone)
      if (u) membersList.push({ ...c, name: u.name || c.owner_phone, phone: c.owner_phone, userData: u, icon: RELATION_ICONS[c.relation] || '👤', relation: c.relation })
    }
    setMembers(membersList)
    
    // Pending invites I sent
    const pendingSent = (sent || []).filter(c => c.status === 'pending')
    setInvitations(pendingSent)
    
    // Pending invites I received
    const pendingReceived = (received || []).filter(c => c.status === 'pending')
    setPendingInvites(pendingReceived)
  }

  const sendInvite = async () => {
    const cleanPhone = invitePhone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10)
    if (cleanPhone.length !== 10) { showToast('❌ Enter valid 10-digit number'); return }
    if (cleanPhone === phone) { showToast('❌ You can\'t invite yourself!'); return }
    if (members.length >= 4) { showToast('❌ Maximum 4 family members!'); return }
    
    // Check if user exists
    const target = await api.getUser(cleanPhone)
    if (!target) { showToast('❌ This number is not on Viya yet. Ask them to join!'); return }
    
    // Check existing connection
    const existing = await api.getFamilyConnections(phone)
    if ((existing || []).some(c => c.member_phone === cleanPhone)) { showToast('❌ Already connected or invited!'); return }
    
    // Send invitation
    await api.sendFamilyInvite(phone, cleanPhone, inviteRelation)
    showToast(`✅ Invitation sent to ${target.name || cleanPhone}! 📩`)
    setInvitePhone(''); setShowInvite(false)
    loadAll()
  }

  const acceptInvite = async (invite) => {
    await api.respondFamilyInvite(invite.id, 'accepted')
    showToast(`✅ Connected with ${invite.owner_phone}! You can now see each other's finances.`)
    loadAll()
  }

  const rejectInvite = async (invite) => {
    await api.respondFamilyInvite(invite.id, 'rejected')
    showToast('Invitation declined')
    loadAll()
  }

  const removeMember = async (connection) => {
    if (!confirm(`Remove ${connection.name} from family?`)) return
    await api.removeFamilyConnection(connection.id)
    showToast('Member removed')
    setSelectedMember(null); setMemberData(null)
    loadAll()
  }

  const viewMemberFinances = async (member) => {
    setSelectedMember(member)
    const txns = await api.getTransactions(member.phone, 20)
    const goals = await api.getGoals(member.phone)
    setMemberData({ transactions: txns || [], goals: goals || [], ...member.userData })
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const totalFamilyIncome = members.reduce((s, m) => s + Number(m.userData?.monthly_income || 0), 0)
  const totalFamilyExpense = members.reduce((s, m) => s + Number(m.userData?.monthly_expenses || 0), 0)

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Family Mode</h2>
        </div>
        {members.length < 4 && (
          <button className="btn-primary" style={{padding:'8px 14px', fontSize:12, borderRadius:10}} onClick={() => setShowInvite(!showInvite)}>
            <UserPlus size={14} style={{marginRight:4}}/> Invite
          </button>
        )}
      </div>

      {/* Family Summary */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--violet-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:20, marginBottom:16, textAlign:'center'}}>
        <div style={{fontSize:32, marginBottom:4}}>👨‍👩‍👧‍👦</div>
        <div style={{fontSize:11, letterSpacing:2, fontWeight:700, color:'var(--text3)'}}>FAMILY OVERVIEW</div>
        <div style={{display:'flex', justifyContent:'space-around', marginTop:12}}>
          <div>
            <div style={{fontFamily:'var(--mono)', fontSize:18, fontWeight:800, color:'var(--primary)'}}>₹{totalFamilyIncome.toLocaleString('en-IN')}</div>
            <div style={{fontSize:10, color:'var(--text3)'}}>TOTAL INCOME</div>
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)', fontSize:18, fontWeight:800, color:'var(--red)'}}>₹{totalFamilyExpense.toLocaleString('en-IN')}</div>
            <div style={{fontSize:10, color:'var(--text3)'}}>TOTAL SPENT</div>
          </div>
          <div>
            <div style={{fontFamily:'var(--mono)', fontSize:18, fontWeight:800, color:'var(--gold)'}}>{members.length + 1}</div>
            <div style={{fontSize:10, color:'var(--text3)'}}>MEMBERS</div>
          </div>
        </div>
      </div>

      {/* 📩 Pending Invitations Received */}
      {pendingInvites.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:0.5, marginBottom:8}}>📩 PENDING INVITATIONS</div>
          {pendingInvites.map(inv => (
            <div key={inv.id} style={{background:'var(--gold-dim, rgba(255,215,0,0.08))', border:'1px solid rgba(255,215,0,0.3)', borderRadius:12, padding:14, marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, marginBottom:4}}>
                {inv.owner_phone} wants to connect as <strong>{inv.relation}</strong>
              </div>
              <div style={{fontSize:11, color:'var(--text3)', marginBottom:10}}>
                If you accept, both of you can see each other's income & expenses.
              </div>
              <div style={{display:'flex', gap:8}}>
                <button style={{flex:1, padding:'8px', borderRadius:8, background:'var(--primary)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={() => acceptInvite(inv)}>
                  <Check size={14}/> Accept
                </button>
                <button style={{flex:1, padding:'8px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={() => rejectInvite(inv)}>
                  <X size={14}/> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite by Phone Number */}
      {showInvite && (
        <div style={{background:'var(--surface)', border:'2px solid var(--primary)', borderRadius:14, padding:16, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
            <Phone size={18} color="var(--primary)"/>
            <div>
              <div style={{fontSize:14, fontWeight:800}}>Invite by Phone Number</div>
              <div style={{fontSize:11, color:'var(--text3)'}}>They must be on Viya. Both can see each other's finances.</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, marginBottom:10}}>
            <div style={{flex:1, display:'flex', alignItems:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'0 12px'}}>
              <span style={{fontSize:13, color:'var(--text3)', marginRight:4}}>+91</span>
              <input type="tel" maxLength={10} value={invitePhone} onChange={e => setInvitePhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone number" style={{flex:1, padding:'12px 0', border:'none', background:'none', fontSize:14, color:'var(--text)', fontFamily:'var(--mono)', outline:'none'}}/>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11, color:'var(--text3)', marginBottom:4}}>Relationship</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {RELATIONS.map(r => (
                <button key={r} onClick={() => setInviteRelation(r)} style={{padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, border: inviteRelation === r ? '2px solid var(--primary)' : '1px solid var(--border)', background: inviteRelation === r ? 'var(--primary-dim)' : 'var(--bg)', color: inviteRelation === r ? 'var(--primary)' : 'var(--text2)', cursor:'pointer'}}>
                  {RELATION_ICONS[r]} {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{flex:1, padding:10, borderRadius:10, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={() => setShowInvite(false)}>Cancel</button>
            <button className="btn-primary" style={{flex:2, padding:10, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', gap:4}} onClick={sendInvite} disabled={invitePhone.length !== 10}>
              <Send size={14}/> Send Invitation
            </button>
          </div>
        </div>
      )}

      {/* Pending Invites I Sent */}
      {invitations.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>⏳ SENT INVITATIONS</div>
          {invitations.map(inv => (
            <div key={inv.id} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:12, marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:13, fontWeight:700}}>{RELATION_ICONS[inv.relation]} {inv.member_phone}</div>
                <div style={{fontSize:11, color:'var(--text3)'}}>Waiting for them to accept...</div>
              </div>
              <div style={{fontSize:20}}>⏳</div>
            </div>
          ))}
        </div>
      )}

      {/* You (owner card) */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>👤 YOUR FINANCES</div>
        <div style={{background:'var(--primary-dim)', border:'1px solid var(--primary)', borderRadius:14, padding:14, marginBottom:10}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontSize:24}}>{localStorage.getItem('mv_avatar') || '😎'}</span>
              <div>
                <div style={{fontSize:14, fontWeight:700}}>You ({user?.name || 'Me'})</div>
                <div style={{fontSize:11, color:'var(--text3)'}}>Owner</div>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'var(--mono)', fontSize:14, fontWeight:800, color:'var(--primary)'}}>₹{Number(user?.monthly_income || 0).toLocaleString('en-IN')}</div>
              <div style={{fontFamily:'var(--mono)', fontSize:12, color:'var(--red)'}}>-₹{Number(user?.monthly_expenses || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Members */}
      {members.length > 0 && (
        <div>
          <div style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:0.5, marginBottom:8}}>👨‍👩‍👧‍👦 FAMILY MEMBERS</div>
          {members.map(m => (
            <div key={m.id} style={{background:'var(--surface)', border: selectedMember?.id === m.id ? '2px solid var(--primary)' : '1px solid var(--border2)', borderRadius:14, padding:14, marginBottom:10, cursor:'pointer'}} onClick={() => viewMemberFinances(m)}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{fontSize:24}}>{m.icon}</span>
                  <div>
                    <div style={{fontSize:14, fontWeight:700}}>{m.name}</div>
                    <div style={{fontSize:11, color:'var(--text3)'}}>{m.relation} · {m.phone}</div>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'var(--mono)', fontSize:14, fontWeight:800, color:'var(--primary)'}}>₹{Number(m.userData?.monthly_income || 0).toLocaleString('en-IN')}</div>
                    <div style={{fontFamily:'var(--mono)', fontSize:11, color:'var(--red)'}}>-₹{Number(m.userData?.monthly_expenses || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4}} onClick={(e) => { e.stopPropagation(); removeMember(m) }}><Trash2 size={14}/></button>
                </div>
              </div>
              <div style={{fontSize:11, color:'var(--primary)', marginTop:6, display:'flex', alignItems:'center', gap:4}}>
                <Eye size={12}/> Tap to view their transactions & goals
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Finance Details */}
      {selectedMember && memberData && (
        <div style={{background:'var(--surface)', border:'2px solid var(--violet)', borderRadius:16, padding:16, marginBottom:16, animation:'slideUp 0.3s var(--ease)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{fontSize:14, fontWeight:800}}>{selectedMember.icon} {selectedMember.name}'s Finances</div>
            <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text3)'}} onClick={() => { setSelectedMember(null); setMemberData(null) }}><X size={18}/></button>
          </div>
          
          {/* Income/Expense Summary */}
          <div style={{display:'flex', gap:10, marginBottom:12}}>
            <div style={{flex:1, background:'var(--primary-dim)', borderRadius:10, padding:12, textAlign:'center'}}>
              <TrendingUp size={16} color="var(--primary)"/>
              <div style={{fontFamily:'var(--mono)', fontSize:16, fontWeight:800, color:'var(--primary)'}}>₹{Number(memberData.monthly_income || 0).toLocaleString('en-IN')}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>Income</div>
            </div>
            <div style={{flex:1, background:'var(--red-dim)', borderRadius:10, padding:12, textAlign:'center'}}>
              <TrendingDown size={16} color="var(--red)"/>
              <div style={{fontFamily:'var(--mono)', fontSize:16, fontWeight:800, color:'var(--red)'}}>₹{Number(memberData.monthly_expenses || 0).toLocaleString('en-IN')}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>Expenses</div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={{fontSize:12, fontWeight:700, marginBottom:6}}>Recent Transactions</div>
          {(memberData.transactions || []).length === 0 ? (
            <div style={{textAlign:'center', padding:16, fontSize:12, color:'var(--text3)'}}>No transactions yet</div>
          ) : (memberData.transactions || []).slice(0, 8).map((t, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <span style={{fontSize:14}}>{t.category?.split(' ')[0] || '🛒'}</span>
                <span style={{fontSize:12}}>{t.description || t.category?.split(' ').slice(1).join(' ') || t.category}</span>
              </div>
              <span style={{fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color: t.type === 'income' ? 'var(--primary)' : 'var(--red)'}}>
                {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          {/* Goals */}
          {(memberData.goals || []).length > 0 && (
            <>
              <div style={{fontSize:12, fontWeight:700, marginTop:12, marginBottom:6}}>Goals</div>
              {(memberData.goals || []).map((g, i) => {
                const pct = g.target_amount > 0 ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100) : 0
                return (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0'}}>
                    <span style={{fontSize:16}}>{g.icon || '🎯'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12, fontWeight:600}}>{g.name}</div>
                      <div className="progress-bar" style={{height:4}}><div className="progress-fill" style={{width: pct + '%'}}/></div>
                    </div>
                    <span style={{fontSize:11, fontWeight:800, color:'var(--primary)'}}>{pct}%</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && invitations.length === 0 && pendingInvites.length === 0 && !showInvite && (
        <div style={{textAlign:'center', padding:'40px 20px'}}>
          <Users size={48} style={{color:'var(--text3)', marginBottom:12}} />
          <div style={{fontSize:15, fontWeight:700, marginBottom:4}}>Connect with Family</div>
          <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.5, marginBottom:16}}>
            Invite your spouse, partner, or family by their phone number.
            Once they accept, both of you can see each other's income, expenses, and goals — perfect for couples and families! 💑
          </div>
          <button className="btn-primary" style={{padding:'12px 24px', borderRadius:10}} onClick={() => setShowInvite(true)}>
            <UserPlus size={16} style={{marginRight:6}}/> Invite Family Member
          </button>
        </div>
      )}
    </div>
  )
}
