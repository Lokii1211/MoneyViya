import { Shield, Lock, Eye, Database, Trash2, Download, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function Privacy() {
  const [expanded, setExpanded] = useState(null)
  const toggle = (id) => setExpanded(expanded === id ? null : id)

  const sections = [
    {
      id: 'data', icon: <Database size={20}/>, title: 'Your Data',
      content: `All your financial data is stored securely in Supabase with enterprise-grade encryption. We use Row Level Security (RLS) to ensure only you can access your data. Your phone number is the only identifier — we don't collect emails, addresses, or social profiles.`
    },
    {
      id: 'encryption', icon: <Lock size={20}/>, title: 'Encryption & Security',
      content: `• All data is encrypted at rest (AES-256)\n• HTTPS/TLS encryption for all data in transit\n• Passwords are hashed and never stored in plain text\n• API keys are environment-secured and never exposed\n• Regular security audits and dependency updates`
    },
    {
      id: 'ai', icon: <Eye size={20}/>, title: 'AI & Chat Privacy',
      content: `Your chat conversations with Viya are processed using Groq AI (LLaMA model). We do NOT share your financial data with any third-party AI service. Chat messages are stored locally in your account for continuity. We never sell or share your data with advertisers.`
    },
    {
      id: 'whatsapp', icon: <Shield size={20}/>, title: 'WhatsApp Integration',
      content: `WhatsApp messages are processed via the official Meta Cloud API. We only read messages sent directly to our business number. We never access your personal WhatsApp chats, contacts, or media. OTPs are generated securely and expire after 10 minutes.`
    },
    {
      id: 'delete', icon: <Trash2 size={20}/>, title: 'Data Deletion',
      content: `You can request complete data deletion at any time by contacting us through the Help & Support page. We will permanently delete all your data including transactions, habits, goals, and chat history within 48 hours of request.`
    },
    {
      id: 'export', icon: <Download size={20}/>, title: 'Data Export',
      content: `You have the right to export all your data. Coming soon: One-click data export to CSV/PDF. For now, contact support to request a full data export of your account.`
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h2 style={{fontSize:22, fontWeight:800}}>Privacy & Security</h2>
      </div>

      {/* Trust banner */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:'20px', marginBottom:20, textAlign:'center'}}>
        <Shield size={32} style={{color:'var(--primary)', marginBottom:8}} />
        <div style={{fontSize:16, fontWeight:800, marginBottom:4}}>Your Data is Safe with Viya</div>
        <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.5}}>We use bank-grade security to protect your financial information. Your trust is our priority.</div>
      </div>

      {/* Sections */}
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {sections.map(s => (
          <div key={s.id} style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', transition:'all 0.3s'}}>
            <button onClick={() => toggle(s.id)} style={{display:'flex', alignItems:'center', gap:14, padding:'16px', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', textAlign:'left'}}>
              <div style={{color:'var(--primary)', flexShrink:0}}>{s.icon}</div>
              <div style={{flex:1, fontSize:14, fontWeight:700}}>{s.title}</div>
              <ChevronRight size={16} style={{color:'var(--text3)', transform:expanded === s.id ? 'rotate(90deg)' : 'none', transition:'transform 0.2s'}} />
            </button>
            {expanded === s.id && (
              <div style={{padding:'0 16px 16px 50px', fontSize:13, color:'var(--text2)', lineHeight:1.7, whiteSpace:'pre-line', animation:'slideUp 0.2s var(--ease)'}}>
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{textAlign:'center', marginTop:24, fontSize:12, color:'var(--text3)', lineHeight:1.6}}>
        <p>Viya follows industry-standard security practices.</p>
        <p>Last updated: April 2026</p>
      </div>
    </div>
  )
}
