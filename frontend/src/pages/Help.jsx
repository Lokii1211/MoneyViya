import { HelpCircle, MessageCircle, Mail, ChevronRight, ExternalLink, Sparkles } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  { q: 'How does Viya track my expenses?', a: 'You can add expenses manually in the app, or simply tell Viya in chat — e.g., "spent ₹200 on food" and it auto-logs it. Via WhatsApp, just send your expenses naturally!' },
  { q: 'Is my financial data safe?', a: 'Absolutely! We use bank-grade encryption (AES-256) and Supabase Row Level Security. Your data is never shared with third parties or advertisers.' },
  { q: 'How does the streak system work?', a: 'Streaks count consecutive days you complete a habit. If you miss a day, the streak resets. Your best streak is always saved so you can try to beat your record!' },
  { q: 'Can I use Viya in my language?', a: 'Yes! During onboarding, select your preferred language. Viya supports English, Hindi, Tamil, Telugu, Kannada, and Malayalam. AI responses adapt to your choice.' },
  { q: 'How do reminders work?', a: 'Set daily, weekly, or monthly reminders in the Reminders page. You\'ll get browser push notifications at your chosen time. WhatsApp reminders are also sent for critical items!' },
  { q: 'What AI model does Viya use?', a: 'Viya uses Groq-powered LLaMA-3.3-70B for intelligent responses. It understands your financial context, habits, and goals to give personalized advice.' },
  { q: 'Can I delete my account?', a: 'Yes. Go to Privacy & Security → Data Deletion. Contact us and we\'ll permanently delete all your data within 48 hours.' },
  { q: 'Is Viya free?', a: 'Yes! Viya is completely free. We believe everyone deserves smart financial management tools.' },
]

export default function Help() {
  const [expanded, setExpanded] = useState(null)
  const toggle = (id) => setExpanded(expanded === id ? null : id)

  return (
    <div className="page">
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Help & Support</h2>
      </div>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg, var(--violet-dim), var(--primary-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:'24px 20px', marginBottom:20, textAlign:'center'}}>
        <Sparkles size={32} style={{color:'var(--primary)', marginBottom:8}} />
        <div style={{fontSize:16, fontWeight:800, marginBottom:4}}>How can we help?</div>
        <div style={{fontSize:13, color:'var(--text2)'}}>Find answers to common questions below, or reach out to support.</div>
      </div>

      {/* Contact */}
      <div style={{display:'flex', gap:8, marginBottom:20}}>
        <a href="mailto:lokesh@viya.app" style={{flex:1, display:'flex', alignItems:'center', gap:10, padding:'14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, textDecoration:'none', color:'var(--text)', fontFamily:'inherit'}}>
          <Mail size={20} style={{color:'var(--primary)'}}/> 
          <div><div style={{fontSize:13, fontWeight:700}}>Email Us</div><div style={{fontSize:11, color:'var(--text3)'}}>lokesh@viya.app</div></div>
        </a>
        <a href="https://wa.me/919003360494?text=Hi%20Viya%20Support" target="_blank" rel="noopener" style={{flex:1, display:'flex', alignItems:'center', gap:10, padding:'14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, textDecoration:'none', color:'var(--text)', fontFamily:'inherit'}}>
          <MessageCircle size={20} style={{color:'var(--primary)'}}/> 
          <div><div style={{fontSize:13, fontWeight:700}}>WhatsApp</div><div style={{fontSize:11, color:'var(--text3)'}}>Chat with us</div></div>
        </a>
      </div>

      {/* FAQs */}
      <div style={{fontSize:14, fontWeight:800, marginBottom:12}}>Frequently Asked Questions</div>
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {FAQS.map((f, i) => (
          <div key={i} style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden'}}>
            <button onClick={() => toggle(i)} style={{display:'flex', alignItems:'center', gap:12, padding:'14px 16px', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', textAlign:'left'}}>
              <HelpCircle size={16} style={{color:'var(--primary)', flexShrink:0}} />
              <div style={{flex:1, fontSize:13, fontWeight:700}}>{f.q}</div>
              <ChevronRight size={14} style={{color:'var(--text3)', transform:expanded === i ? 'rotate(90deg)' : 'none', transition:'transform 0.2s'}} />
            </button>
            {expanded === i && (
              <div style={{padding:'0 16px 14px 44px', fontSize:13, color:'var(--text2)', lineHeight:1.7, animation:'slideUp 0.2s var(--ease)'}}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{textAlign:'center', marginTop:24, padding:16, background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)'}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>Still need help?</div>
        <div style={{fontSize:12, color:'var(--text2)', marginBottom:10}}>Chat with Viya AI — it knows everything about the app!</div>
        <a href="/chat?q=help+me+with+the+app" style={{display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', background:'var(--primary)', color:'#fff', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none'}}>
          <MessageCircle size={14}/> Ask Viya AI
        </a>
      </div>
    </div>
  )
}
