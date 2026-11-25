"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void supabase.auth.getSession().then(
      ({ data }: { data: { session: Session | null } }) => {
        if (data.session) router.replace("/dashboard");
      },
    );
  }, [router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/dashboard");
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Connexion impossible. Vérifiez vos identifiants.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            BamanaShop
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Connexion Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Accès réservé aux comptes disposant d'un rôle Admin approuvé.
          </p>
        </div>

        {!isSupabaseConfigured() ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
            pour activer la connexion.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Adresse e-mail
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="admin@bamanashop.gn"
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Votre mot de passe"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
