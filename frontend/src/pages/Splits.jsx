// Splits — Track who owes you, send reminders
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { listItem } from '../animations/pageVariants'
import { Users, Plus, Check, Clock, Send, Loader, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
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

  // Split form state
  const [splitTitle, setSplitTitle] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitPeople, setSplitPeople] = useState('')
  const [savingSplit, setSavingSplit] = useState(false)

  useEffect(() => {
    if (!phone) return
    loadLendings()
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
    const total = Number(splitAmount)
    const people = Math.floor(Number(splitPeople))

    if (!title) { toast.show('Enter a title', 'error'); return }
    if (!total || total <= 0) { toast.show('Enter a valid amount', 'error'); return }
    if (!people || people < 2) { toast.show('Need at least 2 people', 'error'); return }

    setSavingSplit(true)
    const perPerson = Math.round((total / people) * 100) / 100

    try {
      // Create one lending entry per person (excluding self)
      const created = []
      for (let i = 1; i < people; i++) {
        const result = await api.addLending({
          user_phone: phone,
          person_name: `${title} — Person ${i}`,
          amount: perPerson,
          type: 'given',
          note: `Split: ${title} (${formatCurrency(perPerson)} each, ${people} people)`,
          status: 'pending',
        })
        if (result) created.push(result)
      }

      if (created.length > 0) {
        setLendings(prev => [...created, ...prev])
        toast.show(`Split created! ${formatCurrency(perPerson)} each`, 'success')
        setSplitTitle('')
        setSplitAmount('')
        setSplitPeople('')
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

  const splitPerPerson = (Number(splitAmount) > 0 && Number(splitPeople) >= 2)
    ? Math.round((Number(splitAmount) / Number(splitPeople)) * 100) / 100
    : 0

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
                            {lending.note || lending.description || (isGiven ? 'You gave' : 'You took')}
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
              <label>Number of People (including you)</label>
              <input
                className="form-input"
                type="number"
                value={splitPeople}
                onChange={e => setSplitPeople(e.target.value)}
                placeholder="e.g. 4"
                min="2"
              />
            </div>

            {splitPerPerson > 0 && (
              <div className="card" style={{
                padding: 16, textAlign: 'center', marginBottom: 18,
                background: 'var(--bg-secondary)', borderRadius: 14,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Each person pays</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--viya-primary-500)' }}>
                  {formatCurrency(splitPerPerson)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {Number(splitPeople) - 1} share{Number(splitPeople) - 1 > 1 ? 's' : ''} will be tracked (others owe you)
                </div>
              </div>
            )}

            <HapticButton fullWidth onClick={handleCreateSplit} disabled={savingSplit || !splitTitle.trim() || !splitAmount || !splitPeople}>
              {savingSplit ? 'Creating Split...' : 'Create Split'}
            </HapticButton>
          </div>
        </BottomSheet>
      </div>
    </PageTransition>
  )
}
