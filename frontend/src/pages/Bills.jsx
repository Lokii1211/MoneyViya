import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { formatINR } from '../lib/utils'
import { CreditCard, Zap, Wifi, Phone, Home, ShieldCheck, Calendar, AlertTriangle, CheckCircle, Clock, ChevronRight, Plus, TrendingUp } from 'lucide-react'

const BILL_ICONS = {
  credit_card: { icon: <CreditCard size={18}/>, color: '#E91E63', emoji: '💳' },
  electricity: { icon: <Zap size={18}/>, color: '#FF9800', emoji: '⚡' },
  internet: { icon: <Wifi size={18}/>, color: '#0091FF', emoji: '🌐' },
  phone: { icon: <Phone size={18}/>, color: '#4CAF50', emoji: '📱' },
  rent: { icon: <Home size={18}/>, color: '#9C27B0', emoji: '🏠' },
  insurance: { icon: <ShieldCheck size={18}/>, color: '#00BCD4', emoji: '🛡️' },
  emi: { icon: <TrendingUp size={18}/>, color: '#5514FF', emoji: '🏦' },
  subscription: { icon: <Calendar size={18}/>, color: '#6422CC', emoji: '📺' },
}

function getBillStyle(bill) {
  const config = BILL_ICONS[bill.bill_type || bill.type] || BILL_ICONS.credit_card
  const daysLeft = bill._daysLeft
  if (bill.status === 'overdue' || daysLeft < 0) return { ...config, statusColor: 'var(--viya-error)', statusBg: 'var(--viya-error-light)', statusText: 'Overdue' }
  if (daysLeft <= 3) return { ...config, statusColor: 'var(--viya-warning)', statusBg: 'var(--viya-warning-light)', statusText: `Due in ${daysLeft}d` }
  if (bill.status === 'paid') return { ...config, statusColor: 'var(--viya-success)', statusBg: 'var(--viya-success-light)', statusText: 'Paid' }
  return { ...config, statusColor: 'var(--text-secondary)', statusBg: 'var(--bg-secondary)', statusText: `Due in ${daysLeft}d` }
}

function enrichBill(bill) {
  // Compute daysLeft from due_date
  const dueDate = bill.due_date ? new Date(bill.due_date) : null
  const today = new Date()
  today.setHours(0,0,0,0)
  const daysLeft = dueDate ? Math.ceil((dueDate - today) / 86400000) : 999
  // Auto-set overdue
  const status = daysLeft < 0 && bill.status !== 'paid' ? 'overdue' : bill.status
  return { ...bill, _daysLeft: daysLeft, status, type: bill.bill_type }
}

export default function Bills() {
  const { phone } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBills = useCallback(async () => {
    if (!phone) return
    setLoading(true)
    try {
      const data = await api.getBills(phone)
      if (data?.length) setBills(data.map(enrichBill))
    } catch (e) { console.error('Bills load error:', e) }
    setLoading(false)
  }, [phone])

  useEffect(() => { loadBills() }, [loadBills])

  const handleMarkPaid = async (bill) => {
    await api.markBillPaid(bill.id)
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b))
  }

  const overdue = bills.filter(b => b.status === 'overdue')
  const urgent = bills.filter(b => b.status === 'pending' && b._daysLeft <= 3 && b._daysLeft >= 0)
  const upcoming = bills.filter(b => b.status === 'pending' && b._daysLeft > 3)
  const subscriptions = bills.filter(b => b.bill_type === 'subscription' || b.type === 'subscription')
  const emis = bills.filter(b => b.bill_type === 'emi' || b.type === 'emi')
  const totalPending = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + Number(b.amount || 0), 0)
  const totalSubs = subscriptions.reduce((s, sub) => s + Number(sub.amount || 0), 0)

  const tabs = [
    { id: 'upcoming', label: 'Bills' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'emi', label: 'EMIs' },
  ]

  // Empty state
  const isEmpty = bills.length === 0 && !loading

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: -0.3 }}>Bills & Payments</h1>
          <p className="body-s text-secondary">Never miss a due date 🎯</p>
        </div>
        <button onClick={() => nav('/chat?q=add+bill')} style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-teal)',
        }}><Plus size={18}/></button>
      </div>

      {/* Total Pending Card */}
      <div style={{
        background: 'var(--gradient-night)', borderRadius: 'var(--radius-2xl)', padding: 20,
        marginBottom: 16, color: 'white', boxShadow: '0 8px 32px rgba(13,0,32,0.4)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Pending</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 36, marginBottom: 8 }}>
          ₹{totalPending}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          {overdue.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--coral-200)' }}>
              <AlertTriangle size={12}/> {overdue.length} overdue
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
            <Clock size={12}/> {urgent.length} due this week
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
            <Calendar size={12}/> {upcoming.length} upcoming
          </span>
        </div>
      </div>

      {isEmpty && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No bills tracked yet</div>
          <div style={{ fontSize: 13 }}>Tell Viya: "Track my electricity bill" or "Add credit card due date"</div>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
                transition: 'all 0.2s', cursor: 'pointer', border: 'none',
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'upcoming' && (
            <>
              {/* Overdue */}
              {overdue.length > 0 && (
                <div style={{ marginBottom: 12, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--coral-50)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--viya-error)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>⚠️ Overdue</div>
                  {overdue.map(bill => {
                    const style = getBillStyle(bill)
                    return (
                      <div key={bill.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                        borderRadius: 'var(--radius-lg)', background: 'var(--viya-error-light)',
                        border: '1px solid rgba(255,59,48,0.15)', cursor: 'pointer',
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: style.color + '15', color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{style.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{bill.name}</div>
                          <div className="body-s" style={{ color: 'var(--viya-error)' }}>Overdue by {Math.abs(bill._daysLeft)} days</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num-s" style={{ fontWeight: 700, color: 'var(--viya-error)' }}>₹{Number(bill.amount)}</div>
                          <button onClick={() => handleMarkPaid(bill)} style={{
                            marginTop: 4, padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600,
                            background: 'var(--viya-error)', color: 'white', border: 'none', cursor: 'pointer',
                          }}>Pay Now</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Urgent */}
              {urgent.length > 0 && (
                <div style={{ marginBottom: 12, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--amber-50)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--viya-warning)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>⏰ Due This Week</div>
                  {urgent.map(bill => {
                    const style = getBillStyle(bill)
                    return (
                      <div key={bill.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                        borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
                        border: '1px solid var(--viya-warning)30', cursor: 'pointer',
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: style.color + '15', color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{style.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{bill.name}</div>
                          <div className="body-s text-secondary">Due in {bill._daysLeft} day{bill._daysLeft !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num-s" style={{ fontWeight: 700 }}>₹{Number(bill.amount)}</div>
                          {bill.auto_debit && <span style={{ fontSize: 10, color: 'var(--viya-success)', fontWeight: 600 }}>Auto-debit</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Upcoming */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>📅 Upcoming</div>
                {upcoming.length === 0 && overdue.length === 0 && urgent.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>All clear! No upcoming bills 🎉</div>
                )}
                {upcoming.map(bill => {
                  const style = getBillStyle(bill)
                  return (
                    <div key={bill.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                      borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: style.color + '15', color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{style.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{bill.name}</div>
                        <div className="body-s text-secondary">Due in {bill._daysLeft} days</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="num-s" style={{ fontWeight: 600 }}>₹{Number(bill.amount)}</div>
                        {bill.auto_debit && <span style={{ fontSize: 10, color: 'var(--viya-success)', fontWeight: 600 }}>Auto</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {tab === 'subscriptions' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                background: 'var(--cosmos-50)', borderRadius: 'var(--radius-lg)', padding: 16,
                border: '1px solid var(--cosmos-200)', marginBottom: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--viya-violet-500)', marginBottom: 4 }}>Monthly Subscriptions</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 28, color: 'var(--viya-violet-600)' }}>
                  ₹{totalSubs}/mo
                </div>
                <div className="body-s text-secondary" style={{ marginTop: 4 }}>₹{(totalSubs * 12)}/year</div>
              </div>
              {subscriptions.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>No subscriptions tracked. Tell Viya: "Track Netflix subscription" 📺</div>
              )}
              {subscriptions.map((sub, i) => (
                <div key={sub.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                  borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                }}>
                  <span style={{ fontSize: 24 }}>📺</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{sub.name}</div>
                    <div className="body-s text-secondary">{sub.frequency || 'monthly'}</div>
                  </div>
                  <div className="num-s" style={{ fontWeight: 600 }}>₹{Number(sub.amount)}/mo</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'emi' && (
            <div style={{ marginBottom: 16 }}>
              {emis.map(bill => (
                <div key={bill.id} style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 20,
                  border: '1px solid var(--border-light)', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cosmos-50)', color: 'var(--cosmos-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{bill.name}</div>
                      <div className="body-s text-secondary">Next due: {bill.due_date || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div><div className="body-s text-secondary">EMI Amount</div><div className="num-s" style={{ fontWeight: 700 }}>₹{Number(bill.amount)}</div></div>
                    <div style={{ textAlign: 'right' }}><div className="body-s text-secondary">Status</div><div className="num-s" style={{ fontWeight: 700, color: bill.status === 'paid' ? 'var(--viya-success)' : 'var(--viya-warning)' }}>{bill.status}</div></div>
                  </div>
                </div>
              ))}
              {emis.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                  No EMIs tracked yet. Say "Track my car loan EMI" to Viya! 🚗
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
