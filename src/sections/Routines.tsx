import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Search,
  Star,
  Clock,
  Dumbbell,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import type { Routine, Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Athlete program metadata ───────────────────────────────────────
interface ProgramCollection {
  id: string;
  athleteName: string;
  subtitle: string;
  image: string;
  dayCount: number;
  tag: string;
  color: string;
  routineIds: string[];
}

// ─── Exercise-specific defaults ────────────────────────────────────
// Returns appropriate defaults based on exercise type (strength vs timed vs cardio)
function getExerciseDefaults(exercise: Exercise) {
  const name = exercise.name.toLowerCase();

  // Timed exercises: reps = seconds
  if (name.includes('plank') || name.includes('dead hang') || name.includes('farmer')) {
    return { targetSets: 3, targetRepsMin: 30, targetRepsMax: 60, restTimerSeconds: 45, unit: 's' };
  }
  if (name.includes('dead bug') || name.includes('pallof') || name.includes('glute bridge')) {
    return { targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restTimerSeconds: 45, unit: 'reps' };
  }
  if (name.includes('wall ball') || name.includes('burpee') || name.includes('box jump')) {
    return { targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restTimerSeconds: 60, unit: 'reps' };
  }

  // Cardio exercises: reps = meters or seconds
  if (name.includes('skierg') || name.includes('rowing') || name.includes('treadmill') || name.includes('run') || name.includes('jog') || name.includes('sprint')) {
    return { targetSets: 1, targetRepsMin: 500, targetRepsMax: 1000, restTimerSeconds: 120, unit: 'm' };
  }
  if (name.includes('bike') || name.includes('cycle') || name.includes('elliptical') || name.includes('stair')) {
    return { targetSets: 1, targetRepsMin: 600, targetRepsMax: 1800, restTimerSeconds: 60, unit: 's' };
  }
  if (name.includes('sled push') || name.includes('sled pull')) {
    return { targetSets: 5, targetRepsMin: 25, targetRepsMax: 50, restTimerSeconds: 120, unit: 'm' };
  }
  if (name.includes('sandbag lunge')) {
    return { targetSets: 3, targetRepsMin: 30, targetRepsMax: 100, restTimerSeconds: 90, unit: 'm' };
  }
  if (name.includes('mountain climber') || name.includes('jumping jack') || name.includes('high knee')) {
    return { targetSets: 3, targetRepsMin: 20, targetRepsMax: 30, restTimerSeconds: 30, unit: 'reps' };
  }
  if (name.includes('kettlebell swing') || name.includes('kb swing')) {
    return { targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, restTimerSeconds: 60, unit: 'reps' };
  }
  if (name.includes('bicycle crunch') || name.includes('leg raise') || name.includes('ab wheel')) {
    return { targetSets: 3, targetRepsMin: 10, targetRepsMax: 20, restTimerSeconds: 45, unit: 'reps' };
  }

  // Default strength exercise
  return { targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restTimerSeconds: 90, unit: 'reps' };
}

function getUnitLabel(exerciseName: string): string {
  const name = exerciseName.toLowerCase();
  if (name.includes('plank') || name.includes('dead hang') || name.includes('farmer')) return 'sec';
  if (name.includes('skierg') || name.includes('rowing') || name.includes('sled push') || name.includes('sled pull') || name.includes('sandbag lunge') || name.includes('treadmill') || name.includes('run') || name.includes('jog') || name.includes('sprint')) return 'meters';
  if (name.includes('bike') || name.includes('cycle') || name.includes('elliptical') || name.includes('stair')) return 'sec';
  return 'reps';
}

const PROGRAM_COLLECTIONS: ProgramCollection[] = [
  {
    id: 'hyrox-male',
    athleteName: 'HYROX Male',
    subtitle: '8-week race prep — 8 stations, 8km runs, metabolic conditioning',
    image: '/hyrox-male.jpg',
    dayCount: 14,
    tag: 'HYROX',
    color: '#FF6B00',
    routineIds: [
      'rt-hm1-d1','rt-hm1-d2','rt-hm1-d3','rt-hm1-d4','rt-hm1-d5','rt-hm1-d6','rt-hm1-d7',
      'rt-hm2-d1','rt-hm2-d2','rt-hm2-d3','rt-hm2-d4','rt-hm2-d5','rt-hm2-d6','rt-hm2-d7',
    ],
  },
  {
    id: 'hyrox-female',
    athleteName: 'HYROX Female',
    subtitle: '8-week race prep — tailored weights, station pacing, transition drills',
    image: '/hyrox-female.jpg',
    dayCount: 14,
    tag: 'HYROX',
    color: '#E91E63',
    routineIds: [
      'rt-hf1-d1','rt-hf1-d2','rt-hf1-d3','rt-hf1-d4','rt-hf1-d5','rt-hf1-d6','rt-hf1-d7',
      'rt-hf2-d1','rt-hf2-d2','rt-hf2-d3','rt-hf2-d4','rt-hf2-d5','rt-hf2-d6','rt-hf2-d7',
    ],
  },
  {
    id: 'cbum',
    athleteName: 'Chris Bumstead',
    subtitle: 'Classic Physique — High-volume hypertrophy for stage-ready aesthetics',
    image: '/cbum-v2.jpg',
    dayCount: 5,
    tag: 'Bodybuilding',
    color: '#F59E0B',
    routineIds: ['rt-cbum-d1', 'rt-cbum-d2', 'rt-cbum-d3', 'rt-cbum-d4', 'rt-cbum-d5'],
  },
  {
    id: 'nippard',
    athleteName: 'Jeff Nippard',
    subtitle: 'Science-Based Upper/Lower — Evidence-based periodization',
    image: '/nippard-v2.jpg',
    dayCount: 4,
    tag: 'Science-Based',
    color: '#3B82F6',
    routineIds: ['rt-nippard-d1', 'rt-nippard-d2', 'rt-nippard-d3', 'rt-nippard-d4'],
  },
  {
    id: 'ppl',
    athleteName: 'Push Pull Legs',
    subtitle: 'The most popular bodybuilding split — high frequency, dedicated focus',
    image: '/ppl.jpg',
    dayCount: 3,
    tag: 'Classic Split',
    color: '#8B5CF6',
    routineIds: ['rt-ppl-d1', 'rt-ppl-d2', 'rt-ppl-d3'],
  },
  {
    id: 'stronglifts',
    athleteName: 'StrongLifts 5x5',
    subtitle: 'Raw strength for beginners — 3 compound lifts per session',
    image: '/stronglifts.jpg',
    dayCount: 2,
    tag: 'Strength',
    color: '#EF4444',
    routineIds: ['rt-5x5-a', 'rt-5x5-b'],
  },
  {
    id: 'whitney',
    athleteName: 'Whitney Simmons',
    subtitle: 'Strength & Sculpt — progressive overload with glute focus',
    image: '/whitney.jpg',
    dayCount: 4,
    tag: 'Women Strength',
    color: '#EC4899',
    routineIds: ['rt-whitney-d1', 'rt-whitney-d2', 'rt-whitney-d3', 'rt-whitney-d4'],
  },
];

// Single-routine influencer programs
const SINGLE_PROGRAMS = [
  { id: 'rt-chloe', name: 'Chloe Ting', image: '/chloe.jpg', tag: 'HIIT / Home', color: '#F97316' },
  { id: 'rt-kayla', name: 'Kayla Itsines', image: '/kayla.jpg', tag: 'BBG / Circuit', color: '#06B6D4' },
];

// ─── Difficulty helper ──────────────────────────────────────────────
function getDifficulty(routine: Routine): 'Beginner' | 'Intermediate' | 'Advanced' {
  const exerciseCount = routine.exercises.length;
  const totalSets = routine.exercises.reduce((a, ex) => a + ex.targetSets, 0);
  if (exerciseCount <= 5 && totalSets <= 15) return 'Beginner';
  if (exerciseCount >= 7 || totalSets >= 25) return 'Advanced';
  return 'Intermediate';
}

// ─── Props ──────────────────────────────────────────────────────────
interface RoutinesProps {
  routines: Routine[];
  exercises: Exercise[];
  onAddRoutine: (routine: Omit<Routine, 'id'>) => void;
  onDeleteRoutine: (id: string) => void;
  onStartRoutine: (routine: Routine) => void;
}

// ─── Component ──────────────────────────────────────────────────────
export function Routines({ routines, exercises, onAddRoutine, onDeleteRoutine, onStartRoutine }: RoutinesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedStandalone, setExpandedStandalone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    exercises: [] as { exerciseId: string; exerciseName: string; targetSets: number; targetRepsMin: number; targetRepsMax: number; restTimerSeconds: number }[],
  });

  // Build lookup
  const routineMap = useMemo(() => {
    const map: Record<string, Routine> = {};
    routines.forEach((r) => { map[r.id] = r; });
    return map;
  }, [routines]);

  // Collect routines that are part of collections
  const collectedIds = useMemo(() => {
    const ids = new Set<string>();
    PROGRAM_COLLECTIONS.forEach((c) => c.routineIds.forEach((rid) => ids.add(rid)));
    SINGLE_PROGRAMS.forEach((s) => ids.add(s.id));
    return ids;
  }, []);

  // Standalone routines (not part of any collection)
  const standaloneRoutines = useMemo(() => {
    return routines.filter((r) => !collectedIds.has(r.id));
  }, [routines, collectedIds]);

  const filteredStandalone = useMemo(() => {
    if (!searchQuery.trim()) return standaloneRoutines;
    const q = searchQuery.toLowerCase();
    return standaloneRoutines.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.exercises.some((e) => e.exerciseName.toLowerCase().includes(q))
    );
  }, [standaloneRoutines, searchQuery]);

  // Favorites toggle
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create routine helpers
  const addExerciseToRoutine = (exercise: Exercise) => {
    const defs = getExerciseDefaults(exercise);
    setNewRoutine((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          targetSets: defs.targetSets,
          targetRepsMin: defs.targetRepsMin,
          targetRepsMax: defs.targetRepsMax,
          restTimerSeconds: defs.restTimerSeconds,
        },
      ],
    }));
  };

  const removeRoutineExercise = (index: number) => {
    setNewRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const updateRoutineExercise = (index: number, field: string, value: number) => {
    setNewRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 pt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Programs</h1>
          <p className="mt-1 text-sm text-zinc-400">Train like the pros — full multi-day splits</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* ─── Featured Athlete Programs ─── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Featured Athlete Programs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAM_COLLECTIONS.map((collection) => {
            return (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-200 hover:border-white/[0.15]"
                style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
              >
                {/* Athlete Portrait Header */}
                <div className="flex flex-col items-center px-4 pt-5 pb-3">
                  <div className="relative">
                    <img
                      src={collection.image}
                      alt={collection.athleteName}
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${collection.color}25`, color: collection.color, border: `1px solid ${collection.color}40` }}
                    >
                      {collection.tag}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{collection.athleteName}</h3>
                  <p className="mt-0.5 text-center text-xs text-zinc-400 line-clamp-2">{collection.subtitle}</p>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-center gap-4 border-y border-white/[0.06] px-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{collection.dayCount} days</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Dumbbell className="h-3.5 w-3.5" />
                    <span>
                      {collection.routineIds.reduce(
                        (acc, rid) => acc + (routineMap[rid]?.exercises.length ?? 0),
                        0
                      )}{' '}
                      exercises
                    </span>
                  </div>
                </div>

                {/* Day Routines */}
                <div className="divide-y divide-white/[0.04]">
                  {collection.routineIds.map((rid) => {
                    const rt = routineMap[rid];
                    if (!rt) return null;
                    return (
                      <div key={rid} className="flex items-center gap-3 px-4 py-2.5">
                        <img
                          src={collection.image}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover opacity-60"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-zinc-400">
                          {rt.name.match(/Day (\d+)/)?.[1] || '•'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{rt.name.replace(/^.*?Day \d+:\s*/, '')}</p>
                          <p className="text-xs text-zinc-500">{rt.exercises.length} exercises</p>
                        </div>
                        <button
                          onClick={() => onStartRoutine(rt)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Quick Programs (Single-Routine Influencers) ─── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Quick Programs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SINGLE_PROGRAMS.map((sp) => {
            const rt = routineMap[sp.id];
            if (!rt) return null;
            return (
              <motion.div
                key={sp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl border border-white/[0.08] p-4 transition-all duration-200 hover:border-white/[0.15]"
                style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
              >
                <img
                  src={sp.image}
                  alt={sp.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${sp.color}20`, color: sp.color }}
                  >
                    {sp.tag}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-white">{sp.name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{rt.description}</p>
                </div>
                <button
                  onClick={() => onStartRoutine(rt)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white"
                >
                  <Play className="h-4 w-4 fill-current" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Standalone Programs ─── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">All Programs</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="h-9 w-48 rounded-full border-white/[0.08] bg-white/5 pl-9 text-sm text-white placeholder-zinc-600 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredStandalone.map((routine) => {
            const isExpanded = expandedStandalone === routine.id;
            const isFav = favorites.has(routine.id);
            const difficulty = getDifficulty(routine);

            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-200 hover:border-white/[0.15]"
                style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleFavorite(routine.id)}
                    className={`shrink-0 transition-colors ${isFav ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    <Star className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{routine.name}</h3>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                        difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {difficulty}
                      </span>
                    </div>
                    {routine.description && (
                      <p className="text-sm text-zinc-400 truncate">{routine.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {routine.exercises.length} exercises
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(
                          routine.exercises.reduce(
                            (acc, ex) => acc + ex.targetSets * (ex.restTimerSeconds / 60) + ex.targetSets * 1.5,
                            0
                          )
                        )}{' '}
                        min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartRoutine(routine)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                    <button
                      onClick={() => setExpandedStandalone(isExpanded ? null : routine.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    {!routine.isTemplate && (
                      <button
                        onClick={() => onDeleteRoutine(routine.id)}
                        className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] px-4 pb-4">
                        <div className="mt-3 space-y-2">
                          {routine.exercises.map((ex, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
                            >
                              <GripVertical className="h-4 w-4 text-zinc-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{ex.exerciseName}</p>
                                <p className="text-xs text-zinc-500">
                                  {ex.targetSets} × {ex.targetRepsMin}-{ex.targetRepsMax} {getUnitLabel(ex.exerciseName)} •{' '}
                                  {ex.restTimerSeconds}s rest
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Create Program Dialog ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/[0.08] bg-[#12121A] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Program</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-zinc-400">Program Name</Label>
              <Input
                value={newRoutine.name}
                onChange={(e) => setNewRoutine((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Push Day A"
                className="mt-1 border-white/[0.08] bg-white/5 text-white placeholder-zinc-600 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Description (optional)</Label>
              <Input
                value={newRoutine.description}
                onChange={(e) => setNewRoutine((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Chest, shoulders, triceps"
                className="mt-1 border-white/[0.08] bg-white/5 text-white placeholder-zinc-600 focus:border-emerald-500"
              />
            </div>

            {/* Add Exercises */}
            <div>
              <Label className="text-zinc-400">Add Exercises</Label>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/[0.08]">
                {exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExerciseToRoutine(ex)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/5"
                  >
                    <Plus className="h-3 w-3 text-emerald-400" />
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Exercises */}
            {newRoutine.exercises.length > 0 && (
              <div className="space-y-2">
                <Label className="text-zinc-400">Selected Exercises</Label>
                {newRoutine.exercises.map((ex, i) => (
                  <div key={i} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{ex.exerciseName}</p>
                      <button onClick={() => removeRoutineExercise(i)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-zinc-500">Sets</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={ex.targetSets}
                          onChange={(e) => updateRoutineExercise(i, 'targetSets', Math.max(1, parseInt(e.target.value) || 1))}
                          className="mt-0.5 h-8 w-full rounded border border-white/[0.08] bg-white/5 text-center text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Min {getUnitLabel(ex.exerciseName)}</label>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={ex.targetRepsMin}
                          onChange={(e) => updateRoutineExercise(i, 'targetRepsMin', Math.max(1, parseInt(e.target.value) || 1))}
                          className="mt-0.5 h-8 w-full rounded border border-white/[0.08] bg-white/5 text-center text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Max {getUnitLabel(ex.exerciseName)}</label>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={ex.targetRepsMax}
                          onChange={(e) => updateRoutineExercise(i, 'targetRepsMax', Math.max(1, parseInt(e.target.value) || 1))}
                          className="mt-0.5 h-8 w-full rounded border border-white/[0.08] bg-white/5 text-center text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Rest (s)</label>
                        <input
                          type="number"
                          min={0}
                          max={600}
                          value={ex.restTimerSeconds}
                          onChange={(e) => updateRoutineExercise(i, 'restTimerSeconds', Math.max(0, parseInt(e.target.value) || 0))}
                          className="mt-0.5 h-8 w-full rounded border border-white/[0.08] bg-white/5 text-center text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!newRoutine.name.trim() && (
              <p className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" /> Enter a program name
              </p>
            )}
            {newRoutine.name.trim() && newRoutine.exercises.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" /> Add at least one exercise
              </p>
            )}
            <Button
              onClick={() => {
                if (newRoutine.name.trim() && newRoutine.exercises.length > 0) {
                  onAddRoutine({
                    ...newRoutine,
                    isTemplate: false,
                  });
                  setNewRoutine({ name: '', description: '', exercises: [] });
                  setShowAddDialog(false);
                }
              }}
              disabled={!newRoutine.name.trim() || newRoutine.exercises.length === 0}
              className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
