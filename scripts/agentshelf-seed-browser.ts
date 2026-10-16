import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { writeFile, mkdir } from "node:fs/promises";
async function main() {
  loadEnvConfig(process.cwd());
  if (
    process.env.VERCEL ||
    process.env.DATABASE_URL ||
    process.env.RESEND_API_KEY
  )
    throw new Error(
      "This fixture command is restricted to local PostgreSQL with real email disabled.",
    );
  const base = process.env.BETTER_AUTH_URL || "http://localhost:3001",
    { getAuth } = await import("../lib/agentshelf/auth"),
    { getDb } = await import("../lib/agentshelf/db");
  const auth = await getAuth();
  const stamp = Date.now(),
    adminEmail = (process.env.AGENTSHELF_ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)[0];
  if (!adminEmail)
    throw new Error("Configure a local administrator email first.");
  const fixtures = [];
  for (const [role, email] of [
    ["customer", `browser-${stamp}@agentshelf.example`],
    ["admin", adminEmail],
  ]) {
    const password = randomBytes(22).toString("base64url"),
      name = `Local browser ${role}`;
    const exists = (
      await (
        await getDb()
      ).query("SELECT id FROM as_user WHERE email=$1", [email])
    ).rows.length;
    if (exists && role === "admin")
      throw new Error(
        "Local administrator already exists; preserve it. Use saved fixture credentials or a separate local database.",
      );
    const response = await auth.handler(
      new Request(`${base}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { origin: base, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          callbackURL: "/agentshelf/dashboard",
        }),
      }),
    );
    if (response.status !== 200)
      throw new Error(`Local ${role} signup failed: ${response.status}`);
    const mail = (
      await (
        await getDb()
      ).query<{ body: string }>(
        "SELECT body FROM as_outbox WHERE recipient=$1 AND subject=$2 ORDER BY created_at DESC LIMIT 1",
        [email, "Verify your AgentShelf email"],
      )
    ).rows[0];
    const url = mail?.body.match(/https?:\/\/\S+/)?.[0];
    if (!url) throw new Error("Local verification outbox missing");
    const verified = await auth.handler(new Request(url));
    if (![200, 302].includes(verified.status))
      throw new Error("Local email verification failed");
    fixtures.push({ role, email, password });
  }
  await mkdir(".agentshelf", { recursive: true });
  await writeFile(
    ".agentshelf/browser-fixture.json",
    JSON.stringify(fixtures),
    { mode: 0o600 },
  );
  console.log(
    "Created verified local-only browser fixtures using real authentication and verification tokens. Credentials saved privately; no real email sent.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Fixture setup failed");
    process.exit(1);
  });
