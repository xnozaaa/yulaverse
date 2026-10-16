import { redirect } from "next/navigation";
import { currentActor } from "@/lib/agentshelf/auth";
import { dbConfigured } from "@/lib/agentshelf/db";
import {
  IntelligenceShell,
  SetupRequired,
} from "@/components/agentshelf/shell";
import { AgentDashboard } from "@/components/agentshelf/dashboard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "AgentShelf administration",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  if (!dbConfigured() || !process.env.BETTER_AUTH_SECRET)
    return (
      <IntelligenceShell>
        <SetupRequired title="Administration setup pending" />
      </IntelligenceShell>
    );
  const actor = await currentActor();
  if (!actor) redirect("/agentshelf/login");
  if (!actor.admin)
    return (
      <IntelligenceShell>
        <main id="main-content" className="as-container as-section">
          <h1>Restricted workspace</h1>
          <p className="as-muted">
            Your verified account does not have administrator access.
          </p>
        </main>
      </IntelligenceShell>
    );
  return (
    <IntelligenceShell platform>
      <AgentDashboard admin />
    </IntelligenceShell>
  );
}
