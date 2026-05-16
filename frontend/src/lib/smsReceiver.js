/**
 * Viya SMS Receiver — Capacitor Plugin
 * ======================================
 * Listens for incoming SMS on Android via BroadcastReceiver,
 * filters bank/UPI messages, and sends to backend for parsing.
 *
 * iOS: Not supported (uses AA framework instead).
 *
 * Usage:
 *   import { initSMSListener, syncHistoricalSMS } from './smsReceiver';
 *   initSMSListener();          // Start listening
 *   syncHistoricalSMS();        // One-time historical sync
 */

import { Capacitor } from '@capacitor/core';
import { ingestSMS, ingestSMSBatch } from './fintechApi';

// ── Bank sender ID prefixes (fast client-side filter) ──
const BANK_PREFIXES = [
  'HDFCBK','ICICIB','SBIINB','SBIBNK','AXISBK','KOTAKB',
  'INDUSB','YESBK','IDFCFB','FEDBNK','PNBSMS','CANBNK',
  'BARBK','UNIBNK','RBLBNK','BANDHN','PYTMBN','PAYTMB',
  'GOOGLE','PHONEPE','JIOPYB','ABORIG',
];

const FINANCIAL_KEYWORDS = [
  'debited','credited','deducted','withdrawn','paid','received',
  'INR','Rs.','₹','UPI','NEFT','IMPS','RTGS','EMI','NACH',
];

/**
 * Quick client-side check: is this SMS likely financial?
 * (Full parsing happens server-side)
 */
function isLikelyFinancial(sender, body) {
  if (!body || body.length < 20) return false;
  const upper = (sender || '').toUpperCase();
  const bodyLower = body.toLowerCase();

  // Check sender ID
  if (BANK_PREFIXES.some(p => upper.includes(p))) return true;

  // Check body for financial keywords
  return FINANCIAL_KEYWORDS.some(kw => bodyLower.includes(kw.toLowerCase()));
}

/**
 * Initialize real-time SMS listener (Android only).
 * Requires SMS permission granted via Capacitor.
 */
export async function initSMSListener() {
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[SMS] Not Android — skipping SMS listener');
    return false;
  }

  try {
    // Use Capacitor community SMS plugin or custom native bridge
    const { SMSReceiver } = await import('@nicoya/capacitor-sms');

    SMSReceiver.addListener('smsReceived', async (sms) => {
      const { body, sender, timestamp } = sms;

      if (!isLikelyFinancial(sender, body)) return;

      console.log(`[SMS] Financial SMS from ${sender}: ${body.substring(0, 40)}...`);

      try {
        const result = await ingestSMS(body, sender, new Date(timestamp).toISOString());
        if (result?.data?.status === 'created') {
          // Show local notification
          showTransactionNotification(result.data.parsed);
        }
      } catch (err) {
        console.error('[SMS] Ingest error:', err);
        // Queue for retry
        queueFailedSMS({ body, sender, timestamp });
      }
    });

    console.log('[SMS] Listener initialized');
    return true;
  } catch (err) {
    console.error('[SMS] Plugin not available:', err);
    return false;
  }
}

/**
 * One-time sync of historical SMS (on first app launch).
 * Reads last 30 days of bank SMS and batch-sends to backend.
 */
export async function syncHistoricalSMS() {
  if (Capacitor.getPlatform() !== 'android') return { skipped: true };

  try {
    const { SMSReceiver } = await import('@nicoya/capacitor-sms');

    // Read SMS from last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { messages } = await SMSReceiver.getMessages({
      since: since.getTime(),
      maxCount: 1000,
    });

    // Client-side filter for financial SMS only
    const financial = messages
      .filter(m => isLikelyFinancial(m.sender, m.body))
      .slice(0, 500)  // API limit
      .map(m => ({
        body: m.body,
        sender: m.sender || '',
        received_at: new Date(m.timestamp).toISOString(),
      }));

    if (financial.length === 0) {
      return { total: 0, message: 'No financial SMS found' };
    }

    console.log(`[SMS] Syncing ${financial.length} historical financial SMS`);
    const result = await ingestSMSBatch(financial);
    return { total: financial.length, ...result?.data };

  } catch (err) {
    console.error('[SMS] Historical sync error:', err);
    return { error: err.message };
  }
}

// ── Helpers ──

function showTransactionNotification(parsed) {
  if (!parsed) return;
  try {
    const { LocalNotifications } = require('@capacitor/local-notifications');
    const type = parsed.type === 'debit' ? '💸' : '💰';
    const merchant = parsed.merchant_normalized || 'Unknown';
    LocalNotifications.schedule({
      notifications: [{
        title: `${type} ₹${parsed.amount?.toLocaleString('en-IN')} ${parsed.type === 'debit' ? 'spent' : 'received'}`,
        body: `${merchant} — auto-logged ✅`,
        id: Date.now(),
      }],
    });
  } catch { /* notification plugin not available */ }
}

const FAILED_QUEUE_KEY = 'viya_sms_retry_queue';

function queueFailedSMS(sms) {
  try {
    const queue = JSON.parse(localStorage.getItem(FAILED_QUEUE_KEY) || '[]');
    queue.push(sms);
    if (queue.length > 50) queue.shift(); // cap at 50
    localStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore */ }
}

/** Retry failed SMS (call periodically) */
export async function retryFailedSMS() {
  try {
    const queue = JSON.parse(localStorage.getItem(FAILED_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    const batch = queue.splice(0, 10);
    localStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(queue));

    await ingestSMSBatch(batch.map(s => ({
      body: s.body,
      sender: s.sender || '',
      received_at: s.timestamp ? new Date(s.timestamp).toISOString() : null,
    })));
  } catch { /* retry later */ }
}
