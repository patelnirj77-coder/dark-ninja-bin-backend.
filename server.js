'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN === '*' || origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN === '*' ? '*' : origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const lookupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Rate limit reached. Please try again later.' }
});

app.get('/', (_req, res) => {
  res.json({ service: 'DARK NINJA BIN lookup backend', status: 'online' });
});

app.get('/api/bin/:prefix', lookupLimiter, async (req, res) => {
  const prefix = String(req.params.prefix || '');
  if (!/^(?:\d{6}|\d{8})$/.test(prefix)) {
    return res.status(400).json({ error: 'Enter only a 6-digit or 8-digit BIN/IIN prefix.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(`https://lookup.binlist.net/${encodeURIComponent(prefix)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Accept-Version': '3' },
      signal: controller.signal
    });

    if (upstream.status === 404) return res.status(404).json({ error: 'No metadata found for this prefix.' });
    if (upstream.status === 429) return res.status(429).json({ error: 'The BIN provider rate limit was reached. Try later.' });
    if (!upstream.ok) return res.status(502).json({ error: `BIN provider returned HTTP ${upstream.status}.` });

    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    const timedOut = err && err.name === 'AbortError';
    return res.status(502).json({ error: timedOut ? 'BIN provider request timed out.' : 'Could not reach the BIN provider.' });
  } finally {
    clearTimeout(timeout);
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.listen(PORT, () => console.log(`DARK NINJA backend listening on port ${PORT}`));
