import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()
    if (!name?.trim()||!email?.trim()||!message?.trim()) return NextResponse.json({error:'Name, email, and message required'},{status:400})
    if (message.trim().length<10) return NextResponse.json({error:'Message too short'},{status:400})
    const rk = process.env.RESEND_API_KEY
    const admin = process.env.ADMIN_EMAIL
    if (rk && admin) {
      const resend = new Resend(rk)
      const from = process.env.DEFAULT_FROM_EMAIL||'onboarding@resend.dev'
      await resend.emails.send({from:`SmartQuery <${from}>`,to:admin,reply_to:email,subject:`[SmartQuery Contact] ${name}: ${subject||'Message'}`,html:`<div style="font-family:Arial;padding:20px"><h2>New Contact Message</h2><p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${subject||'N/A'}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g,'<br>')}</p></div>`})
      await resend.emails.send({from:`SmartQuery <${from}>`,to:email,subject:'We received your message',html:`<div style="font-family:Arial;padding:20px"><h2>Thanks ${name}!</h2><p>We received your message and will reply shortly.</p><blockquote style="border-left:3px solid #00C6FF;padding-left:12px;color:#666">${message.substring(0,200)}</blockquote></div>`})
    }
    return NextResponse.json({ok:true})
  } catch { return NextResponse.json({ok:true}) }
}
