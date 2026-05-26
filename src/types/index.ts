export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  image?: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  isWarmup?: boolean;
  isDropSet?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  restTimerSeconds: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  routineName: string;
  startTime: string;
  endTime?: string;
  exercises: WorkoutExercise[];
  isActive: boolean;
  totalVolume: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isTemplate?: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restTimerSeconds: number;
}

export interface BodyMeasurement {
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
}

export interface UserProfile {
  displayName: string;
  gender: 'male' | 'female' | 'other' | '';
  age: number;
  heightCm: number;
  weightKg: number;
  level: number;
  xp: number;
  streakDays: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolume: number;
  bodyMeasurements: BodyMeasurement[];
  avatar?: string;
  weeklyGoal?: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  createdAt: string;
  profile: UserProfile;
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
}

export type AppTab = 'dashboard' | 'workout' | 'exercises' | 'routines' | 'analytics' | 'history';
