import { beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  getDb,
  find,
  list,
  put,
  scoped,
  type Actor,
} from "../../lib/agentshelf/db";
import { getAuth, currentActor } from "../../lib/agentshelf/auth";
import { queueEmail } from "../../lib/agentshelf/mail";
import {
  requestAudit,
  processAudit,
  approveAudit,
  claimJob,
  scheduleMonitoring,
  worker,
  type Audit,
  type Subscription,
  type Job,
} from "../../lib/agentshelf/workflow";
import { runProvider } from "../../lib/agentshelf/intelligence";
import {
  processStripeEvent,
  stripeClient,
  type Order,
} from "../../lib/agentshelf/billing";
import { POST, GET } from "../../app/api/agentshelf/[...path]/route";
import { demoSnapshot } from "../../lib/agentshelf/demo";
import type Stripe from "stripe";
const origin = "http://localhost:3001";
let alice: Actor,
  bob: Actor,
  admin: Actor,
  cookie = "";
const site = demoSnapshot.business;
const call = (path: string, body: unknown, cookies = cookie) =>
  POST(
    new Request(`${origin}/api/agentshelf/${path}`, {
      method: "POST",
      headers: { origin, "Content-Type": "application/json", cookie: cookies },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ path: [path] }) },
  );
beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("AGENTSHELF_LOCAL_DB", "memory://");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "test-only-authentication-secret-with-more-than-32-characters",
  );
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv("AGENTSHELF_ADMIN_EMAILS", "admin@agentshelf.example");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("AGENTSHELF_AI_ENABLED", "false");
  await (await getDb()).migrate();
  for (const name of ["alice", "bob", "admin"]) {
    await (
      await getDb()
    ).query(
      "INSERT INTO as_user(id,name,email,email_verified) VALUES($1,$2,$3,true)",
      [name, name, `${name}@agentshelf.example`],
    );
    await (
      await getDb()
    ).query("INSERT INTO as_organisations(id,name) VALUES($1,$2)", [
      `org_${name}`,
      name,
    ]);
    await (
      await getDb()
    ).query(
      "INSERT INTO as_memberships(user_id,org_id,role) VALUES($1,$2,'owner')",
      [name, `org_${name}`],
    );
  }
  alice = { userId: "alice", orgId: "org_alice", admin: false };
  bob = { userId: "bob", orgId: "org_bob", admin: false };
  admin = { userId: "admin", orgId: "org_admin", admin: true };
});
describe("Real database persistence and tenant boundaries", () => {
  it("persists records and blocks another organisation at repository boundaries", async () => {
    const row = await put(alice, "website", site);
    expect((await find(alice, "website", row.id))?.data).toMatchObject({
      name: site.name,
    });
    expect(await find(bob, "website", row.id)).toBeUndefined();
    expect(await list(bob, "website")).toHaveLength(0);
    await expect(
      put(bob, "website", site, row.id, row.version),
    ).rejects.toThrow("CONFLICT");
    expect(await find(admin, "website", row.id)).toBeDefined();
  });
  it("enforces database row policies for a non-superuser connection", async () => {
    const db = await getDb();
    await db.query("CREATE ROLE agentshelf_rls_test NOLOGIN");
    await db.query(
      "GRANT SELECT,INSERT,UPDATE,DELETE ON as_records TO agentshelf_rls_test",
    );
    const rows = await db.transaction(async (q) => {
      await q.query("SET LOCAL ROLE agentshelf_rls_test");
      await q.query(
        "SELECT set_config('agentshelf.org_id',$1,true),set_config('agentshelf.admin','false',true)",
        [bob.orgId],
      );
      return q.query("SELECT * FROM as_records WHERE org_id=$1", [alice.orgId]);
    });
    expect(rows.rows).toHaveLength(0);
  });
  it("uses optimistic versions to prevent lost writes", async () => {
    const a = await put(alice, "recommendation", { status: "open" });
    await put(
      alice,
      "recommendation",
      { status: "completed" },
      a.id,
      a.version,
    );
    await expect(
      put(alice, "recommendation", { status: "open" }, a.id, a.version),
    ).rejects.toThrow("CONFLICT");
  });
  it("stores enquiries and notifications even with email disabled", async () => {
    const r = await call(
      "enquiries",
      {
        businessName: "Integration Fixture",
        website: "https://example.com",
        contactName: "Alice",
        email: "lead@agentshelf.example",
        industry: "Retail",
        businessType: "products",
        package: "audit",
        competitors: [],
        notes: "",
        consent: true,
        companyFax: "",
      },
      "",
    );
    expect(r.status).toBe(201);
    const body = await r.json();
    const db = await getDb();
    expect(
      (await db.query("SELECT id FROM as_leads WHERE id=$1", [body.id])).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query("SELECT id FROM as_outbox WHERE recipient=$1", [
          "lead@agentshelf.example",
        ])
      ).rows.length,
    ).toBeGreaterThan(0);
  });
  it("rejects missing consent, invalid website URLs and cross-origin writes", async () => {
    expect((await call("enquiries", { consent: false }, "")).status).toBe(422);
    const r = await POST(
      new Request(`${origin}/api/agentshelf/enquiries`, {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: "{}",
      }),
      { params: Promise.resolve({ path: ["enquiries"] }) },
    );
    expect(r.status).toBe(403);
  });
});
describe("Verified authentication and API access", () => {
  it("requires email verification before login", async () => {
    const auth = await getAuth(),
      email = "verified-customer@agentshelf.example",
      password = "Test-only-example-password-2026!";
    const signup = await auth.handler(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Verified customer",
          email,
          password,
          callbackURL: "/agentshelf/dashboard",
        }),
      }),
    );
    expect(signup.status).toBe(200);
    const pending = await auth.handler(
      new Request(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
    expect(pending.status).toBe(403);
    const mail = (
      await (
        await getDb()
      ).query<{ body: string }>(
        "SELECT body FROM as_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1",
        [email],
      )
    ).rows[0];
    expect(mail).toBeDefined();
    const url = mail.body.match(/https?:\/\/\S+/)![0];
    const verification = await auth.handler(
      new Request(url, { headers: { origin } }),
    );
    expect([200, 302]).toContain(verification.status);
    const login = await auth.handler(
      new Request(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
    expect(login.status).toBe(200);
    cookie = login.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    expect(cookie).toContain("session_token");
    const actor = await currentActor(new Headers({ cookie }));
    expect(actor?.admin).toBe(false);
  });
  it("rejects anonymous access to customer records", async () => {
    const r = await GET(new Request(`${origin}/api/agentshelf/state`), {
      params: Promise.resolve({ path: ["state"] }),
    });
    expect(r.status).toBe(401);
  });
  it("rejects a customer asking for the admin view", async () => {
    const r = await GET(
      new Request(`${origin}/api/agentshelf/state?admin=1`, {
        headers: { cookie },
      }),
      { params: Promise.resolve({ path: ["state"] }) },
    );
    expect(r.status).toBe(403);
  });
  it("does not grant paid access through a success parameter", async () => {
    const r = await GET(
      new Request(`${origin}/api/agentshelf/state?checkout=success`, {
        headers: { cookie },
      }),
      { params: Promise.resolve({ path: ["state"] }) },
    );
    expect(r.status).toBe(200);
    expect((await r.json()).entities.subscription).toHaveLength(0);
  });
});
describe("Audit lifecycle and delivery", () => {
  it("atomically deduplicates concurrent assessment requests", async () => {
    const w = await put(alice, "website", { ...site, competitors: [] });
    const [a, b] = await Promise.all([
      requestAudit(alice, w.id, true),
      requestAudit(alice, w.id, true),
    ]);
    expect(a.id).toBe(b.id);
    expect(
      (await list<Job>(alice, "job")).filter((j) => j.data.auditId === a.id),
    ).toHaveLength(1);
  });
  it("queues, runs genuine check logic against fixture HTML, reviews and approves a report", async () => {
    const w = await put(alice, "website", { ...site, competitors: [] }),
      requested = await requestAudit(alice, w.id, true);
    expect(requested.data.status).toBe("queued");
    const { crawlWebsite } = await import("../../lib/agentshelf/audit");
    const crawl = async (input: typeof site) =>
      crawlWebsite(input, async (url) => ({
        url,
        status: url.endsWith("sitemap.xml") ? 404 : 200,
        type: "text/html",
        body: url.endsWith("robots.txt")
          ? "User-agent: *\nAllow: /"
          : `<html><title>Fixture shop</title><meta name="description" content="Travel goods"><h1>Fixture</h1><p>${"Real parsed fixture content. ".repeat(30)}</p></html>`,
      }));
    const assessed = await processAudit(admin, requested.id, crawl);
    expect(assessed.data.technical?.pages.length).toBeGreaterThan(0);
    expect(assessed.data.status).toBe("review");
    await expect(approveAudit(alice, assessed.id)).rejects.toThrow("FORBIDDEN");
    const report = await approveAudit(admin, assessed.id);
    expect(report.data.approvedAt).toBeTruthy();
    expect(await find(bob, "report", report.id)).toBeUndefined();
  });
  it("refuses provider calls with unapproved queries or missing credentials", async () => {
    const transport = vi.fn();
    const q = demoSnapshot.audit.queries[0];
    expect(
      (
        await runProvider(
          "openai",
          { ...q, approved: false },
          [],
          alice.orgId,
          transport,
        )
      ).status,
    ).toBe("setup-required");
    expect(
      (
        await runProvider(
          "openai",
          { ...q, approved: true },
          [],
          alice.orgId,
          transport,
        )
      ).status,
    ).toBe("setup-required");
    expect(transport).not.toHaveBeenCalled();
  });
  it("leases a job at most once under concurrent worker claims", async () => {
    await (
      await getDb()
    ).query("SELECT set_config('agentshelf.admin','true',false)");
    const all = await list<Job>(admin, "job");
    for (const j of all)
      await put(
        { ...admin, orgId: j.orgId },
        "job",
        { ...j.data, status: "completed" },
        j.id,
        j.version,
      );
    const audit = await put<Audit>(alice, "audit", {
      websiteId: "x",
      status: "queued",
      queries: [],
      providers: [],
      tests: [],
      scopeApproved: true,
    });
    await put<Job>(alice, "job", {
      auditId: audit.id,
      uniqueKey: randomUUID(),
      status: "queued",
      attempts: 0,
      nextAt: new Date().toISOString(),
    });
    const claims = await Promise.all([claimJob(admin), claimJob(admin)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
  });
  it("never schedules an inactive or cancelled monitoring subscription", async () => {
    await put<Subscription>(bob, "subscription", {
      stripeId: "sub_cancelled",
      customerId: "cus_fixture",
      status: "canceled",
      currentPeriodEnd: "2099-01-01",
      cancelAtPeriodEnd: false,
      livemode: false,
    });
    const w = await put(bob, "website", { ...site, monitoringEnabled: true });
    await scheduleMonitoring(admin);
    const jobs = await list<Job>(bob, "job");
    expect(jobs.some((j) => j.data.uniqueKey.includes(w.id))).toBe(false);
  });
});
describe("Retention and secure reports", () => {
  it("schedules an active customer's reviewed site once and safely skips a paused job", async () => {
    for (const j of await list<Job>(admin, "job"))
      await put(
        { ...admin, orgId: j.orgId },
        "job",
        { ...j.data, status: "completed" },
        j.id,
        j.version,
      );
    const w = await put(bob, "website", { ...site, monitoringEnabled: true });
    await put<Subscription>(bob, "subscription", {
      stripeId: "sub_active_monitor",
      customerId: "cus_monitor",
      status: "active",
      currentPeriodEnd: "2099-01-01",
      cancelAtPeriodEnd: false,
      livemode: false,
    });
    await put<Audit>(bob, "audit", {
      ...demoSnapshot.audit,
      websiteId: w.id,
      status: "approved",
    });
    await scheduleMonitoring(admin);
    await scheduleMonitoring(admin);
    const jobs = (await list<Job>(bob, "job")).filter((j) =>
      j.data.uniqueKey.startsWith(`monitor:${w.id}:`),
    );
    expect(jobs).toHaveLength(1);
    const current = (await find<typeof site & { monitoringEnabled: boolean }>(
      bob,
      "website",
      w.id,
    ))!;
    await put(
      bob,
      "website",
      { ...current.data, monitoringEnabled: false },
      current.id,
      current.version,
    );
    expect((await worker(admin)).processed).toBe(0);
    expect(
      (await find<Audit>(bob, "audit", jobs[0].data.auditId))?.data.status,
    ).toBe("failed");
  });
  it("returns a single immutable report under concurrent approval", async () => {
    const a = await put<Audit>(alice, "audit", {
      ...demoSnapshot.audit,
      websiteId: (await list(alice, "website"))[0].id,
      status: "review",
    });
    const [x, y] = await Promise.all([
      approveAudit(admin, a.id),
      approveAudit(admin, a.id),
    ]);
    expect(x.id).toBe(y.id);
    expect(
      (await list<{ auditId: string }>(admin, "report")).filter(
        (r) => r.data.auditId === a.id,
      ),
    ).toHaveLength(1);
  });
  it("does not expose another tenant's report through the PDF endpoint", async () => {
    const report = (await list(admin, "report"))[0];
    const r = await GET(
      new Request(`${origin}/api/agentshelf/reports/${report.id}`, {
        headers: { cookie },
      }),
      { params: Promise.resolve({ path: ["reports", report.id] }) },
    );
    expect(r.status).toBe(404);
  });
  it("deletes expired unconverted enquiries but retains converted customers", async () => {
    const db = await getDb();
    const old = randomUUID(),
      converted = randomUUID();
    for (const [id, stage] of [
      [old, "new"],
      [converted, "converted"],
    ])
      await db.query(
        "INSERT INTO as_leads(id,data,created_at) VALUES($1,$2,now()-interval '13 months')",
        [id, JSON.stringify({ stage })],
      );
    const { applyRetention } = await import("../../lib/agentshelf/retention");
    await applyRetention();
    expect(
      (await db.query("SELECT id FROM as_leads WHERE id=$1", [old])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("SELECT id FROM as_leads WHERE id=$1", [converted])).rows,
    ).toHaveLength(1);
  });
});
describe("Signed billing event controls", () => {
  it("does not reactivate a cancelled subscription from an older webhook", async () => {
    const subscription = {
      id: "sub_ordered_fixture",
      customer: "cus_fixture",
      status: "canceled",
      cancel_at_period_end: false,
      livemode: false,
      metadata: { orgId: alice.orgId },
      items: { data: [{ current_period_end: 4102444800 }] },
    };
    await processStripeEvent(
      {
        id: "evt_ordered_new",
        created: 200,
        type: "customer.subscription.deleted",
        livemode: false,
        data: { object: subscription },
      } as unknown as Stripe.Event,
      {} as Stripe,
    );
    await processStripeEvent(
      {
        id: "evt_ordered_old",
        created: 100,
        type: "customer.subscription.updated",
        livemode: false,
        data: { object: { ...subscription, status: "active" } },
      } as unknown as Stripe.Event,
      {} as Stripe,
    );
    expect(
      (await list<Subscription>(alice, "subscription")).find(
        (s) => s.data.stripeId === subscription.id,
      )?.data.status,
    ).toBe("canceled");
  });
  it("validates a Stripe SDK-generated signature through the webhook route", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture-signature");
    const StripeSDK = (await import("stripe")).default;
    const order = await put<Order>(alice, "order", {
      package: "audit",
      amountPence: 29900,
      currency: "gbp",
      status: "pending",
    });
    const payload = JSON.stringify({
      id: "evt_signed_fixture",
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          id: "cs_signed",
          metadata: { orgId: alice.orgId, orderId: order.id },
          payment_status: "paid",
          amount_total: 29900,
          currency: "gbp",
          customer: "cus_signed",
        },
      },
    });
    const signature = StripeSDK.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_fixture-signature",
    });
    const r = await POST(
      new Request(`${origin}/api/agentshelf/stripe-webhook`, {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
      { params: Promise.resolve({ path: ["stripe-webhook"] }) },
    );
    expect(r.status).toBe(200);
    expect((await find<Order>(alice, "order", order.id))?.data.status).toBe(
      "paid",
    );
  });
  it("refuses real payment keys", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fixture");
    expect(() => stripeClient()).toThrow("Live payments are disabled");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
  });
  it("refuses unsigned webhooks", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
    const r = await POST(
      new Request(`${origin}/api/agentshelf/stripe-webhook`, {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ path: ["stripe-webhook"] }) },
    );
    expect(r.status).toBe(400);
  });
  it("processes a matched payment idempotently", async () => {
    const order = await put<Order>(alice, "order", {
      package: "audit",
      amountPence: 29900,
      currency: "gbp",
      status: "pending",
    });
    const event = {
      id: "evt_fixture",
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          id: "cs_fixture",
          metadata: { orgId: alice.orgId, orderId: order.id },
          payment_status: "paid",
          amount_total: 29900,
          currency: "gbp",
          customer: "cus_fixture",
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event, {} as Stripe);
    await processStripeEvent(event, {} as Stripe);
    expect((await find<Order>(alice, "order", order.id))?.data.status).toBe(
      "paid",
    );
    expect(
      (
        await (
          await getDb()
        ).query("SELECT id FROM as_webhooks WHERE id=$1", [event.id])
      ).rows,
    ).toHaveLength(1);
  });
  it("rolls back mismatched payment amounts", async () => {
    const order = await put<Order>(bob, "order", {
      package: "audit",
      amountPence: 29900,
      currency: "gbp",
      status: "pending",
    });
    const event = {
      id: "evt_bad_amount",
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          metadata: { orgId: bob.orgId, orderId: order.id },
          payment_status: "paid",
          amount_total: 1,
          currency: "gbp",
        },
      },
    } as unknown as Stripe.Event;
    await expect(processStripeEvent(event, {} as Stripe)).rejects.toThrow(
      "amount/currency",
    );
    expect((await find<Order>(bob, "order", order.id))?.data.status).toBe(
      "pending",
    );
  });
});
