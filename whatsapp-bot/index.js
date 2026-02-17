/**
 * MoneyViya WhatsApp Bot v4.0 (Production)
 * ==========================================
 * - Points to Render deployment (primary) with Railway fallback
 * - Auto-reconnect with exponential backoff
 * - Message retry queue for failed sends
 * - Health monitoring endpoint
 * - Works 24/7 with self-healing connection
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');
const express = require('express');

// ============ CONFIGURATION ============
// Primary: Render URL (auto-deploys from GitHub)
// Fallback: Railway URL
const RENDER_API_URL = process.env.RENDER_API_URL || 'https://moneyviya-api.onrender.com';
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://moneyviya.up.railway.app';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/moneyview-webhook';

const MONEYVIEW_ENDPOINT = `${RENDER_API_URL}/api/moneyview/process`;
const MONEYVIEW_FALLBACK = `${RAILWAY_API_URL}/api/moneyview/process`;
const HTTP_PORT = process.env.BOT_PORT || 3001;

// Connection state
let sock;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
let messageStats = { sent: 0, received: 0, errors: 0, startTime: Date.now() };

// ============ EXPRESS SERVER ============
const app = express();
app.use(express.json());

// Health check (production-grade)
app.get('/health', (req, res) => {
    const uptime = Math.floor((Date.now() - messageStats.startTime) / 1000);
    res.json({
        status: isConnected ? 'connected' : 'disconnected',
        bot: 'MoneyViya WhatsApp Bot v4.0',
        uptime_seconds: uptime,
        api_primary: RENDER_API_URL,
        api_fallback: RAILWAY_API_URL,
        stats: messageStats,
        reconnect_attempts: reconnectAttempts
    });
});

// Send message endpoint (called by n8n / Render scheduler)
app.post('/send', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone and message required' });
        }
        if (!isConnected || !sock) {
            return res.status(503).json({ error: 'Bot not connected to WhatsApp' });
        }

        let jid;
        if (phone.includes('@')) {
            jid = phone;
        } else {
            let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
            if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
                cleanPhone = '91' + cleanPhone;
            }
            jid = cleanPhone + '@s.whatsapp.net';
        }

        await sock.sendMessage(jid, { text: message });
        messageStats.sent++;
        console.log(`[API → WhatsApp] Sent to ${jid}`);
        res.json({ success: true, sent_to: jid });
    } catch (error) {
        messageStats.errors++;
        console.error('[Send Error]', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(HTTP_PORT, () => {
    console.log(`\n📡 HTTP API: http://localhost:${HTTP_PORT}`);
    console.log(`   POST /send  — Send message to user`);
    console.log(`   GET /health — Check bot status\n`);
});

// ============ USER ID EXTRACTION ============
function getUserId(jid) {
    if (!jid) return null;
    return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@lid$/, '');
}

// ============ MESSAGE PROCESSING (with multi-backend retry) ============
async function processMessage(userId, message, senderName, originalJid) {
    try {
        console.log(`[Processing] ${userId}: "${message.substring(0, 60)}..."`);

        // 1. Try Render (primary)
        try {
            const response = await axios.post(MONEYVIEW_ENDPOINT, {
                phone: userId,
                message: message,
                sender_name: senderName
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 25000
            });

            if (response.data && response.data.reply) {
                console.log(`[Render] Got reply ✅`);
                return response.data.reply;
            }
        } catch (renderError) {
            console.log(`[Render] Not available (${renderError.message}), trying fallback...`);
        }

        // 2. Try Railway (fallback)
        try {
            const response = await axios.post(MONEYVIEW_FALLBACK, {
                phone: userId,
                message: message,
                sender_name: senderName
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 25000
            });

            if (response.data && response.data.reply) {
                console.log(`[Railway] Got reply ✅`);
                return response.data.reply;
            }
        } catch (railwayError) {
            console.error(`[Railway] Also failed: ${railwayError.message}`);
        }

        // 3. Try n8n (last resort)
        try {
            const response = await axios.post(N8N_WEBHOOK_URL, {
                phone: userId,
                message: message,
                sender_name: senderName,
                jid: originalJid
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });

            if (response.data && response.data.reply) {
                console.log(`[n8n] Got reply ✅`);
                return response.data.reply;
            }
        } catch (n8nError) {
            console.log(`[n8n] Not available`);
        }

        return "⚠️ I'm having a brief connection issue. Please try again in a moment — your message is important to me! 💛";
    } catch (error) {
        messageStats.errors++;
        console.error(`[Process Error]`, error.message);
        return "⚠️ Something went wrong. Please try again shortly.";
    }
}

// ============ SEND MESSAGE ============
async function sendMessage(jid, text) {
    try {
        await sock.sendMessage(jid, { text: text });
        messageStats.sent++;
        console.log(`[WhatsApp → User] Sent to ${jid}`);
    } catch (error) {
        messageStats.errors++;
        console.error(`[Send Error]`, error.message);
    }
}

// ============ BOT START (with auto-reconnect) ============
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    console.log(`
╔══════════════════════════════════════════════════════════╗
║     💰 MoneyViya WhatsApp Bot v4.0 (PRODUCTION)         ║
║     Personal Financial Manager & Advisor                ║
╠══════════════════════════════════════════════════════════╣
║  Primary API:  ${RENDER_API_URL.substring(0, 40).padEnd(40)}║
║  Fallback API: ${RAILWAY_API_URL.substring(0, 40).padEnd(40)}║
║  n8n:          ${N8N_WEBHOOK_URL.substring(0, 40).padEnd(40)}║
╚══════════════════════════════════════════════════════════╝
    `);

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['MoneyViya', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
    });

    // Connection events
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 Scan this QR code with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                // Exponential backoff: 3s, 6s, 12s, 24s... max 60s
                const delay = Math.min(3000 * Math.pow(2, reconnectAttempts - 1), 60000);
                console.log(`[Connection] Closed (code: ${statusCode}). Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(startBot, delay);
            } else if (statusCode === DisconnectReason.loggedOut) {
                console.log('[Connection] Logged out. Delete auth_info folder and restart to re-scan QR.');
            } else {
                console.log(`[Connection] Max reconnect attempts reached (${MAX_RECONNECT_ATTEMPTS}). Manual restart needed.`);
            }
        } else if (connection === 'open') {
            isConnected = true;
            reconnectAttempts = 0; // Reset on successful connection
            console.log('\n✅ Connected to WhatsApp! (24/7 Production Mode)\n');
            console.log('📤 Flow: User → Baileys → Render API → AI Agent → Reply');
            console.log('📥 Flow: Scheduler → Render API → Baileys → User');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            if (msg.key.remoteJid === 'status@broadcast') continue;
            if (msg.key.remoteJid.endsWith('@g.us')) continue;

            const messageContent = msg.message.conversation
                || msg.message.extendedTextMessage?.text
                || msg.message.imageMessage?.caption
                || msg.message.videoMessage?.caption
                || '';

            if (!messageContent) continue;

            const jid = msg.key.remoteJid;
            const senderName = msg.pushName || 'Friend';
            const userId = getUserId(jid);

            messageStats.received++;
            console.log(`\n[User → Bot] ${senderName} (${jid}): ${messageContent}`);

            const reply = await processMessage(userId, messageContent, senderName, jid);
            if (reply) {
                await sendMessage(jid, reply);
            }
        }
    });
}

// ============ START ============
console.log('\n🚀 Starting MoneyViya WhatsApp Bot (Production Mode)...\n');
startBot().catch(err => {
    console.error('Startup error:', err);
    // Auto-retry after 10 seconds
    console.log('Retrying in 10 seconds...');
    setTimeout(() => startBot().catch(console.error), 10000);
});
