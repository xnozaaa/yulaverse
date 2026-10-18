import { IntelligenceShell } from "@/components/agentshelf/shell";
import { ResetPassword } from "@/components/agentshelf/reset-password";
export const metadata = {
  title: "Reset password · AgentShelf",
  robots: { index: false, follow: false },
};
export default function Reset() {
  return (
    <IntelligenceShell>
      <main id="main-content">
        <ResetPassword />
      </main>
    </IntelligenceShell>
  );
}
