# AgentShelf verification and release status

Updated: 18 October 2026. Baseline studio commit: `5dbdcab`.
Repository: `xnozaaa/yulaverse`; implementation branch: `codex/agentshelf`.

## Verified locally

- TypeScript type checking passed.
- 87 unit/integration tests across six files passed. These exercise real PGlite
  PostgreSQL, verified Better Auth accounts, tenant CRUD and database RLS,
  optimistic versions, durable enquiries/outbox, origin/consent checks, atomic
  audit deduplication and report approval, report isolation, retention, robots
  rules, public URL/IP validation, redirect/DNS revalidation, streamed size caps,
  parsing/scoring, alias extraction, metric denominators, noisy-alert suppression,
  CSV/GTIN/formula safety, provider adapters with mocked real-format responses,
  provider failure/budgets, signed Stripe webhook handling and entitlements.
  Seven dedicated mail checks cover setup-required persistence, recipient
  validation, stable idempotency, sent-body clearing, delayed retries, transport
  uncertainty, batch limits and the five-attempt ceiling using mocked transport.
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
- Production `next build`, TypeScript checking and ESLint passed. Lint now runs
  in CI. Next 15's `next lint` command is deprecated and its compatible ESLint 9
  line reports end of support; a coordinated toolchain upgrade remains necessary.
- `npm audit --omit=dev`: **0 production dependency vulnerabilities** at the time
  checked. A full audit still reports advisories in the existing Tailwind 3 build
  dependency chain. A forced Tailwind 4 migration was deliberately not mixed into
  this product implementation. Recheck before release; no untrusted CSS/glob
  patterns should enter the build.

## Real hosted-service verification, 17 October

- Provisioned Neon Free in London and applied the additive 13-table schema to the
  verified empty database. Preview and Development only; no production database
  or existing studio data was changed.
- Created a restricted runtime login (`NOBYPASSRLS`, not superuser) and configured
  it through a server-only environment variable. Direct tests proved tenant read
  and write policies apply to the actual hosted login. Those SQL test rows were
  rolled back, not left in the database.
- Using the hosted runtime connection and local HTTP application: real signup,
  denial before verification, actual signed verification-token flow, login,
  durable enquiry persistence, tenant API isolation and denied customer admin
  access passed. Verification links came from the pending test outbox; this is
  **not** a claim that Resend delivered an email.
- A real `yulaverse.co.uk` technical crawl (one sampled page), admin review and
  approval, customer PDF download and another customer's denied PDF request
  passed against Neon. These were explicitly labelled QA fixtures, not customers.
- Provisioned Stripe Sandbox and configured its test billing portal. A real
  hosted Stripe Checkout form with Stripe's published test card completed a
  GBP £99/month **sandbox-only** subscription. Signed Stripe events arrived via
  Stripe CLI forwarding to the local app and persisted the paid order and active
  subscription in Neon. The portal displayed the paid test invoice. No real
  charge or live subscription was created.
- Portal cancellation scheduled the correct end date. Testing caught Stripe's
  explicit `cancel_at` timestamp being set even with `cancel_at_period_end=false`;
  the application now persists that date and caps entitlements at it. A subsequent
  signed cancellation event revoked access, and the pending monitoring job did
  not run. Hosted monitoring scheduling deduplicated a second scheduling attempt.
- Replayed an actual sandbox event twice with the CLI listener's test signing
  secret: both HTTP requests succeeded with no additional event processing.
- Removed the five temporary QA accounts, their organisations/records and the
  test enquiry after verification. The Stripe sandbox subscription was canceled;
  its provider-side historical test invoice remains clearly labelled test data.

Screenshots and PDFs are ignored local QA artefacts, not application/customer
records or published production evidence. Provider tests use mocked transport;
the separately labelled public-site crawl is real.

## Real email connection, 18 October

- Used the existing Resend Free account, not the paid Marketplace integration.
  Added and verified only `send.yulaverse.co.uk`, with three exact DNS records at
  Spaceship. Existing website A/CNAME and email records were not replaced.
- Created one sending-only API key restricted to this sender domain. Configured
  it in Vercel Preview and Development only; no production or Shongo keys changed.
  Secret values were not committed, printed or included in test screenshots.
- Enabled enforced TLS on this new sender. Receiving and tracking remain disabled.
- A real operational message to the owner's Gmail address was persisted in Neon,
  sent through the actual application outbox and marked sent with its body
  cleared. Resend's message detail showed **Delivered**. This verifies acceptance
  by the receiving mail server, not inbox-versus-spam placement.

## Integration-ready, not represented as live

- Managed PostgreSQL: connected and tested in Preview/Development. Production
  connection, backup/restore policy and operational approval remain outstanding.
- Resend: existing account, restricted sending key, verified domain and real
  delivery tested in Preview/Development as above. Signup/reset/notifications use
  this durable transport; a customer's mailbox placement still depends on their
  provider. Production configuration and a launch-domain delivery check remain
  outstanding. No new paid Resend plan was installed.
- Stripe: test-only hosted checkout/portal and verified idempotent webhooks
  implemented. Real sandbox checkout and local signed forwarding passed as above.
  Public deployed webhook transport is not configured: Vercel's protected preview
  is not a public provider webhook. Checkout refuses missing signing configuration.
  Live keys are still refused.
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
