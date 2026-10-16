import { randomUUID } from "node:crypto";
import {
  activity,
  find,
  getDb,
  list,
  put,
  scoped,
  type Actor,
  type Entity,
} from "./db";
import {
  classifyBusiness,
  crawlWebsite,
  type TechnicalAudit,
  type Website,
} from "./audit";
import {
  suggestedQueries,
  runProvider,
  visibilityMetrics,
  meaningfulChange,
  type TestQuery,
  type TestResult,
  type Provider,
} from "./intelligence";
import { appUrl } from "./config";
import { auditAlerts } from "./alerts";
export type Audit = {
  websiteId: string;
  status: "queued" | "running" | "review" | "approved" | "failed";
  queries: TestQuery[];
  providers: Provider[];
  technical?: TechnicalAudit;
  competitors?: { name: string; url: string; technical: TechnicalAudit }[];
  tests: TestResult[];
  classificationSuggestion?: string;
  error?: string;
  scopeApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  estimatedCostUsd?: number;
  repetitions?: number;
};
export type Recommendation = {
  auditId: string;
  priority: "high" | "medium" | "low";
  title: string;
  evidence: string;
  why: string;
  fix: string;
  effort: string;
  confidence: string;
  status: "open" | "completed";
};
export type Subscription = {
  stripeId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  livemode: boolean;
  stripeEventCreated?: number;
};
export type Job = {
  auditId: string;
  uniqueKey: string;
  status: "queued" | "running" | "completed" | "failed";
  attempts: number;
  nextAt: string;
  leaseUntil?: string;
  leaseOwner?: string;
  error?: string;
};
export function hasMonitoring(s: Subscription | undefined, now = Date.now()) {
  return Boolean(
    s &&
    ["active", "trialing"].includes(s.status) &&
    new Date(s.currentPeriodEnd).getTime() > now,
  );
}
export async function requestAudit(
  actor: Actor,
  websiteId: string,
  scopeApproved: boolean,
  monitoringKey?: string,
) {
  const site = await find<Website>(actor, "website", websiteId);
  if (!site) throw new Error("NOT_FOUND: Website not found.");
  if (!scopeApproved)
    throw new Error("Confirm the audit scope before requesting an assessment.");
  const target = { ...actor, orgId: site.orgId };
  const data: Audit = {
    websiteId,
    status: "queued",
    queries: suggestedQueries(site.data),
    providers: [],
    tests: [],
    scopeApproved,
  };
  const id = await scoped(target, async (q) => {
    await q.query(
      "SELECT id FROM as_records WHERE id=$1 AND org_id=$2 AND kind='website' FOR UPDATE",
      [websiteId, site.orgId],
    );
    const existing = await q.query<{ id: string }>(
      "SELECT id FROM as_records WHERE org_id=$1 AND kind='audit' AND data->>'websiteId'=$2 AND data->>'status' IN ('queued','running') ORDER BY created_at DESC LIMIT 1",
      [site.orgId, websiteId],
    );
    if (existing.rows[0]) return existing.rows[0].id;
    if (monitoringKey) {
      const done = await q.query<{ data: Job }>(
        "SELECT data FROM as_records WHERE kind='job' AND org_id=$1 AND data->>'uniqueKey'=$2",
        [site.orgId, monitoringKey],
      );
      if (done.rows[0]) return done.rows[0].data.auditId;
    }
    const auditId = randomUUID();
    await q.query(
      "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,'audit',$3)",
      [auditId, site.orgId, JSON.stringify(data)],
    );
    await q.query(
      "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,'job',$3)",
      [
        randomUUID(),
        site.orgId,
        JSON.stringify({
          auditId,
          uniqueKey: monitoringKey || `audit:${auditId}`,
          status: "queued",
          attempts: 0,
          nextAt: new Date().toISOString(),
        } satisfies Job),
      ],
    );
    return auditId;
  });
  await activity(actor, "audit.requested", { auditId: id, websiteId });
  return (await find<Audit>(target, "audit", id))!;
}
export async function processAudit(
  actor: Actor,
  auditId: string,
  crawler = crawlWebsite,
) {
  if (!actor.admin) throw new Error("FORBIDDEN: Administrator required.");
  let record = await find<Audit>(actor, "audit", auditId);
  if (!record) throw new Error("NOT_FOUND: Audit not found.");
  if (record.data.status === "approved")
    throw new Error(
      "Approved audits are immutable. Create a follow-up assessment.",
    );
  const tenant = { ...actor, orgId: record.orgId };
  const website = await find<Website>(tenant, "website", record.data.websiteId);
  if (!website) throw new Error("Website no longer exists.");
  record = await put(
    tenant,
    "audit",
    { ...record.data, status: "running" as const },
    record.id,
    record.version,
  );
  try {
    const technical = record.data.technical || (await crawler(website.data));
    const competitors: NonNullable<Audit["competitors"]> = [
      ...(record.data.competitors || []),
    ];
    const deadline = Date.now() + 145000;
    for (const url of website.data.competitors) {
      if (competitors.some((c) => c.url === url)) continue;
      if (Date.now() > deadline) break;
      try {
        const name = new URL(url).hostname.replace(/^www\./, "");
        competitors.push({
          name,
          url,
          technical: await crawler(
            { ...website.data, name, url },
            undefined,
            3,
          ),
        });
      } catch (e) {
        await activity(tenant, "competitor.failed", {
          auditId,
          error: e instanceof Error ? e.message : "Unavailable",
        });
      }
    }
    record = await put(
      tenant,
      "audit",
      { ...record.data, technical, competitors },
      record.id,
      record.version,
    );
    const tests: TestResult[] = [...record.data.tests];
    const brands = [
      { name: website.data.name, aliases: website.data.aliases },
      ...competitors.map((c) => ({
        name: c.name,
        aliases: [c.name.split(".")[0]],
      })),
    ];
    let executed = 0,
      deferred = false;
    for (
      let repetition = 1;
      repetition <= Math.min(5, Math.max(1, record.data.repetitions || 1));
      repetition++
    )
      for (const provider of record.data.providers.slice(0, 2))
        for (const query of record.data.queries
          .filter((q) => q.approved)
          .slice(0, 12)) {
          if (
            tests.some(
              (t) =>
                t.provider === provider &&
                t.query.id === query.id &&
                (t.repetition || 1) === repetition &&
                ["completed", "failed", "setup-required"].includes(t.status),
            )
          )
            continue;
          if (executed >= 2 || Date.now() > deadline) {
            deferred = true;
            continue;
          }
          const pending: TestResult = {
            repetition,
            query,
            provider,
            model: "pending",
            timestamp: new Date().toISOString(),
            locale: "en-GB",
            settings: { search: false, maxOutputTokens: 600 },
            status: "failed",
            response: "",
            citations: [],
            mentions: [],
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
            error:
              "Attempt reserved; execution outcome unknown if interrupted. Admin review required before a paid rerun.",
          };
          tests.push(pending);
          record = await put(
            tenant,
            "audit",
            { ...record.data, tests: [...tests] },
            record.id,
            record.version,
          );
          tests[tests.length - 1] = {
            ...(await runProvider(provider, query, brands, record.orgId)),
            repetition,
          };
          record = await put(
            tenant,
            "audit",
            { ...record.data, tests: [...tests] },
            record.id,
            record.version,
          );
          executed++;
          await new Promise((r) => setTimeout(r, 1000));
        }
    const data: Audit = {
      ...record.data,
      status: deferred ? "queued" : "review",
      technical,
      competitors,
      tests,
      classificationSuggestion: classifyBusiness(technical.pages),
      estimatedCostUsd: tests.reduce((n, t) => n + t.estimatedCostUsd, 0),
    };
    const result = await put(tenant, "audit", data, record.id, record.version);
    record = result;
    if (deferred) return result;
    const oldRecommendations = (
      await list<Recommendation>(tenant, "recommendation")
    ).filter((r) => r.data.auditId === auditId);
    for (const check of technical.checks
      .filter((c) => c.status === "fail" || c.status === "warning")
      .slice(0, 20)) {
      if (
        oldRecommendations.some(
          (r) => r.data.evidence === `${check.url}: ${check.evidence}`,
        )
      )
        continue;
      await put<Recommendation>(tenant, "recommendation", {
        auditId,
        priority: check.status === "fail" ? "high" : "medium",
        title: `Review ${check.label.toLowerCase()}`,
        evidence: `${check.url}: ${check.evidence}`,
        why: "Clear, accessible and consistent information helps discovery systems and people understand the business. This does not guarantee recommendations.",
        fix: `Review the observed ${check.label.toLowerCase()} issue and update the relevant public information. Re-run the assessment after publishing.`,
        effort: check.key.startsWith("jsonld")
          ? "Developer review"
          : "Content or developer review",
        confidence:
          "Observed website evidence; impact on AI recommendations is unproven.",
        status: "open",
      });
    }
    await activity(tenant, "audit.ready-for-review", { auditId });
    return result;
  } catch (e) {
    await put(
      tenant,
      "audit",
      {
        ...record.data,
        status: "failed",
        error: e instanceof Error ? e.message : "Audit failed",
      },
      record.id,
      record.version,
    );
    throw e;
  }
}
export async function approveAudit(actor: Actor, id: string) {
  if (!actor.admin) throw new Error("FORBIDDEN: Administrator required.");
  const result = await scoped(actor, async (q) => {
    const audit = (
      await q.query<{ org_id: string; data: Audit }>(
        "SELECT org_id,data FROM as_records WHERE id=$1 AND kind='audit' FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!audit) throw new Error("NOT_FOUND: Assessment not found.");
    const existing = (
      await q.query<{ id: string }>(
        "SELECT id FROM as_records WHERE kind='report' AND org_id=$1 AND data->>'auditId'=$2",
        [audit.org_id, id],
      )
    ).rows[0];
    if (audit.data.status === "approved" && existing)
      return { id: existing.id, orgId: audit.org_id };
    if (!audit.data.technical || audit.data.status !== "review")
      throw new Error("Only assessed reports awaiting review can be approved.");
    const site = (
      await q.query<{ data: Website }>(
        "SELECT data FROM as_records WHERE kind='website' AND id=$1 AND org_id=$2",
        [audit.data.websiteId, audit.org_id],
      )
    ).rows[0];
    if (!site) throw new Error("Website missing.");
    const recommendations = (
      await q.query<{ data: Recommendation }>(
        "SELECT data FROM as_records WHERE kind='recommendation' AND org_id=$1 AND data->>'auditId'=$2",
        [audit.org_id, id],
      )
    ).rows;
    const approvedAt = new Date().toISOString(),
      reportId = randomUUID(),
      approved = {
        ...audit.data,
        status: "approved" as const,
        approvedAt,
        approvedBy: actor.userId,
      };
    await q.query(
      "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,'report',$3)",
      [
        reportId,
        audit.org_id,
        JSON.stringify({
          auditId: id,
          business: site.data,
          audit: approved,
          recommendations: recommendations.map((r) => r.data),
          approvedAt,
        }),
      ],
    );
    await q.query(
      "UPDATE as_records SET data=$1,version=version+1,updated_at=now() WHERE id=$2",
      [JSON.stringify(approved), id],
    );
    const previous = (
      await q.query<{ data: Audit }>(
        "SELECT data FROM as_records WHERE kind='audit' AND org_id=$1 AND id<>$2 AND data->>'websiteId'=$3 AND data->>'status'='approved' ORDER BY created_at DESC LIMIT 1",
        [audit.org_id, id, audit.data.websiteId],
      )
    ).rows[0];
    const alerts = previous
      ? auditAlerts(previous.data, approved, site.data.name)
      : [];
    const recipients = (
      await q.query<{ email: string }>(
        "SELECT u.email FROM as_user u JOIN as_memberships m ON m.user_id=u.id WHERE m.org_id=$1 AND u.email_verified=true",
        [audit.org_id],
      )
    ).rows;
    for (const u of recipients)
      await q.query(
        "INSERT INTO as_outbox(id,org_id,recipient,subject,body) VALUES($1,$2,$3,$4,$5)",
        [
          randomUUID(),
          audit.org_id,
          u.email,
          alerts.length
            ? "Your AgentShelf report and evidence-backed changes"
            : "Your AgentShelf assessment is ready",
          `Your reviewed assessment is ready. Sign in at ${appUrl()}/agentshelf/reports${alerts.length ? "\n\nChanges to review:\n" + alerts.join("\n\n") : ""}`,
        ],
      );
    if (alerts.length)
      await q.query(
        "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,'notification',$3)",
        [
          randomUUID(),
          audit.org_id,
          JSON.stringify({
            auditId: id,
            reportId,
            messages: alerts,
            createdAt: approvedAt,
          }),
        ],
      );
    await q.query(
      "INSERT INTO as_events(id,org_id,actor,action,details) VALUES($1,$2,$3,'report.approved',$4)",
      [
        randomUUID(),
        audit.org_id,
        actor.userId,
        JSON.stringify({ auditId: id, reportId, alerts: alerts.length }),
      ],
    );
    return { id: reportId, orgId: audit.org_id };
  });
  return (await find<import("./report").ReportSnapshot>(
    { ...actor, orgId: result.orgId },
    "report",
    result.id,
  ))!;
}
export async function claimJob(actor: Actor) {
  if (!actor.admin) throw new Error("FORBIDDEN");
  return scoped(actor, async (q) => {
    const { rows } = await q.query<{ id: string; org_id: string; data: Job }>(
      "SELECT id,org_id,data FROM as_records WHERE kind='job' AND data->>'status' IN ('queued','failed','running') AND (data->>'nextAt')::timestamptz<=now() AND COALESCE((data->>'attempts')::int,0)<3 AND (data->>'leaseUntil' IS NULL OR (data->>'leaseUntil')::timestamptz<now()) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED",
    );
    if (!rows[0]) return null;
    const row = rows[0],
      owner = randomUUID(),
      data = {
        ...row.data,
        status: "running",
        attempts: row.data.attempts + (row.data.status === "running" ? 1 : 0),
        leaseOwner: owner,
        leaseUntil: new Date(Date.now() + 10 * 60000).toISOString(),
      };
    await q.query(
      "UPDATE as_records SET data=$1,version=version+1,updated_at=now() WHERE id=$2",
      [JSON.stringify(data), row.id],
    );
    return { ...row, data: data as Job };
  });
}
export async function worker(actor: Actor) {
  const job = await claimJob(actor);
  if (!job) return { processed: 0 };
  const tenant = { ...actor, orgId: job.org_id };
  try {
    if (job.data.uniqueKey.startsWith("monitor:")) {
      const subscriptions = await list<Subscription>(
        { ...tenant, admin: false },
        "subscription",
      );
      const audit = await find<Audit>(tenant, "audit", job.data.auditId);
      const site =
        audit &&
        (await find<Website & { monitoringEnabled?: boolean }>(
          tenant,
          "website",
          audit.data.websiteId,
        ));
      if (
        !subscriptions.some((s) => hasMonitoring(s.data)) ||
        !site?.data.monitoringEnabled
      ) {
        if (audit && audit.data.status !== "approved")
          await put(
            tenant,
            "audit",
            {
              ...audit.data,
              status: "failed",
              error:
                "Monitoring paused or subscription inactive; no provider requests made.",
            },
            audit.id,
            audit.version,
          );
        await complete(
          "completed",
          "Monitoring was paused or access expired before execution; no provider requests made.",
        );
        return { processed: 0 };
      }
    }
    const result = await processAudit(tenant, job.data.auditId);
    await complete(result.data.status === "queued" ? "queued" : "completed");
    return { processed: 1, deferred: result.data.status === "queued" };
  } catch (e) {
    await complete("failed", e instanceof Error ? e.message : "Job failed");
    return { processed: 0, error: "Job failed; inspect admin logs." };
  }
  async function complete(status: Job["status"], error?: string) {
    await scoped(tenant, (q) =>
      q.query(
        "UPDATE as_records SET data=$1,version=version+1,updated_at=now() WHERE id=$2 AND data->>'leaseOwner'=$3",
        [
          JSON.stringify({
            ...job!.data,
            status,
            error,
            attempts: job!.data.attempts + (status === "failed" ? 1 : 0),
            leaseUntil: null,
            nextAt: new Date(Date.now() + 15 * 60000).toISOString(),
          }),
          job!.id,
          job!.data.leaseOwner,
        ],
      ),
    );
  }
}
export async function scheduleMonitoring(system: Actor) {
  if (!system.admin) throw new Error("FORBIDDEN");
  let scheduled = 0;
  const subscriptions = (
    await list<Subscription>(system, "subscription")
  ).filter((s) => hasMonitoring(s.data));
  for (const subscription of subscriptions) {
    const actor = { ...system, orgId: subscription.orgId, admin: false };
    const sites = await list<
      Website & { monitoringEnabled?: boolean; nextRunAt?: string }
    >(actor, "website");
    for (const site of sites
      .filter(
        (w) =>
          w.data.monitoringEnabled &&
          (!w.data.nextRunAt ||
            new Date(w.data.nextRunAt).getTime() <= Date.now()),
      )
      .slice(0, 3)) {
      const period = new Date().toISOString().slice(0, 7),
        uniqueKey = `monitor:${site.id}:${period}`;
      if (
        (await list<Job>(actor, "job")).some(
          (j) => j.data.uniqueKey === uniqueKey,
        )
      )
        continue;
      const last = (await list<Audit>(actor, "audit")).find(
        (a) => a.data.websiteId === site.id && a.data.status === "approved",
      );
      if (!last) continue;
      const audit = await requestAudit(actor, site.id, true, uniqueKey);
      if (audit.data.tests.length || audit.data.status !== "queued") continue;
      if (last)
        await put(
          actor,
          "audit",
          {
            ...audit.data,
            queries: last.data.queries.filter((q) => q.approved),
            providers: last.data.providers,
            repetitions: last.data.repetitions || 1,
          },
          audit.id,
          audit.version,
        );
      const days = Math.max(
        28,
        Number(process.env.AGENTSHELF_MONITORING_DAYS || 30),
      );
      await put(
        actor,
        "website",
        {
          ...site.data,
          nextRunAt: new Date(Date.now() + days * 86400000).toISOString(),
        },
        site.id,
        site.version,
      );
      scheduled++;
    }
  }
  return { scheduled };
}
export { visibilityMetrics, meaningfulChange };
