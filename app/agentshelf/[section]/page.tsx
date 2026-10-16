import { redirect, notFound } from "next/navigation";
import { currentActor } from "@/lib/agentshelf/auth";
import { dbConfigured } from "@/lib/agentshelf/db";
import {
  IntelligenceShell,
  SetupRequired,
} from "@/components/agentshelf/shell";
import { AgentDashboard } from "@/components/agentshelf/dashboard";
import { packages, gbp } from "@/lib/agentshelf/config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your AgentShelf workspace",
  robots: { index: false, follow: false },
  alternates: { canonical: "/agentshelf" },
};
const tabs: Record<string, string> = {
  dashboard: "Overview",
  onboarding: "Websites",
  websites: "Websites",
  results: "Results",
  competitors: "Competitors",
  recommendations: "Recommendations",
  history: "Audit history",
  reports: "Reports",
  monitoring: "Monitoring",
  billing: "Billing",
  account: "Account",
  feeds: "Product feeds",
};
export default async function Workspace({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { section } = await params;
  if (!tabs[section]) notFound();
  if (!dbConfigured() || !process.env.BETTER_AUTH_SECRET)
    return (
      <IntelligenceShell>
        <SetupRequired />
      </IntelligenceShell>
    );
  const actor = await currentActor();
  if (!actor) redirect("/agentshelf/login");
  const requestedTab = (await searchParams).tab;
  return (
    <IntelligenceShell platform>
      <AgentDashboard
        initialTab={requestedTab === "billing" ? "Billing" : tabs[section]}
        priceOptions={packages().map((p) => ({
          id: p.id,
          name: p.name,
          display: gbp(p.pence),
        }))}
      />
    </IntelligenceShell>
  );
}
