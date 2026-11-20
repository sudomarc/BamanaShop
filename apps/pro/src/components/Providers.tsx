"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "@supabase/auth-helpers-react";
import { createSupabaseClient } from "@/utils/supabase";
import { useMemo } from "react";
import { Platform } from "react-native";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  const supabase = useMemo(() => createSupabaseClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider supabaseClient={supabase}>{children}</SessionProvider>
      {__DEV__ && Platform.OS !== "web" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
