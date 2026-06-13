import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import FileDoc from '../../../lib/db/models/FileDoc';
import Notification from '../../../lib/db/models/Notification';
import { extractText, getExtension, isAllowedExtension, MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS } from '../../../lib/files/extractText';
import { analyzeDocument } from '../../../lib/search/nlpAnalyzer';
import { tokenizeMeaningful, tokenize } from '../../../lib/search/textProcessing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in to upload files.' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'MONGODB_URI is not configured on the server. Add it to your environment variables to enable file uploads.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` }, { status: 413 });
  }

  const ext = getExtension(file.name);
  if (!isAllowedExtension(ext)) {
    return NextResponse.json({ error: `Unsupported file type ".${ext}". Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.` }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await dbConnect();

  const { text, error: extractError } = await extractText(buffer, ext);

  if (extractError && !text) {
    const failedDoc = await FileDoc.create({
      userId: user.id,
      fileName: file.name,
      fileType: ext,
      content: '',
      wordCount: 0,
      charCount: 0,
      status: 'failed',
      errorMessage: extractError,
    });

    await Notification.create({
      userId: user.id,
      type: 'upload',
      title: 'Upload failed',
      message: `${file.name}: ${extractError}`,
    });

    return NextResponse.json({ file: serializeFile(failedDoc), error: extractError }, { status: 200 });
  }

  if (!text || text.trim().length === 0) {
    const failedDoc = await FileDoc.create({
      userId: user.id,
      fileName: file.name,
      fileType: ext,
      content: '',
      wordCount: 0,
      charCount: 0,
      status: 'failed',
      errorMessage: 'No readable text content was found in this file.',
    });

    await Notification.create({
      userId: user.id,
      type: 'upload',
      title: 'Upload failed',
      message: `${file.name}: no readable text content was found.`,
    });

    return NextResponse.json({ file: serializeFile(failedDoc), error: 'No readable text content was found in this file.' }, { status: 200 });
  }

  const wordCount = tokenize(text).length;
  const charCount = text.length;

  // Build corpus token sets from the user's other files for TF-IDF keyword extraction
  const otherFiles = await FileDoc.find({ userId: user.id, status: 'indexed' }).select('content').limit(200).lean();
  const corpusTokenSets = otherFiles.map((f: any) => tokenizeMeaningful(f.content || '', true));

  const analysis = analyzeDocument(text, corpusTokenSets);

  // Versioning: if a file with the same name exists, archive it as a previous version
  const existing = await FileDoc.findOne({ userId: user.id, fileName: file.name });

  let savedDoc;
  if (existing) {
    existing.previousVersions.push({
      version: existing.version,
      content: existing.content,
      wordCount: existing.wordCount,
      uploadedAt: existing.updatedAt || existing.createdAt,
    });
    existing.content = text;
    existing.wordCount = wordCount;
    existing.charCount = charCount;
    existing.status = 'indexed';
    existing.errorMessage = undefined;
    existing.analysis = analysis as any;
    existing.version = existing.version + 1;
    existing.fileType = ext;
    await existing.save();
    savedDoc = existing;

    await Notification.create({
      userId: user.id,
      type: 'upload',
      title: 'Document re-indexed',
      message: `${file.name} was updated to version ${existing.version} and re-analyzed (${wordCount.toLocaleString()} words).`,
    });
  } else {
    savedDoc = await FileDoc.create({
      userId: user.id,
      fileName: file.name,
      fileType: ext,
      content: text,
      wordCount,
      charCount,
      status: 'indexed',
      analysis,
      version: 1,
      previousVersions: [],
    });

    await Notification.create({
      userId: user.id,
      type: 'upload',
      title: 'Document indexed',
      message: `${file.name} was processed and added to your index (${wordCount.toLocaleString()} words, sentiment: ${analysis.sentiment.label}).`,
    });

    if (analysis.issues.length > 0) {
      await Notification.create({
        userId: user.id,
        type: 'ai',
        title: `${analysis.issues.length} issue${analysis.issues.length > 1 ? 's' : ''} detected`,
        message: `${file.name}: ${analysis.issues[0]}`,
      });
    }
  }

  return NextResponse.json({ file: serializeFile(savedDoc) });
}

function serializeFile(doc: any) {
  return {
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
  };
}
