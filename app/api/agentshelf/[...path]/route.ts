import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { currentActor } from "@/lib/agentshelf/auth";
import {
  activity,
  dbConfigured,
  find,
  getDb,
  limit,
  list,
  put,
  type Actor,
  type Entity,
} from "@/lib/agentshelf/db";
import {
  enquiryInput,
  websiteInput,
  integrationStatus,
  packageIds,
} from "@/lib/agentshelf/config";
import { publicUrl } from "@/lib/agentshelf/url";
import { queueEmail, flushMail } from "@/lib/agentshelf/mail";
import {
  approveAudit,
  requestAudit,
  worker,
  scheduleMonitoring,
  hasMonitoring,
  type Audit,
  type Recommendation,
  type Subscription,
} from "@/lib/agentshelf/workflow";
import { providers, querySchema } from "@/lib/agentshelf/intelligence";
import {
  billingPortal,
  checkout,
  processStripeEvent,
  stripeClient,
} from "@/lib/agentshelf/billing";
import { generateReport, type ReportSnapshot } from "@/lib/agentshelf/report";
import { validateFeed } from "@/lib/agentshelf/feed";
import { demoSnapshot } from "@/lib/agentshelf/demo";
import { applyRetention } from "@/lib/agentshelf/retention";
type Context = { params: Promise<{ path: string[] }> };
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
const system: Actor = { userId: "scheduler", orgId: "system", admin: true };
function cronAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET,
    provided = request.headers.get("authorization") || "";
  if (!secret || secret.length < 24) return false;
  const a = Buffer.from(provided),
    b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function boundedText(request: Request, maximum: number) {
  if (Number(request.headers.get("content-length") || 0) > maximum)
    throw new Error("TOO_LARGE: Request too large.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (reader)
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maximum) {
          await reader.cancel();
          throw new Error("TOO_LARGE: Request too large.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  return Buffer.concat(chunks).toString("utf8");
}
async function body(request: Request, maximum = 20000) {
  return JSON.parse(await boundedText(request, maximum));
}
function fail(error: unknown) {
  const message =
    error instanceof z.ZodError
      ? error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 4)
          .join("; ")
      : error instanceof Error
        ? error.message
        : "Request failed";
  const status = message.startsWith("FORBIDDEN")
    ? 403
    : message.startsWith("NOT_FOUND")
      ? 404
      : message.startsWith("SETUP_REQUIRED")
        ? 503
        : message.startsWith("CONFLICT")
          ? 409
          : message.startsWith("TOO_LARGE")
            ? 413
            : 422;
  return json(
    {
      ok: false,
      message: message.startsWith("SETUP_REQUIRED")
        ? "Service setup is pending. Please email yulaversestudio@gmail.com; your submission has not been accepted."
        : message,
    },
    status,
  );
}
export async function GET(request: Request, context: Context) {
  try {
    const path = (await context.params).path.join("/"),
      url = new URL(request.url);
    if (path === "demo-report") {
      const bytes = await generateReport(demoSnapshot);
      return new Response(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            "attachment; filename=AgentShelf-SIMULATED-DEMO.pdf",
          "Cache-Control": "no-store",
        },
      });
    }
    if (path === "health")
      return json({
        ok: true,
        storage: dbConfigured() ? "configured" : "setup-required",
        mode: process.env.VERCEL ? "hosted" : "local",
      });
    if (path === "cron") {
      if (!cronAuthorised(request))
        return json({ message: "Unauthorised" }, 401);
      return json({
        ...(await scheduleMonitoring(system)),
        ...(await worker(system)),
        ...(await flushMail()),
        ...(await applyRetention()),
      });
    }
    const actor = await currentActor(request.headers);
    if (!actor)
      return json(
        { message: "Sign in with a verified email to continue." },
        401,
      );
    const admin = url.searchParams.get("admin") === "1";
    if (admin && !actor.admin)
      return json({ message: "Administrator access required." }, 403);
    const scope = { ...actor, admin };
    if (path === "state") {
      const kinds = [
        "website",
        "audit",
        "recommendation",
        "report",
        "subscription",
        "order",
        "feed",
        "job",
      ];
      const entities: Record<string, Entity[]> = Object.fromEntries(
        await Promise.all(kinds.map(async (k) => [k, await list(scope, k)])),
      );
      if (!admin) {
        entities.audit = entities.audit.map((a) => {
          const d = a.data as unknown as Audit;
          return d.status === "approved"
            ? a
            : {
                ...a,
                data: {
                  websiteId: d.websiteId,
                  status: d.status,
                  queries: d.queries.map((q) => ({
                    ...q,
                    approved: q.approved,
                  })),
                  scopeApproved: d.scopeApproved,
                },
              };
        });
        entities.report = entities.report.filter(
          (r) => (r.data as Record<string, unknown>).approvedAt,
        );
        const approvedIds = new Set(
          entities.audit
            .filter((a) => a.data.status === "approved")
            .map((a) => a.id),
        );
        entities.recommendation = entities.recommendation.filter((r) =>
          approvedIds.has(String(r.data.auditId)),
        );
        delete entities.job;
      }
      let adminData: Record<string, unknown> = {};
      if (admin) {
        const db = await getDb();
        adminData = {
          leads: (
            await db.query(
              "SELECT id,data,created_at FROM as_leads ORDER BY created_at DESC LIMIT 200",
            )
          ).rows,
          customers: (
            await db.query(
              "SELECT o.id,o.name,o.created_at,u.email FROM as_organisations o JOIN as_memberships m ON m.org_id=o.id JOIN as_user u ON u.id=m.user_id LIMIT 300",
            )
          ).rows,
          events: (
            await db.query(
              "SELECT id,org_id,actor,action,details,created_at FROM as_events ORDER BY created_at DESC LIMIT 100",
            )
          ).rows,
          outbox: (
            await db.query(
              "SELECT id,org_id,recipient,subject,state,attempts,error,created_at FROM as_outbox ORDER BY created_at DESC LIMIT 100",
            )
          ).rows,
          integrations: integrationStatus(),
        };
      }
      return json({
        actor: { email: actor.email, admin: actor.admin },
        entities,
        ...adminData,
      });
    }
    if (path.startsWith("reports/")) {
      const id = path.split("/")[1],
        report = await find<ReportSnapshot>(scope, "report", id);
      if (!report || (!report.data.approvedAt && !admin))
        return json({ message: "Report not found." }, 404);
      return new Response(
        Buffer.from(await generateReport(report.data, !report.data.approvedAt)),
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=AgentShelf-report-${report.id}.pdf`,
            "Cache-Control": "private,no-store",
            "X-Robots-Tag": "noindex",
          },
        },
      );
    }
    if (path.startsWith("feeds/")) {
      const record = await find<ReturnType<typeof validateFeed>>(
        scope,
        "feed",
        path.split("/")[1],
      );
      if (!record) return json({ message: "Feed not found" }, 404);
      return new Response(record.data.proposedCsv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            "attachment; filename=agentshelf-proposed-changes.csv",
          "Cache-Control": "private,no-store",
        },
      });
    }
    if (path === "export") {
      const entities = Object.fromEntries(
        await Promise.all(
          [
            "website",
            "audit",
            "recommendation",
            "report",
            "subscription",
            "order",
            "feed",
          ].map(async (kind) => [
            kind,
            await list({ ...actor, admin: false }, kind),
          ]),
        ),
      );
      return new Response(
        JSON.stringify(
          { exportedAt: new Date().toISOString(), entities },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition":
              "attachment; filename=agentshelf-account-export.json",
            "Cache-Control": "private,no-store",
          },
        },
      );
    }
    return json({ message: "Not found" }, 404);
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request, context: Context) {
  const path = (await context.params).path.join("/");
  try {
    if (path === "stripe-webhook") {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret)
        return json({ message: "Stripe webhook not configured" }, 503);
      const payload = await boundedText(request, 1_000_000);
      const signature = request.headers.get("stripe-signature");
      if (!signature) return json({ message: "Signature required" }, 400);
      let event;
      const stripe = stripeClient();
      try {
        event = stripe.webhooks.constructEvent(payload, signature, secret);
      } catch {
        return json({ message: "Invalid Stripe signature" }, 400);
      }
      await processStripeEvent(event, stripe);
      return json({ received: true });
    }
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== new URL(request.url).origin)
      return json({ message: "Same-origin request required" }, 403);
    if (path === "enquiries") {
      const input = enquiryInput.parse(await body(request));
      if (input.companyFax) return json({ message: "Request rejected" }, 400);
      publicUrl(input.website);
      input.competitors.forEach((u) => publicUrl(u));
      const ip =
        request.headers.get("x-vercel-forwarded-for") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "local";
      const hash = createHash("sha256")
        .update(ip + new Date().toISOString().slice(0, 10))
        .digest("hex");
      if (!(await limit(`lead:${hash}`, 5, 3600)))
        return json(
          { message: "Too many requests. Please contact the studio directly." },
          429,
        );
      const id = randomUUID(),
        db = await getDb();
      await db.transaction(async (q) => {
        await q.query("INSERT INTO as_leads(id,data) VALUES($1,$2)", [
          id,
          JSON.stringify({
            ...input,
            email: input.email.toLowerCase(),
            privacyVersion: "2026-10-16",
          }),
        ]);
      });
      await queueEmail(
        input.email,
        "Your Yulaverse Intelligence enquiry",
        `Thank you, ${input.contactName}. Your enquiry for ${input.businessName} is saved under reference ${id}. We will review the scope and contact you before any managed work begins. No payment was taken.`,
      );
      await queueEmail(
        process.env.AGENTSHELF_ALERT_EMAIL || "yulaversestudio@gmail.com",
        "New AgentShelf enquiry",
        `Reference: ${id}\nBusiness: ${input.businessName}\nWebsite: ${input.website}\nPackage: ${input.package}\nSign in to /admin/agentshelf to review the securely stored enquiry.`,
      );
      const delivery = await flushMail();
      return json(
        {
          ok: true,
          id,
          message: `Your enquiry is saved. ${delivery.setupRequired ? "Email confirmation is pending while email delivery is connected." : "Confirmation is queued; the studio can review your saved enquiry even if email delivery is delayed."}`,
        },
        201,
      );
    }
    const actor = await currentActor(request.headers);
    if (!actor)
      return json(
        { message: "Sign in with a verified email to continue." },
        401,
      );
    const data = await body(request, path === "feeds" ? 1_020_000 : 20000);
    if (!(await limit(`mutate:${actor.userId}`, 100, 3600)))
      return json({ message: "Request limit reached" }, 429);
    if (path === "websites") {
      const input = websiteInput.parse(data);
      publicUrl(input.url);
      input.competitors.forEach((u) => publicUrl(u));
      const customer = { ...actor, admin: false };
      if ((await list(customer, "website")).length >= 3)
        throw new Error(
          "The initial platform supports three websites per organisation.",
        );
      return json({ record: await put(customer, "website", input) }, 201);
    }
    if (path === "website-update") {
      const input = z
          .object({
            id: z.string(),
            version: z.number().int(),
            website: websiteInput,
          })
          .parse(data),
        row = await find({ ...actor, admin: actor.admin }, "website", input.id);
      if (!row) throw new Error("NOT_FOUND");
      publicUrl(input.website.url);
      input.website.competitors.forEach((u) => publicUrl(u));
      return json({
        record: await put(
          { ...actor, orgId: row.orgId },
          "website",
          input.website,
          row.id,
          input.version,
        ),
      });
    }
    if (path === "audits") {
      const input = z
        .object({ websiteId: z.string(), scopeApproved: z.literal(true) })
        .parse(data);
      if (!(await limit(`audits:${actor.orgId}`, 5, 86400)))
        return json({ message: "Daily audit request limit reached" }, 429);
      return json(
        {
          record: await requestAudit(
            { ...actor, admin: false },
            input.websiteId,
            input.scopeApproved,
          ),
        },
        201,
      );
    }
    if (path === "recommendations") {
      const input = z
        .object({
          id: z.string(),
          status: z.enum(["open", "completed"]),
          version: z.number().int(),
        })
        .parse(data);
      const row = await find<Recommendation>(
        { ...actor, admin: false },
        "recommendation",
        input.id,
      );
      if (!row) throw new Error("NOT_FOUND");
      return json({
        record: await put(
          { ...actor, admin: false },
          "recommendation",
          { ...row.data, status: input.status },
          row.id,
          input.version,
        ),
      });
    }
    if (path === "feeds") {
      const input = z.object({ csv: z.string().min(1) }).parse(data);
      const feed = validateFeed(input.csv);
      return json(
        { record: await put({ ...actor, admin: false }, "feed", feed) },
        201,
      );
    }
    if (path === "monitoring") {
      const input = z
          .object({
            websiteId: z.string(),
            enabled: z.boolean(),
            version: z.number().int(),
          })
          .parse(data),
        customer = { ...actor, admin: false };
      if (
        input.enabled &&
        !(await list<Subscription>(customer, "subscription")).some((s) =>
          hasMonitoring(s.data),
        )
      )
        throw new Error("An active monitoring subscription is required.");
      const row = await find<Record<string, unknown>>(
        customer,
        "website",
        input.websiteId,
      );
      if (!row) throw new Error("NOT_FOUND");
      if (
        input.enabled &&
        !(await list<Audit>(customer, "audit")).some(
          (a) => a.data.websiteId === row.id && a.data.status === "approved",
        )
      )
        throw new Error(
          "Complete an administrator-reviewed assessment before enabling recurring monitoring.",
        );
      return json({
        record: await put(
          customer,
          "website",
          { ...row.data, monitoringEnabled: input.enabled },
          row.id,
          input.version,
        ),
      });
    }
    if (path === "checkout") {
      const input = z.object({ package: z.enum(packageIds) }).parse(data);
      return json({
        url: await checkout({ ...actor, admin: false }, input.package),
      });
    }
    if (path === "portal")
      return json({ url: await billingPortal({ ...actor, admin: false }) });
    if (!actor.admin)
      return json({ message: "Administrator access required." }, 403);
    if (path === "queries") {
      const input = z
        .object({
          auditId: z.string(),
          version: z.number().int(),
          queries: z
            .array(querySchema)
            .max(12)
            .refine(
              (q) => new Set(q.map((x) => x.id)).size === q.length,
              "Query IDs must be unique.",
            ),
          providers: z
            .array(z.enum(providers))
            .max(2)
            .refine(
              (p) => new Set(p).size === p.length,
              "Providers must be unique.",
            ),
          repetitions: z.number().int().min(1).max(5).default(1),
        })
        .parse(data);
      const audit = await find<Audit>(actor, "audit", input.auditId);
      if (!audit) throw new Error("NOT_FOUND");
      if (audit.data.status === "approved")
        throw new Error("Approved assessments cannot be changed.");
      if (audit.data.tests.length)
        throw new Error(
          "Tests have already started. Request a new assessment to change the query suite.",
        );
      return json({
        record: await put(
          { ...actor, orgId: audit.orgId },
          "audit",
          {
            ...audit.data,
            queries: input.queries,
            providers: input.providers,
            repetitions: input.repetitions,
          },
          audit.id,
          input.version,
        ),
      });
    }
    if (path === "lead-update") {
      const input = z
        .object({
          id: z.string(),
          stage: z.enum(["new", "contacted", "converted", "closed"]),
        })
        .parse(data);
      await (
        await getDb()
      ).query("UPDATE as_leads SET data=data || $1::jsonb WHERE id=$2", [
        JSON.stringify({
          stage: input.stage,
          lastContactAt: new Date().toISOString(),
        }),
        input.id,
      ]);
      await activity(actor, "lead.updated", input);
      return json({ ok: true });
    }
    if (path === "process") {
      await activity(actor, "worker.manual-run");
      return json(await worker(actor));
    }
    if (path === "approve") {
      const input = z.object({ auditId: z.string() }).parse(data);
      return json({ report: await approveAudit(actor, input.auditId) });
    }
    if (path === "retry-email") return json(await flushMail());
    return json({ message: "Not found" }, 404);
  } catch (e) {
    return fail(e);
  }
}
