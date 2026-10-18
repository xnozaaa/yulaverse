import { IntelligenceShell } from "@/components/agentshelf/shell";
export const metadata = {
  title: "AgentShelf privacy & cookies",
  alternates: { canonical: "/ai-visibility/privacy" },
};
export default function Privacy() {
  return (
    <IntelligenceShell>
      <main id="main-content" className="as-container as-section as-prose">
        <p className="as-eyebrow">Privacy notice / 16 October 2026</p>
        <h1>
          Your business.
          <br />
          <em>Your information.</em>
        </h1>
        <h2>Who handles your information</h2>
        <p>
          Yulaverse Studio operates Yulaverse Intelligence and AgentShelf.
          Contact yulaversestudio@gmail.com for privacy questions, corrections,
          access, export or deletion requests. The legal controller identity and
          a suitable contact address must be confirmed before live customer
          onboarding is enabled.
        </p>
        <h2>What we use and why</h2>
        <p>
          We use business/contact details to respond to enquiries and take steps
          towards an agreement; account and assessment information to provide
          the contracted service; limited operational/security records for
          legitimate interests in preventing abuse and protecting the platform;
          and payment references where legally required. Marketing requires
          separate consent and is not enabled by the enquiry form.
        </p>
        <p>
          Assessments store public page metadata, bounded content extracts,
          supplied product attributes, controlled model responses and
          recommendations. Do not upload sensitive personal data, passwords or
          payment-card information. Stripe hosts card collection; the platform
          stores payment and subscription references only.
        </p>
        <h2>Service providers</h2>
        <p>
          Hosting uses Vercel. Configured storage uses PostgreSQL; email can use
          Resend; payments use Stripe. Only selected AI providers receive the
          approved customer-intent query, not account passwords, private
          enquiries or uploaded catalogues. API providers, models and results
          are recorded. Actual providers and international transfer safeguards
          must be reviewed when services are connected. A connection does not
          itself establish legal compliance.
        </p>
        <h2>Retention and deletion</h2>
        <p>
          Unconverted enquiries are scheduled for review/deletion 12 months
          after last contact. Customer audit evidence and reports are retained
          while the service is active and for up to 12 months after closure
          unless an agreed shorter period applies. Email delivery bodies are
          cleared after sending; failed deliveries are kept for retry and
          reviewed within 30 days. Financial records required by law may need
          longer retention; they are restricted from ordinary product analytics.
          Contact the studio to close an account or request erasure. Identity
          may need verification first.
        </p>
        <h2>Your rights</h2>
        <p>
          You can request access, correction, erasure, restriction, portability
          and object to relevant processing. You may complain to the UK
          Information Commissioner’s Office at ico.org.uk. Some rights depend on
          the lawful basis and whether records must be retained by law.
        </p>
        <h2>Cookies and analytics</h2>
        <p>
          AgentShelf uses strictly necessary, HttpOnly authentication/session
          cookies and anti-abuse controls to provide requested account
          functions. No advertising or non-essential analytics cookies are added
          by AgentShelf. The platform records first-party
          enquiry/checkout/payment events as operational records. No marketing
          consent is inferred. Any future non-essential tracking must remain off
          until appropriate consent is obtained.
        </p>
        <h2>Demonstration data</h2>
        <p>
          The public demonstration uses clearly labelled fictional records and
          simulated metrics, separate from customer records. No demo payment is
          real and no API recommendation is represented as live.
        </p>
      </main>
    </IntelligenceShell>
  );
}
