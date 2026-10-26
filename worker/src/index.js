// HomeBackupCost email Worker: POST /report (email the user's report + add to list), POST /subscribe (newsletter).
// All keys come from env; with none set it refuses to do anything (returns 503).
import { buildReport } from '../../src/data/report.js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY = 16 * 1024;
const hits = new Map(); // per-isolate best-effort limiter; pair with a Cloudflare rate-limit rule (see README)

function cors(env, origin) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return { ok, headers: { 'access-control-allow-origin': ok ? origin : 'null', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'origin' } };
}
const json = (status, body, headers) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

export function rateLimited(ip, now = Date.now(), limit = 5, windowMs = 10 * 60 * 1000) {
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  if (arr.length >= limit) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

async function addToList(env, email, tag) {
  if (env.NEWSLETTER_PROVIDER === 'beehiiv') {
    const r = await fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
      method: 'POST', headers: { authorization: `Bearer ${env.BEEHIIV_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ email, reactivate_existing: false, send_welcome_email: true, utm_source: 'homebackupcost', utm_medium: tag }) });
    if (!r.ok && r.status !== 409) throw new Error('list ' + r.status);
    return;
  }
  // Default: Buttondown
  const r = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST', headers: { authorization: `Token ${env.BUTTONDOWN_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ email_address: email, tags: [tag], referrer_url: 'https://homebackupcost.com' }) });
  if (!r.ok && r.status !== 409 && r.status !== 400) throw new Error('list ' + r.status); // 400/409 = already subscribed
}

async function sendReport(env, email, report) {
  const { subject, html, text } = buildReport(report, { unsubscribeUrl: env.UNSUBSCRIBE_URL || '' });
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [email], subject, html, text, reply_to: env.REPLY_TO || undefined }) });
  if (!r.ok) throw new Error('send ' + r.status);
}

export function configured(env, path) {
  if (env.EMAIL_ENABLED !== 'true') return false;
  const list = env.NEWSLETTER_PROVIDER === 'beehiiv' ? env.BEEHIIV_API_KEY && env.BEEHIIV_PUBLICATION_ID : env.BUTTONDOWN_API_KEY;
  return !!(list && (path !== '/report' || (env.RESEND_API_KEY && env.FROM_EMAIL)));
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('origin') || '';
    const c = cors(env, origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: c.ok ? 204 : 403, headers: c.headers });
    if (req.method !== 'POST' || !['/report', '/subscribe'].includes(url.pathname)) return json(404, { error: 'Not found' }, c.headers);
    if (!c.ok) return json(403, { error: 'Origin not allowed' }, c.headers);
    if (!configured(env, url.pathname)) return json(503, { error: 'Email is not switched on yet' }, c.headers);
    if (rateLimited(req.headers.get('cf-connecting-ip') || 'unknown')) return json(429, { error: 'Too many requests, try again in a few minutes' }, c.headers);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { error: 'Request too large' }, c.headers);
    let body; try { body = JSON.parse(raw); } catch { return json(400, { error: 'Invalid request' }, c.headers); }
    if (body.company) return json(200, { ok: true }, c.headers); // honeypot: pretend success, do nothing
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) return json(400, { error: 'Please enter a valid email address' }, c.headers);
    if (body.consent !== true) return json(400, { error: 'Consent is required' }, c.headers);
    try {
      if (url.pathname === '/report') {
        await sendReport(env, email, body.report); // throws on invalid report data
        await addToList(env, email, 'report');
      } else await addToList(env, email, 'footer');
      return json(200, { ok: true }, c.headers);
    } catch (e) {
      console.log('email error', e.message);
      return json(/report|number/.test(e.message) ? 400 : 502, { error: /report|number/.test(e.message) ? 'Invalid report data' : 'Email service error' }, c.headers);
    }
  },
};
