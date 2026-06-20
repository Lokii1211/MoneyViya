import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { Calendar, TrendingUp, TrendingDown, Zap, Target, Flame, Star } from 'lucide-react'

export default function Review() {
  const { phone } = useApp()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('weekly')

  useEffect(() => {
    setLoading(true)
    api.chat(phone, tab === 'weekly' ? 'weekly review' : 'monthly review').then(r => {
      setReview(r.reply || 'No review data available yet. Keep tracking your finances!')
      setLoading(false)
    }).catch(() => { setReview('Could not load review.'); setLoading(false) })
  }, [phone, tab])

  const scores = [
    { label: 'Finance', score: 78, icon: <TrendingUp size={16} />, color: 'green' },
    { label: 'Habits', score: 65, icon: <Flame size={16} />, color: 'gold' },
    { label: 'Goals', score: 42, icon: <Target size={16} />, color: 'violet' },
    { label: 'Learning', score: 30, icon: <Star size={16} />, color: 'cyan' },
  ]

  return (
    <div className="page">
      <header className="page-header"><div className="header-left"><h2>Life Review</h2></div></header>
      <div className="type-tabs">
        <button className={'type-tab' + (tab === 'weekly' ? ' active expense' : '')} onClick={() => setTab('weekly')}><Calendar size={16} /> Weekly</button>
        <button className={'type-tab' + (tab === 'monthly' ? ' active income' : '')} onClick={() => setTab('monthly')}><Calendar size={16} /> Monthly</button>
      </div>

      <div className="review-scores">
        {scores.map((s, i) => (
          <div key={i} className="score-card">
            <div className={'score-icon ' + s.color}>{s.icon}</div>
            <div className="score-info">
              <div className="score-label">{s.label}</div>
              <div className="score-bar"><div className={'score-fill ' + s.color} style={{ width: s.score + '%' }} /></div>
            </div>
            <div className="score-num">{s.score}</div>
          </div>
        ))}
      </div>

      <div className="review-card">
        <div className="review-header"><Zap size={18} className="accent-icon" /><h3>AI Insights</h3></div>
        {loading ? (
          <div className="review-loading">Analyzing your data...</div>
        ) : (
          <div className="review-content" dangerouslySetInnerHTML={{ __html: review.replace(/\n/g, '<br/>') }} />
        )}
      </div>
    </div>
  )
}
