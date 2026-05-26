import {
  mysqlTable,
  serial,
  varchar,
  text,
  mediumtext,
  timestamp,
  int,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  gender: varchar("gender", { length: 20 }),
  age: int("age"),
  heightCm: int("height_cm"),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  level: int("level").notNull().default(1),
  xp: int("xp").notNull().default(0),
  streakDays: int("streak_days").notNull().default(0),
  longestStreak: int("longest_streak").notNull().default(0),
  totalWorkouts: int("total_workouts").notNull().default(0),
  totalVolume: decimal("total_volume", { precision: 12, scale: 2 }).notNull().default("0"),
  weeklyGoal: int("weekly_goal").default(3),
  avatar: mediumtext("avatar"),
});

export const userData = mysqlTable("user_data", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  exercisesJson: text("exercises_json").notNull(),
  routinesJson: text("routines_json").notNull(),
  sessionsJson: text("sessions_json").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const bodyMeasurements = mysqlTable("body_measurements", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  bodyFatPct: decimal("body_fat_pct", { precision: 4, scale: 1 }),
  chestCm: decimal("chest_cm", { precision: 5, scale: 1 }),
  waistCm: decimal("waist_cm", { precision: 5, scale: 1 }),
  armsCm: decimal("arms_cm", { precision: 5, scale: 1 }),
  thighsCm: decimal("thighs_cm", { precision: 5, scale: 1 }),
  date: timestamp("date").notNull().defaultNow(),
});
