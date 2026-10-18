import { getDb } from "./db";
import { randomUUID } from "node:crypto";
export async function queueEmail(
  recipient: string,
  subject: string,
  body: string,
  orgId?: string,
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
    throw new Error("Invalid email recipient");
  const id = randomUUID();
  await (
    await getDb()
  ).query(
    "INSERT INTO as_outbox(id,org_id,recipient,subject,body) VALUES($1,$2,$3,$4,$5)",
    [id, orgId || null, recipient, subject, body],
  );
  return id;
}
export async function flushMail(maximum = 10) {
  if (!process.env.RESEND_API_KEY || !process.env.AGENTSHELF_EMAIL_FROM)
    return { sent: 0, setupRequired: true };
  const db = await getDb();
  const { rows } = await db.query<{
    id: string;
    recipient: string;
    subject: string;
    body: string;
    attempts: number;
  }>(
    "UPDATE as_outbox SET state='sending',next_at=now()+interval '5 minutes' WHERE id IN (SELECT id FROM as_outbox WHERE state IN ('pending','failed','sending') AND attempts<5 AND next_at<=now() ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED) RETURNING *",
    [maximum],
  );
  let sent = 0;
  for (const row of rows) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": row.id,
        },
        body: JSON.stringify({
          from: process.env.AGENTSHELF_EMAIL_FROM,
          to: [row.recipient],
          subject: row.subject,
          text: row.body,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(`Email provider HTTP ${response.status}`);
      await db.query(
        "UPDATE as_outbox SET state='sent',attempts=attempts+1,body='',error=NULL WHERE id=$1",
        [row.id],
      );
      sent++;
    } catch (e) {
      await db.query(
        "UPDATE as_outbox SET state='failed',attempts=attempts+1,error=$2,next_at=now()+interval '15 minutes' WHERE id=$1",
        [row.id, e instanceof Error ? e.message : "Email delivery failed"],
      );
    }
  }
  return { sent, setupRequired: false };
}
