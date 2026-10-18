# AgentShelf operator runbook

AgentShelf extends the existing Yulaverse Next.js application. It does not replace
the studio homepage, portfolio, contact workflow or branding. Commercial prices
are centrally configured in `lib/agentshelf/config.ts`: £299 audit, £799 managed
optimisation and £99/month monitoring. VAT wording is a separate setting.

## Current operating modes

- **Public demonstration:** `/agentshelf/demo`. All businesses, responses and
  metrics in this workspace are fictional and labelled simulated. It is read-only
  and makes no provider or payment requests.
- **Local development:** real persistent PostgreSQL through PGlite, real Better
  Auth accounts, a durable email outbox, real public-site checks and reviewed
  reports. PGlite is development infrastructure, not a production database.
- **Hosted production/preview:** requires managed PostgreSQL and authentication
  configuration. There is deliberately no filesystem database fallback on Vercel.
  The public pages and demonstration still work while these are absent.
- **Payments:** Stripe test keys only. Live keys are refused. A success URL alone
  never activates a subscription. Checkout, signed webhook delivery, the portal
  and subscription cancellation have been exercised against the provisioned
  Stripe sandbox with the hosted test database and a local Stripe CLI listener.
  This does not establish deployed webhook delivery or enable live charging.
- **AI providers:** calls default off. Each selected provider needs a legitimate
  key, model identifier, current token prices and explicit usage budgets. Missing
  configuration produces setup-required evidence, never invented measurements.

On 17 October 2026 the account holder confirmed Marketplace terms acceptance.
Neon Free (`agentshelf-db`, London) and Stripe Sandbox (`agentshelf-stripe-test`)
are connected to **Preview and Development only**. Production is unchanged.
Resend's native Marketplace plans are paid, so none was installed: the owner chose
their existing Free account. On 18 October, `send.yulaverse.co.uk` was verified
using three isolated subdomain DNS records at Spaceship. The existing website and
email records were preserved. A sending-only key restricted to this domain and
`Yulaverse Intelligence <noreply@send.yulaverse.co.uk>` are configured in Preview
and Development only. Enforced TLS is enabled; receiving and tracking remain off.
A real message passed through the hosted database outbox and Resend reported
delivery to the owner's Gmail server. This confirms server acceptance, not inbox
placement. No paid plan, live charge or paid AI call was enabled.

## Run locally

Use Node.js 22 or newer and a current npm version. This repository was installed
with npm 11; npm 10 encountered a dependency-tree error on this machine.

```sh
npm ci
npm run agentshelf:setup
npm run dev -- -p 3001
```

`agentshelf:setup` adds missing local values to the ignored `.env.local`, creates
strong random authentication secrets and applies the additive schema. It never
prints secrets or replaces existing values. Keep `.agentshelf/` private and backed
up if using development records. Only one local process should open its PGlite
directory at a time: stop the dev server before running a standalone local worker.

Useful routes:

| Purpose                             | Path                                             |
| ----------------------------------- | ------------------------------------------------ |
| Public service, pricing and enquiry | `/ai-visibility`                                 |
| Methodology                         | `/ai-visibility/methodology`                     |
| Privacy/cookies and service terms   | `/ai-visibility/privacy`, `/ai-visibility/terms` |
| Product and simulated workspace     | `/agentshelf`, `/agentshelf/demo`                |
| Signup and login                    | `/agentshelf/signup`, `/agentshelf/login`        |
| Customer workspace                  | `/agentshelf/dashboard`                          |
| Internal operations                 | `/admin/agentshelf`                              |

Without email configuration verification messages are retained in the outbox but
cannot arrive in an inbox. The local-only browser fixture script verifies test
accounts using their actual generated verification links; it refuses hosted
databases, Vercel and an enabled Resend key. Its ignored credential file is never
part of a deployment. Do not use this helper for real customers.

With a real Resend key configured, email tests must use a controlled recipient,
not fabricated customer addresses. Do not run old QA fixture scripts that assume
transport is disabled. Confirm the queue contains no unrelated pending messages
before an operational send test; inspect the matching message in Resend for
delivery status. Never expose the key or private verification/reset links in logs.
Vercel environment changes apply to new deployments, not existing snapshots.

## Hosted configuration

All supported names and defaults are in `.env.example`. None are `NEXT_PUBLIC_`.

| Variables                                             | Requirement                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | Required for hosted data; use the provider's TLS-enabled pooled PostgreSQL URL.                                         |
| `AGENTSHELF_DATABASE_URL`                             | Recommended runtime override, with a limited `NOBYPASSRLS` login; owner `DATABASE_URL` remains for explicit migrations. |
| `BETTER_AUTH_SECRET`                                  | Required, random 32+ characters; stable across deployments.                                                             |
| `BETTER_AUTH_URL`                                     | Production origin `https://yulaverse.co.uk`; omit in previews only when origin inference is appropriate.                |
| `AGENTSHELF_ADMIN_EMAILS`                             | Verified email allowlist, comma-separated; no client role escalation.                                                   |
| `RESEND_API_KEY`, `AGENTSHELF_EMAIL_FROM`             | Required for real verification, password reset and notifications; verify the sender's DNS first.                        |
| `AGENTSHELF_ALERT_EMAIL`                              | Optional operations destination; defaults to the studio email.                                                          |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`          | Optional **test** checkout/webhooks. Billing portal must be enabled in the Stripe sandbox.                              |
| `CRON_SECRET`                                         | Optional scheduler; random 24+ characters, matched against Bearer authentication.                                       |
| `AGENTSHELF_*_PENCE`                                  | Optional central integer GBP prices.                                                                                    |
| `AGENTSHELF_VAT_PRESENTATION`                         | Required business decision before taking payment; not a VAT-registration assumption.                                    |
| `AGENTSHELF_AI_ENABLED`                               | Defaults false. Explicitly enable only after keys, model costs and budget approval.                                     |
| `AGENTSHELF_<PROVIDER>_MODEL` and input/output prices | Required for every used AI adapter; see `.env.example`.                                                                 |
| `AGENTSHELF_PERPLEXITY_REQUEST_USD`                   | Additional required search/request fee for the chosen Perplexity model.                                                 |
| Usage/month/cadence settings                          | Optional conservative defaults; increase only after reviewing the spend model.                                          |
| `AGENTSHELF_LOCAL_DB`                                 | Local only; do not deploy this value.                                                                                   |

Configure Preview and Production separately using Vercel's secure environment
settings. Never paste a key into source, a screenshot, a public client variable or
an issue. Do not copy the developer `.env.local` to a deployment.

After connecting PostgreSQL, apply the migration explicitly:

```sh
npm run db:migrate
```

Use a backed-up database and the correct environment. The migration uses an
advisory lock for hosted PostgreSQL, creates only `as_`-prefixed tables and indexes,
and installs tenant policies; it does not drop studio data. Review it before
running against an existing shared database. A limited runtime database role
without `BYPASSRLS` is preferable to using an owner/superuser connection.
The connected Neon owner's role does bypass row policies. The hosted test
environment therefore uses a separate `agentshelf_runtime` login with DML grants
only on the `as_` tables, no superuser/role-creation privileges and no RLS bypass.
`AGENTSHELF_DATABASE_URL` selects it. Tests against this actual role confirmed
cross-tenant reads and writes are blocked, including an unscoped read returning
no records. When adding future tables, grant the runtime role the required DML
permissions explicitly; never give it the owner role or `BYPASSRLS`.

### Protected preview and Stripe

Vercel Deployment Protection remains enabled. Stripe cannot authenticate through
that protection as a customer browser can. The sandbox lifecycle was verified
using Stripe CLI forwarding to a local app connected to Neon, not by claiming the
protected preview can receive public provider events. Preview checkout remains
setup-required until an appropriate deployed webhook transport and its signing
secret are configured. Do not paste the CLI listener secret into Vercel as though
it were a public endpoint's secret. Configure an actual Stripe endpoint on the
eventual accessible deployment, then test delivery before enabling checkout.
The application refuses checkout when `STRIPE_WEBHOOK_SECRET` is absent.

## Commercial delivery workflow

1. A prospective customer submits the service form. The lead is saved before
   delivery is attempted. An acknowledgement and studio notification go into a
   durable outbox; failed email does not delete the enquiry.
2. Review scope, package, competitor websites, pricing and VAT with the customer.
   Optimisation is managed work and never automatically modifies their website.
3. The customer signs up and verifies their email, then adds their business,
   category, offering, aliases and up to three competitor URLs.
4. Use Stripe **test** checkout to validate payment handling. Real charging remains
   disabled in this release and requires a separate authorised production rollout.
5. The customer confirms scope and requests an assessment. An administrator
   reviews the generated queries, branded flags and provider selection before
   running tests. Technical checks can run without an AI key.
6. Process queued work from the admin queue or authenticated scheduler. It fetches
   public pages respectfully and stores observations separately from model output.
7. Review the technical checks, raw provider responses, extraction and limitations.
   Approve the report only after checking it. Approval publishes an immutable
   report snapshot to that customer's organisation and queues a notification.
8. The customer downloads their report and tracks recommended actions. Discuss
   agreed optimisation work separately; suggested changes never overwrite a site
   or catalogue.
9. After a verified active monitoring subscription, the customer can enable the
   schedule. Scheduled reports still pass through administrator review.

## Processing, safety and methodology

- Worker jobs have database leases, duplicate keys, bounded retries and activity
  logs. The hourly Vercel cron schedules due work, processes a bounded job and
  retries email; a customer success URL cannot invoke it.
- Provider attempts are persisted **before** a paid request. An interrupted or
  failed request is not automatically recharged. An administrator must decide
  whether a new assessment is justified.
- Default limits: 30 AI attempts per organisation/month, $0.05 reserved per test,
  $10 global reserved monthly spend. The generated suite has six queries; the
  server accepts at most twelve reviewed queries, two providers and five
  independent repetitions per audit. The admin chooses repetitions explicitly.
  Global reservations are conservative and are not a provider invoice.
- URL/DNS/redirect validation rejects private and internal networks; connections
  are pinned to validated public addresses. Crawl limits, response-size limits,
  robots rules, timeouts and delays are enforced. No logins or bot protection are
  bypassed. JavaScript-only and blocked pages remain explicit missing evidence.
- Technical score: weighted pass=1, warning=0.5, fail=0, excluding unknown checks.
  No accessible pages means no score. Product completeness uses documented core
  fields and is not an AI shopping eligibility score.
- Mention/recommendation metrics are counts over completed, relevant tests with
  a non-low-confidence brand match. Branded and non-branded suites are separate.
  API output is not a consumer-app ranking or market share. Extraction is heuristic
  and source URLs are not labelled verified unless actually checked.
- Evidence-backed changes are evaluated at report approval. Recommendation-drop
  alerts require the same reviewed queries/provider/model/settings and at least
  30 relevant non-branded observations in both periods, plus a 25 percentage-point
  drop. Structured-data regressions and large sampled completeness changes are
  separately labelled website signals, not inferred AI effects. Smaller samples
  do not trigger recommendation alerts.
- No crawled content is executed or treated as system instructions. Provider
  queries are reviewed. Customer data, report downloads and billing are authorised
  server-side with tenant scoping; the database also has row policies.

## Privacy and operations before launch

Confirm the controller's full legal identity, a usable business contact/postal
address where required, VAT wording, provider contracts/transfers and service
terms before onboarding paying customers. The public notice is an implementation,
not legal certification. Authentication cookies are essential; no advertising or
optional analytics cookies were introduced by AgentShelf.

The maintenance job removes unconverted leads after 12 months from last recorded
contact, clears old unsent verification email bodies after 30 days and deletes
expired sessions/rate-limit data. Converted customer records, reports and finance
records require an operator-reviewed retention/deletion process. Customer account
JSON export is available; deletion requests are handled by the studio to account
for legal holds and financial records. Backups and provider copies must be included
in the operational policy; deleting one row is not a complete erasure process.

Inspect the outbox and system logs regularly. Configure managed database backups,
restore tests and provider alerts before launch. Do not log verification links,
passwords, session cookies, database URLs or API keys.

## Verification commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run agentshelf:demo-report
npm run test:agentshelf:e2e
```

The integration tests use an isolated in-memory PostgreSQL engine, real auth and
API code, fixture HTML and signed-event fixtures. They do not run a real paid API
or Stripe checkout; the separately documented sandbox verification does. Browser
tests support Chromium, Firefox and WebKit through
`AGENTSHELF_ALL_BROWSERS=true`, with desktop/mobile screenshots. The authenticated
local browser scenario additionally uses `AGENTSHELF_AUTH_E2E=true` after the
local-only fixture script. See the verification report for actual results and
remaining warnings rather than assuming a command listed here has passed.

## Deferred extensions

- Shopify API OAuth/sync, variant-complete feeds and authorised commerce feeds.
- Agency multi-organisation switching, invitations, SSO/MFA and white-labelling.
- More sophisticated, manually adjudicated extraction and larger query panels.
- Signed stored PDF artefacts, tagged/PDF-UA output and non-Latin font embedding.
- Operator-configurable alert rules, a higher-throughput queue, tenant archive/
  deletion workflows and richer billing/financial reconciliation.
- Live Stripe activation and end-to-end provider validation after authorisation.

Do not advertise the deferred items as included live functionality.
