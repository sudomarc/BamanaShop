const mockFinancialEntries = [
  {
    id: "FE-001",
    date: "2026-11-19 08:32",
    type: "order_revenue",
    orderId: "ORD-20261119-001",
    store: "Boutique Aissata",
    amount: "+85 000",
    balance: "12.5M",
  },
  {
    id: "FE-002",
    date: "2026-11-19 08:32",
    type: "platform_commission",
    orderId: "ORD-20261119-001",
    store: "Boutique Aissata",
    amount: "-8 500",
    balance: "12.49M",
  },
  {
    id: "FE-003",
    date: "2026-11-19 08:32",
    type: "delivery_fee_collected",
    orderId: "ORD-20261119-001",
    store: "Boutique Aissata",
    amount: "+5 000",
    balance: "12.5M",
  },
  {
    id: "FE-004",
    date: "2026-11-19 08:32",
    type: "courier_cost",
    orderId: "ORD-20261119-001",
    store: "Boutique Aissata",
    amount: "-5 000",
    balance: "12.49M",
  },
  {
    id: "FE-005",
    date: "2026-11-19 08:15",
    type: "order_revenue",
    orderId: "ORD-20261119-002",
    store: "Tech Store Conakry",
    amount: "+1 250 000",
    balance: "13.74M",
  },
  {
    id: "FE-006",
    date: "2026-11-19 08:15",
    type: "platform_commission",
    orderId: "ORD-20261119-002",
    store: "Tech Store Conakry",
    amount: "-150 000",
    balance: "13.59M",
  },
  {
    id: "FE-007",
    date: "2026-11-19 08:15",
    type: "payment_fee",
    orderId: "ORD-20261119-002",
    store: "Tech Store Conakry",
    amount: "-18 750",
    balance: "13.57M",
  },
  {
    id: "FE-008",
    date: "2026-11-19 06:45",
    type: "seller_payout",
    orderId: null,
    store: "Boutique Aissata",
    amount: "-500 000",
    balance: "13.07M",
  },
];

const typeLabels: Record<string, string> = {
  order_revenue: "Revenu commande",
  delivery_fee_collected: "Frais livraison encaissés",
  payment_fee: "Frais paiement",
  platform_commission: "Commission plateforme",
  courier_cost: "Coût livreur",
  seller_payout: "Reversement vendeur",
  refund_to_customer: "Remboursement client",
  adjustment: "Ajustement",
};

export default function FinancePage() {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Journal financier</h1>
        <p className="text-slate-500">
          Registre append-only de toutes les écritures financières
        </p>
      </header>

      <div className="stats-grid">
        <div className="stat-card card">
          <p className="stat-label">Revenus aujourd'hui</p>
          <p className="stat-value text-green-600">+2.1M GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">Commissions</p>
          <p className="stat-value text-blue-600">+210K GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">Frais livraison</p>
          <p className="stat-value text-amber-600">+45K GNF</p>
        </div>
        <div className="stat-card card">
          <p className="stat-label">Reversements</p>
          <p className="stat-value text-red-600">-500K GNF</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Écritures financières</h2>
          <div className="flex gap-2">
            <select className="input w-auto">
              <option>Tous les types</option>
              <option>order_revenue</option>
              <option>platform_commission</option>
              <option>courier_cost</option>
              <option>seller_payout</option>
              <option>refund_to_customer</option>
            </select>
            <select className="input w-auto">
              <option>Toutes les boutiques</option>
              <option>Boutique Aissata</option>
              <option>Tech Store Conakry</option>
              <option>Mode Africaine</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Commande</th>
                <th>Boutique</th>
                <th>Montant</th>
                <th>Solde après</th>
              </tr>
            </thead>
            <tbody>
              {mockFinancialEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-mono text-sm">{entry.id}</td>
                  <td className="text-sm">{entry.date}</td>
                  <td>
                    <span className="badge badge-info">
                      {typeLabels[entry.type] ?? entry.type}
                    </span>
                  </td>
                  <td className="font-mono text-sm">{entry.orderId ?? "—"}</td>
                  <td>{entry.store}</td>
                  <td
                    className={`font-mono font-medium ${entry.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                  >
                    {entry.amount} GNF
                  </td>
                  <td className="font-mono text-sm">{entry.balance} GNF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
