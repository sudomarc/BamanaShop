import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey);

type AdminSupabaseClient = ReturnType<typeof createBrowserClient>;

export const createSupabaseClient = (): AdminSupabaseClient => {
  if (!isSupabaseConfigured()) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => undefined } },
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase is not configured." },
        }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          data: [],
          error: { message: "Supabase is not configured." },
        }),
      }),
      rpc: async () => ({
        data: null,
        error: { message: "Supabase is not configured." },
      }),
    } as unknown as AdminSupabaseClient;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
