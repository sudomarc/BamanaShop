"use client";

import { useState } from "react";

const mockUnassignedOrders = [
  {
    id: "ORD-20261119-001",
    store: "Boutique Aissata",
    storeCommune: "Dixinn",
    customer: "Mamadou D.",
    customerCommune: "Matam",
    items: 3,
    amount: "85 000 GNF",
    payment: "COD",
    partner: "Express Guinée",
  },
  {
    id: "ORD-20261119-003",
    store: "Mode Africaine",
    storeCommune: "Kaloum",
    customer: "Ibrahima K.",
    customerCommune: "Ratoma",
    items: 2,
    amount: "45 000 GNF",
    payment: "COD",
    partner: "Express Guinée",
  },
];

const mockCouriers = [
  {
    id: "COU-001",
    name: "Ibrahima Camara",
    partner: "Express Guinée",
    phone: "+224 62 00 00 03",
    vehicle: "Moto",
    status: "available",
    currentLoad: 0,
  },
  {
    id: "COU-002",
    name: "Moussa Keita",
    partner: "Express Guinée",
    phone: "+224 62 11 11 12",
    vehicle: "Moto",
    status: "busy",
    currentLoad: 2,
  },
  {
    id: "COU-003",
    name: "Abdoulaye Bah",
    partner: "Livraison Rapide",
    phone: "+224 62 22 22 23",
    vehicle: "Vélo",
    status: "available",
    currentLoad: 0,
  },
];

const mockActiveDeliveries = [
  {
    id: "DEL-001",
    orderId: "ORD-20261119-002",
    courier: "Moussa Keita",
    status: "picked_up",
    pickup: "Tech Store Conakry (Kaloum)",
    dropoff: "Fatou B. (Matam)",
    pickedUpAt: "09:15",
  },
];

export default function DispatchPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Dispatch manuel</h1>
        <p className="text-slate-500">Assigner les commandes aux livreurs</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">
                Commandes en attente de dispatch ({mockUnassignedOrders.length})
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {mockUnselectedOrders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p>Aucune commande en attente de dispatch</p>
                </div>
              ) : (
                mockUnassignedOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOrder === order.id ? "border-primary bg-blue-50" : "border-slate-200 hover:border-primary/50"}`}
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder === order.id ? null : order.id,
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span className="font-medium">{order.id}</span>
                          <span className="badge badge-info">
                            {order.payment}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {order.store} → {order.customer}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.storeCommune} → {order.customerCommune}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.amount}</div>
                        <div className="text-xs text-slate-500">
                          {order.items} articles
                        </div>
                      </div>
                    </div>
                    {selectedOrder === order.id && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          Sélectionner un livreur :
                        </p>
                        <div className="space-y-2">
                          {mockCouriers
                            .filter((c) => c.status === "available")
                            .map((courier) => (
                              <button
                                key={courier.id}
                                className={`w-full text-left p-3 border rounded-lg ${selectedCourier === courier.id ? "border-primary bg-blue-50" : "border-slate-200"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCourier(
                                    selectedCourier === courier.id
                                      ? null
                                      : courier.id,
                                  );
                                }}
                              >
                                <div className="font-medium">
                                  {courier.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {courier.partner} • {courier.vehicle} •
                                  Charge: {courier.currentLoad}
                                </div>
                              </button>
                            ))}
                        </div>
                        {selectedOrder && selectedCourier && (
                          <div className="mt-3 flex gap-2">
                            <button className="btn btn-primary flex-1">
                              Assigner et dispatcher
                            </button>
                            <button className="btn btn-secondary">
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">
                Livraisons en cours ({mockActiveDeliveries.length})
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {mockActiveDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm">{delivery.id}</div>
                      <div className="text-sm text-slate-600">
                        {delivery.pickup} → {delivery.dropoff}
                      </div>
                      <div className="text-xs text-slate-500">
                        Livreur: {delivery.courier} • Pris en charge:{" "}
                        {delivery.pickedUpAt}
                      </div>
                    </div>
                    <span
                      className={`badge ${delivery.status === "delivered" ? "badge-success" : "badge-warning"}`}
                    >
                      {delivery.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">
                Livreurs disponibles (
                {mockCouriers.filter((c) => c.status === "available").length})
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {mockCouriers
                .filter((c) => c.status === "available")
                .map((courier) => (
                  <div
                    key={courier.id}
                    className="p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="font-medium">{courier.name}</div>
                    <div className="text-sm text-slate-500">
                      {courier.partner} • {courier.vehicle}
                    </div>
                    <div className="text-xs text-slate-400">
                      {courier.phone}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Partenaires</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="p-3 border border-slate-200 rounded-lg">
                <div className="font-medium">Express Guinée</div>
                <div className="text-sm text-slate-500">
                  Zones: Kaloum, Dixinn, Matam, Ratoma, Matoto
                </div>
                <div className="text-xs text-slate-400">
                  Frais de base: 5 000 GNF • Par km: 1 000 GNF • COD: 2 000 GNF
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <div className="font-medium">Livraison Rapide</div>
                <div className="text-sm text-slate-500">
                  Zones: Kaloum, Dixinn, Matam
                </div>
                <div className="text-xs text-slate-400">
                  Frais de base: 4 000 GNF • Par km: 1 200 GNF • COD: 1 500 GNF
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Fixed typo
const mockUnselectedOrders = [
  {
    id: "ORD-20261119-001",
    store: "Boutique Aissata",
    storeCommune: "Dixinn",
    customer: "Mamadou D.",
    customerCommune: "Matam",
    items: 3,
    amount: "85 000 GNF",
    payment: "COD",
    partner: "Express Guinée",
  },
  {
    id: "ORD-20261119-003",
    store: "Mode Africaine",
    storeCommune: "Kaloum",
    customer: "Ibrahima K.",
    customerCommune: "Ratoma",
    items: 2,
    amount: "45 000 GNF",
    payment: "COD",
    partner: "Express Guinée",
  },
];
