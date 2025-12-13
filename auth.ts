import NextAuth from "next-auth";
import Deezer from "@/lib/providers/deezer";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

// Check if Deezer credentials are available
const hasDeezerCredentials = 
  process.env.DEEZER_CLIENT_ID && 
  process.env.DEEZER_CLIENT_SECRET;

// Development mode flag
export const isDevelopmentMode = !hasDeezerCredentials;

// Build providers array conditionally
const providers = [];

if (hasDeezerCredentials) {
  providers.push(
    Deezer({
      clientId: process.env.DEEZER_CLIENT_ID!,
      clientSecret: process.env.DEEZER_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "basic_access,email,offline_access,manage_library,delete_library",
        },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel and other hosting platforms
  providers,
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

