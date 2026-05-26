import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { dataRouter } from "./routers/data";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  data: dataRouter,
});

export type AppRouter = typeof appRouter;
