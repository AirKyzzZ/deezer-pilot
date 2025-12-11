import NextAuth from "next-auth";
import DeezerProvider from "next-auth/providers/deezer";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    DeezerProvider({
      clientId: process.env.DEEZER_CLIENT_ID,
      clientSecret: process.env.DEEZER_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "basic_access,email,offline_access,manage_library,delete_library",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

