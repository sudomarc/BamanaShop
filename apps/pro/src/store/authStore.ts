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
  requestedRoles: UserRole[];
  roleStatuses: Record<UserRole, RoleStatus | null>;
  sellerProfile: SellerProfile | null;
  courierProfile: CourierProfile | null;
  initialized: boolean;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  selectedRole: UserRole | null;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  selectRole: (role: UserRole) => void;
  fetchProfiles: () => Promise<void>;
}

const supabase = createSupabaseClient();

const initialRoleStatuses: Record<UserRole, RoleStatus | null> = {
  customer: null,
  seller: null,
  courier: null,
  partner_manager: null,
  admin: null,
  staff: null,
};

const emptyProfileState = {
  profile: null,
  roles: [] as UserRole[],
  requestedRoles: [] as UserRole[],
  roleStatuses: initialRoleStatuses,
  sellerProfile: null,
  courierProfile: null,
  selectedRole: null,
};

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Impossible de vérifier les autorisations de ce compte.";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ...emptyProfileState,
  initialized: false,
  loading: false,
  profileLoading: false,
  profileError: null,

  initAuth: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (!session?.user) {
        set({ user: null, ...emptyProfileState, profileError: null });
        return;
      }

      set({
        user: { id: session.user.id, email: session.user.email },
      });
      await get().fetchProfiles();
    } catch (error) {
      set({
        ...emptyProfileState,
        profileError: errorMessage(error),
      });
      console.error("[Auth] initAuth error:", error);
    } finally {
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, profileError: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase n'a retourné aucun utilisateur.");

      set({
        user: { id: data.user.id, email: data.user.email },
        ...emptyProfileState,
        profileError: null,
      });
      await get().fetchProfiles();
      return { error: null };
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(errorMessage(error));
      set({ profileError: normalized.message });
      return { error: normalized };
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    set({
      user: null,
      ...emptyProfileState,
      profileError: null,
      profileLoading: false,
      loading: false,
      initialized: true,
    });
  },

  selectRole: (role: UserRole) => {
    const { roles } = get();
    if ((role === "seller" || role === "courier") && roles.includes(role)) {
      set({ selectedRole: role });
    }
  },

  fetchProfiles: async () => {
    const { user, selectedRole } = get();
    if (!user) {
      set({ ...emptyProfileState, profileError: null });
      return;
    }

    const userId = user.id;
    set({ profileLoading: true, profileError: null });

    try {
      const [profileResult, membershipsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("role_memberships")
          .select("role, status")
          .eq("user_id", userId),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (membershipsResult.error) throw membershipsResult.error;
      if (!profileResult.data) {
        throw new Error("Le profil de ce compte est introuvable.");
      }

      const memberships: Array<{ role: UserRole; status: RoleStatus }> = [];
      const roleStatuses: Record<UserRole, RoleStatus | null> = {
        ...initialRoleStatuses,
      };

      for (const membership of membershipsResult.data ?? []) {
        const parsedRole = UserRole.safeParse(membership.role);
        const parsedStatus = RoleStatus.safeParse(membership.status);
        if (!parsedRole.success || !parsedStatus.success) {
          throw new Error("Une adhésion de rôle contient une valeur inconnue.");
        }

        memberships.push({
          role: parsedRole.data,
          status: parsedStatus.data,
        });
        roleStatuses[parsedRole.data] = parsedStatus.data;
      }

      const requestedRoles = memberships.map((membership) => membership.role);
      const hasSellerMembership = requestedRoles.includes("seller");
      const hasCourierMembership = requestedRoles.includes("courier");

      const [sellerResult, courierResult] = await Promise.all([
        hasSellerMembership
          ? supabase
              .from("seller_profiles")
              .select("*")
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        hasCourierMembership
          ? supabase
              .from("courier_profiles")
              .select("*")
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (sellerResult.error) throw sellerResult.error;
      if (courierResult.error) throw courierResult.error;

      const sellerProfile = sellerResult.data as SellerProfile | null;
      const courierProfile = courierResult.data as CourierProfile | null;

      const roles = memberships
        .filter((membership) => {
          if (membership.status !== "approved") return false;
          if (membership.role === "seller") {
            return sellerProfile?.status === "approved";
          }
          if (membership.role === "courier") {
            return courierProfile?.status === "approved";
          }
          return true;
        })
        .map((membership) => membership.role);

      if (roleStatuses.seller === "approved" && sellerProfile?.status !== "approved") {
        roleStatuses.seller = sellerProfile?.status ?? "pending";
      }
      if (roleStatuses.courier === "approved" && courierProfile?.status !== "approved") {
        roleStatuses.courier = courierProfile?.status ?? "pending";
      }

      const availableProRoles = roles.filter(
        (role): role is "seller" | "courier" =>
          role === "seller" || role === "courier",
      );
      const nextSelectedRole =
        selectedRole && availableProRoles.includes(selectedRole as "seller" | "courier")
          ? selectedRole
          : availableProRoles.length === 1
            ? availableProRoles[0]
            : null;

      if (get().user?.id !== userId) return;

      set({
        profile: profileResult.data as Profile,
        roles,
        requestedRoles,
        roleStatuses,
        sellerProfile,
        courierProfile,
        selectedRole: nextSelectedRole,
        profileError: null,
      });
    } catch (error) {
      if (get().user?.id === userId) {
        set({
          ...emptyProfileState,
          profileError: errorMessage(error),
        });
      }
      throw error;
    } finally {
      if (get().user?.id === userId) set({ profileLoading: false });
    }
  },
}));
