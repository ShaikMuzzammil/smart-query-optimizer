import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import User from '../../../lib/db/models/User';
import Notification from '../../../lib/db/models/Notification';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Registration requires MongoDB. Add MONGODB_URI to your environment, or use the demo account (demo@smartquery.com / password).' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      plan: 'free',
    });

    await Notification.create({
      userId: user._id.toString(),
      type: 'system',
      title: 'Welcome to SmartQuery Pro 🎉',
      message: 'Your workspace is ready. Upload your first document or try the search demo to get started.',
    });

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (err: any) {
    console.error('[register] error', err);
    return NextResponse.json({ error: 'Something went wrong creating your account.' }, { status: 500 });
  }
}
