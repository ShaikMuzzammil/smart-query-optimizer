import Link from 'next/link';
import Logo from '../../components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid-pattern bg-radial-blue">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="card-base shadow-elevated p-8">{children}</div>
        <p className="text-center text-xs text-ink-faint mt-6">
          <Link href="/" className="hover:text-ink-muted transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
