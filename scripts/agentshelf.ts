import { readFile, appendFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
async function main() {
  loadEnvConfig(process.cwd());
  const command = process.argv[2];
  if (command === "setup") {
    if (process.env.VERCEL)
      throw new Error("Local setup must not run inside Vercel.");
    const existing = await readFile(".env.local", "utf8").catch(() => "");
    const additions: Record<string, string> = {};
    for (const [key, value] of Object.entries({
      AGENTSHELF_LOCAL_DB: ".agentshelf/postgres",
      BETTER_AUTH_SECRET: randomBytes(40).toString("base64url"),
      BETTER_AUTH_URL: "http://localhost:3001",
      AGENTSHELF_ADMIN_EMAILS: "yulaversestudio@gmail.com",
    }))
      if (!process.env[key] && !new RegExp(`^${key}=`, "m").test(existing)) {
        additions[key] = value;
        process.env[key] = value;
      }
    await appendFile(
      ".env.local",
      `\n# AgentShelf local-only development configuration\n${Object.entries(
        additions,
      )
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join("\n")}\n`,
      { mode: 0o600 },
    );
    await mkdir(".agentshelf", { recursive: true });
    const { getDb } = await import("../lib/agentshelf/db");
    await (await getDb()).migrate();
    console.log(
      "Local PostgreSQL schema ready. Existing environment values preserved; secrets not displayed. Start npm run dev -- -p 3001. No paid provider has been enabled.",
    );
    return;
  }
  if (command === "migrate") {
    if (process.env.AGENTSHELF_DATABASE_URL && !process.env.DATABASE_URL)
      throw new Error("Migrations require the owner DATABASE_URL connection.");
    // Managed owner credentials are used only by this explicit operator command.
    delete process.env.AGENTSHELF_DATABASE_URL;
    const { getDb } = await import("../lib/agentshelf/db");
    await (await getDb()).migrate();
    console.log("AgentShelf additive migration applied.");
    return;
  }
  if (command === "worker") {
    const { worker, scheduleMonitoring } =
      await import("../lib/agentshelf/workflow");
    const actor = { userId: "local-worker", orgId: "system", admin: true };
    console.log({
      ...(await scheduleMonitoring(actor)),
      ...(await worker(actor)),
    });
    return;
  }
  if (command === "report") {
    const { generateReport } = await import("../lib/agentshelf/report"),
      { demoSnapshot } = await import("../lib/agentshelf/demo");
    await mkdir("output/pdf", { recursive: true });
    await writeFile(
      "output/pdf/AgentShelf-SIMULATED-DEMO.pdf",
      await generateReport(demoSnapshot),
    );
    console.log(
      "Created output/pdf/AgentShelf-SIMULATED-DEMO.pdf (fictional demonstration only).",
    );
    return;
  }
  throw new Error("Use setup, migrate, worker or report.");
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Command failed");
    process.exit(1);
  });
