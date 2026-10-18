# AgentShelf running-cost model

Planning assumptions, checked 16 October 2026. This is not a supplier quote or a
forecast of customer acquisition. Product prices stay in GBP. Suppliers below
publish USD rates; the GBP table uses an explicit **budgeting assumption of
$1 = £0.80**, not a claimed current exchange rate. Tax, card fees, staff, backups,
support, acquisition and managed optimisation work are excluded.

## Evidence for unit prices

- [Vercel pricing](https://vercel.com/pricing): Pro starts at $20/month and includes
  $20 of usage credit. Yulaverse already has Pro, so an additional application does
  not necessarily add another base subscription; other projects share usage.
- [Neon pricing](https://neon.com/pricing): Launch compute $0.106/CU-hour and storage
  $0.35/GB-month. Free allowances can help development, but are not assumed to
  guarantee production capacity or a backup/availability commitment.
- [Resend pricing](https://resend.com/pricing): Free 3,000 emails/month, limited to
  100/day; Pro $20/month for 50,000/month. Stagger monthly notifications and include
  verification/password-reset traffic when counting usage.
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing): an example
  standard short-context `gpt-6.1-sol` request is $2/million input tokens and
  $10/million output tokens. It is an illustrative configurable model, not a claim
  that Yulaverse has access or a preselected live integration. Regional processing
  can add fees. Search tools and other providers have different prices.

## Explicit workload

For each customer/month: one website, one technical crawl (up to five business
pages and three pages for each of up to three competitors), six reviewed queries,
one provider and one response per query, 500 input and 300 output tokens/request.
Output is capped at 600 tokens. No search tool or extra request fee in this example.

AI cost per customer = `6 × (500 × $2 + 300 × $10) / 1,000,000 = $0.024`.
This small panel is **directional**, not strong statistical evidence. Increase
sample sizes explicitly before offering claims about meaningful trends.

For a conservative infrastructure illustration, assume:

- A dedicated Vercel Pro base ($20), even though it is already shared by Yulaverse.
  Function/CDN use stays inside its available credit for this low-traffic example;
  add a £5/£10/£20 contingency below, not an invented unit rate.
- Neon Launch at 50/100/200 CU-hours and 1/2/5 GB for 10/50/100 customers. Actual
  compute awake-time and dashboard traffic, not the customer count alone, determine
  the bill. Continuous polling can prevent scale-to-zero.
- Resend Free, assuming all app emails stay under both daily and monthly limits.

| Monitoring customers | Example AI/month | Example Neon/month | Vercel base | Usage contingency | Illustrative total/month |
| -------------------- | ---------------: | -----------------: | ----------: | ----------------: | -----------------------: |
| 10                   |    £0.19 ($0.24) |      £4.52 ($5.65) |         £16 |                £5 |               **£25.71** |
| 50                   |    £0.96 ($1.20) |     £9.04 ($11.30) |         £16 |               £10 |               **£36.00** |
| 100                  |    £1.92 ($2.40) |    £18.36 ($22.95) |         £16 |               £20 |               **£56.28** |

These are computed examples, not guaranteed bills. If the existing Vercel base is
already funded and credit remains, incremental cost can be lower. Resend Pro would
add £16 at this assumed FX. Traffic, model choice, larger suites, concurrent jobs,
storage growth, backup retention and search-enabled providers can raise costs.

## Higher-evidence scenario and safeguards

Thirty responses/customer/month with the same token assumptions cost $0.12 per
customer: $1.20/$6/$12 (£0.96/£4.80/£9.60) for 10/50/100 customers. This needs a
larger approved/repeated test scope; do not imply that the default six-query panel
already runs 30 tests. Repeated tests improve the evidence base but do not establish
consumer-app ranking or predict traffic/revenue.

The default global reserved budget is **$10**, so the 100-customer/30-response
scenario needs an explicitly reviewed increase. Reservations use a conservative
input bound and maximum output, not just the expected mean above; they can stop
execution before the nominal expected cost. Organisation limits also include
manual reruns and additional providers. Requests stopped by a budget become
setup/limited evidence, never synthetic results.

Operationally, human review and optimisation effort are likely to be much more
material than these low-volume token costs. Price the £299/£799 services around
actual delivery effort and scope; do not treat infrastructure margin as profit.
