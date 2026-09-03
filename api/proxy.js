const fs = require('fs');
const path = require('path');

// Pulls the Telegram user id out of the raw initData string.
// This is a coarse, unsigned check used only for the proxy-level allow-list —
// the bot's own webhook independently re-validates the signature and identity
// on every request, so this can never be the sole security boundary.
function extractUserId(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const userRaw = params.get('user');
  if (!userRaw) return null;
  const m = userRaw.match(/"id"\s*:\s*(\d+)/);
  return m ? m[1] : null;
}

module.exports = async function handler(req, res) {
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
    let bots = {};
    let botsLoadError = null;
    try {
      const raw = fs.readFileSync(path.join(__dirname, 'bots.json'), 'utf8');
      bots = JSON.parse(raw);
    } catch (e) {
      botsLoadError = String(e && e.message ? e.message : e);
    }

    const { api, botid, action, init_data, ...rest } = req.body || {};

    let targetUrl = null;

    if (botid) {
      if (botsLoadError) {
        res.status(500).json({ ok: false, error: 'Bot registry failed to load: ' + botsLoadError });
        return;
      }
      const entry = bots[String(botid)];
      if (!entry) {
        res.status(404).json({ ok: false, error: `Unknown botid "${botid}" — this bot hasn't been registered yet.` });
        return;
      }

      // Support both the legacy plain-string format and the new object format.
      if (typeof entry === 'string') {
        targetUrl = entry;
      } else {
        targetUrl = entry.webhook;
        const allowed = entry.allowed_users;
        if (Array.isArray(allowed) && allowed.length > 0) {
          const uid = extractUserId(init_data);
          if (!uid || !allowed.map(String).includes(String(uid))) {
            res.status(403).json({ ok: false, error: 'This mini app is restricted — your account does not have access.' });
            return;
          }
        }
      }

      if (!targetUrl) {
        res.status(500).json({ ok: false, error: `Bot "${botid}" is registered but has no webhook configured.` });
        return;
      }
    } else if (api && typeof api === 'string' && api.startsWith('https://')) {
      // Legacy path: a raw webhook URL passed directly
      targetUrl = api;
    } else {
      res.status(400).json({ ok: false, error: 'missing botid or api url' });
      return;
    }

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, init_data, ...rest })
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
};
