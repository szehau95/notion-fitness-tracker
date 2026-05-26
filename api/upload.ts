import { Hono } from "hono";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const isProduction = process.env.NODE_ENV === "production";
const UPLOAD_DIR = isProduction
  ? resolve(process.cwd(), "dist", "public", "uploads")
  : resolve(process.cwd(), "public", "uploads");

export const uploadApp = new Hono();

uploadApp.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate: images only
    if (!file.type.startsWith("image/")) {
      return c.json({ error: "Only image files are allowed" }, 400);
    }

    // Max 20MB per file (iPhone Pro Max HEIC/JPEG compressed)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ error: "File too large. Max 20MB." }, 413);
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const filepath = resolve(UPLOAD_DIR, filename);

    // Save file
    const buffer = await file.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));

    // Return public URL
    const url = `/uploads/${filename}`;
    return c.json({ success: true, url });
  } catch (_e: any) {
    return c.json({ error: "Upload failed" }, 500);
  }
});
