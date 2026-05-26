import { Activity, Dumbbell, LayoutDashboard, ListOrdered, TrendingUp, History, Play, User, Sun, Moon } from 'lucide-react';
import type { AppTab } from '@/types';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  hasActiveWorkout: boolean;
  onResumeWorkout: () => void;
  onProfileClick: () => void;
  avatar?: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

const NAV_ITEMS: { tab: AppTab; label: string; icon: React.ElementType }[] = [
  { tab: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { tab: 'workout',   label: 'Workout',  icon: Activity },
  { tab: 'exercises', label: 'Exercises', icon: Dumbbell },
  { tab: 'routines',  label: 'Programs', icon: ListOrdered },
  { tab: 'analytics', label: 'Analytics', icon: TrendingUp },
  { tab: 'history',   label: 'History',  icon: History },
];

export function Navigation({ currentTab, onTabChange, hasActiveWorkout, onResumeWorkout, onProfileClick, avatar, theme, onThemeToggle }: NavigationProps) {
  const isLight = theme === 'light';

  return (
    <>
      {/* Desktop Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-2xl"
        style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)', transition: 'background 0.3s' }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-6">

          {/* Logo */}
          <button onClick={() => onTabChange('dashboard')} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {isLight ? (
              /* Rose-terracotta circle logo */
              <div className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #E8A89C, #C27B6E)' }}>
                <span className="text-white text-sm leading-none">✦</span>
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
            )}
            <span style={isLight
              ? { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 500, color: '#C27B6E' }
              : { fontSize: '18px', fontWeight: 700, color: '#fff' }
            }>
              {isLight ? 'Notion Tracker' : (
                <>Notion <span className="text-emerald-400">Tracker</span></>
              )}
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className={`relative flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-all duration-200 ${
                    isActive
                      ? isLight
                        ? 'font-medium'
                        : 'text-emerald-400 font-medium'
                      : isLight
                        ? 'text-stone-400 hover:text-stone-700'
                        : 'text-zinc-400 hover:text-white'
                  }`}
                  style={isActive && isLight ? { background: '#F5EAE6', color: '#C27B6E' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && !isLight && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: '#34D399' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {hasActiveWorkout && (
              <button
                onClick={onResumeWorkout}
                className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                style={isLight
                  ? { background: '#C27B6E', boxShadow: '0 4px 16px rgba(194,123,110,0.35)' }
                  : { background: '#10B981', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }
                }
              >
                <Play className="h-4 w-4 fill-white" />
                Resume Workout
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={onThemeToggle}
              title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
              style={isLight
                ? { background: '#F5EAE6', color: '#C27B6E' }
                : { background: 'rgba(255,255,255,0.1)', color: '#a1a1aa' }
              }
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Avatar / profile */}
            <button
              onClick={onProfileClick}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition-all duration-200 hover:scale-110"
              style={isLight
                ? { background: avatar ? undefined : 'linear-gradient(135deg, #E8A89C, #C27B6E)', boxShadow: '0 2px 8px rgba(194,123,110,0.3)' }
                : { background: avatar ? undefined : 'linear-gradient(135deg,#10B981,#06B6D4)' }
              }
              title="Profile"
            >
              {avatar
                ? <img src={avatar} alt="profile" className="h-full w-full object-cover" />
                : <User className="h-4 w-4 text-white" />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-2xl md:hidden"
        style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)', transition: 'background 0.3s' }}
      >
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium transition-all duration-200"
                style={isActive
                  ? isLight ? { color: '#C27B6E' } : { color: '#34D399' }
                  : isLight ? { color: '#B8A5A2' } : { color: '#71717a' }
                }
              >
                <div className="rounded-lg p-1 transition-all"
                  style={isActive && isLight ? { background: '#F5EAE6' } : {}}>
                  <Icon className="h-5 w-5" />
                </div>
                {item.label}
              </button>
            );
          })}
          {/* Mobile theme toggle */}
          <button
            onClick={onThemeToggle}
            className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-xs font-medium transition-all duration-200"
            style={isLight ? { color: '#9B72CF' } : { color: '#71717a' }}
          >
            <div className="rounded-lg p-1 transition-all"
              style={isLight ? { background: '#F0E8F5' } : {}}>
              {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            {isLight ? 'Dark' : 'Light'}
          </button>
        </div>
      </nav>

      {/* Mobile FAB for active workout */}
      {hasActiveWorkout && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white md:hidden"
          style={isLight
            ? { background: '#C27B6E', boxShadow: '0 4px 20px rgba(194,123,110,0.45)' }
            : { background: '#10B981', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }
          }
          onClick={onResumeWorkout}
        >
          <Play className="h-6 w-6 fill-white" />
        </motion.button>
      )}
    </>
  );
}
