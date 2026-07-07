import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8787;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const RATE_LIMIT_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const recentRequests = new Map();

app.use(express.json({ limit: '16kb' }));

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = (recentRequests.get(ip) || []).filter((time) => now - time < RATE_LIMIT_MS);

    if (timestamps.length >= RATE_LIMIT_MAX) {
        recentRequests.set(ip, timestamps);
        return true;
    }

    timestamps.push(now);
    recentRequests.set(ip, timestamps);
    return false;
}

function sanitize(value, maxLength) {
    return String(value || '')
        .trim()
        .slice(0, maxLength)
        .replace(/```/g, "'''");
}

app.post('/api/contact', async (req, res) => {
    if (!WEBHOOK_URL) {
        return res.status(500).json({ success: false, message: 'Contact service is not configured.' });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, message: 'Too many messages. Please wait a minute and try again.' });
    }

    const { name, email, message, website } = req.body || {};

    if (website) {
        return res.json({ success: true, message: 'Message sent successfully.' });
    }

    const safeName = sanitize(name, 120);
    const safeEmail = sanitize(email, 200);
    const safeMessage = sanitize(message, 2000);

    if (!safeName || !safeEmail || !safeMessage) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const payload = {
        embeds: [
            {
                title: 'New message from Hades Solutions',
                color: 0xff5a5a,
                fields: [
                    { name: 'Name', value: safeName, inline: true },
                    { name: 'Email', value: safeEmail, inline: true },
                    { name: 'Message', value: safeMessage },
                ],
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return res.status(502).json({ success: false, message: 'Unable to send your message right now. Please try again later.' });
        }

        return res.json({ success: true, message: 'Message sent successfully. We will get back to you soon.' });
    } catch {
        return res.status(502).json({ success: false, message: 'Unable to send your message right now. Please try again later.' });
    }
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'Not found.' });
    }
    return res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Hades Solutions site running on http://localhost:${PORT}`);
});
