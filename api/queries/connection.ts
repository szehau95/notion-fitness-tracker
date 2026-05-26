import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is not set. Check your environment variables.");
    }
    // Parse the URL manually so we can pass ssl as an object (mysql2 rejects ssl=true in URL)
    const rawUrl = env.databaseUrl.replace(/[?&]ssl-mode=[^&]*/g, "").replace(/[?&]ssl=[^&]*/g, "").replace(/[?&]$/, "");
    const parsed = new URL(rawUrl);

    const pool = mysql.createPool({
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10000,
    });

    instance = drizzle(pool, { schema: fullSchema, mode: "planetscale" });
  }
  return instance;
}
