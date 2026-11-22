import { createClient } from "@supabase/supabase-js";
import Config from "react-native-config";
import * as Keychain from "react-native-keychain";

const supabaseUrl = Config.SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = Config.SUPABASE_ANON_KEY?.trim() ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Using mock client in development.");
}

const keychainService = (key: string) => `com.bamanashop.supabase.${key}`;

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const credentials = await Keychain.getGenericPassword({ service: keychainService(key) });
    return credentials ? credentials.password : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Keychain.setGenericPassword("supabase", value, {
      service: keychainService(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  removeItem: async (key: string): Promise<void> => {
    await Keychain.resetGenericPassword({ service: keychainService(key) });
  },
};

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Mock mode" } }),
        signInWithOtp: async () => ({ data: { user: null, session: null }, error: { message: "Mock mode" } }),
        verifyOtp: async () => ({ data: { user: null, session: null }, error: { message: "Mock mode" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Mock mode" } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Mock mode" } }),
        upsert: () => ({ data: null, error: { message: "Mock mode" } }),
        update: () => ({ data: null, error: { message: "Mock mode" } }),
        delete: () => ({ data: null, error: { message: "Mock mode" } }),
      }),
      rpc: () => ({ data: null, error: { message: "Mock mode" } }),
    } as import("@supabase/supabase-js").SupabaseClient<unknown, "public", unknown>;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};
