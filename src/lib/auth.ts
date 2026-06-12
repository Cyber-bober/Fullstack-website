//src/lib/auth.ts

import { NextAuthOptions, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: { 
        username: { label: "Username", type: "text" }, 
        password: { label: "Password", type: "password" } 
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ 
          where: { username: credentials.username } 
        });
        
        if (!user) return null;
        
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const googleProfile = profile as Profile & {
            email?: string;
            name?: string;
            picture?: string;
            sub?: string;
          };

          const email = googleProfile.email;
          if (!email) {
            console.error("Google не вернул email");
            return false;
          }

          // Ищем пользователя по email
          let existingUser = await prisma.user.findUnique({
            where: { username: email }, // используем email как username для OAuth
          });

          if (!existingUser) {
            // Создаём нового пользователя
            existingUser = await prisma.user.create({
              data: {
                username: `oauth_${googleProfile.sub}`,
                fullName: googleProfile.name || email.split("@")[0],
                passwordHash: "",
                photos: googleProfile.picture ? [googleProfile.picture] : [],
                role: "USER",
                city: "",
              },
            });
            console.log("Создан новый пользователь через Google:", existingUser.id);
          } else {
            // Обновляем данные
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                fullName: googleProfile.name || existingUser.fullName,
                photos: googleProfile.picture ? [googleProfile.picture] : existingUser.photos,
              },
            });
            console.log("Обновлён пользователь через Google:", existingUser.id);
          }

          // Обновляем user объект для next-auth
          user.id = existingUser.id;
          user.name = existingUser.fullName;
          user.email = existingUser.username;
        } catch (error) {
          console.error("Ошибка в Google OAuth:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: { 
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};