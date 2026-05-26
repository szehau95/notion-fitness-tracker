// Lazy env reader — always reads from process.env at call time
// (avoids import-hoisting issues where env.ts gets evaluated before dotenv loads)
export const env = {
  get appId() { return process.env.APP_ID ?? ""; },
  get appSecret() { return process.env.APP_SECRET ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
};
