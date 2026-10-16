import { z } from "zod";

export const packageIds = ["audit", "optimisation", "monitoring"] as const;
export type PackageId = (typeof packageIds)[number];
const price = (key: string, fallback: number) => {
  const value = Number(process.env[key] || fallback);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};
export function packages() {
  return [
    {
      id: "audit" as const,
      name: "AI Visibility Audit",
      pence: price("AGENTSHELF_AUDIT_PENCE", 29900),
      recurring: false,
      description:
        "An evidence-led assessment, competitor comparison and reviewed PDF action plan.",
    },
    {
      id: "optimisation" as const,
      name: "AI Visibility Optimisation",
      pence: price("AGENTSHELF_OPTIMISATION_PENCE", 79900),
      recurring: false,
      description:
        "A detailed audit plus agreed, managed technical and content improvement work.",
    },
    {
      id: "monitoring" as const,
      name: "AgentShelf Monitoring",
      pence: price("AGENTSHELF_MONITORING_PENCE", 9900),
      recurring: true,
      description:
        "Scheduled assessments, controlled recommendation tests and historical reporting.",
    },
  ];
}
export const gbp = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(pence / 100);
export const vatNote = () =>
  process.env.AGENTSHELF_VAT_PRESENTATION ||
  "VAT treatment will be confirmed before payment.";
export const appUrl = () =>
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3001");
export const categories = [
  "ecommerce",
  "local-services",
  "professional-services",
  "retail",
  "manufacturer",
  "hospitality",
  "other",
] as const;
export const websiteInput = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().url().max(2048),
  category: z.enum(categories),
  offering: z.string().trim().min(3).max(500),
  location: z.string().trim().max(120).default("United Kingdom"),
  aliases: z.array(z.string().trim().min(2).max(100)).max(5).default([]),
  competitors: z.array(z.string().url().max(2048)).max(3).default([]),
});
export const enquiryInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  website: z.string().url().max(2048),
  contactName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  industry: z.string().trim().min(2).max(100),
  businessType: z.enum(["products", "services", "both"]),
  competitors: z.array(z.string().url()).max(3).default([]),
  package: z.enum(packageIds),
  notes: z.string().trim().max(3000).default(""),
  consent: z.literal(true),
  companyFax: z.string().max(100).default(""),
});

export function integrationStatus() {
  return {
    database: Boolean(process.env.DATABASE_URL),
    authentication: Boolean(process.env.BETTER_AUTH_SECRET),
    email: Boolean(
      process.env.RESEND_API_KEY && process.env.AGENTSHELF_EMAIL_FROM,
    ),
    stripe: Boolean(
      process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
    ),
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      ? "test"
      : "setup required",
    openai: Boolean(
      process.env.OPENAI_API_KEY && process.env.AGENTSHELF_OPENAI_MODEL,
    ),
    gemini: Boolean(
      process.env.GEMINI_API_KEY && process.env.AGENTSHELF_GEMINI_MODEL,
    ),
    anthropic: Boolean(
      process.env.ANTHROPIC_API_KEY && process.env.AGENTSHELF_ANTHROPIC_MODEL,
    ),
    perplexity: Boolean(
      process.env.PERPLEXITY_API_KEY && process.env.AGENTSHELF_PERPLEXITY_MODEL,
    ),
    paidAiEnabled: process.env.AGENTSHELF_AI_ENABLED === "true",
    scheduler: Boolean(process.env.CRON_SECRET),
  };
}
