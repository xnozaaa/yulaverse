import { IntelligenceShell } from "@/components/agentshelf/shell";
import { AgentDashboard } from "@/components/agentshelf/dashboard";
import { packages, gbp } from "@/lib/agentshelf/config";
export const metadata = {
  title: "Simulated AgentShelf demonstration",
  robots: { index: false, follow: false },
  alternates: { canonical: "/agentshelf/demo" },
};
export default function Demo() {
  return (
    <IntelligenceShell platform>
      <AgentDashboard
        simulated
        priceOptions={packages().map((p) => ({
          id: p.id,
          name: p.name,
          display: gbp(p.pence),
        }))}
      />
    </IntelligenceShell>
  );
}
