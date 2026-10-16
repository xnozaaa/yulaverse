import { afterEach, describe, expect, it, vi } from "vitest";
import dns from "node:dns/promises";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), close: vi.fn() }));
vi.mock("undici", () => ({
  Agent: class {
    close = mocks.close;
    constructor(_options: unknown) {}
  },
  fetch: mocks.fetch,
}));
import { fetchPublic } from "../../lib/agentshelf/url";
afterEach(() => {
  vi.restoreAllMocks();
  mocks.fetch.mockReset();
  mocks.close.mockReset();
});
describe("Network SSRF enforcement", () => {
  it("rejects a public-looking hostname resolving to a private address", async () => {
    vi.spyOn(dns, "lookup").mockResolvedValue([
      { address: "10.0.0.5", family: 4 },
    ] as never);
    await expect(fetchPublic("https://public.example.com")).rejects.toThrow(
      "restricted",
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("rejects private redirect destinations before another request", async () => {
    vi.spyOn(dns, "lookup").mockResolvedValue([
      { address: "1.1.1.1", family: 4 },
    ] as never);
    mocks.fetch.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/secrets" },
      }),
    );
    await expect(fetchPublic("https://public.example.com")).rejects.toThrow(
      /Private/,
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
  it("revalidates DNS on each redirect", async () => {
    vi.spyOn(dns, "lookup")
      .mockResolvedValueOnce([{ address: "1.1.1.1", family: 4 }] as never)
      .mockResolvedValueOnce([{ address: "192.168.0.1", family: 4 }] as never);
    mocks.fetch.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://next.example.com/" },
      }),
    );
    await expect(fetchPublic("https://public.example.com")).rejects.toThrow(
      "restricted",
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
  it("enforces a streamed size limit without trusting Content-Length", async () => {
    vi.spyOn(dns, "lookup").mockResolvedValue([
      { address: "1.1.1.1", family: 4 },
    ] as never);
    mocks.fetch.mockResolvedValue(
      new Response("123456", { headers: { "content-type": "text/html" } }),
    );
    await expect(fetchPublic("https://public.example.com", 4)).rejects.toThrow(
      "size limit",
    );
    expect(mocks.close).toHaveBeenCalled();
  });
});
