import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Config from "react-native-config";
import * as Keychain from "react-native-keychain";
import type { Database } from "@/types/database";

const supabaseUrl = Config.SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = Config.SUPABASE_ANON_KEY?.trim() ?? "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Using mock client in development.",
  );
}

const keychainService = (key: string) => `com.bamanashop.supabase.${key}`;

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const credentials = await Keychain.getGenericPassword({
      service: keychainService(key),
    });
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

function createMockClient(): SupabaseClient<Database> {
  const mockFrom = <T extends keyof Database["public"]["Tables"] = keyof Database["public"]["Tables"]>() => ({
    select: (): {
      data: Database["public"]["Tables"][T]["Row"][];
      error: null;
    } => ({
      data: [],
      error: null,
    }),
    insert: (): { data: null; error: { message: string } } => ({
      data: null,
      error: { message: "Mock mode" },
    }),
    upsert: (): { data: null; error: { message: string } } => ({
      data: null,
      error: { message: "Mock mode" },
    }),
    update: (): { data: null; error: { message: string } } => ({
      data: null,
      error: { message: "Mock mode" },
    }),
    delete: (): { data: null; error: { message: string } } => ({
      data: null,
      error: { message: "Mock mode" },
    }),
    eq: () => mockFrom<T>(),
    neq: () => mockFrom<T>(),
    gt: () => mockFrom<T>(),
    gte: () => mockFrom<T>(),
    lt: () => mockFrom<T>(),
    lte: () => mockFrom<T>(),
    like: () => mockFrom<T>(),
    ilike: () => mockFrom<T>(),
    is: () => mockFrom<T>(),
    in: () => mockFrom<T>(),
    contains: () => mockFrom<T>(),
    containedBy: () => mockFrom<T>(),
    range: () => mockFrom<T>(),
    limit: () => mockFrom<T>(),
    order: () => mockFrom<T>(),
    single: () => mockFrom<T>(),
    maybeSingle: () => mockFrom<T>(),
  });

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
      signInWithOtp: async () => ({
        data: { user: null, session: null },
        error: { message: "Mock mode" },
      }),
      verifyOtp: async () => ({
        data: { user: null, session: null },
        error: { message: "Mock mode" },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Mock mode" },
      }),
      signOut: async () => ({ error: null }),
    },
    from: mockFrom,
    rpc: () => ({ data: null, error: { message: "Mock mode" } }),
  } as unknown as SupabaseClient<Database>;
}

export const createSupabaseClient = (): SupabaseClient<Database> => {
  if (!isSupabaseConfigured) {
    return createMockClient();
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};
