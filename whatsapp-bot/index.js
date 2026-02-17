/**
 * MoneyViya WhatsApp Bot v5.0 — CLOUD (ESM)
 * Runs on Render 24/7. Scan QR at /qr endpoint.
 */

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';
import express from 'express';
import QRCode from 'qrcode';
import fs from 'fs';

const API_URL = process.env.API_URL || 'https://moneyviya-api.onrender.com';
const FALLBACK_URL = process.env.FALLBACK_URL || '';
const PORT = process.env.PORT || 3001;
const PROCESS_ENDPOINT = `${API_URL}/api/moneyview/process`;

let sock, isConnected = false, reconnectAttempts = 0, latestQR = null;
let stats = { sent: 0, received: 0, errors: 0, started: Date.now() };

const app = express();
app.use(express.json());

// ===== QR Code Web Page =====
app.get('/qr', (req, res) => {
    if (isConnected) {
        return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#E8F9F2;text-align:center}
        .c{background:#fff;padding:48px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1)}</style></head>
        <body><div class="c"><h1 style="color:#00A86B;font-size:64px;margin:0">✅</h1>
        <h2 style="color:#00A86B">WhatsApp Connected!</h2>
        <p style="color:#666">Bot is running 24/7.</p>
        <p style="font-size:13px;color:#999;margin-top:16px">Uptime: ${Math.floor((Date.now() - stats.started) / 60000)} min | Msgs: ${stats.received} in, ${stats.sent} out</p>
        </div></body></html>`);
    }
    if (!latestQR) {
        return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="refresh" content="3">
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF8E8;text-align:center}
        .c{background:#fff;padding:48px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1)}</style></head>
        <body><div class="c"><h1 style="font-size:48px;margin:0">⏳</h1><h2>Generating QR Code...</h2>
        <p style="color:#666">Auto-refreshes every 3 seconds.</p></div></body></html>`);
    }
    QRCode.toDataURL(latestQR, { width: 300, margin: 2 }, (err, url) => {
        res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="refresh" content="20">
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;text-align:center}
        .c{background:#fff;padding:32px;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.1);max-width:400px}
        img{border-radius:12px;margin:16px 0}</style></head>
        <body><div class="c"><h2 style="color:#00A86B">📱 Scan with WhatsApp</h2>
        <img src="${url}" alt="QR" width="280">
        <p style="font-size:14px;color:#666"><b>Steps:</b><br>1. Open WhatsApp<br>2. Settings → Linked Devices<br>3. Link a Device<br>4. Scan this QR</p>
        <p style="font-size:12px;color:#999;margin-top:12px">Auto-refreshes. QR expires ~20s.</p></div></body></html>`);
    });
});

app.get('/health', (req, res) => res.json({ status: isConnected ? 'connected' : 'waiting_qr', uptime: Math.floor((Date.now() - stats.started) / 1000), stats, api: API_URL }));
app.post('/send', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
        if (!isConnected || !sock) return res.status(503).json({ error: 'Not connected' });
        let jid = phone.includes('@') ? phone : (phone.replace(/\D/g, '').replace(/^(?!91)(\d{10})$/, '91$1') + '@s.whatsapp.net');
        await sock.sendMessage(jid, { text: message });
        stats.sent++;
        res.json({ success: true });
    } catch (e) { stats.errors++; res.status(500).json({ error: e.message }); }
});
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`\n🌐 Bot: http://localhost:${PORT}/qr\n`));

// ===== Process Message =====
async function processMessage(userId, message, senderName) {
    try {
        const r = await axios.post(PROCESS_ENDPOINT, { phone: userId, message, sender_name: senderName }, { timeout: 25000 });
        if (r.data?.reply) return r.data.reply;
    } catch (e) {
        console.log(`[API] ${e.message}`);
        if (FALLBACK_URL) {
            try { const r2 = await axios.post(`${FALLBACK_URL}/api/moneyview/process`, { phone: userId, message, sender_name: senderName }, { timeout: 20000 }); if (r2.data?.reply) return r2.data.reply; } catch (_) { }
        }
    }
    return "⚠️ Brief connection issue. Please try again! 💛";
}

// ===== Start Bot =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
    console.log('🤖 Connecting WhatsApp... API:', API_URL);

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
            console.log('\n✅ WhatsApp Connected! Bot LIVE 24/7.\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid?.endsWith('@g.us')) continue;

            const jid = msg.key.remoteJid;
            const userId = jid.replace(/@s\.whatsapp\.net$/, '');
            const name = msg.pushName || 'Friend';
            stats.received++;

            // ─── Handle Image Messages (Layer 3: Screenshot Parser) ───
            const imageMsg = msg.message.imageMessage;
            if (imageMsg) {
                try {
                    console.log(`[${name}] 📸 Image received — parsing...`);
                    const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                    const buffer = await downloadMediaMessage(msg, 'buffer', {});
                    const base64 = buffer.toString('base64');
                    const caption = imageMsg.caption || '';

                    // Send to screenshot parser API
                    try {
                        const r = await axios.post(`${API_URL}/api/moneyview/parse-image`, {
                            phone: userId,
                            image_base64: base64,
                            caption: caption,
                            sender_name: name
                        }, { timeout: 30000 });

                        if (r.data?.reply) {
                            await sock.sendMessage(jid, { text: r.data.reply });
                            stats.sent++;
                        }
                    } catch (apiErr) {
                        console.log(`[API] Image parse error: ${apiErr.message}`);
                        // Fallback — process caption as text if available
                        if (caption) {
                            const reply = await processMessage(userId, caption, name);
                            if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
                        } else {
                            await sock.sendMessage(jid, { text: "📸 I can see your image! To log a payment, just type the amount.\nExample: 'spent 500 on food'" });
                            stats.sent++;
                        }
                    }
                } catch (dlErr) {
                    console.log(`[Image] Download error: ${dlErr.message}`);
                    const caption = imageMsg.caption || '';
                    if (caption) {
                        const reply = await processMessage(userId, caption, name);
                        if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
                    }
                }
                continue;
            }

            // ─── Handle Text Messages ───
            let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            if (!text) continue;

            // ─── Detect Forwarded Messages (Layer 3: Forward Parser) ───
            const contextInfo = msg.message.extendedTextMessage?.contextInfo || {};
            const isForwarded = contextInfo.isForwarded || msg.message.extendedTextMessage?.contextInfo?.isForwarded;

            if (isForwarded) {
                // Tag as forwarded so API can route to the forwarded message parser
                text = `[FORWARDED] ${text}`;
                console.log(`[${name}] ↪️ Forwarded: ${text.substring(0, 60)}`);
            } else {
                console.log(`[${name}] ${text.substring(0, 50)}`);
            }

            const reply = await processMessage(userId, text, name);
            if (reply) { await sock.sendMessage(jid, { text: reply }); stats.sent++; }
        }
    });
}

// Self-ping keep-alive
setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL || process.env.DEPLOY_URL;
    if (url) axios.get(`${url}/ping`).catch(() => { });
}, 13 * 60 * 1000);

startBot().catch(e => { console.error('Start failed:', e.message); setTimeout(() => startBot().catch(console.error), 10000); });
