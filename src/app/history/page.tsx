import type { Metadata } from 'next';
import HistoryClient from '@/components/HistoryClient';

export const metadata: Metadata = {
  title: 'History',
  description: 'Browse your past SQL optimization sessions with search and filtering.',
};

export default function HistoryPage() {
  return <HistoryClient />;
}
