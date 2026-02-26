import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/authz";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      return isAdminEmail(user.email);
    },
    async jwt({ token }) {
      (token as typeof token & { isAdmin?: boolean }).isAdmin = isAdminEmail(
        token.email,
      );
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (
          session.user as typeof session.user & {
            isAdmin?: boolean;
          }
        ).isAdmin = Boolean((token as { isAdmin?: boolean }).isAdmin);
      }
      return session;
    },
  },
};
