import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { QueryLog }  from '@/models/QueryLog';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get('page')    || '1'));
  const perPage = Math.min(50, parseInt(searchParams.get('limit')  || '20'));
  const dbType  = searchParams.get('dbType') || '';
  const goal    = searchParams.get('goal')   || '';
  const search  = searchParams.get('search') || '';

  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({
        success: true,
        data: { items: [], total: 0, page, pages: 0, perPage },
      });
    }

    const filter: any = {};
    if (dbType) filter.dbType           = dbType;
    if (goal)   filter.optimizationGoal = goal;
    if (search) {
      filter.$or = [
        { originalQuery:  { $regex: search, $options: 'i' } },
        { optimizedQuery: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      QueryLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .select('-explanation -schema -naturalLanguage -ipHash')
        .lean(),
      QueryLog.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pages: Math.ceil(total / perPage),
        perPage,
      },
    });
  } catch (err: any) {
    console.error('[/api/history] Error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 });
  }
  try {
    const db = await connectDB();
    if (!db) return NextResponse.json({ success: false, error: 'DB unavailable.' }, { status: 503 });
    await QueryLog.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Delete failed.' }, { status: 500 });
  }
}
