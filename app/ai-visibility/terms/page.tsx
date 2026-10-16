import { IntelligenceShell } from "@/components/agentshelf/shell";
export const metadata = {
  title: "AgentShelf service terms",
  alternates: { canonical: "/ai-visibility/terms" },
};
export default function Terms() {
  return (
    <IntelligenceShell>
      <main id="main-content" className="as-container as-section as-prose">
        <p className="as-eyebrow">Yulaverse Intelligence / Service scope</p>
        <h1>
          Clear scope.
          <br />
          <em>Considered work.</em>
        </h1>
        <h2>Before work begins</h2>
        <p>
          Enquiries are not a contract or a payment. Yulaverse confirms
          deliverables, the business-to-business scope, applicable VAT
          treatment, timings, fees and cancellation arrangements before
          accepting managed work. No live payment collection is enabled in the
          initial release.
        </p>
        <h2>Assessments and optimisation</h2>
        <p>
          Audits use bounded public website evidence and supported model APIs.
          Results describe observed signals at a particular time and carry
          explicit limitations. Optimisation is a managed service; it does not
          automatically change your website. You must be authorised to request
          work for the relevant business and supply accurate information.
        </p>
        <h2>No outcome guarantee</h2>
        <p>
          AI systems and search engines operate independently. No
          recommendation, ranking, shopping placement, traffic, sales or revenue
          outcome is guaranteed. API responses are not represented as consumer
          app rankings.
        </p>
        <h2>Monitoring and cancellation</h2>
        <p>
          Monitoring depends on an active verified subscription and configured
          test budgets. Future live subscriptions must clearly confirm billing
          frequency and cancellation terms before purchase. The hosted billing
          portal supports cancellation; access follows the verified paid-through
          period.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about scope, complaints or service access:
          yulaversestudio@gmail.com.
        </p>
      </main>
    </IntelligenceShell>
  );
}
