import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Plus,
  Clock,
  Dumbbell,
  Flame,
  ChevronRight,
  Star,
  Filter,
  Search,
  Zap,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import type { Routine, UserProfile, WorkoutSession } from '@/types';
import { Button } from '@/components/ui/button';

interface WorkoutHubProps {
  profile: UserProfile;
  routines: Routine[];
  sessions: WorkoutSession[];
  onStartRoutine: (routine: Routine) => void;
  onStartEmpty: () => void;
  onTabChange: (tab: string) => void;
}

const FILTER_TAGS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Upper', 'Lower', 'Full Body', 'Trap-Safe'];

function getRoutineMeta(routine: Routine) {
  const exerciseCount = routine.exercises.length;
  const totalSets = routine.exercises.reduce((a, ex) => a + ex.targetSets, 0);
  const avgRest = routine.exercises.reduce((a, ex) => a + ex.restTimerSeconds, 0) / routine.exercises.length;
  const estSeconds = totalSets * (avgRest + 45); // ~45s per set + rest
  const estMinutes = Math.round(estSeconds / 60);

  const isTrapSafe = routine.name.toLowerCase().includes('trap-safe');
  const isLower = routine.exercises.every((e) => {
    const lowerMuscles = ['Legs', 'Core'];
    return lowerMuscles.some((m) => e.exerciseName.toLowerCase().includes(m.toLowerCase()));
  });
  const isUpper = routine.exercises.every((e) => {
    const upperMuscles = ['Chest', 'Back', 'Shoulders', 'Arms'];
    return upperMuscles.some((m) => e.exerciseName.toLowerCase().includes(m.toLowerCase()));
  });

  let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
  if (exerciseCount <= 5 && totalSets <= 15) difficulty = 'Beginner';
  if (exerciseCount >= 7 || totalSets >= 25) difficulty = 'Advanced';

  let muscleTags: string[] = [];
  const muscleMap: Record<string, string[]> = {
    'Push Day': ['Chest', 'Triceps', 'Delts'],
    'Pull Day': ['Back', 'Biceps', 'Rear Delts'],
    'Lower Day': ['Quads', 'Glutes', 'Hamstrings'],
    'Conditioning Day': ['Full Body', 'Core', 'Metabolic'],
    'Upper Body Power': ['Chest', 'Back', 'Shoulders'],
    'Lower Body Strength': ['Quads', 'Glutes', 'Posterior'],
    'Full Body Hypertrophy': ['Full Body'],
  };
  for (const [key, tags] of Object.entries(muscleMap)) {
    if (routine.name.includes(key)) muscleTags = tags;
  }

  return { exerciseCount, estMinutes, difficulty, isTrapSafe, isLower, isUpper, muscleTags };
}

export function WorkoutHub({ routines, sessions, onStartRoutine, onStartEmpty, onTabChange }: WorkoutHubProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const lastSession = sessions[0];
  const daysSinceLast = lastSession
    ? Math.floor((Date.now() - new Date(lastSession.endTime || lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine recommended routine based on last workout
  const recommendedRoutine = useMemo(() => {
    if (!lastSession) return routines.find((r) => r.name.includes('Push')) || routines[0];
    const lastName = lastSession.routineName.toLowerCase();
    if (lastName.includes('push')) return routines.find((r) => r.name.includes('Pull')) || routines[0];
    if (lastName.includes('pull')) return routines.find((r) => r.name.includes('Lower')) || routines[0];
    if (lastName.includes('lower')) return routines.find((r) => r.name.includes('Conditioning')) || routines[0];
    if (lastName.includes('conditioning')) return routines.find((r) => r.name.includes('Push')) || routines[0];
    return routines[0];
  }, [lastSession, routines]);

  const filteredRoutines = useMemo(() => {
    let result = routines;

    if (activeFilter !== 'All') {
      result = result.filter((r) => {
        const meta = getRoutineMeta(r);
        if (activeFilter === 'Beginner') return meta.difficulty === 'Beginner';
        if (activeFilter === 'Intermediate') return meta.difficulty === 'Intermediate';
        if (activeFilter === 'Advanced') return meta.difficulty === 'Advanced';
        if (activeFilter === 'Upper') return meta.isUpper;
        if (activeFilter === 'Lower') return meta.isLower;
        if (activeFilter === 'Full Body') return r.name.includes('Full Body');
        if (activeFilter === 'Trap-Safe') return meta.isTrapSafe;
        return true;
      });
    }

    if (searchQuery.trim()) {
      result = result.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return result;
  }, [routines, activeFilter, searchQuery]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24 pt-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        <Button
          onClick={() => onTabChange('routines')}
          variant="outline"
          className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Hero: Ready to Train? */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white md:text-2xl">Ready to Train?</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {lastSession
              ? daysSinceLast === 0
                ? 'You crushed it today!'
                : daysSinceLast === 1
                  ? 'Rest day? Get back at it!'
                  : `Last workout was ${daysSinceLast} days ago`
              : 'Start your fitness journey today'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={onStartEmpty}
              className="rounded-full bg-emerald-500 px-6 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              <Play className="mr-2 h-4 w-4 fill-white" />
              Start Empty Workout
            </Button>
            <Button
              onClick={() => onStartEmpty()}
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Zap className="mr-2 h-4 w-4" />
              Log Quick Session
            </Button>
            <Button
              onClick={() => {
                const el = document.getElementById('routines-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              className="rounded-full border-white/20 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Dumbbell className="mr-2 h-4 w-4" />
              Browse Programs
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended for Today */}
      {recommendedRoutine && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Recommended for Today</h2>
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Based on last workout
            </span>
          </div>
          <RecommendedCard
            routine={recommendedRoutine}
            onStart={() => onStartRoutine(recommendedRoutine)}
          />
        </div>
      )}

      {/* My Routines */}
      <div id="routines-grid">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-white">My Programs</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search routines..."
                className="h-9 rounded-lg border border-white/[0.08] bg-white/5 pl-8 pr-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeFilter === tag
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'border border-white/[0.08] bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tag === 'All' && <Filter className="mr-1 inline h-3 w-3" />}
              {tag}
            </button>
          ))}
        </div>

        {/* Routine Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutines.map((routine, i) => {
            const meta = getRoutineMeta(routine);
            const isFav = favorites.has(routine.id);
            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-xl border border-white/[0.08] p-5 transition-all duration-200 hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
              >
                {/* Favorite + Trap-Safe badge */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {meta.isTrapSafe && (
                      <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        Trap-Safe
                      </span>
                    )}
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      meta.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      meta.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {meta.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(routine.id, e)}
                    className={`rounded-lg p-1 transition-colors ${
                      isFav ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white">{routine.name}</h3>
                {routine.description && <p className="mt-0.5 text-sm text-zinc-400">{routine.description}</p>}

                {/* Muscle Tags */}
                {meta.muscleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {meta.muscleTags.map((tag) => (
                      <span key={tag} className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {meta.exerciseCount} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{meta.estMinutes} min
                  </span>
                </div>

                {/* Start Button */}
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    onClick={() => onStartRoutine(routine)}
                    className="flex-1 rounded-full bg-emerald-500 py-5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    <Play className="mr-2 h-4 w-4 fill-white" />
                    Start Workout
                  </Button>
                  <button
                    onClick={() => onTabChange('routines')}
                    className="rounded-full border border-white/[0.08] bg-white/5 p-3 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {sessions.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Continue or Repeat</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 3).map((session) => {
              const duration = session.endTime
                ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                : 0;
              const daysAgo = Math.floor((Date.now() - new Date(session.startTime).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.08] p-4 transition-all hover:border-white/[0.15]"
                  style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-cyan-500/20">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-white">{session.routineName}</p>
                    <p className="text-xs text-zinc-400">
                      {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                      {duration > 0 ? ` • ${duration} min` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const routine = routines.find((r) => r.name === session.routineName);
                      if (routine) onStartRoutine(routine);
                      else onStartEmpty();
                    }}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    <RotateCcw className="mr-1 inline h-3 w-3" />
                    Repeat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RecommendedCard({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  const meta = getRoutineMeta(routine);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
      style={{ background: 'rgba(18, 18, 26, 0.8)', backdropFilter: 'blur(12px)' }}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {meta.isTrapSafe && (
              <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Trap-Safe
              </span>
            )}
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              meta.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
              meta.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {meta.difficulty}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">{routine.name}</h3>
          <p className="mt-1 text-sm text-zinc-400">{routine.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {meta.muscleTags.map((tag) => (
              <span key={tag} className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {meta.exerciseCount} exercises
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{meta.estMinutes} min
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Button
            onClick={onStart}
            className="rounded-full bg-emerald-500 px-8 py-6 text-base font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]"
          >
            <Play className="mr-2 h-5 w-5 fill-white" />
            Start This Workout
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
