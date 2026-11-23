"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const mockOrder = {
  id: "ORD-20261119-001",
  status: "preparing",
  paymentStatus: "cash_due",
  deliveryStatus: "unassigned",
  customer: {
    name: "Mamadou Diallo",
    phone: "+224 62 00 00 01",
    email: "mamadou@email.com",
  },
  store: {
    name: "Boutique Aissata",
    seller: "Aissata Barry",
    phone: "+224 62 00 00 02",
  },
  deliveryAddress: {
    commune: "Matam",
    quartier: "Hamdallaye",
    landmark: "Mosquée Hamdallaye",
    streetDetails: "Rue 12, porte 45",
    phone: "+224 62 00 00 01",
    instructions: "Sonner à la porte bleue",
  },
  items: [
    {
      name: "Riz Parfumé 5kg",
      sku: "RIZ-5KG-001",
      quantity: 2,
      unitPrice: 50000,
      total: 100000,
    },
    {
      name: "Huile Végétale 1L",
      sku: "HUILE-1L-001",
      quantity: 1,
      unitPrice: 15000,
      total: 15000,
    },
  ],
  subtotal: 115000,
  deliveryFee: 5000,
  paymentFee: 0,
  total: 120000,
  commission: 11500,
  courierCost: 5000,
  sellerPayable: 98500,
  paymentMethod: "COD",
  createdAt: "2026-11-19 08:32",
  updatedAt: "2026-11-19 08:45",
  timeline: [
    {
      status: "pending",
      label: "Commande passée",
      time: "08:32",
      completed: true,
    },
    {
      status: "confirmed",
      label: "Confirmée par le vendeur",
      time: "08:35",
      completed: true,
    },
    {
      status: "preparing",
      label: "En préparation",
      time: "08:45",
      completed: true,
      current: true,
    },
    {
      status: "ready_for_pickup",
      label: "Prêt à collecter",
      time: "—",
      completed: false,
    },
    { status: "completed", label: "Livrée", time: "—", completed: false },
  ],
};

const statusOptions = [
  { value: "pending", label: "En attente", currentOnly: false },
  { value: "confirmed", label: "Confirmée", allowedFrom: ["pending"] },
  { value: "preparing", label: "En préparation", allowedFrom: ["confirmed"] },
  {
    value: "ready_for_pickup",
    label: "Prêt à collecter",
    allowedFrom: ["preparing"],
  },
  { value: "completed", label: "Livrée", allowedFrom: ["ready_for_pickup"] },
  {
    value: "cancelled",
    label: "Annulée",
    allowedFrom: ["pending", "confirmed", "preparing"],
  },
  { value: "returned", label: "Retournée", allowedFrom: ["completed"] },
];

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const formatAmount = (amount: number) =>
    amount.toLocaleString("fr-FR") + " GNF";

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "badge-neutral",
      confirmed: "badge-info",
      preparing: "badge-warning",
      ready_for_pickup: "badge-info",
      completed: "badge-success",
      cancelled: "badge-danger",
      returned: "badge-warning",
    };
    return badges[status] ?? "badge-neutral";
  };

  return (
    <div className="container">
      <header className="page-header">
        <Link href="/dashboard/orders" className="btn btn-ghost">
          ← Retour aux commandes
        </Link>
        <div>
          <h1 className="page-title">Commande {mockOrder.id}</h1>
          <p className="text-slate-500">
            Créée le {mockOrder.createdAt} • Mise à jour {mockOrder.updatedAt}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chronologie</h2>
              <span className={`badge ${getStatusBadge(mockOrder.status)}`}>
                {mockOrder.status.replace("_", " ")}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {mockOrder.timeline.map((event, index) => (
                <div
                  key={event.status}
                  className={`flex relative ${index < mockOrder.timeline.length - 1 ? "pb-8" : ""}`}
                >
                  <div className="flex">
                    <div className="relative flex-shrink-0 w-6 h-6">
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${event.completed ? "bg-green-500 border-green-500" : event.current ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300"} relative z-10`}
                      />
                      {index < mockOrder.timeline.length - 1 && (
                        <div className="absolute left-1.5 top-3 bottom-0 w-0.5 bg-slate-200" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div
                        className={`text-sm ${event.completed ? "text-green-600" : event.current ? "text-blue-600 font-medium" : "text-slate-500"}`}
                      >
                        {event.label}
                      </div>
                      <div className="text-xs text-slate-400">{event.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2">
              <select className="input w-auto" defaultValue={mockOrder.status}>
                {statusOptions
                  .filter(
                    (opt) =>
                      (opt.allowedFrom ?? []).includes(mockOrder.status) ||
                      opt.value === mockOrder.status,
                  )
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
              <button className="btn btn-primary">Mettre à jour</button>
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Articles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>SKU</th>
                    <th>Qté</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="font-medium">{item.name}</td>
                      <td className="text-sm font-mono">{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>{formatAmount(item.unitPrice)}</td>
                      <td className="font-medium">
                        {formatAmount(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="text-right font-medium">
                      Sous-total
                    </td>
                    <td colSpan={2} className="font-medium">
                      {formatAmount(mockOrder.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right font-medium">
                      Frais de livraison
                    </td>
                    <td colSpan={2}>{formatAmount(mockOrder.deliveryFee)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right font-medium">
                      Frais de paiement
                    </td>
                    <td colSpan={2}>{formatAmount(mockOrder.paymentFee)}</td>
                  </tr>
                  <tr className="font-bold text-lg border-t-2 border-slate-200">
                    <td colSpan={3} className="text-right">
                      Total
                    </td>
                    <td colSpan={2}>{formatAmount(mockOrder.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Informations financières
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">Commission plateforme</div>
                <div className="font-semibold text-red-600">
                  -{formatAmount(mockOrder.commission)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">Coût livreur</div>
                <div className="font-semibold text-amber-600">
                  -{formatAmount(mockOrder.courierCost)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">Payable vendeur</div>
                <div className="font-semibold text-green-600">
                  {formatAmount(mockOrder.sellerPayable)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">Mode de paiement</div>
                <div className="font-semibold">{mockOrder.paymentMethod}</div>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">Statut paiement</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${mockOrder.paymentStatus === "paid" ? "badge-success" : mockOrder.paymentStatus === "cash_due" ? "badge-warning" : "badge-danger"}`}
                  >
                    {mockOrder.paymentStatus.replace("_", " ")}
                  </span>
                  <span className="text-slate-500">
                    Statut livraison:{" "}
                    {mockOrder.deliveryStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Client</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-slate-500">Nom</div>
                <div className="font-medium">{mockOrder.customer.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Téléphone</div>
                <div className="font-medium">{mockOrder.customer.phone}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Email</div>
                <div className="font-medium">{mockOrder.customer.email}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Boutique</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-slate-500">Nom</div>
                <div className="font-medium">{mockOrder.store.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Vendeur</div>
                <div className="font-medium">{mockOrder.store.seller}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Téléphone</div>
                <div className="font-medium">{mockOrder.store.phone}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Adresse de livraison</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="font-medium">
                {mockOrder.deliveryAddress.commune},{" "}
                {mockOrder.deliveryAddress.quartier}
              </div>
              {mockOrder.deliveryAddress.landmark && (
                <div className="text-sm text-slate-500">
                  Repère: {mockOrder.deliveryAddress.landmark}
                </div>
              )}
              {mockOrder.deliveryAddress.streetDetails && (
                <div className="text-sm text-slate-500">
                  {mockOrder.deliveryAddress.streetDetails}
                </div>
              )}
              <div className="text-sm text-slate-500">
                {mockOrder.deliveryAddress.phone}
              </div>
              {mockOrder.deliveryAddress.instructions && (
                <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
                  Instructions: {mockOrder.deliveryAddress.instructions}
                </div>
              )}
            </div>
          </section>

          {mockOrder.deliveryStatus === "unassigned" &&
            mockOrder.status !== "cancelled" && (
              <section className="card border-amber-200 bg-amber-50">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <span>⚠</span>
                    <span className="font-semibold">
                      Livraison non assignée
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/dispatch?order=${mockOrder.id}`}
                    className="btn btn-primary w-full"
                  >
                    Assigner un livreur
                  </Link>
                </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
}
