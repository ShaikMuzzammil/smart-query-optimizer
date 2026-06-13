'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, MessageCircle, FileText, ArrowRight, AlertTriangle, Send } from 'lucide-react';
import { fetcher, postJSON } from '../../../lib/fetcher';
import { ClientFile } from '../../../types';
import GuideTip from '../../../components/ui/GuideTip';

interface QAResponse {
  answer: string;
  sources: { fileName: string; fileId: string; snippet: string; score: number }[];
  aiAssisted: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What is the refund policy?',
  'What are the most common production errors?',
  'What action items came out of the last meeting?',
  'What do customers complain about most?',
];

export default function AiInsightsPage() {
  const { data: aiStatus } = useSWR<{ configured: boolean }>('/api/ai/status', fetcher);
  const { data: filesData } = useSWR<{ files: ClientFile[] }>('/api/files', fetcher);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QAResponse | null>(null);

  const files = filesData?.files.filter((f) => f.status === 'indexed') || [];
  const summarized = files.filter((f) => f.summary);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion(q);
    try {
      const data = await postJSON('/api/ai/qa', { question: q });
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get an answer.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">AI Insights</h2>
        <GuideTip title="AI Insights">
          Ask natural-language questions across your entire document library. SmartQuery Pro finds the most relevant
          documents using the search engine, then (if Gemini is configured) asks the AI to synthesize an answer with
          citations. Without an API key, you'll get the best matching excerpt instead.
        </GuideTip>
      </div>

      {aiStatus && !aiStatus.configured && (
        <div className="card-base p-4 border-warning/30 bg-warning/5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">Gemini API key not configured.</span> Q&A and summaries are running
            in extractive fallback mode (no external AI calls). Add a free{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary-light underline">Gemini API key</a>{' '}
            as <code className="font-mono text-xs">GEMINI_API_KEY</code> to enable AI-generated answers and summaries.
          </p>
        </div>
      )}

      {/* Q&A */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-ink">Ask your documents</h3>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents…"
            className="input-field flex-1"
          />
          <button type="submit" disabled={loading || !question.trim()} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => ask(q)} className="badge bg-elevated text-ink-muted border border-border hover:border-primary transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div className="mt-5 pt-5 border-t border-border space-y-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-ink leading-relaxed">{result.answer}</p>
                {!result.aiAssisted && (
                  <p className="text-xs text-ink-faint mt-1.5">Extractive mode — best-matching excerpt shown above.</p>
                )}
              </div>
            </div>

            {result.sources.length > 0 && (
              <div>
                <p className="text-xs text-ink-faint mb-2">Sources</p>
                <div className="space-y-2">
                  {result.sources.map((s) => (
                    <Link key={s.fileId} href={`/files/${s.fileId}`} className="block rounded-lg border border-border bg-elevated/40 p-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-ink-muted">{s.fileName}</span>
                        <ArrowRight className="w-3 h-3 text-ink-faint" />
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: s.snippet }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summaries */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold text-ink">Document summaries</h3>
        </div>

        {summarized.length === 0 ? (
          <p className="text-sm text-ink-faint">
            No summaries generated yet. Open any file and click "Generate summary" to create one.{' '}
            {files.length === 0 && (
              <>
                <br />
                <Link href="/upload" className="text-primary-light hover:underline">Upload a document to get started →</Link>
              </>
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {summarized.map((f) => (
              <Link key={f.id} href={`/files/${f.id}`} className="block rounded-lg border border-border bg-elevated/40 p-3 hover:border-primary/40 transition-colors">
                <p className="font-mono text-xs text-ink-muted mb-1">{f.fileName}</p>
                <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">{f.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
