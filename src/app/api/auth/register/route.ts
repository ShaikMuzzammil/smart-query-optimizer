import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../../lib/auth'
import { store } from '../../../../lib/db'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ error: 'All fields required.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    if (store.users.has(email.toLowerCase())) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)
    const user = { id, name: name.trim(), email: email.toLowerCase(), passwordHash, plan: 'FREE', createdAt: new Date().toISOString() }
    store.users.set(email.toLowerCase(), user)

    // Send welcome email (non-blocking, best-effort)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.DEFAULT_FROM_EMAIL || 'onboarding@resend.dev'
      resend.emails.send({
        from: `SmartQuery <${from}>`,
        to: email,
        subject: 'Welcome to SmartQuery Optimizer 🚀',
        html: `<div style="font-family:Arial;background:#050B18;padding:30px;"><div style="max-width:500px;margin:0 auto;background:#0A1628;border-radius:16px;overflow:hidden;border:1px solid rgba(0,198,255,0.15);"><div style="background:linear-gradient(135deg,#00C6FF,#7B2FBE);padding:28px;"><h1 style="color:#fff;margin:0;">Welcome, ${name.trim()}! 🎉</h1></div><div style="padding:28px;"><p style="color:#E8F4FD;">Your SmartQuery account is ready. You have <strong style="color:#00C6FF;">1,000 free pages</strong> to index.</p><a href="${process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'}/dashboard" style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#00C6FF,#7B2FBE);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">→ Open Dashboard</a></div></div></div>`,
      }).catch(() => {})
      if (process.env.ADMIN_EMAIL) {
        resend.emails.send({ from: `SmartQuery <${from}>`, to: process.env.ADMIN_EMAIL, subject: `[SmartQuery] New signup: ${name} (${email})`, html: `<p>New user: <strong>${name}</strong> — ${email}</p>` }).catch(() => {})
      }
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name, plan: user.plan })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } }, { status: 201 })
    res.cookies.set('sq_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60*60*24*7, path: '/' })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
