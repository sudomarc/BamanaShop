import Link from "next/link";

const mockPayables = [
  {
    id: "PAY-001",
    store: "Boutique Aissata",
    period: "2026-11-01 → 2026-11-15",
    grossSales: "1.2M",
    commission: "120K",
    deliveryCosts: "45K",
    refunds: "0",
    adjustments: "0",
    netPayable: "1.035M",
    status: "payable",
    dueDate: "2026-11-20",
  },
  {
    id: "PAY-002",
    store: "Tech Store Conakry",
    period: "2026-11-01 → 2026-11-15",
    grossSales: "3.5M",
    commission: "420K",
    deliveryCosts: "15K",
    refunds: "250K",
    adjustments: "0",
    netPayable: "2.815M",
    status: "processing",
    dueDate: "2026-11-25",
  },
  {
    id: "PAY-003",
    store: "Mode Africaine",
    period: "2026-11-01 → 2026-11-15",
    grossSales: "850K",
    commission: "68K",
    deliveryCosts: "30K",
    refunds: "0",
    adjustments: "5K",
    netPayable: "757K",
    status: "paid",
    dueDate: "2026-11-18",
    paidAt: "2026-11-18 10:30",
    paidBy: "Admin",
  },
  {
    id: "PAY-004",
    store: "Maison & Déco",
    period: "2026-11-01 → 2026-11-15",
    grossSales: "280K",
    commission: "28K",
    deliveryCosts: "10K",
    refunds: "0",
    adjustments: "-5K",
    netPayable: "237K",
    status: "on_hold",
    dueDate: "2026-11-20",
  },
];

export default function PayablesPage() {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Payables vendeurs</h1>
        <p className="text-slate-500">
          Montants dus aux vendeurs après commissions, frais et remboursements
        </p>
      </header>

      <div className="stats-grid">
        <div className="stat-card card">
          <p className="stat-label">Total à payer</p>
          <p className="stat-value text-blue-600">4.84M GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">En attente</p>
          <p className="stat-value text-amber-600">1.035M GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">En cours</p>
          <p className="stat-value text-blue-600">2.815M GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">Bloqués</p>
          <p className="stat-value text-red-600">237K GNF</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Périodes de payables</h2>
          <Link href="/dashboard/payables/new" className="btn btn-primary">
            Générer nouvelle période
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Boutique</th>
                <th>Période</th>
                <th>Ventes brutes</th>
                <th>Commission</th>
                <th>Frais livraison</th>
                <th>Remboursements</th>
                <th>Ajustements</th>
                <th>Net à payer</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPayables.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-sm">{p.id}</td>
                  <td className="font-medium">{p.store}</td>
                  <td className="text-sm">{p.period}</td>
                  <td>{p.grossSales} GNF</td>
                  <td className="text-red-600">-{p.commission} GNF</td>
                  <td className="text-amber-600">-{p.deliveryCosts} GNF</td>
                  <td className="text-red-600">-{p.refunds} GNF</td>
                  <td
                    className={
                      p.adjustments.startsWith("-")
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {p.adjustments} GNF
                  </td>
                  <td className="font-bold text-lg">{p.netPayable} GNF</td>
                  <td>
                    <span
                      className={`badge ${
                        p.status === "paid"
                          ? "badge-success"
                          : p.status === "payable"
                            ? "badge-warning"
                            : p.status === "processing"
                              ? "badge-info"
                              : "badge-danger"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="text-sm text-slate-500">{p.dueDate}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/payables/${p.id}`}
                        className="btn btn-ghost text-sm px-2 py-1"
                      >
                        Détails
                      </Link>
                      {p.status === "payable" && (
                        <button className="btn btn-primary text-sm px-2 py-1">
                          Payer
                        </button>
                      )}
                      {p.status === "on_hold" && (
                        <button className="btn btn-secondary text-sm px-2 py-1">
                          Débloquer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 card p-6 bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">
          ⚠ Rapprochement obligatoire
        </h3>
        <p className="text-amber-800 text-sm">
          Aucun reversement ne doit être marqué "payé" sans preuve de virement
          bancaire, accusé de réception vendeur, et rapprochement avec le
          journal financier. Utilisez le bouton "Payer" pour enregistrer la
          référence de paiement et la preuve.
        </p>
      </div>
    </div>
  );
}
