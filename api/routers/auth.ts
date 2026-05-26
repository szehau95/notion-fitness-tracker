import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, userData } from "@db/schema";
import { createToken } from "../lib/jwt";
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from "../lib/defaults";
import { eq } from "drizzle-orm";

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(36);
}

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        displayName: z.string().min(1),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const normalizedEmail = input.email.toLowerCase().trim();

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = hashPassword(input.password);

      const result = await db.insert(users).values({
        email: normalizedEmail,
        passwordHash,
        phone: input.phone?.trim() || null,
        displayName: input.displayName.trim(),
      });

      const userId = Number(result[0].insertId);

      // Seed user with 55 exercises and all athlete programs
      await db.insert(userData).values({
        userId,
        exercisesJson: JSON.stringify(DEFAULT_EXERCISES),
        routinesJson: JSON.stringify(DEFAULT_ROUTINES),
        sessionsJson: "[]",
      });

      const token = await createToken(userId);
      return { token, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const normalizedEmail = input.email.toLowerCase().trim();

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this email.",
        });
      }

      const user = rows[0];
      if (user.passwordHash !== hashPassword(input.password)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect password.",
        });
      }

      const token = await createToken(user.id);
      return { token, userId: user.id };
    }),

  loginWithPhone: publicQuery
    .input(z.object({ phone: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const normalizedPhone = input.phone.trim();

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this phone number.",
        });
      }

      const user = rows[0];
      const token = await createToken(user.id);
      return { token, userId: user.id };
    }),

  me: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (rows.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      createdAt: user.createdAt,
      profile: {
        displayName: user.displayName,
        gender: user.gender || "",
        age: user.age || 25,
        heightCm: user.heightCm || 175,
        weightKg: Number(user.weightKg) || 70,
        level: user.level,
        xp: user.xp,
        streakDays: user.streakDays,
        longestStreak: user.longestStreak,
        totalWorkouts: user.totalWorkouts,
        totalVolume: Number(user.totalVolume),
        weeklyGoal: user.weeklyGoal || 3,
        bodyMeasurements: [],
        avatar: user.avatar || undefined,
      },
    };
  }),
});
