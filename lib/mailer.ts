import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

declare global {
  // eslint-disable-next-line no-var
  var __mailer: { transporter: Transporter | null; enabled: boolean; lastError: string | null } | undefined;
}

function store() {
  if (!globalThis.__mailer) {
    globalThis.__mailer = { transporter: null, enabled: false, lastError: null };
  }
  return globalThis.__mailer;
}

function ensureTransporter(): Transporter | null {
  const s = store();
  if (s.transporter) return s.transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    s.enabled = false;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465;
  s.transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  s.enabled = true;
  s.lastError = null;
  return s.transporter;
}

export function isMailerEnabled(): boolean {
  if (store().enabled) return true;
  return ensureTransporter() !== null;
}

export function getMailerState() {
  const s = store();
  return {
    enabled: s.enabled,
    host: process.env.SMTP_HOST ?? null,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? null,
    lastError: s.lastError,
  };
}

export type MailPayload = {
  to: string | null | undefined;
  subject: string;
  title: string;
  body: string;
  link?: string | null;
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FASKO';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function renderHtml(payload: MailPayload): string {
  const safeBody = payload.body.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const link = payload.link
    ? `<p style="margin:24px 0 0;"><a href="${APP_URL}${payload.link}" style="display:inline-block;background:#1a7a3c;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Buka detail di FASKO</a></p>`
    : '';
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${payload.title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;background:#f5f5f5;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0e4423 0%,#1a7a3c 100%);padding:20px 28px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">${APP_NAME}</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">${payload.title}</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0;font-size:14px;line-height:1.65;color:#334155;white-space:pre-wrap;">${safeBody}</p>
          ${link}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Notifikasi otomatis dari ${APP_NAME} (Universitas Kristen Duta Wacana). Jangan balas email ini.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendEmail(payload: MailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!payload.to) return { ok: false, error: 'Email kosong' };
  const transporter = ensureTransporter();
  if (!transporter) return { ok: false, error: 'SMTP belum dikonfigurasi' };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${from}>`,
      to: payload.to,
      subject: payload.subject,
      text: `${payload.title}\n\n${payload.body}${payload.link ? `\n\nBuka detail: ${APP_URL}${payload.link}` : ''}`,
      html: renderHtml(payload),
    });
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    store().lastError = err.message;
    return { ok: false, error: err.message };
  }
}

export async function verifyMailer(): Promise<{ ok: boolean; error?: string }> {
  const transporter = ensureTransporter();
  if (!transporter) return { ok: false, error: 'SMTP belum dikonfigurasi (cek .env)' };
  try {
    await transporter.verify();
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    store().lastError = err.message;
    return { ok: false, error: err.message };
  }
}
