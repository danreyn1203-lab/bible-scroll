import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma } from "./lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.twoFactorEnabled) {
          if (!code) return null;
          const codeHash = createHash("sha256").update(code).digest("hex");
          const record = await prisma.loginCode.findFirst({
            where: { userId: user.id, codeHash, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          });
          if (!record) return null;
          await prisma.loginCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        }

        return { id: user.id, email: user.email, name: user.displayName ?? undefined };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
