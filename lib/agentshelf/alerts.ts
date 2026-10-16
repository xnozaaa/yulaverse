import { visibilityMetrics } from "./metrics";
import type { Audit } from "./workflow";
const signature = (a: Audit) =>
  JSON.stringify({
    queries: a.queries
      .filter((q) => q.approved)
      .map((q) => [q.text, q.category, q.branded])
      .sort(),
    conditions: [
      ...new Set(
        a.tests
          .filter((t) => t.status === "completed")
          .map((t) =>
            JSON.stringify([t.provider, t.model, t.locale, t.settings]),
          ),
      ),
    ].sort(),
  });
/** Signals are observations, not attribution of revenue or consumer-app rank. */
export function auditAlerts(before: Audit, after: Audit, brand: string) {
  const changes: string[] = [];
  if (signature(before) === signature(after)) {
    const a = visibilityMetrics(before.tests, brand),
      b = visibilityMetrics(after.tests, brand);
    if (
      a.sampleSize >= 30 &&
      b.sampleSize >= 30 &&
      a.recommendationRate !== null &&
      b.recommendationRate !== null &&
      a.recommendationRate - b.recommendationRate >= 25
    )
      changes.push(
        `Observed recommendation frequency fell from ${a.recommendationRate}% (${a.recommendations}/${a.sampleSize}) to ${b.recommendationRate}% (${b.recommendations}/${b.sampleSize}) in comparable controlled tests. API results vary; review evidence before acting.`,
      );
  }
  if (before.technical?.pages.length && after.technical?.pages.length) {
    const previous = new Map(before.technical.checks.map((c) => [c.key, c]));
    for (const c of after.technical.checks) {
      if (
        c.status === "fail" &&
        previous.get(c.key)?.status === "pass" &&
        c.key.startsWith("jsonld")
      )
        changes.push(
          `Structured data changed from passing to invalid on ${c.url}: ${c.evidence}`,
        );
    }
    const a = before.technical.productCompleteness,
      b = after.technical.productCompleteness;
    if (a !== null && b !== null && Math.abs(a - b) >= 20)
      changes.push(
        `Observed product-schema completeness changed from ${a}% to ${b}% within the bounded crawl. Changes in the sampled pages may affect this comparison.`,
      );
  }
  return changes;
}
