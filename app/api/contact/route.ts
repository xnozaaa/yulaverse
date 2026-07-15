import { NextResponse } from "next/server";
import { validateContact, type ContactPayload } from "@/data/contact";

const STUDIO_EMAIL = "yulaversestudio@gmail.com";
const SITE_ORIGIN = "https://yulaverse.vercel.app";
const DEFAULT_DELIVERY_URL = `https://formsubmit.co/ajax/${STUDIO_EMAIL}`;

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
    website: get("website"),
  };
}

function createDeliveryBody(payload: ContactPayload) {
  const subjectBusiness = payload.businessName
    .replace(/[\r\n]+/g, " ")
    .slice(0, 120);

  return new URLSearchParams({
    Name: payload.name,
    Email: payload.email,
    "Business name": payload.businessName,
    "Service required": payload.service,
    "Estimated budget": payload.budget,
    "Desired launch date": payload.launchDate,
    "Project details": payload.details,
    Source: "Yulaverse Studio website",
    "Submitted at": new Date().toISOString(),
    _replyto: payload.email,
    _subject: `New Yulaverse enquiry — ${subjectBusiness}`,
    _template: "table",
    _captcha: "false",
    _honey: "",
  });
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

  // Silently accept bot submissions that fill the hidden honeypot field.
  if (payload.website) {
    return NextResponse.json({
      ok: true,
      delivered: true,
      message: "Thank you. Your enquiry has been delivered to the studio.",
    });
  }

  const errors = validateContact(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 422 },
    );
  }

  const deliveryUrl =
    process.env.CONTACT_DELIVERY_URL?.trim() || DEFAULT_DELIVERY_URL;

  try {
    const response = await fetch(deliveryUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        origin: SITE_ORIGIN,
        referer: `${SITE_ORIGIN}/`,
      },
      body: createDeliveryBody(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const result = (await response.json().catch(() => null)) as {
      success?: boolean | string;
      message?: string;
    } | null;
    const delivered =
      response.ok && (result?.success === true || result?.success === "true");

    if (!delivered) {
      const providerMessage = result?.message ?? "";
      if (/activation/i.test(providerMessage)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Online delivery is awaiting email confirmation. Please email yulaversestudio@gmail.com for now.",
          },
          { status: 503 },
        );
      }

      throw new Error(`Delivery provider returned ${response.status}`);
    }

    return NextResponse.json({
      ok: true,
      delivered: true,
      message: "Thank you. Your enquiry has been emailed to the studio.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not deliver your enquiry right now. Please email yulaversestudio@gmail.com.",
      },
      { status: 502 },
    );
  }
}
