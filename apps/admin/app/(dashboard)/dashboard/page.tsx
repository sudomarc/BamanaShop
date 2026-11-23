import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    {
      label: "Commandes aujourd'hui",
      value: "24",
      change: "+12%",
      trend: "up",
    },
    { label: "GMV (GNF)", value: "12.5M", change: "+8%", trend: "up" },
    { label: "Vendeurs actifs", value: "47", change: "+3", trend: "up" },
    { label: "Livraisons en cours", value: "18", change: "-2", trend: "down" },
  ];

  const recentOrders = [
    {
      id: "ORD-20261119-001",
      store: "Boutique Aissata",
      customer: "Mamadou D.",
      amount: "85 000 GNF",
      status: "preparing",
      time: "Il y a 12 min",
    },
    {
      id: "ORD-20261119-002",
      store: "Tech Store Conakry",
      customer: "Fatou B.",
      amount: "1 250 000 GNF",
      status: "ready_for_pickup",
      time: "Il y a 25 min",
    },
    {
      id: "ORD-20261119-003",
      store: "Mode Africaine",
      customer: "Ibrahima K.",
      amount: "45 000 GNF",
      status: "confirmed",
      time: "Il y a 42 min",
    },
    {
      id: "ORD-20261119-004",
      store: "Boutique Aissata",
      customer: "Aissata C.",
      amount: "120 000 GNF",
      status: "delivered",
      time: "Il y a 2h",
    },
  ];

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/orders" className="btn btn-primary">
            Voir toutes les commandes
          </Link>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card card">
            <p className="stat-label">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="stat-value">{stat.value}</p>
              <span
                className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Commandes récentes</h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Boutique</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Heure</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-sm">{order.id}</td>
                  <td>{order.store}</td>
                  <td>{order.customer}</td>
                  <td className="font-medium">{order.amount}</td>
                  <td>
                    <span
                      className={`badge ${
                        order.status === "delivered"
                          ? "badge-success"
                          : order.status === "ready_for_pickup"
                            ? "badge-info"
                            : order.status === "preparing"
                              ? "badge-warning"
                              : "badge-neutral"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-sm text-slate-500">{order.time}</td>
                  <td>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="btn btn-ghost text-sm px-2 py-1"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Alertes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
              <span className="text-amber-600">⚠</span>
              <span>3 livraisons en retard (2h)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <span className="text-blue-600">ℹ</span>
              <span>2 nouveaux vendeurs en attente de validation</span>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Actions rapides</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/sellers/new" className="btn btn-primary">
              Nouveau vendeur
            </Link>
            <Link href="/dashboard/dispatch" className="btn btn-secondary">
              Dispatch manuel
            </Link>
            <Link href="/dashboard/payables" className="btn btn-secondary">
              Reversements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
