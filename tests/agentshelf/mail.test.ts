import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getDb } from "../../lib/agentshelf/db";
import { flushMail, queueEmail } from "../../lib/agentshelf/mail";

const recipient = "customer@agentshelf.example";
const sender = "AgentShelf Test <noreply@agentshelf.example>";
const transport = vi.fn<typeof fetch>();

beforeAll(async () => {
  vi.stubEnv("AGENTSHELF_DATABASE_URL", "");
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("AGENTSHELF_LOCAL_DB", "memory://");
  vi.stubEnv("VERCEL", "");
  await (await getDb()).migrate();
});

beforeEach(async () => {
  await (await getDb()).query("DELETE FROM as_outbox");
  vi.stubEnv("RESEND_API_KEY", "test-only-not-a-real-key");
  vi.stubEnv("AGENTSHELF_EMAIL_FROM", sender);
  transport.mockReset();
  vi.stubGlobal("fetch", transport);
});

afterEach(() => vi.unstubAllGlobals());

async function row(id: string) {
  return (
    await (
      await getDb()
    ).query<{
      state: string;
      body: string;
      attempts: number;
      error: string | null;
      scheduled_for_future: boolean;
    }>(
      "SELECT *,next_at>now() AS scheduled_for_future FROM as_outbox WHERE id=$1",
      [id],
    )
  ).rows[0];
}

describe("Durable email delivery with mocked transport, no real recipients", () => {
  it.each(["RESEND_API_KEY", "AGENTSHELF_EMAIL_FROM"])(
    "retains pending mail when %s is missing",
    async (variable) => {
      const id = await queueEmail(
        recipient,
        "Verification",
        "Private test body",
      );
      vi.stubEnv(variable, "");
      expect(await flushMail()).toEqual({ sent: 0, setupRequired: true });
      expect(await row(id)).toMatchObject({
        state: "pending",
        attempts: 0,
        body: "Private test body",
      });
      expect(transport).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed recipients before storing an email", async () => {
    await expect(
      queueEmail("invalid-recipient", "Test", "Test"),
    ).rejects.toThrow("Invalid email recipient");
    expect(
      (await (await getDb()).query("SELECT id FROM as_outbox")).rows,
    ).toHaveLength(0);
    expect(transport).not.toHaveBeenCalled();
  });

  it("uses the configured sender and stable idempotency key, then clears sent bodies", async () => {
    transport.mockResolvedValue(Response.json({ id: "mock-provider-message" }));
    const id = await queueEmail(recipient, "Verification", "Private test body");
    expect(await flushMail(1)).toEqual({ sent: 1, setupRequired: false });
    const [url, request] = transport.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({ "Idempotency-Key": id });
    expect(JSON.parse(String(request?.body))).toEqual({
      from: sender,
      to: [recipient],
      subject: "Verification",
      text: "Private test body",
    });
    expect(await row(id)).toMatchObject({
      state: "sent",
      attempts: 1,
      body: "",
      error: null,
    });
    expect(await flushMail()).toEqual({ sent: 0, setupRequired: false });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("retains failed mail and delays retries without leaking a provider response", async () => {
    transport.mockResolvedValue(
      new Response("private provider detail", { status: 429 }),
    );
    const id = await queueEmail(recipient, "Verification", "Private test body");
    expect(await flushMail()).toEqual({ sent: 0, setupRequired: false });
    expect(await row(id)).toMatchObject({
      state: "failed",
      attempts: 1,
      body: "Private test body",
      error: "Email provider HTTP 429",
      scheduled_for_future: true,
    });
    await flushMail();
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("reuses the original idempotency key after an uncertain transport failure", async () => {
    transport.mockRejectedValueOnce(new Error("Mock transport timeout"));
    const id = await queueEmail(recipient, "Verification", "Private test body");
    await flushMail();
    expect(await row(id)).toMatchObject({ state: "failed", attempts: 1 });
    await (
      await getDb()
    ).query("UPDATE as_outbox SET next_at=now() WHERE id=$1", [id]);
    transport.mockResolvedValueOnce(
      Response.json({ id: "mock-provider-message" }),
    );
    expect(await flushMail()).toEqual({ sent: 1, setupRequired: false });
    expect(
      transport.mock.calls.map(
        ([, request]) =>
          (request?.headers as Record<string, string>)["Idempotency-Key"],
      ),
    ).toEqual([id, id]);
    expect(await row(id)).toMatchObject({
      state: "sent",
      attempts: 2,
      body: "",
      error: null,
    });
  });

  it("does not exceed the configured batch or five-attempt ceiling", async () => {
    transport.mockResolvedValue(Response.json({ id: "mock-provider-message" }));
    const exhausted = await queueEmail(
      recipient,
      "Exhausted",
      "Retained for review",
    );
    await (
      await getDb()
    ).query("UPDATE as_outbox SET state='failed',attempts=5 WHERE id=$1", [
      exhausted,
    ]);
    await queueEmail(recipient, "First", "First");
    await queueEmail(recipient, "Second", "Second");
    expect(await flushMail(1)).toEqual({ sent: 1, setupRequired: false });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await row(exhausted)).toMatchObject({
      state: "failed",
      attempts: 5,
      body: "Retained for review",
    });
    expect(
      (
        await (
          await getDb()
        ).query("SELECT id FROM as_outbox WHERE state='pending'")
      ).rows,
    ).toHaveLength(1);
  });
});
