import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { auth } from "utils/firebase/api/firebase.config";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-me",
  providers: [
    CredentialsProvider({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          // Verify with Firebase Admin
          const decodedToken = await auth.verifyIdToken(credentials.idToken);
          if (decodedToken) {
            return {
              id: decodedToken.uid,
              name: decodedToken.name || decodedToken.email || "User", // Fallback
              email: decodedToken.email,
              image: decodedToken.picture,
            };
          }
          return null;
        } catch (error) {
          console.error("Firebase auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user id to token
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send token id to the client
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
