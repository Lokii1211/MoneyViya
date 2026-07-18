import { Shield, Lock, Eye, Database, Trash2, Download, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Privacy() {
  const nav = useNavigate()
  useDocumentMeta({
    title: 'Privacy Policy | Viya',
    description: 'How Viya stores, encrypts, and protects your financial data — Row Level Security, AES-256 encryption, and what Gmail access is used for.',
    path: '/privacy',
  })

  const sections = [
    {
      id: 'data', icon: <Database size={20}/>, title: 'Your Data',
      content: `All your financial data is stored securely in Supabase with enterprise-grade encryption. We use Row Level Security (RLS) to ensure only you can access your data. Your phone number is the primary identifier for the app; you may optionally connect a Gmail account (see "Gmail Access" below).`
    },
    {
      id: 'encryption', icon: <Lock size={20}/>, title: 'Encryption & Security',
      content: `• All data is encrypted at rest (AES-256)\n• HTTPS/TLS encryption for all data in transit\n• Passwords are hashed and never stored in plain text\n• API keys are environment-secured and never exposed\n• Regular security audits and dependency updates`
    },
    {
      id: 'ai', icon: <Eye size={20}/>, title: 'AI & Chat Privacy',
      content: `Your chat conversations with Viya are processed using Groq AI (LLaMA model) to generate responses and detect actions like logging expenses. We do NOT share your financial data with any third-party AI service beyond what's needed to generate a reply. Chat messages are stored in your account for continuity. We never sell or share your data with advertisers.`
    },
    {
      id: 'gmail', icon: <Mail size={20}/>, title: 'Gmail Access (Email Intelligence)',
      content: `If you choose to connect Gmail (an optional feature), Viya requests read-only access to your inbox (gmail.readonly) and label management (gmail.labels) through Google's official OAuth flow — never your password.\n\nWhat we access: the sender, subject line, and short preview snippet of emails, so Viya can auto-detect bank/merchant/bill emails and offer to log them as transactions or reminders. We do not read full email bodies, attachments, or emails unrelated to this purpose beyond what Gmail's API returns for that scan.\n\nWhat we store: only the sender, subject, and snippet needed to show you the detected item — not your full email content.\n\nWhat we don't do: we never use Gmail data for advertising, never sell it, and never share it with third parties. You can disconnect Gmail access at any time from Profile → Settings, which stops all access immediately; Google also lets you revoke access directly at myaccount.google.com/permissions.\n\nViya's use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.`
    },
    {
      id: 'whatsapp', icon: <Shield size={20}/>, title: 'WhatsApp Integration',
      content: `WhatsApp messages are processed via the official Meta Cloud API. We only read messages sent directly to our business number. We never access your personal WhatsApp chats, contacts, or media. OTPs are generated securely and expire after 5 minutes.`
    },
    {
      id: 'delete', icon: <Trash2 size={20}/>, title: 'Data Deletion',
      content: `You can request complete data deletion at any time from Profile → Settings → Delete Account, or by contacting us through the Help & Support page. We permanently delete all your data — including transactions, habits, goals, chat history, and any connected Gmail data — within 48 hours of request.`
    },
    {
      id: 'export', icon: <Download size={20}/>, title: 'Data Export',
      content: `You have the right to export all your data at any time. Go to Profile → Settings → Delete Account to download your data, or contact support at support@heyviya.com for a full export.`
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:22, fontWeight:800}}>Privacy & Security</h2>
        </div>
      </div>

      {/* Trust banner */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:16, padding:'20px', marginBottom:20, textAlign:'center'}}>
        <Shield size={32} style={{color:'var(--primary)', marginBottom:8}} />
        <div style={{fontSize:16, fontWeight:800, marginBottom:4}}>Your Data is Safe with Viya</div>
        <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.5}}>We use bank-grade security to protect your financial information. Your trust is our priority.</div>
      </div>

      {/* Sections — always fully visible, not hidden behind clicks: this is a
          legal/compliance page, reviewed by people (and automated tools) who
          shouldn't have to click through an accordion to see the actual text. */}
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {sections.map(s => (
          <div key={s.id} style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16}}>
            <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:10}}>
              <div style={{color:'var(--primary)', flexShrink:0}}>{s.icon}</div>
              <div style={{fontSize:14, fontWeight:700}}>{s.title}</div>
            </div>
            <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.7, whiteSpace:'pre-line'}}>
              {s.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{textAlign:'center', marginTop:24, fontSize:12, color:'var(--text3)', lineHeight:1.6}}>
        <p>Viya follows industry-standard security practices.</p>
        <p>Last updated: July 2026</p>
      </div>
    </div>
  )
}
