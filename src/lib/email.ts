import nodemailer, { Transporter } from 'nodemailer';

const user = process.env.EMAIL_SERVER_USER || '';
const pass = process.env.EMAIL_SERVER_PASSWORD || '';
const host = process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com';
const port = Number(process.env.EMAIL_SERVER_PORT) || 465;
const secure = process.env.EMAIL_SERVER_SECURE !== 'false';
const from = process.env.EMAIL_FROM || (user ? `Klinik Pratama Sehat Utama <${user}>` : 'noreply@poliklinik.id');

let transporter: Transporter | null = null;

if (user && pass) {
  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: pass.replace(/\s+/g, ''), // Strip spaces from Google App Password
      },
    });
  } catch (err: any) {
    console.error('[Email] Failed to create Nodemailer transport:', err.message);
  }
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
  buttonText?: string;
  otpCode?: string;
}

export async function sendActualEmail({
  to,
  subject,
  title,
  body,
  link,
  buttonText = 'Buka Tautan',
  otpCode,
}: SendEmailOptions): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <div style="background-color: #0d9488; padding: 24px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
              Klinik Pratama Sehat Utama
            </h1>
            <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 13px;">
              Sistem Antrean & Pelayanan Poliklinik Umum
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">
              ${title}
            </h2>
            <div style="font-size: 14px; line-height: 1.6; color: #475569; white-space: pre-line; margin-bottom: 24px;">
              ${body}
            </div>

            ${
              otpCode
                ? `
              <div style="background-color: #f0fdf4; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.12em; display: block; margin-bottom: 8px;">Kode Verifikasi Akun Pasien</span>
                <span style="font-family: Courier New, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0f172a; display: block;">${otpCode}</span>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 8px;">Berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.</span>
              </div>
            `
                : ''
            }

            ${
              link
                ? `
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${link}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 10px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);">
                  ${buttonText}
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 12px; word-break: break-all;">
                Atau salin tautan berikut ke browser Anda:<br>
                <a href="${link}" style="color: #0d9488; text-decoration: underline;">${link}</a>
              </p>
            `
                : ''
            }
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">Jl. Kesehatan Raya No. 128, Jakarta Pusat • Telp: 021-5550192</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8;">Email ini dikirim otomatis oleh sistem. Harap tidak membalas email ini.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: `${body}\n\n${link ? `Tautan: ${link}` : ''}`,
      html,
    });
    console.log(`[Email] Sukses terkirim ke ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`[Email] Gagal mengirim email ke ${to}:`, error.message);
    return false;
  }
}
