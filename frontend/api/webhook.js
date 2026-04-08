/**
 * MoneyViya WhatsApp Cloud API Webhook — V5 FULLY AGENTIC
 * Features:
 * - Groq AI (LLaMA-3.3) for intelligent conversations
 * - Accurate reminders: 5-min advance + on-time delivery
 * - Full DB sync: expenses, habits, goals saved to Supabase
 * - Multi-persona: students, gym, business, homemakers
 * - In-app chat endpoint
 */

// ===== DB HELPERS =====
function dbHeaders() {
  const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
}
function dbUrl() { return (process.env.VITE_SUPABASE_URL || '').trim(); }

async function dbQuery(table, params = '') {
  try {
    const r = await fetch(`${dbUrl()}/rest/v1/${table}${params}`, { headers: dbHeaders() });
    return r.ok ? await r.json() : [];
  } catch { return []; }
}
async function dbInsert(table, data) {
  try {
    const r = await fetch(`${dbUrl()}/rest/v1/${table}`, {
      method: 'POST', headers: { ...dbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    const res = await r.json(); return Array.isArray(res) ? res[0] : res;
  } catch { return null; }
}
async function dbUpdate(table, filter, data) {
  try {
    await fetch(`${dbUrl()}/rest/v1/${table}?${filter}`, {
      method: 'PATCH', headers: { ...dbHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify(data)
    });
  } catch {}
}

// ===== GROQ AI =====
const SYSTEM_PROMPT = `You are Viya, MoneyViya's ultra-smart AI virtual personal assistant on WhatsApp. You serve ALL types of users in India.

Your personality: Friendly, warm, uses emojis naturally, expert in multiple domains, gives actionable advice in 2-4 lines.
Format: Use *bold* for emphasis (WhatsApp markdown). Keep under 250 words. Use ₹ for amounts (Indian number format).

DOMAINS YOU HANDLE:
1. 💰 FINANCE: budgets, SIP, mutual funds, tax saving, EMI, credit score, insurance, stocks, crypto, loans, UPI
2. 🏋️ FITNESS: workout plans, diet charts, protein calculation (1.6-2.2g/kg), calorie tracking, gym schedules
3. 📖 STUDENT: study schedules, exam prep timetables, CGPA tracking, pocket money management, learning habits
4. 🏠 HOMEMAKER: household budgets, grocery lists, recipe costs, savings tips, utility bill tracking
5. 💼 BUSINESS: revenue tracking, GST basics, expense reports, client management, profit margins
6. 🧘 WELLNESS: meditation, sleep tracking, water intake, screen time, mental health tips

CAPABILITIES (mention when relevant):
- "spent 500 on food" → tracks expense in app
- "remind me to X at Y time" → sets WhatsApp reminder
- "add habit: workout" → creates trackable habit
- "goal: save 50000 for bike" → creates savings goal
- App: https://moneyviya.vercel.app

Rules: Never give specific stock buy/sell advice. Suggest index funds for beginners. Be encouraging.
Current time: ${new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}`;

async function askAI(userMessage, context = '') {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return null;
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + (context ? `\n\nUser context: ${context}` : '') },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500, temperature: 0.7,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// ===== IST TIME HELPERS =====
function nowIST() {
  const n = new Date();
  return new Date(n.getTime() + (5.5 * 60 * 60 * 1000));
}
function formatIST(d) {
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`;
}

// ===== SMART NLP ENGINE =====
const INTENTS = [
  // GREETINGS
  {
    name: 'greeting',
    patterns: [/^(hi|hello|hey|hlo|hii|namaste|vanakkam|start|yo|sup)$/i, /^(good\s*(morning|afternoon|evening|night))$/i],
    handler: () => GREETINGS,
  },
  // HELP
  {
    name: 'help',
    patterns: [/^(help|menu|\?|commands|options|features)$/i, /what\s*(can|do)\s*you\s*do/i],
    handler: () => GREETINGS,
  },
  // ===== REMINDER (saves to DB with accurate IST timing) =====
  {
    name: 'reminder',
    patterns: [/remind/i, /alarm/i, /alert\s*me/i, /yaad\s*dila/i, /don't\s*forget/i, /set\s*(a|an)?\s*(reminder|notification)/i],
    handler: async (text, from) => {
      // Parse time
      const timeMatch = text.match(/(\d{1,2})\s*[:\.]?\s*(\d{2})?\s*(am|pm|AM|PM)/);
      const time24 = text.match(/(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/i);
      let hours = -1, minutes = 0, timeStr = '';
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        timeStr = `${timeMatch[1]}${timeMatch[2] ? ':' + timeMatch[2] : ':00'} ${period}`;
      } else if (time24) {
        hours = parseInt(time24[1]);
        minutes = parseInt(time24[2]);
        timeStr = `${time24[1]}:${time24[2]}`;
      }
      
      // Parse date
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
      const relDate = text.match(/(today|tomorrow|kal|aaj)/i);
      
      // Build IST target time
      const ist = nowIST();
      let targetDay = ist.getUTCDate(), targetMonth = ist.getUTCMonth(), targetYear = ist.getUTCFullYear();
      
      if (dateMatch) {
        targetDay = parseInt(dateMatch[1]);
        targetMonth = parseInt(dateMatch[2]) - 1;
        if (dateMatch[3]) targetYear = parseInt(dateMatch[3]) < 100 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3]);
      } else if (relDate) {
        const d = relDate[1].toLowerCase();
        if (d === 'tomorrow' || d === 'kal') targetDay += 1;
      }
      
      // If no time specified, default to next hour
      if (hours === -1) {
        hours = ist.getUTCHours() + 1;
        minutes = 0;
        timeStr = formatIST(new Date(Date.UTC(targetYear, targetMonth, targetDay, hours, minutes)));
      }
      
      // Create UTC time from IST
      const remindAtIST = new Date(Date.UTC(targetYear, targetMonth, targetDay, hours, minutes, 0));
      const remindAtUTC = new Date(remindAtIST.getTime() - (5.5 * 60 * 60 * 1000));
      
      // Also create 5-min advance reminder
      const advanceUTC = new Date(remindAtUTC.getTime() - (5 * 60 * 1000));
      
      const dateStr = `${targetDay}/${targetMonth + 1}/${targetYear}`;
      
      // Extract task
      let task = 'Your reminder';
      const taskP = [
        /(?:to|for|about|that)\s+(.+?)(?:\s+at\s+\d|\s+on\s+\d|\s+tomorrow|\s+today|\s+kal|$)/i,
        /remind(?:er)?\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+at\s+\d|\s+on\s+\d|\s+tomorrow|$)/i,
      ];
      for (const p of taskP) {
        const m = text.match(p);
        if (m) { task = m[1].replace(/\s*(at|on)\s*$/, '').trim(); break; }
      }

      // Save MAIN reminder
      if (dbUrl() && from) {
        await dbInsert('reminders', {
          phone: from, task, remind_at: remindAtUTC.toISOString(),
          remind_at_display: `${timeStr} on ${dateStr}`, status: 'pending'
        });
        // Save ADVANCE reminder (5 min before) — only if it's in the future
        if (advanceUTC > new Date()) {
          await dbInsert('reminders', {
            phone: from, task: `⚡ ADVANCE: ${task} (in 5 mins!)`,
            remind_at: advanceUTC.toISOString(),
            remind_at_display: `5 min before ${timeStr}`, status: 'pending'
          });
        }
      }

      return `⏰ *Reminder Set!*\n\n📋 *Task:* ${task}\n🕐 *Time:* ${timeStr}\n📅 *Date:* ${dateStr}\n\n✅ You'll get:\n• ⚡ Advance alert *5 mins before*\n• 🔔 Final reminder *on time*\n\n_I'll notify you via WhatsApp!_ 💪`;
    },
  },
  // ===== EXPENSE TRACKING (saves to DB) =====
  {
    name: 'expense',
    patterns: [/(?:spent|paid|bought|expense|kharcha|kharch)\s/i, /(?:₹|rs\.?|inr)\s*\d+\s*(on|for)/i, /\d+\s*(rupees?|rs)\s*(on|for)/i],
    handler: async (text, from) => {
      const amtMatch = text.match(/(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*)/i) || text.match(/(\d[\d,]+)/);
      const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : 0;
      const cats = {
        '🍕 Food': /food|lunch|dinner|breakfast|snack|tea|coffee|biryani|chai|eat|restaurant|swiggy|zomato|hotel/i,
        '🚗 Transport': /transport|uber|ola|auto|bus|train|petrol|diesel|metro|cab|fuel|travel/i,
        '🛒 Shopping': /shopping|clothes|dress|shirt|shoes|amazon|flipkart|myntra|mall/i,
        '💊 Health': /health|medicine|doctor|hospital|gym|pharmacy|protein|supplement/i,
        '📱 Recharge': /recharge|mobile|phone|jio|airtel|wifi|internet/i,
        '🏠 Rent': /rent|house|room|pg|hostel|flat/i,
        '📚 Education': /education|book|course|class|tuition|school|college|udemy/i,
        '🎬 Entertainment': /movie|netflix|prime|spotify|game|party/i,
      };
      let category = '📦 General';
      for (const [cat, p] of Object.entries(cats)) { if (p.test(text)) { category = cat; break; } }

      // Save to DB
      if (from && amount > 0) {
        await dbInsert('transactions', { phone: from, type: 'expense', amount, category, description: text.substring(0, 100) });
      }

      return `✅ *Expense Saved!*\n\n💸 Amount: *₹${amount.toLocaleString('en-IN')}*\n📁 Category: ${category}\n📅 ${new Date().toLocaleDateString('en-IN')}\n\n${amount > 5000 ? '⚠️ _Big expense! Was this planned?_' : '✨ _Every rupee tracked = smarter spending!_'}\n\n📱 View all on app: https://moneyviya.vercel.app`;
    },
  },
  // ===== INCOME TRACKING (saves to DB) =====
  {
    name: 'income',
    patterns: [/(?:received|got|earned|income|salary|credited|deposited)\s/i, /salary\s*(is|of|=)?\s*\d/i, /\d+\s*(salary|income|credited)/i],
    handler: async (text, from) => {
      const amtMatch = text.match(/(\d[\d,]+)/);
      const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : 0;
      if (from && amount > 0) {
        await dbInsert('transactions', { phone: from, type: 'income', amount, category: '💼 Income', description: text.substring(0, 100) });
      }
      return `✅ *Income Recorded!*\n\n💰 Amount: *₹${amount.toLocaleString('en-IN')}*\n📅 ${new Date().toLocaleDateString('en-IN')}\n\n*Smart 50-30-20 Split:*\n🏠 Needs: ₹${Math.round(amount * 0.5).toLocaleString('en-IN')}\n🎮 Wants: ₹${Math.round(amount * 0.3).toLocaleString('en-IN')}\n💰 Save: ₹${Math.round(amount * 0.2).toLocaleString('en-IN')}\n\n🔥 _SIP ₹${Math.round(amount * 0.2).toLocaleString('en-IN')}/month → ~₹${Math.round(amount * 0.2 * 195).toLocaleString('en-IN')} in 10 years!_ 📈`;
    },
  },
  // ===== HABIT TRACKING (saves to DB) =====
  {
    name: 'habit',
    patterns: [/(?:add|create|new|start)\s*habit/i, /habit\s*[:=]/i, /track(?:ing)?\s*habit/i, /my\s*habits/i, /checkin|check.?in|done\s+\w+/i],
    handler: async (text, from) => {
      const lower = text.toLowerCase();
      
      // Check-in: "done workout" or "checkin meditation"
      if (/^(done|completed?|checkin|check.?in|finished)\s+(.+)/i.test(lower)) {
        const habitName = text.match(/^(?:done|completed?|checkin|check.?in|finished)\s+(.+)/i)?.[1]?.trim();
        if (habitName && from) {
          const habits = await dbQuery('habits', `?phone=eq.${from}&name=ilike.*${encodeURIComponent(habitName)}*&select=*`);
          if (habits.length) {
            const h = habits[0];
            const today = new Date().toISOString().split('T')[0];
            await dbInsert('habit_checkins', { habit_id: h.id, phone: from, checked_date: today, status: 'done' });
            const newStreak = (h.current_streak || 0) + 1;
            await dbUpdate('habits', `id=eq.${h.id}`, { current_streak: newStreak, longest_streak: Math.max(newStreak, h.longest_streak || 0), last_completed: today });
            return `✅ *${h.icon || '🔥'} ${h.name} — Done!*\n\n🔥 Streak: *${newStreak} days*\n🏆 Best: *${Math.max(newStreak, h.longest_streak || 0)} days*\n\n_Keep going! Consistency is key!_ 💪`;
          }
          return `❌ Habit "${habitName}" not found.\n\nCreate it first: "add habit: ${habitName}"`;
        }
      }

      // Show my habits
      if (/my\s*habits|list\s*habits|show\s*habits/i.test(lower)) {
        const habits = await dbQuery('habits', `?phone=eq.${from}&select=*&order=created_at.asc`);
        if (!habits.length) return `📋 No habits yet!\n\nCreate one: "add habit: workout"\n\nSuggestions:\n🏋️ Workout\n📖 Read 30 mins\n💧 Drink 3L water\n🧘 Meditate\n💰 Track expenses`;
        let msg = `📋 *Your Habits:*\n\n`;
        habits.forEach((h, i) => {
          msg += `${h.icon || '✅'} *${h.name}* — ${h.current_streak || 0}🔥 streak\n`;
        });
        msg += `\n_Say "done [habit]" to check in!_`;
        return msg;
      }

      // Add habit
      const habitMatch = text.match(/(?:add|create|new|start)\s*habit\s*[:=]?\s*(.+)/i);
      if (habitMatch && from) {
        const name = habitMatch[1].trim();
        const iconMap = { workout: '🏋️', run: '🏃', read: '📖', meditate: '🧘', water: '💧', study: '🧮', diet: '🥗', sleep: '😴', walk: '🚶', code: '💻', journal: '📝' };
        let icon = '✅';
        for (const [k, v] of Object.entries(iconMap)) { if (name.toLowerCase().includes(k)) { icon = v; break; } }
        
        await dbInsert('habits', { phone: from, name, icon, frequency: 'daily', current_streak: 0, longest_streak: 0 });
        return `✅ *Habit Created!*\n\n${icon} *${name}*\n📅 Frequency: Daily\n🔥 Streak: 0 days\n\n_Say "done ${name}" each day to build your streak!_ 💪`;
      }

      return `💡 *Habit Commands:*\n\n• "add habit: workout" → create\n• "my habits" → list all\n• "done workout" → daily check-in\n\nSuggested habits:\n🏋️ Workout\n📖 Read 30 mins\n💧 Drink 3L water\n🧘 Meditate 10 mins\n💰 Track expenses`;
    },
  },
  // ===== GOAL SETTING (saves to DB) =====
  {
    name: 'goal',
    patterns: [/\b(goal|target)\b/i, /\bsave\s*for\b/i, /\bsaving\s*for\b/i, /\bwant\s*to\s*buy\b/i, /\bmy\s*goals?\b/i],
    handler: async (text, from) => {
      const lower = text.toLowerCase();
      
      // Show goals
      if (/my\s*goals?|list\s*goals?|show\s*goals?/i.test(lower)) {
        const goals = await dbQuery('goals', `?phone=eq.${from}&status=eq.active&select=*`);
        if (!goals.length) return `🎯 No active goals!\n\nCreate one:\n"save for iPhone 80000"\n"goal: trip to goa 50000"`;
        let msg = `🎯 *Your Goals:*\n\n`;
        goals.forEach(g => {
          const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
          msg += `${g.icon || '🎯'} *${g.name}*\n   ₹${Number(g.current_amount || 0).toLocaleString('en-IN')} / ₹${Number(g.target_amount).toLocaleString('en-IN')} (${pct}%)\n\n`;
        });
        msg += `_Add money: "added 5000 to [goal name]"_`;
        return msg;
      }

      // Add to existing goal
      if (/added?\s+(\d[\d,]*)\s+to\s+(.+)/i.test(lower)) {
        const m = text.match(/added?\s+(\d[\d,]*)\s+to\s+(.+)/i);
        const amt = parseInt(m[1].replace(/,/g, ''));
        const goalName = m[2].trim();
        const goals = await dbQuery('goals', `?phone=eq.${from}&name=ilike.*${encodeURIComponent(goalName)}*&select=*`);
        if (goals.length) {
          const g = goals[0];
          const newAmt = Number(g.current_amount || 0) + amt;
          const status = newAmt >= Number(g.target_amount) ? 'completed' : 'active';
          await dbUpdate('goals', `id=eq.${g.id}`, { current_amount: newAmt, status });
          const pct = Math.round((newAmt / g.target_amount) * 100);
          return `💰 *₹${amt.toLocaleString('en-IN')} added to ${g.name}!*\n\nProgress: ${pct}% [${'█'.repeat(Math.floor(pct/10))}${'░'.repeat(10 - Math.floor(pct/10))}]\n₹${newAmt.toLocaleString('en-IN')} / ₹${Number(g.target_amount).toLocaleString('en-IN')}\n\n${status === 'completed' ? '🎉 *GOAL ACHIEVED!* Congratulations!! 🥳' : `_₹${(Number(g.target_amount) - newAmt).toLocaleString('en-IN')} remaining!_`}`;
        }
        return `❌ Goal "${goalName}" not found. Say "my goals" to see your goals.`;
      }

      // Create new goal
      const goalMatch = text.match(/(?:save\s*for|goal\s*[:=]?|want\s*to\s*buy)\s*(.+)/i);
      const amtMatch = text.match(/(\d[\d,]+)/);
      if (goalMatch && from) {
        const name = goalMatch[1].replace(/\d[\d,]*/g, '').trim() || 'My Goal';
        const target = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : 0;
        const iconMap = { phone: '📱', iphone: '📱', bike: '🏍️', car: '🚗', laptop: '💻', trip: '✈️', house: '🏠', wedding: '💍', education: '🎓' };
        let icon = '🎯';
        for (const [k, v] of Object.entries(iconMap)) { if (name.toLowerCase().includes(k)) { icon = v; break; } }
        
        await dbInsert('goals', { phone: from, name, icon, target_amount: target || 100000, current_amount: 0, status: 'active', priority: 'medium' });
        
        const t = target || 100000;
        return `🎯 *Goal Created!*\n\n${icon} *${name}*\n💰 Target: ₹${t.toLocaleString('en-IN')}\n\n*Monthly savings needed:*\n• 3 months: ₹${Math.round(t/3).toLocaleString('en-IN')}\n• 6 months: ₹${Math.round(t/6).toLocaleString('en-IN')}\n• 12 months: ₹${Math.round(t/12).toLocaleString('en-IN')}\n\n_Add savings: "added 5000 to ${name}"_ 💪`;
      }

      return `🎯 *Goal Commands:*\n\n• "save for iPhone 80000" → create\n• "my goals" → list all\n• "added 5000 to iPhone" → add money`;
    },
  },
  // ===== BALANCE/SUMMARY =====
  {
    name: 'balance',
    patterns: [/\b(balance|summary|overview|report|status)\b/i, /how\s*much\s*(have|did|do)\s*i/i, /total\s*(expense|income|spent|earned)/i],
    handler: async (text, from) => {
      const expenses = await dbQuery('transactions', `?phone=eq.${from}&type=eq.expense&select=amount`);
      const income = await dbQuery('transactions', `?phone=eq.${from}&type=eq.income&select=amount`);
      const totalExp = expenses.reduce((s, t) => s + Number(t.amount), 0);
      const totalInc = income.reduce((s, t) => s + Number(t.amount), 0);
      const balance = totalInc - totalExp;
      
      return `📊 *Your Financial Summary*\n\n💰 Income: *₹${totalInc.toLocaleString('en-IN')}*\n💸 Expenses: *₹${totalExp.toLocaleString('en-IN')}*\n📈 Balance: *₹${balance.toLocaleString('en-IN')}*\n\n${balance >= 0 ? '✅ _You\'re in the green! Keep saving!_' : '⚠️ _Spending more than earning — let\'s fix this!_'}\n\n📱 Full dashboard: https://moneyviya.vercel.app`;
    },
  },
  // EDUCATION SHORTCUTS
  { name: 'edu_sip', patterns: [/\bsip\b/i, /systematic\s*investment/i], handler: () => EDUCATION.sip },
  { name: 'edu_mf', patterns: [/mutual\s*fund/i], handler: () => EDUCATION.mutual_fund },
  { name: 'edu_emi', patterns: [/\bemi\b/i, /installment/i], handler: () => EDUCATION.emi },
  { name: 'edu_credit', patterns: [/credit\s*score/i, /cibil/i], handler: () => EDUCATION.credit_score },
  { name: 'edu_fd', patterns: [/\bfd\b/i, /fixed\s*deposit/i], handler: () => EDUCATION.fd },
  { name: 'edu_tax', patterns: [/\btax\b/i, /80c/i, /tax\s*sav/i], handler: () => EDUCATION.tax },
  { name: 'edu_ins', patterns: [/\binsurance\b/i, /\bterm\s*plan/i], handler: () => EDUCATION.insurance },
  { name: 'edu_budget', patterns: [/\bbudget\b/i, /50.?30.?20/i], handler: () => EDUCATION.budget },
  { name: 'edu_ppf', patterns: [/\bppf\b/i, /public\s*provident/i], handler: () => EDUCATION.ppf },
  { name: 'edu_gold', patterns: [/\bgold\b/i, /\bsgb\b/i], handler: () => EDUCATION.gold },
  { name: 'edu_stock', patterns: [/\bstock/i, /\bshare\s*market/i, /\bnifty\b/i], handler: () => EDUCATION.stocks },
  { name: 'edu_loan', patterns: [/\bloan\b/i], handler: () => EDUCATION.loan },
  // CASUAL
  {
    name: 'thanks',
    patterns: [/\b(thanks|thank\s*you|thanku|tq|ty)\b/i, /\b(dhanyavaad|shukriya|nandri)\b/i],
    handler: () => `🙏 *You're welcome!*\n\nAnything else I can help with? I'm here 24/7! 💬\n\n_Financial freedom starts with one smart decision!_ 💰`,
  },
  {
    name: 'about',
    patterns: [/who\s*(are|r)\s*(you|u)/i, /your\s*name/i],
    handler: () => `🤖 *I'm Viya — Your AI Personal Assistant*\n\nI help with:\n💰 Money • 🏋️ Fitness • 📖 Study • 🏠 Home • 💼 Business\n\nBuilt by *MoneyViya* 🇮🇳\n📱 App: https://moneyviya.vercel.app`,
  },
];

// ===== EDUCATION DATABASE =====
const EDUCATION = {
  sip: '📊 *SIP = Systematic Investment Plan*\n\nInvest ₹1,000/month instead of ₹12,000 at once.\n\n*Real example:*\n₹2,000/month in Nifty 50:\n• 5 years → ~₹1,65,000 (invested ₹1.2L)\n• 10 years → ~₹4,40,000 (invested ₹2.4L)\n• 20 years → ~₹20,00,000! (invested ₹4.8L)\n\n_Start ₹500/month on Groww or Zerodha_ 📈',
  mutual_fund: '💰 *Mutual Fund = Group Investment*\n\n*Types:*\n• Equity (12-15% returns)\n• Debt (6-8% returns)\n• Index (lowest cost — best for beginners)\n\n_Start: Nifty 50 Index Fund SIP ₹500/month_ 📊',
  emi: '🏦 *EMI = Equated Monthly Installment*\n\n*Golden Rule:* Total EMIs < 40% salary\n\n*Rates:*\n• Home: 8-10% • Car: 8-12% • Personal: 12-18%\n• Credit card: 36-42% (AVOID! 🚫)\n\n_No-cost EMI has processing fees!_ ⚠️',
  credit_score: '📊 *Credit Score (300-900)*\n\n750+ = Excellent\n\n*Improve:*\n1. Pay bills ON TIME\n2. Keep usage < 30%\n3. Don\'t apply for many loans\n4. Keep old cards active\n\n_Check free: CIBIL, Paytm, CRED_ 📱',
  fd: '🏦 *FD = Fixed Deposit*\n\n₹1L for 1 year → ~₹1.07L (7%)\n\n✅ Zero risk, guaranteed\n❌ Low returns, TDS above ₹40K\n\n_For long term: SIP > FD_ 📈',
  tax: '🧾 *Tax Saving*\n\n*80C (₹1.5L):* ELSS, PPF, EPF\n*80D (₹25K):* Health insurance\n*80CCD (₹50K):* NPS\n\n_₹12,500/month ELSS = zero tax up to ₹7.5L!_ 💰',
  insurance: '🛡️ *Must Have:*\n\n1. 🏥 Health: ₹5-10L cover (~₹500/month)\n2. 💀 Term Life: 10× salary (~₹700/month)\n\n❌ Avoid: LIC endowment, ULIPs (low returns)\n\n_Term plan + SIP > LIC plan_ 🎯',
  budget: '📋 *50-30-20 Budget*\n\n*50% NEEDS* (rent, food, bills)\n*30% WANTS* (shopping, fun)\n*20% SAVINGS* (SIP, FD)\n\n_₹200/day saved = ₹73,000/year!_ 🎯',
  ppf: '🏛️ *PPF — Safest Investment*\n\nInterest: 7.1% (tax-free!)\nLock-in: 15 years\n\n₹12,500/month for 15 years:\nInvested: ₹22.5L → Get: ~₹40L 🎯',
  gold: '🥇 *Gold Options:*\n\n1. *SGB* — 2.5% interest + price gain (best!)\n2. *Gold ETF* — trade like stocks\n3. *Digital Gold* — from ₹1\n\n_Gold = max 10% of portfolio_ 🎯',
  stocks: '📈 *Stocks for Beginners:*\n\n1. Start with Index Fund SIP (not direct stocks)\n2. Open Demat on Zerodha\n3. Learn 6 months before trading\n\n❌ No tips trading\n_SIP in Nifty 50 = easiest start_ 📊',
  loan: '🏦 *Loan Rates:*\n\n• Home: 8.5-10%\n• Car: 8-12%\n• Personal: 12-18%\n• Credit card: 36-42% 🚫\n\n_EMI < 40% salary. Prepay whenever possible!_ ⚠️',
};

const GREETINGS = `👋 *Hey! I'm Viya — Your AI Personal Assistant* 🤖

*I help with EVERYTHING:*

💰 *Money* — "spent 500 on food" / "salary 30000"
🎯 *Goals* — "save for iPhone 80000"
⏰ *Reminders* — "remind me to pay rent at 10 AM"
📊 *Summary* — "balance" / "my expenses"
🔥 *Habits* — "add habit: workout" / "done workout"
📚 *Learn* — "what is SIP" / "tax tips"

🏋️ *Fitness* — "gym diet plan" / "protein calculation"
📖 *Study* — "study schedule for exams"
💼 *Business* — "revenue tracking tips"
🏠 *Home* — "household budget ideas"

_Just type naturally — I understand!_ 💬
📱 App: https://moneyviya.vercel.app`;

// ===== PROCESS MESSAGE =====
async function processMessage(text, from) {
  const trimmed = text.trim();
  if (!trimmed) return GREETINGS;
  
  // Save chat to history
  if (from) await dbInsert('chat_history', { phone: from, role: 'user', content: trimmed, source: 'whatsapp' });

  // Rule-based intent matching
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        const reply = await intent.handler(trimmed, from);
        if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: reply.substring(0, 500), source: 'whatsapp' });
        return reply;
      }
    }
  }

  // Fuzzy fallback for education topics
  const words = trimmed.toLowerCase().split(/\s+/);
  const topicMap = { invest: 'sip', investment: 'sip', mutual: 'mutual_fund', deposit: 'fd', pension: 'ppf', retire: 'ppf', gold: 'gold', sona: 'gold', share: 'stocks', market: 'stocks', trading: 'stocks' };
  for (const word of words) { if (topicMap[word]) return EDUCATION[topicMap[word]]; }

  // AI fallback — handles gym, study, diet, business, etc.
  const userContext = from ? `Phone: ${from}` : '';
  const aiReply = await askAI(trimmed, userContext);
  if (aiReply) {
    if (from) await dbInsert('chat_history', { phone: from, role: 'assistant', content: aiReply.substring(0, 500), source: 'whatsapp' });
    return aiReply;
  }

  return `🤖 I didn't quite get that.\n\n*Try:*\n💸 "spent 200 on food"\n📚 "what is SIP"\n⏰ "remind me to pay rent at 10 AM"\n🔥 "add habit: workout"\n🏋️ "gym diet plan"\n📖 "study schedule"\n\n_Or type "help" for full menu!_ 💬`;
}

// ===== WHATSAPP API =====
async function sendWhatsAppMessage(to, text) {
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  if (!phoneId || !token) return;
  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
  } catch (err) { console.error('Send error:', err); }
}

// ===== VERCEL HANDLER =====
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // --- REMINDER CHECKER (accurate timing) ---
    if (req.query.action === 'check_reminders') {
      const supabaseUrl = dbUrl();
      const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
      const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
      const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

      if (!supabaseUrl || !supabaseKey || !phoneId || !waToken) {
        return res.status(200).json({ error: 'Missing env vars' });
      }

      try {
        const now = new Date();
        const nowISO = now.toISOString();
        
        // Fetch ALL pending reminders whose time has passed
        const resp = await fetch(
          `${supabaseUrl}/rest/v1/reminders?status=eq.pending&remind_at=lte.${nowISO}&select=*`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const reminders = await resp.json();

        if (!Array.isArray(reminders) || reminders.length === 0) {
          return res.status(200).json({ message: 'No due reminders', checked_at: nowISO });
        }

        let sent = 0;
        for (const reminder of reminders) {
          const isAdvance = reminder.task.startsWith('⚡ ADVANCE:');
          const message = isAdvance
            ? `⚡ *Heads Up!*\n\n📋 ${reminder.task.replace('⚡ ADVANCE: ', '')}\n🕐 Coming up in *5 minutes*\n\n_Get ready!_ 🎯`
            : `🔔 *Reminder!*\n\n📋 *Task:* ${reminder.task}\n🕐 *Time:* ${reminder.remind_at_display || 'Now'}\n\n✅ _Time to do it! Stay organized with Viya_ 💪`;

          await sendWhatsAppMessage(reminder.phone, message);
          
          // Mark as sent
          await fetch(`${supabaseUrl}/rest/v1/reminders?id=eq.${reminder.id}`, {
            method: 'PATCH',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'sent' }),
          });
          sent++;
        }
        return res.status(200).json({ message: `Sent ${sent} reminders`, checked_at: nowISO });
      } catch (err) {
        return res.status(200).json({ error: err.message });
      }
    }

    // --- IN-APP CHAT ---
    if (req.query.action === 'chat') {
      const userPhone = req.query.phone || '';
      const userMsg = decodeURIComponent(req.query.message || '');
      if (!userMsg) return res.status(200).json({ reply: 'Please type a message!' });
      
      try {
        const reply = await askAI(userMsg, `User phone: ${userPhone}`);
        if (reply) return res.status(200).json({ reply });
      } catch {}
      return res.status(200).json({ reply: '🤖 Temporarily unavailable. Try again!' });
    }

    // --- WEBHOOK VERIFICATION ---
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || '').trim()) {
      return res.status(200).send(challenge);
    }
    
    return res.status(200).json({ status: 'MoneyViya V5 — Fully Agentic AI', time: new Date().toISOString() });
  }
  
  if (req.method === 'POST') {
    const body = req.body;
    if (body?.object === 'whatsapp_business_account') {
      for (const entry of (body.entry || [])) {
        for (const change of (entry.changes || [])) {
          for (const msg of (change.value?.messages || [])) {
            if (msg.type === 'text') {
              const from = msg.from;
              const text = msg.text.body;
              console.log(`📩 ${from}: ${text}`);
              const reply = await processMessage(text, from);
              await sendWhatsAppMessage(from, reply);
            }
          }
        }
      }
    }
    return res.status(200).send('OK');
  }
  
  return res.status(405).send('Method not allowed');
}
