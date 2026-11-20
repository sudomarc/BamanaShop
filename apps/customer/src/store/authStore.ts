import { create } from "zustand";
import { createSupabaseClient } from "@/utils/supabase";
import { Profile, UserRole } from "@bamanashop/contracts";

interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  roles: UserRole[];
  initialized: boolean;
  loading: boolean;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
}

const supabase = createSupabaseClient();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  initialized: false,
  loading: false,

  initAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: { id: session.user.id, email: session.user.email } });
        // Fetch profile and roles
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const { data: roles } = await supabase
          .from("role_memberships")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("status", "approved");

        set({
          profile: profile as Profile,
          roles: (roles?.map((r) => r.role) ?? []) as UserRole[],
        });
      }
    } catch (error) {
      console.error("[Auth] initAuth error:", error);
    } finally {
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        set({ user: { id: data.user.id, email: data.user.email } });
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        const { data: roles } = await supabase
          .from("role_memberships")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("status", "approved");
        set({
          profile: profile as Profile,
          roles: (roles?.map((r) => r.role) ?? []) as UserRole[],
        });
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        // Create profile
        await supabase.from("profiles").insert({
          id: data.user.id,
          phone,
          full_name: fullName,
        });
        // Create customer role
        await supabase.from("role_memberships").insert({
          user_id: data.user.id,
          role: "customer",
          status: "approved",
        });
        set({
          user: { id: data.user.id, email: data.user.email },
          roles: ["customer"],
        });
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, roles: [] });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) {
      set({ profile: data as Profile });
    }
  },
}));
