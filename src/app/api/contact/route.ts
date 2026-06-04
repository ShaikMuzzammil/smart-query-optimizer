import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
  const rl = rateLimit(`contact:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, email, subject, category = 'general', message } = body
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim())
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  if (message.length < 10)
    return NextResponse.json({ error: 'Message too short.' }, { status: 400 })

  const safeData = { name: name.trim().slice(0,100), email: email.trim().toLowerCase(), subject: subject.trim().slice(0,200), category, message: message.trim().slice(0,5000) }

  try {
    const resendKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL

    if (resendKey && adminEmail) {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      const from = `Smart Query Optimizer <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`

      await Promise.allSettled([
        resend.emails.send({
          from, to: adminEmail,
          subject: `[Contact] ${safeData.subject}`,
          html: `<div style="font-family:sans-serif;padding:24px;background:#0a0a14;color:#e8f4ff">
            <h2 style="color:#00C6FF">New Contact — Smart Query Optimizer</h2>
            <p><strong>From:</strong> ${safeData.name} &lt;${safeData.email}&gt;</p>
            <p><strong>Category:</strong> ${safeData.category}</p>
            <p><strong>Subject:</strong> ${safeData.subject}</p>
            <hr style="border-color:rgba(0,198,255,0.2)"/>
            <p style="white-space:pre-wrap">${safeData.message}</p>
          </div>`,
        }),
        resend.emails.send({
          from, to: safeData.email,
          subject: '✅ We received your message — Smart Query Optimizer',
          html: `<div style="font-family:sans-serif;padding:32px;background:#050B18;color:#e8f4ff;text-align:center">
            <h1 style="color:#00C6FF">Message Received!</h1>
            <p>Hi <strong>${safeData.name}</strong>, thanks for reaching out.</p>
            <p>We'll reply within 24–48 hours.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/optimizer" style="display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#00C6FF,#7B2FBE);color:#000;font-weight:700;border-radius:8px;text-decoration:none">Launch Optimizer →</a>
          </div>`,
        }),
      ])
    }
  } catch (emailErr: any) {
    console.warn('[contact] email failed:', emailErr.message)
  }

  return NextResponse.json({ success: true, message: "Message received! We'll get back to you within 24–48 hours." })
}
