import type { ReportSnapshot } from "./report";
import type { TestResult } from "./intelligence";
const website = {
  name: "Northstar Travel Goods (fictional)",
  url: "https://northstar.example",
  category: "ecommerce" as const,
  offering: "lightweight cabin luggage",
  location: "United Kingdom",
  aliases: ["Northstar Travel Goods"],
  competitors: ["https://wayfarer.example", "https://atlas.example"],
};
const tests: TestResult[] = Array.from({ length: 50 }, (_, i) => ({
  query: {
    id: `demo-${i}`,
    text: "SIMULATED QUERY: Compare lightweight cabin luggage under £100 in the UK.",
    category: "category",
    branded: false,
    approved: true,
  },
  provider: "openai",
  model: "SIMULATED - no model request made",
  timestamp: "2026-10-16T09:00:00.000Z",
  locale: "en-GB",
  settings: { search: false, maxOutputTokens: 600 },
  status: "completed",
  response:
    "SIMULATED DEMONSTRATION. This is fictional evidence, not a real AI recommendation.",
  citations: [],
  mentions: [
    {
      brand: website.name,
      mentioned: i < 24,
      recommended: i < 16,
      confidence: "medium",
      evidence: "SIMULATED fictional example",
    },
    {
      brand: "Wayfarer (fictional)",
      mentioned: i < 32,
      recommended: i < 22,
      confidence: "medium",
      evidence: "SIMULATED fictional example",
    },
    {
      brand: "Atlas (fictional)",
      mentioned: i < 29,
      recommended: i < 18,
      confidence: "medium",
      evidence: "SIMULATED fictional example",
    },
  ],
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
}));
export const demoSnapshot: ReportSnapshot = {
  simulated: true,
  business: website,
  approvedAt: "2026-10-16T09:00:00.000Z",
  audit: {
    websiteId: "demo",
    status: "approved",
    queries: tests.slice(0, 6).map((t) => t.query),
    providers: [],
    tests,
    scopeApproved: true,
    technical: {
      url: website.url,
      category: website.category,
      startedAt: "2026-10-16T09:00:00.000Z",
      finishedAt: "2026-10-16T09:00:00.000Z",
      technicalScore: 68,
      productCompleteness: 72,
      pages: [],
      checks: [
        {
          key: "demo-attributes",
          label: "Product information",
          status: "warning",
          evidence:
            "SIMULATED: material and size information is missing from some fictional products.",
          url: website.url,
          weight: 1,
        },
      ],
      limitations: [
        "SIMULATED DEMONSTRATION ONLY. No website was crawled, no payment was taken and no model API was called.",
      ],
    },
    competitors: [
      {
        name: "Wayfarer (fictional)",
        url: "https://wayfarer.example",
        technical: {
          url: "https://wayfarer.example",
          category: "ecommerce",
          startedAt: "2026-10-16T09:00:00.000Z",
          finishedAt: "2026-10-16T09:00:00.000Z",
          technicalScore: 75,
          productCompleteness: 81,
          pages: [],
          checks: [],
          limitations: [
            "SIMULATED comparison only. No competitor website was fetched.",
          ],
        },
      },
      {
        name: "Atlas (fictional)",
        url: "https://atlas.example",
        technical: {
          url: "https://atlas.example",
          category: "ecommerce",
          startedAt: "2026-10-16T09:00:00.000Z",
          finishedAt: "2026-10-16T09:00:00.000Z",
          technicalScore: 61,
          productCompleteness: 67,
          pages: [],
          checks: [],
          limitations: [
            "SIMULATED comparison only. No competitor website was fetched.",
          ],
        },
      },
    ],
  },
  recommendations: [
    {
      auditId: "demo",
      priority: "high",
      title: "Add product dimensions and materials",
      evidence:
        "SIMULATED: 8 of 20 fictional catalogue rows have missing attributes.",
      why: "Complete information makes product differences easier to understand.",
      fix: "Add verified dimensions and materials to the product catalogue and structured data.",
      effort: "Content review",
      confidence: "Simulated demonstration",
      status: "open",
    },
    {
      auditId: "demo",
      priority: "medium",
      title: "Clarify shipping and returns",
      evidence:
        "SIMULATED: Shipping details are inconsistent on two example pages.",
      why: "Clear commercial information helps customers make informed decisions.",
      fix: "Review and align the published shipping and return policies.",
      effort: "One content session",
      confidence: "Simulated demonstration",
      status: "open",
    },
  ],
};
