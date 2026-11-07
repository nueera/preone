// ============================================================
// PreOne — Messaging transport (SMS + Email)
//
// Pluggable and dependency-free (uses fetch). When a provider is
// configured via env vars it sends for real; otherwise it logs to the
// server console so OTP flows work in dev without credentials. These
// functions NEVER throw — callers get a { delivered } status, so a
// delivery failure can never break an auth flow.
//
// Optional configuration:
//   SMS   (Twilio)  — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
//   Email (Resend)  — RESEND_API_KEY, EMAIL_FROM
//
// To swap providers, change only the fetch calls below — the public
// API (sendSms / sendEmail / sendOtpSms / sendOtpEmail) stays the same.
// ============================================================

export interface SendResult {
  delivered: boolean;
  provider: 'twilio' | 'resend' | 'console';
  error?: string;
}

// ── SMS (Twilio REST API) ──

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[messaging:sms] no provider configured — would send to ${to}: ${body}`);
    return { delivered: false, provider: 'console' };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[messaging:sms] Twilio error ${res.status}: ${detail}`);
      return { delivered: false, provider: 'twilio', error: `HTTP ${res.status}` };
    }
    return { delivered: true, provider: 'twilio' };
  } catch (e) {
    console.error('[messaging:sms] send failed:', e);
    return { delivered: false, provider: 'twilio', error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Email (Resend HTTP API) ──

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'PreOne <no-reply@preone.app>';

  if (!apiKey) {
    console.log(`[messaging:email] no provider configured — would send to ${to}: "${subject}"`);
    return { delivered: false, provider: 'console' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[messaging:email] Resend error ${res.status}: ${detail}`);
      return { delivered: false, provider: 'resend', error: `HTTP ${res.status}` };
    }
    return { delivered: true, provider: 'resend' };
  } catch (e) {
    console.error('[messaging:email] send failed:', e);
    return { delivered: false, provider: 'resend', error: e instanceof Error ? e.message : String(e) };
  }
}

// ── OTP convenience helpers ──

function otpAction(purpose: string): string {
  const p = purpose.toLowerCase();
  if (p.includes('forgot') || p.includes('reset')) return 'reset your password';
  if (p.includes('verify')) return 'verify your account';
  return 'log in';
}

export async function sendOtpSms(phone: string, code: string, purpose = 'login'): Promise<SendResult> {
  const body = `Your PreOne verification code is ${code}. Use it to ${otpAction(purpose)}. It expires shortly — do not share this code.`;
  return sendSms(phone, body);
}

export async function sendOtpEmail(email: string, code: string, purpose = 'FORGOT_PASSWORD'): Promise<SendResult> {
  const subject = 'Your PreOne verification code';
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">PreOne</h2>
      <p>Use this verification code to ${otpAction(purpose)}:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #111;">${code}</p>
      <p style="color: #666; font-size: 13px;">This code expires shortly. If you didn't request it, you can safely ignore this email.</p>
    </div>`;
  return sendEmail(email, subject, html);
}
