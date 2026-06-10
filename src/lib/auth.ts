import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { username: credentials.username } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.fullName, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = user.id; token.role = (user as any).role; } return token; },
    async session({ session, token }: any) { session.user.id = token.id; session.user.role = token.role; return session; },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET,
};
