'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LogIn, PlayCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'credentials' | 'demo' | null>(null);

  async function handleSubmit(e: React.FormEvent, demo = false) {
    e.preventDefault();
    setLoading(demo ? 'demo' : 'credentials');

    const result = await signIn('credentials', {
      email: demo ? 'demo@smartquery.com' : email,
      password: demo ? 'password' : password,
      redirect: false,
    });

    setLoading(null);

    if (result?.error) {
      toast.error(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : result.error);
      return;
    }

    toast.success(demo ? 'Welcome to the demo workspace!' : 'Welcome back!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Welcome back</h1>
      <p className="text-sm text-ink-muted mb-6">Sign in to your SmartQuery Pro workspace.</p>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading !== null} className="btn-primary w-full">
          {loading === 'credentials' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Sign in
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface px-2 text-ink-faint">or</span>
        </div>
      </div>

      <button onClick={(e) => handleSubmit(e, true)} disabled={loading !== null} className="btn-secondary w-full">
        {loading === 'demo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
        Continue with demo account
      </button>
      <p className="text-center text-xs text-ink-faint mt-2 font-mono">demo@smartquery.com / password</p>

      <p className="text-center text-sm text-ink-muted mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary-light font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
