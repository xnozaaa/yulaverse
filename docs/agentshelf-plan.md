# AgentShelf implementation

Baseline: `xnozaaa/yulaverse`, Next.js 15 App Router, React 19, TypeScript,
Tailwind 3, CSS modules, Manrope, dark charcoal, ivory, restrained gold and purple.
The existing studio homepage and case studies remain in this application.

1. Add `/ai-visibility`, central GBP pricing, enquiry capture and an email outbox.
2. Add PostgreSQL persistence, a bounded SSRF-safe crawler, evidence-based checks,
   competitors and reviewed PDF reports.
3. Add Better Auth, verified customer accounts, organisation isolation, onboarding,
   dashboard, recommendations, feed import and report access.
4. Add reviewed query suites, provider adapters, raw evidence and transparent
   metrics. Provider calls default off and require explicit budgets.
5. Add hosted Stripe checkout, verified/idempotent webhooks, portal and entitlements.
   Live charges require separate explicit authorisation.
6. Add leased background jobs, subscription-checked monthly monitoring, retries,
   historical comparison and durable notifications.
7. Exercise security, persistence, user/admin flows, mobile UI and deployment.

External setup is tracked separately from implementation. A missing API key must
never become fabricated production evidence, a fake payment or a discarded lead.
Development uses persistent embedded PostgreSQL (PGlite); Vercel requires managed
PostgreSQL. Demonstration results use a separate read-only fixture.
