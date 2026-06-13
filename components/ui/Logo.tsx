import { cn } from '../../lib/utils';

export default function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="32" height="32" rx="8" fill="#131630" />
        <circle cx="14" cy="14" r="7" stroke="#4F8EF7" strokeWidth="2.5" />
        <path d="M19 19L24 24" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="14" r="2.5" fill="#4F8EF7" />
      </svg>
      {!iconOnly && (
        <span className="font-display font-semibold text-lg tracking-tight text-ink">
          SmartQuery <span className="text-primary">Pro</span>
        </span>
      )}
    </div>
  );
}
