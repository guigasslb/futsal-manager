import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const utilizador = await prisma.utilizador.findUnique({
          where: { email: parsed.data.email },
        });
        if (!utilizador) return null;

        const valido = await bcrypt.compare(
          parsed.data.password,
          utilizador.passwordHash,
        );
        if (!valido) return null;

        return {
          id: utilizador.id,
          name: utilizador.nome,
          email: utilizador.email,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
