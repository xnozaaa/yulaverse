import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { Agent, fetch as safeFetch } from "undici";

export function publicUrl(value: string) {
  const u = new URL(value);
  if (
    !["https:", "http:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    (u.port && !["80", "443"].includes(u.port))
  )
    throw new Error("Use a public HTTP or HTTPS website on its standard port.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host.includes(".") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid") ||
    host === "metadata.google.internal"
  )
    throw new Error("Private and internal websites cannot be audited.");
  if (ipaddr.isValid(host) && !isPublicIp(host))
    throw new Error("Private IP addresses cannot be audited.");
  u.hash = "";
  return u;
}
export function isPublicIp(value: string) {
  try {
    const a = ipaddr.process(value);
    return a.range() === "unicast";
  } catch {
    return false;
  }
}
export type Fetched = {
  url: string;
  status: number;
  type: string;
  body: string;
};
export async function fetchPublic(
  value: string,
  maxBytes = 1_500_000,
): Promise<Fetched> {
  let url = publicUrl(value);
  const signal = AbortSignal.timeout(12000);
  for (let redirect = 0; redirect <= 4; redirect++) {
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await new Promise<{ address: string; family: number }[]>(
      (resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("DNS lookup timed out.")),
          5000,
        );
        dns
          .lookup(host, { all: true, verbatim: true })
          .then(resolve, reject)
          .finally(() => clearTimeout(timer));
      },
    );
    if (!addresses.length || addresses.some((a) => !isPublicIp(a.address)))
      throw new Error("Website resolves to a restricted address.");
    const chosen = addresses[0];
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [chosen]);
          else callback(null, chosen.address, chosen.family);
        },
        timeout: 7000,
      },
    });
    try {
      const response = await safeFetch(url, {
        dispatcher,
        redirect: "manual",
        headers: {
          "User-Agent":
            "AgentShelfBot/1.0 (+https://yulaverse.co.uk/ai-visibility/methodology)",
          Accept:
            "text/html,application/ld+json,application/xml,text/plain;q=0.9",
        },
        signal,
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const destination = response.headers.get("location");
        await response.body?.cancel();
        if (!destination) throw new Error("Redirect has no destination.");
        url = publicUrl(new URL(destination, url).href);
        continue;
      }
      const type = response.headers.get("content-type") || "";
      if (
        response.headers.get("content-length") &&
        Number(response.headers.get("content-length")) > maxBytes
      ) {
        await response.body?.cancel();
        throw new Error("Page exceeds the crawl size limit.");
      }
      if (!/(text\/|html|xml|json)/i.test(type)) {
        await response.body?.cancel();
        return { url: url.href, status: response.status, type, body: "" };
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (response.body)
        for await (const chunk of response.body) {
          size += chunk.byteLength;
          if (size > maxBytes)
            throw new Error("Response exceeds the crawl size limit.");
          chunks.push(chunk);
        }
      return {
        url: url.href,
        status: response.status,
        type,
        body: Buffer.concat(chunks).toString("utf8"),
      };
    } finally {
      await dispatcher.close();
    }
  }
  throw new Error("Too many redirects.");
}
