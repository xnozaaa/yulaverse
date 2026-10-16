# AgentShelf verification and release status

Date: 16 October 2026. Baseline studio commit: `5dbdcab`.
Repository: `xnozaaa/yulaverse`; implementation branch: `codex/agentshelf`.

## Verified locally

- TypeScript type checking passed.
- 76 unit/integration tests across five files passed. These exercise real PGlite
  PostgreSQL, verified Better Auth accounts, tenant CRUD and database RLS,
  optimistic versions, durable enquiries/outbox, origin/consent checks, atomic
  audit deduplication and report approval, report isolation, retention, robots
  rules, public URL/IP validation, redirect/DNS revalidation, streamed size caps,
  parsing/scoring, alias extraction, metric denominators, noisy-alert suppression,
  CSV/GTIN/formula safety, provider adapters with mocked real-format responses,
  provider failure/budgets, signed Stripe webhook handling and entitlements.
- Browser public workflow passed in **Chromium, Firefox and WebKit**, each at
  1440px desktop and 390px mobile: service/pricing, clearly simulated dashboard
  charts, recommendations, PDF download, no horizontal overflow, no uncaught
  browser errors and anonymous account-route protection.
- Authenticated Chromium scenario passed: public enquiry persisted, verified
  customer login, three-step onboarding, actual public `yulaverse.co.uk` crawl,
  administrator review/approval, customer PDF download and honest unconfigured
  Stripe state. This used local fixture accounts and did not send real emails.
- The 13-page selectable-text A4 sample PDF was generated and all pages inspected
  after raster rendering. Every page is marked simulated. It is not PDF/UA tagged.
- Production `next build` passed. The existing repository has no configured ESLint
  installation, so Next prints a lint-setup warning; no lint pass is claimed.
  Type checking and the automated test suite run separately and pass.
- `npm audit --omit=dev`: **0 production dependency vulnerabilities** at the time
  checked. A full audit still reports advisories in the existing Tailwind 3 build
  dependency chain. A forced Tailwind 4 migration was deliberately not mixed into
  this product implementation. Recheck before release; no untrusted CSS/glob
  patterns should enter the build.

Screenshots and PDFs are ignored local QA artefacts, not application/customer
records or published production evidence. Provider tests use mocked transport;
the separately labelled public-site crawl is real.

## Integration-ready, not represented as live

- Managed PostgreSQL: additive migration and pg connection ready; Neon terms
  acceptance/provisioning remains with the account holder.
- Resend: durable outbox/verification/reset/notifications implemented; requires
  integration acceptance, key, verified sender and actual delivery verification.
- Stripe: test-only hosted checkout/portal and verified idempotent webhooks
  implemented. Signature fixtures pass, but a real sandbox checkout, subscription,
  cancellation and webhook delivery still need account access. Live keys refused.
- OpenAI/Gemini/Anthropic/Perplexity: adapters, reviewed suites, repetitions,
  response evidence, token-cost estimates and conservative budgets implemented.
  No real provider key/model is configured and no paid test was run.
- Scheduled monitoring: leased jobs, active-subscription checks, monthly duplicate
  keys, paused-site checks, retries and approval-gated change notifications are
  implemented. Vercel cron needs a real database and secret before operational
  verification; an inactive subscription cannot schedule paid work.

## Product boundaries

This is an operational foundation and locally tested workflow, not a declaration
that every item in the master prompt is production-live. The first release has:

- One owner organisation per account; three websites/organisation; no agency team
  invitations, organisation switcher, white-label console or SSO/MFA yet.
- Bounded static HTML checks, not a JavaScript rendering crawler, a complete
  schema-vocabulary validator or exhaustive link/information-consistency audit.
- Product CSV/Shopify CSV import and proposed CSV/schema outputs, not live Shopify
  API edits, XML feeds or guaranteed shopping-feed eligibility.
- Heuristic recommendation extraction requiring human review, not an adjudicated
  market-research panel. Consumer-app rankings and AI market share are not claimed.
- Regenerated PDFs from immutable database snapshots, not archived signed binary
  documents or accessible PDF/UA certification.
- Billing events and subscription records, not a reconciled financial ledger.
  Live MRR/actual provider invoice costs are not invented in admin analytics.
- Approval-gated report notifications and conservative change rules; expanded
  competitor-gain/information-consistency alerts and higher-throughput scheduling
  remain future work. Hourly cron processes one bounded job at a time.
- Account export and an operator-led deletion process, not automated irreversible
  account erasure. Legal identity, postal contact, VAT treatment, contracts,
  retention implementation across providers/backups and launch policies need
  business-owner review.

Do not market these boundaries as already delivered features. Remaining launch
checks must be completed with real configured test services before paid onboarding
is enabled in production.
