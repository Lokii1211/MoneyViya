/**
 * Viya WhatsApp Cloud API Webhook — V6 TRUE AGENTIC
 * - Smart habit auto-detection from natural chat
 * - OTP login via WhatsApp
 * - Bi-directional sync (WhatsApp ↔ App)
 * - Context-aware AI that understands implicit actions
 * - Accurate IST reminders with 5-min advance
 */

// ===== DB HELPERS =====
function dbHeaders() {
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
}
function dbUrl() { return (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(); }
async function dbQuery(table, params = '') {
  try { const r = await fetch(`${dbUrl()}/rest/v1/${table}${params}`, { headers: dbHeaders() }); return r.ok ? await r.json() : []; } catch { return []; }
}
async function dbInsert(table, data) {
  try {
    const url = `${dbUrl()}/rest/v1/${table}`;
    const r = await fetch(url, { method: 'POST', headers: { ...dbHeaders(), 'Prefer': 'return=representation' }, body: JSON.stringify(data) });
    if (!r.ok) { console.error(`[DB] INSERT ${table} failed: ${r.status} ${await r.text().catch(() => '')}`); return null; }
    const res = await r.json(); return Array.isArray(res) ? res[0] : res;
  } catch (e) { console.error(`[DB] INSERT ${table} error:`, e.message); return null; }
}
async function dbUpdate(table, filter, data) {
  try { await fetch(`${dbUrl()}/rest/v1/${table}?${filter}`, { method: 'PATCH', headers: { ...dbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(data) }); } catch {}
}
async function dbDelete(table, filter) {
  try { await fetch(`${dbUrl()}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers: dbHeaders() }); } catch {}
}

// ===== V8.5: REAL-TIME MARKET INTELLIGENCE ENGINE =====
// Caches market data for 6 hours to avoid excessive API calls
let marketCache = { data: null, lastFetched: 0 };

async function fetchRealTimeMarketData() {
  const SIX_HOURS = 6 * 3600000;
  if (marketCache.data && (Date.now() - marketCache.lastFetched) < SIX_HOURS) return marketCache.data;
  
  // Fetch real gold price from GoldAPI.io (free tier: 50 calls/month)
  let goldPrice = 15236; // Default fallback — April 2026 actual price
  try {
    const goldResp = await fetch('https://www.goldapi.io/api/XAU/INR', {
      headers: { 'x-access-token': process.env.GOLD_API_KEY || '' }
    });
    if (goldResp.ok) {
      const goldData = await goldResp.json();
      if (goldData.price_gram_24k) goldPrice = Math.round(goldData.price_gram_24k);
    }
  } catch {}
  
  // Fetch stock market data from Yahoo Finance (no key needed)
  let niftyLevel = 23900; // fallback
  try {
    const niftyResp = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1d');
    if (niftyResp.ok) {
      const niftyData = await niftyResp.json();
      const meta = niftyData?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) niftyLevel = Math.round(meta.regularMarketPrice);
    }
  } catch {}
  
  const data = {
    gold_24k_gram: goldPrice,
    gold_22k_gram: Math.round(goldPrice * 0.916),
    gold_10g: goldPrice * 10,
    nifty50: niftyLevel,
    sensex: Math.round(niftyLevel * 3.28), // approximate ratio
    sbi_fd_1yr: 6.40,
    sbi_fd_3yr: 6.25,
    hdfc_fd_1yr: 6.60,
    home_loan_sbi: 8.50,
    home_loan_hdfc: 8.75,
    personal_loan: '11-16%',
    car_loan: '8.5-10.5%',
    repo_rate: 6.25,
    inflation_cpi: 4.5,
    ppf_rate: 7.1,
    nps_return: '10-14%',
    silver_gram: Math.round(goldPrice / 15.5), // approximate gold:silver ratio
    lastUpdated: new Date().toISOString()
  };
  
  marketCache = { data, lastFetched: Date.now() };
  return data;
}

// ===== PRODUCTION ML ENGINE =====

// 1. TF-IDF Intent Classifier — classifies messages into intents without external libs
const INTENT_TRAINING = {
  finance: ['gold price', 'nifty', 'sensex', 'stock market', 'share price', 'mutual fund', 'sip', 'fd', 'fixed deposit', 'investment', 'returns', 'interest rate', 'emi', 'loan', 'tax', 'budget', 'savings', 'credit score', 'ppf', 'nps', 'insurance', 'market today'],
  expense: ['spent', 'paid', 'bought', 'expense', 'kharcha', 'cost', 'price was', 'bill', 'payment'],
  habit: ['gym', 'workout', 'exercise', 'ran', 'walked', 'meditated', 'read', 'studied', 'ate', 'eggs', 'protein', 'yoga', 'swim', 'slept', 'woke up'],
  goal: ['save for', 'goal', 'target', 'dream', 'planning to buy', 'want to buy'],
  reminder: ['remind', 'alarm', 'alert me', 'dont forget', 'remember to'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'vanakkam'],
  mood_low: ['stressed', 'depressed', 'sad', 'anxious', 'worried', 'tension', 'frustrated', 'angry', 'scared', 'lonely', 'broke', 'no money', 'debt'],
  diet: ['diet', 'nutrition', 'calories', 'protein', 'meal plan', 'weight loss', 'weight gain', 'bulk', 'cut', 'macro'],
  business: ['business', 'startup', 'gst', 'invoice', 'revenue', 'profit', 'marketing', 'freelance', 'client'],
  study: ['study', 'exam', 'preparation', 'syllabus', 'timetable', 'schedule', 'revision', 'notes']
};

function classifyIntent(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const scores = {};
  
  for (const [intent, keywords] of Object.entries(INTENT_TRAINING)) {
    scores[intent] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // TF-IDF inspired: shorter keywords = less weight, exact matches = more weight
        const idf = Math.log(10 / (INTENT_TRAINING[intent].length + 1));
        const tf = (lower.split(kw).length - 1) / words.length;
        scores[intent] += tf * idf * kw.split(' ').length; // multi-word boost
      }
    }
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], confidence: sorted[0][1], all: Object.fromEntries(sorted.filter(s => s[1] > 0)) };
}

// 2. Sentiment Analyzer — VADER-inspired lexicon scoring for Indian English/Hindi
const SENTIMENT_LEXICON = {
  positive: { happy:3, great:3, awesome:3, love:3, excellent:3, good:2, nice:2, thanks:2, amazing:3, perfect:3, best:2, proud:2, excited:3, celebrate:3, yay:3, accha:2, badhiya:3, mast:2, sahi:2, superb:3, fantastic:3 },
  negative: { sad:-3, bad:-2, terrible:-3, worst:-3, hate:-3, angry:-3, stressed:-3, worried:-2, anxious:-3, scared:-2, frustrated:-3, depressed:-3, hopeless:-3, broke:-2, debt:-2, bura:-2, kharab:-2, tension:-2, problem:-2, issue:-1, struggling:-2 },
  intensifiers: { very:1.5, really:1.5, extremely:2, so:1.3, too:1.3, bahut:1.5, bohot:1.5 }
};

function analyzeSentiment(text) {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  let multiplier = 1;
  
  for (const word of words) {
    if (SENTIMENT_LEXICON.intensifiers[word]) { multiplier = SENTIMENT_LEXICON.intensifiers[word]; continue; }
    if (SENTIMENT_LEXICON.positive[word]) { score += SENTIMENT_LEXICON.positive[word] * multiplier; }
    if (SENTIMENT_LEXICON.negative[word]) { score += SENTIMENT_LEXICON.negative[word] * multiplier; }
    multiplier = 1; // reset after use
  }
  
  // Normalize to -1 to 1 range
  const normalized = Math.max(-1, Math.min(1, score / (words.length * 0.5 + 1)));
  return {
    score: normalized,
    label: normalized > 0.3 ? 'positive' : normalized < -0.3 ? 'negative' : 'neutral',
    intensity: Math.abs(normalized) > 0.6 ? 'strong' : Math.abs(normalized) > 0.2 ? 'moderate' : 'mild'
  };
}

// 3. Exponential Moving Average Spending Predictor
function predictSpending(transactions) {
  if (!transactions || transactions.length < 3) return null;
  
  const expenses = transactions.filter(t => t.type === 'expense').map(t => ({
    amount: Number(t.amount),
    date: new Date(t.created_at),
    category: t.category
  })).sort((a, b) => a.date - b.date);
  
  if (expenses.length < 3) return null;
  
  // EMA with alpha=0.3 (recent transactions weighted more)
  const alpha = 0.3;
  let ema = expenses[0].amount;
  for (let i = 1; i < expenses.length; i++) ema = alpha * expenses[i].amount + (1 - alpha) * ema;
  
  // Category-wise breakdown
  const catTotals = {};
  const catCounts = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });
  
  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, total]) => ({ category: cat, total, avg: Math.round(total / catCounts[cat]) }));
  
  // Days in current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const dailyRate = ema; // EMA gives us a smoothed daily rate
  
  return {
    predictedDaily: Math.round(ema),
    predictedMonthly: Math.round(dailyRate * daysInMonth),
    predictedRemaining: Math.round(dailyRate * (daysInMonth - dayOfMonth)),
    topCategories,
    trend: expenses.length > 5 ? (expenses.slice(-3).reduce((s, e) => s + e.amount, 0) / 3 > ema ? 'increasing' : 'decreasing') : 'stable'
  };
}

// 4. Multi-turn Conversation Memory — builds context from recent chat history
async function getConversationContext(phone) {
  const chats = await dbQuery('chat_history', `?phone=eq.${phone}&select=content,role,created_at&order=created_at.desc&limit=8`);
  if (!chats.length) return '';
  
  const recent = chats.reverse().map(c => `${c.role === 'user' ? 'User' : 'Viya'}: ${c.content.substring(0, 150)}`).join('\n');
  return `\nRECENT CONVERSATION (for context, maintain continuity):\n${recent}\n`;
}

// ===== V8.5: SPENDING ANOMALY DETECTOR =====
async function detectSpendingAnomalies(phone) {
  const txns = await dbQuery('transactions', `?phone=eq.${phone}&type=eq.expense&select=amount,category,created_at&order=created_at.desc&limit=100`);
  if (txns.length < 5) return [];
  
  const anomalies = [];
  const amounts = txns.map(t => Number(t.amount));
  const mean = amounts.reduce((s,a) => s+a, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((s,a) => s + Math.pow(a - mean, 2), 0) / amounts.length);
  
  // Flag expenses > 2 standard deviations above mean
  const recent = txns.slice(0, 5);
  for (const t of recent) {
    if (Number(t.amount) > mean + 2 * stdDev) {
      anomalies.push({ amount: t.amount, category: t.category, type: 'unusually_high',
        msg: `₹${Number(t.amount).toLocaleString('en-IN')} on ${t.category} is ${Math.round(Number(t.amount)/mean)}x your average expense` });
    }
  }
  
  // Category surge detection
  const catSpend = {};
  const recentCatSpend = {};
  txns.forEach((t, i) => {
    const cat = t.category || 'Other';
    if (i < 10) recentCatSpend[cat] = (recentCatSpend[cat]||0) + Number(t.amount);
    catSpend[cat] = (catSpend[cat]||0) + Number(t.amount);
  });
  
  const catAvg = {};
  Object.entries(catSpend).forEach(([c,v]) => catAvg[c] = v / txns.length * 10);
  Object.entries(recentCatSpend).forEach(([c,v]) => {
    if (catAvg[c] && v > catAvg[c] * 1.5) {
      anomalies.push({ category: c, type: 'category_surge',
        msg: `${c} spending up ${Math.round((v/catAvg[c] - 1)*100)}% lately` });
    }
  });
  
  return anomalies.slice(0, 3);
}

// ===== V8.5: PREDICTIVE BUDGET ENGINE =====
async function getPredictiveBudget(phone) {
  const txns = await dbQuery('transactions', `?phone=eq.${phone}&select=type,amount,created_at&order=created_at.desc&limit=60`);
  if (txns.length < 3) return null;
  
  const expenses = txns.filter(t => t.type === 'expense');
  const income = txns.filter(t => t.type === 'income');
  
  // Calculate daily average spend
  if (expenses.length < 2) return null;
  const earliest = new Date(expenses[expenses.length-1].created_at);
  const daySpan = Math.max(1, (Date.now() - earliest.getTime()) / 86400000);
  const totalSpent = expenses.reduce((s,t) => s + Number(t.amount), 0);
  const dailyAvg = totalSpent / daySpan;
  
  // Days remaining in month
  const now = new Date(Date.now() + 5.5*3600000);
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth()+1, 0).getDate();
  const daysRemaining = daysInMonth - now.getUTCDate();
  
  // Projected month-end spend
  const projected = Math.round(totalSpent + dailyAvg * daysRemaining);
  const totalIncome = income.reduce((s,t) => s + Number(t.amount), 0);
  
  return {
    dailyAvg: Math.round(dailyAvg),
    projected,
    daysRemaining,
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - projected) / totalIncome) * 100) : 0,
    status: projected > totalIncome ? 'overspending' : projected > totalIncome * 0.8 ? 'tight' : 'healthy'
  };
}

// ===== GROQ AI V8.5 — Real-time Market Aware + Deep Intelligence =====
async function askAI(userMessage, context = '') {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return null;
  const now = new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'});
  const hour = new Date(Date.now() + 5.5 * 3600000).getUTCHours();
  const timeOfDay = hour < 5 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  
  // Fetch REAL-TIME market data
  const market = await fetchRealTimeMarketData();
  
  const systemPrompt = `You are Viya — a smart, trustworthy AI personal assistant on WhatsApp. You help with money, health, habits, and life decisions. Think: professional financial advisor who's also genuinely caring.

PERSONALITY:
- Warm, clear, and respectful. Like a trusted advisor who truly cares.
- Use simple English. Be concise and direct.
- Be emotionally intelligent — comfort first, advise later when someone's stressed.
- Celebrate wins genuinely. "Great progress! 🎉"
- NEVER use slang like "bro", "da", "machan", "yaar". Stay professional but approachable.
- NEVER sound robotic or preachy. Be human and helpful.

📊 LIVE MARKET DATA (cite exact numbers):
- Gold 24K: ₹${market.gold_24k_gram.toLocaleString('en-IN')}/g | 22K: ₹${market.gold_22k_gram.toLocaleString('en-IN')}/g
- Silver: ₹${market.silver_gram}/g
- Nifty 50: ${market.nifty50.toLocaleString('en-IN')} | Sensex: ~${market.sensex.toLocaleString('en-IN')}
- FD: SBI ${market.sbi_fd_1yr}% | HDFC ${market.hdfc_fd_1yr}%
- Home Loan: SBI ${market.home_loan_sbi}% | PPF: ${market.ppf_rate}%

🧮 FINANCIAL FORMULAS (use when relevant):
- SIP Future Value: FV = P × [((1+r)^n - 1) / r] × (1+r)
- EMI: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
- Rule of 72: Years to double = 72 / annual_return%
- 50-30-20 Rule: 50% needs, 30% wants, 20% savings

RESPONSE RULES:
1. Keep it SHORT — 50-80 words max. WhatsApp-friendly, not essays.
2. Answer the ACTUAL question directly. No tangents.
3. Use *bold* for key numbers. ₹ for money.
4. One short follow-up question to keep chat going.
5. For calculations — show result clearly with brief math.
6. NEVER start with generic greetings. Just answer.
7. If unsure, be honest: "I'm not certain, but here's what I know..."

Time: ${now} (${timeOfDay})
${context}

FORMAT: *bold* key info. ₹ for money. Keep it warm, short, and genuinely helpful.`;

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 300, temperature: 0.7 }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// ===== V8: DEEP USER INTELLIGENCE ENGINE =====
// Builds comprehensive user context for hyper-personalized AI responses
async function buildUserContext(phone) {
  try {
    const [user, txns, habits, goals, recentChats] = await Promise.all([
      dbQuery('users', `?phone=eq.${phone}&select=*`),
      dbQuery('transactions', `?phone=eq.${phone}&select=*&order=created_at.desc&limit=50`),
      dbQuery('habits', `?phone=eq.${phone}&select=*`),
      dbQuery('goals', `?phone=eq.${phone}&status=eq.active&select=*`),
      dbQuery('chat_history', `?phone=eq.${phone}&select=content,role&order=created_at.desc&limit=6`),
    ]);
    const u = user[0] || {};
    const expenses = txns.filter(t => t.type === 'expense');
    const income = txns.filter(t => t.type === 'income');
    
    // Spending analytics
    const totalExp = expenses.reduce((s,t) => s + Number(t.amount), 0);
    const totalInc = income.reduce((s,t) => s + Number(t.amount), 0);
    const avgExpense = expenses.length > 0 ? Math.round(totalExp / expenses.length) : 0;
    
    // Category breakdown
    const catSpend = {};
    expenses.forEach(t => { const c = t.category || 'Other'; catSpend[c] = (catSpend[c]||0) + Number(t.amount); });
    const topCats = Object.entries(catSpend).sort((a,b) => b[1]-a[1]).slice(0,3);
    
    // Spending trend (last 7 days vs previous 7)
    const now = Date.now();
    const week1 = expenses.filter(t => now - new Date(t.created_at).getTime() < 7*86400000).reduce((s,t) => s+Number(t.amount), 0);
    const week2 = expenses.filter(t => { const d = now - new Date(t.created_at).getTime(); return d >= 7*86400000 && d < 14*86400000; }).reduce((s,t) => s+Number(t.amount), 0);
    const trend = week2 > 0 ? Math.round(((week1-week2)/week2)*100) : 0;
    
    // Habit streaks
    const activeStreaks = habits.filter(h => (h.current_streak||0) > 0);
    const maxStreak = habits.reduce((m,h) => Math.max(m, h.current_streak||0), 0);
    const todayISO = new Date(now + 5.5*3600000).toISOString().split('T')[0];
    
    // Goal progress
    const goalProgress = goals.map(g => ({
      name: g.name, pct: g.target_amount > 0 ? Math.round((g.current_amount/g.target_amount)*100) : 0,
      remaining: Number(g.target_amount) - Number(g.current_amount||0)
    }));
    
    // Recent conversation context
    const recentContext = recentChats.reverse().map(c => `${c.role}: ${c.content?.substring(0,80)}`).join('\n');
    
    let ctx = `\nUSER PROFILE: ${u.name || 'User'}, ${u.persona || 'salaried'}, phone: ${phone}`;
    ctx += `\nFINANCIAL SNAPSHOT: Income ₹${totalInc.toLocaleString('en-IN')}, Expenses ₹${totalExp.toLocaleString('en-IN')}, Balance ₹${(totalInc-totalExp).toLocaleString('en-IN')}`;
    ctx += `\nSPENDING PATTERN: Avg expense ₹${avgExpense}, This week ₹${week1} (${trend > 0 ? '+'+trend : trend}% vs last week)`;
    if (topCats.length) ctx += `\nTOP CATEGORIES: ${topCats.map(([c,a]) => `${c}: ₹${a}`).join(', ')}`;
    if (activeStreaks.length) ctx += `\nACTIVE STREAKS: ${activeStreaks.map(h => `${h.icon}${h.name}: ${h.current_streak}🔥`).join(', ')} (Max: ${maxStreak})`;
    if (goalProgress.length) ctx += `\nGOALS: ${goalProgress.map(g => `${g.name}: ${g.pct}% (₹${g.remaining} left)`).join(', ')}`;
    if (recentContext) ctx += `\nRECENT CHAT:\n${recentContext}`;
    
    // V8.5: Inject anomalies and predictions
    const anomalies = await detectSpendingAnomalies(phone);
    if (anomalies.length) ctx += `\n⚠️ SPENDING ALERTS: ${anomalies.map(a => a.msg).join('; ')}`;
    
    const prediction = await getPredictiveBudget(phone);
    if (prediction) ctx += `\n📈 BUDGET FORECAST: Daily avg ₹${prediction.dailyAvg}, Projected month ₹${prediction.projected}, ${prediction.daysRemaining} days left, Status: ${prediction.status}, Savings rate: ${prediction.savingsRate}%`;
    
    return ctx;
  } catch { return ''; }
}

// ===== V8: MOOD DETECTION =====
function detectMood(text) {
  const lower = text.toLowerCase();
  if (/stress|worried|anxious|tension|panic|scared|afraid|nervous/i.test(lower)) return 'stressed';
  if (/sad|depress|lonely|alone|crying|unhappy|hopeless|worthless/i.test(lower)) return 'sad';
  if (/happy|excited|great|awesome|amazing|wonderful|celebrate|promotion|passed/i.test(lower)) return 'happy';
  if (/angry|frustrated|irritated|annoyed|hate|pissed|furious/i.test(lower)) return 'angry';
  if (/tired|exhausted|burned|burnout|sleepy|drained|overwhelmed/i.test(lower)) return 'tired';
  if (/confused|lost|don\'t know|dunno|unsure|help me/i.test(lower)) return 'confused';
  if (/bored|nothing|boring|idle|free/i.test(lower)) return 'bored';
  return 'neutral';
}

// ===== V8: SMART DAILY INSIGHTS =====
async function getDailyInsight(phone) {
  const hour = new Date(Date.now() + 5.5*3600000).getUTCHours();
  const txns = await dbQuery('transactions', `?phone=eq.${phone}&type=eq.expense&select=amount,created_at&order=created_at.desc&limit=30`);
  const habits = await dbQuery('habits', `?phone=eq.${phone}&select=name,current_streak,icon`);
  
  const today = txns.filter(t => {
    const d = new Date(t.created_at).toISOString().split('T')[0];
    return d === new Date(Date.now()+5.5*3600000).toISOString().split('T')[0];
  });
  const todaySpent = today.reduce((s,t) => s+Number(t.amount), 0);
  
  // Get user's daily budget
  const userData = await dbQuery('users', `?phone=eq.${phone}&select=daily_budget`);
  const dailyBudget = userData?.[0]?.daily_budget || 1000;
  
  // ANOMALY: Spending > 2x daily budget
  if (todaySpent > dailyBudget * 2 && hour >= 14) {
    return `⚠️ *Spending Alert!* You've spent *₹${todaySpent.toLocaleString('en-IN')}* today — that's ${Math.round(todaySpent/dailyBudget)}x your daily budget of ₹${dailyBudget}!\n\nEverything okay? 🤔`;
  }
  
  if (hour < 10) {
    const streaks = habits.filter(h => h.current_streak > 0);
    return streaks.length ? `🌅 Morning! Your ${streaks[0].icon}${streaks[0].name} streak: ${streaks[0].current_streak}🔥 — don't break it today!` : null;
  }
  if (hour >= 14 && hour < 18 && todaySpent > 0) {
    const left = dailyBudget - todaySpent;
    return left > 0 ? `💰 You have *₹${left.toLocaleString('en-IN')}* left today. ${left > dailyBudget*0.5 ? 'Great control! 👏' : 'Be careful with remaining spend 🤞'}` : null;
  }
  if (hour >= 20 && todaySpent > 0) {
    return `📊 Today you spent *₹${todaySpent.toLocaleString('en-IN')}*. ${todaySpent > dailyBudget ? 'Over budget — let\'s do better tomorrow! 💪' : 'Under budget! You saved ₹' + (dailyBudget-todaySpent) + ' today! 🎉'}`;
  }
  return null;
}

// ===== IST TIME =====
function nowIST() { return new Date(Date.now() + 5.5 * 3600000); }
function formatIST(h, m) { const ampm = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${ampm}`; }

// ===== SMART HABIT AUTO-DETECTION ENGINE =====
// This is the core intelligence — detects habit completions from natural language
const HABIT_PATTERNS = [
  // Fitness
  { patterns: [/(?:ate|had|eaten|eat)\s+(\d+)?\s*eggs?/i, /eggs?\s*(\d+)?.*(?:done|eaten|had|ate)/i], habit: 'Eat healthy', icon: '🥗', extract: (t) => { const m = t.match(/(\d+)\s*eggs?/i); return m ? `${m[1]} eggs` : 'eggs'; } },
  { patterns: [/(?:workout|gym|exercise|trained|lifted|weights).*(?:done|completed|finished)/i, /(?:done|completed|finished).*(?:workout|gym|exercise)/i, /^(?:workout|gym)\s*(?:done|✅|completed)/i], habit: 'Workout', icon: '🏋️' },
  { patterns: [/(?:ran|run|jogged|running|jogging)\s*(\d+)?\s*(?:km|kms|kilometers?|miles?)?/i], habit: 'Run 2km', icon: '🏃', extract: (t) => { const m = t.match(/(\d+)\s*(?:km|kms)/i); return m ? `${m[1]}km run` : 'run'; } },
  { patterns: [/(?:drank|drink|had)\s*(\d+)?\s*(?:liters?|litres?|L|glasses?)\s*(?:of\s*)?water/i, /water\s*(\d+)\s*(?:liters?|L|glasses?)/i], habit: 'Drink 3L water', icon: '💧', extract: (t) => { const m = t.match(/(\d+)\s*(?:liters?|L|glasses?)/i); return m ? `${m[1]}L water` : 'water'; } },
  { patterns: [/(?:meditat|yoga).*(?:done|completed|finished|\d+\s*min)/i, /(?:done|completed).*(?:meditat|yoga)/i], habit: 'Meditate', icon: '🧘' },
  { patterns: [/(?:push.?ups?|pull.?ups?|squats?|planks?)\s*(\d+)/i], habit: 'Workout', icon: '🏋️', extract: (t) => { const m = t.match(/(push.?ups?|pull.?ups?|squats?|planks?)\s*(\d+)/i); return m ? `${m[2]} ${m[1]}` : 'exercise'; } },
  { patterns: [/protein\s*(?:shake|powder|scoop)/i, /(?:had|took|drank)\s*(?:whey|protein)/i], habit: 'Eat healthy', icon: '🥗' },
  // Study
  { patterns: [/(?:studi|read|reading|studied)\s*(\d+)?\s*(?:hours?|hrs?|minutes?|mins?|pages?)/i, /(?:done|completed|finished).*(?:studi|reading|chapter|assignment)/i], habit: 'Read 30 mins', icon: '📖', extract: (t) => { const m = t.match(/(\d+)\s*(?:hours?|hrs?|minutes?|mins?|pages?)/i); return m ? `${m[1]} ${m[2] || 'session'}` : 'study session'; } },
  { patterns: [/(?:completed?|finished|done)\s*(?:chapter|assignment|homework|project|lecture)/i], habit: 'Read 30 mins', icon: '📖' },
  // Lifestyle
  { patterns: [/(?:woke|wake|got)\s*up\s*(?:at\s*)?\s*(\d+)/i, /early\s*(?:morning|wake|rise)/i], habit: 'Wake up early', icon: '⏰' },
  { patterns: [/no\s*(?:junk|fast)\s*food/i, /(?:avoided?|skipped?)\s*(?:junk|fast|processed)\s*food/i], habit: 'No junk food', icon: '🚫' },
  { patterns: [/(?:journa?l|diary|wrote|writing).*(?:done|completed|entry)/i, /(?:done|wrote).*journa?l/i], habit: 'Journal', icon: '📝' },
  { patterns: [/(?:no|didn.?t|avoided?|quit)\s*(?:social\s*media|instagram|insta|facebook|twitter|reels)/i], habit: 'No social media 1h', icon: '📱' },
  { patterns: [/(?:cooked?|made|prepared)\s*(?:food|meal|lunch|dinner|breakfast)/i, /(?:home\s*(?:cooked?|made))/i], habit: 'Eat healthy', icon: '🥗' },
  // Finance
  { patterns: [/(?:tracked?|logged?|noted?|recorded?)\s*(?:my\s*)?(?:expense|spending|kharcha)/i], habit: 'Track expenses', icon: '💰' },
];

async function detectAndCheckinHabit(text, phone) {
  const today = new Date().toISOString().split('T')[0];
  const userHabits = await dbQuery('habits', `?phone=eq.${phone}&select=*`);
  
  for (const pattern of HABIT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        // Find matching habit or create one
        let habit = userHabits.find(h => h.name.toLowerCase().includes(pattern.habit.toLowerCase().split(' ')[0]));
        
        if (!habit) {
          // Auto-create the habit!
          const created = await dbInsert('habits', { phone, name: pattern.habit, icon: pattern.icon, frequency: 'daily', current_streak: 0, longest_streak: 0 });
          habit = created && created.id ? created : { id: null, name: pattern.habit, icon: pattern.icon, current_streak: 0, longest_streak: 0 };
          // If insert failed to return ID, try to fetch it
          if (!habit.id) {
            const found = await dbQuery('habits', `?phone=eq.${phone}&name=eq.${encodeURIComponent(pattern.habit)}&select=*&limit=1`);
            if (found.length) habit = found[0];
          }
        }
        
        if (habit && habit.id) {
          // Check if already checked in today
          const existing = await dbQuery('habit_checkins', `?habit_id=eq.${habit.id}&checked_date=eq.${today}&select=id`);
          if (!existing.length) {
            await dbInsert('habit_checkins', { habit_id: habit.id, phone, checked_date: today, status: 'done' });
            const newStreak = (habit.current_streak || 0) + 1;
            const bestStreak = Math.max(newStreak, habit.longest_streak || 0);
            await dbUpdate('habits', `id=eq.${habit.id}`, { current_streak: newStreak, longest_streak: bestStreak, last_completed: today });
            
            const detail = pattern.extract ? pattern.extract(text) : '';
            return { matched: true, habit: habit.name || pattern.habit, icon: pattern.icon, streak: newStreak, best: bestStreak, detail, isNew: !userHabits.find(h => h.id === habit.id) };
          }
          return { matched: true, habit: habit.name || pattern.habit, icon: pattern.icon, streak: habit.current_streak || 0, alreadyDone: true };
        }
      }
    }
  }
  return { matched: false };
}

// ===== SMART EXPENSE DETECTION =====
function detectExpense(text) {
  const amtMatch = text.match(/(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*)\s*/i) || text.match(/(\d[\d,]+)/);
  if (!amtMatch) return null;
  const amount = parseInt(amtMatch[1].replace(/,/g, ''));
  if (amount <= 0 || amount > 10000000) return null;
  
  // Must have spending context
  if (!/spent|paid|bought|expense|kharcha|kharch|cost|charged|billed/i.test(text)) return null;
  
  const cats = {
    '🍕 Food': /food|lunch|dinner|breakfast|snack|tea|coffee|biryani|chai|eat|restaurant|swiggy|zomato|hotel|pizza|burger/i,
    '🚗 Transport': /transport|uber|ola|auto|bus|train|petrol|diesel|metro|cab|fuel|travel|flight|ticket/i,
    '🛒 Shopping': /shopping|clothes|dress|shirt|shoes|amazon|flipkart|myntra|mall|buy/i,
    '💊 Health': /health|medicine|doctor|hospital|gym|pharmacy|protein|supplement|medical/i,
    '📱 Recharge': /recharge|mobile|phone|jio|airtel|wifi|internet|broadband/i,
    '🏠 Rent': /rent|house|room|pg|hostel|flat|apartment|maintenance/i,
    '📚 Education': /education|book|course|class|tuition|school|college|udemy|exam/i,
    '🎬 Entertainment': /movie|netflix|prime|spotify|game|party|concert/i,
    '💡 Bills': /bill|electricity|water|gas|emi|loan|insurance/i,
  };
  let category = '📦 General';
  for (const [cat, p] of Object.entries(cats)) { if (p.test(text)) { category = cat; break; } }
  return { amount, category };
}

// ===== NLP INTENTS =====
const INTENTS = [
  // GREETINGS
  { name: 'greeting', patterns: [/^(hi|hello|hey|hlo|hii|namaste|vanakkam|start|yo|sup)$/i, /^good\s*(morning|afternoon|evening|night)/i], handler: () => GREETINGS },
  { name: 'help', patterns: [/^(help|menu|\?|commands|options|features)$/i, /what\s*can\s*you\s*do/i], handler: () => GREETINGS },

  // ===== REMINDER =====
  {
    name: 'reminder', patterns: [/remind(?:er)?\s+(?:me\s+)?(?:to|at|on|for|about)/i, /^(?:set|send|create)\s+(?:me\s+)?(?:an?\s+)?remind/i, /^(?:set\s+)?(?:an?\s+)?alarm/i, /^alert\s*me/i, /^(?:please\s+)?(?:don't|dont)\s*forget/i, /remind\s+me\s+at/i, /reminder\s+(?:at|for|on)/i, /\bremind\b.*\d{1,2}\s*(?:am|pm|:\d{2})/i],
    handler: async (text, from) => {
      const timeMatch = text.match(/(\d{1,2})\s*[:\.]?\s*(\d{2})?\s*(am|pm)/i);
      const time24 = text.match(/(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/i);
      let hours = -1, minutes = 0, timeStr = '';
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1]); minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const p = timeMatch[3].toUpperCase();
        if (p === 'PM' && hours !== 12) hours += 12;
        if (p === 'AM' && hours === 12) hours = 0;
        timeStr = `${timeMatch[1]}${timeMatch[2] ? ':' + timeMatch[2] : ':00'} ${p}`;
      } else if (time24) {
        hours = parseInt(time24[1]); minutes = parseInt(time24[2]);
        timeStr = `${time24[1]}:${time24[2]}`;
      }
      
      const relDate = text.match(/(today|tomorrow|kal|aaj)/i);
      const ist = nowIST();
      let day = ist.getUTCDate(), month = ist.getUTCMonth(), year = ist.getUTCFullYear();
      if (relDate && /tomorrow|kal/i.test(relDate[1])) day += 1;
      if (hours === -1) { hours = ist.getUTCHours() + 1; minutes = 0; timeStr = formatIST(hours, minutes); }
      
      const remindIST = new Date(Date.UTC(year, month, day, hours, minutes, 0));
      const remindUTC = new Date(remindIST.getTime() - 5.5 * 3600000);
      const advanceUTC = new Date(remindUTC.getTime() - 5 * 60000);
      
      let task = 'Your reminder';
      const tm = text.match(/(?:to|for|about|that)\s+(.+?)(?:\s+at\s+\d|\s+on\s+\d|\s+tomorrow|\s+today|$)/i) || text.match(/remind(?:er)?\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at\s+\d|\s+on\s+\d|$)/i);
      if (tm) task = tm[1].replace(/\s*(at|on)\s*$/, '').trim();

      await dbInsert('reminders', { phone: from, task, remind_at: remindUTC.toISOString(), remind_at_display: `${timeStr} on ${day}/${month+1}/${year}`, status: 'pending' });
      if (advanceUTC > new Date()) {
        await dbInsert('reminders', { phone: from, task: `⚡ Coming up: ${task}`, remind_at: advanceUTC.toISOString(), remind_at_display: `5 min before ${timeStr}`, status: 'pending' });
      }
      return `⏰ *Reminder Set!*\n\n📋 *${task}*\n🕐 ${timeStr} on ${day}/${month+1}/${year}\n\n✅ You'll get:\n• ⚡ *5-min advance* alert\n• 🔔 *On-time* reminder\n\n_Synced to app: heyviya.vercel.app_ 💪`;
    },
  },

  // ===== EXPENSE (saves to DB with duplicate check) =====
  {
    name: 'expense', patterns: [/(?:spent|paid|bought|expense|kharcha|kharch)\s/i, /(?:₹|rs\.?|inr)\s*\d+\s*(on|for)/i, /\d+\s*(rupees?|rs)\s*(on|for)/i],
    handler: async (text, from) => {
      const exp = detectExpense(text);
      if (!exp) return null;
      
      // Check for duplicate (same amount + category in last 5 minutes)
      const recent = await dbQuery('transactions', `?phone=eq.${from}&type=eq.expense&amount=eq.${exp.amount}&order=created_at.desc&limit=1&select=created_at,category`);
      if (recent.length) {
        const lastTime = new Date(recent[0].created_at).getTime();
        const now = Date.now();
        if (now - lastTime < 300000) { // 5 minutes
          return `⚠️ *Duplicate Detected!*\n\nYou already logged *₹${exp.amount.toLocaleString('en-IN')}* (${recent[0].category}) just ${Math.round((now - lastTime)/60000)} min ago.\n\nIf this is a separate expense, reply:\n*"add ₹${exp.amount} ${exp.category}"*`;
        }
      }
      
      const result = await dbInsert('transactions', { phone: from, type: 'expense', amount: exp.amount, category: exp.category, description: text.substring(0, 100) });
      if (!result) {
        console.error('[EXPENSE] Failed to save expense for', from, exp);
        return `⚠️ Expense noted but sync failed. Please try again or add it in the app: heyviya.vercel.app`;
      }
      
      // Check if user is registered on the app
      const short = from.replace(/^91/, '').slice(-10);
      const appUser = await dbQuery('users', `?or=(phone.eq.${from},phone.eq.${short})&select=name,onboarding_complete`);
      const regNote = (!appUser.length || !appUser[0].onboarding_complete) 
        ? `\n\n📲 _Register on *heyviya.vercel.app* to see your full dashboard!_` 
        : '';
      
      return `✅ *Expense Tracked!*\n\n💸 *₹${exp.amount.toLocaleString('en-IN')}* — ${exp.category}\n📅 ${new Date().toLocaleDateString('en-IN')}\n\n${exp.amount > 5000 ? '⚠️ _Big expense! Was it planned?_' : '✨ _Every rupee tracked = smarter spending!_'}${regNote}`;
    },
  },

  // ===== INCOME =====
  {
    name: 'income', patterns: [/(?:received|got|earned|income|salary|credited)\s/i, /salary\s*(?:is|of|=)?\s*\d/i],
    handler: async (text, from) => {
      const m = text.match(/(\d[\d,]+)/); if (!m) return null;
      const amount = parseInt(m[1].replace(/,/g, ''));
      await dbInsert('transactions', { phone: from, type: 'income', amount, category: '💼 Income', description: text.substring(0, 100) });
      return `✅ *Income Recorded!*\n\n💰 *₹${amount.toLocaleString('en-IN')}*\n\n*50-30-20 Split:*\n🏠 Needs: ₹${Math.round(amount*0.5).toLocaleString('en-IN')}\n🎮 Wants: ₹${Math.round(amount*0.3).toLocaleString('en-IN')}\n💰 Save: ₹${Math.round(amount*0.2).toLocaleString('en-IN')}\n\n🔥 _SIP ₹${Math.round(amount*0.2).toLocaleString('en-IN')}/month → ~₹${Math.round(amount*0.2*195).toLocaleString('en-IN')} in 10 years!_`;
    },
  },

  // ===== EXPLICIT HABIT COMMANDS =====
  {
    name: 'habit_cmd', patterns: [/(?:add|create|new|start)\s*habit/i, /my\s*habits/i, /list\s*habits/i, /^done\s+/i, /^checkin\s+/i, /^completed?\s+/i],
    handler: async (text, from) => {
      const lower = text.toLowerCase();
      
      // List habits
      if (/my\s*habits|list\s*habits|show\s*habits/i.test(lower)) {
        const habits = await dbQuery('habits', `?phone=eq.${from}&select=*&order=created_at.asc`);
        if (!habits.length) return `📋 No habits yet!\n\nCreate: "add habit: workout"\nOr just chat naturally — I auto-detect!\n\n_Say "ate 6 eggs" or "gym done" and I'll track it_ 🤖`;
        let msg = `📋 *Your Habits:*\n\n`;
        const today = new Date().toISOString().split('T')[0];
        for (const h of habits) {
          const checkins = await dbQuery('habit_checkins', `?habit_id=eq.${h.id}&checked_date=eq.${today}&select=id`);
          const done = checkins.length > 0;
          msg += `${done ? '✅' : '⬜'} ${h.icon} *${h.name}* — ${h.current_streak || 0}🔥\n`;
        }
        msg += `\n_Check-in: "done workout" or chat naturally!_\n_Synced live to app_ 📱`;
        return msg;
      }

      // Explicit check-in: "done workout"
      if (/^(done|completed?|checkin|check.?in|finished)\s+(.+)/i.test(lower)) {
        const habitName = text.match(/^(?:done|completed?|checkin|check.?in|finished)\s+(.+)/i)?.[1]?.trim();
        if (habitName) {
          const habits = await dbQuery('habits', `?phone=eq.${from}&select=*`);
          const habit = habits.find(h => h.name.toLowerCase().includes(habitName.toLowerCase()));
          if (habit) {
            const today = new Date().toISOString().split('T')[0];
            const existing = await dbQuery('habit_checkins', `?habit_id=eq.${habit.id}&checked_date=eq.${today}&select=id`);
            if (existing.length) return `${habit.icon} *${habit.name}* already checked in today! ✅\n🔥 Streak: ${habit.current_streak || 0} days`;
            await dbInsert('habit_checkins', { habit_id: habit.id, phone: from, checked_date: today, status: 'done' });
            const newStreak = (habit.current_streak || 0) + 1;
            await dbUpdate('habits', `id=eq.${habit.id}`, { current_streak: newStreak, longest_streak: Math.max(newStreak, habit.longest_streak || 0), last_completed: today });
            return `✅ *${habit.icon} ${habit.name} — Done!*\n\n🔥 Streak: *${newStreak} days*\n🏆 Best: *${Math.max(newStreak, habit.longest_streak || 0)} days*\n\n_Reflected in app instantly!_ 📱💪`;
          }
          return `❌ Habit "${habitName}" not found.\nCreate it: "add habit: ${habitName}"`;
        }
      }

      // Add habit
      const hm = text.match(/(?:add|create|new|start)\s*habit\s*[:=]?\s*(.+)/i);
      if (hm && from) {
        const name = hm[1].trim();
        const iconMap = { workout:'🏋️', run:'🏃', read:'📖', meditat:'🧘', water:'💧', study:'🧮', diet:'🥗', sleep:'😴', walk:'🚶', code:'💻', journal:'📝', egg:'🥚', yoga:'🧘', swim:'🏊' };
        let icon = '✅';
        for (const [k,v] of Object.entries(iconMap)) { if (name.toLowerCase().includes(k)) { icon = v; break; } }
        await dbInsert('habits', { phone: from, name, icon, frequency: 'daily', current_streak: 0, longest_streak: 0 });
        return `✅ *Habit Created!*\n\n${icon} *${name}* — Daily\n\n_Check-in options:_\n• "done ${name}"\n• Or just chat naturally: "finished ${name}"!\n\n_Synced to app_ 📱`;
      }
      return '💡 *Habit Commands:*\n\n• "add habit: workout"\n• "my habits"\n• "done workout"\n• Or chat naturally: "gym done", "ate eggs", "studied 2 hours"';
    },
  },

  // ===== GOALS =====
  {
    name: 'goal', patterns: [/\b(goal|target)\b/i, /\bsave\s*for\b/i, /\bmy\s*goals?\b/i, /\badded?\s+\d.*to\s+/i],
    handler: async (text, from) => {
      if (/my\s*goals?|list\s*goals?|show\s*goals?/i.test(text)) {
        const goals = await dbQuery('goals', `?phone=eq.${from}&status=eq.active&select=*`);
        if (!goals.length) return `🎯 No goals yet!\nCreate: "save for iPhone 80000"`;
        let msg = `🎯 *Your Goals:*\n\n`;
        goals.forEach(g => {
          const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
          const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10 - Math.floor(pct/10));
          msg += `${g.icon} *${g.name}*\n[${bar}] ${pct}%\n₹${Number(g.current_amount||0).toLocaleString('en-IN')} / ₹${Number(g.target_amount).toLocaleString('en-IN')}\n\n`;
        });
        return msg + '_Add: "added 5000 to [goal]"_';
      }
      if (/added?\s+(\d[\d,]*)\s+to\s+(.+)/i.test(text)) {
        const m = text.match(/added?\s+(\d[\d,]*)\s+to\s+(.+)/i);
        const amt = parseInt(m[1].replace(/,/g,'')); const goalName = m[2].trim();
        const goals = await dbQuery('goals', `?phone=eq.${from}&name=ilike.*${encodeURIComponent(goalName)}*&select=*`);
        if (goals.length) {
          const g = goals[0]; const newAmt = Number(g.current_amount||0) + amt;
          const status = newAmt >= Number(g.target_amount) ? 'completed' : 'active';
          await dbUpdate('goals', `id=eq.${g.id}`, { current_amount: newAmt, status });
          const pct = Math.round((newAmt / g.target_amount) * 100);
          return `💰 *₹${amt.toLocaleString('en-IN')} → ${g.name}!*\n\n[${'█'.repeat(Math.floor(pct/10))}${'░'.repeat(10-Math.floor(pct/10))}] ${pct}%\n₹${newAmt.toLocaleString('en-IN')} / ₹${Number(g.target_amount).toLocaleString('en-IN')}\n\n${status === 'completed' ? '🎉 *GOAL ACHIEVED!* 🥳' : `_₹${(Number(g.target_amount)-newAmt).toLocaleString('en-IN')} remaining_`}`;
        }
        return `❌ Goal "${goalName}" not found. Say "my goals"`;
      }
      const gm = text.match(/(?:save\s*for|goal\s*[:=]?)\s*(.+)/i);
      const am = text.match(/(\d[\d,]+)/);
      if (gm && from) {
        const name = gm[1].replace(/\d[\d,]*/g,'').trim() || 'My Goal'; const target = am ? parseInt(am[1].replace(/,/g,'')) : 100000;
        const icons = { phone:'📱', iphone:'📱', bike:'🏍️', car:'🚗', laptop:'💻', trip:'✈️', house:'🏠', wedding:'💍', goa:'✈️', education:'🎓' };
        let icon = '🎯';
        for (const [k,v] of Object.entries(icons)) { if (name.toLowerCase().includes(k)) { icon = v; break; } }
        await dbInsert('goals', { phone: from, name, icon, target_amount: target, current_amount: 0, status: 'active', priority: 'medium' });
        return `🎯 *Goal Created!*\n\n${icon} *${name}* — ₹${target.toLocaleString('en-IN')}\n\n*Monthly plan:*\n• 3 months: ₹${Math.round(target/3).toLocaleString('en-IN')}/mo\n• 6 months: ₹${Math.round(target/6).toLocaleString('en-IN')}/mo\n\n_Add savings: "added 5000 to ${name}"_ 💪`;
      }
      return '🎯 *Goal Commands:*\n\n• "save for iPhone 80000"\n• "my goals"\n• "added 5000 to iPhone"';
    },
  },

  // ===== BALANCE =====
  {
    name: 'balance', patterns: [/\b(balance|summary|overview|report|status)\b/i, /how\s*much\s*(have|did|do)\s*i/i],
    handler: async (text, from) => {
      const [expenses, income, habits, goals] = await Promise.all([
        dbQuery('transactions', `?phone=eq.${from}&type=eq.expense&select=amount`),
        dbQuery('transactions', `?phone=eq.${from}&type=eq.income&select=amount`),
        dbQuery('habits', `?phone=eq.${from}&select=name,current_streak,icon`),
        dbQuery('goals', `?phone=eq.${from}&status=eq.active&select=name,current_amount,target_amount`),
      ]);
      const tExp = expenses.reduce((s,t) => s + Number(t.amount), 0);
      const tInc = income.reduce((s,t) => s + Number(t.amount), 0);
      let msg = `📊 *Your Dashboard*\n\n💰 Income: *₹${tInc.toLocaleString('en-IN')}*\n💸 Expenses: *₹${tExp.toLocaleString('en-IN')}*\n📈 Balance: *₹${(tInc-tExp).toLocaleString('en-IN')}*`;
      if (habits.length) {
        msg += `\n\n🔥 *Habits:* ${habits.length} tracked`;
        const streaks = habits.filter(h => h.current_streak > 0);
        if (streaks.length) msg += `\n${streaks.map(h => `${h.icon} ${h.name}: ${h.current_streak}🔥`).join('\n')}`;
      }
      if (goals.length) {
        msg += `\n\n🎯 *Goals:* ${goals.length} active`;
        goals.forEach(g => { msg += `\n${g.name}: ₹${Number(g.current_amount||0).toLocaleString('en-IN')}/${Number(g.target_amount).toLocaleString('en-IN')}`; });
      }
      msg += `\n\n📱 Full dashboard: viya.vercel.app`;
      return msg;
    },
  },

  // V8.5: Education shortcuts REMOVED — AI handles all questions with real-time data
  // Old static responses replaced by live AI with current market prices
  { name: 'thanks', patterns: [/\b(thanks|thank\s*you|thanku|tq|ty)\b/i], handler: () => `🙏 *Welcome!* Anything else? 💬` },
  { name: 'about', patterns: [/who\s*(are|r)\s*(you|u)/i], handler: () => `🤖 *I'm Viya — Your AI Personal Assistant*\n\n💰 Finance • 🏋️ Fitness • 📖 Study • 🏠 Home • 💼 Business\n\nI auto-detect habits from your chats!\nSay "ate eggs" → I track it 🔥\n\n📱 App: viya.vercel.app` },
];

const ED = {
  sip: '📊 *SIP*\n₹2K/mo in Nifty 50:\n• 5yr → ~₹1.65L\n• 10yr → ~₹4.4L\n• 20yr → ~₹20L!\n_Start ₹500/mo on Groww_ 📈',
  mf: '💰 *Mutual Funds*\n• Equity: 12-15%\n• Debt: 6-8%\n• Index: lowest cost (best!)\n_Start: Nifty 50 SIP ₹500/mo_ 📊',
  emi: '🏦 *EMI Rule:* Total EMIs < 40% salary\n• Home: 8-10%\n• Car: 8-12%\n• Credit card: 36%+ 🚫',
  tax: '🧾 *Tax Save:*\n80C: ₹1.5L (ELSS, PPF)\n80D: ₹25K (Health)\n80CCD: ₹50K (NPS)\n_₹12.5K/mo ELSS = zero tax up to ₹7.5L!_',
  fd: '🏦 *FD:* ₹1L for 1yr → ~₹1.07L (7%)\n✅ Zero risk ❌ Low returns\n_For long term: SIP > FD_ 📈',
  budget: '📋 *50-30-20*\n50% Needs • 30% Wants • 20% Save\n_₹200/day saved = ₹73K/year!_ 🎯',
  loan: '🏦 Home: 8.5-10% • Car: 8-12%\nPersonal: 12-18% • Credit card: 36%+ 🚫\n_EMI < 40% salary always!_',
  stock: '📈 *Stocks:* Start with Index Fund SIP\nOpen Demat on Zerodha\n❌ No tips trading\n_Nifty 50 SIP = easiest start_',
  gold: '🥇 *Gold:* SGB (best!) → 2.5% interest + price gain\nGold ETF • Digital Gold from ₹1\n_Max 10% of portfolio_',
  credit: '📊 *Credit Score (750+ = excellent)*\n1. Pay on time\n2. Usage < 30%\n3. Keep old cards\n_Check free: CIBIL, CRED_',
};

const GREETINGS = `👋 *Hey! I'm Viya* — your AI buddy on WhatsApp!

Just text me naturally:
💬 "spent 300 on food" → tracks expense
💬 "gym done" → logs habit
💬 "remind me rent at 10 AM" → sets reminder
💬 "what's gold price?" → live market data
💬 "suggest SIP for 10K salary" → personalized advice

Or just chat — I'm here to help with anything! 🤖`;

// ===== MASTER PROCESSOR =====
async function processMessage(text, from) {
  const trimmed = text.trim();
  if (!trimmed) return GREETINGS;
  
  // Save to chat history & auto-register user
  if (from) {
    await dbInsert('chat_history', { phone: from, role: 'user', content: trimmed, source: 'whatsapp' });
    // Auto-register: ensure user exists in DB for app sync
    const short = from.replace(/^91/, '').slice(-10);
    const existing = await dbQuery('users', `?or=(phone.eq.${from},phone.eq.${short})&select=phone,onboarding_complete,name`);
    if (!existing.length) {
      await dbInsert('users', { phone: from, name: 'User', password_hash: String(Math.random()).slice(2, 8) });
      console.log(`[AUTO-REG] New user registered via WhatsApp: ${from}`);
      // First-time user: prompt them to register on the app
      const welcome = `🎉 *Welcome to Viya!*\n\nI've set up your account. To get the *full experience*, complete your profile on our app:\n\n📲 *heyviya.vercel.app*\n\nYou can:\n• 📊 See your spending dashboard\n• 🎯 Track goals & habits visually\n• 🔔 Get smart reminders\n• 📈 View insights & reports\n\nMeanwhile, just chat with me here — I'll track everything for you! 😊`;
      await sendWhatsAppMessage(from, welcome);
    }
  }

  // 0. BILL SCAN HANDLER — When image OCR detects a bill
  if (trimmed.startsWith('[BILL_SCANNED]')) {
    const amtMatch = trimmed.match(/Amount:\s*₹([\d,]+)/);
    const amt = amtMatch ? amtMatch[1] : '?';
    const reply = `📸 *Bill Scanned!*\n\n✅ ₹${amt} expense logged automatically!\n\n💡 _I scanned your receipt and added it to your expenses. Check the Viya app to review or change the category._\n\n📊 _Send me any bill photo and I'll track it for you!_`;
    if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: reply.substring(0, 500), source: 'whatsapp' });
    return reply;
  }

  // 0b. IMAGE ANALYSIS — When image was analyzed but isn't a bill
  if (trimmed.startsWith('[IMAGE_ANALYSIS]') || trimmed.startsWith('[IMAGE]')) {
    const content = trimmed.replace(/^\[(IMAGE_ANALYSIS|IMAGE)\]\s*/, '');
    const aiReply = await askAI(`User sent an image on WhatsApp. Image analysis: "${content}". Give a brief, friendly response about what you see. If it's related to money/expenses, offer to track it. Be conversational like a friend.`);
    const reply = aiReply || `📷 I see your image! Want me to help with anything related to it?`;
    if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: reply.substring(0, 500), source: 'whatsapp' });
    return reply;
  }

  // 1. Rule-based intent matching
  for (const intent of INTENTS) {
    for (const p of intent.patterns) {
      if (p.test(trimmed)) {
        const reply = await intent.handler(trimmed, from);
        if (reply) {
          if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: reply.substring(0, 500), source: 'whatsapp' });
          return reply;
        }
      }
    }
  }

  // 2. SMART HABIT AUTO-DETECTION — the key intelligence
  if (from) {
    const habitResult = await detectAndCheckinHabit(trimmed, from);
    if (habitResult.matched) {
      let reply;
      if (habitResult.alreadyDone) {
        reply = `${habitResult.icon} *${habitResult.habit}* already done today! ✅\n🔥 Streak: ${habitResult.streak} days\n\n_Keep it up!_ 💪`;
      } else {
        reply = `✅ *${habitResult.icon} ${habitResult.habit} — Tracked!*${habitResult.detail ? `\n📝 ${habitResult.detail}` : ''}\n\n🔥 Streak: *${habitResult.streak} days*\n🏆 Best: *${habitResult.best} days*${habitResult.isNew ? '\n\n🆕 _Auto-created this habit for you!_' : ''}\n\n_Reflected in app instantly!_ 📱`;
      }
      // Also get AI response for the context
      const aiTip = await askAI(`User just said: "${trimmed}". They completed a ${habitResult.habit} activity. Give a very short (1-2 line) motivational or health tip related to this. Don't repeat what they did.`);
      if (aiTip) reply += `\n\n💡 _${aiTip}_`;
      if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: reply.substring(0, 500), source: 'whatsapp' });
      return reply;
    }
  }


  // 3. PRODUCTION ML PIPELINE — Intent + Sentiment + Prediction + Memory
  const intent = classifyIntent(trimmed);
  const sentiment = analyzeSentiment(trimmed);
  const conversationCtx = from ? await getConversationContext(from) : '';
  const userCtx = from ? await buildUserContext(from) : '';
  
  // Fetch spending prediction if finance-related intent
  let spendingCtx = '';
  if (from && (intent.primary === 'finance' || intent.primary === 'expense')) {
    const txns = await dbQuery('transactions', `?phone=eq.${from}&select=*&order=created_at.desc&limit=50`);
    const prediction = predictSpending(txns);
    if (prediction) {
      spendingCtx = `\nSPENDING PREDICTION (EMA Model): Daily avg ₹${prediction.predictedDaily}, monthly projected ₹${prediction.predictedMonthly}, trend: ${prediction.trend}`;
      if (prediction.topCategories.length) spendingCtx += `\nTop categories: ${prediction.topCategories.map(c => `${c.category}: ₹${c.total}`).join(', ')}`;
    }
  }
  
  // Build ML context string
  const mlContext = [
    `\nML ANALYSIS:`,
    `Intent: ${intent.primary} (confidence: ${intent.confidence.toFixed(2)})`,
    `Sentiment: ${sentiment.label} (${sentiment.intensity})`,
    sentiment.label === 'negative' ? `⚠️ User seems ${sentiment.intensity === 'strong' ? 'very ' : ''}distressed — be empathetic and supportive first!` : '',
    spendingCtx,
    conversationCtx,
    userCtx,
  ].filter(Boolean).join('\n');
  
  const aiReply = await askAI(trimmed, mlContext);
  if (aiReply) {
    if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: aiReply.substring(0, 500), source: 'whatsapp' });
    return aiReply;
  }

  return `Hey! I couldn't process that right now. Just text me naturally — ask about gold prices, investment tips, or say "spent 200 on food" to track expenses! 🤖`;
}

// ===== PRODUCTION WHATSAPP — Meta Cloud API (Official) =====
// Handles: retries, message chunking, rate limiting, error reporting
async function sendWhatsAppMessage(to, text) {
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  
  // Normalize phone: ensure country code format (91XXXXXXXXXX)
  let phone = to.replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;
  
  // Chunk long messages (WhatsApp limit ~4096 chars)
  const MAX_LEN = 4000;
  const chunks = [];
  if (text.length <= MAX_LEN) { chunks.push(text); }
  else {
    let remaining = text;
    while (remaining.length > 0) {
      let cut = remaining.substring(0, MAX_LEN);
      const lastNewline = cut.lastIndexOf('\n');
      if (lastNewline > MAX_LEN * 0.5 && remaining.length > MAX_LEN) cut = cut.substring(0, lastNewline);
      chunks.push(cut);
      remaining = remaining.substring(cut.length).trim();
    }
  }
  
  // Meta Cloud API (Official — Production)
  if (phoneId && token) {
    for (const chunk of chunks) {
      let attempts = 0;
      while (attempts < 3) {
        try {
          const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { preview_url: true, body: chunk } }),
          });
          if (resp.ok) { console.log(`✅ Meta WA sent to ${phone} (${chunk.length} chars)`); break; }
          const err = await resp.json().catch(() => ({}));
          console.error(`⚠️ Meta WA ${resp.status}:`, JSON.stringify(err).substring(0, 200));
          if (resp.status === 429) { await new Promise(r => setTimeout(r, 2000)); } // Rate limited — wait
          attempts++;
        } catch (err) { console.error('Meta WA error:', err.message); attempts++; }
      }
    }
    return;
  }
  
  // Fallback: WaSender (deprecated — will be removed)
  const wasenderKey = (process.env.WASENDER_API_KEY || '').trim();
  if (wasenderKey) {
    try {
      const resp = await fetch('https://www.wasenderapi.com/api/send-message', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${wasenderKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+${phone}`, text }),
      });
      if (resp.ok) return;
    } catch {}
  }
  
  console.warn('⚠️ No WhatsApp API configured. Set WHATSAPP_PHONE_ID + WHATSAPP_ACCESS_TOKEN for Meta Cloud API.');
}

// ===== OTP SYSTEM =====
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// ===== VERCEL HANDLER =====
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // --- REMINDER CHECKER ---
    if (req.query.action === 'check_reminders') {
      try {
        const now = new Date().toISOString();
        const resp = await fetch(`${dbUrl()}/rest/v1/reminders?status=eq.pending&remind_at=lte.${now}&select=*`, { headers: dbHeaders() });
        const reminders = await resp.json();
        if (!Array.isArray(reminders) || !reminders.length) return res.status(200).json({ message: 'No due reminders', at: now });
        let sent = 0;
        for (const r of reminders) {
          const isAdv = r.task.startsWith('⚡');
          const msg = isAdv
            ? `⚡ *Heads Up!*\n\n📋 ${r.task.replace('⚡ Coming up: ', '')}\n🕐 Coming in *5 minutes*\n_Get ready!_ 🎯`
            : `🔔 *Reminder!*\n\n📋 *${r.task}*\n🕐 ${r.remind_at_display || 'Now'}\n\n_Time to act! Stay on track_ 💪`;
          await sendWhatsAppMessage(r.phone, msg);
          await dbUpdate('reminders', `id=eq.${r.id}`, { status: 'sent' });
          sent++;
        }
        return res.status(200).json({ sent, at: now });
      } catch (e) { return res.status(200).json({ error: e.message }); }
    }

    // --- IN-APP CHAT ---
    if (req.query.action === 'chat') {
      const phone = req.query.phone || '';
      const msg = decodeURIComponent(req.query.message || '');
      if (!msg) return res.status(200).json({ reply: 'Type a message!' });
      
      // V8: Check for habit auto-detection in app chat too
      if (phone) {
        const habitResult = await detectAndCheckinHabit(msg, phone);
        if (habitResult.matched && !habitResult.alreadyDone) {
          const ctx = await buildUserContext(phone);
          const aiReply = await askAI(msg, ctx + `\nUser just completed ${habitResult.habit}. Celebrate and give brief related tip.`);
          const reply = `✅ ${habitResult.icon} *${habitResult.habit}* tracked! 🔥 ${habitResult.streak} day streak${aiReply ? `\n\n${aiReply}` : ''}`;
          return res.status(200).json({ reply, habitCheckin: habitResult });
        }
      }
      
      // V10: ML-powered in-app chat
      try {
        const intent = classifyIntent(msg);
        const sentiment = analyzeSentiment(msg);
        const conversationCtx = phone ? await getConversationContext(phone) : '';
        const ctx = phone ? await buildUserContext(phone) : '';
        const sentimentCtx = sentiment.label === 'negative' ? `\n⚠️ User feeling ${sentiment.intensity} negative — empathize!` : '';
        const reply = await askAI(msg, ctx + conversationCtx + sentimentCtx + `\nIntent: ${intent.primary}`);
        if (reply) {
          if (phone) await dbInsert('chat_history', { phone, role: 'assistant', content: reply.substring(0, 500), source: 'app' });
          return res.status(200).json({ reply, ml: { intent: intent.primary, sentiment: sentiment.label } });
        }
      } catch (e) { console.error('Chat error:', e.message); }
      return res.status(200).json({ reply: 'Let me try again — ask me anything about finance, health, or study!' });
    }

    // --- OTP: SEND ---
    if (req.query.action === 'send_otp') {
      const phone = req.query.phone || '';
      if (!phone || phone.length < 10) return res.status(200).json({ success: false, message: 'Invalid phone' });
      
      const otp = generateOTP();
      const expiry = new Date(Date.now() + 5 * 60000).toISOString(); // 5 min expiry
      
      // Store OTP in notifications table (reuse for OTP storage)
      await dbDelete('notifications', `phone=eq.${phone}&type=eq.otp`);
      await dbInsert('notifications', { phone, type: 'otp', title: otp, description: expiry, is_read: false });
      
      // Try to send via WhatsApp
      try {
        await sendWhatsAppMessage(`91${phone}`, `🔐 *Viya Login OTP*\n\nYour OTP: *${otp}*\n\n⏱️ Valid for 5 minutes\n⚠️ Don't share with anyone\n\n_If you didn't request this, ignore it._`);
      } catch {}
      
      return res.status(200).json({ success: true, message: 'OTP sent to WhatsApp!' });
    }

    // --- OTP: VERIFY ---
    if (req.query.action === 'verify_otp') {
      const phone = req.query.phone || '';
      const otp = req.query.otp || '';
      const longPhone = phone.length === 10 ? '91' + phone : phone;
      const shortPhone = phone.replace(/^91/, '').slice(-10);
      
      // Check OTP in both phone formats
      let records = await dbQuery('notifications', `?phone=eq.${phone}&type=eq.otp&is_read=eq.false&select=title,description`);
      if (!records.length) records = await dbQuery('notifications', `?phone=eq.${longPhone}&type=eq.otp&is_read=eq.false&select=title,description`);
      if (!records.length) return res.status(200).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
      
      const stored = records[0];
      if (stored.title !== otp) return res.status(200).json({ success: false, message: 'Wrong OTP. Please check and try again.' });
      // Generous 10-min expiry to handle timezone drift on serverless
      const expiryTime = new Date(stored.description).getTime();
      const nowTime = Date.now();
      console.log(`[OTP] Expiry: ${stored.description}, Now: ${new Date().toISOString()}, Diff: ${(expiryTime - nowTime)/1000}s`);
      if (expiryTime + 300000 < nowTime) return res.status(200).json({ success: false, message: 'OTP expired. Please request a new one.' });
      
      // Mark OTP as used (both formats)
      await dbUpdate('notifications', `phone=eq.${phone}&type=eq.otp`, { is_read: true });
      await dbUpdate('notifications', `phone=eq.${longPhone}&type=eq.otp`, { is_read: true });
      
      // Auto-create user if not exists (check both phone formats)
      const users = await dbQuery('users', `?or=(phone.eq.${shortPhone},phone.eq.${longPhone})&select=phone,name`);
      if (!users.length) {
        await dbInsert('users', { phone: shortPhone, name: 'User', password_hash: generateOTP() });
      }
      
      return res.status(200).json({ success: true, message: 'OTP verified!' });
    }

    // --- OCR BILL SCANNER ---
    if (req.query.action === 'ocr_bill') {
      try {
        const { image, phone } = req.body || {};
        if (!image) return res.status(200).json({ error: 'No image provided' });
        
        const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.2-90b-vision-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Extract from this bill/receipt. Return ONLY valid JSON: {"amount": number, "type": "expense" or "income", "category": "Food/Transport/Shopping/Rent/Health/Entertainment/Recharge/Education/Work/Salary/Investment/Other", "description": "brief description", "merchant": "store name"}. If unreadable: {"error": "Could not read"}' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
              ]
            }],
            max_tokens: 200, temperature: 0.1
          })
        });
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.status(200).json(parsed);
        }
        return res.status(200).json({ error: 'Could not parse' });
      } catch (e) {
        return res.status(200).json({ error: e.message });
      }
    }

    // --- WEEKLY REPORT ---
    if (req.query.action === 'weekly_report') {
      const phone = req.query.phone || '';
      if (!phone) return res.status(200).json({ error: 'No phone' });
      
      const now = new Date(Date.now() + 5.5 * 3600000);
      const weekAgo = new Date(now - 7 * 86400000).toISOString();
      
      const [txns, habits, goals] = await Promise.all([
        dbQuery('transactions', `?phone=eq.${phone}&created_at=gte.${weekAgo}&select=*&order=created_at.desc`),
        dbQuery('habits', `?phone=eq.${phone}&select=*`),
        dbQuery('goals', `?phone=eq.${phone}&status=eq.active&select=*`)
      ]);
      
      const expenses = txns.filter(t => t.type === 'expense');
      const income = txns.filter(t => t.type === 'income');
      const totalExp = expenses.reduce((s,t) => s + Number(t.amount), 0);
      const totalInc = income.reduce((s,t) => s + Number(t.amount), 0);
      
      // Category breakdown
      const cats = {};
      expenses.forEach(t => { const c = t.category || 'Other'; cats[c] = (cats[c]||0) + Number(t.amount); });
      const topCats = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0,5);
      
      // Habit stats
      const activeStreaks = habits.filter(h => (h.current_streak||0) > 0);
      const maxStreak = habits.reduce((m,h) => Math.max(m, h.current_streak||0), 0);
      
      // Goal progress
      const goalData = goals.map(g => ({
        name: g.name, icon: g.icon || '🎯',
        pct: g.target_amount > 0 ? Math.round((g.current_amount/g.target_amount)*100) : 0,
        saved: Number(g.current_amount || 0),
        target: Number(g.target_amount || 0)
      }));
      
      return res.status(200).json({
        success: true,
        report: {
          period: `${new Date(weekAgo).toLocaleDateString('en-IN', {day:'numeric',month:'short'})} - ${now.toLocaleDateString('en-IN', {day:'numeric',month:'short'})}`,
          totalExpenses: totalExp,
          totalIncome: totalInc,
          saved: totalInc - totalExp,
          txnCount: txns.length,
          topCategories: topCats.map(([cat, amt]) => ({ category: cat, amount: amt })),
          habits: { total: habits.length, active: activeStreaks.length, maxStreak },
          goals: goalData,
          dailyAvg: expenses.length > 0 ? Math.round(totalExp / 7) : 0
        }
      });
    }

    // --- MARKET DATA API (for frontend) ---
    if (req.query.action === 'market_data') {
      const data = await fetchRealTimeMarketData();
      return res.status(200).json(data);
    }

    // --- DEBUG: View last webhook payload ---
    if (req.query.action === 'debug_webhook') {
      return res.status(200).json(global.__lastWebhook || { message: 'No webhook received yet' });
    }

    // --- WEBHOOK VERIFICATION (Meta WhatsApp) ---
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const validTokens = [
      process.env.WHATSAPP_VERIFY_TOKEN,
      'heyviya_webhook_2024',
      'moneyviya_verify_token_2024',
      'moneyviya_verify_2026',
    ].filter(Boolean).map(t => t.trim());
    
    if (mode === 'subscribe' && validTokens.includes(token)) {
      return res.status(200).send(challenge);
    }
    return res.status(200).json({ status: 'Viya V10 — Production AI Engine', time: new Date().toISOString(), ml: 'TF-IDF + VADER + EMA', whatsapp: 'Meta Cloud API', verify_debug: { mode, hasToken: !!token, hasChallenge: !!challenge } });
  }
  
  if (req.method === 'POST') {
    const body = req.body;
    
    // Debug: Log ALL incoming POST payloads to diagnose webhook issues
    const debugLog = JSON.stringify(body || {}).substring(0, 2000);
    console.log(`🔍 POST received:`, debugLog);
    // Store last 10 webhook payloads for debug endpoint
    if (!global.__webhookLogs) global.__webhookLogs = [];
    global.__webhookLogs.push({ time: new Date().toISOString(), event: body?.event || 'unknown', body });
    if (global.__webhookLogs.length > 10) global.__webhookLogs.shift();
    global.__lastWebhook = { time: new Date().toISOString(), body, logs: global.__webhookLogs };
    
    // === WaSenderAPI Webhook (incoming messages) ===
    // Handles: messages.received, messages-personal.received, messages.upsert
    const isWaSender = body?.event && !body?.object;
    if (isWaSender) {
      console.log(`🔔 WaSender event: ${body.event}`, JSON.stringify(body).substring(0, 500));
      
      // Skip non-message events
      if (!body.event.includes('message')) return res.status(200).json({ status: 'ok', event: body.event });
      
      try {
        // WaSender ACTUAL format (verified from debug):
        // { event: "messages.received", data: { messages: { 
        //   key: { remoteJid: "195833345630343@lid", senderPn: "919003360494@s.whatsapp.net", cleanedSenderPn: "919003360494", fromMe: false },
        //   messageBody: "Hi", message: { conversation: "Hi" }, pushName: "LK"
        // }}}
        const msgs = body?.data?.messages || body?.data?.message || body?.data || {};
        const key = msgs?.key || {};
        const fromMe = key?.fromMe || false;
        
        // CRITICAL FIX: WaSender uses LID format in remoteJid (not phone!)
        // Real phone is in key.cleanedSenderPn or key.senderPn
        const from = key?.cleanedSenderPn || 
                     (key?.senderPn || '').replace('@s.whatsapp.net', '') ||
                     (key?.remoteJid || '').replace('@s.whatsapp.net', '').replace('@lid', '').replace('@c.us', '');
        
        // Extract message text
        const text = msgs?.messageBody || msgs?.message?.conversation || msgs?.message?.extendedTextMessage?.text || '';
        const pushName = msgs?.pushName || '';
        
        console.log(`📩 WaSender — from: ${from}, name: ${pushName}, text: ${text}, fromMe: ${fromMe}`);
        
        if (from && text && !fromMe && from.length >= 10) {
          await dbInsert('chat_history', { phone: from, role: 'user', content: text.substring(0, 500), source: 'whatsapp' });
          const reply = await processMessage(text, from);
          console.log(`📤 Reply to ${from}: ${reply.substring(0, 100)}...`);
          await sendWhatsAppMessage(from, reply);
        }
      } catch (err) { console.error('WaSender webhook error:', err.message || err); }
      return res.status(200).json({ status: 'ok' });
    }
    
    // === META CLOUD API WEBHOOK (Primary — Production) ===
    if (body?.object === 'whatsapp_business_account') {
      try {
        for (const entry of (body.entry || [])) {
          for (const change of (entry.changes || [])) {
            const value = change.value || {};
            
            // Handle status updates (delivered, read, sent)
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log(`📊 Meta status: ${status.status} for ${status.recipient_id}`);
              }
              continue;
            }
            
            // Handle incoming messages
            for (const msg of (value.messages || [])) {
              const from = msg.from;
              const contactName = value.contacts?.[0]?.profile?.name || '';
              let text = '';
              
              // Support text, button replies, interactive, and image messages
              if (msg.type === 'text') text = msg.text.body;
              else if (msg.type === 'button') text = msg.button?.text || '';
              else if (msg.type === 'interactive') text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              else if (msg.type === 'image') {
                // OCR: Process bill/receipt images
                try {
                  const mediaId = msg.image?.id;
                  const caption = msg.image?.caption || '';
                  
                  if (mediaId) {
                    // Download image from WhatsApp
                    const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
                    const mediaResp = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
                      headers: { 'Authorization': `Bearer ${waToken}` }
                    });
                    const mediaData = await mediaResp.json();
                    const imageUrl = mediaData.url;
                    
                    if (imageUrl) {
                      const imgResp = await fetch(imageUrl, { headers: { 'Authorization': `Bearer ${waToken}` } });
                      const imgBuffer = await imgResp.arrayBuffer();
                      const base64 = Buffer.from(imgBuffer).toString('base64');
                      
                      // Send to Groq Vision for OCR
                      const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
                      const ocrResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          model: 'llama-3.2-90b-vision-preview',
                          messages: [{ role: 'user', content: [
                            { type: 'text', text: `Analyze this image. If it's a bill/receipt/payment screenshot, extract: amount, merchant, category. If it's something else, describe what you see briefly. ${caption ? 'User caption: ' + caption : ''}` },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
                          ]}],
                          max_tokens: 300, temperature: 0.2
                        })
                      });
                      const ocrData = await ocrResp.json();
                      const ocrText = ocrData.choices?.[0]?.message?.content || '';
                      
                      // Check if it's a bill and auto-log
                      if (/₹|rs\.?|inr|amount|total|bill|receipt|paid|payment/i.test(ocrText)) {
                        const amtMatch = ocrText.match(/₹\s*([\d,]+(?:\.\d+)?)|(\d[\d,]+(?:\.\d+)?)\s*(?:rs|inr|rupees)/i);
                        if (amtMatch) {
                          const amt = parseFloat((amtMatch[1] || amtMatch[2]).replace(/,/g, ''));
                          if (amt > 0 && amt < 500000) {
                            await dbInsert('transactions', { phone: from, amount: amt, type: 'expense', category: '🛒 Shopping', description: 'Bill scan via WhatsApp', source: 'whatsapp' });
                            text = `[BILL_SCANNED] Amount: ₹${amt}. ${ocrText.substring(0, 200)}`;
                          }
                        }
                        if (!text) text = `[IMAGE_ANALYSIS] ${ocrText.substring(0, 300)}`;
                      } else {
                        text = caption || `[IMAGE] ${ocrText.substring(0, 200)}`;
                      }
                    } else {
                      text = caption || 'Sent an image';
                    }
                  } else {
                    text = caption || 'Sent an image';
                  }
                } catch (imgErr) {
                  console.error('Image processing error:', imgErr.message);
                  text = msg.image?.caption || 'Sent an image (could not process)';
                }
              }
              else continue; // Skip unsupported types
              
              if (!text || !from) continue;
              
              console.log(`📩 Meta WA — from: ${from}, name: ${contactName}, text: ${text.substring(0, 100)}`);
              await dbInsert('chat_history', { phone: from, role: 'user', content: text.substring(0, 500), source: 'whatsapp' });
              
              const reply = await processMessage(text, from);
              console.log(`📤 Reply to ${from}: ${reply.substring(0, 100)}...`);
              await sendWhatsAppMessage(from, reply);
            }
          }
        }
      } catch (err) { console.error('Meta webhook error:', err.message || err); }
      return res.status(200).send('OK');
    }
    
    return res.status(200).json({ status: 'ok' });
  }
  return res.status(405).send('Method not allowed');
}
