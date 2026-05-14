import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, TrendingUp, Activity, Mail, Bell, CreditCard, ToggleLeft, Server,
  AlertTriangle, CheckCircle, Clock, Zap, DollarSign, BarChart3, PieChart } from 'lucide-react'

// Mock data for admin dashboard
const OVERVIEW_METRICS = [
  { label: 'DAU', value: '24,891', change: '+12%', target: '25K', color: 'var(--teal-500)', icon: <Users size={16} /> },
  { label: 'MAU', value: '1,48,203', change: '+8%', target: '150K', color: 'var(--info-500)', icon: <TrendingUp size={16} /> },
  { label: 'Revenue', value: '₹18.4L', change: '+22%', target: '₹20L', color: 'var(--emerald-500)', icon: <DollarSign size={16} /> },
  { label: 'Error Rate', value: '0.3%', change: '-0.1%', target: '<1%', color: 'var(--coral-500)', icon: <AlertTriangle size={16} /> },
  { label: 'API p95', value: '380ms', change: '-45ms', target: '<500ms', color: 'var(--amber-500)', icon: <Activity size={16} /> },
  { label: 'Premium %', value: '11.8%', change: '+1.2%', target: '15%', color: 'var(--gold-500)', icon: <CreditCard size={16} /> },
]

const SYSTEM_SERVICES = [
  { name: 'API Server', status: 'healthy', latency: '82ms', uptime: '99.97%' },
  { name: 'PostgreSQL', status: 'healthy', latency: '12ms', uptime: '99.99%' },
  { name: 'Redis Cache', status: 'healthy', latency: '2ms', uptime: '99.99%' },
  { name: 'Email Sync', status: 'degraded', latency: '1.2s', uptime: '98.5%' },
  { name: 'WhatsApp API', status: 'healthy', latency: '340ms', uptime: '99.8%' },
  { name: 'Claude AI', status: 'healthy', latency: '1.8s', uptime: '99.6%' },
]

const RECENT_USERS = [
  { name: 'Rahul Kumar', email: 'rahul@gmail.com', plan: 'premium', joined: '2h ago', status: 'active' },
  { name: 'Priya Sharma', email: 'priya.s@gmail.com', plan: 'free', joined: '5h ago', status: 'active' },
  { name: 'Arjun Mehta', email: 'arjun.m@yahoo.com', plan: 'premium', joined: '1d ago', status: 'active' },
  { name: 'Sneha Patel', email: 'sneha.p@gmail.com', plan: 'free', joined: '2d ago', status: 'inactive' },
  { name: 'Vikram Rao', email: 'vikram.r@outlook.com', plan: 'enterprise', joined: '3d ago', status: 'active' },
]

const AI_COST_DATA = [
  { model: 'Haiku', calls: '12,340', cost: '₹2,100', pct: 45 },
  { model: 'Sonnet', calls: '5,670', cost: '₹8,400', pct: 35 },
  { model: 'Opus', calls: '890', cost: '₹6,200', pct: 15 },
  { model: 'Regex/Cache', calls: '18,900', cost: '₹0', pct: 5 },
]

const FEATURE_FLAGS = [
  { name: 'new_email_intelligence_v2', rollout: 25, status: 'testing', owner: 'Anil' },
  { name: 'premium_investment_ai', rollout: 100, status: 'live', owner: 'Ravi' },
  { name: 'family_mode_beta', rollout: 10, status: 'testing', owner: 'Sneha' },
  { name: 'voice_first_mode', rollout: 5, status: 'experiment', owner: 'Arjun' },
  { name: 'dark_mode_system_default', rollout: 100, status: 'live', owner: 'Priya' },
]

const NOTIFICATION_FUNNEL = [
  { stage: 'Sent', count: 45200, pct: 100 },
  { stage: 'Delivered', count: 42100, pct: 93 },
  { stage: 'Opened', count: 28400, pct: 63 },
  { stage: 'Acted', count: 12800, pct: 28 },
]

export default function AdminDashboard() {
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const tabs = ['overview', 'users', 'ai', 'system', 'flags', 'notifs']

  const StatusDot = ({ status }) => (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: status === 'healthy' ? 'var(--emerald-500)' : status === 'degraded' ? 'var(--amber-500)' : 'var(--coral-500)',
      boxShadow: `0 0 6px ${status === 'healthy' ? 'var(--emerald-500)' : status === 'degraded' ? 'var(--amber-500)' : 'var(--coral-500)'}`,
    }} />
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        padding: '50px 20px 12px', background: 'var(--gradient-night)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => nav(-1)} style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLeft size={16} color="white" /></button>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: 'white' }}>
              ⚡ Admin Dashboard
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Last updated: 2 minutes ago
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
              background: tab === t ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: tab === t ? 'white' : 'rgba(255,255,255,0.5)',
              border: tab === t ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20 }}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {OVERVIEW_METRICS.map((m, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
                  border: '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</span>
                    <div style={{ color: m.color }}>{m.icon}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>{m.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: m.change.startsWith('+') ? 'var(--emerald-500)' : m.change.startsWith('-') && m.label !== 'Error Rate' && m.label !== 'API p95' ? 'var(--coral-500)' : 'var(--emerald-500)',
                    }}>{m.change}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Target: {m.target}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notification Funnel Mini */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
              border: '1px solid var(--border-light)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📬 Notification Funnel (Today)</div>
              {NOTIFICATION_FUNNEL.map((s, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{s.stage}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                      {s.count.toLocaleString('en-IN')} ({s.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${s.pct}%`,
                      background: i === 0 ? 'var(--info-500)' : i === 1 ? 'var(--teal-500)' : i === 2 ? 'var(--gold-500)' : 'var(--emerald-500)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ USERS TAB ═══ */}
        {tab === 'users' && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-light)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>👥 Recent Users</div>
            </div>
            {RECENT_USERS.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                borderBottom: i < RECENT_USERS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-hero)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white',
                }}>{u.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase',
                  background: u.plan === 'premium' ? 'var(--teal-50)' : u.plan === 'enterprise' ? 'var(--cosmos-50)' : 'var(--bg-secondary)',
                  color: u.plan === 'premium' ? 'var(--teal-600)' : u.plan === 'enterprise' ? 'var(--cosmos-500)' : 'var(--text-tertiary)',
                }}>{u.plan}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{u.joined}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ AI TAB ═══ */}
        {tab === 'ai' && (
          <>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
              border: '1px solid var(--border-light)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🤖 AI Cost Breakdown (Today)</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--cosmos-500)', marginBottom: 12 }}>
                ₹16,700 <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>/ ₹20,000 budget</span>
              </div>
              {AI_COST_DATA.map((a, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{a.model}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{a.calls} calls · {a.cost}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${a.pct}%`,
                      background: a.model === 'Opus' ? 'var(--cosmos-500)' : a.model === 'Sonnet' ? 'var(--teal-500)' : a.model === 'Haiku' ? 'var(--info-500)' : 'var(--emerald-500)',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--cosmos-50)', borderRadius: 'var(--r-lg)', padding: 14,
              border: '1px solid var(--cosmos-100)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cosmos-500)', marginBottom: 4 }}>💡 Cost Optimization</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                40% of queries are handled by regex/cache tier. Increase Haiku fallback for greeting messages to reduce Sonnet costs by ~15%.
              </div>
            </div>
          </>
        )}

        {/* ═══ SYSTEM TAB ═══ */}
        {tab === 'system' && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-light)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>🖥️ Service Health</div>
            </div>
            {SYSTEM_SERVICES.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderBottom: i < SYSTEM_SERVICES.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <StatusDot status={s.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                </div>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text-secondary)' }}>{s.latency}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: s.status === 'healthy' ? 'rgba(0,200,83,0.1)' : 'rgba(255,152,0,0.1)',
                  color: s.status === 'healthy' ? 'var(--emerald-500)' : 'var(--amber-500)',
                }}>{s.uptime}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ FLAGS TAB ═══ */}
        {tab === 'flags' && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-light)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>🚩 Feature Flags</div>
            </div>
            {FEATURE_FLAGS.map((f, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                borderBottom: i < FEATURE_FLAGS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{f.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: f.status === 'live' ? 'rgba(0,200,83,0.1)' : f.status === 'testing' ? 'rgba(0,145,255,0.1)' : 'rgba(245,166,35,0.1)',
                    color: f.status === 'live' ? 'var(--emerald-500)' : f.status === 'testing' ? 'var(--info-500)' : 'var(--gold-500)',
                    textTransform: 'uppercase',
                  }}>{f.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.rollout}%`, background: 'var(--teal-500)', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", minWidth: 32, textAlign: 'right' }}>{f.rollout}%</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>@{f.owner}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ NOTIFS TAB ═══ */}
        {tab === 'notifs' && (
          <>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 16,
              border: '1px solid var(--border-light)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📬 Delivery Funnel</div>
              {NOTIFICATION_FUNNEL.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60 }}>{s.stage}</span>
                  <div style={{ flex: 1, height: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%', width: `${s.pct}%`, borderRadius: 'var(--r-md)',
                      background: i === 0 ? 'var(--info-500)' : i === 1 ? 'var(--teal-500)' : i === 2 ? 'var(--gold-500)' : 'var(--emerald-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{s.count.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", minWidth: 32 }}>{s.pct}%</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'WhatsApp', rate: '93%', sent: '32K', color: '#25D366' },
                { label: 'Push', rate: '87%', sent: '8.2K', color: 'var(--teal-500)' },
                { label: 'SMS', rate: '98%', sent: '1.2K', color: 'var(--amber-500)' },
                { label: 'Email', rate: '95%', sent: '3.8K', color: 'var(--info-500)' },
              ].map((ch, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
                  border: '1px solid var(--border-light)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{ch.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: ch.color }}>{ch.rate}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{ch.sent} sent</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
