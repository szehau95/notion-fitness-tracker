import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/providers/trpc";
import type {
  Exercise,
  WorkoutSession,
  Routine,
  User,
  AppTab,
  WorkoutExercise,
  WorkoutSet,
  BodyMeasurement,
} from "@/types";

const ACTIVE_SESSION_KEY = "notionfitness_active_session";
const CURRENT_TAB_KEY = "notionfitness_current_tab";

function loadActiveSession(): WorkoutSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveActiveSession(session: WorkoutSession | null) {
  if (session) localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(ACTIVE_SESSION_KEY);
}

function loadTab(): AppTab {
  try {
    const raw = localStorage.getItem(CURRENT_TAB_KEY);
    if (!raw) return "dashboard";
    return JSON.parse(raw) as AppTab;
  } catch { return "dashboard"; }
}

function saveTab(tab: AppTab) {
  localStorage.setItem(CURRENT_TAB_KEY, JSON.stringify(tab));
}

export function useWorkoutStore(currentUser: User | null, updateUser: (u: User | ((prev: User) => User)) => void) {
  const user = currentUser;
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => loadActiveSession());
  const [currentTab, setCurrentTab] = useState<AppTab>(() => loadTab());
  const hasSeeded = useRef(false);

  useEffect(() => saveActiveSession(activeSession), [activeSession]);
  useEffect(() => saveTab(currentTab), [currentTab]);

  // Load user data from server
  const dataQuery = trpc.data.getData.useQuery(undefined, {
    enabled: !!user,
    staleTime: Infinity,
  });

  const saveDataMutation = trpc.data.saveData.useMutation();
  const addMeasurementMutation = trpc.data.addMeasurement.useMutation();

  // Seed server data on first login — runs ONCE per session
  useEffect(() => {
    if (!user || dataQuery.isLoading || dataQuery.data === undefined || hasSeeded.current) return;
    hasSeeded.current = true;

    const serverExercises = dataQuery.data.exercises as Exercise[];
    const serverRoutines = dataQuery.data.routines as Routine[];
    const serverSessions = dataQuery.data.sessions as WorkoutSession[];

    // If server has empty data, try legacy localStorage backup first
    if (serverExercises.length === 0 && serverRoutines.length === 0 && serverSessions.length === 0) {
      try {
        const legacyCurrent = localStorage.getItem("notionfitness_current_user");
        if (legacyCurrent) {
          const parsed = JSON.parse(legacyCurrent);
          const legacyUser = parsed.user || parsed;
          if (legacyUser.exercises?.length > 0 || legacyUser.routines?.length > 0 || legacyUser.sessions?.length > 0) {
            saveDataMutation.mutate({
              exercises: JSON.stringify(legacyUser.exercises || []),
              routines: JSON.stringify(legacyUser.routines || []),
              sessions: JSON.stringify(legacyUser.sessions || []),
            });
            updateUser((u) => ({
              ...u,
              exercises: legacyUser.exercises || [],
              routines: legacyUser.routines || [],
              sessions: legacyUser.sessions || [],
            }));
            return;
          }
        }
      } catch { /* ignore */ }
    }

    // Apply server data to local state (server is source of truth)
    updateUser((u) => ({
      ...u,
      exercises: serverExercises.length > 0 ? serverExercises : u.exercises,
      routines: serverRoutines.length > 0 ? serverRoutines : u.routines,
      sessions: serverSessions.length > 0 ? serverSessions : u.sessions,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dataQuery.data, dataQuery.isLoading]);

  const exercises = user?.exercises ?? [];
  const routines = user?.routines ?? [];
  const sessions = user?.sessions ?? [];
  const profile = user?.profile ?? {
    displayName: "Athlete", gender: "", age: 25, heightCm: 175, weightKg: 70,
    level: 1, xp: 0, streakDays: 0, longestStreak: 0, totalWorkouts: 0, totalVolume: 0, bodyMeasurements: [],
  };

  // Auto-sync to server whenever user data changes (debounced 800ms)
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      saveDataMutation.mutate({
        exercises: JSON.stringify(exercises),
        routines: JSON.stringify(routines),
        sessions: JSON.stringify(sessions),
      });
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, routines, sessions, user?.id]);

  const syncUser = useCallback((updates: Partial<User>) => {
    if (!user) return;
    updateUser({ ...user, ...updates });
  }, [user, updateUser]);

  const addExercise = useCallback((exercise: Omit<Exercise, "id">) => {
    if (!user) return;
    const newEx: Exercise = { ...exercise, id: `ex-${Date.now()}`, isCustom: true };
    syncUser({ exercises: [...exercises, newEx] });
  }, [user, exercises, syncUser]);

  const deleteExercise = useCallback((id: string) => {
    if (!user) return;
    syncUser({ exercises: exercises.filter((e) => e.id !== id) });
  }, [user, exercises, syncUser]);

  const addRoutine = useCallback((routine: Omit<Routine, "id">) => {
    if (!user) return;
    const newRt: Routine = { ...routine, id: `rt-${Date.now()}` };
    syncUser({ routines: [...routines, newRt] });
  }, [user, routines, syncUser]);

  const deleteRoutine = useCallback((id: string) => {
    if (!user) return;
    syncUser({ routines: routines.filter((r) => r.id !== id) });
  }, [user, routines, syncUser]);

  const startWorkout = useCallback((routine: Routine) => {
    const sessionExercises: WorkoutExercise[] = routine.exercises.map((re) => ({
      id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      exerciseId: re.exerciseId,
      exerciseName: re.exerciseName,
      restTimerSeconds: re.restTimerSeconds,
      sets: Array.from({ length: re.targetSets }, (_, i) => ({
        id: `ws-${Date.now()}-${i}`,
        setNumber: i + 1,
        weight: 0,
        reps: re.targetRepsMax,
        rpe: 7,
        completed: false,
      })),
    }));

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: routine.name,
      startTime: new Date().toISOString(),
      exercises: sessionExercises,
      isActive: true,
      totalVolume: 0,
    };

    setActiveSession(session);
    setCurrentTab("workout");
  }, []);

  const startEmptyWorkout = useCallback((name: string = "Quick Workout") => {
    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineName: name,
      startTime: new Date().toISOString(),
      exercises: [],
      isActive: true,
      totalVolume: 0,
    };
    setActiveSession(session);
    setCurrentTab("workout");
  }, []);

  const addExerciseToActive = useCallback((exercise: Exercise) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const newExercise: WorkoutExercise = {
        id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        restTimerSeconds: 90,
        sets: [
          { id: `ws-${Date.now()}-1`, setNumber: 1, weight: 0, reps: 10, rpe: 7, completed: false },
        ],
      };
      return { ...prev, exercises: [...prev.exercises, newExercise] };
    });
  }, []);

  const removeExerciseFromActive = useCallback((exerciseId: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return { ...prev, exercises: prev.exercises.filter((e) => e.id !== exerciseId) };
    });
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const sets = ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s));
        return { ...ex, sets };
      });
      const totalVolume = exercises.reduce((vol, ex) => {
        return vol + ex.sets.reduce((sVol, s) => sVol + (s.completed ? s.weight * s.reps : 0), 0);
      }, 0);
      return { ...prev, exercises, totalVolume };
    });
  }, []);

  const addSetToExercise = useCallback((exerciseId: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `ws-${Date.now()}`,
          setNumber: ex.sets.length + 1,
          weight: lastSet?.weight ?? 0,
          reps: lastSet?.reps ?? 10,
          rpe: lastSet?.rpe ?? 7,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises };
    });
  }, []);

  const removeSetFromExercise = useCallback((exerciseId: string, setId: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const sets = ex.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 }));
        return { ...ex, sets };
      });
      return { ...prev, exercises };
    });
  }, []);

  const finishWorkout = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || !user) return prev;
      const finished: WorkoutSession = { ...prev, endTime: new Date().toISOString(), isActive: false };
      const newSessions = [finished, ...sessions];

      const lastWorkout = sessions.length > 0 ? new Date(sessions[0].endTime || sessions[0].startTime).toDateString() : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastWorkout === yesterday.toDateString();
      const newStreak = isConsecutive ? profile.streakDays + 1 : 1;
      const newXp = profile.xp + 100 + Math.floor(finished.totalVolume / 100);

      updateUser({
        ...user,
        sessions: newSessions,
        profile: {
          ...profile,
          totalWorkouts: profile.totalWorkouts + 1,
          totalVolume: profile.totalVolume + finished.totalVolume,
          streakDays: newStreak,
          longestStreak: Math.max(profile.longestStreak, newStreak),
          xp: newXp,
          level: Math.floor(newXp / 500) + 1,
        },
      });

      return null;
    });
    setCurrentTab("dashboard");
  }, [user, sessions, profile, updateUser]);

  const cancelWorkout = useCallback(() => {
    setActiveSession(null);
    setCurrentTab("dashboard");
  }, []);

  const addBodyMeasurement = useCallback((measurement: Omit<BodyMeasurement, "date">) => {
    if (!user) return;
    const bm: BodyMeasurement = { ...measurement, date: new Date().toISOString() };
    syncUser({
      profile: {
        ...profile,
        bodyMeasurements: [...profile.bodyMeasurements, bm],
      },
    });
    addMeasurementMutation.mutate({
      weightKg: measurement.weight,
      bodyFatPct: measurement.bodyFat,
      chestCm: measurement.chest,
      waistCm: measurement.waist,
      armsCm: measurement.arms,
      thighsCm: measurement.thighs,
    });
  }, [user, profile, syncUser, addMeasurementMutation]);

  const deleteSession = useCallback((sessionId: string) => {
    if (!user) return;
    syncUser({ sessions: sessions.filter((s) => s.id !== sessionId) });
  }, [user, sessions, syncUser]);

  const getExerciseHistory = useCallback(
    (exerciseId: string) => {
      const history: { date: string; maxWeight: number; maxReps: number; totalVolume: number; best1RM: number }[] = [];
      for (const session of sessions) {
        const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
        if (!ex) continue;
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) continue;
        const maxWeight = Math.max(...completedSets.map((s) => s.weight));
        const maxReps = Math.max(...completedSets.map((s) => s.reps));
        const totalVolume = completedSets.reduce((v, s) => v + s.weight * s.reps, 0);
        const best1RM = Math.max(...completedSets.map((s) => s.weight * (1 + s.reps / 30)));
        history.push({ date: session.startTime, maxWeight, maxReps, totalVolume, best1RM: Math.round(best1RM * 10) / 10 });
      }
      return history.reverse();
    },
    [sessions]
  );

  const getLastWorkoutForExercise = useCallback(
    (exerciseId: string) => {
      for (const session of sessions) {
        const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
        if (ex && ex.sets.some((s) => s.completed)) return ex;
      }
      return null;
    },
    [sessions]
  );

  return {
    exercises,
    routines,
    sessions,
    profile,
    activeSession,
    currentTab,
    setCurrentTab,
    addExercise,
    deleteExercise,
    addRoutine,
    deleteRoutine,
    startWorkout,
    startEmptyWorkout,
    addExerciseToActive,
    removeExerciseFromActive,
    updateSet,
    addSetToExercise,
    removeSetFromExercise,
    finishWorkout,
    cancelWorkout,
    addBodyMeasurement,
    deleteSession,
    getExerciseHistory,
    getLastWorkoutForExercise,
  };
}
