import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Read env vars at call time (not module load time) so Railway env var updates take effect without restart
function getFrom(): string {
  return `"海龟汤像素馆" <${process.env['RESEND_FROM'] ?? 'onboarding@resend.dev'}>`
}
function getFromSmtp(): string {
  return `"海龟汤像素馆" <${process.env['SMTP_USER']}>`
}
function getResendClient(): Resend | null {
  return process.env['RESEND_API_KEY'] ? new Resend(process.env['RESEND_API_KEY']) : null
}
function useResend(): boolean {
  return Boolean(process.env['RESEND_API_KEY'])
}

const smtpPort = Number(process.env['SMTP_PORT'] ?? 465)
const smtpTransporter = nodemailer.createTransport({
  host: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env['SMTP_USER'] ?? '',
    pass: process.env['SMTP_PASS'] ?? ''
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000
} as nodemailer.TransportOptions)

export async function sendOtpEmail(to: string, code: string, subject: string): Promise<void> {
  const resendClient = getResendClient()
  if (useResend() && resendClient) {
    const { error } = await resendClient.emails.send({
      from: getFrom(),
      to,
      subject,
      html: buildOtpHtml(code)
    })
    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
  } else {
    await smtpTransporter.sendMail({
      from: getFromSmtp(),
      to,
      subject,
      html: buildOtpHtml(code)
    })
  }
}

function buildOtpHtml(code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FDF6E3;border-radius:16px">
      <h2 style="color:#3D2B1A;margin-bottom:8px">🐢 海龟汤像素馆</h2>
      <p style="color:#7A6050">你的验证码是：</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#3D2B1A;padding:16px 0">${code}</div>
      <p style="color:#7A6050;font-size:13px">5 分钟内有效，请勿泄露给他人。</p>
    </div>
  `
}
