import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { Check, Crown, Zap, Shield, Star, ChevronRight, X, Gift, Users, BarChart3, FileText, Brain, TrendingUp } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    badge: null,
    color: 'var(--text-secondary)',
    gradient: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
    features: [
      { text: '50 AI messages/day', included: true },
      { text: '1 email account', included: true },
      { text: '2 bank accounts', included: true },
      { text: '3 financial goals', included: true },
      { text: 'Basic health tracking', included: true },
      { text: 'Investment AI', included: false },
      { text: 'Tax planning', included: false },
      { text: 'Family mode', included: false },
      { text: 'Report export', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 149,
    period: '/month',
    badge: '🔥 Most Popular',
    color:'var(--viya-primary-700)',
    gradient: 'var(--gradient-hero)',
    features: [
      { text: '500 AI messages/day', included: true },
      { text: '3 email accounts', included: true },
      { text: 'Unlimited bank accounts', included: true },
      { text: 'Unlimited goals', included: true },
      { text: 'Advanced health AI', included: true },
      { text: 'Investment portfolio AI', included: true },
      { text: 'Tax optimization (80C/80D)', included: true },
      { text: 'Family mode (4 members)', included: true },
      { text: 'PDF report export', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: '/user/month',
    badge: '🏢 Teams',
    color: 'var(--cosmos-500)',
    gradient: 'linear-gradient(135deg, #5514FF, #9972FF)',
    features: [
      { text: 'Unlimited AI (Opus model)', included: true },
      { text: 'Team shared workspace', included: true },
      { text: 'Custom AI agents', included: true },
      { text: 'API access', included: true },
      { text: '99.9% SLA uptime', included: true },
      { text: 'HR integrations', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]

const VALUE_STATS = [
  { icon: '💰', label: 'Avg saved', value: '₹8,200/mo' },
  { icon: '⏰', label: 'Time saved', value: '12 hrs/mo' },
  { icon: '💊', label: 'Medicine adherence', value: '70%' },
  { icon: '📧', label: 'Emails auto-handled', value: '85%' },
]

const TESTIMONIALS = [
  { name: 'Rahul K.', role: 'Software Engineer', text: '"Viya caught a ₹12,000 bill I would have missed. Paid for itself 80x over."', avatar: '👨‍💻' },
  { name: 'Priya S.', role: 'Homemaker', text: '"Family mode changed how we manage money. Zero arguments about expenses now."', avatar: '👩‍👧‍👦' },
  { name: 'Arjun M.', role: 'Freelancer', text: '"Tax planning saved me ₹45,000 last year. Best ₹149 I spend every month."', avatar: '👨‍🎨' },
]

export default function PremiumUpgrade() {
  const nav = useNavigate()
  const { user } = useApp()
  const [selected, setSelected] = useState('premium')
  const [annual, setAnnual] = useState(false)
  const [processing, setProcessing] = useState(false)

  const currentPlan = user?.plan || 'free'

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return
    setProcessing(true)
    // Simulate Razorpay payment
    setTimeout(() => {
      setProcessing(false)
      nav('/chat?q=thank+you+for+upgrading+to+premium')
    }, 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      {/* Hero Header */}
      <div style={{
        background: 'var(--gradient-night)', padding: '50px 20px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,212,0.15) 0%, transparent 70%)',
          top: -60, right: -40,
        }} />
        <div style={{
          position: 'absolute', width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,0,255,0.15) 0%, transparent 70%)',
          bottom: -30, left: -30,
        }} />

        <button onClick={() => nav(-1)} style={{
          position: 'absolute', top: 50, right: 20,
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={16} color="white" /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-hero)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(0,229,212,0.4)',
          }}>
            <Crown size={22} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, color: 'white' }}>
              Upgrade to Premium
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Unlock the full power of Viya AI
            </div>
          </div>
        </div>

        {/* Personalized value */}
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-lg)', padding: 14,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
            💡 In the last 30 days, Viya has:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {VALUE_STATS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {/* Billing Toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: !annual ? 'var(--teal-500)' : 'var(--text-secondary)' }}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} style={{
            width: 48, height: 26, borderRadius: 99, padding: 2, border: 'none', cursor: 'pointer',
            background: annual ? 'var(--teal-500)' : 'var(--viya-neutral-200)',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: 'white',
              transform: annual ? 'translateX(22px)' : 'translateX(0)',
              transition: 'transform 0.2s', boxShadow: 'var(--shadow-1)',
            }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: annual ? 'var(--teal-500)' : 'var(--text-secondary)' }}>
            Annual <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--emerald-500)', background: 'rgba(0,200,83,0.1)', padding: '2px 6px', borderRadius: 99 }}>Save 20%</span>
          </span>
        </div>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id
          const isCurrent = currentPlan === plan.id
          const displayPrice = annual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price
          return (
            <div key={plan.id} onClick={() => setSelected(plan.id)} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', padding: 20,
              border: isSelected ? `2px solid ${plan.color}` : '1.5px solid var(--border-light)',
              marginBottom: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              boxShadow: isSelected ? `0 4px 20px ${plan.color}25` : 'var(--shadow-1)',
              transition: 'all 0.25s ease',
            }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 99,
                  background: plan.id === 'premium' ? 'var(--teal-50)' : 'var(--cosmos-50)',
                  color: plan.id === 'premium' ? 'var(--teal-600)' : 'var(--cosmos-500)',
                }}>{plan.badge}</div>
              )}

              {/* Plan name + price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  {plan.price > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>₹</span>}
                  <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: plan.color }}>
                    {displayPrice === 0 ? 'Free' : displayPrice}
                  </span>
                  {plan.price > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plan.period}</span>}
                </div>
                {annual && plan.price > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>₹{plan.price}</span>
                )}
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.included ? (
                      <Check size={14} color="var(--emerald-500)" strokeWidth={3} />
                    ) : (
                      <X size={14} color="var(--viya-neutral-300)" strokeWidth={2} />
                    )}
                    <span style={{
                      fontSize: 13, color: f.included ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontWeight: f.included ? 500 : 400,
                    }}>{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isSelected && plan.id !== 'free' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.id) }}
                  disabled={processing || isCurrent}
                  style={{
                    width: '100%', marginTop: 16, padding: 14, borderRadius: 'var(--r-full)',
                    background: isCurrent ? 'var(--viya-neutral-200)' : plan.gradient,
                    color: isCurrent ? 'var(--text-secondary)' : 'white',
                    border: 'none', fontSize: 15, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer',
                    boxShadow: isCurrent ? 'none' : `0 8px 24px ${plan.color}30`,
                    transition: 'all 0.2s',
                  }}
                >
                  {processing ? '⏳ Processing...' : isCurrent ? '✅ Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : '🚀 Start 14-Day Free Trial'}
                </button>
              )}
            </div>
          )
        })}

        {/* Trust Badges */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20, padding: '12px 0', marginBottom: 16,
        }}>
          {[
            { icon: <Shield size={14} />, text: 'Secure Payment' },
            { icon: <Zap size={14} />, text: 'Instant Access' },
            { icon: <Gift size={14} />, text: 'Cancel Anytime' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
              {b.icon} {b.text}
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
            What users say
          </div>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 14,
              border: '1px solid var(--border-light)', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{t.avatar}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--gold-300)', fontSize: 12 }}>⭐⭐⭐⭐⭐</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {t.text}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
            Common questions
          </div>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes, cancel from Settings anytime. No questions asked.' },
            { q: 'Is my data secure?', a: 'AES-256 encryption. SOC 2 ready. Data stays in India (Mumbai).' },
            { q: 'What happens after the trial?', a: 'You\'ll be charged ₹149/month. We remind you 3 days before.' },
          ].map((faq, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--r-md)', padding: '12px 14px',
              border: '1px solid var(--border-light)', marginBottom: 6,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{faq.q}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
