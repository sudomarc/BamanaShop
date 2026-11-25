"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Accès administrateur refusé
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ce compte ne possède pas de rôle Admin approuvé. Contactez un
          administrateur principal si cet accès est nécessaire.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="btn btn-primary mt-5"
        >
          Se déconnecter
        </button>
      </section>
    </main>
  );
}
