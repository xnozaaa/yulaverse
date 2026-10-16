import { getDb } from "./db";
/** Operational deletion only; billing/legal records are deliberately retained. */
export async function applyRetention() {
  const db = await getDb();
  return db.transaction(async (q) => {
    const leads = await q.query(
      "DELETE FROM as_leads WHERE COALESCE((data->>'lastContactAt')::timestamptz,created_at)<now()-interval '12 months' AND COALESCE(data->>'stage','new')<>'converted' RETURNING id",
    );
    await q.query(
      "UPDATE as_outbox SET body='',state='expired' WHERE created_at<now()-interval '30 days' AND state<>'sent'",
    );
    await q.query(
      "DELETE FROM as_limits WHERE reset_at<now()-interval '7 days'",
    );
    await q.query(
      "DELETE FROM as_verification WHERE expires_at<now()-interval '1 day'",
    );
    await q.query(
      "DELETE FROM as_session WHERE expires_at<now()-interval '30 days'",
    );
    return { expiredEnquiries: leads.rows.length };
  });
}
