"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const VisibilityChart = dynamic(() => import("./visibility-chart"), {
  ssr: false,
  loading: () => (
    <div className="as-skeleton" aria-label="Loading visibility chart" />
  ),
});
import { createAuthClient } from "better-auth/react";
import type { Entity } from "@/lib/agentshelf/db";
import type { Website } from "@/lib/agentshelf/audit";
import type {
  Audit,
  Recommendation,
  Subscription,
  Job,
} from "@/lib/agentshelf/workflow";
import type { Order } from "@/lib/agentshelf/billing";
import type { ReportSnapshot } from "@/lib/agentshelf/report";
import type { FeedResult } from "@/lib/agentshelf/feed";
import { visibilityMetrics } from "@/lib/agentshelf/metrics";
const providers = ["openai", "gemini", "anthropic", "perplexity"] as const;
import { WebsiteForm } from "./website-form";
import { demoSnapshot } from "@/lib/agentshelf/demo";
type Entities = {
  website: Entity<
    Website & { monitoringEnabled?: boolean; nextRunAt?: string }
  >[];
  audit: Entity<Audit>[];
  recommendation: Entity<Recommendation>[];
  report: Entity<ReportSnapshot>[];
  subscription: Entity<Subscription>[];
  order: Entity<Order>[];
  feed: Entity<FeedResult>[];
  job: Entity<Job>[];
};
type State = {
  actor?: { email?: string; admin: boolean };
  entities: Entities;
  leads?: {
    id: string;
    data: {
      businessName: string;
      email: string;
      package: string;
      website: string;
      stage?: string;
      contactName?: string;
      notes?: string;
    };
  }[];
  customers?: { id: string; name: string; email: string }[];
  events?: {
    id: string;
    action: string;
    created_at: string;
    details: unknown;
  }[];
  outbox?: {
    id: string;
    recipient: string;
    subject: string;
    state: string;
    error?: string;
  }[];
  integrations?: Record<string, unknown>;
};
const empty: Entities = {
  website: [],
  audit: [],
  recommendation: [],
  report: [],
  subscription: [],
  order: [],
  feed: [],
  job: [],
};
const customerTabs = [
  "Overview",
  "Websites",
  "Results",
  "Competitors",
  "Recommendations",
  "Audit history",
  "Reports",
  "Product feeds",
  "Monitoring",
  "Billing",
  "Account",
];
const adminTabs = [
  "Overview",
  "Customers",
  "Enquiries",
  "Orders",
  "Assessment queue",
  "Reports",
  "Monitoring jobs",
  "Providers",
  "System logs",
];
const make = <T,>(id: string, data: T, kind: string): Entity<T> => ({
  id,
  data,
  kind,
  orgId: "fictional-demo",
  version: 1,
  createdAt: "2026-10-16T09:00:00.000Z",
  updatedAt: "2026-10-16T09:00:00.000Z",
});
const demo: State = {
  actor: { email: "demo@example.test", admin: false },
  entities: {
    ...empty,
    website: [make("demo", demoSnapshot.business, "website")],
    audit: [make("demo", demoSnapshot.audit, "audit")],
    recommendation: demoSnapshot.recommendations.map((r, i) =>
      make(`demo-rec-${i}`, r, "recommendation"),
    ),
    report: [make("demo-report", demoSnapshot, "report")],
  },
};
export function AgentDashboard({
  simulated = false,
  admin = false,
  initialTab = "Overview",
  priceOptions = [],
}: {
  simulated?: boolean;
  admin?: boolean;
  initialTab?: string;
  priceOptions?: { id: string; name: string; display: string }[];
}) {
  const [state, setState] = useState<State>(
      simulated ? demo : { entities: empty },
    ),
    [tab, setTab] = useState(initialTab),
    [loading, setLoading] = useState(!simulated),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState(""),
    [editing, setEditing] = useState<Entity<Website> | undefined>(),
    [busy, setBusy] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const refresh = useCallback(async () => {
    if (simulated) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/agentshelf/state${admin ? "?admin=1" : ""}`, {
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setState({ ...d, entities: { ...empty, ...d.entities } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, [admin, simulated]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function action(path: string, body: unknown) {
    if (simulated) {
      setNotice(
        "SIMULATED DEMO: This workspace is read-only. No customer data or subscription was changed.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(`/api/agentshelf/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Request failed");
      if (d.url) {
        window.location.assign(d.url);
        return d;
      }
      setNotice("Saved successfully.");
      if (["websites", "website-update"].includes(path)) {
        if (!admin) setTab("Websites");
        setEditing(undefined);
      }
      await refresh();
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const e = state.entities,
    sites = e.website,
    site = sites.find((w) => w.id === selected) || sites[0],
    audits = e.audit.filter((a) => !site || a.data.websiteId === site.id),
    latest = audits.find((a) => a.data.status === "approved"),
    audit = latest?.data,
    m =
      audit && site
        ? visibilityMetrics(audit.tests || [], site.data.name)
        : undefined;
  const recommendations = e.recommendation.filter(
      (r) => !latest || r.data.auditId === latest.id,
    ),
    reportLink = (id: string) =>
      simulated
        ? "/api/agentshelf/demo-report"
        : `/api/agentshelf/reports/${id}${admin ? "?admin=1" : ""}`;
  const date = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-GB") : "Not assessed";
  const ratio = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : `${v}%`;
  const chartData = simulated
    ? [
        { period: "May (demo)", mentions: 20 },
        { period: "Jun (demo)", mentions: 26 },
        { period: "Jul (demo)", mentions: 30 },
        { period: "Aug (demo)", mentions: 38 },
        { period: "Sep (demo)", mentions: 40 },
        { period: "Oct (demo)", mentions: 48 },
      ]
    : audits
        .filter((a) => a.data.status === "approved" && site)
        .slice()
        .reverse()
        .map((a) => ({
          period: date(a.data.technical?.finishedAt),
          mentions: visibilityMetrics(a.data.tests, site!.data.name)
            .mentionRate,
        }));
  const tabs = admin ? adminTabs : customerTabs;
  return (
    <>
      {simulated && (
        <div className="as-demo-banner">
          <strong>SIMULATED DEMONSTRATION</strong> · Fictional business, test
          responses, metrics and trends. No website was crawled, API called or
          payment taken.
        </div>
      )}
      <div className="as-app">
        <aside className="as-sidebar" aria-label="Workspace sections">
          <p>{admin ? "YULAVERSE / ADMIN" : "AGENTSHELF / WORKSPACE"}</p>
          {tabs.map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => {
                setTab(t);
                setEditing(undefined);
              }}
            >
              {t}
            </button>
          ))}
          {!simulated && (
            <button
              onClick={async () => {
                await createAuthClient().signOut();
                window.location.assign("/agentshelf/login");
              }}
            >
              Sign out ↗
            </button>
          )}
        </aside>
        <main className="as-main" id="main-content">
          <div className="as-app-heading">
            <div>
              <p className="as-eyebrow">
                {admin
                  ? "Yulaverse Intelligence / Administration"
                  : simulated
                    ? "Fictional business / Demonstration"
                    : "Your discovery intelligence"}
              </p>
              <h1>
                {tab === "Overview"
                  ? admin
                    ? "Platform overview"
                    : site?.data.name || "Your intelligence workspace"
                  : tab}
              </h1>
              <p>
                {admin
                  ? "Customers, evidence and delivery in one place."
                  : `Last approved assessment: ${date(audit?.technical?.finishedAt)} · ${simulated ? "Simulated example" : "Evidence-led. No ranking guarantees."}`}
              </p>
            </div>
            <div className="as-inline">
              {sites.length > 1 && !admin && (
                <label className="as-field">
                  Selected business
                  <select
                    value={site?.id}
                    onChange={(ev) => setSelected(ev.target.value)}
                  >
                    {sites.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.data.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="as-button as-button-secondary as-button-small"
                disabled={loading || busy}
                onClick={() => void refresh()}
              >
                Refresh ↻
              </button>
              {!simulated && state.actor?.admin && !admin && (
                <Link
                  className="as-button as-button-small"
                  href="/admin/agentshelf"
                >
                  Admin ↗
                </Link>
              )}
            </div>
          </div>
          {error && (
            <p className="as-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="as-success" role="status">
              {notice}
            </p>
          )}
          {loading ? (
            <div className="as-stack" aria-label="Loading workspace">
              <div className="as-skeleton" />
              <div className="as-skeleton" />
            </div>
          ) : (
            <>
              {tab === "Overview" && !admin && (
                <>
                  <div className="as-metrics">
                    {[
                      [
                        "AI mention rate",
                        ratio(m?.mentionRate),
                        m
                          ? `${m.mentions} of ${m.sampleSize} non-branded tests`
                          : "Awaiting completed tests",
                      ],
                      [
                        "Recommendation rate",
                        ratio(m?.recommendationRate),
                        m
                          ? `${m.recommendations} observed recommendations`
                          : "No result is invented",
                      ],
                      [
                        "Technical discoverability",
                        audit?.technical?.technicalScore === null ||
                        !audit?.technical
                          ? "—"
                          : `${audit.technical.technicalScore}/100`,
                        simulated
                          ? "SIMULATED website rubric"
                          : "Proprietary website rubric",
                      ],
                      [
                        "Product completeness",
                        ratio(audit?.technical?.productCompleteness),
                        "Six core structured-data fields",
                      ],
                    ].map(([label, value, foot]) => (
                      <article className="as-metric" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>
                          {simulated ? "SIMULATED · " : ""}
                          {foot}
                        </small>
                      </article>
                    ))}
                  </div>
                  <div className="as-dashboard-grid">
                    <section className="as-card">
                      <div className="as-card-head">
                        <h3>Visibility over time</h3>
                        <span className="as-pill">
                          {simulated ? "Simulated trends" : "Non-branded tests"}
                        </span>
                      </div>
                      {chartData.length ? (
                        <div
                          className="as-chart"
                          role="img"
                          aria-label={`${simulated ? "Simulated " : ""}brand mention rate by assessment period`}
                        >
                          <VisibilityChart data={chartData} />
                        </div>
                      ) : (
                        <Empty
                          title="Your trend starts with evidence"
                          text="Historical results will appear after approved assessments are available."
                        />
                      )}
                      <p className="as-note">
                        {m?.source ||
                          "Model API observations are distinct from consumer app rankings."}{" "}
                        Sample sizes and test conditions can differ; compare
                        like-for-like suites.
                      </p>
                    </section>
                    <section className="as-card">
                      <h3>Where to focus next</h3>
                      {recommendations.length ? (
                        recommendations.slice(0, 3).map((r) => (
                          <div key={r.id} style={{ marginTop: 24 }}>
                            <span className="as-pill">
                              {simulated ? "SIMULATED · " : ""}
                              {r.data.priority}
                            </span>
                            <p style={{ color: "#efede7" }}>{r.data.title}</p>
                          </div>
                        ))
                      ) : (
                        <Empty
                          title="No actions yet"
                          text="Your evidence-supported action plan will appear after assessment."
                        />
                      )}
                      <button
                        className="as-button as-button-secondary as-button-small"
                        style={{ marginTop: 20 }}
                        onClick={() =>
                          setTab(sites.length ? "Recommendations" : "Websites")
                        }
                      >
                        {sites.length
                          ? "View action plan ↗"
                          : "Add your website ↗"}
                      </button>
                    </section>
                  </div>
                  <section className="as-card" style={{ marginTop: 22 }}>
                    <h3>Your next step</h3>
                    <p>
                      {sites.length
                        ? "Review your business details, confirm the assessment scope and request an audit. A Yulaverse administrator reviews the report before delivery."
                        : "Add your business website to begin. You can define your category, market and competitors before requesting an assessment."}
                    </p>
                    <div className="as-actions">
                      <button
                        className="as-button"
                        onClick={() => setTab("Websites")}
                      >
                        {sites.length
                          ? "Manage my website"
                          : "Begin onboarding"}
                      </button>
                      <Link
                        href="/ai-visibility/methodology"
                        className="as-button as-button-secondary"
                      >
                        Read the methodology
                      </Link>
                    </div>
                  </section>
                </>
              )}
              {admin && tab === "Overview" && (
                <>
                  <div className="as-metrics">
                    {[
                      ["Saved enquiries", state.leads?.length || 0],
                      [
                        "Paid audit orders",
                        e.order.filter(
                          (o) =>
                            o.data.status === "paid" &&
                            o.data.package === "audit",
                        ).length,
                      ],
                      [
                        "Monitoring subscriptions",
                        e.subscription.filter((s) =>
                          ["active", "trialing"].includes(s.data.status),
                        ).length,
                      ],
                      [
                        "Review queue",
                        e.audit.filter((a) => a.data.status === "review")
                          .length,
                      ],
                    ].map(([k, v]) => (
                      <article className="as-metric" key={k}>
                        <span>{k}</span>
                        <strong>{v}</strong>
                        <small>Recorded platform data</small>
                      </article>
                    ))}
                  </div>
                  <section className="as-card">
                    <h3>Financial & operational evidence</h3>
                    <p>
                      Test-mode orders are excluded from live revenue. MRR is
                      not inferred from advertised prices; Stripe-confirmed
                      recurring amounts need a connected account.
                    </p>
                    <div className="as-table-wrap">
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Recorded value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Live one-off revenue</td>
                            <td>
                              £
                              {(
                                e.order
                                  .filter(
                                    (o) =>
                                      o.data.status === "paid" &&
                                      o.data.livemode,
                                  )
                                  .reduce((n, o) => n + o.data.amountPence, 0) /
                                100
                              ).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td>Optimisation orders</td>
                            <td>
                              {
                                e.order.filter(
                                  (o) => o.data.package === "optimisation",
                                ).length
                              }
                            </td>
                          </tr>
                          <tr>
                            <td>
                              Model API token cost estimate (excludes unknown
                              provider extras)
                            </td>
                            <td>
                              $
                              {e.audit
                                .reduce(
                                  (n, a) => n + (a.data.estimatedCostUsd || 0),
                                  0,
                                )
                                .toFixed(4)}
                            </td>
                          </tr>
                          <tr>
                            <td>Failed jobs</td>
                            <td>
                              {
                                e.job.filter((j) => j.data.status === "failed")
                                  .length
                              }
                            </td>
                          </tr>
                          <tr>
                            <td>Live recurring revenue</td>
                            <td>
                              Not measured — connect verified billing amounts
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
              {tab === "Websites" && (
                <div className="as-stack">
                  {sites.map((w) => (
                    <article key={w.id} className="as-card">
                      <div className="as-card-head">
                        <div>
                          <h3>{w.data.name}</h3>
                          <p>{w.data.url}</p>
                        </div>
                        <span className="as-pill">{w.data.category}</span>
                      </div>
                      <p>
                        {w.data.offering} · {w.data.location}
                      </p>
                      <p>
                        Competitors:{" "}
                        {w.data.competitors.join(", ") || "None supplied"}
                      </p>
                      <div className="as-actions">
                        <button
                          className="as-button as-button-small"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Request this public website assessment? It will enter the admin review queue; no website changes or payment are made.",
                              )
                            )
                              void action("audits", {
                                websiteId: w.id,
                                scopeApproved: true,
                              }).catch(() => {});
                          }}
                        >
                          Request assessment ↗
                        </button>
                        <button
                          className="as-button as-button-secondary as-button-small"
                          onClick={() => setEditing(w)}
                        >
                          Edit business details
                        </button>
                      </div>
                    </article>
                  ))}
                  {(!sites.length || editing || sites.length < 3) && (
                    <section className="as-card">
                      <WebsiteForm
                        key={editing?.id || `new-${sites.length}`}
                        existing={editing}
                        save={action}
                      />
                    </section>
                  )}
                </div>
              )}
              {(tab === "Results" || tab === "Audit history") && (
                <div className="as-stack">
                  {audits.length ? (
                    audits.map((a) => (
                      <article className="as-card" key={a.id}>
                        <div className="as-card-head">
                          <h3>Assessment · {date(a.createdAt)}</h3>
                          <span className="as-pill">
                            {simulated ? "SIMULATED · " : ""}
                            {a.data.status}
                          </span>
                        </div>
                        {a.data.technical ? (
                          <>
                            <p>
                              {a.data.technical.pages.length} pages · Technical
                              score{" "}
                              {a.data.technical.technicalScore ??
                                "not assessed"}
                              /100 · Category: {a.data.technical.category}
                            </p>
                            <div className="as-table-wrap">
                              <table className="as-table">
                                <thead>
                                  <tr>
                                    <th>Check</th>
                                    <th>Result</th>
                                    <th>Evidence</th>
                                    <th>Weight</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {a.data.technical.checks.map((c) => (
                                    <tr key={c.key}>
                                      <td>{c.label}</td>
                                      <td>{c.status}</td>
                                      <td>
                                        {c.evidence}
                                        <br />
                                        {c.url}
                                      </td>
                                      <td>{c.weight}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <ResultBreakdown
                              tests={a.data.tests}
                              brand={site?.data.name || ""}
                            />
                            {a.data.tests?.map((t, i) => (
                              <details key={i}>
                                <summary>
                                  {t.provider} / {t.model} ·{" "}
                                  {t.query.branded ? "Branded" : "Non-branded"}{" "}
                                  · {t.status}
                                </summary>
                                <p>{t.query.text}</p>
                                <p>
                                  {t.timestamp} · {t.locale} · Search{" "}
                                  {t.settings.search
                                    ? "enabled"
                                    : "not enabled"}
                                </p>
                                <pre className="as-evidence">
                                  {t.response || t.error}
                                </pre>
                                <p>
                                  {t.mentions
                                    .map(
                                      (x) =>
                                        `${x.brand}: ${x.mentioned ? "mentioned" : "not mentioned"}; ${x.recommended ? "recommendation observed" : "no recommendation observed"} (${x.confidence} extraction confidence)`,
                                    )
                                    .join(" | ")}
                                </p>
                                {t.citations.map((c) => (
                                  <p key={c.url}>
                                    Provider supplied citation; not
                                    independently visited: {c.url}
                                  </p>
                                ))}
                              </details>
                            ))}
                          </>
                        ) : (
                          <p>
                            Processing or administrator review pending. Results
                            are not presented until approved.
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <Empty
                      title="No assessments yet"
                      text="Request an assessment from your Websites section after confirming the scope."
                    />
                  )}
                </div>
              )}
              {tab === "Competitors" && (
                <section className="as-card">
                  <h3>Compare equivalent evidence</h3>
                  <p>
                    Website rubric scores are separate from model mention and
                    recommendation frequency.
                  </p>
                  {audit?.competitors?.length ? (
                    <div className="as-table-wrap">
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>Business</th>
                            <th>Website</th>
                            <th>Technical score</th>
                            <th>Pages assessed</th>
                            <th>AI test sample</th>
                            <th>Mention rate</th>
                            <th>Recommendation rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{site?.data.name}</td>
                            <td>{site?.data.url}</td>
                            <td>{audit.technical?.technicalScore ?? "—"}</td>
                            <td>{audit.technical?.pages.length}</td>
                            <td>{m?.sampleSize || 0}</td>
                            <td>{ratio(m?.mentionRate)}</td>
                            <td>{ratio(m?.recommendationRate)}</td>
                          </tr>
                          {audit.competitors.map((c) => (
                            <tr key={c.url}>
                              <td>{c.name}</td>
                              <td>{c.url}</td>
                              <td>{c.technical.technicalScore ?? "—"}</td>
                              <td>{c.technical.pages.length}</td>
                              <td>
                                {
                                  visibilityMetrics(audit.tests, c.name)
                                    .sampleSize
                                }
                              </td>
                              <td>
                                {ratio(
                                  visibilityMetrics(audit.tests, c.name)
                                    .mentionRate,
                                )}
                              </td>
                              <td>
                                {ratio(
                                  visibilityMetrics(audit.tests, c.name)
                                    .recommendationRate,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title={
                        simulated
                          ? "SIMULATED competitor setup"
                          : "No competitor evidence yet"
                      }
                      text={
                        simulated
                          ? "Wayfarer and Atlas are fictional example competitors. No real comparison was run."
                          : "Add competitor websites before requesting an assessment."
                      }
                    />
                  )}
                </section>
              )}
              {tab === "Recommendations" && (
                <div className="as-stack">
                  {recommendations.length ? (
                    recommendations.map((r) => (
                      <article className="as-card" key={r.id}>
                        <div className="as-card-head">
                          <h3>{r.data.title}</h3>
                          <span className="as-pill">
                            {simulated ? "SIMULATED · " : ""}
                            {r.data.priority} / {r.data.status}
                          </span>
                        </div>
                        <p>
                          <strong>Evidence:</strong> {r.data.evidence}
                        </p>
                        <p>
                          <strong>Why:</strong> {r.data.why}
                        </p>
                        <p>
                          <strong>Proposed fix:</strong> {r.data.fix}
                        </p>
                        <p>
                          Effort: {r.data.effort} · Confidence:{" "}
                          {r.data.confidence}
                        </p>
                        <button
                          className="as-button as-button-secondary as-button-small"
                          disabled={busy}
                          style={{ marginTop: 20 }}
                          onClick={() =>
                            void action("recommendations", {
                              id: r.id,
                              version: r.version,
                              status:
                                r.data.status === "open" ? "completed" : "open",
                            }).catch(() => {})
                          }
                        >
                          {r.data.status === "open"
                            ? "Mark completed"
                            : "Reopen action"}
                        </button>
                      </article>
                    ))
                  ) : (
                    <Empty
                      title="Your action plan is on its way"
                      text="Prioritised recommendations appear after a technical assessment."
                    />
                  )}
                </div>
              )}
              {tab === "Reports" && (
                <div className="as-stack">
                  {e.report.length ? (
                    e.report.map((r) => (
                      <article className="as-card" key={r.id}>
                        <h3>{r.data.business.name}</h3>
                        <p>
                          {simulated ? "SIMULATED DEMONSTRATION · " : ""}
                          Reviewed {date(r.data.approvedAt)} · PDF report
                        </p>
                        <a
                          className="as-button"
                          style={{ marginTop: 24 }}
                          href={reportLink(r.id)}
                        >
                          Download {simulated ? "simulated " : ""}report ↓
                        </a>
                      </article>
                    ))
                  ) : (
                    <Empty
                      title="No approved reports yet"
                      text="An administrator reviews and approves each report before it becomes available here."
                    />
                  )}
                </div>
              )}
              {tab === "Product feeds" && (
                <div className="as-stack">
                  <section className="as-card">
                    <h3>Product feed & structured-data review</h3>
                    <p>
                      Upload a standard or Shopify CSV (up to 1 MB / 500 rows).
                      Source catalogues are never overwritten. The export
                      contains proposed changes and warnings.
                    </p>
                    <label className="as-field" style={{ marginTop: 25 }}>
                      Product CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (file && file.size <= 1_000_000)
                            await action("feeds", {
                              csv: await file.text(),
                            }).catch(() => {});
                          else setError("Choose a CSV smaller than 1 MB.");
                        }}
                      />
                    </label>
                  </section>
                  {e.feed.map((f) => (
                    <article className="as-card" key={f.id}>
                      <h3>{f.data.products.length} product rows reviewed</h3>
                      <p>
                        Core field completeness: {ratio(f.data.completeness)}.{" "}
                        {f.data.issues.length} validation findings.
                      </p>
                      <a
                        href={`/api/agentshelf/feeds/${f.id}`}
                        className="as-button as-button-secondary"
                        style={{ marginTop: 20 }}
                      >
                        Export proposed changes ↓
                      </a>
                      <details style={{ marginTop: 20 }}>
                        <summary>
                          Proposed structured-data examples (manual review
                          required)
                        </summary>
                        <p>
                          Examples use supplied catalogue values only. Validate
                          missing fields and availability before publishing. No
                          source catalogue was modified and schema does not
                          guarantee AI placement.
                        </p>
                        <pre className="as-evidence">
                          {JSON.stringify(f.data.schemaExamples || [], null, 2)}
                        </pre>
                      </details>
                      <div className="as-table-wrap">
                        <table className="as-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Field</th>
                              <th>Level</th>
                              <th>Finding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.data.issues.slice(0, 100).map((i, n) => (
                              <tr key={n}>
                                <td>{i.row}</td>
                                <td>{i.field}</td>
                                <td>{i.level}</td>
                                <td>{i.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {tab === "Monitoring" && (
                <section className="as-card">
                  <h3>Monthly monitoring</h3>
                  <p>
                    Monitoring requires an active verified subscription, an
                    approved query suite and configured provider budgets. Each
                    monthly run is locked against duplicate execution. Changes
                    need sufficient evidence before an alert is sent.
                  </p>
                  {sites.map((w) => (
                    <div
                      key={w.id}
                      className="as-card-head"
                      style={{ marginTop: 30 }}
                    >
                      <div>
                        <p>{w.data.name}</p>
                        <p>
                          Next scheduled: {date(w.data.nextRunAt)} ·{" "}
                          {w.data.monitoringEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <button
                        className="as-button as-button-secondary as-button-small"
                        onClick={() =>
                          void action("monitoring", {
                            websiteId: w.id,
                            enabled: !w.data.monitoringEnabled,
                            version: w.version,
                          }).catch(() => {})
                        }
                      >
                        {w.data.monitoringEnabled
                          ? "Pause monitoring"
                          : "Enable monitoring"}
                      </button>
                    </div>
                  ))}
                </section>
              )}
              {tab === "Billing" && (
                <section className="as-card">
                  <h3>Packages & subscription management</h3>
                  <p>
                    Hosted Stripe checkout is available only when configured.
                    Test-mode payments are clearly labelled and do not represent
                    real revenue. Visiting a return URL never grants access.
                  </p>
                  <div className="as-actions">
                    {priceOptions.map((p) => (
                      <button
                        className="as-button as-button-secondary"
                        key={p.id}
                        disabled={busy}
                        onClick={() =>
                          void action("checkout", { package: p.id }).catch(
                            () => {},
                          )
                        }
                      >
                        {p.name} · {p.display} · test checkout
                      </button>
                    ))}
                    <button
                      className="as-button"
                      onClick={() => void action("portal", {}).catch(() => {})}
                    >
                      Manage billing / cancellation ↗
                    </button>
                  </div>
                  {e.order.map((o) => (
                    <p key={o.id}>
                      {o.data.package} · {o.data.status} ·{" "}
                      {o.data.livemode ? "Live" : "Test mode"}
                    </p>
                  ))}
                  {e.subscription.map((s) => (
                    <div key={s.id} className="as-muted">
                      <p>
                        Monitoring · {s.data.status} ·{" "}
                        {s.data.livemode ? "Live" : "Test mode"}
                      </p>
                      <p>
                        {s.data.cancelAt
                          ? `Cancellation scheduled: ${date(s.data.cancelAt)}`
                          : s.data.cancelAtPeriodEnd
                            ? `Cancellation scheduled: ${date(s.data.currentPeriodEnd)}`
                            : `Current period ends: ${date(s.data.currentPeriodEnd)}`}
                      </p>
                    </div>
                  ))}
                </section>
              )}
              {tab === "Account" && (
                <section className="as-card">
                  <h3>Your account & privacy</h3>
                  <p>{state.actor?.email}</p>
                  <p>
                    Only verified organisation members can access their reports
                    and records. Card details are handled by Stripe. Contact the
                    studio to request correction or deletion; retained legal
                    records are explained in the privacy notice.
                  </p>
                  <div className="as-actions">
                    <a
                      download
                      className="as-button as-button-secondary"
                      href="/api/agentshelf/export"
                    >
                      Export my data ↓
                    </a>
                    <Link
                      href="/ai-visibility/privacy"
                      className="as-button as-button-secondary"
                    >
                      Privacy & retention
                    </Link>
                    <a
                      href="mailto:yulaversestudio@gmail.com?subject=AgentShelf%20data%20request"
                      className="as-button as-button-secondary"
                    >
                      Request correction / deletion
                    </a>
                  </div>
                </section>
              )}
              {admin && tab === "Enquiries" && (
                <section className="as-card">
                  <h3>Saved incoming enquiries</h3>
                  <div className="as-table-wrap">
                    <table className="as-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Contact</th>
                          <th>Package</th>
                          <th>Website</th>
                          <th>Stage / details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.leads?.map((l) => (
                          <tr key={l.id}>
                            <td>{l.data.businessName}</td>
                            <td>{l.data.email}</td>
                            <td>{l.data.package}</td>
                            <td>{l.data.website}</td>
                            <td>
                              <select
                                aria-label={`Enquiry stage for ${l.data.businessName}`}
                                value={l.data.stage || "new"}
                                disabled={busy}
                                onChange={(ev) =>
                                  void action("lead-update", {
                                    id: l.id,
                                    stage: ev.target.value,
                                  }).catch(() => {})
                                }
                              >
                                {[
                                  "new",
                                  "contacted",
                                  "converted",
                                  "closed",
                                ].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <details>
                                <summary>View request</summary>
                                <pre className="as-evidence">
                                  {JSON.stringify(l.data, null, 2)}
                                </pre>
                              </details>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {admin && tab === "Customers" && (
                <section className="as-card">
                  <h3>Customer organisations</h3>
                  <label className="as-field">
                    Search customers
                    <input
                      type="search"
                      value={customerSearch}
                      onChange={(ev) => setCustomerSearch(ev.target.value)}
                    />
                  </label>
                  <div className="as-table-wrap">
                    <table className="as-table">
                      <thead>
                        <tr>
                          <th>Organisation</th>
                          <th>Verified account</th>
                          <th>ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.customers
                          ?.filter((c) =>
                            `${c.name} ${c.email}`
                              .toLowerCase()
                              .includes(customerSearch.toLowerCase()),
                          )
                          .map((c) => (
                            <tr key={c.id}>
                              <td>{c.name}</td>
                              <td>{c.email}</td>
                              <td>{c.id}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {admin && tab === "Orders" && (
                <section className="as-card">
                  <h3>Orders & subscriptions</h3>
                  <div className="as-table-wrap">
                    <table className="as-table">
                      <thead>
                        <tr>
                          <th>Organisation</th>
                          <th>Package</th>
                          <th>Payment status</th>
                          <th>Amount</th>
                          <th>Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.order.map((o) => (
                          <tr key={o.id}>
                            <td>{o.orgId}</td>
                            <td>{o.data.package}</td>
                            <td>{o.data.status}</td>
                            <td>£{(o.data.amountPence / 100).toFixed(2)}</td>
                            <td>{o.data.livemode ? "Live" : "Test"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {e.subscription.map((s) => (
                    <p key={s.id}>
                      {s.orgId} · {s.data.status} · through{" "}
                      {date(s.data.currentPeriodEnd)}
                    </p>
                  ))}
                </section>
              )}
              {admin && tab === "Assessment queue" && (
                <div className="as-stack">
                  <section className="as-card">
                    <h3>Run the next queued assessment</h3>
                    <p>
                      The worker claims one due job at a time with a lease. AI
                      calls require individually approved queries, configured
                      providers and budgets.
                    </p>
                    <button
                      className="as-button"
                      disabled={busy}
                      style={{ marginTop: 20 }}
                      onClick={() => void action("process", {}).catch(() => {})}
                    >
                      {busy ? "Processing…" : "Process next job ↗"}
                    </button>
                  </section>
                  {e.audit.map((a) => (
                    <article className="as-card" key={a.id}>
                      <div className="as-card-head">
                        <h3>
                          {sites.find((w) => w.id === a.data.websiteId)?.data
                            .name || a.data.websiteId}
                        </h3>
                        <span className="as-pill">{a.data.status}</span>
                      </div>
                      <p>
                        Organisation: {a.orgId} · Category suggestion:{" "}
                        {a.data.classificationSuggestion || "Not assessed"}
                      </p>
                      <QueryEditor
                        key={`${a.id}-${a.version}`}
                        audit={a}
                        save={action}
                      />
                      {sites
                        .filter((w) => w.id === a.data.websiteId)
                        .map((w) => (
                          <details key={w.id}>
                            <summary>
                              Correct business classification or competitors
                            </summary>
                            <WebsiteForm existing={w} save={action} />
                          </details>
                        ))}
                      {a.data.technical && (
                        <details>
                          <summary>
                            Review technical evidence (
                            {a.data.technical.checks.length} checks)
                          </summary>
                          <pre className="as-evidence">
                            {JSON.stringify(a.data.technical, null, 2)}
                          </pre>
                        </details>
                      )}
                      {a.data.tests?.map((t, i) => (
                        <details key={i}>
                          <summary>
                            {t.provider} · {t.status} · {t.query.text}
                          </summary>
                          <pre className="as-evidence">
                            {JSON.stringify(t, null, 2)}
                          </pre>
                        </details>
                      ))}
                      {a.data.status === "review" && (
                        <button
                          className="as-button"
                          style={{ marginTop: 20 }}
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Approve this assessed report and notify the customer?",
                              )
                            )
                              void action("approve", { auditId: a.id }).catch(
                                () => {},
                              );
                          }}
                        >
                          Approve & deliver report ↗
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {admin && tab === "Providers" && (
                <section className="as-card">
                  <h3>Provider configuration status</h3>
                  <p>
                    Credentials are server-side environment variables. No secret
                    values are displayed. Configure price limits per model
                    before enabling calls.
                  </p>
                  <pre className="as-evidence">
                    {JSON.stringify(state.integrations, null, 2)}
                  </pre>
                  <p>
                    Every test stores provider, model, timestamp, locale,
                    settings, response, citations and token usage. Unsupported
                    consumer shopping interfaces are not measured.
                  </p>
                </section>
              )}
              {admin && tab === "Monitoring jobs" && (
                <section className="as-card">
                  <h3>Job leases and retry state</h3>
                  {e.job.map((j) => (
                    <details key={j.id}>
                      <summary>
                        {j.data.status} · {j.data.uniqueKey} · attempt{" "}
                        {j.data.attempts}/3
                      </summary>
                      <pre className="as-evidence">
                        {JSON.stringify(j.data, null, 2)}
                      </pre>
                    </details>
                  ))}
                </section>
              )}
              {admin && tab === "System logs" && (
                <div className="as-stack">
                  <section className="as-card">
                    <div className="as-card-head">
                      <h3>Email delivery outbox</h3>
                      <button
                        className="as-button as-button-small"
                        onClick={() =>
                          void action("retry-email", {}).catch(() => {})
                        }
                      >
                        Retry due emails
                      </button>
                    </div>
                    {state.outbox?.map((o) => (
                      <p key={o.id}>
                        {o.recipient} · {o.subject} · {o.state}
                        {o.error ? ` · ${o.error}` : ""}
                      </p>
                    ))}
                  </section>
                  <section className="as-card">
                    <h3>Platform activity</h3>
                    {state.events?.map((ev) => (
                      <details key={ev.id}>
                        <summary>
                          {date(ev.created_at)} · {ev.action}
                        </summary>
                        <pre className="as-evidence">
                          {JSON.stringify(ev.details, null, 2)}
                        </pre>
                      </details>
                    ))}
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
function ResultBreakdown({
  tests,
  brand,
}: {
  tests: Audit["tests"];
  brand: string;
}) {
  if (!tests?.length)
    return (
      <p>
        No configured AI tests ran. No mention or recommendation score is
        available.
      </p>
    );
  const rows = [
    ...[...new Set(tests.map((t) => t.provider))].map((provider) => ({
      label: `Provider: ${provider}`,
      tests: tests.filter((t) => t.provider === provider),
      branded: false,
    })),
    ...[...new Set(tests.map((t) => t.query.category))].map((category) => ({
      label: `Query category: ${category}`,
      tests: tests.filter((t) => t.query.category === category),
      branded: category === "branded",
    })),
  ];
  return (
    <>
      <h4 style={{ marginTop: 25 }}>Provider and query breakdown</h4>
      <p>
        Non-branded observations except the explicitly branded category. Inspect
        individual responses for models, dates, settings and extraction
        evidence.
      </p>
      <div className="as-table-wrap">
        <table className="as-table">
          <thead>
            <tr>
              <th>Panel</th>
              <th>Completed relevant tests</th>
              <th>Mentions</th>
              <th>Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const m = visibilityMetrics(row.tests, brand, row.branded);
              return (
                <tr key={row.label}>
                  <td>
                    {row.label}
                    {row.branded ? " (BRANDED)" : ""}
                  </td>
                  <td>{m.sampleSize}</td>
                  <td>
                    {m.mentionRate === null
                      ? "Not measured"
                      : `${m.mentions}/${m.sampleSize} (${m.mentionRate}%)`}
                  </td>
                  <td>
                    {m.recommendationRate === null
                      ? "Not measured"
                      : `${m.recommendations}/${m.sampleSize} (${m.recommendationRate}%)`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="as-empty">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function QueryEditor({
  audit,
  save,
}: {
  audit: Entity<Audit>;
  save: (path: string, data: unknown) => Promise<unknown>;
}) {
  const [queries, setQueries] = useState(audit.data.queries || []),
    [repetitions, setRepetitions] = useState(audit.data.repetitions || 1),
    [selected, setSelected] = useState(audit.data.providers || []);
  return (
    <details>
      <summary>Review & approve test queries</summary>
      <p>
        Unbranded discovery queries must not contain the customer name. Check
        branded classification and provider settings before approval.
      </p>
      <div className="as-stack" style={{ marginTop: 20 }}>
        {queries.map((q, i) => (
          <div className="as-card" key={q.id}>
            <label className="as-field">
              {q.category} · {q.branded ? "BRANDED" : "NON-BRANDED"}
              <textarea
                rows={2}
                value={q.text}
                onChange={(ev) =>
                  setQueries(
                    queries.map((v, n) =>
                      n === i ? { ...v, text: ev.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <label className="as-check">
              <input
                type="checkbox"
                checked={q.approved}
                onChange={(ev) =>
                  setQueries(
                    queries.map((v, n) =>
                      n === i ? { ...v, approved: ev.target.checked } : v,
                    ),
                  )
                }
              />
              Approved for controlled API tests
            </label>
          </div>
        ))}
      </div>
      <p>Select at most two configured providers:</p>
      {providers.map((p) => (
        <label className="as-check" key={p}>
          <input
            type="checkbox"
            checked={selected.includes(p)}
            onChange={(ev) =>
              setSelected(
                ev.target.checked
                  ? [...selected, p].slice(0, 2)
                  : selected.filter((x) => x !== p),
              )
            }
          />
          {p}
        </label>
      ))}
      <label className="as-field" style={{ marginTop: 20, marginBottom: 20 }}>
        Independent repetitions per query/provider
        <select
          aria-label="Independent repetitions per query/provider"
          value={repetitions}
          onChange={(e) => setRepetitions(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <p>
        {queries.filter((q) => q.approved).length *
          selected.length *
          repetitions}{" "}
        planned API attempts. Organisation and global budgets still apply;
        repetitions do not bypass limits. Small samples are directional.
      </p>
      <button
        className="as-button as-button-secondary"
        disabled={audit.data.status === "approved"}
        onClick={() =>
          void save("queries", {
            auditId: audit.id,
            version: audit.version,
            queries,
            providers: selected,
            repetitions,
          }).catch(() => {})
        }
      >
        Save reviewed suite
      </button>
    </details>
  );
}
