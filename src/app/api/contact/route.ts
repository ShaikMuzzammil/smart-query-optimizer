import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, buildContactEmailHtml, buildContactConfirmationHtml } from '@/lib/resend';
import { connectDB }  from '@/lib/mongodb';
import { ContactMessage } from '@/models/ContactMessage';
import { rateLimit, CONTACT_RATE_LIMIT } from '@/lib/rateLimit';
import { hashIP } from '@/lib/utils';

export async function POST(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(ip, CONTACT_RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: `Too many messages. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  // ── Parse body ────────────────────────────────────────────
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: 'Invalid JSON.' }, { status: 400 }); }

  const { name, email, subject, category, message } = body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ success: false, error: 'Message exceeds 5,000 characters.' }, { status: 400 });
  }

  const safeData = {
    name:     name.trim().slice(0, 100),
    email:    email.trim().toLowerCase().slice(0, 200),
    subject:  subject.trim().slice(0, 200),
    category: ['general','bug','feature','billing','enterprise'].includes(category) ? category : 'general',
    message:  message.trim().slice(0, 5000),
  };

  // ── Send emails (non-fatal) ───────────────────────────────
  try {
    const resend    = getResendClient();
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = `${process.env.FROM_NAME || 'Smart Query Optimizer'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;

    const sends = [];

    // Notify admin
    if (adminEmail) {
      sends.push(resend.emails.send({
        from:    fromEmail,
        to:      adminEmail,
        subject: `[SmartQuery Contact] ${safeData.subject}`,
        html:    buildContactEmailHtml(safeData),
      }));
    }

    // Confirm to user
    sends.push(resend.emails.send({
      from:    fromEmail,
      to:      safeData.email,
      subject: '✅ We received your message — Smart Query Optimizer',
      html:    buildContactConfirmationHtml(safeData.name),
    }));

    await Promise.allSettled(sends);
  } catch (emailErr: any) {
    console.warn('[/api/contact] Email send failed:', emailErr.message);
    // Continue — email is best-effort
  }

  // ── Persist to MongoDB ────────────────────────────────────
  try {
    const db = await connectDB();
    if (db) {
      const ipHash = await hashIP(ip);
      await ContactMessage.create({ ...safeData, ipHash });
    }
  } catch (dbErr: any) {
    console.warn('[/api/contact] DB save failed:', dbErr.message);
  }

  return NextResponse.json({
    success: true,
    message: "Message received! We'll get back to you within 24–48 hours.",
  });
}
