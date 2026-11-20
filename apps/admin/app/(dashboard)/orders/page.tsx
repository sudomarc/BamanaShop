import Link from "next/link";

const mockOrders = [
  {
    id: "ORD-20261119-001",
    store: "Boutique Aissata",
    customer: "Mamadou D.",
    phone: "+224 62 00 00 01",
    items: 3,
    amount: "85 000 GNF",
    payment: "COD",
    paymentStatus: "cash_due",
    deliveryStatus: "unassigned",
    status: "preparing",
    createdAt: "2026-11-19 08:32",
  },
  {
    id: "ORD-20261119-002",
    store: "Tech Store Conakry",
    customer: "Fatou B.",
    phone: "+224 62 11 11 11",
    items: 1,
    amount: "1 250 000 GNF",
    payment: "Orange Money",
    paymentStatus: "paid",
    deliveryStatus: "assigned",
    status: "ready_for_pickup",
    createdAt: "2026-11-19 08:15",
  },
  {
    id: "ORD-20261119-003",
    store: "Mode Africaine",
    customer: "Ibrahima K.",
    phone: "+224 62 22 22 22",
    items: 2,
    amount: "45 000 GNF",
    payment: "COD",
    paymentStatus: "cash_due",
    deliveryStatus: "unassigned",
    status: "confirmed",
    createdAt: "2026-11-19 07:58",
  },
  {
    id: "ORD-20261119-004",
    store: "Boutique Aissata",
    customer: "Aissata C.",
    phone: "+224 62 33 33 33",
    items: 5,
    amount: "120 000 GNF",
    payment: "COD",
    paymentStatus: "cash_collected",
    deliveryStatus: "delivered",
    status: "completed",
    createdAt: "2026-11-19 06:45",
  },
  {
    id: "ORD-20261119-005",
    store: "Maison & Déco",
    customer: "Ousmane T.",
    phone: "+224 62 44 44 44",
    items: 1,
    amount: "280 000 GNF",
    payment: "Orange Money",
    paymentStatus: "failed",
    deliveryStatus: "unassigned",
    status: "cancelled",
    createdAt: "2026-11-19 06:12",
  },
];

export default function OrdersPage() {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Commandes</h1>
        <div className="flex gap-2">
          <select className="input w-auto" style={{ width: "auto" }}>
            <option>Tous les statuts</option>
            <option>pending</option>
            <option>confirmed</option>
            <option>preparing</option>
            <option>ready_for_pickup</option>
            <option>completed</option>
            <option>cancelled</option>
          </select>
          <select className="input w-auto" style={{ width: "auto" }}>
            <option>Tous les paiements</option>
            <option>COD</option>
            <option>Orange Money</option>
          </select>
        </div>
      </header>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Boutique</th>
              <th>Client</th>
              <th>Articles</th>
              <th>Montant</th>
              <th>Paiement</th>
              <th>Statut paiement</th>
              <th>Livraison</th>
              <th>Statut commande</th>
              <th>Créée le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id}>
                <td className="font-mono text-sm">{order.id}</td>
                <td>{order.store}</td>
                <td className="text-sm">
                  <div className="font-medium">{order.customer}</div>
                  <div className="text-slate-500">{order.phone}</div>
                </td>
                <td>{order.items}</td>
                <td className="font-medium">{order.amount}</td>
                <td>
                  <span className="badge badge-info">{order.payment}</span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.paymentStatus === "paid"
                        ? "badge-success"
                        : order.paymentStatus === "cash_collected"
                          ? "badge-success"
                          : order.paymentStatus === "cash_due"
                            ? "badge-warning"
                            : order.paymentStatus === "failed"
                              ? "badge-danger"
                              : "badge-neutral"
                    }`}
                  >
                    {order.paymentStatus.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.deliveryStatus === "delivered"
                        ? "badge-success"
                        : order.deliveryStatus === "in_transit"
                          ? "badge-info"
                          : order.deliveryStatus === "assigned"
                            ? "badge-warning"
                            : order.deliveryStatus === "failed"
                              ? "badge-danger"
                              : "badge-neutral"
                    }`}
                  >
                    {order.deliveryStatus.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.status === "completed"
                        ? "badge-success"
                        : order.status === "ready_for_pickup"
                          ? "badge-info"
                          : order.status === "preparing"
                            ? "badge-warning"
                            : order.status === "cancelled"
                              ? "badge-danger"
                              : "badge-neutral"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="text-sm text-slate-500">{order.createdAt}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="btn btn-ghost text-sm px-2 py-1"
                    >
                      Détails
                    </Link>
                    {order.deliveryStatus === "unassigned" &&
                      order.status !== "cancelled" && (
                        <Link
                          href={`/dashboard/dispatch?order=${order.id}`}
                          className="btn btn-primary text-sm px-2 py-1"
                        >
                          Dispatcher
                        </Link>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
