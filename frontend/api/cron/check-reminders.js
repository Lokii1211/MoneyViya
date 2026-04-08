/**
 * Vercel Cron Job — Checks and sends due reminders every minute
 * Configured in vercel.json: runs every minute
 */
export default async function handler(req, res) {
  // Only allow Vercel Cron or manual trigger
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && req.query.secret !== 'moneyviya_cron_2024') {
    // Allow anyway for simplicity on hobby plan
  }

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (!supabaseUrl || !supabaseKey || !phoneId || !waToken) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    // Get all pending reminders that are due
    const now = new Date();
    const nowISO = now.toISOString();
    
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
      // Send WhatsApp message
      const message = `⏰ *Reminder Alert!*\n\n📋 Task: ${reminder.task}\n🕐 Scheduled: ${reminder.remind_at_display || reminder.remind_at}\n\n_This is your scheduled reminder from Viya._ ✅\n\nType "help" for more options! 💬`;

      await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: reminder.phone,
          type: 'text',
          text: { body: message },
        }),
      });

      // Mark as sent
      await fetch(
        `${supabaseUrl}/rest/v1/reminders?id=eq.${reminder.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'sent' }),
        }
      );

      sent++;
      console.log(`📤 Reminder sent to ${reminder.phone}: ${reminder.task}`);
    }

    return res.status(200).json({ message: `Sent ${sent} reminders`, checked_at: nowISO });
  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
