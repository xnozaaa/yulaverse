import type { TestResult } from "./intelligence";
export function visibilityMetrics(
  tests: TestResult[],
  brand: string,
  branded = false,
) {
  const completed = tests.filter(
    (t) =>
      t.status === "completed" &&
      t.query.branded === branded &&
      t.mentions.some((m) => m.brand === brand && m.confidence !== "low"),
  );
  const mentions = completed.filter((t) =>
    t.mentions.some((m) => m.brand === brand && m.mentioned),
  ).length;
  const recommendations = completed.filter((t) =>
    t.mentions.some((m) => m.brand === brand && m.recommended),
  ).length;
  return {
    sampleSize: completed.length,
    mentions,
    recommendations,
    mentionRate: completed.length
      ? Math.round((100 * mentions) / completed.length)
      : null,
    recommendationRate: completed.length
      ? Math.round((100 * recommendations) / completed.length)
      : null,
    branded,
    failed: tests.filter((t) => t.status !== "completed").length,
    source:
      "Controlled model API tests; not consumer-app ranking or market share.",
    confidence:
      "Heuristic extraction; inspect response evidence. Small samples are directional only.",
  };
}
