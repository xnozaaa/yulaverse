import { Pool, type PoolClient } from "pg";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { drizzle as liteDrizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./auth-schema";
import { migration } from "./migration";
import { randomUUID } from "node:crypto";

export type Query = {
  query: <T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};
type Database = {
  query: Query["query"];
  transaction: <T>(fn: (q: Query) => Promise<T>) => Promise<T>;
  authDb:
    | ReturnType<typeof pgDrizzle<typeof schema>>
    | ReturnType<typeof liteDrizzle<typeof schema>>;
  migrate: () => Promise<void>;
};
const state = globalThis as typeof globalThis & { agentDb?: Promise<Database> };
export function dbConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
    (!process.env.VERCEL && process.env.AGENTSHELF_LOCAL_DB),
  );
}
export function getDb(): Promise<Database> {
  if (!dbConfigured())
    throw new Error(
      "SETUP_REQUIRED: Connect a PostgreSQL database before accepting customer data.",
    );
  return (state.agentDb ??= (async () => {
    if (process.env.DATABASE_URL) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 20000,
      });
      const query: Query["query"] = async (sql, params = []) => {
        const r = await pool.query(sql, params);
        return { rows: r.rows };
      };
      return {
        query,
        authDb: pgDrizzle(pool, { schema }),
        migrate: async () => {
          const c = await pool.connect();
          try {
            await c.query("BEGIN");
            await c.query("SELECT pg_advisory_xact_lock(7921431)");
            await c.query(migration);
            await c.query("COMMIT");
          } catch (e) {
            await c.query("ROLLBACK");
            throw e;
          } finally {
            c.release();
          }
        },
        transaction: async <T>(fn: (q: Query) => Promise<T>) => {
          const c: PoolClient = await pool.connect();
          try {
            await c.query("BEGIN");
            const result = await fn({
              query: async (sql, params = []) => ({
                rows: (await c.query(sql, params)).rows,
              }),
            });
            await c.query("COMMIT");
            return result;
          } catch (e) {
            await c.query("ROLLBACK");
            throw e;
          } finally {
            c.release();
          }
        },
      };
    }
    const lite = new PGlite(process.env.AGENTSHELF_LOCAL_DB);
    await lite.exec(migration);
    return {
      query: async <T>(sql: string, params: unknown[] = []) => ({
        rows: (await lite.query<T>(sql, params)).rows,
      }),
      authDb: liteDrizzle(lite, { schema }),
      migrate: async () => {
        await lite.exec(migration);
      },
      transaction: async <T>(fn: (q: Query) => Promise<T>) =>
        lite.transaction(async (tx) =>
          fn({
            query: async <R>(sql: string, params: unknown[] = []) => ({
              rows: (await tx.query<R>(sql, params)).rows,
            }),
          }),
        ),
    };
  })());
}
export type Actor = {
  userId: string;
  orgId: string;
  admin: boolean;
  email?: string;
};
export type Entity<T = Record<string, unknown>> = {
  id: string;
  orgId: string;
  kind: string;
  data: T;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export async function scoped<T>(actor: Actor, fn: (q: Query) => Promise<T>) {
  return (await getDb()).transaction(async (q) => {
    await q.query(
      "SELECT set_config('agentshelf.org_id',$1,true),set_config('agentshelf.admin',$2,true)",
      [actor.orgId, String(actor.admin)],
    );
    return fn(q);
  });
}
type Row<T> = {
  id: string;
  org_id: string;
  kind: string;
  data: T;
  version: number;
  created_at: Date;
  updated_at: Date;
};
const entity = <T>(r: Row<T>): Entity<T> => ({
  id: r.id,
  orgId: r.org_id,
  kind: r.kind,
  data: r.data,
  version: r.version,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
});
export async function list<T>(
  actor: Actor,
  kind: string,
): Promise<Entity<T>[]> {
  return scoped(actor, async (q) =>
    (
      await q.query<Row<T>>(
        "SELECT * FROM as_records WHERE kind=$1 AND ($2::boolean OR org_id=$3) ORDER BY created_at DESC LIMIT 500",
        [kind, actor.admin, actor.orgId],
      )
    ).rows.map(entity),
  );
}
export async function find<T>(
  actor: Actor,
  kind: string,
  id: string,
): Promise<Entity<T> | undefined> {
  return scoped(actor, async (q) => {
    const r = (
      await q.query<Row<T>>(
        "SELECT * FROM as_records WHERE id=$1 AND kind=$2 AND ($3::boolean OR org_id=$4)",
        [id, kind, actor.admin, actor.orgId],
      )
    ).rows[0];
    return r ? entity(r) : undefined;
  });
}
export async function put<T>(
  actor: Actor,
  kind: string,
  data: T,
  id: string = randomUUID(),
  version?: number,
): Promise<Entity<T>> {
  return scoped(actor, async (q) => {
    const rows =
      version === undefined
        ? (
            await q.query<Row<T>>(
              "INSERT INTO as_records(id,org_id,kind,data) VALUES($1,$2,$3,$4) RETURNING *",
              [id, actor.orgId, kind, JSON.stringify(data)],
            )
          ).rows
        : (
            await q.query<Row<T>>(
              "UPDATE as_records SET data=$1,version=version+1,updated_at=now() WHERE id=$2 AND kind=$3 AND version=$4 AND ($5::boolean OR org_id=$6) RETURNING *",
              [
                JSON.stringify(data),
                id,
                kind,
                version,
                actor.admin,
                actor.orgId,
              ],
            )
          ).rows;
    if (!rows[0])
      throw new Error(
        "CONFLICT: This record changed. Reload it before saving.",
      );
    return entity(rows[0]);
  });
}
export async function activity(
  actor: Actor,
  action: string,
  details: unknown = {},
) {
  await (
    await getDb()
  ).query(
    "INSERT INTO as_events(id,org_id,actor,action,details) VALUES($1,$2,$3,$4,$5)",
    [randomUUID(), actor.orgId, actor.userId, action, JSON.stringify(details)],
  );
}
export async function limit(key: string, maximum: number, seconds = 3600) {
  const r = await (
    await getDb()
  ).query<{ count: number }>(
    "INSERT INTO as_limits(key,count,reset_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN as_limits.reset_at<=now() THEN 1 ELSE as_limits.count+1 END,reset_at=CASE WHEN as_limits.reset_at<=now() THEN now()+$2*interval '1 second' ELSE as_limits.reset_at END RETURNING count",
    [key, seconds],
  );
  return r.rows[0].count <= maximum;
}
