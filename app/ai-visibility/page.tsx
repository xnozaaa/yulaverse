import type { Metadata } from "next";
import Link from "next/link";
import { IntelligenceShell } from "@/components/agentshelf/shell";
import { AuditEnquiryForm } from "@/components/agentshelf/enquiry-form";
import { packages, gbp, vatNote } from "@/lib/agentshelf/config";
import { dbConfigured } from "@/lib/agentshelf/db";
export const metadata: Metadata = {
  title: "AI Visibility & Commerce Intelligence",
  description:
    "Understand how AI systems discover and represent your business. Evidence-led website audits, controlled model tests and AgentShelf monitoring from Yulaverse Intelligence.",
  alternates: { canonical: "/ai-visibility" },
  openGraph: {
    title: "Get discovered by AI · Yulaverse Intelligence",
    description:
      "Evidence-led AI visibility audits, competitor benchmarking and AgentShelf monitoring.",
    url: "/ai-visibility",
  },
};
export const dynamic = "force-dynamic";
const features = [
  [
    "Recommendation monitoring",
    "Inspect mentions and recommendations in clearly labelled, controlled model API tests.",
  ],
  [
    "Competitor benchmarking",
    "Compare equivalent website signals and separately review observed AI response evidence.",
  ],
  [
    "Website & product information",
    "Find gaps in service descriptions, product attributes and information clarity.",
  ],
  [
    "Structured data analysis",
    "Check JSON-LD and discoverability signals, with evidence for each finding.",
  ],
  [
    "Product feed review",
    "Import a product CSV, inspect missing fields and export proposed changes.",
  ],
  [
    "Visibility trends",
    "Follow comparable assessment periods with sample sizes and limitations.",
  ],
  [
    "Prioritised actions",
    "Understand what to fix, why it matters and the evidence supporting each action.",
  ],
  [
    "Reviewed reporting",
    "Download professional reports approved by a Yulaverse administrator.",
  ],
];
const faq = [
  [
    "What is AI visibility?",
    "It describes how clearly a business can be discovered and represented by AI systems. AgentShelf separates factual website checks from observed model API responses.",
  ],
  [
    "Is this different from SEO?",
    "There is overlap in clear content, accessibility, internal links and structured data. AI recommendation testing adds controlled observations; it does not replace SEO.",
  ],
  [
    "Can you guarantee ChatGPT recommends my business?",
    "No. No audit, schema or content change can guarantee a recommendation, ranking, traffic or sales outcome.",
  ],
  [
    "Which AI platforms can you test?",
    "Adapters support authorised OpenAI, Gemini, Anthropic and Perplexity APIs when credentials, models and budgets are configured. An API answer is not the same as a consumer app or its shopping interface.",
  ],
  [
    "How are visibility scores calculated?",
    "We show mention and recommendation rates with sample sizes, separating branded and non-branded queries. Technical discoverability uses a published weighted rubric. No score is invented before tests run.",
  ],
  [
    "Do I need to give you access to my website?",
    "The initial audit uses bounded public website requests and optional product CSVs. Implementation access is agreed separately for managed optimisation.",
  ],
  [
    "Can you optimise my Shopify store?",
    "We can review Shopify product CSVs and recommend product-data and content improvements. Direct Shopify API editing is a future integration; managed changes require an agreed scope.",
  ],
  [
    "How often are results updated?",
    "One-off assessments record a dated snapshot. Configured monitoring runs approximately monthly using an approved test suite, active subscription and available provider budgets.",
  ],
  [
    "Can I cancel monthly monitoring?",
    "Yes. Configured Stripe customers can manage cancellation in the hosted billing portal. Access follows verified subscription status and the paid-through period.",
  ],
  [
    "What information do you collect?",
    "We collect contact and business details, public website evidence, supplied product data, audit results and subscription references. We do not handle payment-card details. See the privacy notice for retention and your rights.",
  ],
];
export default function AiVisibility() {
  const prices = packages();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI Visibility and Commerce Intelligence",
    provider: {
      "@type": "Organization",
      name: "Yulaverse Intelligence",
      url: "https://yulaverse.co.uk",
    },
    url: "https://yulaverse.co.uk/ai-visibility",
    areaServed: "GB",
    offers: prices.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.pence / 100,
      priceCurrency: "GBP",
      description: p.recurring
        ? "Monthly monitoring subscription"
        : "One-off managed service",
    })),
  };
  return (
    <IntelligenceShell>
      <main id="main-content">
        <section className="as-container as-hero">
          <div>
            <p className="as-eyebrow">
              Yulaverse Intelligence / Introducing AgentShelf
            </p>
            <h1>
              Don’t just get found on Google.
              <br />
              <em>Get discovered by AI.</em>
            </h1>
            <p className="as-muted">
              Discover how AI assistants understand and recommend your business.
              Monitor your visibility, compare competitors and identify
              opportunities to improve your digital presence.
            </p>
            <div className="as-actions">
              <a className="as-button" href="#request">
                Audit My Website ↗
              </a>
              <Link
                className="as-button as-button-secondary"
                href="/agentshelf/demo"
              >
                Explore AgentShelf
              </Link>
            </div>
            <p className="as-note">
              Verifiable evidence. Transparent methodology. No ranking
              guarantees.
            </p>
          </div>
          <div
            className="as-orbit"
            aria-label="AgentShelf brings website evidence, AI observations and business intelligence together"
          >
            <div className="as-orbit-core">
              <span>YOUR DISCOVERY INTELLIGENCE</span>
              <strong>AgentShelf</strong>
              <span>MEASURE / UNDERSTAND / IMPROVE</span>
            </div>
            <span className="as-orbit-label">Website evidence ↗</span>
            <span className="as-orbit-label">Controlled AI observations</span>
            <span className="as-orbit-label">A clearer path forward</span>
          </div>
        </section>
        <section className="as-container as-section">
          <div className="as-section-heading">
            <div>
              <p className="as-eyebrow">01 / A changing discovery landscape</p>
              <h2>
                Your next customer
                <br />
                may ask <em>an assistant.</em>
              </h2>
            </div>
            <p>
              Search engines help people find websites. AI assistants can also
              answer questions, compare options and suggest products or
              services. AgentShelf helps you inspect how your business
              information is understood, with a clear distinction between
              website evidence and controlled model observations.
            </p>
          </div>
          <div className="as-grid">
            <article className="as-card">
              <h3>Be understood.</h3>
              <p>
                Make your offering, product details and service coverage clear
                and accessible.
              </p>
            </article>
            <article className="as-card">
              <h3>See the evidence.</h3>
              <p>
                Inspect dated findings, test queries and raw responses rather
                than a mysterious score.
              </p>
            </article>
            <article className="as-card">
              <h3>Improve with intent.</h3>
              <p>
                Prioritise useful changes, then measure again with a comparable
                methodology.
              </p>
            </article>
          </div>
        </section>
        <section className="as-container as-section">
          <p className="as-eyebrow">02 / How it works</p>
          <h2>
            From uncertainty
            <br />
            to <em>informed action.</em>
          </h2>
          <div className="as-grid as-grid-four" style={{ marginTop: 40 }}>
            {[
              [
                "01",
                "Enter your website",
                "Tell us about your business, audience and competitors.",
              ],
              [
                "02",
                "Assess your presence",
                "Analyse public information and run supported, approved discovery tests.",
              ],
              [
                "03",
                "Review your report",
                "See the evidence, limitations and highest-priority actions.",
              ],
              [
                "04",
                "Improve & monitor",
                "Agree improvements and track meaningful changes over time.",
              ],
            ].map(([n, t, d]) => (
              <article key={n} className="as-card">
                <span className="as-step">{n} / THE PROCESS</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="as-container as-section">
          <div className="as-section-heading">
            <div>
              <p className="as-eyebrow">03 / Intelligence with substance</p>
              <h2>
                More than
                <br />
                <em>another score.</em>
              </h2>
            </div>
            <p>
              Built for UK retailers, Shopify merchants, product brands, local
              services and agencies. Criteria adapt to the business: local
              service discovery and AI product shopping are assessed separately.
            </p>
          </div>
          <div className="as-grid">
            {features.map(([title, text]) => (
              <article className="as-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="pricing" className="as-container as-section as-pricing">
          <p className="as-eyebrow">04 / Choose your starting point</p>
          <h2>
            A clearer view.
            <br />
            <em>A practical next step.</em>
          </h2>
          <div className="as-grid" style={{ marginTop: 40 }}>
            {prices.map((p) => (
              <article className="as-card" key={p.id}>
                <span className="as-pill">
                  {p.recurring ? "Ongoing intelligence" : "Managed service"}
                </span>
                <h3 style={{ marginTop: 22 }}>{p.name}</h3>
                <div className="as-price">
                  {gbp(p.pence)}{" "}
                  <span>{p.recurring ? "/ month" : "one-off"}</span>
                </div>
                <p>{p.description}</p>
                <ul>
                  {(p.id === "audit"
                    ? [
                        "Website & information assessment",
                        "Supported controlled tests",
                        "Competitor comparison",
                        "Reviewed PDF action plan",
                      ]
                    : p.id === "optimisation"
                      ? [
                          "Detailed visibility audit",
                          "Agreed implementation scope",
                          "Structured data & content review",
                          "Follow-up measurement",
                        ]
                      : [
                          "Customer dashboard",
                          "Approved scheduled test suite",
                          "Historical reports & trends",
                          "Subscription management",
                        ]
                  ).map((x) => (
                    <li key={x}>✓ {x}</li>
                  ))}
                </ul>
                <a className="as-button as-button-secondary" href="#request">
                  {p.id === "monitoring"
                    ? "Enquire about monitoring"
                    : "Request this package"}{" "}
                  ↗
                </a>
                <p className="as-note">{vatNote()}</p>
              </article>
            ))}
          </div>
          <p className="as-note">
            Optimisation is a managed service. Purchase does not automatically
            edit your website. Monitoring requires connected providers and an
            approved testing scope.
          </p>
        </section>
        <section className="as-container as-section">
          <p className="as-eyebrow">05 / Questions, answered</p>
          <h2>
            Clarity comes <em>first.</em>
          </h2>
          <div className="as-faq" style={{ marginTop: 30 }}>
            {faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="request" className="as-container as-section">
          <div className="as-section-heading">
            <div>
              <p className="as-eyebrow">06 / Your next chapter</p>
              <h2>
                Understand where
                <br />
                <em>you stand.</em>
              </h2>
            </div>
            <p>
              Tell us about your business. We’ll confirm the assessment scope,
              explain what can be measured and recommend the right next step.
            </p>
          </div>
          <AuditEnquiryForm options={prices} enabled={dbConfigured()} />
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </IntelligenceShell>
  );
}
