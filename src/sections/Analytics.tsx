import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Target, Calendar, Flame } from 'lucide-react';
import type { WorkoutSession, Exercise } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface AnalyticsProps {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  getExerciseHistory: (exerciseId: string) => { date: string; maxWeight: number; maxReps: number; totalVolume: number; best1RM: number }[];
}

const MUSCLE_ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Analytics({ sessions, exercises }: AnalyticsProps) {
  const finishedSessions = sessions.filter((s) => !s.isActive);

  // ─── Weekly Volume Bar Chart (last 7 days) ───
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const weeklyVolumeData = last7Days.map((day) => {
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const start = day.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const vol = finishedSessions
      .filter((s) => { const t = new Date(s.startTime).getTime(); return t >= start && t < end; })
      .reduce((a, s) => a + s.totalVolume, 0);
    return { day: dayStr, volume: vol };
  });

  // ─── Muscle Group Focus (always show all 6, zero if no data) ───
  const muscleCounts: Record<string, number> = {};
  MUSCLE_ORDER.forEach((m) => (muscleCounts[m] = 0));
  for (const session of finishedSessions) {
    for (const ex of session.exercises) {
      const exerciseData = exercises.find((e) => e.id === ex.exerciseId);
      if (exerciseData && muscleCounts[exerciseData.muscleGroup] !== undefined) {
        muscleCounts[exerciseData.muscleGroup] += ex.sets.filter((s) => s.completed).length;
      }
    }
  }
  const muscleChartData = MUSCLE_ORDER.map((name) => ({
    name,
    value: muscleCounts[name] || 0,
  }));

  // ─── 5-week streak calendar ───
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekday = today.getDay();
  const daysSinceMon = weekday === 0 ? 6 : weekday - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysSinceMon);

  const weeks: { day: Date; hasWorkout: boolean }[][] = [];
  for (let w = 4; w >= 0; w--) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - w * 7);
    const week: { day: Date; hasWorkout: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const start = day.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const hasWorkout = finishedSessions.some((s) => {
        const t = new Date(s.startTime).getTime();
        return t >= start && t < end;
      });
      week.push({ day, hasWorkout });
    }
    weeks.push(week);
  }

  const thisWeekCount = finishedSessions.filter((s) => {
    const d = new Date(s.startTime);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 pt-20">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={BarChart3} label="Total Workouts" value={finishedSessions.length} />
        <StatCard icon={TrendingUp} label="Total Volume" value={`${(finishedSessions.reduce((a, s) => a + s.totalVolume, 0) / 1000).toFixed(1)}k kg`} />
        <StatCard icon={Target} label="Avg Volume" value={finishedSessions.length > 0 ? `${Math.round(finishedSessions.reduce((a, s) => a + s.totalVolume, 0) / finishedSessions.length).toLocaleString()} kg` : '0 kg'} />
        <StatCard icon={Calendar} label="This Week" value={thisWeekCount} />
      </div>

      {/* ─── Weekly Volume Bar Chart ─── */}
      <ChartCard title="Weekly Volume" subtitle="Last 7 days" icon={<BarChart3 className="h-5 w-5 text-emerald-400" />}>
        <div style={{ width: '100%', height: 224 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyVolumeData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" stroke="#52525B" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <YAxis stroke="#52525B" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1C1C24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff' }}
                formatter={(val: number) => [`${val.toLocaleString()} kg`, 'Volume']}
              />
              <Bar dataKey="volume" radius={[6, 6, 0, 0]} fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* ─── Muscle Group Focus Horizontal Bar ─── */}
      <ChartCard title="Muscle Group Focus" icon={<Target className="h-5 w-5 text-cyan-400" />}>
        <div style={{ width: '100%', height: 224 }}>
          <ResponsiveContainer>
            <BarChart data={muscleChartData} layout="vertical" barSize={18} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="#52525B" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" stroke="#52525B" tick={{ fill: '#A1A1AA', fontSize: 12 }} width={70} />
              <Tooltip
                contentStyle={{ background: '#1C1C24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff' }}
                formatter={(val: number) => [`${val} sets`, 'Completed']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* ─── 5-Week Streak Calendar ─── */}
      <div className="rounded-xl border border-white/[0.08] p-4 md:p-6" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Workout Streak</h2>
          <span className="ml-auto text-xs text-emerald-400 font-medium">{thisWeekCount}/7 this week</span>
        </div>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-zinc-500 uppercase">{d}</div>
          ))}
        </div>
        {/* Week rows */}
        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day, di) => {
                const isToday = day.day.toDateString() === today.toDateString();
                return (
                  <div
                    key={di}
                    className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      day.hasWorkout
                        ? 'bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-500/40'
                        : 'bg-white/[0.04] text-zinc-600'
                    } ${isToday ? 'ring-2 ring-white/30' : ''}`}
                    title={day.day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  >
                    {day.hasWorkout ? <Flame className="h-3.5 w-3.5" /> : day.day.getDate()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.08] p-4" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
      <Icon className="h-5 w-5 text-emerald-400" />
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] p-4 md:p-6" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <span className="ml-auto text-xs text-zinc-500">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
