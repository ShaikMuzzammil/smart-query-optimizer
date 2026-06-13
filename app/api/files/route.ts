import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import FileDoc from '../../../lib/db/models/FileDoc';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ files: [], dbStatus: 'not_configured' });

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim();

    const filter: any = { userId: user.id };
    if (search) {
      filter.fileName = { $regex: search, $options: 'i' };
    }

    const files = await FileDoc.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(500).lean();

    return NextResponse.json({
      files: files.map((doc: any) => ({
        id: doc._id.toString(),
        fileName: doc.fileName,
        fileType: doc.fileType,
        wordCount: doc.wordCount,
        charCount: doc.charCount,
        status: doc.status,
        errorMessage: doc.errorMessage,
        analysis: doc.analysis,
        summary: doc.summary,
        tags: doc.tags,
        pinned: doc.pinned,
        queryCount: doc.queryCount,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      dbStatus: 'connected',
    });
  } catch (err: any) {
    console.error('[api/files] DB error:', err?.message || err);
    return NextResponse.json({ files: [], dbStatus: 'error', dbError: err?.message || 'Database connection failed' });
  }
}
