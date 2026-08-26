type RateLimitEntry = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __yulaverseRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits =
  globalStore.__yulaverseRateLimits ??
  (globalStore.__yulaverseRateLimits = new Map<string, RateLimitEntry>());

export function guardContactRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return { status: 403, message: "Request not allowed." };
      }
    } catch {
      return { status: 403, message: "Request not allowed." };
    }
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return { status: 413, message: "Request is too large." };
  }

  const ip = (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"
  ).trim();
  const now = Date.now();
  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else if (current.count >= 8) {
    return { status: 429, message: "Too many requests. Please try again later." };
  } else {
    current.count += 1;
  }

  if (rateLimits.size > 2_000) {
    for (const [entryKey, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryKey);
    }
  }
  return null;
}
