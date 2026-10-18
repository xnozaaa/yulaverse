import {
  IntelligenceShell,
  SetupRequired,
} from "@/components/agentshelf/shell";
import { AuthForm } from "@/components/agentshelf/auth-form";
import { dbConfigured } from "@/lib/agentshelf/db";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in · AgentShelf",
  robots: { index: false, follow: false },
  alternates: { canonical: "/agentshelf/login" },
};
export default function Login() {
  return (
    <IntelligenceShell>
      {dbConfigured() && process.env.BETTER_AUTH_SECRET ? (
        <main id="main-content">
          <AuthForm />
        </main>
      ) : (
        <SetupRequired />
      )}
    </IntelligenceShell>
  );
}
