import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/jwt";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  userId: number | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const auth = opts.req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const verified = token ? await verifyToken(token) : null;
  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    userId: verified?.userId ?? null,
  };
}
