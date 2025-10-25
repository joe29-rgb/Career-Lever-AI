import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb';
import User from '@/models/User';
import { validateRedirectURL } from './auth-security';

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
                scope: 'openid email profile'
              }
            }
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            client: {
              token_endpoint_auth_method: 'client_secret_post'
            },
            issuer: 'https://www.linkedin.com',
            wellKnown: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
            authorization: {
              url: 'https://www.linkedin.com/oauth/v2/authorization',
              params: {
                scope: 'profile email openid',
                response_type: 'code'
              }
            },
            token: {
              url: 'https://www.linkedin.com/oauth/v2/accessToken'
            },
            userinfo: {
              url: 'https://api.linkedin.com/v2/userinfo'
            },
            jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                linkedInProfile: profile
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
      // First validate the URL for security
      const validatedUrl = validateRedirectURL(url, baseUrl)
      
      // If redirecting after sign-in and URL is the base URL or sign-in page
      if (validatedUrl === baseUrl || validatedUrl.includes('/auth/signin')) {
        // Check if user needs onboarding (we'll check in the client for now)
        // The client will handle the redirect based on session data
        return baseUrl
      }
      
      return validatedUrl
    },
    async signIn({ user }) {
      // Check if user has completed onboarding quiz
      if (user?.email) {
        try {
          await connectToDatabase()
          const dbUser = await User.findOne({ email: user.email })
          
          // New users or users who haven't completed onboarding → quiz
          if (!dbUser?.profile?.onboardingComplete) {
            console.log('[AUTH] Redirecting new user to onboarding quiz:', user.email)
            // Note: This doesn't directly redirect, but we'll handle it in the redirect callback
            return true
          }
          
          console.log('[AUTH] User has completed onboarding:', user.email)
        } catch (error) {
          console.error('[AUTH] Error checking onboarding status:', error)
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = (user as any).id;
      }
      
      // Always refresh onboarding status on sign-in or when session is updated
      if (user || trigger === 'update') {
        try {
          await connectToDatabase()
          const email = user?.email || token.email
          if (email) {
            const dbUser = await User.findOne({ email })
            token.onboardingComplete = dbUser?.profile?.onboardingComplete || false
          }
        } catch (error) {
          console.error('[AUTH] Error fetching onboarding status:', error)
          // Don't override existing value on error
          if (token.onboardingComplete === undefined) {
            token.onboardingComplete = false
          }
        }
      }
      if (account && account.provider === 'google') {
        token.googleAccessToken = account.access_token
        token.googleRefreshToken = account.refresh_token ?? token.googleRefreshToken
        if (account.expires_at) {
          token.googleAccessTokenExpires = account.expires_at * 1000
        }
      }

      // Store LinkedIn access token for API calls
      if (account && account.provider === 'linkedin') {
        token.linkedInAccessToken = account.access_token
        token.linkedInProfile = account.profile
        if (account.expires_at) {
          token.linkedInAccessTokenExpires = account.expires_at * 1000
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
        ;(session as any).user.role = (token as any).role || 'user'
        ;(session as any).user.teamId = (token as any).teamId || null
        ;(session as any).user.onboardingComplete = token.onboardingComplete || false
        // Do not expose tokens to the client; server routes can use next-auth/jwt getToken
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
