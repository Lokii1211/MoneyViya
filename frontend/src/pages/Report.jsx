import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { api } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { formatINR, getCategoryIcon, getCategoryColor } from '../lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react'

export default function Report() {
  const { phone, user } = useApp()
  const nav = useNavigate()
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)

  const targetMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const monthLabel = targetMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!phone) return
    setLoading(true)
    api.getTransactions(phone, 200).then(txns => {
      setTransactions(txns || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [phone])

  const filtered = useMemo(() => {
    const prefix = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`
    return transactions.filter(t => t.created_at?.startsWith(prefix))
  }, [transactions, targetMonth])

  const prevMonthFiltered = useMemo(() => {
    const prev = new Date(targetMonth)
    prev.setMonth(prev.getMonth() - 1)
    const prefix = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    return transactions.filter(t => t.created_at?.startsWith(prefix))
  }, [transactions, targetMonth])

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

  const prevExpenses = prevMonthFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const prevIncome = prevMonthFiltered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenseChangePct = prevExpenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100) : null
  const incomeChangePct = prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : null

  const categoryBreakdown = useMemo(() => {
    const map = {}
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other'
      map[cat] = (map[cat] || 0) + Number(t.amount)
    })
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  }, [filtered])

  const maxCatAmount = categoryBreakdown[0]?.amount || 1

  const topExpenses = useMemo(() => {
    return filtered.filter(t => t.type === 'expense').sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5)
  }, [filtered])

  const dailySpend = useMemo(() => {
    const map = {}
    const year = targetMonth.getFullYear(), month = targetMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) map[d] = 0
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const day = new Date(t.created_at).getDate()
      map[day] = (map[day] || 0) + Number(t.amount)
    })
    return Object.entries(map).map(([day, amount]) => ({ day: Number(day), amount }))
  }, [filtered, targetMonth])

  const maxDailySpend = Math.max(...dailySpend.map(d => d.amount), 1)

  const isCurrentMonth = monthOffset === 0
  const daysElapsed = isCurrentMonth ? new Date().getDate() : dailySpend.length
  const avgDailySpend = daysElapsed > 0 ? Math.round(expenses / daysElapsed) : 0
  const highestDay = dailySpend.reduce((max, d) => d.amount > max.amount ? d : max, { day: 0, amount: 0 })

  const dailyBudget = Number(user?.daily_budget) || 0
  const budgetStats = useMemo(() => {
    if (!dailyBudget) return null
    const relevantDays = isCurrentMonth ? dailySpend.filter(d => d.day <= daysElapsed) : dailySpend
    const overBudgetDays = relevantDays.filter(d => d.amount > dailyBudget).length
    const budgetedTotal = dailyBudget * relevantDays.length
    return { overBudgetDays, totalDays: relevantDays.length, budgetedTotal, actualTotal: expenses }
  }, [dailyBudget, dailySpend, isCurrentMonth, daysElapsed, expenses])

  const shareReport = () => {
    const name = user?.name || 'User'
    const text = `${name}'s ${monthLabel} Report\n\nIncome: ${formatINR(income)}\nExpenses: ${formatINR(expenses)}\nSavings: ${formatINR(savings)} (${savingsRate}%)\n\nTop categories:\n${categoryBreakdown.slice(0, 3).map(c => `${getCategoryIcon(c.name)} ${c.name}: ${formatINR(c.amount)}`).join('\n')}\n\nPowered by Viya`
    if (navigator.share) navigator.share({ title: 'Monthly Report', text })
    else { navigator.clipboard.writeText(text); toast.show('Report copied!', 'success') }
  }

  if (loading) return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ height: 20, width: 160, background: 'var(--bg-secondary)', borderRadius: 8 }} />
      </div>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  )

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }}><ArrowLeft size={20} /></button>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Monthly Report</h2>
        </div>
        <button onClick={shareReport} style={{ padding: '6px 12px', background: 'var(--primary-dim)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 10, color: 'var(--primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Month Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={() => setMonthOffset(o => o - 1)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="var(--text)" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 160, textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={() => setMonthOffset(o => Math.min(o + 1, 0))} disabled={monthOffset >= 0} style={{ background: monthOffset >= 0 ? 'var(--border)' : 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: monthOffset >= 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: monthOffset >= 0 ? 0.4 : 1 }}>
          <ChevronRight size={18} color="var(--text)" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <BarChart3 size={48} style={{ color: 'var(--text3)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No transactions</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>No data found for {monthLabel}.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--primary-dim)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <TrendingUp size={14} color="var(--primary)" />
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>INCOME</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{formatINR(income)}</div>
            </div>
            <div style={{ background: 'var(--cosmos-50)', border: '1px solid rgba(85,20,255,0.15)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <TrendingDown size={14} color="var(--cosmos-400)" />
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>EXPENSES</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--cosmos-400)' }}>{formatINR(expenses)}</div>
            </div>
          </div>

          {/* Savings Banner */}
          <div className="section" style={{ background: 'linear-gradient(135deg, var(--primary-dim), var(--cyan-dim))', border: '1px solid var(--border2)', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, fontWeight: 700 }}>NET SAVINGS</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 900, color: savings >= 0 ? 'var(--primary)' : 'var(--cosmos-400)', margin: '6px 0' }}>
              {savings >= 0 ? '+' : ''}{formatINR(savings)}
            </div>
            {income > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                Savings rate: <strong style={{ color: savingsRate >= 20 ? 'var(--primary)' : 'var(--cosmos-400)' }}>{savingsRate}%</strong>
                {savingsRate >= 30 ? ' -- Excellent!' : savingsRate >= 15 ? ' -- Good' : ' -- Needs work'}
              </div>
            )}
          </div>

          {/* vs Last Month */}
          {(expenseChangePct !== null || incomeChangePct !== null) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {incomeChangePct !== null && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  {incomeChangePct >= 0 ? <ArrowUpRight size={16} color="var(--primary)" /> : <ArrowDownRight size={16} color="var(--cosmos-400)" />}
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Income <strong style={{ color: incomeChangePct >= 0 ? 'var(--primary)' : 'var(--cosmos-400)' }}>{incomeChangePct >= 0 ? '+' : ''}{incomeChangePct}%</strong> vs last month</span>
                </div>
              )}
              {expenseChangePct !== null && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  {expenseChangePct <= 0 ? <ArrowDownRight size={16} color="var(--primary)" /> : <ArrowUpRight size={16} color="var(--cosmos-400)" />}
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Spend <strong style={{ color: expenseChangePct <= 0 ? 'var(--primary)' : 'var(--cosmos-400)' }}>{expenseChangePct >= 0 ? '+' : ''}{expenseChangePct}%</strong> vs last month</span>
                </div>
              )}
            </div>
          )}

          {/* Budget Adherence */}
          {budgetStats && (
            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border, var(--border-light))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Target size={14} color="var(--primary)" />
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: 1 }}>BUDGET ADHERENCE</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Spent <strong style={{ color: 'var(--text)' }}>{formatINR(budgetStats.actualTotal)}</strong> of a <strong style={{ color: 'var(--text)' }}>{formatINR(budgetStats.budgetedTotal)}</strong> budget over {budgetStats.totalDays} day{budgetStats.totalDays === 1 ? '' : 's'}.
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: budgetStats.overBudgetDays === 0 ? 'var(--primary)' : 'var(--cosmos-400)' }}>
                {budgetStats.overBudgetDays === 0 ? 'Stayed within budget every day' : `Went over budget on ${budgetStats.overBudgetDays} day${budgetStats.overBudgetDays === 1 ? '' : 's'}`}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>AVG DAILY SPEND</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800 }}>{formatINR(avgDailySpend)}</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>HIGHEST SPEND DAY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800 }}>{highestDay.amount > 0 ? `${formatINR(highestDay.amount)} on ${highestDay.day}` : '—'}</div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-head" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Category Breakdown</div>
              {categoryBreakdown.map((cat, i) => {
                const pct = Math.round((cat.amount / maxCatAmount) * 100)
                return (
                  <div key={cat.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{getCategoryIcon(cat.name)}</span> {cat.name}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formatINR(cat.amount)}</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                      <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: getCategoryColor(cat.name), transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top 5 Expenses */}
          {topExpenses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-head" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top 5 Expenses</div>
              {topExpenses.map((t, i) => (
                <div key={t.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface, var(--bg-card))', border: '1px solid var(--border, var(--border-light))', borderRadius: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{getCategoryIcon(t.category)}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.description || t.category || 'Expense'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3, var(--text-tertiary))' }}>
                        {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--cosmos-400)' }}>{formatINR(t.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily Spending Trend */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-head" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Daily Spending</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, padding: '0 4px' }}>
              {dailySpend.map(d => {
                const h = d.amount > 0 ? Math.max((d.amount / maxDailySpend) * 100, 4) : 0
                const isToday = monthOffset === 0 && d.day === new Date().getDate()
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: '100%', minWidth: 4, height: h, borderRadius: '3px 3px 0 0',
                      background: isToday ? 'var(--primary)' : d.amount > 0 ? 'var(--cosmos-400)' : 'var(--bg-secondary)',
                      opacity: d.amount > 0 ? 1 : 0.3, transition: 'height 0.4s ease',
                    }} title={`Day ${d.day}: ${formatINR(d.amount)}`} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3, var(--text-tertiary))', marginTop: 4, padding: '0 4px' }}>
              <span>1</span>
              <span>{Math.ceil(dailySpend.length / 2)}</span>
              <span>{dailySpend.length}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--text3, var(--text-tertiary))' }}>
            {filtered.length} transactions in {monthLabel}
          </div>
        </>
      )}
    </div>
  )
}
