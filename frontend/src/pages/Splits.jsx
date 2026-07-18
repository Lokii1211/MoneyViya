// Splits — Track who owes you, send reminders
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { Users, Plus, Check, Clock, Send, Loader, ArrowUpRight, ArrowDownLeft, Minus, X } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import HapticButton from '../components/HapticButton'
import BottomSheet from '../components/BottomSheet'
import { useToast } from '../components/Toast'
import { api } from '../lib/supabase'
import { useApp } from '../lib/store'

export default function Splits() {
  const { phone } = useApp()
  const toast = useToast()
  const [lendings, setLendings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [settling, setSettling] = useState(null)
  const [friends, setFriends] = useState([]) // connected friends+family, [{name, phone}]

  // Split form state
  const [splitTitle, setSplitTitle] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitMode, setSplitMode] = useState('equal') // 'equal' | 'custom'
  const [members, setMembers] = useState([]) // [{key, name, shares, customAmount}]
  const [customName, setCustomName] = useState('')
  const [savingSplit, setSavingSplit] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadLendings()
    loadFriends()
  }, [phone])

  const loadLendings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getLendings(phone)
      setLendings(data || [])
    } catch (e) {
      console.error('Failed to load lendings:', e)
      setError('Failed to load split data')
      toast.show('Could not load splits', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      const [sent, received] = await Promise.all([
        api.getFamilyConnections(phone),
        api.getFamilyInvitesReceived(phone),
      ])
      const accepted = [
        ...(sent || []).filter(c => c.status === 'accepted'),
        ...(received || []).filter(c => c.status === 'accepted'),
      ]
      const withNames = await Promise.all(accepted.map(async c => {
        const otherPhone = c.member_phone === phone ? c.owner_phone : c.member_phone
        const u = await api.getUser(otherPhone)
        return { name: u?.name || otherPhone, phone: otherPhone }
      }))
      const seen = new Set()
      setFriends(withNames.filter(c => (seen.has(c.phone) ? false : (seen.add(c.phone), true))))
    } catch { setFriends([]) }
  }

  // Add/remove a member from the split (friend chip or free-typed name)
  const toggleFriend = (f) => {
    setMembers(prev => {
      const exists = prev.find(m => m.phone === f.phone)
      if (exists) return prev.filter(m => m.phone !== f.phone)
      return [...prev, { key: f.phone, name: f.name, phone: f.phone, shares: 1, customAmount: '' }]
    })
  }
  const addCustomMember = () => {
    const name = customName.trim()
    if (!name) return
    if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) { toast.show('Already added', 'error'); return }
    setMembers(prev => [...prev, { key: `custom-${Date.now()}`, name, shares: 1, customAmount: '' }])
    setCustomName('')
  }
  const removeMember = (key) => setMembers(prev => prev.filter(m => m.key !== key))
  const changeShares = (key, delta) => setMembers(prev => prev.map(m => m.key === key ? { ...m, shares: Math.max(1, Math.min(9, m.shares + delta)) } : m))
  const changeCustomAmount = (key, value) => setMembers(prev => prev.map(m => m.key === key ? { ...m, customAmount: value } : m))

  const totalShares = members.reduce((s, m) => s + m.shares, 0)
  const total = Number(splitAmount) || 0

  // Equal mode: proportional to shares (a 2x share pays double), with the
  // rounding remainder folded into the last member so amounts always sum
  // exactly to the bill total instead of being off by a few paise.
  const equalAmounts = {}
  if (splitMode === 'equal' && total > 0 && totalShares > 0) {
    let allocated = 0
    members.forEach((m, i) => {
      if (i === members.length - 1) {
        equalAmounts[m.key] = Math.round((total - allocated) * 100) / 100
      } else {
        const amt = Math.round((total * m.shares / totalShares) * 100) / 100
        equalAmounts[m.key] = amt
        allocated += amt
      }
    })
  }

  const customTotal = members.reduce((s, m) => s + (Number(m.customAmount) || 0), 0)
  const customRemaining = Math.round((total - customTotal) * 100) / 100

  const handleSettle = async (id) => {
    setSettling(id)
    try {
      await api.settleLending(id)
      setLendings(prev => prev.map(l => l.id === id ? { ...l, status: 'settled', settled_at: new Date().toISOString() } : l))
      toast.show('Settled successfully!', 'success')
    } catch (e) {
      toast.show('Failed to settle', 'error')
    } finally {
      setSettling(null)
    }
  }

  const handleCreateSplit = async () => {
    const title = splitTitle.trim()

    if (!title) { toast.show('Enter a title', 'error'); return }
    if (!total || total <= 0) { toast.show('Enter a valid amount', 'error'); return }
    if (members.length < 1) { toast.show('Add at least one person to split with', 'error'); return }
    if (splitMode === 'custom' && Math.abs(customRemaining) > 0.01) {
      toast.show(customRemaining > 0 ? `₹${customRemaining} still unassigned` : `₹${-customRemaining} over the total`, 'error')
      return
    }

    setSavingSplit(true)
    const amounts = splitMode === 'equal' ? equalAmounts : Object.fromEntries(members.map(m => [m.key, Number(m.customAmount) || 0]))

    try {
      const created = []
      for (const m of members) {
        const amt = amounts[m.key]
        if (!amt || amt <= 0) continue
        const result = await api.addLending({
          user_phone: phone,
          person_name: m.name,
          amount: amt,
          type: 'given',
          reason: `Split: ${title}${m.shares > 1 ? ` (${m.shares}x share)` : ''}`,
          status: 'pending',
        })
        if (result) created.push(result)
      }

      if (created.length > 0) {
        setLendings(prev => [...created, ...prev])
        toast.show(`Split created across ${created.length} ${created.length > 1 ? 'people' : 'person'}!`, 'success')
        setSplitTitle('')
        setSplitAmount('')
        setMembers([])
        setSplitMode('equal')
        setShowAdd(false)
      } else {
        toast.show('Failed to create split', 'error')
      }
    } catch (e) {
      console.error('Failed to create split:', e)
      toast.show('Failed to create split', 'error')
    } finally {
      setSavingSplit(false)
    }
  }

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  const activeLendings = lendings.filter(l => l.status !== 'settled')
  const settledLendings = lendings.filter(l => l.status === 'settled')

  const totalGiven = activeLendings
    .filter(l => l.type === 'given' || l.direction === 'given')
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  const totalTaken = activeLendings
    .filter(l => l.type === 'taken' || l.direction === 'taken')
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  return (
    <PageTransition>
      <div className="page" style={{ paddingTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24 }}>Split Bills</h1>
            <p className="body-s text-secondary">Track shared expenses</p>
          </div>
          <HapticButton size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New
          </HapticButton>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{
            padding: 16, textAlign: 'center', borderLeft: '3px solid var(--viya-success)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <ArrowUpRight size={14} color="var(--viya-success)" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>You gave</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-success)' }}>
              {loading ? '...' : formatCurrency(totalGiven)}
            </div>
          </div>
          <div className="card" style={{
            padding: 16, textAlign: 'center', borderLeft: '3px solid var(--viya-error)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <ArrowDownLeft size={14} color="var(--viya-error)" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>You took</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-error)' }}>
              {loading ? '...' : formatCurrency(totalTaken)}
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className="card" style={{
          padding: 20, marginBottom: 20, background: 'var(--gradient-night)',
          color: 'white', textAlign: 'center', borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Net Balance</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>
            {loading ? '...' : formatCurrency(Math.abs(totalGiven - totalTaken))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {totalGiven >= totalTaken ? 'Others owe you' : 'You owe others'}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--viya-primary-500)" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--viya-error)', marginBottom: 12 }}>{error}</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={loadLendings}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--viya-primary-500)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && lendings.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <Users size={32} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No splits yet</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Track money given or taken from friends</p>
          </div>
        )}

        {/* Active Lendings */}
        {!loading && !error && activeLendings.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Active</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {activeLendings.map((lending, i) => {
                const isGiven = lending.type === 'given' || lending.direction === 'given'
                return (
                  <motion.div key={lending.id} variants={listItem} initial="initial" animate="animate"
                    className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: isGiven ? '#4CAF5018' : '#F4433618',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isGiven ? <ArrowUpRight size={16} color="#4CAF50" /> : <ArrowDownLeft size={16} color="#F44336" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{lending.person_name || lending.contact_name || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {lending.reason || (isGiven ? 'You gave' : 'You took')}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isGiven ? 'var(--viya-success)' : 'var(--viya-error)' }}>
                          {isGiven ? '+' : '-'}{formatCurrency(lending.amount || 0)}
                        </div>
                        {lending.created_at && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {new Date(lending.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSettle(lending.id)}
                        disabled={settling === lending.id}
                        style={{
                          fontSize: 12, fontWeight: 600, color: 'white',
                          background: 'var(--viya-primary-500)', border: 'none', borderRadius: 8,
                          padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          opacity: settling === lending.id ? 0.6 : 1,
                        }}>
                        <Check size={12} /> {settling === lending.id ? 'Settling...' : 'Settle'}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* Settled Lendings */}
        {!loading && !error && settledLendings.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-tertiary)' }}>Settled</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settledLendings.slice(0, 5).map((lending, i) => {
                const isGiven = lending.type === 'given' || lending.direction === 'given'
                return (
                  <motion.div key={lending.id} variants={listItem} initial="initial" animate="animate"
                    className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                    <Check size={16} color="var(--viya-success)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{lending.person_name || lending.contact_name || 'Unknown'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)' }}>
                      {formatCurrency(lending.amount || 0)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="Split a Bill">
          <div className="entry-form" style={{ border: 'none', padding: 0 }}>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-input"
                type="text"
                value={splitTitle}
                onChange={e => setSplitTitle(e.target.value)}
                placeholder="e.g. Dinner at restaurant"
              />
            </div>

            <div className="form-group">
              <label>Total Amount</label>
              <input
                className="form-input"
                type="number"
                value={splitAmount}
                onChange={e => setSplitAmount(e.target.value)}
                placeholder="e.g. 2400"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Split with</label>
              {friends.length > 0 && (
                <div className="lending-contact-chips">
                  {friends.map(f => (
                    <button
                      key={f.phone}
                      type="button"
                      className={`lending-contact-chip${members.some(m => m.phone === f.phone) ? ' active' : ''}`}
                      onClick={() => toggleFriend(f)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomMember()}
                  placeholder="Or type a name and press Add"
                  style={{ flex: 1 }}
                />
                <HapticButton size="sm" onClick={addCustomMember}>Add</HapticButton>
              </div>
              {friends.length === 0 && (
                <p className="lending-contact-hint">Add friends in the Friends tab to pick them here instead of typing names each time.</p>
              )}
            </div>

            {members.length > 0 && (
              <>
                {/* Mode toggle */}
                <div className="split-mode-row">
                  <button type="button" className={`split-mode-btn${splitMode === 'equal' ? ' active' : ''}`} onClick={() => setSplitMode('equal')}>Equal / shares</button>
                  <button type="button" className={`split-mode-btn${splitMode === 'custom' ? ' active' : ''}`} onClick={() => setSplitMode('custom')}>Custom amounts</button>
                </div>

                <div className="split-members-list">
                  {members.map(m => (
                    <div key={m.key} className="split-member-row">
                      <span className="split-member-name">{m.name}</span>
                      {splitMode === 'equal' ? (
                        <div className="split-shares-stepper">
                          <button type="button" onClick={() => changeShares(m.key, -1)}><Minus size={12} /></button>
                          <span>{m.shares}x</span>
                          <button type="button" onClick={() => changeShares(m.key, 1)}><Plus size={12} /></button>
                          <span className="split-member-amount">{formatCurrency(equalAmounts[m.key] || 0)}</span>
                        </div>
                      ) : (
                        <input
                          className="form-input split-custom-input"
                          type="number"
                          placeholder="₹0"
                          value={m.customAmount}
                          onChange={e => changeCustomAmount(m.key, e.target.value)}
                        />
                      )}
                      <button type="button" className="split-member-remove" onClick={() => removeMember(m.key)}><X size={13} /></button>
                    </div>
                  ))}
                </div>

                {total > 0 && (
                  <div className="card" style={{
                    padding: 16, textAlign: 'center', marginBottom: 18,
                    background: 'var(--bg-secondary)', borderRadius: 14,
                  }}>
                    {splitMode === 'equal' ? (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Total split across {members.length} {members.length > 1 ? 'people' : 'person'}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-primary-500)' }}>{formatCurrency(total)}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{customRemaining === 0 ? 'Fully allocated ✓' : customRemaining > 0 ? 'Still unassigned' : 'Over the total'}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: customRemaining === 0 ? 'var(--viya-success)' : 'var(--viya-error)' }}>
                          {formatCurrency(Math.abs(customRemaining))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            <HapticButton fullWidth onClick={handleCreateSplit} disabled={savingSplit || !splitTitle.trim() || !total || members.length < 1 || (splitMode === 'custom' && Math.abs(customRemaining) > 0.01)}>
              {savingSplit ? 'Creating Split...' : 'Create Split'}
            </HapticButton>
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
