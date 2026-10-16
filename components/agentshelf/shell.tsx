import Link from "next/link";
import { Logo } from "@/components/logo";
import "./intelligence.css";
export function IntelligenceShell({
  children,
  platform = false,
}: {
  children: React.ReactNode;
  platform?: boolean;
}) {
  return (
    <div className="as-root">
      <header className="as-header">
        <Link href="/" aria-label="Yulaverse home" className="as-logo">
          <Logo variant="light" />
        </Link>
        <Link href="/ai-visibility" className="as-division">
          INTELLIGENCE <span>by Yulaverse</span>
        </Link>
        <nav aria-label="Yulaverse Intelligence">
          <Link href="/ai-visibility">AI Visibility</Link>
          <Link href="/agentshelf">AgentShelf</Link>
          <Link href="/agentshelf/demo">Explore demo</Link>
          <Link
            className="as-button as-button-small"
            href={platform ? "/ai-visibility#request" : "/agentshelf/login"}
          >
            {platform ? "Request an audit" : "Sign in ↗"}
          </Link>
        </nav>
      </header>
      {children}
      <footer className="as-footer">
        <span>© {new Date().getFullYear()} Yulaverse Intelligence</span>
        <Link href="/">Creative studio ↗</Link>
        <Link href="/ai-visibility/methodology">Methodology</Link>
        <Link href="/ai-visibility/privacy">Privacy & cookies</Link>
        <a href="mailto:yulaversestudio@gmail.com">Contact the studio</a>
      </footer>
    </div>
  );
}
export function SetupRequired({
  title = "Service connection pending",
}: {
  title?: string;
}) {
  return (
    <section className="as-container as-section">
      <p className="as-eyebrow">AgentShelf / setup required</p>
      <h1>{title}</h1>
      <p className="as-muted">
        The customer platform needs its database and email delivery connected
        before it can accept accounts or customer information. You can explore
        the clearly labelled fictional demonstration now.
      </p>
      <div className="as-actions">
        <Link className="as-button" href="/agentshelf/demo">
          Explore the demo ↗
        </Link>
        <a
          className="as-button as-button-secondary"
          href="mailto:yulaversestudio@gmail.com"
        >
          Contact Yulaverse
        </a>
      </div>
    </section>
  );
}
