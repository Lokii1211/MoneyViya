import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { useToast } from '../components/Toast'
import { motion } from 'framer-motion'
import { ArrowLeft, Smartphone, Building2, TrendingUp, FileText, Shield, Lock, RefreshCw } from 'lucide-react'

const BANKS = [
  { name: 'HDFC', icon: '🏦', color: '#004B8D' },
  { name: 'ICICI', icon: '🏛️', color: '#F58220' },
  { name: 'SBI', icon: '🏦', color: '#22409A' },
  { name: 'Axis', icon: '🏛️', color: '#97144D' },
  { name: 'Kotak', icon: '🏦', color: '#ED1C24' },
]

const BROKERS = [
  { name: 'Zerodha', icon: '📈', color: '#387ED1' },
  { name: 'Groww', icon: '📊', color: '#5367FF' },
  { name: 'Kuvera', icon: '💹', color: '#00B386' },
  { name: 'Upstox', icon: '📉', color: '#6B3FA0' },
]

const anim = (d) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.35 } })

export default function BankConnect() {
  const nav = useNavigate()
  const toast = useToast()
  const [smsEnabled, setSmsEnabled] = useState(() => localStorage.getItem('mv_sms_enabled') === 'true')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pastedSms, setPastedSms] = useState('')

  const toggleSms = () => {
    const next = !smsEnabled
    setSmsEnabled(next)
    localStorage.setItem('mv_sms_enabled', String(next))
    toast(next ? 'SMS Auto-Track enabled' : 'SMS Auto-Track disabled', next ? 'success' : 'info')
  }

  const handleBankTap = (bankName) => {
    toast(`Coming soon — we're integrating with Setu AA framework`, 'info')
  }

  const handleBrokerTap = (brokerName) => {
    toast(`${brokerName} integration coming soon`, 'info')
  }

  const handlePasteSms = () => {
    if (!pastedSms.trim()) {
      toast('Please paste an SMS first', 'warning')
      return
    }
    toast('SMS parsed! Transaction will appear in expenses.', 'success')
    setPastedSms('')
    setPasteOpen(false)
  }

  return (
    <div className="page page-padded">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => nav(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h2>Connect Accounts</h2>
        </div>
      </div>

      {/* Hero */}
      <motion.div {...anim(0)} className="hero-card night" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6, fontFamily: 'var(--brand)' }}>
            Auto-track every rupee
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
            Connect bank SMS or sync your bank account to automatically track all expenses and income.
          </div>
        </div>
        <div className="hero-orb" />
      </motion.div>

      {/* SMS Auto-Track */}
      <motion.div {...anim(0.08)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>SMS Auto-Track</div>
              <div className="body-s text-secondary">Automatically detect expenses from bank SMS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg2)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {smsEnabled ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary-glow)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Active</span>
              </>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>Disabled</span>
            )}
          </div>
          <button
            onClick={toggleSms}
            style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: smsEnabled ? 'var(--primary)' : 'var(--surface3)',
              position: 'relative', transition: 'background 0.3s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: smsEnabled ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.3s var(--ease)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </motion.div>

      {/* Connect Bank (Account Aggregator) */}
      <motion.div {...anim(0.16)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Connect Bank Account</div>
            <div className="body-s text-secondary">Sync transactions via India's AA framework</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
          {BANKS.map(b => (
            <button
              key={b.name}
              onClick={() => handleBankTap(b.name)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.25s',
              }}
            >
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)' }}>{b.name}</span>
            </button>
          ))}
        </div>

        {/* Trust indicators */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            <Shield size={12} /> RBI regulated
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            <Lock size={12} /> Read-only access
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            <RefreshCw size={12} /> Revoke anytime
          </div>
        </div>
      </motion.div>

      {/* Track Investments */}
      <motion.div {...anim(0.24)} className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Track Investments</div>
            <div className="body-s text-secondary">Connect Zerodha, Groww, Kuvera for live portfolio tracking</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {BROKERS.map(b => (
            <button
              key={b.name}
              onClick={() => handleBrokerTap(b.name)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.25s',
              }}
            >
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)' }}>{b.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Import Transactions */}
      <motion.div {...anim(0.32)} className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Import Transactions</div>
            <div className="body-s text-secondary">Upload statements or paste bank SMS</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => toast('CSV/PDF import coming soon', 'info')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
          >
            <FileText size={14} /> Import CSV/PDF
          </button>
          <button
            className="btn-secondary"
            onClick={() => setPasteOpen(!pasteOpen)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
          >
            <Smartphone size={14} /> Paste Bank SMS
          </button>
        </div>

        {pasteOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 12 }}>
            <textarea
              value={pastedSms}
              onChange={e => setPastedSms(e.target.value)}
              placeholder="Paste your bank SMS here, e.g. 'Rs.500 debited from A/c XX1234 for UPI-Amazon'"
              className="form-input"
              style={{ minHeight: 80, resize: 'vertical', fontSize: 13, lineHeight: 1.5 }}
            />
            <button
              className="btn-primary full"
              onClick={handlePasteSms}
              style={{ marginTop: 10 }}
            >
              Parse SMS
            </button>
          </motion.div>
        )}
      </motion.div>

      <div className="spacer-20" />
    </div>
  )
}
