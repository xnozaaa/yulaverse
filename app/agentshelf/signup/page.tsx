import {
  IntelligenceShell,
  SetupRequired,
} from "@/components/agentshelf/shell";
import { AuthForm } from "@/components/agentshelf/auth-form";
import { dbConfigured } from "@/lib/agentshelf/db";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Create an account · AgentShelf",
  robots: { index: false, follow: false },
  alternates: { canonical: "/agentshelf/signup" },
};
export default function Signup() {
  return (
    <IntelligenceShell>
      {dbConfigured() && process.env.BETTER_AUTH_SECRET ? (
        <main id="main-content">
          <AuthForm signup />
        </main>
      ) : (
        <SetupRequired />
      )}
    </IntelligenceShell>
  );
}
