import { describe, expect, it } from "vitest";
import { auditAlerts } from "../../lib/agentshelf/alerts";
import { demoSnapshot } from "../../lib/agentshelf/demo";
describe("Noise-aware change alerts", () => {
  it("requires comparable suites and at least thirty observations per period", () => {
    const a = structuredClone(demoSnapshot.audit),
      b = structuredClone(a);
    b.tests = b.tests.map((t) => ({
      ...t,
      mentions: t.mentions.map((m) => ({ ...m, recommended: false })),
    }));
    expect(auditAlerts(a, b, demoSnapshot.business.name)).toHaveLength(1);
    b.tests = b.tests.slice(0, 1);
    expect(auditAlerts(a, b, demoSnapshot.business.name)).toHaveLength(0);
  });
  it("does not compare changed provider/model settings", () => {
    const a = structuredClone(demoSnapshot.audit),
      b = structuredClone(a);
    b.tests = b.tests.map((t) => ({
      ...t,
      model: "different-fixture-model",
      mentions: t.mentions.map((m) => ({ ...m, recommended: false })),
    }));
    expect(auditAlerts(a, b, demoSnapshot.business.name)).toHaveLength(0);
  });
});
