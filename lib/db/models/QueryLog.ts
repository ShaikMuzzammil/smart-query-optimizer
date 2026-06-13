import mongoose, { Schema, models, model } from 'mongoose';

export interface IQueryLog {
  _id: string;
  userId: string;
  query: string;
  correctedQuery?: string;
  resultCount: number;
  avgScore: number;
  matchedFileIds: string[];
  rankingStrategy: string;
  durationMs: number;
  createdAt: Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    userId: { type: String, required: true, index: true },
    query: { type: String, required: true },
    correctedQuery: String,
    resultCount: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    matchedFileIds: { type: [String], default: [] },
    rankingStrategy: { type: String, default: 'BM25' },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QueryLogSchema.index({ userId: 1, createdAt: -1 });

const QueryLogModel = (models.QueryLog || model<IQueryLog>('QueryLog', QueryLogSchema)) as mongoose.Model<IQueryLog>;
export default QueryLogModel;
