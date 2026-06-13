import mongoose, { Schema, models, model } from 'mongoose';

export interface IFileVersion {
  version: number;
  content: string;
  wordCount: number;
  uploadedAt: Date;
}

export interface IFileAnalysis {
  keywords: { term: string; score: number }[];
  entities: { text: string; type: string }[];
  sentiment: { score: number; comparative: number; label: 'positive' | 'negative' | 'neutral' };
  readability: { fleschKincaid: number; colemanLiau: number; gradeLevel: string };
  issues: string[];
}

export interface IFileDoc {
  _id: string;
  userId: string;
  fileName: string;
  fileType: 'txt' | 'pdf' | 'docx' | 'md';
  content: string;
  wordCount: number;
  charCount: number;
  status: 'queued' | 'processing' | 'indexed' | 'failed';
  errorMessage?: string;
  analysis?: IFileAnalysis;
  summary?: string;
  tags: string[];
  pinned: boolean;
  queryCount: number;
  version: number;
  previousVersions: IFileVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const FileAnalysisSchema = new Schema<IFileAnalysis>(
  {
    keywords: [{ term: String, score: Number }],
    entities: [{ text: String, type: String }],
    sentiment: {
      score: Number,
      comparative: Number,
      label: { type: String, enum: ['positive', 'negative', 'neutral'] },
    },
    readability: {
      fleschKincaid: Number,
      colemanLiau: Number,
      gradeLevel: String,
    },
    issues: [String],
  },
  { _id: false }
);

const FileVersionSchema = new Schema<IFileVersion>(
  {
    version: Number,
    content: String,
    wordCount: Number,
    uploadedAt: Date,
  },
  { _id: false }
);

const FileSchema = new Schema<IFileDoc>(
  {
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['txt', 'pdf', 'docx', 'md'], required: true },
    content: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },
    status: { type: String, enum: ['queued', 'processing', 'indexed', 'failed'], default: 'queued' },
    errorMessage: String,
    analysis: FileAnalysisSchema,
    summary: String,
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    queryCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    previousVersions: { type: [FileVersionSchema], default: [] },
  },
  { timestamps: true }
);

FileSchema.index({ userId: 1, fileName: 1 });
FileSchema.index({ userId: 1, createdAt: -1 });

const FileDocModel = (models.FileDoc || model<IFileDoc>('FileDoc', FileSchema)) as mongoose.Model<IFileDoc>;
export default FileDocModel;
