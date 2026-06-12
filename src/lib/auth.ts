// src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { 
        username: { label: "Логин", type: "text" }, 
        password: { label: "Пароль", type: "password" } 
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ 
          where: { username: credentials.username } 
        });
        
        if (!user || !user.passwordHash) return null;
        
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        
        return { 
          id: user.id, 
          name: user.fullName, 
          email: user.username,
          role: user.role 
        };
      },
    }),
  ],
  callbacks: {
    // УДАЛИ ВСЮ ЛОГИКУ GOOGLE ИЗ signIn
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.username ?? undefined;
      }
      return session;
    },
  },
  pages: { 
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};