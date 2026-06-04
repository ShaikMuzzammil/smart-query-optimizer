import mongoose, { Schema } from 'mongoose';
const S = new Schema({
  sessionId:        { type: String, default: () => Math.random().toString(36).slice(2) },
  originalQuery:    { type: String, required: true, maxlength: 10000 },
  optimizedQuery:   { type: String, required: true, maxlength: 10000 },
  dbType:           { type: String, default: 'postgresql' },
  optimizationGoal: { type: String, default: 'balanced' },
  metrics: {
    estimatedImprovement: { type: Number, default: 0 },
    beforeCost:           { type: Number, default: 0 },
    afterCost:            { type: Number, default: 0 },
    estimatedExecMs:      { type: Number, default: 0 },
  },
  indexSuggestions: [{ sql: String, reason: String, impact: String }],
  explanation:      { type: String, maxlength: 20000 },
  queryComplexity:  String,
  warnings:         [String],
}, { timestamps: true });
S.index({ createdAt: -1 });
export const QueryLog = mongoose.models.QueryLog || mongoose.model('QueryLog', S);
