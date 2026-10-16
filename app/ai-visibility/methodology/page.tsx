import { IntelligenceShell } from "@/components/agentshelf/shell";
export const metadata = {
  title: "AgentShelf methodology & limitations",
  description:
    "How AgentShelf performs respectful website checks, controlled model API observations and transparent visibility calculations.",
  alternates: { canonical: "/ai-visibility/methodology" },
};
export default function Methodology() {
  return (
    <IntelligenceShell>
      <main id="main-content" className="as-container as-section as-prose">
        <p className="as-eyebrow">Yulaverse Intelligence / Methodology v1</p>
        <h1>
          Evidence you
          <br />
          can <em>inspect.</em>
        </h1>
        <h2>Website assessment</h2>
        <p>
          AgentShelf requests robots.txt first and respects AgentShelfBot access
          rules. Unknown access status stops the crawl conservatively. An
          initial assessment covers up to five pages on your site and three per
          competitor, with sequential requests, public-address validation,
          redirect limits, timeouts and response-size limits. JavaScript-only
          information may not be visible. We do not bypass bot protection or
          sign in to private websites.
        </p>
        <h2>Technical discoverability rubric</h2>
        <p>
          Each observed check has a visible weight: HTTPS, page HTTP failures,
          organisation schema, product schema and invalid JSON-LD receive weight
          2 where applicable. Other assessed checks receive weight 1. Pass
          contributes 1, warning 0.5 and fail 0, multiplied by weight. Unknown
          checks are excluded. The result is expressed out of 100 and is a
          proprietary website rubric, not a search-engine score or AI ranking. A
          limited crawl can miss products or information.
        </p>
        <h2>Product information completeness</h2>
        <p>
          For page schema, completeness checks six fields: name, description,
          brand, SKU, image and offers. CSV completeness uses title,
          description, price, currency, availability and image. These different
          rubrics are labelled separately; field presence does not establish
          accuracy. GTIN values are validated where supplied, never invented.
          Additional attributes, shipping and return information are recommended
          according to applicability.
        </p>
        <h2>Controlled model observations</h2>
        <p>
          Queries are reviewed before use and labelled by category and whether
          they contain the customer’s brand. Every result records the actual
          provider, model, time, locale, search setting and response. Some
          providers operate without web search. Model API answers are not
          equivalent to consumer app experiences, personalisation or shopping
          interfaces.
        </p>
        <h2>Mentions and recommendations</h2>
        <p>
          Mention rate is the proportion of completed relevant tests with a
          matched brand or alias. Recommendation rate requires a positive
          recommendation context with no detected nearby negation. Extraction is
          heuristic, imperfect and accompanied by confidence and supporting
          text. Low-confidence extractions are excluded. Branded and non-branded
          denominators are separate. The dashboard shows counts and sample
          sizes. No composite AI Visibility Score or market-share claim is
          presented.
        </p>
        <h2>Variability, citations and cost</h2>
        <p>
          LLM outputs vary. Small samples are directional; comparisons need
          comparable queries, models, locales and periods. Provider-supplied
          citations are labelled and are not represented as independently
          visited sources. Calls require explicit credentials, model selection
          and cost settings. Budgets reserve conservative token estimates, limit
          per-organisation call counts and cap global reserved spend. No
          automatic paid retry follows an uncertain timeout.
        </p>
        <h2>Alerts and review</h2>
        <p>
          Recommendation-frequency alerts require at least 30 completed
          comparable tests in both periods and a change of at least 25
          percentage points. Technical changes are based on observed repeated
          evidence. Monthly reports require administrator review before
          delivery. No placement, recommendation, ranking, traffic or revenue
          improvement is guaranteed.
        </p>
      </main>
    </IntelligenceShell>
  );
}
