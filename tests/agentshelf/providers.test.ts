import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "../../lib/agentshelf/db";
import {
  runProvider,
  type Provider,
  type TestQuery,
} from "../../lib/agentshelf/intelligence";
const query: TestQuery = {
  id: "fixture",
  text: "Recommend a useful travel goods brand in the UK.",
  category: "category",
  branded: false,
  approved: true,
};
beforeAll(async () => {
  vi.stubEnv("AGENTSHELF_DATABASE_URL", "");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("AGENTSHELF_LOCAL_DB", "memory://");
  await (await getDb()).migrate();
});
beforeEach(() => {
  vi.stubEnv("AGENTSHELF_AI_ENABLED", "true");
  vi.stubEnv("AGENTSHELF_MAX_GLOBAL_USD_MONTH", "100");
  vi.stubEnv("AGENTSHELF_MAX_TEST_USD", "0.05");
  vi.stubEnv("AGENTSHELF_MAX_TESTS_PER_ORG_MONTH", "100");
  for (const p of ["OPENAI", "GEMINI", "ANTHROPIC", "PERPLEXITY"]) {
    vi.stubEnv(`${p}_API_KEY`, "fixture-not-a-real-key");
    vi.stubEnv(`AGENTSHELF_${p}_MODEL`, "fixture-model");
    vi.stubEnv(`AGENTSHELF_${p}_INPUT_USD_PER_MILLION`, "2");
    vi.stubEnv(`AGENTSHELF_${p}_OUTPUT_USD_PER_MILLION`, "10");
  }
  vi.stubEnv("AGENTSHELF_PERPLEXITY_REQUEST_USD", "0.005");
});
describe("Controlled provider adapters with mocked transport, no paid requests", () => {
  it.each<Provider>(["openai", "gemini", "anthropic", "perplexity"])(
    "stores real-format %s response, settings, evidence and usage",
    async (provider) => {
      const text =
        "Northstar is an excellent choice. I recommend Northstar for travel goods.";
      const payload =
        provider === "openai"
          ? {
              output: [
                {
                  content: [
                    {
                      type: "output_text",
                      text,
                      annotations: [{ url: "https://example.com/source" }],
                    },
                  ],
                },
              ],
              usage: { input_tokens: 100, output_tokens: 50 },
            }
          : provider === "gemini"
            ? {
                candidates: [{ content: { parts: [{ text }] } }],
                usageMetadata: {
                  promptTokenCount: 100,
                  candidatesTokenCount: 50,
                },
              }
            : provider === "anthropic"
              ? {
                  content: [{ type: "text", text }],
                  usage: { input_tokens: 100, output_tokens: 50 },
                }
              : {
                  choices: [{ message: { content: text } }],
                  citations: ["https://example.com/source"],
                  usage: { prompt_tokens: 100, completion_tokens: 50 },
                };
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(payload));
      const result = await runProvider(
        provider,
        query,
        [{ name: "Northstar" }],
        `org-${provider}`,
        transport,
      );
      expect(result.status).toBe("completed");
      expect(result.model).toBe("fixture-model");
      expect(result.mentions[0].recommended).toBe(true);
      expect(result.inputTokens).toBe(100);
      expect(result.locale).toBe("en-GB");
      expect(result.settings.search).toBe(provider === "perplexity");
      expect(result.estimatedCostUsd).toBeCloseTo(
        0.0007 + (provider === "perplexity" ? 0.005 : 0),
      );
      expect(transport).toHaveBeenCalledTimes(1);
      expect(result.citations.every((c) => c.verified === false)).toBe(true);
      const request = JSON.parse(String(transport.mock.calls[0][1]?.body));
      if (provider === "gemini")
        expect(String(transport.mock.calls[0][0])).toContain(
          "/models/fixture-model:generateContent",
        );
      else expect(request.model).toBe("fixture-model");
    },
  );
  it("does not automatically retry an uncertain paid request", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("fixture timeout"));
    const r = await runProvider("openai", query, [], "org-timeout", transport);
    expect(r.status).toBe("failed");
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("refuses missing token prices and request fees", async () => {
    const transport = vi.fn<typeof fetch>();
    vi.stubEnv("AGENTSHELF_OPENAI_INPUT_USD_PER_MILLION", "");
    expect(
      (await runProvider("openai", query, [], "org-missing", transport)).status,
    ).toBe("setup-required");
    vi.stubEnv("AGENTSHELF_PERPLEXITY_REQUEST_USD", "");
    expect(
      (await runProvider("perplexity", query, [], "org-missing", transport))
        .status,
    ).toBe("setup-required");
    expect(transport).not.toHaveBeenCalled();
  });
  it("refuses invalid budgets or an excessive reserved request", async () => {
    const transport = vi.fn<typeof fetch>();
    vi.stubEnv("AGENTSHELF_MAX_GLOBAL_USD_MONTH", "NaN");
    expect(
      (await runProvider("openai", query, [], "org-budget", transport)).status,
    ).toBe("setup-required");
    vi.stubEnv("AGENTSHELF_MAX_GLOBAL_USD_MONTH", "100");
    vi.stubEnv("AGENTSHELF_MAX_TEST_USD", "0.001");
    expect(
      (await runProvider("openai", query, [], "org-budget", transport)).error,
    ).toMatch(/per-test budget/);
    expect(transport).not.toHaveBeenCalled();
  });
  it("stops at the per-organisation attempt limit", async () => {
    vi.stubEnv("AGENTSHELF_MAX_TESTS_PER_ORG_MONTH", "1");
    const transport = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        output: [{ content: [{ text: "Other businesses exist." }] }],
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    );
    await runProvider("openai", query, [], "org-one-attempt", transport);
    expect(
      (await runProvider("openai", query, [], "org-one-attempt", transport))
        .error,
    ).toMatch(/exhausted/);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
