import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { BarChart3, Share2, Download, TrendingUp, TrendingDown, Target, Flame, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Report() {
  const { phone, user } = useApp()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (phone) {
      fetch(`/api/webhook?action=weekly_report&phone=${phone}`)
        .then(r => r.json())
        .then(d => { if (d.report) setReport(d.report); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [phone])

  const shareReport = () => {
    if (!report) return
    const name = user?.name || 'User'
    const text = `📊 ${name}'s Viya Weekly Report
📅 ${report.period}

💰 Income: ₹${report.totalIncome}
💸 Expenses: ₹${report.totalExpenses}
💎 Saved: ₹${Math.max(0, report.saved)}
📝 Transactions: ${report.txnCount}

${report.habits.maxStreak > 0 ? `🔥 Best Streak: ${report.habits.maxStreak} days` : ''}
${report.goals.length > 0 ? `🎯 Goals: ${report.goals.map(g => `${g.icon} ${g.name} (${g.pct}%)`).join(', ')}` : ''}

Track your money with Viya — your AI friend 💚
https://heyviya.vercel.app`

    if (navigator.share) {
      navigator.share({ title: 'My Weekly Viya Report', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Report copied to clipboard! 📋')
    }
  }

  if (loading) return (
    <div className="page" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:12}}>📊</div>
        <div style={{fontSize:14, color:'var(--text2)'}}>Generating your report...</div>
      </div>
    </div>
  )

  if (!report) return (
    <div className="page">
      <div className="empty-state">
        <BarChart3 size={48} className="empty-icon" />
        <h3>No Data Yet</h3>
        <p>Start tracking expenses to see your weekly report!</p>
      </div>
    </div>
  )

  const savingsRate = report.totalIncome > 0 ? Math.round((report.saved / report.totalIncome) * 100) : 0

  return (
    <div className="page">
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button style={{background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text)'}} onClick={() => nav(-1)}><ArrowLeft size={20}/></button>
          <h2 style={{fontSize:20, fontWeight:800}}>Weekly Report</h2>
        </div>
        <button style={{padding:'8px 14px', background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:10, color:'var(--primary)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4}} onClick={shareReport}>
          <Share2 size={14}/> Share
        </button>
      </div>

      {/* Period */}
      <div style={{fontSize:13, color:'var(--text3)', marginBottom:16, textAlign:'center', fontWeight:600}}>📅 {report.period}</div>

      {/* Main Summary */}
      <div style={{background:'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border:'1px solid var(--border2)', borderRadius:18, padding:24, marginBottom:16, textAlign:'center'}}>
        <div style={{fontSize:11, color:'var(--text3)', letterSpacing:2, fontWeight:700}}>NET SAVINGS THIS WEEK</div>
        <div style={{fontFamily:'var(--mono)', fontSize:36, fontWeight:900, color: report.saved >= 0 ? 'var(--primary)' : 'var(--cosmos-400)', margin:'8px 0'}}>
          {report.saved >= 0 ? '+' : ''}₹{report.saved}
        </div>
        {report.totalIncome > 0 && (
          <div style={{fontSize:12, color:'var(--text2)'}}>
            Savings rate: <strong style={{color: savingsRate >= 20 ? 'var(--primary)' : 'var(--cosmos-400)'}}>{savingsRate}%</strong>
            {savingsRate >= 20 ? ' 🎉 Great!' : savingsRate >= 10 ? ' 👍 Good' : ' ⚠️ Needs improvement'}
          </div>
        )}
      </div>

      {/* Income / Expenses */}
      <div style={{display:'flex', gap:10, marginBottom:16}}>
        <div style={{flex:1, background:'var(--primary-dim)', border:'1px solid rgba(0,208,132,0.2)', borderRadius:14, padding:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:4, marginBottom:6}}>
            <TrendingUp size={14} color="var(--primary)"/>
            <span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>INCOME</span>
          </div>
          <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:800, color:'var(--primary)'}}>₹{report.totalIncome}</div>
        </div>
        <div style={{flex:1, background:'var(--cosmos-50)', border:'1px solid rgba(85,20,255,0.15)', borderRadius:14, padding:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:4, marginBottom:6}}>
            <TrendingDown size={14} color="var(--cosmos-400)"/>
            <span style={{fontSize:11, color:'var(--text3)', fontWeight:700}}>EXPENSES</span>
          </div>
          <div style={{fontFamily:'var(--mono)', fontSize:22, fontWeight:800, color:'var(--cosmos-400)'}}>₹{report.totalExpenses}</div>
        </div>
      </div>

      {/* Daily Average */}
      <div style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span style={{fontSize:13, color:'var(--text2)'}}>Daily Average Spending</span>
        <span style={{fontFamily:'var(--mono)', fontSize:16, fontWeight:800, color:'var(--text)'}}>₹{report.dailyAvg}/day</span>
      </div>

      {/* Top Categories */}
      {report.topCategories.length > 0 && (
        <div style={{marginBottom:16}}>
          <h3 style={{fontSize:14, fontWeight:700, marginBottom:10}}>💸 Top Spending Categories</h3>
          {report.topCategories.map((cat, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:6}}>
              <span style={{fontSize:13}}>{cat.category}</span>
              <span style={{fontFamily:'var(--mono)', fontSize:14, fontWeight:700, color:'var(--cosmos-400)'}}>₹{cat.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* Habits Summary */}
      {report.habits.total > 0 && (
        <div style={{background:'linear-gradient(135deg, var(--gold-dim, rgba(255,215,0,0.1)), var(--orange-dim, rgba(255,165,0,0.1)))', border:'1px solid rgba(255,165,0,0.2)', borderRadius:14, padding:16, marginBottom:16}}>
          <h3 style={{fontSize:14, fontWeight:700, marginBottom:8}}>🔥 Habits</h3>
          <div style={{display:'flex', gap:16}}>
            <div><div style={{fontSize:11, color:'var(--text3)'}}>Total</div><div style={{fontSize:18, fontWeight:800}}>{report.habits.total}</div></div>
            <div><div style={{fontSize:11, color:'var(--text3)'}}>Active</div><div style={{fontSize:18, fontWeight:800, color:'var(--primary)'}}>{report.habits.active}</div></div>
            <div><div style={{fontSize:11, color:'var(--text3)'}}>Best Streak</div><div style={{fontSize:18, fontWeight:800, color:'var(--orange, #f97316)'}}>{report.habits.maxStreak} 🔥</div></div>
          </div>
        </div>
      )}

      {/* Goals Summary */}
      {report.goals.length > 0 && (
        <div style={{marginBottom:16}}>
          <h3 style={{fontSize:14, fontWeight:700, marginBottom:10}}>🎯 Goals Progress</h3>
          {report.goals.map((g, i) => (
            <div key={i} style={{background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:14, marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <span style={{fontSize:13, fontWeight:700}}>{g.icon} {g.name}</span>
                <span style={{fontSize:13, fontWeight:800, color:'var(--primary)'}}>{g.pct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width: g.pct + '%'}} /></div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:4, fontSize:11, color:'var(--text3)'}}>
                <span>₹{g.saved}</span>
                <span>₹{g.target}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Count */}
      <div style={{textAlign:'center', padding:16, fontSize:12, color:'var(--text3)'}}>
        📝 {report.txnCount} transactions this week · Powered by Viya 💚
      </div>
    </div>
  )
}
