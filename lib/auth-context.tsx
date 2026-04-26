"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  onAuthStateChange,
  signOut as supabaseSignOut,
  type UserProfile,
} from "./auth";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStakeholder: boolean;
  refresh: () => Promise<void>;
  /** Clears local user/profile synchronously, then awaits Supabase
   *  signOut. Use this from components instead of calling lib/auth's
   *  signOut directly — it makes downstream effects (e.g. the location
   *  page's load-on-userId-change) re-fire immediately so stale
   *  stakeholder data doesn't linger after sign-out. */
  signOut: () => Promise<void>;
}

const DEFAULT: AuthContextValue = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isStakeholder: false,
  refresh: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(DEFAULT);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getCurrentUser();
    setUser(next.user);
    setProfile(next.profile);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state FIRST so downstream `useAuth()` consumers
    // re-render to the anonymous view immediately. The Supabase round
    // trip then completes in the background; the onAuthStateChange
    // subscription will arrive shortly and confirm the cleared state.
    setUser(null);
    setProfile(null);
    await supabaseSignOut();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical async on-mount auth-state hydration; setState lands in the awaited continuation
    void refresh();

    // Supabase fires onAuthStateChange on sign-in/out, token refresh,
    // and tab-visibility resume. We re-fetch the profile each time so
    // role/org changes (e.g. dashboard-elevated to "planner") propagate.
    const subscription = onAuthStateChange(async (session) => {
      if (session) {
        await refresh();
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  // Memoize so consumers that only read isAuthenticated/isStakeholder
  // don't re-render on every render of an ancestor.
  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!user;
    const role = profile?.role;
    const isStakeholder =
      role === "stakeholder" || role === "planner" || role === "admin";
    return {
      user,
      profile,
      isLoading,
      isAuthenticated,
      isStakeholder,
      refresh,
      signOut,
    };
  }, [user, profile, isLoading, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
