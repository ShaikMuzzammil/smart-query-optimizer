import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import User from '../../../../lib/db/models/User';
import { DEMO_USER_ID } from '../../../../lib/constants';

const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  stopwordsEnabled: true,
  caseSensitiveSearch: false,
  defaultResultCount: 10,
  fuzzySearch: true,
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured() || user.id === DEMO_USER_ID) return NextResponse.json({ settings: DEFAULT_SETTINGS });

  await dbConnect();
  const doc = await User.findById(user.id).lean<any>();
  return NextResponse.json({ settings: doc?.settings || DEFAULT_SETTINGS });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  if (user.id === DEMO_USER_ID) return NextResponse.json({ error: 'Settings cannot be changed in the demo account.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  await dbConnect();

  const update: any = {};
  for (const key of ['theme', 'stopwordsEnabled', 'caseSensitiveSearch', 'defaultResultCount', 'fuzzySearch']) {
    if (key in body) update[`settings.${key}`] = body[key];
  }

  const doc = await User.findByIdAndUpdate(user.id, { $set: update }, { new: true }).lean<any>();
  return NextResponse.json({ settings: doc?.settings || DEFAULT_SETTINGS });
}
