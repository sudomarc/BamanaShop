/**
 * BamanaShop — Auth Store
 * Phone-based OTP authentication (matching Madina Direct)
 * with biometric support
 */

import { create } from "zustand";
import { createSupabaseClient } from "@/utils/supabase";
import { Profile, UserRole, PhoneE164 } from "@bamanashop/contracts";
import ReactNativeBiometrics from "react-native-biometrics";

const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

const supabase = createSupabaseClient();

interface AuthState {
  user: { id: string; phone?: string } | null;
  profile: Profile | null;
  roles: UserRole[];
  initialized: boolean;
  loading: boolean;
  biometricEnabled: boolean;
  initAuth: () => Promise<void>;
  sendOtp: (phone: PhoneE164) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: PhoneE164, code: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  initialized: false,
  loading: false,
  biometricEnabled: false,

  initAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const phone = session.user.phone || session.user.user_metadata?.phone;
        set({ user: { id: session.user.id, phone } });

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

        // Check biometric preference
        const { data: biometricData } = await supabase
          .from("user_preferences")
          .select("biometric_enabled")
          .eq("user_id", session.user.id)
          .single();

        set({
          profile: profile as Profile,
          roles: (roles?.map((r) => r.role) ?? []) as UserRole[],
          biometricEnabled: biometricData?.biometric_enabled ?? false,
        });
      }
    } catch (error) {
      console.error("[Auth] initAuth error:", error);
    } finally {
      set({ initialized: true });
    }
  },

  sendOtp: async (phone: PhoneE164) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        // channel: "sms", // default
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (phone: PhoneE164, code: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (error) throw error;

      if (data.user) {
        const userPhone = data.user.phone || data.user.user_metadata?.phone;
        set({ user: { id: data.user.id, phone: userPhone } });

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

        // Check if profile needs completion
        if (!profile || !profile.full_name) {
          // Profile incomplete - will be handled in onboarding
          set({
            profile: profile as Profile,
            roles: (roles?.map((r) => r.role) ?? []) as UserRole[],
            biometricEnabled: false,
          });
        } else {
          set({
            profile: profile as Profile,
            roles: (roles?.map((r) => r.role) ?? []) as UserRole[],
            biometricEnabled: false,
          });
        }
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
    set({ user: null, profile: null, roles: [], biometricEnabled: false });
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

  enableBiometric: async () => {
    const { user } = get();
    if (!user) return;

    const sensor = await biometrics.isSensorAvailable();
    if (!sensor.available) {
      throw new Error(sensor.error ?? "Biometric authentication is not available on this device");
    }

    const prompt = await biometrics.simplePrompt({
      promptMessage: "Confirmez votre identité pour activer la connexion biométrique",
      cancelButtonText: "Annuler",
    });
    if (!prompt.success) {
      throw new Error("Biometric activation was cancelled");
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      biometric_enabled: true,
    });
    if (error) throw error;

    set({ biometricEnabled: true });
  },

  disableBiometric: async () => {
    const { user } = get();
    if (!user) return;

    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      biometric_enabled: false,
    });

    set({ biometricEnabled: false });
  },

  authenticateWithBiometric: async () => {
    const { biometricEnabled } = get();
    if (!biometricEnabled) return false;

    try {
      const sensor = await biometrics.isSensorAvailable();
      if (!sensor.available) return false;
      const result = await biometrics.simplePrompt({
        promptMessage: "Authentifiez-vous pour accéder à BamanaShop",
        cancelButtonText: "Annuler",
      });
      return result.success;
    } catch {
      return false;
    }
  },
}));