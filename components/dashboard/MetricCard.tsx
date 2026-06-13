import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'primary' | 'accent' | 'success' | 'warning';
  loading?: boolean;
}

const ACCENTS: Record<string, string> = {
  primary: 'text-primary bg-primary/10',
  accent: 'text-accent bg-accent/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
};

export default function MetricCard({ icon: Icon, label, value, accent = 'primary', loading }: MetricCardProps) {
  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', ACCENTS[accent])}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-7 w-16 mb-1" />
      ) : (
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
      )}
      <p className="text-xs text-ink-muted mt-1">{label}</p>
    </div>
  );
}
