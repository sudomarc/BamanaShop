"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type GateState = "loading" | "signed-out" | "denied" | "authorized" | "error";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<GateState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setMessage(error.message);
        setState("error");
        return;
      }
      setSession(data.session);
      if (!data.session) setState("signed-out");
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setState(nextSession ? "loading" : "signed-out");
      setMessage(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    setState("loading");

    const verifyAdmin = async () => {
      const { data, error } = await supabase
        .from("role_memberships")
        .select("role,status")
        .eq("user_id", session.user.id);

      if (!active) return;
      if (error) {
        setMessage(error.message);
        setState("error");
        return;
      }

      const isAdmin = (data ?? []).some(
        (membership: { role: string; status: string }) =>
          membership.role === "admin" && membership.status === "approved",
      );

      setState(isAdmin ? "authorized" : "denied");
    };

    void verifyAdmin();

    return () => {
      active = false;
    };
  }, [session, supabase]);

  useEffect(() => {
    if (!session && state === "signed-out") {
      router.replace("/login");
    }
  }, [router, session, state]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-lg rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Configuration Supabase requise
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
            pour activer l'authentification Admin. Aucun mode mock n'est autorisé
            pour accéder au dashboard.
          </p>
        </section>
      </main>
    );
  }

  if (state === "loading" || state === "signed-out") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Vérification de la session Admin…</p>
      </main>
    );
  }

  if (state === "denied" || state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            {state === "denied"
              ? "Accès administrateur refusé"
              : "Vérification impossible"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {message ??
              "Ce compte ne possède pas de rôle Admin approuvé. Contactez un administrateur principal si cet accès est nécessaire."}
          </p>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="btn btn-primary mt-5"
          >
            Se déconnecter
          </button>
        </section>
      </main>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-5 py-2 text-xs text-slate-500">
        <span>{session?.user.email ?? "Administrateur"}</span>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
        >
          Déconnexion
        </button>
      </div>
      {children}
    </div>
  );
}
