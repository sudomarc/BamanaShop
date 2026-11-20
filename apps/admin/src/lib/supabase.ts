import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase Admin] Missing environment variables.");
}

export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({
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
    } as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const createSupabaseAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      auth: {
        admin: {
          listUsers: async () => ({ data: { users: [] }, error: null }),
          deleteUser: async () => ({ error: null }),
        },
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Mock mode" } }),
        update: () => ({ data: null, error: { message: "Mock mode" } }),
        delete: () => ({ data: null, error: { message: "Mock mode" } }),
      }),
      rpc: () => ({ data: null, error: { message: "Mock mode" } }),
    } as any;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
