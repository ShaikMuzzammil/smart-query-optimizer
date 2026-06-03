import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryLog extends Document {
  sessionId:        string;
  originalQuery:    string;
  optimizedQuery:   string;
  dbType:           string;
  dbVersion?:       string;
  optimizationGoal: string;
  schema?:          string;
  naturalLanguage?: string;
  metrics: {
    estimatedImprovement: number;
    beforeCost:           number;
    afterCost:            number;
    estimatedExecMs:      number;
  };
  indexSuggestions: Array<{ sql: string; reason: string; impact: string }>;
  explanation:      string;
  queryComplexity?: string;
  warnings?:        string[];
  ipHash?:          string;
  createdAt:        Date;
  updatedAt:        Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    sessionId: {
      type: String,
      required: true,
      default: () => Math.random().toString(36).slice(2),
    },
    originalQuery:    { type: String, required: true, maxlength: 10_000 },
    optimizedQuery:   { type: String, required: true, maxlength: 10_000 },
    dbType: {
      type: String,
      enum: ['postgresql','mysql','sqlserver','mongodb','sqlite','oracle','cockroachdb','supabase'],
      default: 'postgresql',
    },
    dbVersion:        { type: String, maxlength: 20 },
    optimizationGoal: {
      type: String,
      enum: ['speed','cost','readability','balanced'],
      default: 'balanced',
    },
    schema:           { type: String, maxlength: 10_000 },
    naturalLanguage:  { type: String, maxlength: 1_000 },
    metrics: {
      estimatedImprovement: { type: Number, default: 0, min: 0, max: 100 },
      beforeCost:           { type: Number, default: 0 },
      afterCost:            { type: Number, default: 0 },
      estimatedExecMs:      { type: Number, default: 0 },
    },
    indexSuggestions: [
      {
        sql:    { type: String },
        reason: { type: String },
        impact: { type: String, enum: ['high','medium','low'] },
      },
    ],
    explanation:    { type: String, maxlength: 20_000 },
    queryComplexity:{ type: String, enum: ['simple','moderate','complex','very_complex'] },
    warnings:       [{ type: String }],
    ipHash:         { type: String, maxlength: 32 },
  },
  { timestamps: true }
);

// Indexes for history queries
QueryLogSchema.index({ createdAt: -1 });
QueryLogSchema.index({ dbType: 1, createdAt: -1 });
QueryLogSchema.index({ sessionId: 1 });

export const QueryLog =
  mongoose.models.QueryLog ||
  mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
