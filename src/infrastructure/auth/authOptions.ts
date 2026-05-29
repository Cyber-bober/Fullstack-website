import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaUserRepository } from '../database/repositories/PrismaUserRepository';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const userRepo = new PrismaUserRepository();
        const user = await userRepo.findByUsername(credentials.username);

        if (!user) {
          return null;
        }

        const { prisma } = await import('../database/client');
        const record = await prisma.user.findUnique({
          where: { username: credentials.username },
          select: { passwordHash: true },
        });

        if (!record) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, record.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.contacts.email ?? null,
          image: user.photos[0] ?? null,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'USER';
        token.fullName = user.name ?? '';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).fullName = token.fullName;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
