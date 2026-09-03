const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ ok: false, error: 'method not allowed' }); return; }

  try {
    const raw = fs.readFileSync(path.join(__dirname, 'bots.json'), 'utf8');
    const bots = JSON.parse(raw);
    res.status(200).json({ ok: true, bots });
  } catch (e) {
    res.status(200).json({ ok: true, bots: {} });
  }
};
