import { load } from "cheerio";
import robotsParser from "robots-parser";
import { fetchPublic, publicUrl, type Fetched } from "./url";
import type { z } from "zod";
import { websiteInput } from "./config";
export type Website = z.infer<typeof websiteInput>;
export type Check = {
  key: string;
  label: string;
  status: "pass" | "warning" | "fail" | "unknown";
  evidence: string;
  url: string;
  weight: number;
};
export type PageEvidence = {
  url: string;
  status: number;
  title: string;
  description: string;
  h1: string[];
  canonical: string;
  links: string[];
  schemas: string[];
  products: Record<string, unknown>[];
  text: string;
  contacts: string[];
};
export type TechnicalAudit = {
  url: string;
  category: string;
  startedAt: string;
  finishedAt: string;
  checks: Check[];
  pages: PageEvidence[];
  technicalScore: number | null;
  productCompleteness: number | null;
  limitations: string[];
};
export type Fetcher = (url: string, maxBytes?: number) => Promise<Fetched>;
export function parsePage(response: Fetched): PageEvidence {
  const $ = load(response.body);
  const schemas: string[] = [],
    products: Record<string, unknown>[] = [];
  const walk = (v: unknown, depth = 0) => {
    if (depth > 20 || !v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.slice(0, 500).forEach((x) => walk(x, depth + 1));
      return;
    }
    const o = v as Record<string, unknown>;
    const ts = Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]];
    ts.forEach((t) => {
      if (typeof t === "string") schemas.push(t);
    });
    if (ts.includes("Product")) products.push(o);
    if (o["@graph"]) walk(o["@graph"], depth + 1);
    if (o.itemListElement) walk(o.itemListElement, depth + 1);
    if (o.item) walk(o.item, depth + 1);
  };
  $("script[type='application/ld+json']").each((_i, s) => {
    try {
      walk(JSON.parse($(s).text()));
    } catch {
      schemas.push("INVALID_JSON_LD");
    }
  });
  const links = new Set<string>();
  $("a[href]").each((_i, a) => {
    try {
      const u = new URL($(a).attr("href")!, response.url);
      u.hash = "";
      if (
        u.origin === new URL(response.url).origin &&
        !/\.(pdf|png|jpg|webp|zip|svg)$/i.test(u.pathname)
      )
        links.add(u.href);
    } catch {}
  });
  const contacts: string[] = [];
  $("a[href^='mailto:'],a[href^='tel:']").each((_i, a) => {
    contacts.push(($(a).attr("href") || "").split("?")[0]);
  });
  $("script,style,noscript,svg").remove();
  return {
    url: response.url,
    status: response.status,
    title: $("title").first().text().trim(),
    description: $("meta[name='description']").attr("content")?.trim() || "",
    h1: $("h1")
      .map((_i, e) => $(e).text().trim())
      .get(),
    canonical: $("link[rel='canonical']").attr("href") || "",
    links: [...links].slice(0, 50),
    schemas,
    products,
    text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000),
    contacts,
  };
}
export function technicalScore(checks: Check[]) {
  const assessed = checks.filter((c) => c.status !== "unknown" && c.weight > 0);
  const total = assessed.reduce((n, c) => n + c.weight, 0);
  return total
    ? Math.round(
        (100 *
          assessed.reduce(
            (n, c) =>
              n +
              c.weight *
                (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0),
            0,
          )) /
          total,
      )
    : null;
}
export function productCompleteness(products: Record<string, unknown>[]) {
  if (!products.length) return null;
  const fields = ["name", "description", "brand", "sku", "image", "offers"];
  return Math.round(
    (100 *
      products.reduce(
        (n, p) => n + fields.filter((f) => Boolean(p[f])).length,
        0,
      )) /
      (products.length * fields.length),
  );
}
export async function crawlWebsite(
  website: Website,
  fetcher: Fetcher = fetchPublic,
  maximum = 5,
): Promise<TechnicalAudit> {
  const startedAt = new Date().toISOString(),
    root = publicUrl(website.url),
    checks: Check[] = [],
    pages: PageEvidence[] = [],
    limitations = [
      "Bounded HTML crawl; JavaScript-only content may not be visible. No bot protection or logins are bypassed.",
      "Technical discoverability is a proprietary website rubric, not an AI recommendation or search ranking.",
      "Product completeness uses six core schema fields; shipping, returns and variants require a separate feed review.",
    ];
  const add = (
    key: string,
    label: string,
    status: Check["status"],
    evidence: string,
    url = root.href,
    weight = 1,
  ) => checks.push({ key, label, status, evidence, url, weight });
  let robots: ReturnType<typeof robotsParser> | undefined;
  const deadline = Date.now() + 70000;
  try {
    const r = await fetcher(new URL("/robots.txt", root).href, 100000);
    if (r.status === 200) {
      robots = robotsParser(r.url, r.body);
      add(
        "robots",
        "Crawler access instructions",
        "pass",
        "robots.txt is available.",
      );
      // A conventional www/apex redirect shares the canonical crawler origin.
      const canonical = publicUrl(r.url);
      if (
        canonical.hostname.replace(/^www\./, "") ===
        root.hostname.replace(/^www\./, "")
      ) {
        root.protocol = canonical.protocol;
        root.host = canonical.host;
      }
    } else if (r.status === 404) {
      add(
        "robots",
        "Crawler access instructions",
        "warning",
        "No robots.txt returned (404).",
      );
    } else {
      add(
        "robots",
        "Crawler access instructions",
        "unknown",
        `robots.txt HTTP ${r.status}; crawl stopped conservatively.`,
      );
      return finish();
    }
  } catch (e) {
    add(
      "robots",
      "Crawler access instructions",
      "unknown",
      e instanceof Error ? e.message : "Unavailable",
    );
    return finish();
  }
  const delay = robots?.getCrawlDelay("AgentShelfBot") || 1;
  if (delay > 10) {
    add(
      "crawl-delay",
      "Crawl delay",
      "unknown",
      "Published crawl delay exceeds the time budget; manual assessment required.",
    );
    return finish();
  }
  const allowed = (u: string) =>
    robots?.isAllowed(u, "AgentShelfBot") !== false;
  const sitemapUrl =
    robots?.getSitemaps()[0] || new URL("/sitemap.xml", root).href;
  try {
    if (new URL(sitemapUrl).origin === root.origin && allowed(sitemapUrl)) {
      const s = await fetcher(sitemapUrl, 250000);
      add(
        "sitemap",
        "Sitemap availability",
        s.status === 200 && /<(urlset|sitemapindex)[\s>]/i.test(s.body)
          ? "pass"
          : "warning",
        `Sitemap HTTP ${s.status}`,
        sitemapUrl,
      );
    } else
      add(
        "sitemap",
        "Sitemap availability",
        "unknown",
        "Sitemap excluded by crawler access instructions.",
      );
  } catch {
    add(
      "sitemap",
      "Sitemap availability",
      "unknown",
      "Sitemap could not be fetched.",
    );
  }
  const queue = [root.href],
    seen = new Set<string>();
  let attempted = 0;
  while (
    queue.length &&
    attempted < Math.min(maximum, 10) &&
    Date.now() < deadline
  ) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    if (!allowed(url)) {
      add(
        `robots:${url}`,
        "Page crawl permission",
        "unknown",
        "robots.txt disallows this page; it was not fetched.",
        url,
        0,
      );
      continue;
    }
    attempted++;
    if (fetcher === fetchPublic)
      await new Promise((r) => setTimeout(r, Math.max(1000, delay * 1000)));
    try {
      const response = await fetcher(url);
      if (new URL(response.url).origin !== root.origin) {
        add(
          `redirect:${url}`,
          "Internal redirect",
          "warning",
          "Internal URL redirected to a different origin.",
          url,
          0,
        );
        continue;
      }
      const page = parsePage(response);
      pages.push(page);
      if (response.status >= 400) {
        add(
          `http:${url}`,
          "Page response",
          "fail",
          `HTTP ${response.status}`,
          url,
          2,
        );
        continue;
      }
      if (response.status !== 200) {
        add(
          `http:${url}`,
          "Page response",
          "warning",
          `HTTP ${response.status}`,
          url,
        );
        continue;
      }
      page.links
        .filter((u) => !seen.has(u))
        .slice(0, 10)
        .forEach((u) => queue.push(u));
      add(
        `https:${url}`,
        "HTTPS",
        new URL(response.url).protocol === "https:" ? "pass" : "fail",
        response.url,
        url,
        2,
      );
      add(
        `title:${url}`,
        "Page title",
        page.title ? "pass" : "fail",
        page.title || "Title missing",
        url,
      );
      add(
        `description:${url}`,
        "Meta description",
        page.description ? "pass" : "warning",
        page.description || "Description missing",
        url,
      );
      add(
        `heading:${url}`,
        "Primary heading",
        page.h1.length === 1 ? "pass" : "warning",
        `${page.h1.length} H1 headings: ${page.h1.join(" | ").slice(0, 250)}`,
        url,
      );
      let canonicalValid = false;
      try {
        canonicalValid =
          Boolean(page.canonical) &&
          publicUrl(new URL(page.canonical, page.url).href).protocol ===
            "https:";
      } catch {}
      add(
        `canonical:${url}`,
        "Canonical URL",
        canonicalValid ? "pass" : "warning",
        page.canonical || "Canonical missing",
        url,
      );
      add(
        `content:${url}`,
        "Readable information",
        page.text.length > 400 ? "pass" : "warning",
        `${page.text.length} text characters collected (capped at 12,000).`,
        url,
      );
      if (page.schemas.includes("INVALID_JSON_LD"))
        add(
          `jsonld:${url}`,
          "Valid structured data",
          "fail",
          "At least one JSON-LD block is invalid JSON.",
          url,
          2,
        );
      else if (page.schemas.length)
        add(
          `jsonld:${url}`,
          "Valid structured data",
          "pass",
          "Observed JSON-LD blocks parsed as valid JSON; this is not full vocabulary validation.",
          url,
          2,
        );
    } catch (e) {
      add(
        `fetch:${url}`,
        "Page response",
        "unknown",
        e instanceof Error ? e.message : "Fetch failed",
        url,
        0,
      );
    }
  }
  const types = pages.flatMap((p) => p.schemas);
  add(
    "organisation",
    "Organisation/business schema",
    types.some((t) =>
      [
        "Organization",
        "LocalBusiness",
        "ProfessionalService",
        "Restaurant",
        "Store",
      ].includes(t),
    )
      ? "pass"
      : "warning",
    types.length
      ? `Observed schema types: ${[...new Set(types)].join(", ")}`
      : "No recognised organisation schema observed.",
    root.href,
    2,
  );
  add(
    "contacts",
    "Public contact details",
    pages.some((p) => p.contacts.length) ? "pass" : "warning",
    pages
      .flatMap((p) => p.contacts)
      .slice(0, 8)
      .join(", ") || "No mailto/tel links observed.",
  );
  if (["ecommerce", "retail", "manufacturer"].includes(website.category))
    add(
      "products",
      "Product structured data",
      types.includes("Product") ? "pass" : "warning",
      `${pages.flatMap((p) => p.products).length} product schema objects observed.`,
      root.href,
      2,
    );
  const titles = pages.map((p) => p.title).filter(Boolean);
  add(
    "duplicates",
    "Distinct page titles",
    new Set(titles).size === titles.length ? "pass" : "warning",
    "Compared titles within this crawl only.",
  );
  if (pages.some((p) => p.contacts.length) && website.location)
    add(
      "location",
      "Service/location clarity",
      pages.some((p) =>
        p.text.toLowerCase().includes(website.location.toLowerCase()),
      )
        ? "pass"
        : "warning",
      `Checked for declared location: ${website.location}`,
    );
  return finish();
  function finish(): TechnicalAudit {
    return {
      url: root.href,
      category: website.category,
      startedAt,
      finishedAt: new Date().toISOString(),
      checks,
      pages,
      technicalScore: pages.length ? technicalScore(checks) : null,
      productCompleteness: productCompleteness(
        pages.flatMap((p) => p.products),
      ),
      limitations,
    };
  }
}
export function classifyBusiness(pages: PageEvidence[]): Website["category"] {
  const s = pages
    .map((p) => p.text + " " + p.schemas.join(" "))
    .join(" ")
    .toLowerCase();
  if (/restaurant|takeaway|book a table/.test(s)) return "hospitality";
  if (/add to cart|add to basket|product /.test(s)) return "ecommerce";
  if (/manufacturer|manufacturing/.test(s)) return "manufacturer";
  if (/service area|localbusiness|plumber|taxi/.test(s))
    return "local-services";
  if (/consultancy|professionalservice|accountant/.test(s))
    return "professional-services";
  return "other";
}
