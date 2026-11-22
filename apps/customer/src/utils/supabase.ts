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
  const mockQueryBuilder: {
    select: (...columns: string[]) => typeof mockQueryBuilder;
    eq: (column: string, value: unknown) => typeof mockQueryBuilder;
    neq: (column: string, value: unknown) => typeof mockQueryBuilder;
    gt: (column: string, value: unknown) => typeof mockQueryBuilder;
    gte: (column: string, value: unknown) => typeof mockQueryBuilder;
    lt: (column: string, value: unknown) => typeof mockQueryBuilder;
    lte: (column: string, value: unknown) => typeof mockQueryBuilder;
    like: (column: string, pattern: string) => typeof mockQueryBuilder;
    ilike: (column: string, pattern: string) => typeof mockQueryBuilder;
    is: (column: string, value: unknown) => typeof mockQueryBuilder;
    in: (column: string, values: unknown[]) => typeof mockQueryBuilder;
    contains: (column: string, value: unknown) => typeof mockQueryBuilder;
    containedBy: (column: string, value: unknown) => typeof mockQueryBuilder;
    range: (from: number, to: number) => typeof mockQueryBuilder;
    limit: (count: number) => typeof mockQueryBuilder;
    order: (column: string, options?: { ascending?: boolean }) => typeof mockQueryBuilder;
    single: () => Promise<{ data: null; error: { message: string } }>;
    maybeSingle: () => Promise<{ data: null; error: { message: string } }>;
    insert: (values: unknown) => typeof mockQueryBuilder;
    update: (values: unknown) => typeof mockQueryBuilder;
    upsert: (values: unknown) => typeof mockQueryBuilder;
    delete: () => typeof mockQueryBuilder;
    then: <TResult>(
      onFulfilled?: (value: { data: unknown[]; error: null }) => TResult,
      onRejected?: (reason: unknown) => TResult,
    ) => Promise<TResult>;
  } = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    select: (..._columns: string[]) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    eq: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    neq: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gt: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gte: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lt: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lte: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    like: (_column: string, _pattern: string) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ilike: (_column: string, _pattern: string) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    is: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in: (_column: string, _values: unknown[]) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contains: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    containedBy: (_column: string, _value: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    range: (_from: number, _to: number) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    limit: (_count: number) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    order: (_column: string, _options?: { ascending?: boolean }) => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: { message: "Mock mode" } }),
    maybeSingle: () => Promise.resolve({ data: null, error: { message: "Mock mode" } }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    insert: (_values: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update: (_values: unknown) => mockQueryBuilder,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    upsert: (_values: unknown) => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    then: <TResult>(
      onFulfilled?: (value: { data: unknown[]; error: null }) => TResult,
      onRejected?: (reason: unknown) => TResult,
    ) => Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
  };

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
