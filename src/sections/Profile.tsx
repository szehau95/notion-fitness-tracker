import { useState, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, LogOut, X, Pencil, Ruler, Weight, Calendar, Heart, Mail, Phone, Camera, Target, Flame } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import type { UserProfile, WorkoutSession } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileProps {
  profile: UserProfile;
  email: string;
  phone?: string;
  sessions: WorkoutSession[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  onUpdateUser: (updates: { email?: string; phone?: string }) => void;
  onLogout: () => void;
}

export function Profile({ profile, email, phone, sessions, onUpdateProfile, onUpdateUser, onLogout }: ProfileProps) {
  const { isLight } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    ...profile,
    email,
    phone: phone ?? '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bmi = profile.weightKg > 0 && profile.heightCm > 0
    ? Math.round((profile.weightKg / ((profile.heightCm / 100) ** 2)) * 10) / 10
    : 0;

  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor = bmi < 18.5 ? 'text-yellow-400' : bmi < 25 ? 'text-emerald-400' : bmi < 30 ? 'text-orange-400' : 'text-red-400';
  const bmiStroke = bmi < 25 ? (isLight ? '#10B981' : '#10B981') : bmi < 30 ? '#F59E0B' : '#EF4444';

  // Weekly goal — count actual workouts from this week
  const weeklyTarget = profile.weeklyGoal || 3;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const finishedSessions = sessions.filter((s) => !s.isActive);
  const thisWeekWorkouts = finishedSessions.filter((s) => new Date(s.startTime) >= weekAgo).length;
  const weekProgress = Math.min(thisWeekWorkouts / weeklyTarget, 1);
  const weekRingCircumference = 2 * Math.PI * 30;

  /** Resize an image file/blob to max 400px and return a compressed JPEG data URL */
  const resizeToDataUrl = (file: File | Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 400;
          let { width, height } = img;
          if (width > height) { if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; } }
          else { if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; } }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return; }
    setIsUploading(true);
    try {
      // Resize to max 400px JPEG and store as base64 in the DB (MEDIUMTEXT handles ~60KB fine)
      const dataUrl = await resizeToDataUrl(file);
      setForm((p) => ({ ...p, avatar: dataUrl }));
    } catch { setUploadError('Failed to process image. Try another file.'); }
    setIsUploading(false);
    e.target.value = '';
  };

  const pickPhotoMobile = async () => {
    setUploadError('');
    try {
      const permission = await CapCamera.requestPermissions();
      if (permission.photos === 'denied') { setUploadError('Photo library access denied.'); return; }
      setIsUploading(true);
      const photo = await CapCamera.getPhoto({
        quality: 85, allowEditing: true, resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, width: 400,
      });
      if (photo.dataUrl) setForm((p) => ({ ...p, avatar: photo.dataUrl }));
    } catch (_err: any) { /* ignore cancel */ } finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    const { email: newEmail, phone: newPhone, ...profileUpdates } = form;
    const result = await onUpdateProfile(profileUpdates);
    setIsSaving(false);
    if (!result.success) {
      setSaveError(result.error || 'Save failed. Please try again.');
      return;
    }
    if (newEmail.trim() && newEmail.trim() !== email) onUpdateUser({ email: newEmail.trim() });
    const trimmedPhone = newPhone.trim();
    if (trimmedPhone !== (phone ?? '')) onUpdateUser({ phone: trimmedPhone || undefined });
    setEditMode(false);
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 pt-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        {!editMode && (
          <Button onClick={() => { setEditMode(true); setForm({ ...profile, email, phone: phone ?? '' }); setUploadError(''); }}
            className="rounded-full px-4 text-white text-sm" size="sm"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Info
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editMode ? (
          <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl p-4"
            style={{ background: 'var(--card-bg)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 20px rgba(16,185,129,0.08)', backdropFilter: 'blur(12px)' }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: '#10B981' }}>Edit Your Information</h3>
              <button onClick={() => { setEditMode(false); setForm({ ...profile, email, phone: phone ?? '' }); setUploadError(''); }}
                className="rounded-lg p-1 text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-1.5">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <button onClick={isNative ? pickPhotoMobile : () => fileInputRef.current?.click()} disabled={isUploading}
                    className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full transition-all disabled:opacity-60"
                    style={{ boxShadow: '0 0 0 3px rgba(16,185,129,0.4)' }}>
                    {form.avatar ? <img src={form.avatar} alt="avatar" className="h-full w-full object-cover" /> : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><User className="h-12 w-12 text-white" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"><Camera className="h-7 w-7 text-white" /></div>
                  </button>
                  <button onClick={isNative ? pickPhotoMobile : () => fileInputRef.current?.click()} disabled={isUploading}
                    className="text-xs font-medium disabled:opacity-40" style={{ color: '#10B981' }}>
                    {isUploading ? 'Uploading...' : form.avatar ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
                </div>
                <div><Label className="text-xs text-zinc-400">Display Name</Label>
                  <Input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                    className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white" /></div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div><Label className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="h-3 w-3 text-zinc-500" />Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white" /></div>
                  <div><Label className="text-xs text-zinc-400 flex items-center gap-1"><Phone className="h-3 w-3 text-zinc-500" />Phone</Label>
                    <Input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Add phone" className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white placeholder-zinc-600" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs text-zinc-400">Age</Label>
                    <Input type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                      className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white" /></div>
                  <div><Label className="text-xs text-zinc-400">Gender</Label>
                    <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
                      className="mt-0.5 h-10 w-full rounded-md border border-white/[0.08] bg-white/5 px-2.5 text-sm text-white">
                      <option value="" className="bg-zinc-900">Select</option><option value="male" className="bg-zinc-900">Male</option>
                      <option value="female" className="bg-zinc-900">Female</option><option value="other" className="bg-zinc-900">Other</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs text-zinc-400">Height (cm)</Label>
                    <Input type="number" value={form.heightCm} onChange={(e) => setForm((p) => ({ ...p, heightCm: parseInt(e.target.value) || 0 }))}
                      className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white" /></div>
                  <div><Label className="text-xs text-zinc-400">Weight (kg)</Label>
                    <Input type="number" value={form.weightKg} onChange={(e) => setForm((p) => ({ ...p, weightKg: parseFloat(e.target.value) || 0 }))}
                      className="mt-0.5 h-10 border-white/[0.08] bg-white/5 text-sm text-white" /></div>
                </div>
                {form.weightKg > 0 && form.heightCm > 0 && (
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="text-[10px] text-zinc-500">Preview BMI</p>
                    <p className="text-base font-bold" style={{ color: '#10B981' }}>{Math.round((form.weightKg / ((form.heightCm / 100) ** 2)) * 10) / 10}</p>
                  </div>
                )}
              </div>
            </div>
            {saveError && <p className="mt-2 text-xs text-red-400 text-center">{saveError}</p>}
            <div className="mt-3 flex gap-2 pt-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
                <Save className="h-3.5 w-3.5" />{isSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditMode(false); setForm({ ...profile, email, phone: phone ?? '' }); setUploadError(''); setSaveError(''); }}
                className="rounded-full border px-5 text-xs text-zinc-400 hover:bg-white/5 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>Cancel</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border-l-4 p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeftWidth: '4px', borderLeftColor: '#10B981', boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-4">
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" className="h-16 w-16 shrink-0 rounded-full object-cover" style={{ boxShadow: '0 0 0 2px rgba(16,185,129,0.35)' }} />
                  : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><User className="h-8 w-8 text-white" /></div>
                }
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
                  <p className="text-sm text-zinc-400 truncate">{email}</p>
                  {phone && <p className="text-sm text-zinc-500">{phone}</p>}
                  <p className="mt-1 text-xs" style={{ color: '#10B981' }}>Level {profile.level} &bull; {profile.xp} XP</p>
                </div>
                <button onClick={() => { setEditMode(true); setForm({ ...profile, email, phone: phone ?? '' }); setUploadError(''); setSaveError(''); }}
                  className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <Pencil className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard icon={Weight} label="Weight" value={`${profile.weightKg} kg`} />
              <StatCard icon={Ruler} label="Height" value={`${profile.heightCm} cm`} />
              <StatCard icon={Calendar} label="Age" value={`${profile.age} yrs`} />
              <StatCard icon={Heart} label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'} />
            </div>

            {/* BMI */}
            {bmi > 0 && (
              <div className="rounded-xl border border-white/[0.08] p-5" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-zinc-400">BMI</p><p className={`text-3xl font-bold ${bmiColor}`}>{bmi}</p><p className={`text-sm font-medium ${bmiColor}`}>{bmiCategory}</p></div>
                  <div className="h-20 w-20">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={bmiStroke} strokeWidth="3" strokeDasharray={`${Math.min((bmi / 40) * 100, 100)}, 100`} strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Weekly Goal Section ─── */}
            <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeftWidth: '4px', borderLeftColor: '#059669', boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Weekly Goal</h3>
              </div>
              <div className="flex items-center gap-6">
                {/* Progress Ring */}
                <div className="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                    <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="30" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={weekRingCircumference}
                      strokeDashoffset={weekRingCircumference - weekProgress * weekRingCircumference}
                      className="transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">{thisWeekWorkouts}</span>
                    <span className="text-[10px] text-zinc-500">/ {weeklyTarget}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-3">Target workouts per week</p>
                  <div className="flex gap-2">
                    {[3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => onUpdateProfile({ weeklyGoal: n })}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          weeklyTarget === n
                            ? 'bg-white/10 ring-1'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                        style={weeklyTarget === n ? { color: '#059669', background: 'rgba(5,150,105,0.12)', '--tw-ring-color': 'rgba(5,150,105,0.35)' } as React.CSSProperties : {}}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {thisWeekWorkouts >= weeklyTarget
                      ? <span className="flex items-center gap-1" style={{ color: '#10B981' }}><Flame className="h-3 w-3" /> Weekly goal hit!</span>
                      : `${weeklyTarget - thisWeekWorkouts} more to hit your goal`}
                  </p>
                </div>
              </div>
            </div>

            {/* Workout Summary */}
            <div className="rounded-xl border border-white/[0.08] p-5" style={{ background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)' }}>
              <h3 className="mb-3 font-semibold text-white">Workout Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-3 text-center"><p className="text-xl font-bold text-emerald-400">{profile.totalWorkouts}</p><p className="text-xs text-zinc-500">Total Workouts</p></div>
                <div className="rounded-lg bg-white/5 p-3 text-center"><p className="text-xl font-bold" style={{ color: '#059669' }}>{profile.streakDays}</p><p className="text-xs text-zinc-500">Current Streak</p></div>
                <div className="rounded-lg bg-white/5 p-3 text-center"><p className="text-xl font-bold text-white">{profile.longestStreak}</p><p className="text-xs text-zinc-500">Best Streak</p></div>
                <div className="rounded-lg bg-white/5 p-3 text-center"><p className="text-xl font-bold text-white">{(profile.totalVolume / 1000).toFixed(1)}k</p><p className="text-xs text-zinc-500">Total Volume</p></div>
              </div>
            </div>

            <Button onClick={onLogout} variant="outline" className="w-full rounded-xl border-red-500/30 py-5 text-red-400 hover:bg-red-500/10">
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4 text-center transition-all" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(12px)' }}>
      <Icon className="mx-auto h-5 w-5 text-emerald-400" /><p className="mt-2 text-lg font-bold text-white">{value}</p><p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}
