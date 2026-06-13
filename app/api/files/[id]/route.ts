import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await dbConnect();
  const doc = await FileDoc.findOne({ _id: params.id, userId: user.id }).lean<any>();
  if (!doc) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  return NextResponse.json({
    file: {
      id: doc._id.toString(),
      fileName: doc.fileName,
      fileType: doc.fileType,
      content: doc.content,
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
      previousVersions: (doc.previousVersions || []).map((v: any) => ({
        version: v.version,
        wordCount: v.wordCount,
        uploadedAt: v.uploadedAt,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  await dbConnect();

  const update: any = {};
  if (typeof body.pinned === 'boolean') update.pinned = body.pinned;
  if (Array.isArray(body.tags)) update.tags = body.tags.slice(0, 10).map((t: any) => String(t).slice(0, 30));
  if (typeof body.summary === 'string') update.summary = body.summary;

  const doc = await FileDoc.findOneAndUpdate({ _id: params.id, userId: user.id }, update, { new: true }).lean<any>();
  if (!doc) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  return NextResponse.json({
    file: {
      id: doc._id.toString(),
      fileName: doc.fileName,
      pinned: doc.pinned,
      tags: doc.tags,
      summary: doc.summary,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  await dbConnect();
  const doc = await FileDoc.findOneAndDelete({ _id: params.id, userId: user.id });
  if (!doc) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
