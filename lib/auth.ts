import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

// Mirrors the user_profiles row created by the on-signup trigger in
// Supabase. role is set to "stakeholder" by default for this self-serve
// flow; "planner" / "admin" are dashboard-elevated and behave the same
// as stakeholder for the auth-gated flags here.
export interface UserProfile {
  id: string;
  display_name: string | null;
  role: "resident" | "stakeholder" | "planner" | "admin";
  organization: string | null;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  organization: string;
}

export type AuthResult =
  | { success: true; user: User | null }
  | { success: false; error: string };

export async function signUp(data: SignUpData): Promise<AuthResult> {
  // display_name + organization are stashed in user_metadata. The
  // dashboard trigger that materialises user_profiles reads them from
  // there to populate the row.
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName,
        organization: data.organization,
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: authData.user };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
}

export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
    return false;
  }
  return true;
}

export async function getCurrentUser(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  // Profile fetch is best-effort. If the trigger hasn't materialised
  // the row yet (or RLS blocks it), we still return the user — callers
  // gate stakeholder UI on profile.role separately.
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error loading user_profile:", error);
    return { user, profile: null };
  }
  return { user, profile: profile as UserProfile };
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}
