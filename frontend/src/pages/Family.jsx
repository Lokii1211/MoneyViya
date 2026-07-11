import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { ArrowLeft, UserPlus, Phone, Send, Check, X, Trash2, TrendingUp, TrendingDown, Eye, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/utils'

const RELATIONS = ['Spouse', 'Partner', 'Parent', 'Child', 'Sibling', 'Friend', 'Other']
const ICONS = { Spouse: '💑', Partner: '❤️', Parent: '👨‍👩‍👧', Child: '👶', Sibling: '🧑‍🤝‍🧑', Friend: '🤝', Other: '👤' }

export default function Family() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [sentInvites, setSentInvites] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRelation, setInviteRelation] = useState('Spouse')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [selData, setSelData] = useState(null)

  useEffect(() => { if (phone) loadAll() }, [phone])

  const loadAll = async () => {
    setLoading(true)
    try {
      const sent = await api.getFamilyConnections(phone)
      const received = await api.getFamilyInvitesReceived(phone)
      const list = []
      for (const c of (sent || []).filter(c => c.status === 'accepted')) {
        const u = await api.getUser(c.member_phone)
        if (u) list.push({ ...c, name: u.name || c.member_phone, phone: c.member_phone, userData: u, icon: ICONS[c.relation] || '👤' })
      }
      for (const c of (received || []).filter(c => c.status === 'accepted')) {
        const u = await api.getUser(c.owner_phone)
        if (u) list.push({ ...c, name: u.name || c.owner_phone, phone: c.owner_phone, userData: u, icon: ICONS[c.relation] || '👤' })
      }
      setMembers(list)
      setSentInvites((sent || []).filter(c => c.status === 'pending'))
      setPendingInvites((received || []).filter(c => c.status === 'pending'))
    } catch (e) { console.error('Family load error', e) }
    setLoading(false)
  }

  const sendInvite = async () => {
    const clean = invitePhone.replace(/[^\d]/g, '').replace(/^91/, '').slice(-10)
    if (clean.length !== 10) return flash('Enter valid 10-digit number')
    if (clean === phone) return flash("You can't invite yourself!")
    if (members.length >= 4) return flash('Maximum 4 family members!')
    const target = await api.getUser(clean)
    if (!target) return flash('This number is not on Viya yet')
    const existing = await api.getFamilyConnections(phone)
    if ((existing || []).some(c => c.member_phone === clean)) return flash('Already connected or invited!')
    const ok = await api.sendFamilyInvite(phone, clean, inviteRelation)
    if (!ok) return flash('Could not send invite — check your connection and try again')
    flash(`Invitation sent to ${target.name || clean}!`)
    setInvitePhone(''); setShowInvite(false); loadAll()
  }

  const acceptInvite = async (inv) => {
    const ok = await api.respondFamilyInvite(inv.id, 'accepted')
    if (!ok) return flash('Could not accept invite — try again')
    flash(`Connected with ${inv.owner_phone}!`); loadAll()
  }
  const rejectInvite = async (inv) => {
    const ok = await api.respondFamilyInvite(inv.id, 'rejected')
    if (!ok) return flash('Could not decline invite — try again')
    flash('Invitation declined'); loadAll()
  }
  const removeMember = async (c) => {
    if (!confirm(`Remove ${c.name} from family?`)) return
    const ok = await api.removeFamilyConnection(c.id)
    if (!ok) return flash('Could not remove member — try again')
    flash('Member removed'); setSel(null); setSelData(null); loadAll()
  }
  const viewMember = async (m) => {
    setSel(m)
    const [txns, goals] = await Promise.all([api.getTransactions(m.phone, 20), api.getGoals(m.phone)])
    setSelData({ transactions: txns || [], goals: goals || [], ...m.userData })
  }
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const totalIncome = members.reduce((s, m) => s + Number(m.userData?.monthly_income || 0), 0)
  const totalExpense = members.reduce((s, m) => s + Number(m.userData?.monthly_expenses || 0), 0)

  if (loading) return (
    <div className="page">
      <div className="page-header"><div className="skeleton" style={{width:140,height:24}} /></div>
      <div className="skeleton" style={{height:100,borderRadius:16,marginBottom:16}} />
      <div className="tab-bar"><div className="skeleton" style={{flex:1,height:36}} /><div className="skeleton" style={{flex:1,height:36}} /></div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:72,borderRadius:14,marginBottom:10}} />)}
    </div>
  )

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div className="info-row" style={{border:0,padding:0,background:'none'}}>
          <button className="add-btn" onClick={() => nav(-1)}><ArrowLeft size={18}/></button>
          <div className="info-body"><div className="info-title">Family Mode</div><div className="info-sub">{members.length + 1} members</div></div>
        </div>
        {members.length < 4 && <button className="btn-primary" onClick={() => setShowInvite(!showInvite)}><UserPlus size={14}/> Invite</button>}
      </div>

      <div className="stat-grid">
        <div className="stat-card"><TrendingUp size={16} className="stat-icon green" /><div className="stat-label">Family Income</div><div className="stat-value green">{formatINR(totalIncome)}</div></div>
        <div className="stat-card"><TrendingDown size={16} className="stat-icon red" /><div className="stat-label">Family Spent</div><div className="stat-value red">{formatINR(totalExpense)}</div></div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members</button>
        <button className={`tab-btn ${tab === 'invites' ? 'active' : ''}`} onClick={() => setTab('invites')}>Invites{pendingInvites.length > 0 ? ` (${pendingInvites.length})` : ''}</button>
      </div>

      {showInvite && (
        <div className="entry-form" style={{marginBottom:16}}>
          <div className="info-row" style={{border:0,padding:0,marginBottom:12,background:'none'}}>
            <div className="info-icon green"><Phone size={16}/></div>
            <div className="info-body"><div className="info-title">Invite by Phone</div><div className="info-sub">They must be on Viya. Both can see finances.</div></div>
          </div>
          <div className="form-group"><label>Phone Number</label>
            <input className="form-input" type="tel" maxLength={10} value={invitePhone} onChange={e => setInvitePhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" />
          </div>
          <div className="form-group"><label>Relationship</label>
            <div className="pill-bar">{RELATIONS.map(r => <button key={r} className={`pill-btn ${inviteRelation === r ? 'active' : ''}`} onClick={() => setInviteRelation(r)}>{ICONS[r]} {r}</button>)}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-secondary" style={{flex:1}} onClick={() => setShowInvite(false)}>Cancel</button>
            <button className="btn-primary" style={{flex:2}} onClick={sendInvite} disabled={invitePhone.length !== 10}><Send size={14}/> Send</button>
          </div>
        </div>
      )}

      {tab === 'members' && <>
        <div className="card" style={{borderColor:'var(--primary)',marginBottom:10}}>
          <div className="info-row" style={{border:0,padding:0,background:'none'}}>
            <span className="info-icon">
              {localStorage.getItem('mv_avatar')?.startsWith('data:image')
                ? <img src={localStorage.getItem('mv_avatar')} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '50%' }} />
                : localStorage.getItem('mv_avatar') || '😎'}
            </span>
            <div className="info-body"><div className="info-title">You ({user?.name || 'Me'})</div><div className="info-sub">Owner</div></div>
            <div className="info-value green">{formatINR(Number(user?.monthly_income || 0))}</div>
          </div>
        </div>

        {members.length === 0 && !showInvite ? (
          <div className="empty-state-card">
            <div className="empty-emoji"><Users size={48} /></div>
            <h3>Connect with Family</h3>
            <p>Invite your spouse, partner, or family. Once accepted, both can see income, expenses, and goals.</p>
            <button className="btn-primary" onClick={() => setShowInvite(true)}><UserPlus size={16}/> Invite Family Member</button>
          </div>
        ) : members.map(m => (
          <div key={m.id} className="card card-press" style={{marginBottom:10,cursor:'pointer',borderColor:sel?.id === m.id ? 'var(--primary)' : undefined}} onClick={() => viewMember(m)}>
            <div className="info-row" style={{border:0,padding:0,background:'none'}}>
              <span className="info-icon">{m.icon}</span>
              <div className="info-body"><div className="info-title">{m.name}</div><div className="info-sub">{m.relation} &middot; {m.phone}</div></div>
              <div className="info-value green">{formatINR(Number(m.userData?.monthly_income || 0))}</div>
              <button className="add-btn" onClick={e => { e.stopPropagation(); removeMember(m) }}><Trash2 size={14}/></button>
            </div>
            <div className="info-sub" style={{marginTop:6,color:'var(--primary)'}}><Eye size={12}/> Tap to view finances</div>
          </div>
        ))}

        {sel && selData && (
          <div className="card" style={{borderColor:'var(--violet)',marginTop:8}}>
            <div className="info-row" style={{border:0,padding:0,marginBottom:12,background:'none'}}>
              <div className="info-body"><div className="info-title">{sel.icon} {sel.name}'s Finances</div></div>
              <button className="add-btn" onClick={() => { setSel(null); setSelData(null) }}><X size={16}/></button>
            </div>
            <div className="stat-grid">
              <div className="stat-card"><TrendingUp size={16} className="stat-icon green" /><div className="stat-label">Income</div><div className="stat-value green">{formatINR(Number(selData.monthly_income || 0))}</div></div>
              <div className="stat-card"><TrendingDown size={16} className="stat-icon red" /><div className="stat-label">Expenses</div><div className="stat-value red">{formatINR(Number(selData.monthly_expenses || 0))}</div></div>
            </div>
            <div className="info-title" style={{marginBottom:6}}>Recent Transactions</div>
            {(selData.transactions || []).length === 0
              ? <div className="info-sub" style={{textAlign:'center',padding:16}}>No transactions yet</div>
              : (selData.transactions || []).slice(0, 8).map((t, i) => (
                <div key={i} className="info-row">
                  <span>{t.category?.split(' ')[0] || '🛒'}</span>
                  <div className="info-body"><div className="info-title">{t.description || t.category}</div></div>
                  <span className={`info-value ${t.type === 'income' ? 'green' : 'red'}`}>{t.type === 'income' ? '+' : '-'}{formatINR(Number(t.amount))}</span>
                </div>
            ))}
            {(selData.goals || []).length > 0 && <>
              <div className="info-title" style={{marginTop:12,marginBottom:6}}>Goals</div>
              {(selData.goals || []).map((g, i) => {
                const pct = g.target_amount > 0 ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100) : 0
                return <div key={i} className="info-row">
                  <span>{g.icon || '🎯'}</span>
                  <div className="info-body"><div className="info-title">{g.name}</div><div className="progress-bar" style={{height:4}}><div className="progress-fill" style={{width:pct+'%'}}/></div></div>
                  <span className="info-value green">{pct}%</span>
                </div>
              })}
            </>}
          </div>
        )}
      </>}

      {tab === 'invites' && <>
        {pendingInvites.length > 0 && <section>
          <div className="info-sub" style={{fontWeight:700,marginBottom:8}}>RECEIVED</div>
          {pendingInvites.map(inv => (
            <div key={inv.id} className="card" style={{marginBottom:8,borderColor:'var(--gold)'}}>
              <div className="info-row" style={{border:0,padding:0,marginBottom:8,background:'none'}}>
                <div className="info-body"><div className="info-title">{inv.owner_phone}</div><div className="info-sub">Wants to connect as {inv.relation}</div></div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-primary" style={{flex:1}} onClick={() => acceptInvite(inv)}><Check size={14}/> Accept</button>
                <button className="btn-secondary" style={{flex:1}} onClick={() => rejectInvite(inv)}><X size={14}/> Decline</button>
              </div>
            </div>
          ))}
        </section>}
        {sentInvites.length > 0 && <section>
          <div className="info-sub" style={{fontWeight:700,marginBottom:8,marginTop:16}}>SENT</div>
          {sentInvites.map(inv => (
            <div key={inv.id} className="info-row">
              <span>{ICONS[inv.relation] || '👤'}</span>
              <div className="info-body"><div className="info-title">{inv.member_phone}</div><div className="info-sub">Waiting for them to accept...</div></div>
              <span>⏳</span>
            </div>
          ))}
        </section>}
        {pendingInvites.length === 0 && sentInvites.length === 0 && (
          <div className="empty-state-card"><div className="empty-emoji">📩</div><h3>No Invitations</h3><p>Invitations you send or receive will appear here.</p></div>
        )}
      </>}
    </div>
  )
}
