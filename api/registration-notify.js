
const recentByIp = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 4;

function reply(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Method not allowed' });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return reply(res, 500, { error: 'Notification service is not configured' });
  }

  let webhookUrl;
  try {
    webhookUrl = new URL(webhook);
    if (
      !['discord.com', 'discordapp.com'].includes(webhookUrl.hostname) ||
      !webhookUrl.pathname.startsWith('/api/webhooks/')
    ) {
      return reply(res, 500, { error: 'Invalid webhook configuration' });
    }
  } catch {
    return reply(res, 500, { error: 'Invalid webhook configuration' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (typeof body.company_website === 'string' && body.company_website.trim()) {
    return reply(res, 200, { ok: true });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (
    username.length < 3 ||
    username.length > 32 ||
    !/^[\p{L}\p{N}_.-]+$/u.test(username)
  ) {
    return reply(res, 400, { error: 'Invalid username' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : '') || 'unknown';

  const now = Date.now();
  const prior = recentByIp.get(ip);

  if (prior && now - prior.start < WINDOW_MS && prior.count >= MAX_PER_WINDOW) {
    return reply(res, 429, { error: 'Too many requests. Try again shortly.' });
  }

  if (!prior || now - prior.start >= WINDOW_MS) {
    recentByIp.set(ip, { start: now, count: 1 });
  } else {
    recentByIp.set(ip, { start: prior.start, count: prior.count + 1 });
  }

  for (const [key, value] of recentByIp) {
    if (now - value.start >= WINDOW_MS * 5) recentByIp.delete(key);
  }

  const createdAt = new Date();
  const safeUsername = username.replace(/`/g, 'ˋ');

  const payload = {
    username: 'ISC Registration',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: 'Pendaftaran akun ISC baru',
      color: 0x3399ff,
      fields: [
        { name: 'Username', value: safeUsername, inline: true },
        {
          name: 'Waktu pendaftaran',
          value: createdAt.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'medium',
            timeStyle: 'long'
          }) + ' WIB',
          inline: false
        }
      ],
      footer: {
        text: 'International Science Community • Notifikasi otomatis'
      },
      timestamp: createdAt.toISOString()
    }]
  };

  try {
    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return reply(res, 502, {
        error: 'Discord notification could not be delivered'
      });
    }

    return reply(res, 200, { ok: true });
  } catch {
    return reply(res, 502, {
      error: 'Discord notification could not be delivered'
    });
  }
};
    
