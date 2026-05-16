import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, reason, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (message.trim().length < 20) {
      return NextResponse.json({ error: 'Message must be at least 20 characters.' }, { status: 400 })
    }

    const resendKey   = process.env.RESEND_API_KEY
    const adminEmail  = process.env.ADMIN_EMAIL
    const fromEmail   = process.env.DEFAULT_FROM_EMAIL || 'onboarding@resend.dev'
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

    if (resendKey && adminEmail) {
      const resend = new Resend(resendKey)

      // 1. Notify admin → your Gmail
      await resend.emails.send({
        from: `SmartQuery Contact <${fromEmail}>`,
        to: adminEmail,
        replyTo: email,
        subject: `[SmartQuery] Message from ${name}${reason ? ` — ${reason}` : ''}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;background:#050B18;margin:0;padding:24px;"><div style="max-width:580px;margin:0 auto;background:#0A1628;border-radius:16px;overflow:hidden;border:1px solid rgba(0,198,255,0.15);"><div style="background:linear-gradient(135deg,#00C6FF,#7B2FBE);padding:24px 28px;"><h2 style="color:#fff;margin:0;font-size:20px;">📬 New Contact Message</h2><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Received ${submittedAt} IST</p></div><div style="padding:28px;"><div style="margin-bottom:16px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7A9CC0;margin-bottom:4px;">From</div><div style="color:#E8F4FD;font-size:15px;font-weight:600;">${name}</div></div><div style="margin-bottom:16px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7A9CC0;margin-bottom:4px;">Email</div><div style="color:#00C6FF;font-size:14px;"><a href="mailto:${email}" style="color:#00C6FF;">${email}</a></div></div>${reason?`<div style="margin-bottom:16px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7A9CC0;margin-bottom:4px;">Reason</div><div style="color:#E8F4FD;">${reason}</div></div>`:''}${subject?`<div style="margin-bottom:16px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7A9CC0;margin-bottom:4px;">Subject</div><div style="color:#E8F4FD;">${subject}</div></div>`:''}  <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7A9CC0;margin-bottom:6px;">Message</div><div style="background:#050B18;border:1px solid rgba(0,198,255,0.12);border-radius:8px;padding:14px;color:#E8F4FD;font-size:14px;line-height:1.7;">${message.replace(/\n/g,'<br>')}</div></div><a href="mailto:${email}?subject=Re:SmartQuery Contact" style="display:inline-block;margin-top:20px;padding:12px 22px;background:linear-gradient(135deg,#00C6FF,#7B2FBE);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">↩ Reply to ${name}</a></div><div style="padding:14px 28px;border-top:1px solid rgba(0,198,255,0.08);"><p style="color:#7A9CC0;font-size:11px;margin:0;">Submitted via SmartQuery contact form.</p></div></div></body></html>`,
      })

      // 2. Auto-reply to sender
      await resend.emails.send({
        from: `SmartQuery Team <${fromEmail}>`,
        to: email,
        subject: 'We received your message — SmartQuery',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;background:#050B18;margin:0;padding:24px;"><div style="max-width:520px;margin:0 auto;background:#0A1628;border-radius:16px;overflow:hidden;border:1px solid rgba(0,198,255,0.15);"><div style="background:linear-gradient(135deg,#00C6FF,#7B2FBE);padding:24px 28px;"><h2 style="color:#fff;margin:0;">✅ Message Received!</h2><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${submittedAt} IST</p></div><div style="padding:28px;"><p style="color:#E8F4FD;font-size:15px;">Hi <strong>${name}</strong>,</p><p style="color:#7A9CC0;line-height:1.7;">Thank you for reaching out. We've received your message and will reply within a few hours.</p><div style="background:#050B18;border:1px solid rgba(0,198,255,0.1);border-radius:8px;padding:12px 14px;margin:16px 0;color:#7A9CC0;font-size:13px;font-style:italic;">"${message.substring(0,150)}${message.length>150?'…':''}"</div><a href="${process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'}/dashboard" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#00C6FF,#7B2FBE);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">→ Explore Dashboard</a></div></div></body></html>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Contact API]', err)
    // Still return success to not expose errors to client
    return NextResponse.json({ ok: true })
  }
}
