import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';
import QueryLog from '../../../../lib/db/models/QueryLog';
import Notification from '../../../../lib/db/models/Notification';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ success: true });

  await dbConnect();

  await Promise.all([
    FileDoc.deleteMany({ userId: user.id }),
    QueryLog.deleteMany({ userId: user.id }),
    Notification.deleteMany({ userId: user.id }),
  ]);

  await Notification.create({
    userId: user.id,
    type: 'system',
    title: 'Session reset',
    message: 'All files, search history, and notifications have been cleared. Your account remains active.',
  });

  return NextResponse.json({ success: true });
}
