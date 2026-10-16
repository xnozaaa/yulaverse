import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Audit, Recommendation } from "./workflow";
import type { Website } from "./audit";
import { visibilityMetrics } from "./intelligence";
export type ReportSnapshot = {
  business: Website;
  audit: Audit;
  recommendations: Recommendation[];
  approvedAt?: string;
  simulated?: boolean;
};
export function reportSections(snapshot: ReportSnapshot) {
  const { business, audit } = snapshot,
    m = visibilityMetrics(audit.tests, business.name),
    technical = audit.technical;
  return [
    {
      title: "Executive summary",
      lines: [
        `${business.name} | ${business.url}`,
        `Assessment: ${technical?.finishedAt || "Not run"}`,
        `Technical discoverability: ${technical?.technicalScore ?? "Not assessed"}${technical?.technicalScore !== null && technical?.technicalScore !== undefined ? "/100" : ""}`,
        `Observed non-branded mentions: ${m.mentions} of ${m.sampleSize} completed relevant tests.`,
        ...snapshot.recommendations
          .slice(0, 3)
          .map((r, i) => `${i + 1}. ${r.title}`),
      ],
    },
    {
      title: "Technical website assessment",
      lines: technical?.checks.map(
        (c) =>
          `${c.status.toUpperCase()} | ${c.label}: ${c.evidence} | ${c.url}`,
      ) || ["Technical checks have not run."],
    },
    {
      title: "Controlled AI recommendation tests",
      lines: [
        "These are model API observations, not measurements of consumer ChatGPT, Gemini or shopping-interface rankings.",
        `Sample size (non-branded): ${m.sampleSize}. Mention rate: ${m.mentionRate === null ? "No data" : `${m.mentionRate}%`}. Recommendation rate: ${m.recommendationRate === null ? "No data" : `${m.recommendationRate}%`}.`,
        ...audit.tests.map(
          (t) =>
            `${t.status.toUpperCase()} | ${t.provider}/${t.model} | ${t.timestamp} | ${t.locale} | ${t.query.branded ? "BRANDED" : "NON-BRANDED"} | ${t.query.text}\n${t.response || t.error || "No response"}\n${t.citations.map((c) => `Provider citation (not independently visited): ${c.url}`).join("\n")}`,
        ),
      ],
    },
    {
      title: "Competitor comparison",
      lines: [
        "Website rubric comparisons and observed AI mention metrics are separate evidence sources.",
        ...(audit.competitors || []).map(
          (c) =>
            `${c.name} | ${c.url} | Technical discoverability: ${c.technical.technicalScore ?? "Not assessed"}/100 | Pages: ${c.technical.pages.length}`,
        ),
      ],
    },
    {
      title: "Prioritised action plan",
      lines: snapshot.recommendations.map(
        (r) =>
          `${r.priority.toUpperCase()} | ${r.title}\nEvidence: ${r.evidence}\nWhy: ${r.why}\nProposed fix: ${r.fix}\nEffort: ${r.effort}. Confidence: ${r.confidence}. Status: ${r.status}.`,
      ),
    },
    {
      title: "Methodology and limitations",
      lines: [
        "Technical score: assessed checks receive their documented weight; pass = 1, warning = 0.5, fail = 0. Unknown checks are excluded from the denominator. Inspect all checks and their weights in the dashboard. No overall AI visibility composite is presented.",
        "Mention and recommendation rates use completed reviewed tests only, separated into branded/non-branded queries. Heuristic extraction is imperfect. Review raw response evidence. Outputs vary by model, wording, locale and time; small samples are directional.",
        ...(technical?.limitations || []),
        "Public website content is untrusted evidence, never executable instructions. Only bounded public HTTP requests are made. No credentials or bot-protection bypass is used.",
        "No ranking, recommendation, traffic, sales or revenue outcome is guaranteed.",
      ],
    },
    {
      title: "Your next step",
      lines: [
        "Review the highest-priority findings with Yulaverse Intelligence. Optimisation is a managed service: implementation scope and access are agreed separately. Monitoring can track changes using an approved, comparable test suite.",
        "Contact: yulaversestudio@gmail.com | yulaverse.co.uk/ai-visibility",
      ],
    },
  ];
}
export async function generateReport(snapshot: ReportSnapshot, draft = false) {
  const pdf = await PDFDocument.create(),
    regular = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(
    `${snapshot.simulated ? "SIMULATED DEMO - " : ""}AgentShelf AI Visibility Audit - ${snapshot.business.name}`,
  );
  pdf.setAuthor("Yulaverse Intelligence");
  pdf.setLanguage("en-GB");
  const ink = rgb(0.05, 0.06, 0.08),
    gold = rgb(0.77, 0.65, 0.42),
    muted = rgb(0.37, 0.38, 0.43),
    width = 595.28,
    height = 841.89,
    margin = 54;
  let page = pdf.addPage([width, height]),
    y = height - 70;
  const clean = (s: string) =>
    s
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^\x20-\x7e\n\u00a3]/g, " ");
  function newPage() {
    page = pdf.addPage([width, height]);
    y = height - 70;
  }
  function write(value: string, size = 10, strong = false, color = ink) {
    const font = strong ? bold : regular;
    for (const paragraph of clean(value).split("\n")) {
      const words = paragraph.split(/\s+/);
      let line = "";
      for (const word of words) {
        const chunks =
          word.length > 65 ? word.match(/.{1,60}/g) || [word] : [word];
        for (const chunk of chunks) {
          if (
            font.widthOfTextAtSize(`${line} ${chunk}`, size) >
              width - margin * 2 &&
            line
          ) {
            draw(line);
            line = chunk;
          } else line += (line ? " " : "") + chunk;
        }
      }
      if (line) draw(line);
      y -= 5;
    }
    function draw(text: string) {
      if (y < 68) newPage();
      page.drawText(text, { x: margin, y, size, font, color });
      y -= size * 1.55;
    }
  }
  page.drawRectangle({ x: 0, y: 0, width, height, color: ink });
  page.drawText("YULAVERSE INTELLIGENCE", {
    x: margin,
    y: height - 90,
    size: 12,
    font: bold,
    color: gold,
  });
  y = height - 220;
  write("AgentShelf", 46, true, rgb(0.95, 0.94, 0.91));
  write("AI Visibility Audit", 25, true, rgb(0.95, 0.94, 0.91));
  y -= 50;
  write(snapshot.business.name, 21, true, rgb(0.95, 0.94, 0.91));
  write(snapshot.business.url, 11, false, gold);
  write(
    `Assessment date: ${snapshot.audit.technical?.finishedAt.slice(0, 10) || "Not assessed"}`,
    11,
    false,
    rgb(0.8, 0.8, 0.8),
  );
  y -= 35;
  write(
    snapshot.simulated
      ? "SIMULATED DEMONSTRATION - FICTIONAL BUSINESS"
      : draft
        ? "DRAFT - AWAITING ADMIN REVIEW"
        : "REVIEWED CUSTOMER REPORT",
    11,
    true,
    gold,
  );
  for (const section of reportSections(snapshot)) {
    newPage();
    write(section.title, 23, true);
    y -= 18;
    if (
      section.title === "Executive summary" ||
      section.title === "Competitor comparison"
    ) {
      const bars =
        section.title === "Executive summary"
          ? [
              {
                label: "Technical discoverability",
                value: snapshot.audit.technical?.technicalScore,
              },
              {
                label: "Product schema completeness",
                value: snapshot.audit.technical?.productCompleteness,
              },
            ]
          : [
              {
                label: snapshot.business.name,
                value: snapshot.audit.technical?.technicalScore,
              },
              ...(snapshot.audit.competitors || []).map((c) => ({
                label: c.name,
                value: c.technical.technicalScore,
              })),
            ];
      for (const bar of bars) {
        if (bar.value === null || bar.value === undefined) continue;
        write(
          `${bar.label}: ${bar.value}/100${snapshot.simulated ? " (SIMULATED)" : ""}`,
          10,
          true,
        );
        page.drawRectangle({
          x: margin,
          y: y - 10,
          width: width - margin * 2,
          height: 8,
          color: rgb(0.93, 0.92, 0.9),
        });
        page.drawRectangle({
          x: margin,
          y: y - 10,
          width:
            ((width - margin * 2) * Math.min(100, Math.max(0, bar.value))) /
            100,
          height: 8,
          color: gold,
        });
        y -= 40;
      }
      y -= 10;
    }
    for (const line of section.lines) {
      write(line);
      y -= 9;
    }
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `${snapshot.simulated ? "SIMULATED DEMO | " : draft ? "DRAFT | " : ""}YULAVERSE INTELLIGENCE / AGENTSHELF`,
      {
        x: margin,
        y: 32,
        size: 7,
        font: bold,
        color: i === 0 ? rgb(0.65, 0.65, 0.67) : muted,
      },
    );
    p.drawText(`${i + 1} / ${pages.length}`, {
      x: width - margin - 35,
      y: 32,
      size: 8,
      font: regular,
      color: muted,
    });
  });
  return pdf.save();
}
