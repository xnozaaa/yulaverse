import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDb, type Actor } from "./db";
import { queueEmail, flushMail } from "./mail";
import * as schema from "./auth-schema";
import { headers } from "next/headers";
type AuthDatabase = Awaited<ReturnType<typeof getDb>>["authDb"];
let auth: ReturnType<typeof buildAuth> | undefined;
export async function getAuth() {
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    throw new Error(
      "SETUP_REQUIRED: Configure a strong authentication secret.",
    );
  if (auth) return auth;
  const instance = buildAuth((await getDb()).authDb);
  auth = instance;
  return instance;
}
function buildAuth(database: AuthDatabase) {
  return betterAuth({
    appName: "AgentShelf · Yulaverse Intelligence",
    basePath: "/api/auth",
    baseURL: process.env.BETTER_AUTH_URL || undefined,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await queueEmail(
          user.email,
          "Reset your AgentShelf password",
          `Open this link to reset your password: ${url}\nIf you did not request this, ignore this email.`,
        );
        await flushMail();
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await queueEmail(
          user.email,
          "Verify your AgentShelf email",
          `Confirm your email address: ${url}\nThis link expires. If you did not sign up, ignore this email.`,
        );
        await flushMail();
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimit",
      window: 60,
      max: 20,
    },
    session: { expiresIn: 7 * 86400, updateAge: 86400 },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
    },
    plugins: [nextCookies()],
  });
}
export function isAdmin(email: string, verified: boolean) {
  return (
    verified &&
    (process.env.AGENTSHELF_ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase())
  );
}
export async function currentActor(
  requestHeaders?: Headers,
): Promise<Actor | null> {
  const result = await (
    await getAuth()
  ).api.getSession({ headers: requestHeaders || (await headers()) });
  if (!result?.user.emailVerified) return null;
  const user = result.user,
    orgId = `org_${user.id}`;
  await (
    await getDb()
  ).transaction(async (q) => {
    await q.query(
      "INSERT INTO as_organisations(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",
      [orgId, `${user.name}’s business`],
    );
    await q.query(
      "INSERT INTO as_memberships(user_id,org_id,role) VALUES($1,$2,'owner') ON CONFLICT DO NOTHING",
      [user.id, orgId],
    );
  });
  const membership = (
    await (
      await getDb()
    ).query(
      "SELECT org_id FROM as_memberships WHERE user_id=$1 AND org_id=$2",
      [user.id, orgId],
    )
  ).rows[0];
  if (!membership) return null;
  return {
    userId: user.id,
    orgId,
    admin: isAdmin(user.email, user.emailVerified),
    email: user.email,
  };
}
