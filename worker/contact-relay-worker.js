

const ALLOWED_ORIGIN = 'https://talebi.dev';
const TO_ADDRESS = 'job@talebi.dev';

const FROM_ADDRESS = 'Contact Form <contact@talebi.dev>';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(status, data, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);

  if (typeof bytes.toBase64 === 'function') {
    return bytes.toBase64();
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json(405, { success: false, error: 'Method not allowed' }, origin);
    }

    let incoming;
    try {
      incoming = await request.formData();
    } catch (e) {
      return json(400, { success: false, error: 'Invalid form submission' }, origin);
    }

    const token = incoming.get('cf-turnstile-response');
    if (!token) {
      return json(400, { success: false, error: 'Missing verification token' }, origin);
    }

    const verifyBody = new URLSearchParams();
    verifyBody.append('secret', env.TURNSTILE_SECRET_KEY);
    verifyBody.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) verifyBody.append('remoteip', ip);

    let verifyJson;
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody,
      });
      verifyJson = await verifyRes.json();
    } catch (e) {
      return json(502, { success: false, error: 'Could not reach the verification service' }, origin);
    }

    if (!verifyJson.success) {
      console.error('Turnstile verification failed:', JSON.stringify(verifyJson['error-codes'] || verifyJson));
      return json(403, { success: false, error: 'Verification failed — please try again.' }, origin);
    }

    const name = (incoming.get('name') || '').toString();
    const email = (incoming.get('email') || '').toString();
    const phone = (incoming.get('phone') || '').toString();
    const subject = (incoming.get('subject') || '').toString();
    const message = (incoming.get('message') || '').toString();

    const attachments = [];
    const file = incoming.get('attachment');
    if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return json(400, { success: false, error: 'Attachment is too large (max 5MB).' }, origin);
      }
      const buf = await file.arrayBuffer();
      attachments.push({ filename: file.name || 'attachment', content: arrayBufferToBase64(buf) });
    }

    const textBody =
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\n${message}`;
    const htmlBody =
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` +
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` +
      `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` +
      `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` +
      `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;

    let resendRes;
    try {
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [TO_ADDRESS],
          reply_to: email || undefined,
          subject: subject ? `[talebi.dev] ${subject}` : 'New message from talebi.dev',
          text: textBody,
          html: htmlBody,
          attachments: attachments.length ? attachments : undefined,
        }),
      });
    } catch (e) {
      return json(502, { success: false, error: 'Could not deliver the message right now.' }, origin);
    }

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(function () { return ''; });
      console.error('Resend rejected the send:', resendRes.status, detail.slice(0, 500));
      return json(502, { success: false, error: 'Could not deliver the message right now.' }, origin);
    }

    return json(200, { success: true }, origin);
  },
};

