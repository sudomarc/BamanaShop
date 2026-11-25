"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type ProRole = "seller" | "courier";

type PendingApplication = {
  user_id: string;
  role: ProRole;
  membership_status: string;
  submitted_at: string;
  profile: {
    email: string | null;
    full_name: string | null;
    phone: string | null;
  };
  seller_profile?: {
    business_name: string;
    business_activities: string[];
    business_details: Record<string, unknown>;
    status: string;
    review_note: string | null;
    created_at: string;
  } | null;
  courier_profile?: {
    vehicle_type: string | null;
    vehicle_plate: string | null;
    status: string;
    review_note: string | null;
    created_at: string;
  } | null;
};

const activityLabels: Record<string, string> = {
  physical_store: "Commerce physique",
  online_seller: "Vente en ligne",
  wholesaler: "Grossiste",
  distributor: "Distributeur",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function summarizeDetails(details: Record<string, unknown>) {
  return Object.entries(details).map(([key, value]) => {
    const label = activityLabels[key] ?? key;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return `${label} : ${String(value)}`;
    }
    const fields = Object.entries(value as Record<string, unknown>)
      .map(([field, fieldValue]) => {
        const normalized = Array.isArray(fieldValue)
          ? fieldValue.join(", ")
          : String(fieldValue);
        return `${field} : ${normalized}`;
      })
      .join(" · ");
    return `${label} — ${fields}`;
  });
}

export function ProApplicationsQueue({
  role,
  title,
  description,
}: {
  role: ProRole;
  title: string;
  description: string;
}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase.rpc(
        "admin_list_pending_pro_applications",
      );
      if (queryError) throw queryError;
      setApplications(
        ((data ?? []) as PendingApplication[]).filter(
          (application) => application.role === role,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les candidatures.",
      );
    } finally {
      setLoading(false);
    }
  }, [role, supabase]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const review = async (
    application: PendingApplication,
    decision: "approve" | "reject",
  ) => {
    const key = `${application.user_id}:${application.role}`;
    const reason = reasons[key]?.trim() ?? "";

    if (decision === "reject" && reason.length < 5) {
      setError("Un motif de refus d'au moins 5 caractères est obligatoire.");
      return;
    }

    setActionId(key);
    setError(null);
    try {
      const { error: reviewError } = await supabase.rpc(
        "admin_review_pro_application",
        {
          p_user_id: application.user_id,
          p_role: application.role,
          p_decision: decision,
          p_reason: decision === "reject" ? reason : null,
        },
      );
      if (reviewError) throw reviewError;
      await loadApplications();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "La décision n'a pas pu être enregistrée.",
      );
    } finally {
      setActionId(null);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Configurez Supabase pour charger les candidatures réelles.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadApplications()}
          disabled={loading}
          className="btn btn-secondary"
        >
          Actualiser
        </button>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Chargement des candidatures…
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-8 text-center">
          <h2 className="font-semibold text-slate-900">Aucune demande en attente</h2>
          <p className="mt-2 text-sm text-slate-500">
            Les nouvelles candidatures apparaîtront ici après leur soumission.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const key = `${application.user_id}:${application.role}`;
            const seller = application.seller_profile;
            const courier = application.courier_profile;
            return (
              <article key={key} className="card space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {application.profile.full_name || "Nom non renseigné"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {application.profile.email || "E-mail non renseigné"} ·{" "}
                      {application.profile.phone || "Téléphone non renseigné"}
                    </p>
                  </div>
                  <span className="badge badge-warning">En attente</span>
                </div>

                {seller ? (
                  <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{seller.business_name}</p>
                    <div className="flex flex-wrap gap-2">
                      {seller.business_activities.map((activity) => (
                        <span key={activity} className="badge badge-info">
                          {activityLabels[activity] ?? activity}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      {summarizeDetails(seller.business_details).map((detail) => (
                        <p key={detail}>{detail}</p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {courier ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    <p>
                      <strong>Moyen de transport :</strong> {courier.vehicle_type || "Non renseigné"}
                    </p>
                    <p className="mt-1">
                      Immatriculation : {courier.vehicle_plate || "Non renseignée"}
                    </p>
                  </div>
                ) : null}

                <div className="text-xs text-slate-400">
                  Demande reçue le {formatDate(application.submitted_at)}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                  <input
                    value={reasons[key] ?? ""}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder="Motif requis en cas de refus"
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionId === key}
                      onClick={() => void review(application, "reject")}
                      className="btn btn-danger"
                    >
                      Refuser
                    </button>
                    <button
                      type="button"
                      disabled={actionId === key}
                      onClick={() => void review(application, "approve")}
                      className="btn btn-success"
                    >
                      {actionId === key ? "Traitement…" : "Approuver"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
