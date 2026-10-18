import type { MetadataRoute } from "next";
import { caseStudies } from "@/data/case-studies";

const siteUrl = "https://yulaverse.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...caseStudies.map((study) => ({
      url: `${siteUrl}/work/${study.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...[
      "/ai-visibility",
      "/ai-visibility/methodology",
      "/ai-visibility/privacy",
      "/ai-visibility/terms",
      "/agentshelf",
    ].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
