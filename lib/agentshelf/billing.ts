import Stripe from "stripe";
import { getDb, list, put, activity, type Actor } from "./db";
import { packages, appUrl, type PackageId } from "./config";
import type { Subscription } from "./workflow";
import { randomUUID } from "node:crypto";
export type Order = {
  package: PackageId;
  amountPence: number;
  currency: "gbp";
  status: "pending" | "paid" | "cancelled" | "failed";
  checkoutId?: string;
  customerId?: string;
  paymentIntent?: string;
  invoiceUrl?: string;
  livemode?: boolean;
};
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("SETUP_REQUIRED: Stripe is not connected.");
  if (!key.startsWith("sk_test_"))
    throw new Error(
      "Live payments are disabled. Obtain separate authorisation before enabling real charges.",
    );
  return new Stripe(key, { maxNetworkRetries: 1, timeout: 15000 });
}
export async function checkout(actor: Actor, id: PackageId) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    throw new Error(
      "SETUP_REQUIRED: Configure signed Stripe webhook delivery before starting checkout.",
    );
  const pack = packages().find((p) => p.id === id);
  if (!pack) throw new Error("Unknown package");
  const stripe = stripeClient();
  const order = await put<Order>(actor, "order", {
    package: id,
    amountPence: pack.pence,
    currency: "gbp",
    status: "pending",
    livemode: false,
  });
  const session = await stripe.checkout.sessions.create(
    {
      mode: pack.recurring ? "subscription" : "payment",
      customer_email: actor.email,
      client_reference_id: order.id,
      metadata: { orgId: actor.orgId, orderId: order.id, package: id },
      ...(pack.recurring
        ? {
            subscription_data: {
              metadata: { orgId: actor.orgId, orderId: order.id, package: id },
            },
          }
        : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: pack.pence,
            product_data: { name: `Yulaverse Intelligence · ${pack.name}` },
            ...(pack.recurring
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
        },
      ],
      success_url: `${appUrl()}/agentshelf/dashboard?tab=billing&checkout=received`,
      cancel_url: `${appUrl()}/agentshelf/dashboard?tab=billing&checkout=cancelled`,
    },
    { idempotencyKey: `checkout:${order.id}` },
  );
  await put(
    actor,
    "order",
    { ...order.data, checkoutId: session.id },
    order.id,
    order.version,
  );
  await activity(actor, "checkout.initiated", {
    orderId: order.id,
    package: id,
    testMode: true,
  });
  return session.url;
}
export async function billingPortal(actor: Actor) {
  const stripe = stripeClient();
  const orders = await list<Order>(actor, "order"),
    subscriptions = await list<Subscription>(actor, "subscription");
  const customer =
    subscriptions[0]?.data.customerId ||
    orders.find((o) => o.data.status === "paid")?.data.customerId;
  if (!customer)
    throw new Error(
      "No Stripe billing customer is linked to this organisation yet.",
    );
  return (
    await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${appUrl()}/agentshelf/dashboard?tab=billing`,
    })
  ).url;
}
export async function processStripeEvent(
  event: Stripe.Event,
  stripe: Stripe = stripeClient(),
) {
  if (event.livemode) throw new Error("Live-mode events are disabled.");
  let update:
    | {
        orgId: string;
        orderId?: string;
        data?: Partial<Order>;
        subscription?: Subscription;
      }
    | undefined;
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const s = event.data.object as Stripe.Checkout.Session;
    if (!s.metadata?.orgId || !s.metadata?.orderId) return;
    if (s.payment_status !== "paid") return;
    update = {
      orgId: s.metadata.orgId,
      orderId: s.metadata.orderId,
      data: {
        status: "paid",
        customerId: typeof s.customer === "string" ? s.customer : undefined,
        paymentIntent:
          typeof s.payment_intent === "string" ? s.payment_intent : undefined,
        livemode: false,
      },
    };
    if (typeof s.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(s.subscription);
      update.subscription = subscriptionData(subscription);
    }
  }
  if (event.type.startsWith("customer.subscription.")) {
    const s = event.data.object as Stripe.Subscription;
    if (!s.metadata.orgId) return;
    update = { orgId: s.metadata.orgId, subscription: subscriptionData(s) };
  }
  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.metadata?.orgId && s.metadata.orderId)
      update = {
        orgId: s.metadata.orgId,
        orderId: s.metadata.orderId,
        data: {
          status: event.type.endsWith("expired") ? "cancelled" : "failed",
        },
      };
  }
  if (!update) return;
  const u = update;
  await (
    await getDb()
  ).transaction(async (q) => {
    await q.query("SELECT set_config('agentshelf.admin','true',true)");
    const seen = await q.query(
      "INSERT INTO as_webhooks(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
      [event.id],
    );
    if (!seen.rows.length) return;
    if (u.orderId) {
      const row = (
        await q.query<{ id: string; data: Order }>(
          "SELECT id,data FROM as_records WHERE id=$1 AND org_id=$2 AND kind='order' FOR UPDATE",
          [u.orderId, u.orgId],
        )
      ).rows[0];
      if (!row) throw new Error("Unknown order");
      if (u.data?.status === "paid") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (row.data.checkoutId && row.data.checkoutId !== session.id)
          throw new Error("Checkout session did not match the saved order.");
        if (
          session.amount_total !== row.data.amountPence ||
          session.currency !== "gbp"
        )
          throw new Error(
            "Payment amount/currency did not match the saved order.",
          );
      }
      if (row.data.status !== "paid")
        await q.query(
          "UPDATE as_records SET data=$1,version=version+1,updated_at=now() WHERE id=$2 AND org_id=$3",
          [JSON.stringify({ ...row.data, ...u.data }), row.id, u.orgId],
        );
    }
    if (u.subscription) {
      const id = `sub_${u.subscription.stripeId}`;
      await q.query(
        "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,'subscription',$3) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,version=as_records.version+1,updated_at=now() WHERE as_records.org_id=EXCLUDED.org_id AND COALESCE((as_records.data->>'stripeEventCreated')::bigint,0)<=COALESCE((EXCLUDED.data->>'stripeEventCreated')::bigint,0)",
        [
          id,
          u.orgId,
          JSON.stringify({
            ...u.subscription,
            stripeEventCreated: event.created || 0,
          }),
        ],
      );
    }
    await q.query(
      "INSERT INTO as_events(id,org_id,actor,action,details) VALUES($1,$2,'stripe',$3,$4)",
      [
        randomUUID(),
        u.orgId,
        event.type,
        JSON.stringify({ eventId: event.id, testMode: true }),
      ],
    );
  });
}
function subscriptionData(s: Stripe.Subscription): Subscription {
  const end = s.items.data.reduce(
    (latest, item) => Math.max(latest, item.current_period_end || 0),
    0,
  );
  return {
    stripeId: s.id,
    customerId: typeof s.customer === "string" ? s.customer : s.customer.id,
    status: s.status,
    currentPeriodEnd: new Date(end * 1000).toISOString(),
    cancelAtPeriodEnd: s.cancel_at_period_end,
    ...(s.cancel_at
      ? { cancelAt: new Date(s.cancel_at * 1000).toISOString() }
      : {}),
    livemode: s.livemode,
  };
}
