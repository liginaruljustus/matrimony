import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";

const STATUS_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // re-read DB every 5 minutes

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        profileId: { label: "Profile ID", type: "text" },
        password:  { label: "Password",   type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.profileId || !credentials?.password) return null;
        await connectToDatabase();

        const user = await UserModel.findOne({ profileId: credentials.profileId.trim().toUpperCase() }).lean<any>();
        if (!user) return null;

        // Block suspended / banned accounts before password check
        if (user.status && user.status !== "ACTIVE") {
          // Throw so NextAuth surfaces a specific error the login page can read
          throw new Error(
            user.status === "SUSPENDED"
              ? "ACCOUNT_SUSPENDED"
              : user.status === "BANNED"
              ? "ACCOUNT_BANNED"
              : "ACCOUNT_INACTIVE",
          );
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // Update lastActivity on login
        await UserModel.findByIdAndUpdate(user._id, { $set: { lastActivity: new Date(), lastLogin: new Date() } });

        return {
          id:          String(user._id),
          email:       user.email,
          name:        user.name,
          image:       user.image ?? null,
          role:        user.role,
          status:      user.status ?? "ACTIVE",
          profileType: user.profileType ?? null,
          familyClass: user.familyClass ?? null,
          profileId:   user.profileId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in: stamp all fields from the authorize() return value.
        token.id              = user.id;
        token.role            = (user as any).role;
        token.status          = (user as any).status      ?? "ACTIVE";
        token.profileType     = (user as any).profileType ?? null;
        token.familyClass     = (user as any).familyClass ?? null;
        token.profileId       = (user as any).profileId   ?? null;
        token.statusCheckedAt = Date.now();
        return token;
      }

      // Subsequent requests: re-read status/role from DB at most once every 5 minutes
      // so that admin suspensions/bans take effect quickly without a DB hit on every call.
      const checkedAt = (token.statusCheckedAt as number) ?? 0;
      if (Date.now() - checkedAt > STATUS_REFRESH_INTERVAL_MS) {
        try {
          await connectToDatabase();
          const fresh = await UserModel.findById(token.id)
            .select("status role profileType familyClass profileId")
            .lean() as any;
          if (fresh) {
            token.status          = fresh.status      ?? "ACTIVE";
            token.role            = fresh.role        ?? "USER";
            token.profileType     = fresh.profileType ?? null;
            token.familyClass     = fresh.familyClass ?? null;
            token.profileId       = fresh.profileId   ?? null;
          }
        } catch {
          // If DB is unreachable, keep the existing token values — don't break the session.
        }
        token.statusCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id          = token.id;
        (session.user as any).role        = token.role;
        (session.user as any).status      = token.status;
        (session.user as any).profileType = token.profileType;
        (session.user as any).familyClass = token.familyClass;
        (session.user as any).profileId   = token.profileId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
