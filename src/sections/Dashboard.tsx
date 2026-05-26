import { motion } from 'framer-motion';
import { Flame, Trophy, Play, Dumbbell, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { UserProfile, Routine, WorkoutSession } from '@/types';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  profile: UserProfile;
  routines: Routine[];
  activeSession: WorkoutSession | null;
  sessions: WorkoutSession[];
  onStartRoutine: (routine: Routine) => void;
  onStartEmpty: () => void;
  onTabChange: (tab: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const FEATURED_IDS = ['rt-1','rt-2','rt-3','rt-ts-1','rt-cbum-d1','rt-nippard-d1'];

const PILL_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  'rt-1':          { label: 'Upper Body', bg: '#FAE8E6', color: '#B06055' },
  'rt-2':          { label: 'Lower Body', bg: '#E8F2EA', color: '#5A8A62' },
  'rt-3':          { label: 'Full Body',  bg: '#F0E8F5', color: '#8A5EA0' },
  'rt-ts-1':       { label: 'Trap-Safe',  bg: '#FDF0E8', color: '#B07040' },
  'rt-cbum-d1':    { label: 'Quads',      bg: '#FAE8F0', color: '#B06080' },
  'rt-nippard-d1': { label: 'Push/Pull',  bg: '#E8EEF8', color: '#5060A0' },
};

function getMotivationCopy(daysSince: number | null, isLight: boolean): string {
  if (!isLight) {
    if (daysSince === null) return 'Start your fitness journey today';
    if (daysSince === 0) return 'You crushed it today!';
    if (daysSince === 1) return 'Rest day? Get back at it!';
    return `Last workout was ${daysSince} days ago`;
  }
  if (daysSince === null) return 'Your journey to a stronger you starts now — every rep counts.';
  if (daysSince === 0) return 'You crushed it today — rest up and come back stronger.';
  if (daysSince === 1) return "Ready to get back at it? You've got this.";
  return `Last workout was ${daysSince} days ago — let's change that.`;
}

export function Dashboard({ profile, routines, activeSession, sessions, onStartRoutine, onStartEmpty, onTabChange }: DashboardProps) {
  const { isLight } = useTheme();
  const lastSession = sessions[0];
  const daysSinceLastWorkout = lastSession
    ? Math.floor((Date.now() - new Date(lastSession.endTime || lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let featuredRoutines = FEATURED_IDS.map((id) => routines.find((r) => r.id === id)).filter(Boolean) as Routine[];
  if (featuredRoutines.length === 0 && routines.length > 0) featuredRoutines = routines.slice(0, 6);

  const motivationCopy = getMotivationCopy(daysSinceLastWorkout, isLight);

  // ─── LIGHT MODE ───────────────────────────────────────────────────────────────
  if (isLight) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-24 pt-20">

        {/* Hero */}
        <motion.div variants={item} className="relative overflow-hidden rounded-3xl p-9"
          style={{ background: 'linear-gradient(135deg, #FDF0EC 0%, #FAE8F0 50%, #F0EAF8 100%)', border: '0.5px solid #F0D8D0' }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,168,156,0.28), transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-44 w-44 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(200,180,230,0.22), transparent 70%)' }} />
          <span className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 select-none text-[100px] leading-none"
            style={{ color: '#C27B6E', opacity: 0.10 }}>✦</span>

          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="animate-gentle-pulse text-sm" style={{ color: '#C27B6E' }}>✦</span>
              <span className="text-xs font-medium uppercase" style={{ color: '#C27B6E', letterSpacing: '0.12em' }}>Your Fitness Journey</span>
            </div>
            <h1 className="mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '36px', fontWeight: 400, color: '#2D2420' }}>
              Welcome back, <span style={{ color: '#C27B6E' }}>{profile.displayName}</span>
            </h1>
            <p className="mb-7 text-sm font-light" style={{ color: '#8A7572' }}>
              {activeSession ? `Workout in progress: ${activeSession.routineName}` : motivationCopy}
            </p>
            <div className="flex flex-wrap gap-3">
              {activeSession ? (
                <button onClick={() => onTabChange('workout')}
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5"
                  style={{ background: '#C27B6E', boxShadow: '0 4px 18px rgba(194,123,110,0.38)' }}>
                  <Play className="h-4 w-4 fill-white" /> Resume Workout
                </button>
              ) : (
                <>
                  <button onClick={onStartEmpty}
                    className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5"
                    style={{ background: '#C27B6E', boxShadow: '0 4px 18px rgba(194,123,110,0.38)' }}>
                    <Play className="h-4 w-4 fill-white" /> Start Workout
                  </button>
                  <button onClick={() => onTabChange('routines')}
                    className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-white"
                    style={{ background: 'rgba(255,255,255,0.7)', color: '#C27B6E', border: '1px solid #E8C4BC' }}>
                    <Dumbbell className="h-4 w-4" /> Browse Programs
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item}>
          <h2 className="mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#2D2420' }}>Your Stats</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LightStatCard icon="🔥" label="Day Streak"      value={`${profile.streakDays}`}                       barClass="lm-bar-rose"  iconClass="lm-icon-rose"  onClick={() => onTabChange('analytics')} />
            <LightStatCard icon="🏆" label="Fitness Level"   value={`Lv. ${profile.level}`}                        barClass="lm-bar-mauve" iconClass="lm-icon-mauve" onClick={() => onTabChange('analytics')} />
            <LightStatCard icon="💪" label="Total Workouts"  value={`${profile.totalWorkouts}`}                    barClass="lm-bar-sage"  iconClass="lm-icon-sage"  onClick={() => onTabChange('history')} />
            <LightStatCard icon="📈" label="Total Volume"    value={`${(profile.totalVolume / 1000).toFixed(1)}k`} unit="kg" barClass="lm-bar-blush" iconClass="lm-icon-blush" onClick={() => onTabChange('analytics')} />
          </div>
        </motion.div>

        {/* Recent workouts */}
        {sessions.length > 0 && (
          <motion.div variants={item}>
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#2D2420' }}>Recent Workouts</h2>
              <button onClick={() => onTabChange('history')} className="text-xs font-medium" style={{ color: '#C27B6E' }}>View All</button>
            </div>
            <div className="space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} onClick={() => onTabChange('history')}
                  className="flex items-center justify-between cursor-pointer rounded-2xl p-4 transition-all hover:-translate-y-0.5"
                  style={{ background: '#fff', border: '0.5px solid #F0E4DC', boxShadow: '0 1px 3px rgba(194,123,110,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#FAE8E6' }}>
                      <Clock className="h-5 w-5" style={{ color: '#C27B6E' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2D2420' }}>{session.routineName}</p>
                      <p className="text-xs" style={{ color: '#B8A5A2' }}>
                        {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: '#C27B6E' }}>{session.totalVolume.toLocaleString()} kg</p>
                    <p className="text-xs" style={{ color: '#B8A5A2' }}>Volume</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Start Programs */}
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 400, color: '#2D2420' }}>Quick Start Programs</h2>
            <button onClick={() => onTabChange('routines')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#C27B6E' }}>
              Browse all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {featuredRoutines.map((routine) => {
              const pill = PILL_STYLES[routine.id] ?? { label: 'Program', bg: '#FAE8E6', color: '#B06055' };
              const estMin = Math.round(routine.exercises.reduce((a, ex) => a + ex.targetSets * (ex.restTimerSeconds / 60) + ex.targetSets * 1.5, 0));
              return (
                <div key={routine.id} onClick={() => onStartRoutine(routine)}
                  className="group cursor-pointer rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
                  style={{ background: '#fff', border: '0.5px solid #F0E4DC', boxShadow: '0 1px 3px rgba(194,123,110,0.06)' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 28px rgba(194,123,110,0.14)'; el.style.borderColor = '#E8C4BC'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 3px rgba(194,123,110,0.06)'; el.style.borderColor = '#F0E4DC'; }}
                >
                  <div className="mb-2.5 flex items-start justify-between">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase"
                      style={{ background: pill.bg, color: pill.color, letterSpacing: '0.08em' }}>{pill.label}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full transition-all group-hover:bg-[#C27B6E]"
                      style={{ background: '#FAF0EE', border: '1px solid #F0D8D0', color: '#C27B6E' }}>
                      <Play className="h-3.5 w-3.5 fill-current group-hover:text-white" />
                    </div>
                  </div>
                  <h3 className="mb-1.5 text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, color: '#2D2420' }}>{routine.name}</h3>
                  <p className="mb-3 text-xs leading-relaxed line-clamp-2" style={{ color: '#A0918E' }}>{routine.description}</p>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: '#B8A5A2' }}><Dumbbell className="h-3 w-3" /> {routine.exercises.length} exercises</span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: '#B8A5A2' }}><Clock className="h-3 w-3" /> {estMin} min</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Motivation banner */}
          <div className="mt-5 flex items-center justify-between rounded-2xl px-6 py-5"
            style={{ background: 'linear-gradient(135deg, #C27B6E, #A06090)' }}>
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 400, color: 'white', opacity: 0.95 }}>
                {sessions.length === 0 ? 'Ready to log your first session?' : 'Keep the momentum going!'}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {sessions.length === 0 ? "Every legend starts at Day 1 — you've got this." : `${profile.totalWorkouts} workouts down. What's next?`}
              </p>
            </div>
            <button onClick={onStartEmpty}
              className="ml-4 shrink-0 rounded-full px-5 py-2 text-xs font-medium text-white transition-all hover:bg-white/30"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
              Begin Now →
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── DARK MODE ────────────────────────────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 pt-20">
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="absolute inset-0 opacity-20"><img src="/hero-bg.jpg" alt="" className="h-full w-full object-cover" /></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold md:text-3xl text-white">
            Welcome back, <span className="text-emerald-400">{profile.displayName}</span>
          </h1>
          <p className="mt-1.5 text-zinc-400">{activeSession ? `Workout in progress: ${activeSession.routineName}` : motivationCopy}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {activeSession ? (
              <Button onClick={() => onTabChange('workout')} className="rounded-full px-6 text-white font-semibold"
                style={{ background: 'linear-gradient(135deg,#2EAE7D,#4ECDC4)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                <Play className="mr-2 h-4 w-4 fill-white" /> Resume Workout
              </Button>
            ) : (
              <>
                <Button onClick={onStartEmpty} className="rounded-full px-6 text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg,#2EAE7D,#4ECDC4)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                  <Play className="mr-2 h-4 w-4 fill-white" /> Start Workout
                </Button>
                <Button variant="outline" onClick={() => onTabChange('routines')} className="rounded-full font-semibold"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                  <Dumbbell className="mr-2 h-4 w-4" /> Browse Programs
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h2 className="mb-3 text-lg font-semibold text-white">Your Stats</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <DarkStatCard icon={Flame}     label="Current Streak" value={`${profile.streakDays} days`}                       accent="orange" onClick={() => onTabChange('analytics')} />
          <DarkStatCard icon={Trophy}    label="Fitness Level"  value={`Level ${profile.level}`}                           accent="yellow" onClick={() => onTabChange('analytics')} />
          <DarkStatCard icon={Dumbbell}  label="Total Workouts" value={`${profile.totalWorkouts}`}                         accent="emerald" onClick={() => onTabChange('history')} />
          <DarkStatCard icon={TrendingUp} label="Total Volume"  value={`${(profile.totalVolume / 1000).toFixed(1)}k kg`}  accent="cyan" onClick={() => onTabChange('analytics')} />
        </div>
      </motion.div>

      {sessions.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Workouts</h2>
            <button onClick={() => onTabChange('history')} className="text-sm text-emerald-400 hover:text-emerald-300">View All</button>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 3).map((session) => (
              <div key={session.id} onClick={() => onTabChange('history')}
                className="flex items-center justify-between rounded-xl border border-white/[0.08] p-4 transition-all duration-200 hover:border-white/[0.15] hover:-translate-y-0.5 cursor-pointer"
                style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{session.routineName}</p>
                    <p className="text-sm text-zinc-400">
                      {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {session.exercises.length} exercises
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-400">{session.totalVolume.toLocaleString()} kg</p>
                  <p className="text-xs text-zinc-500">Volume</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Quick Start Programs</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {featuredRoutines.map((routine) => (
            <div key={routine.id}
              className="group cursor-pointer rounded-xl border border-white/[0.08] border-l-4 border-l-emerald-500 p-4 transition-all duration-200 hover:border-emerald-500/50 hover:-translate-y-1"
              style={{ background: 'linear-gradient(to right, rgba(24,24,27,0.8), rgba(39,39,42,0.6))', backdropFilter: 'blur(12px)' }}
              onClick={() => onStartRoutine(routine)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{routine.name}</h3>
                <Play className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{routine.description}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {routine.exercises.length} exercises &bull; {Math.round(routine.exercises.reduce((a, ex) => a + ex.targetSets * (ex.restTimerSeconds / 60) + ex.targetSets * 1.5, 0))} min est.
              </p>
            </div>
          ))}
        </div>
        <button onClick={() => onTabChange('workout')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] py-3 text-sm font-medium text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-emerald-400">
          Browse All Programs <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Light mode stat card ─────────────────────────────────────────────────────
function LightStatCard({ icon, label, value, unit, barClass, iconClass, onClick }: {
  icon: string; label: string; value: string; unit?: string;
  barClass: string; iconClass: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: '#fff', border: '0.5px solid #F0E4DC', boxShadow: '0 1px 3px rgba(194,123,110,0.06)' }}>
      <div className={`mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl text-lg ${iconClass}`}>{icon}</div>
      <div className="leading-none">
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', fontWeight: 400, color: '#2D2420' }}>{value}</span>
        {unit && <span className="ml-1 text-sm" style={{ color: '#A0918E' }}>{unit}</span>}
      </div>
      <p className="mt-1 text-xs" style={{ color: '#A0918E' }}>{label}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl ${barClass}`} />
    </div>
  );
}

// ─── Dark mode stat card ──────────────────────────────────────────────────────
function DarkStatCard({ icon: Icon, label, value, accent, onClick }: {
  icon: React.ElementType; label: string; value: string; accent: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    orange: 'text-orange-400 bg-orange-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
  };
  return (
    <motion.div whileHover={{ y: -4 }} onClick={onClick}
      className={`rounded-xl border border-white/[0.08] p-4 transition-all duration-200 hover:border-white/[0.15] ${onClick ? 'cursor-pointer' : ''}`}
      style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[accent] || colors.emerald}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </motion.div>
  );
}
