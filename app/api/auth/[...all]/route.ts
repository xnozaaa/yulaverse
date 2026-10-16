import { getAuth } from "@/lib/agentshelf/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return await (await getAuth()).handler(request);
  } catch {
    return Response.json(
      { message: "Authentication setup is required." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  try {
    return await (await getAuth()).handler(request);
  } catch {
    return Response.json(
      {
        message: "Authentication is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}
