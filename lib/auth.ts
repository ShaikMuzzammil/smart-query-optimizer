// lib/auth.ts — NextAuth configuration with persistent sessions
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // FIX #1: Use JWT strategy with 30-day maxAge so sessions persist
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,   // 30 days
    updateAge: 24 * 60 * 60,      // refresh daily
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,   // 30 days
  },
  pages: {
    signIn:  "/login",
    newUser: "/register",
    error:   "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });
          if (!user?.password) return null;
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;
          return {
            id:    user.id,
            email: user.email,
            name:  user.name ?? undefined,
            image: user.image ?? undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
        token.name  = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string;
        session.user.email = token.email as string;
        session.user.name  = token.name as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always allow relative URLs and same-origin redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export function getAuth() {
  return getServerSession(authOptions);
}
