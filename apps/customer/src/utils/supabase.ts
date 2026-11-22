import {
  createClient,
  SupabaseClient,
  PostgrestResponse,
  PostgrestSingleResponse,
  PostgrestError,
} from "@supabase/supabase-js";
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

// Type helpers for mock query builder responses
type MockPostgrestResponse<T> = PostgrestResponse<T>;
type MockPostgrestSingleResponse<T> = PostgrestSingleResponse<T>;

function createMockClient(): SupabaseClient<Database> {
  // Create a properly typed mock query builder that returns Supabase-compatible response types
  // This ensures TypeScript can properly infer types when chaining query methods

  type MockQueryBuilder<T = Database["public"]["Tables"]["profiles"]["Row"]> = {
    select: (...columns: string[]) => MockQueryBuilder<T>;
    eq: (column: string, value: unknown) => MockQueryBuilder<T>;
    neq: (column: string, value: unknown) => MockQueryBuilder<T>;
    gt: (column: string, value: unknown) => MockQueryBuilder<T>;
    gte: (column: string, value: unknown) => MockQueryBuilder<T>;
    lt: (column: string, value: unknown) => MockQueryBuilder<T>;
    lte: (column: string, value: unknown) => MockQueryBuilder<T>;
    like: (column: string, pattern: string) => MockQueryBuilder<T>;
    ilike: (column: string, pattern: string) => MockQueryBuilder<T>;
    is: (column: string, value: unknown) => MockQueryBuilder<T>;
    in: (column: string, values: unknown[]) => MockQueryBuilder<T>;
    contains: (column: string, value: unknown) => MockQueryBuilder<T>;
    containedBy: (column: string, value: unknown) => MockQueryBuilder<T>;
    range: (from: number, to: number) => MockQueryBuilder<T>;
    limit: (count: number) => MockQueryBuilder<T>;
    order: (
      column: string,
      options?: { ascending?: boolean },
    ) => MockQueryBuilder<T>;
    single: () => Promise<MockPostgrestSingleResponse<T>>;
    maybeSingle: () => Promise<MockPostgrestSingleResponse<T>>;
    insert: (values: unknown) => MockQueryBuilder<T>;
    update: (values: unknown) => MockQueryBuilder<T>;
    upsert: (values: unknown) => MockQueryBuilder<T>;
    delete: () => MockQueryBuilder<T>;
    then<TResult>(
      onFulfilled?: (value: MockPostgrestResponse<T>) => TResult,
      onRejected?: (reason: unknown) => TResult,
    ): Promise<TResult>;
  };

  const createQueryBuilder = <
    T = Database["public"]["Tables"]["profiles"]["Row"],
  >(): MockQueryBuilder<T> => {
    const builder: MockQueryBuilder<T> = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      select: (..._columns: string[]) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      eq: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      neq: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gt: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gte: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lt: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lte: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      like: (_column: string, _pattern: string) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ilike: (_column: string, _pattern: string) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      is: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      in: (_column: string, _values: unknown[]) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      contains: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      containedBy: (_column: string, _value: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      range: (_from: number, _to: number) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      limit: (_count: number) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      order: (_column: string, _options?: { ascending?: boolean }) => builder,
      single: () =>
        Promise.resolve({
          data: null,
          error: null,
        } as MockPostgrestSingleResponse<T>),
      maybeSingle: () =>
        Promise.resolve({
          data: null,
          error: null,
        } as MockPostgrestSingleResponse<T>),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      insert: (_values: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      update: (_values: unknown) => builder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      upsert: (_values: unknown) => builder,
      delete: () => builder,
      then: <TResult>(
        onFulfilled?: (value: MockPostgrestResponse<T>) => TResult,
        onRejected?: (reason: unknown) => TResult,
      ) =>
        Promise.resolve({
          data: [],
          error: null,
          status: 200,
          statusText: "OK",
          success: true,
          count: null,
        } as MockPostgrestResponse<T>).then(onFulfilled, onRejected),
    };
    return builder;
  };

  const mockFrom = <T extends keyof Database["public"]["Tables"]>() =>
    createQueryBuilder<Database["public"]["Tables"][T]["Row"]>();

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
    rpc: () =>
      Promise.resolve({
        data: null,
        error: { message: "Mock mode" } as PostgrestError,
      }),
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
