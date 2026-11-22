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
  // Use a simple mock query builder that returns `any` to bypass strict type checking in mock mode.
  // This is acceptable because mock mode is only used during development when Supabase is not configured.
  const mockQueryBuilder = {
    select: (..._columns: string[]) => mockQueryBuilder,
    eq: (_column: string, _value: unknown) => mockQueryBuilder,
    neq: (_column: string, _value: unknown) => mockQueryBuilder,
    gt: (_column: string, _value: unknown) => mockQueryBuilder,
    gte: (_column: string, _value: unknown) => mockQueryBuilder,
    lt: (_column: string, _value: unknown) => mockQueryBuilder,
    lte: (_column: string, _value: unknown) => mockQueryBuilder,
    like: (_column: string, _pattern: string) => mockQueryBuilder,
    ilike: (_column: string, _pattern: string) => mockQueryBuilder,
    is: (_column: string, _value: unknown) => mockQueryBuilder,
    in: (_column: string, _values: unknown[]) => mockQueryBuilder,
    contains: (_column: string, _value: unknown) => mockQueryBuilder,
    containedBy: (_column: string, _value: unknown) => mockQueryBuilder,
    range: (_from: number, _to: number) => mockQueryBuilder,
    limit: (_count: number) => mockQueryBuilder,
    order: (
      _column: string,
      _options?: { ascending?: boolean },
    ) => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: { message: "Mock mode" } }),
    maybeSingle: () => Promise.resolve({ data: null, error: { message: "Mock mode" } }),
    insert: (_values: unknown) => mockQueryBuilder,
    update: (_values: unknown) => mockQueryBuilder,
    upsert: (_values: unknown) => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    then: <TResult>(
      onFulfilled?: (value: { data: unknown[]; error: null }) => TResult,
      onRejected?: (reason: unknown) => TResult,
    ) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
  } as any;

  const mockFrom = () => mockQueryBuilder;

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
    rpc: () => Promise.resolve({ data: null, error: { message: "Mock mode" } }),
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
