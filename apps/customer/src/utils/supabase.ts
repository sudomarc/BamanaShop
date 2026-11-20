import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing environment variables. Using mock client for development.",
  );
}

const createStorage = () => {
  if (Platform.OS === "web") {
    return window.localStorage;
  }
  return {
    getItem: async (key: string) => {
      const value = await SecureStore.getItemAsync(key);
      return value ?? null;
    },
    setItem: async (key: string, value: string) => {
      await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string) => {
      await SecureStore.deleteItemAsync(key);
    },
  };
};

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for development without Supabase
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Mock mode" },
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: "Mock mode" },
        }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Mock mode" } }),
        update: () => ({ data: null, error: { message: "Mock mode" } }),
        delete: () => ({ data: null, error: { message: "Mock mode" } }),
      }),
      rpc: () => ({ data: null, error: { message: "Mock mode" } }),
    } as import("@supabase/supabase-js").SupabaseClient<
      unknown,
      "public",
      unknown
    >;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  });
};
