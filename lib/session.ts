import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getCurrentUser() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    // Never let an auth/session error take down the whole page render -
    // degrade to "logged out" and let the page show its normal
    // unauthenticated state (e.g. the landing page, or a redirect to /login).
    console.error('[getCurrentUser] getServerSession failed', err);
    return null;
  }
  if (!session?.user) return null;
  return {
    id: (session.user as any).id as string,
    name: session.user.name || 'User',
    email: session.user.email || '',
    plan: (session.user as any).plan || 'free',
  };
}
