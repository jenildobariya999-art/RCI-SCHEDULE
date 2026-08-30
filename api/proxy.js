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
    const { api, action, ...rest } = req.body || {};

    if (!api || typeof api !== 'string' || !api.startsWith('https://')) {
      res.status(400).json({ ok: false, error: 'missing or invalid api url' });
      return;
    }

    const upstream = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...rest })
    });

    const text = await upstream.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      res.status(502).json({
        ok: false,
        error: 'upstream returned non-JSON',
        raw: text.slice(0, 300)
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}
