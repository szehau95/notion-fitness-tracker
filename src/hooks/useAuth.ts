import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import type { User, UserProfile } from "@/types";

const TOKEN_KEY = "notion_token";

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_e) { return null; }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_e) { /* ignore */ }
}

export function useAuth() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasFetchedMe = useRef(false);
  const isReadyRef = useRef(false);

  // Always try to fetch the user if we have a token and haven't fetched yet
  const { data: meData, isLoading: meLoading, error: meError } = trpc.auth.me.useQuery(
    undefined,
    {
      enabled: !!getToken() && !hasFetchedMe.current && !currentUser,
      retry: 0,
      retryDelay: 0,
      staleTime: Infinity,
    }
  );

  // Safety timeout: if still loading after 6 seconds, force ready and clear bad token
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReadyRef.current) {
        setToken(null);
        isReadyRef.current = true;
        setIsReady(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Process me query results
  useEffect(() => {
    if (meLoading || hasFetchedMe.current) return;
    if (meData) {
      hasFetchedMe.current = true;
      setCurrentUser({
        id: String(meData.id),
        email: meData.email,
        phone: meData.phone || undefined,
        displayName: meData.displayName,
        createdAt: typeof meData.createdAt === "string"
          ? meData.createdAt
          : meData.createdAt instanceof Date
            ? meData.createdAt.toISOString()
            : String(meData.createdAt),
        profile: meData.profile as UserProfile,
        exercises: [],
        routines: [],
        sessions: [],
      });
    }
    if (meError) {
      hasFetchedMe.current = true;
      console.error("[Auth] me query failed:", meError.message);
      setToken(null);
    }
    // Mark ready after processing (or immediately if no token)
    if (!getToken() || hasFetchedMe.current) {
      isReadyRef.current = true;
      setIsReady(true);
    }
  }, [meData, meLoading, meError]);

  // Fallback: if no token, mark ready immediately
  useEffect(() => {
    if (!getToken()) {
      isReadyRef.current = true;
      setIsReady(true);
    }
  }, []);

  // ─── Mutations ───
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const phoneLoginMutation = trpc.auth.loginWithPhone.useMutation();

  const register = useCallback(
    async (email: string, password: string, displayName: string, phone?: string) => {
      try {
        const result = await registerMutation.mutateAsync({ email, password, displayName, phone });
        setToken(result.token);
        window.location.href = "/";
        return { success: true as const };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Registration failed" };
      }
    },
    [registerMutation]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await loginMutation.mutateAsync({ email, password });
        setToken(result.token);
        window.location.href = "/";
        return { success: true as const };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Login failed" };
      }
    },
    [loginMutation]
  );

  const loginWithPhone = useCallback(
    async (phone: string) => {
      try {
        const result = await phoneLoginMutation.mutateAsync({ phone });
        setToken(result.token);
        window.location.href = "/";
        return { success: true as const };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Phone login failed" };
      }
    },
    [phoneLoginMutation]
  );

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    navigate("/");
    setTimeout(() => window.location.reload(), 50);
  }, [navigate]);

  // ─── Profile updates ───
  const updateProfileMutation = trpc.data.updateProfile.useMutation();

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
      if (!currentUser) return { success: false, error: 'Not logged in' };
      const prevProfile = currentUser.profile;
      const nextProfile = { ...prevProfile, ...updates };
      setCurrentUser((prev) => (prev ? { ...prev, profile: nextProfile } : prev));
      try {
        await updateProfileMutation.mutateAsync({
          displayName: nextProfile.displayName,
          gender: nextProfile.gender,
          age: nextProfile.age,
          heightCm: nextProfile.heightCm,
          weightKg: nextProfile.weightKg,
          level: nextProfile.level,
          xp: nextProfile.xp,
          streakDays: nextProfile.streakDays,
          longestStreak: nextProfile.longestStreak,
          totalWorkouts: nextProfile.totalWorkouts,
          totalVolume: nextProfile.totalVolume,
          weeklyGoal: nextProfile.weeklyGoal,
          avatar: nextProfile.avatar,
        });
        return { success: true };
      } catch (e: any) {
        // Roll back optimistic update on failure
        setCurrentUser((prev) => (prev ? { ...prev, profile: prevProfile } : prev));
        return { success: false, error: e?.message || 'Save failed. Please try again.' };
      }
    },
    [currentUser, updateProfileMutation]
  );

  const updateUser = useCallback(
    (updates: Partial<User> | ((u: User) => User)) => {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        return typeof updates === "function" ? updates(prev) : { ...prev, ...updates };
      });
    },
    []
  );

  return {
    currentUser,
    isReady,
    register,
    login,
    loginWithPhone,
    logout,
    updateUser,
    updateProfile,
  };
}
