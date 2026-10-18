import type { Metadata } from "next";
import Link from "next/link";
import { IntelligenceShell } from "@/components/agentshelf/shell";
export const metadata: Metadata = {
  title: "AgentShelf · Yulaverse Intelligence",
  description:
    "Your evidence-led AI visibility workspace: assessments, competitor comparisons, reviewed reports and monitoring.",
  alternates: { canonical: "/agentshelf" },
};
export default function AgentShelf() {
  return (
    <IntelligenceShell platform>
      <main id="main-content" className="as-container">
        <section className="as-hero">
          <div>
            <p className="as-eyebrow">
              Yulaverse Intelligence / The customer platform
            </p>
            <h1>
              A clearer view
              <br />
              of <em>your visibility.</em>
            </h1>
            <p className="as-muted">
              AgentShelf brings your website evidence, controlled AI
              observations and practical next steps into one considered
              workspace.
            </p>
            <div className="as-actions">
              <Link className="as-button" href="/agentshelf/signup">
                Create an account ↗
              </Link>
              <Link
                className="as-button as-button-secondary"
                href="/agentshelf/login"
              >
                Sign in
              </Link>
            </div>
            <p className="as-note">
              Want to look around first?{" "}
              <Link href="/agentshelf/demo">
                Explore the simulated demonstration ↗
              </Link>
            </p>
          </div>
          <div className="as-card">
            <p className="as-eyebrow">One workspace. Meaningful evidence.</p>
            {[
              ["01", "Understand your digital presence"],
              ["02", "Inspect the response evidence"],
              ["03", "Prioritise the right improvements"],
              ["04", "Measure again with context"],
            ].map(([n, t]) => (
              <div
                key={n}
                className="as-card-head"
                style={{
                  borderBottom: "1px solid #ffffff18",
                  paddingBlock: 22,
                }}
              >
                <span className="as-pill">{n}</span>
                <h3>{t}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>
    </IntelligenceShell>
  );
}
