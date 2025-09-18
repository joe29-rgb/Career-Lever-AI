import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  // Make adapter optional so OAuth can work even if DB is temporarily unreachable
  adapter: process.env.MONGODB_URI ? (MongoDBAdapter(clientPromise) as any) : undefined,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                access_type: 'offline',
                prompt: 'consent',
                scope: 'openid email profile https://www.googleapis.com/auth/calendar.events'
              }
            }
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();

          const normalizedEmail = credentials.email.toLowerCase().trim();
          const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

          if (!user) {
            return null;
          }

          const ok = user.passwordHash
            ? await bcrypt.compare(credentials.password, user.passwordHash)
            : false

          if (!ok) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always force redirect to the configured NEXTAUTH_URL host
      const appBase = process.env.NEXTAUTH_URL || baseUrl
      try {
        const target = new URL(url, appBase)
        const base = new URL(appBase)
        // Keep internal paths, otherwise send to base
        if (target.origin === base.origin) return target.toString()
        return base.toString()
      } catch {
        return appBase
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id;
      }
      if (account && account.provider === 'google') {
        token.googleAccessToken = account.access_token
        token.googleRefreshToken = account.refresh_token ?? token.googleRefreshToken
        if (account.expires_at) {
          token.googleAccessTokenExpires = account.expires_at * 1000
        }
      }

      // Refresh Google access token if expired and refresh token is available
      const needsRefresh = token.googleAccessToken && token.googleAccessTokenExpires && Date.now() > (token.googleAccessTokenExpires as number - 60000)
      if (needsRefresh && token.googleRefreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        try {
          const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: token.googleRefreshToken as string
          })
          const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
          const json = await res.json() as any
          if (res.ok && json.access_token) {
            token.googleAccessToken = json.access_token
            if (json.expires_in) token.googleAccessTokenExpires = Date.now() + json.expires_in * 1000
            if (json.refresh_token) token.googleRefreshToken = json.refresh_token
          }
        } catch {}
      }
      return token as any;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).user.id = token.id as string;
        // Do not expose tokens to the client; server routes can use next-auth/jwt getToken
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
};
