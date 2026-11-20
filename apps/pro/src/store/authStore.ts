import { create } from "zustand";
import { createSupabaseClient } from "@/utils/supabase";
import {
  Profile,
  UserRole,
  RoleStatus,
  SellerProfile,
  CourierProfile,
} from "@bamanashop/contracts";

interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  roles: UserRole[];
  roleStatuses: Record<UserRole, RoleStatus>;
  sellerProfile: SellerProfile | null;
  courierProfile: CourierProfile | null;
  initialized: boolean;
  loading: boolean;
  selectedRole: UserRole | null;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    roles?: UserRole[],
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  selectRole: (role: UserRole) => void;
  fetchProfiles: () => Promise<void>;
}

const supabase = createSupabaseClient();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  roleStatuses: {},
  sellerProfile: null,
  courierProfile: null,
  initialized: false,
  loading: false,
  selectedRole: null,

  initAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: { id: session.user.id, email: session.user.email } });
        await get().fetchProfiles();
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
        await get().fetchProfiles();
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
    roles = ["customer"],
  ) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          phone,
          full_name: fullName,
        });
        for (const role of roles) {
          await supabase.from("role_memberships").insert({
            user_id: data.user.id,
            role,
            status: role === "customer" ? "approved" : "pending",
          });
        }
        set({ user: { id: data.user.id, email: data.user.email } });
        await get().fetchProfiles();
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
    set({
      user: null,
      profile: null,
      roles: [],
      roleStatuses: {},
      sellerProfile: null,
      courierProfile: null,
      selectedRole: null,
    });
  },

  selectRole: (role: UserRole) => {
    const { roleStatuses } = get();
    if (roleStatuses[role] === "approved") {
      set({ selectedRole: role });
    }
  },

  fetchProfiles: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: memberships } = await supabase
      .from("role_memberships")
      .select("role, status")
      .eq("user_id", user.id);

    const roleStatuses: Record<UserRole, RoleStatus> = {} as Record<
      UserRole,
      RoleStatus
    >;
    const roles: UserRole[] = [];
    memberships?.forEach((m) => {
      roleStatuses[m.role] = m.status;
      if (m.status === "approved") roles.push(m.role);
    });

    let sellerProfile: SellerProfile | null = null;
    let courierProfile: CourierProfile | null = null;

    if (roles.includes("seller")) {
      const { data } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      sellerProfile = data as SellerProfile;
    }

    if (roles.includes("courier")) {
      const { data } = await supabase
        .from("courier_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      courierProfile = data as CourierProfile;
    }

    set({
      profile: profile as Profile,
      roles,
      roleStatuses,
      sellerProfile,
      courierProfile,
      selectedRole: roles.length === 1 ? roles[0] : null,
    });
  },
}));
