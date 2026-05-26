import { motion } from 'framer-motion';
import { Clock, Dumbbell, Trash2, ChevronRight, Calendar, Weight } from 'lucide-react';
import type { WorkoutSession } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

interface HistoryProps {
  sessions: WorkoutSession[];
  onDeleteSession: (id: string) => void;
}

export function History({ sessions, onDeleteSession }: HistoryProps) {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const grouped = sessions.reduce<Record<string, WorkoutSession[]>>((acc, session) => {
    const month = new Date(session.startTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(session);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 pt-20">
      <h1 className="text-2xl font-bold text-white">Workout History</h1>

      {Object.entries(grouped).map(([month, monthSessions]) => (
        <div key={month}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">{month}</h2>
          <div className="space-y-3">
            {monthSessions.map((session) => {
              const duration = session.endTime
                ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                : null;
              const completedSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer rounded-xl border border-white/[0.08] p-4 transition-all duration-200 hover:border-white/[0.15] hover:-translate-y-0.5"
                  style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-emerald-500/20">
                        <span className="text-xs font-bold text-emerald-400">
                          {new Date(session.startTime).toLocaleDateString('en-US', { day: 'numeric' })}
                        </span>
                        <span className="text-[10px] uppercase text-emerald-400/70">
                          {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{session.routineName}</h3>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {duration ? `${duration} min` : 'In Progress'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />
                            {session.exercises.length} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="h-3 w-3" />
                            {completedSets} sets
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{session.totalVolume.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500">kg volume</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] py-20" style={{ background: 'rgba(18, 18, 26, 0.6)' }}>
          <Calendar className="h-12 w-12 text-zinc-700" />
          <p className="mt-4 text-lg font-medium text-zinc-400">No workouts yet</p>
          <p className="text-sm text-zinc-600">Start your first workout to see history here</p>
        </div>
      )}

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto border-white/[0.08] bg-[#12121A] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedSession?.routineName}</DialogTitle>
            <p className="text-sm text-zinc-400">
              {selectedSession && new Date(selectedSession.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{selectedSession?.totalVolume.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Volume (kg)</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-cyan-400">{selectedSession?.exercises.length}</p>
                <p className="text-xs text-zinc-500">Exercises</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {selectedSession?.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed).length, 0)}
                </p>
                <p className="text-xs text-zinc-500">Sets Done</p>
              </div>
            </div>

            {selectedSession?.exercises.map((ex) => (
              <div key={ex.id} className="rounded-lg border border-white/[0.06] p-3">
                <h4 className="font-medium text-white">{ex.exerciseName}</h4>
                <div className="mt-2 space-y-1">
                  {ex.sets.filter((s) => s.completed).map((set) => (
                    <div key={set.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Set {set.setNumber}</span>
                      <span className="text-white">{set.weight} kg × {set.reps} reps @ RPE {set.rpe}</span>
                    </div>
                  ))}
                  {ex.sets.filter((s) => s.completed).length === 0 && (
                    <p className="text-xs text-zinc-600">No completed sets</p>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                if (selectedSession) {
                  onDeleteSession(selectedSession.id);
                  setSelectedSession(null);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete Workout
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
