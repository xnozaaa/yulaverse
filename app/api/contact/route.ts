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
    website: get("website"),
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

  return NextResponse.json({
    ok: true,
    delivered: false,
    message: "Your enquiry is validated and ready for delivery.",
  });
}
