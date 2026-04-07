/**
 * MoneyViya WhatsApp Bot v6.0 — FOUNDER EDITION
 * ================================================
 * The WhatsApp bot IS the product. The app is just a dashboard.
 * 
 * Features:
 * - Quick Commands (/bal, /add, /goal, /habit, /help)
 * - Voice Note Processing (Hindi/English via Whisper)
 * - Image/Receipt OCR
 * - Proactive Messaging Engine (morning briefing, evening check-in, salary day)
 * - Streak Tracking & Motivation
 * - Smart Reminders
 * - Viral Share Moments
 * - <3s response time target
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';
import express from 'express';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// ============== CONFIG ==============
const API_URL = process.env.API_URL || 'http://localhost:8000';
const FALLBACK_URL = process.env.FALLBACK_URL || '';
const PORT = process.env.PORT || 3001;
const PROCESS_ENDPOINT = `${API_URL}/api/moneyview/process`;
const IMAGE_ENDPOINT = `${API_URL}/api/moneyview/parse-image`;
const USER_ENDPOINT = `${API_URL}/api/moneyview/user`;

let sock, isConnected = false, reconnectAttempts = 0, latestQR = null;
let stats = { sent: 0, received: 0, errors: 0, started: Date.now(), commands: 0, voice: 0, images: 0 };

// User session cache (for proactive messaging & streaks)
const userSessions = new Map();

// ============== EXPRESS SERVER ==============
const app = express();
app.use(express.json());

// QR Code Web Page
app.get('/qr', (req, res) => {
  if (isConnected) {
    const uptime = Math.floor((Date.now() - stats.started) / 60000);
    return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>*{margin:0;box-sizing:border-box}body{font-family:'Inter',system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0F;color:#F0F0F5}
    .card{background:#141420;border:1px solid rgba(255,255,255,0.06);padding:48px;border-radius:24px;text-align:center;max-width:400px}
    .check{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#10B981,#34D399);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:40px}
    h2{color:#10B981;margin-bottom:12px}p{color:#9090A0;font-size:14px;margin-bottom:8px}
    .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:20px;background:#0A0A0F;border-radius:12px;padding:16px}
    .stat{text-align:center}.stat-num{font-size:20px;font-weight:800;color:#8B5CF6}.stat-label{font-size:10px;color:#606075;text-transform:uppercase;letter-spacing:1px}</style></head>
    <body><div class="card">
    <div class="check">✅</div>
    <h2>WhatsApp Connected!</h2>
    <p>MoneyViya Bot running 24/7</p>
    <div class="stats">
      <div class="stat"><div class="stat-num">${uptime}m</div><div class="stat-label">Uptime</div></div>
      <div class="stat"><div class="stat-num">${stats.received}</div><div class="stat-label">Received</div></div>
      <div class="stat"><div class="stat-num">${stats.sent}</div><div class="stat-label">Sent</div></div>
    </div>
    </div></body></html>`);
  }
  if (!latestQR) {
    return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="refresh" content="3">
    <style>*{margin:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0F;color:#F0F0F5}
    .card{background:#141420;border:1px solid rgba(255,255,255,0.06);padding:48px;border-radius:24px;text-align:center}
    .spinner{width:48px;height:48px;border:3px solid rgba(139,92,246,0.3);border-top:3px solid #8B5CF6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}
    @keyframes spin{to{transform:rotate(360deg)}}h2{margin-bottom:8px}p{color:#9090A0;font-size:14px}</style></head>
    <body><div class="card"><div class="spinner"></div><h2>Generating QR Code...</h2><p>Auto-refreshes every 3 seconds</p></div></body></html>`);
  }
  QRCode.toDataURL(latestQR, { width: 280, margin: 2 }, (err, url) => {
    res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="refresh" content="20">
    <style>*{margin:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0F;color:#F0F0F5}
    .card{background:#141420;border:1px solid rgba(255,255,255,0.06);padding:32px;border-radius:24px;text-align:center;max-width:400px}
    img{border-radius:12px;margin:16px 0}h2{color:#8B5CF6;margin-bottom:8px}p{color:#9090A0;font-size:14px}
    .steps{text-align:left;background:#0A0A0F;border-radius:12px;padding:16px;margin-top:12px;font-size:13px;line-height:1.8}</style></head>
    <body><div class="card">
    <h2>📱 Scan with WhatsApp</h2>
    <p>Connect your MoneyViya Bot</p>
    <img src="${url}" alt="QR" width="260">
    <div class="steps">
    <b>Steps:</b><br>1. Open WhatsApp<br>2. Settings → Linked Devices<br>3. Link a Device<br>4. Scan this QR
    </div></div></body></html>`);
  });
});

app.get('/health', (req, res) => res.json({
  status: isConnected ? 'connected' : 'waiting_qr',
  uptime: Math.floor((Date.now() - stats.started) / 1000),
  stats, api: API_URL, version: '6.0.0-founder'
}));

app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
    if (!isConnected || !sock) return res.status(503).json({ error: 'Not connected' });
    const jid = normalizeJid(phone);
    await sock.sendMessage(jid, { text: message });
    stats.sent++;
    res.json({ success: true });
  } catch (e) { stats.errors++; res.status(500).json({ error: e.message }); }
});

// Proactive message endpoint (called by backend cron)
app.post('/proactive', async (req, res) => {
  try {
    const { phone, message, type } = req.body;
    if (!isConnected || !sock) return res.status(503).json({ error: 'Not connected' });
    const jid = normalizeJid(phone);
    await sock.sendMessage(jid, { text: message });
    stats.sent++;
    console.log(`[PROACTIVE:${type}] → ${phone.slice(-4)}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`\n🌐 MoneyViya Bot v6.0: http://localhost:${PORT}/qr\n`));

// ============== QUICK COMMANDS ==============
const QUICK_COMMANDS = {
  '/bal': { intent: 'my balance', desc: 'Show balance' },
  '/help': { intent: null, desc: 'Show all commands' },
  '/goal': { intent: 'my goals', desc: 'Goal progress' },
  '/habit': { intent: 'habit checkin', desc: 'Daily habits' },
  '/report': { intent: 'weekly review', desc: 'Weekly review' },
  '/budget': { intent: 'my budget', desc: 'Budget status' },
  '/streak': { intent: 'my streaks', desc: 'Current streaks' },
  '/sub': { intent: 'subscription audit', desc: 'Subscription check' },
  '/tip': { intent: 'money saving tip', desc: 'Daily tip' },
  '/plan': { intent: 'plan my day', desc: 'Plan today' },
};

function parseQuickCommand(text) {
  const trimmed = text.trim().toLowerCase();

  // /help → show all commands
  if (trimmed === '/help' || trimmed === '/h') {
    return {
      isCommand: true,
      response: `⚡ *Quick Commands*\n━━━━━━━━━━━━━━\n` +
        Object.entries(QUICK_COMMANDS).map(([cmd, info]) => `${cmd} → ${info.desc}`).join('\n') +
        `\n\n📝 *Expense Shortcuts:*\n/add 500 food → Log ₹500 expense\n/add 10000 income → Log income\n\n💡 Or just chat normally!`
    };
  }

  // /add 500 food [note] → quick expense logging
  const addMatch = trimmed.match(/^\/add\s+(\d+)\s+(.+)$/);
  if (addMatch) {
    const amount = addMatch[1];
    const rest = addMatch[2];
    if (rest === 'income' || rest === 'salary') {
      return { isCommand: true, forwardToAPI: `received ${amount} as ${rest}` };
    }
    return { isCommand: true, forwardToAPI: `spent ${amount} on ${rest}` };
  }

  // /remind text time → set reminder
  const remindMatch = trimmed.match(/^\/remind\s+"?(.+?)"?\s+(\d+[ap]m|\d+:\d+)$/);
  if (remindMatch) {
    return { isCommand: true, forwardToAPI: `remind me to ${remindMatch[1]} at ${remindMatch[2]}` };
  }

  // Known commands → forward intent to API
  if (QUICK_COMMANDS[trimmed]) {
    return { isCommand: true, forwardToAPI: QUICK_COMMANDS[trimmed].intent };
  }

  return { isCommand: false };
}

// ============== MESSAGE PROCESSING ==============
async function processMessage(userId, message, senderName) {
  const start = Date.now();
  try {
    const r = await axios.post(PROCESS_ENDPOINT, {
      phone: userId, message, sender_name: senderName
    }, { timeout: 25000 });

    const elapsed = Date.now() - start;
    if (elapsed > 3000) console.log(`[SLOW] ${elapsed}ms for: ${message.substring(0, 40)}`);

    if (r.data?.reply) {
      // Track streak
      updateUserSession(userId, 'lastMessage', Date.now());
      return r.data.reply;
    }
  } catch (e) {
    console.log(`[API] ${e.message}`);
    if (FALLBACK_URL) {
      try {
        const r2 = await axios.post(`${FALLBACK_URL}/api/moneyview/process`, {
          phone: userId, message, sender_name: senderName
        }, { timeout: 20000 });
        if (r2.data?.reply) return r2.data.reply;
      } catch (_) { }
    }
  }
  stats.errors++;
  return "⚠️ Brief connection issue. Please try again! 💛";
}

// ============== VOICE NOTE HANDLER ==============
async function processVoiceNote(msg, jid, userId, name) {
  try {
    console.log(`[${name}] 🎤 Voice note received`);
    stats.voice++;

    // Send typing indicator
    await sock.sendMessage(jid, { text: "🎤 Listening to your voice note..." });

    const buffer = await downloadMediaMessage(msg, 'buffer', {});

    // Save temp file
    const tempDir = './temp';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const tempPath = path.join(tempDir, `voice_${userId}_${Date.now()}.ogg`);
    fs.writeFileSync(tempPath, buffer);

    // Send to backend for transcription
    try {
      const formData = new FormData();
      formData.append('phone', userId);
      formData.append('sender_name', name);

      // Try Whisper transcription via backend
      const r = await axios.post(`${API_URL}/api/moneyview/transcribe`, {
        phone: userId,
        audio_base64: buffer.toString('base64'),
        sender_name: name
      }, { timeout: 30000 });

      if (r.data?.reply) {
        await sock.sendMessage(jid, { text: r.data.reply });
        stats.sent++;
      } else if (r.data?.transcription) {
        // Transcription available, process as text
        const reply = await processMessage(userId, r.data.transcription, name);
        if (reply) {
          await sock.sendMessage(jid, { text: `🎤 _"${r.data.transcription}"_\n\n${reply}` });
          stats.sent++;
        }
      }
    } catch (apiErr) {
      console.log(`[Voice] API error: ${apiErr.message}`);
      await sock.sendMessage(jid, {
        text: "🎤 I heard your voice note but couldn't process it right now.\n\nPlease type your message instead, I'm faster with text! 💬"
      });
      stats.sent++;
    }

    // Cleanup temp file
    try { fs.unlinkSync(tempPath); } catch (_) { }

  } catch (e) {
    console.log(`[Voice] Error: ${e.message}`);
    await sock.sendMessage(jid, {
      text: "🎤 Couldn't process voice note. Please type your message! 💬"
    });
    stats.sent++;
  }
}

// ============== IMAGE/RECEIPT HANDLER ==============
async function processImage(msg, jid, userId, name) {
  const imageMsg = msg.message.imageMessage;
  try {
    console.log(`[${name}] 📸 Image received`);
    stats.images++;

    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    const base64 = buffer.toString('base64');
    const caption = imageMsg.caption || '';

    try {
      const r = await axios.post(IMAGE_ENDPOINT, {
        phone: userId, image_base64: base64, caption, sender_name: name
      }, { timeout: 30000 });

      if (r.data?.reply) {
        await sock.sendMessage(jid, { text: r.data.reply });
        stats.sent++;
      }
    } catch (apiErr) {
      console.log(`[Image] API error: ${apiErr.message}`);
      if (caption) {
        const reply = await processMessage(userId, caption, name);
        if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
      } else {
        await sock.sendMessage(jid, {
          text: "📸 Got your image! To log a payment, just type the amount.\nExample: 'spent 500 on food' or '/add 500 food'"
        });
        stats.sent++;
      }
    }
  } catch (e) {
    console.log(`[Image] Download error: ${e.message}`);
    const caption = imageMsg?.caption || '';
    if (caption) {
      const reply = await processMessage(userId, caption, name);
      if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
    }
  }
}

// ============== USER SESSION TRACKING ==============
function updateUserSession(userId, key, value) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, { firstSeen: Date.now(), messageCount: 0, lastMessage: null });
  }
  const session = userSessions.get(userId);
  session[key] = value;
  if (key === 'lastMessage') session.messageCount++;
  userSessions.set(userId, session);
}

function getUserSession(userId) {
  return userSessions.get(userId) || null;
}

// ============== PROACTIVE MESSAGING ENGINE ==============
function startProactiveEngine() {
  // Check every minute for scheduled proactive messages
  setInterval(async () => {
    if (!isConnected || !sock) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...

    // Process each tracked user
    for (const [userId, session] of userSessions.entries()) {
      const jid = normalizeJid(userId);

      // === MORNING BRIEFING (6:30 AM, weekdays) ===
      if (hours === 6 && minutes === 30 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (!session.morningBriefSent || !isToday(session.morningBriefSent)) {
          try {
            const reply = await processMessage(userId, 'morning briefing', 'System');
            if (reply) {
              await sock.sendMessage(jid, { text: reply });
              stats.sent++;
              session.morningBriefSent = Date.now();
              console.log(`[PROACTIVE] Morning brief → ${userId.slice(-4)}`);
            }
          } catch (_) { }
        }
      }

      // === EVENING CHECK-IN (8:00 PM) ===
      if (hours === 20 && minutes === 0) {
        if (!session.eveningCheckSent || !isToday(session.eveningCheckSent)) {
          try {
            const reply = await processMessage(userId, 'evening checkin', 'System');
            if (reply) {
              await sock.sendMessage(jid, { text: reply });
              stats.sent++;
              session.eveningCheckSent = Date.now();
              console.log(`[PROACTIVE] Evening check → ${userId.slice(-4)}`);
            }
          } catch (_) { }
        }
      }

      // === WEEKLY REVIEW (Sunday 10 AM) ===
      if (dayOfWeek === 0 && hours === 10 && minutes === 0) {
        if (!session.weeklyReviewSent || !isThisWeek(session.weeklyReviewSent)) {
          try {
            const reply = await processMessage(userId, 'weekly review', 'System');
            if (reply) {
              await sock.sendMessage(jid, { text: reply });
              stats.sent++;
              session.weeklyReviewSent = Date.now();
              console.log(`[PROACTIVE] Weekly review → ${userId.slice(-4)}`);
            }
          } catch (_) { }
        }
      }

      // === STREAK AT RISK (9 PM - if no message today) ===
      if (hours === 21 && minutes === 0 && session.messageCount > 5) {
        if (session.lastMessage && !isToday(session.lastMessage)) {
          if (!session.streakAlertSent || !isToday(session.streakAlertSent)) {
            const daysSinceActive = Math.floor((Date.now() - session.lastMessage) / 86400000);
            if (daysSinceActive === 1) {
              await sock.sendMessage(jid, {
                text: `🔥 *Streak Alert!*\n\nYou haven't logged anything today.\nDon't break your tracking habit!\n\nQuick log: just type the amount\nExample: "200 lunch" or /add 200 food`
              });
              stats.sent++;
              session.streakAlertSent = Date.now();
              console.log(`[PROACTIVE] Streak alert → ${userId.slice(-4)}`);
            }
          }
        }
      }
    }
  }, 60000); // Check every minute

  console.log('[ENGINE] Proactive messaging engine started ✅');
}

// ============== WELCOME MESSAGE ==============
async function sendWelcomeMessage(jid, name) {
  const welcome = `👋 *Hey ${name}!*\n\nI'm *Viya* — your personal AI wealth manager 💰\n\nI live right here in WhatsApp. No app needed.\n\n` +
    `*What I can do:*\n` +
    `💰 Track expenses ("spent 500 on food")\n` +
    `🎯 Set goals ("save 80K for bike")\n` +
    `📊 Weekly reviews & insights\n` +
    `🔥 Build financial habits\n` +
    `📸 Scan receipts (send photo)\n` +
    `🎤 Voice notes (just talk!)\n\n` +
    `*Quick start:*\n` +
    `Type /help for all commands\n` +
    `Or just chat normally — I understand! 💬\n\n` +
    `_Let's make you richer, smarter & happier_ 🚀`;

  await sock.sendMessage(jid, { text: welcome });
  stats.sent++;
}

// ============== SHARE/VIRAL HELPERS ==============
function generateShareMessage(achievement) {
  return `🎉 *Achievement Unlocked!*\n\n${achievement}\n\n` +
    `Want to share this win with friends?\n` +
    `Reply "share" and I'll create a shareable message! 📤`;
}

// ============== UTILITY FUNCTIONS ==============
function normalizeJid(phone) {
  if (phone.includes('@')) return phone;
  return phone.replace(/\D/g, '').replace(/^(?!91)(\d{10})$/, '91$1') + '@s.whatsapp.net';
}

function isToday(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isThisWeek(timestamp) {
  return (Date.now() - timestamp) < 7 * 86400000;
}

// ============== START BOT ==============
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();
  console.log('🤖 MoneyViya Bot v6.0 connecting... API:', API_URL);

  sock = makeWASocket({
    version, auth: state, printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['MoneyViya', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000, keepAliveIntervalMs: 25000,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { latestQR = qr; console.log('\n📱 QR ready! Open /qr in browser.\n'); }
    if (connection === 'close') {
      isConnected = false; latestQR = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Resetting session...');
        if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true });
        setTimeout(startBot, 5000);
      } else if (reconnectAttempts < 50) {
        reconnectAttempts++;
        const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts - 1), 60000);
        console.log(`[Reconnect] #${reconnectAttempts} in ${Math.round(delay / 1000)}s`);
        setTimeout(startBot, delay);
      }
    } else if (connection === 'open') {
      isConnected = true; reconnectAttempts = 0; latestQR = null;
      console.log('\n✅ WhatsApp Connected! MoneyViya Bot LIVE 24/7.\n');
      startProactiveEngine();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ============== MESSAGE HANDLER ==============
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid?.endsWith('@g.us')) continue;

      const jid = msg.key.remoteJid;
      const userId = jid.replace(/@s\.whatsapp\.net$/, '');
      const name = msg.pushName || 'Friend';
      stats.received++;

      // Track user session
      updateUserSession(userId, 'lastMessage', Date.now());

      // ─── Handle Voice Notes ───
      const audioMsg = msg.message.audioMessage;
      if (audioMsg) {
        await processVoiceNote(msg, jid, userId, name);
        continue;
      }

      // ─── Handle Images (Receipt Scanner) ───
      const imageMsg = msg.message.imageMessage;
      if (imageMsg) {
        await processImage(msg, jid, userId, name);
        continue;
      }

      // ─── Handle Sticker/Video (acknowledge) ───
      if (msg.message.stickerMessage || msg.message.videoMessage) {
        const caption = msg.message.videoMessage?.caption || '';
        if (caption) {
          const reply = await processMessage(userId, caption, name);
          if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
        }
        continue;
      }

      // ─── Handle Text Messages ───
      let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (!text) continue;

      // Check for forwarded messages
      const contextInfo = msg.message.extendedTextMessage?.contextInfo || {};
      const isForwarded = contextInfo.isForwarded;
      if (isForwarded) {
        text = `[FORWARDED] ${text}`;
        console.log(`[${name}] ↪️ Forwarded: ${text.substring(0, 60)}`);
      } else {
        console.log(`[${name}] ${text.substring(0, 60)}`);
      }

      // ─── QUICK COMMAND CHECK (bypass LLM for speed) ───
      const cmd = parseQuickCommand(text);
      if (cmd.isCommand) {
        stats.commands++;
        if (cmd.response) {
          // Direct response (no API call needed)
          await sock.sendMessage(jid, { text: cmd.response });
          stats.sent++;
        } else if (cmd.forwardToAPI) {
          // Command parsed → forward clean intent to API
          const reply = await processMessage(userId, cmd.forwardToAPI, name);
          if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
        }
        continue;
      }

      // ─── First-time user welcome ───
      const session = getUserSession(userId);
      if (session && session.messageCount <= 1) {
        await sendWelcomeMessage(jid, name);
        // Still process their actual message
      }

      // ─── PROCESS THROUGH AI AGENT ───
      const reply = await processMessage(userId, text, name);
      if (reply) {
        await sock.sendMessage(jid, { text: reply });
        stats.sent++;

        // ─── POST-RESPONSE: Quick command education ───
        if (session && session.messageCount === 5 && !session.commandTipSent) {
          setTimeout(async () => {
            await sock.sendMessage(jid, {
              text: `💡 *Pro Tip:* For faster logging, try:\n\n/add 500 food → Instant expense log\n/bal → Quick balance check\n/help → All commands\n\nSame result, 2x faster! ⚡`
            });
            stats.sent++;
            session.commandTipSent = true;
          }, 2000);
        }
      }
    }
  });
}

// Self-ping keep-alive for cloud platforms
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || process.env.DEPLOY_URL;
  if (url) axios.get(`${url}/ping`).catch(() => { });
}, 13 * 60 * 1000);

// ============== LAUNCH ==============
startBot().catch(e => {
  console.error('Start failed:', e.message);
  setTimeout(() => startBot().catch(console.error), 10000);
});
