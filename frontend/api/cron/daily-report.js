/**
 * Vercel Cron — Daily Reports via WhatsApp
 * Morning (7 AM IST): Greeting + yesterday summary
 * Night (9 PM IST): Today's report + ask to confirm/finalize
 * 
 * Set up cron-job.org to hit:
 *   Morning: /api/cron/daily-report?type=morning
 *   Night:   /api/cron/daily-report?type=night
 */
export default async function handler(req, res) {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (!supabaseUrl || !supabaseKey || !phoneId || !waToken) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const type = req.query.type || 'morning'; // morning or night
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  try {
    // Get all active users (who have completed onboarding)
    const usersResp = await fetch(`${supabaseUrl}/rest/v1/users?onboarding_complete=eq.true&select=phone,name`, { headers });
    const users = await usersResp.json();
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(200).json({ message: 'No active users', type });
    }

    let sent = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const user of users) {
      try {
        const ph = user.phone;
        const name = user.name || 'there';
        // Use 91-prefix for WhatsApp delivery 
        const waPhone = ph.length === 10 ? '91' + ph : ph;

        if (type === 'morning') {
          // === MORNING REPORT (Yesterday summary + greeting) ===
          // Get yesterday's transactions
          const txResp = await fetch(`${supabaseUrl}/rest/v1/transactions?phone=eq.${ph}&created_at=gte.${yesterday}T00:00:00&created_at=lt.${today}T00:00:00&select=type,amount,category`, { headers });
          const txns = await txResp.json();
          const yIncome = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const yExpense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

          // Get yesterday's habit checkins
          const habResp = await fetch(`${supabaseUrl}/rest/v1/habit_checkins?phone=eq.${ph}&checked_date=eq.${yesterday}&select=status`, { headers });
          const checkins = await habResp.json();
          const habitsTotal = await fetch(`${supabaseUrl}/rest/v1/habits?phone=eq.${ph}&select=id`, { headers });
          const allHabits = await habitsTotal.json();
          const done = (checkins || []).filter(c => c.status === 'done').length;
          const total = (allHabits || []).length;

          let message = `☀️ *Good Morning, ${name}!*\n\nHere's your yesterday summary:\n\n`;
          
          if (yIncome > 0 || yExpense > 0) {
            message += `💰 *Money:*\n`;
            if (yIncome > 0) message += `  📥 Income: ₹${yIncome.toLocaleString('en-IN')}\n`;
            if (yExpense > 0) message += `  📤 Spent: ₹${yExpense.toLocaleString('en-IN')}\n`;
            if (yIncome > yExpense) message += `  ✅ Saved: ₹${(yIncome - yExpense).toLocaleString('en-IN')}\n`;
          } else {
            message += `📊 _No transactions recorded yesterday_\n`;
          }

          if (total > 0) {
            message += `\n🔥 *Habits:* ${done}/${total} completed`;
            if (done === total && total > 0) message += ` — Perfect day! 🏆`;
            else if (done === 0) message += ` — Let's do better today! 💪`;
          }

          message += `\n\n🎯 *Today's Focus:* Track every expense and complete your habits!\n\nJust text me anytime — _"spent 100 on tea"_ or _"gym done"_ 💬`;

          await sendWA(phoneId, waToken, waPhone, message);
          sent++;

        } else if (type === 'night') {
          // === NIGHT REPORT (Today's summary + ask to confirm) ===
          const txResp = await fetch(`${supabaseUrl}/rest/v1/transactions?phone=eq.${ph}&created_at=gte.${today}T00:00:00&select=type,amount,category`, { headers });
          const txns = await txResp.json();
          const tIncome = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const tExpense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          const expenseList = (txns || []).filter(t => t.type === 'expense');

          // Today's habits
          const habResp = await fetch(`${supabaseUrl}/rest/v1/habit_checkins?phone=eq.${ph}&checked_date=eq.${today}&select=status,habit_id`, { headers });
          const checkins = await habResp.json();
          const habitsResp = await fetch(`${supabaseUrl}/rest/v1/habits?phone=eq.${ph}&select=id,name,icon`, { headers });
          const allHabits = await habitsResp.json();
          const doneIds = new Set((checkins || []).filter(c => c.status === 'done').map(c => c.habit_id));
          const done = doneIds.size;
          const total = (allHabits || []).length;
          const pending = (allHabits || []).filter(h => !doneIds.has(h.id));

          let message = `🌙 *Good Night, ${name}!*\n\nHere's your day in review:\n\n`;

          // Money summary
          message += `💰 *Today's Money:*\n`;
          if (tIncome > 0) message += `  📥 Earned: ₹${tIncome.toLocaleString('en-IN')}\n`;
          if (tExpense > 0) {
            message += `  📤 Spent: ₹${tExpense.toLocaleString('en-IN')}`;
            if (expenseList.length <= 5) {
              message += `\n`;
              expenseList.forEach(e => { message += `    • ${e.category} ₹${Number(e.amount).toLocaleString('en-IN')}\n` });
            } else {
              message += ` (${expenseList.length} transactions)\n`;
            }
          }
          if (tIncome === 0 && tExpense === 0) message += `  _No transactions today_\n`;

          // Habits
          if (total > 0) {
            message += `\n🔥 *Habits:* ${done}/${total} done\n`;
            if (pending.length > 0 && pending.length <= 4) {
              message += `\n⏳ *Still pending:*\n`;
              pending.forEach(h => { message += `  ☐ ${h.icon || '✅'} ${h.name}\n` });
              message += `\n_Reply "done" to mark all complete, or text each one like "meditated"_`;
            } else if (done === total) {
              message += `🏆 *All habits done! Perfect day!*`;
            }
          }

          message += `\n\n😴 _Rest well. See you tomorrow morning! ☀️_`;

          await sendWA(phoneId, waToken, waPhone, message);
          sent++;
        }
      } catch (userErr) {
        console.error(`Error for ${user.phone}:`, userErr.message);
      }
    }

    return res.status(200).json({ message: `Sent ${sent} ${type} reports`, type, sent });
  } catch (err) {
    console.error('Daily report error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function sendWA(phoneId, token, to, text) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
  });
}
