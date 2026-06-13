import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';
import Notification from '../../../../lib/db/models/Notification';
import { DEMO_DOCUMENTS } from '../../../../lib/demoData';
import { analyzeDocument } from '../../../../lib/search/nlpAnalyzer';
import { tokenize, tokenizeMeaningful } from '../../../../lib/search/textProcessing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'MONGODB_URI is not configured.' }, { status: 503 });

  await dbConnect();

  const existingNames = new Set(
    (await FileDoc.find({ userId: user.id }).select('fileName').lean()).map((d: any) => d.fileName)
  );

  const toSeed = DEMO_DOCUMENTS.filter((d) => !existingNames.has(d.fileName));
  if (toSeed.length === 0) {
    return NextResponse.json({ seeded: 0, message: 'Demo documents are already loaded.' });
  }

  const corpusTokenSets = toSeed.map((d) => tokenizeMeaningful(d.content, true));

  let seeded = 0;
  for (const doc of toSeed) {
    const wordCount = tokenize(doc.content).length;
    const analysis = analyzeDocument(doc.content, corpusTokenSets);

    await FileDoc.create({
      userId: user.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      content: doc.content,
      wordCount,
      charCount: doc.content.length,
      status: 'indexed',
      analysis,
      version: 1,
      previousVersions: [],
    });
    seeded++;
  }

  await Notification.create({
    userId: user.id,
    type: 'system',
    title: 'Demo data loaded',
    message: `${seeded} example document${seeded > 1 ? 's' : ''} added to your index. Try searching for "error handling" or "refund policy".`,
  });

  return NextResponse.json({ seeded });
}
