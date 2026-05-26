import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, X, Clock, ChevronDown, ChevronUp, Dumbbell, Timer } from 'lucide-react';
import type { WorkoutSession, Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkoutLoggerProps {
  session: WorkoutSession;
  exercises: Exercise[];
  lastWorkouts: Record<string, { sets: { weight: number; reps: number }[] } | null>;
  onUpdateSet: (exerciseId: string, setId: string, updates: { weight?: number; reps?: number; rpe?: number; completed?: boolean }) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onAddExercise: (exercise: Exercise) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export function WorkoutLogger({
  session,
  exercises,
  lastWorkouts,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onAddExercise,
  onFinish,
  onCancel,
}: WorkoutLoggerProps) {
  void onRemoveSet;
  const [elapsed, setElapsed] = useState(0);
  const [restTimers, setRestTimers] = useState<Record<string, { remaining: number; running: boolean; total: number }>>({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set((session.exercises || []).map((e) => e.id))
  );
  const [showGlobalTimer, setShowGlobalTimer] = useState(false);
  const [globalTimerSeconds, setGlobalTimerSeconds] = useState(90);
  const [globalTimerRunning, setGlobalTimerRunning] = useState(false);
  const prevExerciseCount = useRef(session.exercises?.length || 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Workout timer
  useEffect(() => {
    const start = new Date(session.startTime).getTime();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session.startTime]);

  // Auto-expand newly added exercises
  useEffect(() => {
    const currentCount = session.exercises?.length || 0;
    if (currentCount > prevExerciseCount.current) {
      const allIds = (session.exercises || []).map((e) => e.id);
      setExpandedExercises(new Set(allIds));
    }
    prevExerciseCount.current = currentCount;
  }, [session.exercises]);

  // Per-exercise rest timers
  useEffect(() => {
    const interval = setInterval(() => {
      setRestTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].running && next[key].remaining > 0) {
            next[key] = { ...next[key], remaining: next[key].remaining - 1 };
          } else if (next[key].running && next[key].remaining <= 0) {
            next[key] = { ...next[key], running: false, remaining: 0 };
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global rest timer
  useEffect(() => {
    if (globalTimerRunning && globalTimerSeconds > 0) {
      globalTimerRef.current = setInterval(() => {
        setGlobalTimerSeconds((s) => {
          if (s <= 1) {
            setGlobalTimerRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (globalTimerRef.current) clearInterval(globalTimerRef.current); };
  }, [globalTimerRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatShortTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRestTimer = (exerciseId: string, seconds: number) => {
    setRestTimers((prev) => ({
      ...prev,
      [exerciseId]: { remaining: seconds, running: true, total: seconds },
    }));
  };

  const startGlobalTimer = (seconds: number) => {
    setGlobalTimerSeconds(seconds);
    setGlobalTimerRunning(true);
    setShowGlobalTimer(false);
  };

  const toggleExpand = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const completedSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  // SVG ring math
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  return (
    <div className="space-y-4 pb-24 pt-20">
      {/* Header Timer + Stats */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-white/[0.08] px-4 py-3 backdrop-blur-2xl lg:mx-0 lg:rounded-xl lg:border" style={{ background: 'rgba(10, 10, 15, 0.9)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Workout Timer</p>
            <p className="font-mono text-2xl font-bold text-emerald-400 md:text-3xl">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-xs text-zinc-500">Volume</p>
              <p className="font-semibold text-white">{session.totalVolume.toLocaleString()} <span className="text-xs text-zinc-500">kg</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Sets</p>
              <p className="font-semibold text-white">{completedSets}/{totalSets}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onFinish} className="flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-400">
            <Check className="mr-2 h-4 w-4" />
            Finish Workout
          </Button>
          <Button onClick={onCancel} variant="outline" className="rounded-full border-white/20 text-zinc-400 hover:bg-white/5 hover:text-white">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Exercise Cards */}
      {session.exercises.map((exercise, exIndex) => {
        const exerciseData = exercises.find((e) => e.id === exercise.exerciseId);
        const lastWorkout = lastWorkouts[exercise.exerciseId];
        const isExpanded = expandedExercises.has(exercise.id);
        const restTimer = restTimers[exercise.id];

        return (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: exIndex * 0.05 }}
            className="rounded-xl border border-white/[0.08] overflow-hidden border-l-4 border-l-emerald-500"
            style={{ background: 'linear-gradient(to right, rgba(24,24,27,0.8), rgba(39,39,42,0.6))', backdropFilter: 'blur(12px)' }}
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {exerciseData?.image && (
                  <img src={exerciseData.image} alt={exercise.exerciseName} className="h-12 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <h3 className="font-semibold text-white">{exercise.exerciseName}</h3>
                  <p className="text-xs text-zinc-400">{exerciseData?.muscleGroup} / {exerciseData?.equipment}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {restTimer && restTimer.remaining > 0 && (
                  <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono font-bold ${restTimer.running ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Clock className="h-3 w-3" />
                    {formatTime(restTimer.remaining)}
                  </div>
                )}
                <button onClick={() => toggleExpand(exercise.id)} className="rounded-lg p-1 text-zinc-500 hover:text-white">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                <button onClick={() => onRemoveExercise(exercise.id)} className="rounded-lg p-1 text-zinc-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sets Table */}
            {isExpanded && (
              <div className="border-t border-white/[0.06] px-4 pb-4">
                <div className="grid grid-cols-[40px_1fr_1fr_60px_40px] gap-2 py-2 text-xs font-medium text-zinc-500 uppercase">
                  <span>Set</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">Reps</span>
                  <span className="text-center">RPE</span>
                  <span></span>
                </div>
                {exercise.sets.map((set, setIndex) => {
                  const lastSet = lastWorkout?.sets[setIndex];
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-[40px_1fr_1fr_60px_40px] items-center gap-2 rounded-lg py-2 px-1 transition-all ${
                        set.completed ? 'border-l-2 border-l-emerald-500 bg-emerald-500/5' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-400">{set.setNumber}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight || ''}
                        placeholder={lastSet ? String(lastSet.weight) : '0'}
                        onChange={(e) => onUpdateSet(exercise.id, set.id, { weight: parseFloat(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/5 text-center text-sm font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps || ''}
                        placeholder={lastSet ? String(lastSet.reps) : '0'}
                        onChange={(e) => onUpdateSet(exercise.id, set.id, { reps: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/5 text-center text-sm font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                      />
                      <select
                        value={set.rpe || 7}
                        onChange={(e) => onUpdateSet(exercise.id, set.id, { rpe: parseInt(e.target.value) })}
                        className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/5 text-center text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
                          <option key={rpe} value={rpe} className="bg-zinc-900">{rpe}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          onUpdateSet(exercise.id, set.id, { completed: !set.completed });
                          if (!set.completed) {
                            startRestTimer(exercise.id, exercise.restTimerSeconds);
                          }
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                          set.completed
                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'border border-white/[0.08] text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-400'
                        }`}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={() => onAddSet(exercise.id)}
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-white/[0.08] text-zinc-400 hover:bg-white/5 hover:text-white"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Set
                  </Button>
                  <div className="flex items-center gap-1">
                    {[30, 60, 90, 120, 180, 240].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => startRestTimer(exercise.id, sec)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Add Exercise Button */}
      <Button
        onClick={() => setShowExercisePicker(true)}
        className="w-full rounded-xl border-2 border-dashed border-white/[0.08] bg-transparent py-6 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Exercise
      </Button>

      {/* Exercise Picker Dialog */}
      <Dialog open={showExercisePicker} onOpenChange={setShowExercisePicker}>
        <DialogContent className="max-h-[80vh] overflow-y-auto border-white/[0.08] bg-[#12121A] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  onAddExercise(ex);
                  setShowExercisePicker(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all hover:bg-white/5"
              >
                {ex.image ? (
                  <img src={ex.image} alt={ex.name} className="h-10 w-14 rounded-md object-cover" />
                ) : (
                  <div className="flex h-10 w-14 items-center justify-center rounded-md bg-zinc-800">
                    <Dumbbell className="h-4 w-4 text-zinc-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-zinc-400">{ex.muscleGroup} / {ex.equipment}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Floating Rest Timer FAB ─── */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowGlobalTimer(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] md:bottom-8"
        title="Rest Timer"
      >
        {globalTimerRunning ? (
          <span className="font-mono text-sm font-bold">{formatShortTime(globalTimerSeconds)}</span>
        ) : (
          <Timer className="h-6 w-6" />
        )}
      </motion.button>

      {/* ─── Rest Timer Modal ─── */}
      {showGlobalTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowGlobalTimer(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.12] p-6" style={{ background: 'rgba(18, 18, 26, 0.95)', backdropFilter: 'blur(20px)' }}
          >
            <h3 className="mb-4 text-center text-lg font-bold text-white">Rest Timer</h3>

            {/* SVG Countdown Ring */}
            <div className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
                {/* Background ring */}
                <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                {/* Progress ring */}
                <circle
                  cx="60" cy="60" r={ringRadius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={globalTimerRunning ? ringCircumference - (globalTimerSeconds / 90) * ringCircumference : ringCircumference}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="text-center">
                <p className="font-mono text-3xl font-bold text-white">
                  {globalTimerRunning ? formatShortTime(globalTimerSeconds) : '--:--'}
                </p>
                <p className="text-xs text-zinc-500">{globalTimerRunning ? 'Resting...' : 'Ready'}</p>
              </div>
            </div>

            {/* Timer preset buttons */}
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startGlobalTimer(sec)}
                  className="rounded-xl bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500/20 hover:text-emerald-400 active:scale-95"
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Pause / Resume / Stop */}
            {globalTimerRunning && (
              <div className="flex gap-2">
                <button
                  onClick={() => setGlobalTimerRunning(false)}
                  className="flex-1 rounded-xl bg-yellow-500/20 py-3 text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/30"
                >
                  Pause
                </button>
                <button
                  onClick={() => { setGlobalTimerRunning(false); setGlobalTimerSeconds(0); }}
                  className="flex-1 rounded-xl bg-red-500/20 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30"
                >
                  Stop
                </button>
              </div>
            )}
            {!globalTimerRunning && globalTimerSeconds === 0 && (
              <button
                onClick={() => setShowGlobalTimer(false)}
                className="w-full rounded-xl bg-white/5 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-white/10"
              >
                Close
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
