import { NextResponse } from "next/server";
import { validateContact, type ContactPayload } from "@/data/contact";

function normalisePayload(value: unknown): ContactPayload {
  const source = typeof value === "object" && value !== null ? value : {};
  const get = (key: keyof ContactPayload) => {
    const item = (source as Record<string, unknown>)[key];
    return typeof item === "string" ? item.trim() : "";
  };

  return {
    name: get("name"),
    email: get("email").toLowerCase(),
    businessName: get("businessName"),
    service: get("service"),
    budget: get("budget"),
    launchDate: get("launchDate"),
    details: get("details"),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const payload = normalisePayload(body);
  const errors = validateContact(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 422 },
    );
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      delivered: false,
      message:
        "Your enquiry is valid, but online delivery is not configured yet. Please email hello@yulaverse.studio.",
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, source: "yulaverse.studio" }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);

    return NextResponse.json({
      ok: true,
      delivered: true,
      message: "Thank you. Your enquiry has been delivered to the studio.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not deliver your enquiry right now. Please email hello@yulaverse.studio.",
      },
      { status: 502 },
    );
  }
}
