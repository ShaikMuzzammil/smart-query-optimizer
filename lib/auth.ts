import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbConnect, isDbConfigured } from './db/connect';
import User from './db/models/User';
import { DEMO_USER_ID, DEMO_EMAIL, DEMO_PASSWORD } from './constants';

export { DEMO_USER_ID, DEMO_EMAIL, DEMO_PASSWORD };

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password || '';

        if (!email || !password) return null;

        // Demo / guest mode - always available, no database required.
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          return {
            id: DEMO_USER_ID,
            name: 'Demo User',
            email: DEMO_EMAIL,
            plan: 'free',
          } as any;
        }

        if (!isDbConfigured()) {
          throw new Error('MONGODB_URI is not configured. Use the demo account or set up MongoDB.');
        }

        await dbConnect();
        const user = await User.findOne({ email });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          plan: user.plan,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.plan = (user as any).plan || 'free';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
