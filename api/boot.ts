import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Fast .env loader ───
function loadEnvFile() {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = resolve(__dirname, ".env");
    if (!existsSync(envPath)) {
      const altPath = resolve(__dirname, "../.env");
      if (!existsSync(altPath)) return;
      parseEnvFile(readFileSync(altPath, "utf-8"));
      return;
    }
    parseEnvFile(readFileSync(envPath, "utf-8"));
  } catch (_e) { /* ignore */ }
}

function parseEnvFile(content: string) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

// ─── Startup migrations ──────────────────────────────────────────────────────
// Runs once on server start. Safely adds any missing columns to the DB.
// Uses try/catch per-statement so it never crashes the server.
async function runStartupMigrations() {
  try {
    const rawUrl = (process.env.DATABASE_URL || '').replace(/[?&]ssl-mode=[^&]*/g, '').replace(/[?&]ssl=[^&]*/g, '').replace(/[?&]$/, '');
    if (!rawUrl) return;
    const parsed = new URL(rawUrl);
    const mysql2 = await import('mysql2/promise');
    const conn = await mysql2.default.createConnection({
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 15000,
    });
    // Add avatar column (MEDIUMTEXT = up to 16MB, enough for base64 images)
    try {
      await conn.execute('ALTER TABLE users ADD COLUMN avatar MEDIUMTEXT');
      console.log('[migration] ✓ Added avatar column to users');
    } catch (e: any) {
      if (e.errno === 1060) {
        console.log('[migration] ✓ avatar column already present');
      } else {
        console.warn('[migration] avatar column error:', e.message);
      }
    }
    await conn.end();
  } catch (e: any) {
    // Non-fatal: log and continue — server still starts without migration
    console.warn('[migration] Could not run startup migrations:', e.message);
  }
}
// Fire-and-forget — don't block server startup
runStartupMigrations();

import { Hono } from "hono";
import { compress } from "hono/compress";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { uploadApp } from "./upload";

const app = new Hono<{ Bindings: HttpBindings }>();

// ─── Compression (gzip) for all responses ───
app.use(compress());
// Increase body limit to 30MB for iPhone photo uploads
app.use(bodyLimit({ maxSize: 30 * 1024 * 1024 }));

// ─── File upload endpoint (multipart, NOT tRPC) ───
app.route("/api", uploadApp);

// Health check — ultra-fast, no DB
app.get("/api/health", (c) => c.json({ ok: true }));

// ─── One-shot migration endpoint ───────────────────────────────────────────
// Visit /api/migrate once to add any missing DB columns.
// Safe to call multiple times — idempotent.
app.get("/api/migrate", async (c) => {
  const results: string[] = [];
  try {
    const rawUrl = (process.env.DATABASE_URL || '').replace(/[?&]ssl-mode=[^&]*/g, '').replace(/[?&]ssl=[^&]*/g, '').replace(/[?&]$/, '');
    if (!rawUrl) return c.json({ error: 'DATABASE_URL not set' }, 500);
    const parsed = new URL(rawUrl);
    const mysql2 = await import('mysql2/promise');
    const conn = await mysql2.default.createConnection({
      host: parsed.hostname, port: parseInt(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1), ssl: { rejectUnauthorized: false }, connectTimeout: 15000,
    });
    // avatar column
    try {
      await conn.execute('ALTER TABLE users ADD COLUMN avatar MEDIUMTEXT');
      results.push('✓ Added avatar column');
    } catch (e: any) {
      results.push(e.errno === 1060 ? '✓ avatar column already exists' : `✗ avatar: ${e.message}`);
    }
    await conn.end();
    return c.json({ success: true, results });
  } catch (e: any) {
    return c.json({ success: false, error: e.message, results }, 500);
  }
});

// tRPC handler
app.use("/api/trpc/*", async (c) => {
  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  } catch (_e: any) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Serve static frontend
if (env.isProduction) {
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);
} else {
  app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));
}

export default app;

// Start server
if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port });
}
