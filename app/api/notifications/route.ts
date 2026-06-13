import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import Notification from '../../../lib/db/models/Notification';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ notifications: [], unreadCount: 0 });

  try {
    await dbConnect();
    const notifications = await Notification.find({ userId: user.id }).sort({ createdAt: -1 }).limit(30).lean();
    const unreadCount = await Notification.countDocuments({ userId: user.id, read: false });

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (err: any) {
    console.error('[api/notifications] DB error:', err?.message || err);
    return NextResponse.json({ notifications: [], unreadCount: 0, dbStatus: 'error' });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ success: true });

  const body = await req.json().catch(() => ({}));

  try {
    await dbConnect();

    if (body.markAllRead) {
      await Notification.updateMany({ userId: user.id, read: false }, { read: true });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await Notification.findOneAndUpdate({ _id: body.id, userId: user.id }, { read: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  } catch (err: any) {
    console.error('[api/notifications PATCH] DB error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Database connection failed' }, { status: 503 });
  }
}
