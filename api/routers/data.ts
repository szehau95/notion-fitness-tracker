import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { userData, bodyMeasurements, users } from "@db/schema";
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from "../lib/defaults";
import { eq, desc } from "drizzle-orm";

export const dataRouter = createRouter({
  getData: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(userData)
      .where(eq(userData.userId, ctx.userId))
      .limit(1);

    if (rows.length === 0) {
      // No user data row yet — return full defaults
      return { exercises: DEFAULT_EXERCISES, routines: DEFAULT_ROUTINES, sessions: [] };
    }

    const row = rows[0];
    const exercises = JSON.parse(row.exercisesJson);
    const routines = JSON.parse(row.routinesJson);
    const sessions = JSON.parse(row.sessionsJson);

    // If user has empty exercises/routines (old bug), auto-seed defaults
    if (!exercises || exercises.length === 0) {
      await db
        .update(userData)
        .set({ exercisesJson: JSON.stringify(DEFAULT_EXERCISES) })
        .where(eq(userData.userId, ctx.userId));
      return { exercises: DEFAULT_EXERCISES, routines: routines.length > 0 ? routines : DEFAULT_ROUTINES, sessions: sessions || [] };
    }
    if (!routines || routines.length === 0) {
      await db
        .update(userData)
        .set({ routinesJson: JSON.stringify(DEFAULT_ROUTINES) })
        .where(eq(userData.userId, ctx.userId));
      return { exercises, routines: DEFAULT_ROUTINES, sessions: sessions || [] };
    }

    return { exercises, routines, sessions: sessions || [] };
  }),

  saveData: authedQuery
    .input(
      z.object({
        exercises: z.string(), // JSON string
        routines: z.string(), // JSON string
        sessions: z.string(), // JSON string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(userData)
        .where(eq(userData.userId, ctx.userId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userData)
          .set({
            exercisesJson: input.exercises,
            routinesJson: input.routines,
            sessionsJson: input.sessions,
          })
          .where(eq(userData.userId, ctx.userId));
      } else {
        await db.insert(userData).values({
          userId: ctx.userId,
          exercisesJson: input.exercises,
          routinesJson: input.routines,
          sessionsJson: input.sessions,
        });
      }

      return { success: true };
    }),

  getMeasurements: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, ctx.userId))
      .orderBy(desc(bodyMeasurements.date));

    return rows.map((r) => ({
      date: r.date.toISOString(),
      weight: r.weightKg ? Number(r.weightKg) : undefined,
      bodyFat: r.bodyFatPct ? Number(r.bodyFatPct) : undefined,
      chest: r.chestCm ? Number(r.chestCm) : undefined,
      waist: r.waistCm ? Number(r.waistCm) : undefined,
      arms: r.armsCm ? Number(r.armsCm) : undefined,
      thighs: r.thighsCm ? Number(r.thighsCm) : undefined,
    }));
  }),

  addMeasurement: authedQuery
    .input(
      z.object({
        weightKg: z.number().optional(),
        bodyFatPct: z.number().optional(),
        chestCm: z.number().optional(),
        waistCm: z.number().optional(),
        armsCm: z.number().optional(),
        thighsCm: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(bodyMeasurements).values({
        userId: ctx.userId,
        weightKg: input.weightKg ? String(input.weightKg) : null,
        bodyFatPct: input.bodyFatPct ? String(input.bodyFatPct) : null,
        chestCm: input.chestCm ? String(input.chestCm) : null,
        waistCm: input.waistCm ? String(input.waistCm) : null,
        armsCm: input.armsCm ? String(input.armsCm) : null,
        thighsCm: input.thighsCm ? String(input.thighsCm) : null,
      });
      return { success: true };
    }),

  updateProfile: authedQuery
    .input(
      z.object({
        displayName: z.string().optional(),
        gender: z.string().optional(),
        age: z.number().optional(),
        heightCm: z.number().optional(),
        weightKg: z.number().optional(),
        level: z.number().optional(),
        xp: z.number().optional(),
        streakDays: z.number().optional(),
        longestStreak: z.number().optional(),
        totalWorkouts: z.number().optional(),
        totalVolume: z.number().optional(),
        weeklyGoal: z.number().optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = {};
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.gender !== undefined) updateData.gender = input.gender;
      if (input.age !== undefined) updateData.age = input.age;
      if (input.heightCm !== undefined) updateData.heightCm = input.heightCm;
      if (input.weightKg !== undefined) updateData.weightKg = input.weightKg;
      if (input.level !== undefined) updateData.level = input.level;
      if (input.xp !== undefined) updateData.xp = input.xp;
      if (input.streakDays !== undefined) updateData.streakDays = input.streakDays;
      if (input.longestStreak !== undefined) updateData.longestStreak = input.longestStreak;
      if (input.totalWorkouts !== undefined) updateData.totalWorkouts = input.totalWorkouts;
      if (input.totalVolume !== undefined) updateData.totalVolume = input.totalVolume;
      if (input.weeklyGoal !== undefined) updateData.weeklyGoal = input.weeklyGoal;
      if (input.avatar !== undefined) updateData.avatar = input.avatar;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.userId));

      return { success: true };
    }),
});
