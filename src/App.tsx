import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navigation } from '@/components/Navigation';
import { AuthScreen } from '@/sections/AuthScreen';
import { Dashboard } from '@/sections/Dashboard';
import { WorkoutHub } from '@/sections/WorkoutHub';
import { WorkoutLogger } from '@/sections/WorkoutLogger';
import { ExerciseLibrary } from '@/sections/ExerciseLibrary';
import { Routines } from '@/sections/Routines';
import { Analytics } from '@/sections/Analytics';
import { History } from '@/sections/History';
import { Profile } from '@/sections/Profile';
import { Toaster } from '@/components/ui/sonner';
import { Activity } from 'lucide-react';

function App() {
  const auth = useAuth();
  const store = useWorkoutStore(auth.currentUser, auth.updateUser as any);
  const [showProfile, setShowProfile] = useState(false);
  const { theme, toggle, isLight } = useTheme();

  // Loading state while auth initializes from native storage
  if (!auth.isReady) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
          <Activity className="h-8 w-8 text-white animate-pulse" />
        </div>
        <p className="mt-4 text-sm text-zinc-500">Loading Notion Fitness...</p>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!auth.currentUser) {
    return (
      <>
        <AuthScreen
          onLogin={auth.login}
          onRegister={auth.register}
          onPhoneLogin={auth.loginWithPhone}
          theme={theme}
          onThemeToggle={toggle}
        />
        <Toaster />
      </>
    );
  }

  const lastWorkouts = store.exercises.reduce<Record<string, { sets: { weight: number; reps: number }[] } | null>>(
    (acc, ex) => {
      acc[ex.id] = store.getLastWorkoutForExercise(ex.id);
      return acc;
    },
    {}
  );

  const handleTabChange = (tab: string) => {
    setShowProfile(false);
    store.setCurrentTab(tab as any);
  };

  const renderContent = () => {
    if (showProfile) {
      return (
        <Profile
          profile={store.profile}
          email={auth.currentUser!.email}
          phone={auth.currentUser!.phone}
          sessions={store.sessions}
          onUpdateProfile={auth.updateProfile}
          onUpdateUser={(updates) => auth.updateUser((u) => ({ ...u, ...updates }))}
          onLogout={auth.logout}
        />
      );
    }

    if (store.activeSession) {
      return (
        <WorkoutLogger
          session={store.activeSession}
          exercises={store.exercises}
          lastWorkouts={lastWorkouts}
          onUpdateSet={store.updateSet}
          onAddSet={store.addSetToExercise}
          onRemoveSet={store.removeSetFromExercise}
          onRemoveExercise={store.removeExerciseFromActive}
          onAddExercise={store.addExerciseToActive}
          onFinish={store.finishWorkout}
          onCancel={store.cancelWorkout}
        />
      );
    }

    switch (store.currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            profile={store.profile}
            routines={store.routines}
            activeSession={store.activeSession}
            sessions={store.sessions}
            onStartRoutine={store.startWorkout}
            onStartEmpty={store.startEmptyWorkout}
            onTabChange={handleTabChange}
          />
        );
      case 'workout':
        return (
          <WorkoutHub
            profile={store.profile}
            routines={store.routines}
            sessions={store.sessions}
            onStartRoutine={store.startWorkout}
            onStartEmpty={store.startEmptyWorkout}
            onTabChange={handleTabChange}
          />
        );
      case 'exercises':
        return (
          <ExerciseLibrary
            exercises={store.exercises}
            onAddExercise={store.addExercise}
            onDeleteExercise={store.deleteExercise}
          />
        );
      case 'routines':
        return (
          <Routines
            routines={store.routines}
            exercises={store.exercises}
            onAddRoutine={store.addRoutine}
            onDeleteRoutine={store.deleteRoutine}
            onStartRoutine={store.startWorkout}
          />
        );
      case 'analytics':
        return (
          <Analytics
            sessions={store.sessions}
            exercises={store.exercises}
            getExerciseHistory={store.getExerciseHistory}
          />
        );
      case 'history':
        return (
          <History sessions={store.sessions} onDeleteSession={store.deleteSession} />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--app-bg)', color: isLight ? '#1C1917' : '#fff', transition: 'background 0.3s, color 0.3s' }}>
        <Navigation
          currentTab={store.currentTab}
          onTabChange={handleTabChange}
          hasActiveWorkout={!!store.activeSession}
          onResumeWorkout={() => {
            setShowProfile(false);
            store.setCurrentTab('workout');
          }}
          onProfileClick={() => setShowProfile(true)}
          avatar={auth.currentUser?.profile?.avatar}
          theme={theme}
          onThemeToggle={toggle}
        />
        <main className="mx-auto max-w-7xl px-4 lg:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${store.currentTab}-${showProfile ? 'profile' : 'main'}-${store.activeSession ? 'active' : 'idle'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;
