import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let bots = {};
try {
  bots = JSON.parse(readFileSync(join(__dirname, 'bots.json'), 'utf8'));
} catch (e) {
  bots = {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  try {
    const { api, botid, action, ...rest } = req.body || {};

    if (Object.keys(bots).length === 0 && botid) {
      res.status(500).json({ ok: false, error: 'Bot registry (bots.json) failed to load on the server — check the Vercel function logs.' });
      return;
    }

    let targetUrl = null;

    if (botid) {
      targetUrl = bots[String(botid)];
      if (!targetUrl) {
        res.status(404).json({ ok: false, error: `Unknown botid "${botid}" — this bot hasn't been registered yet.` });
        return;
      }
    } else if (api && typeof api === 'string' && api.startsWith('https://')) {
      // Legacy path: a raw webhook URL passed directly (e.g. older per-user "Open App" links)
      targetUrl = api;
    } else {
      res.status(400).json({ ok: false, error: 'missing botid or api url' });
      return;
    }

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...rest })
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      res.status(502).json({ ok: false, error: 'upstream returned non-JSON', raw: text.slice(0, 300) });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
