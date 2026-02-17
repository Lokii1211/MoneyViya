/**
 * MoneyViya WhatsApp Bot v5.0 — CLOUD DEPLOYMENT
 * ================================================
 * Runs on Render 24/7 WITHOUT your PC being on.
 * Scan QR code via web browser at /qr endpoint.
 * Auto-reconnects, auto-heals, self-ping keep-alive.
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const express = require('express');
const QRCode = require('qrcode');

// ============ CONFIG ============
const API_URL = process.env.API_URL || 'https://moneyviya-api.onrender.com';
const FALLBACK_URL = process.env.FALLBACK_URL || '';
const PORT = process.env.PORT || 3001;
const PROCESS_ENDPOINT = `${API_URL}/api/moneyview/process`;

// ============ STATE ============
let sock;
let isConnected = false;
let reconnectAttempts = 0;
let latestQR = null;
let stats = { sent: 0, received: 0, errors: 0, started: Date.now() };

// ============ EXPRESS SERVER ============
const app = express();
app.use(express.json());

// QR Code Web Page — scan from your phone browser!
app.get('/qr', (req, res) => {
    if (isConnected) {
        return res.send(`
            <html><head><meta name="viewport" content="width=device-width,initial-scale=1">
            <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#E8F9F2;text-align:center}
            .card{background:#fff;padding:48px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1)}</style></head>
            <body><div class="card">
            <h1 style="color:#00A86B;font-size:64px;margin:0">✅</h1>
            <h2 style="color:#00A86B">WhatsApp Connected!</h2>
            <p style="color:#666">Bot is running 24/7. You can close this page.</p>
            <p style="margin-top:16px;font-size:13px;color:#999">Uptime: ${Math.floor((Date.now() - stats.started) / 60000)} min | Msgs: ${stats.received} in, ${stats.sent} out</p>
            </div></body></html>
        `);
    }
    if (!latestQR) {
        return res.send(`
            <html><head><meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="refresh" content="3">
            <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF8E8;text-align:center}
            .card{background:#fff;padding:48px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1)}</style></head>
            <body><div class="card">
            <h1 style="font-size:48px;margin:0">⏳</h1>
            <h2>Generating QR Code...</h2>
            <p style="color:#666">This page auto-refreshes every 3 seconds.</p>
            </div></body></html>
        `);
    }
    // Generate QR as image
    QRCode.toDataURL(latestQR, { width: 300, margin: 2 }, (err, url) => {
        res.send(`
            <html><head><meta name="viewport" content="width=device-width,initial-scale=1">
            <meta http-equiv="refresh" content="20">
            <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;text-align:center}
            .card{background:#fff;padding:32px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1);max-width:400px}
            img{border-radius:12px;margin:16px 0}</style></head>
            <body><div class="card">
            <h2 style="color:#00A86B">📱 Scan with WhatsApp</h2>
            <img src="${url}" alt="QR Code" width="280">
            <p style="font-size:14px;color:#666"><b>Steps:</b><br>1. Open WhatsApp<br>2. Settings → Linked Devices<br>3. Link a Device<br>4. Scan this QR code</p>
            <p style="font-size:12px;color:#999;margin-top:12px">Page refreshes automatically. QR expires in ~20s.</p>
            </div></body></html>
        `);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: isConnected ? 'connected' : 'waiting_for_qr',
        bot: 'MoneyViya Bot v5.0 (Cloud)',
        uptime: Math.floor((Date.now() - stats.started) / 1000),
        stats,
        api: API_URL
    });
});

// Send message API (called by Render backend for scheduled messages)
app.post('/send', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
        if (!isConnected || !sock) return res.status(503).json({ error: 'Bot not connected' });

        let jid = phone.includes('@') ? phone : (phone.replace(/\D/g, '').replace(/^(?!91)(\d{10})$/, '91$1') + '@s.whatsapp.net');
        await sock.sendMessage(jid, { text: message });
        stats.sent++;
        res.json({ success: true, to: jid });
    } catch (e) {
        stats.errors++;
        res.status(500).json({ error: e.message });
    }
});

// Self-ping keep-alive (prevents Render free tier from sleeping)
app.get('/ping', (req, res) => res.send('pong'));

const server = app.listen(PORT, () => {
    console.log(`\n🌐 Bot Web UI: http://localhost:${PORT}/qr`);
    console.log(`📡 Health: http://localhost:${PORT}/health\n`);
});

// ============ MESSAGE PROCESSING ============
async function processMessage(userId, message, senderName) {
    try {
        // Try primary API
        const r = await axios.post(PROCESS_ENDPOINT, {
            phone: userId, message, sender_name: senderName
        }, { timeout: 25000, headers: { 'Content-Type': 'application/json' } });

        if (r.data?.reply) return r.data.reply;
    } catch (e) {
        console.log(`[API Error] ${e.message}`);
        // Try fallback
        if (FALLBACK_URL) {
            try {
                const r2 = await axios.post(`${FALLBACK_URL}/api/moneyview/process`, {
                    phone: userId, message, sender_name: senderName
                }, { timeout: 20000 });
                if (r2.data?.reply) return r2.data.reply;
            } catch (_) { }
        }
    }
    return "⚠️ Brief connection issue. Please try again in a moment! 💛";
}

// ============ BOT START ============
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    console.log('🤖 Starting WhatsApp connection...');
    console.log(`🔗 API: ${API_URL}`);

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['MoneyViya', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log('\n📱 QR Code ready! Open /qr in browser to scan.\n');
        }

        if (connection === 'close') {
            isConnected = false;
            latestQR = null;
            const code = lastDisconnect?.error?.output?.statusCode;

            if (code === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Deleting session...');
                const fs = require('fs');
                if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true });
                setTimeout(startBot, 5000);
            } else if (reconnectAttempts < 50) {
                reconnectAttempts++;
                const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts - 1), 60000);
                console.log(`[Reconnect] Attempt ${reconnectAttempts} in ${Math.round(delay / 1000)}s...`);
                setTimeout(startBot, delay);
            }
        } else if (connection === 'open') {
            isConnected = true;
            reconnectAttempts = 0;
            latestQR = null;
            console.log('\n✅ WhatsApp Connected! Bot is LIVE 24/7.\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid?.endsWith('@g.us')) continue;

            const text = msg.message.conversation
                || msg.message.extendedTextMessage?.text
                || msg.message.imageMessage?.caption || '';
            if (!text) continue;

            const jid = msg.key.remoteJid;
            const userId = jid.replace(/@s\.whatsapp\.net$/, '');
            const name = msg.pushName || 'Friend';

            stats.received++;
            console.log(`[${name}] ${text.substring(0, 50)}`);

            const reply = await processMessage(userId, text, name);
            if (reply) {
                await sock.sendMessage(jid, { text: reply });
                stats.sent++;
            }
        }
    });
}

// ============ SELF-PING KEEP-ALIVE ============
setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL || process.env.DEPLOY_URL;
    if (url) {
        axios.get(`${url}/ping`).catch(() => { });
    }
}, 13 * 60 * 1000); // Every 13 minutes

// ============ START ============
startBot().catch(e => {
    console.error('Startup failed:', e.message);
    setTimeout(() => startBot().catch(console.error), 10000);
});
