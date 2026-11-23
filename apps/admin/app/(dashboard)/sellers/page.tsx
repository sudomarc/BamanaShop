import Link from "next/link";

const mockSellers = [
  {
    id: "SEL-001",
    name: "Aissata Barry",
    business: "Boutique Aissata",
    email: "aissata@bamanashop.gn",
    phone: "+224 62 00 00 02",
    status: "approved",
    stores: 1,
    orders: 142,
    revenue: "12.5M GNF",
    joined: "2026-01-15",
  },
  {
    id: "SEL-002",
    name: "Mamadou Diallo",
    business: "Tech Store Conakry",
    email: "mamadou@techstore.gn",
    phone: "+224 62 11 11 11",
    status: "pending",
    stores: 1,
    orders: 0,
    revenue: "0 GNF",
    joined: "2026-11-10",
  },
  {
    id: "SEL-003",
    name: "Fatoumata Camara",
    business: "Mode Africaine",
    email: "fatou@modeafric.gn",
    phone: "+224 62 22 22 22",
    status: "approved",
    stores: 2,
    orders: 89,
    revenue: "8.2M GNF",
    joined: "2026-03-22",
  },
  {
    id: "SEL-004",
    name: "Ibrahima Sow",
    business: "Maison & Déco",
    email: "ibra@maisondeco.gn",
    phone: "+224 62 33 33 33",
    status: "suspended",
    stores: 1,
    orders: 34,
    revenue: "2.1M GNF",
    joined: "2026-06-05",
  },
];

export default function SellersPage() {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Gestion des vendeurs</h1>
        <Link href="/dashboard/sellers/new" className="btn btn-primary">
          Nouveau vendeur
        </Link>
      </header>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendeur</th>
              <th>Entreprise</th>
              <th>Contact</th>
              <th>Statut</th>
              <th>Boutiques</th>
              <th>Commandes</th>
              <th>CA Total</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSellers.map((seller) => (
              <tr key={seller.id}>
                <td className="font-mono text-sm">{seller.id}</td>
                <td className="font-medium">{seller.name}</td>
                <td>{seller.business}</td>
                <td className="text-sm">
                  <div>{seller.email}</div>
                  <div className="text-slate-500">{seller.phone}</div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      seller.status === "approved"
                        ? "badge-success"
                        : seller.status === "pending"
                          ? "badge-warning"
                          : "badge-danger"
                    }`}
                  >
                    {seller.status}
                  </span>
                </td>
                <td>{seller.stores}</td>
                <td>{seller.orders}</td>
                <td className="font-medium">{seller.revenue}</td>
                <td className="text-sm text-slate-500">{seller.joined}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/sellers/${seller.id}`}
                      className="btn btn-ghost text-sm px-2 py-1"
                    >
                      Voir
                    </Link>
                    {seller.status === "pending" && (
                      <>
                        <button className="btn btn-success text-sm px-2 py-1">
                          Approuver
                        </button>
                        <button className="btn btn-danger text-sm px-2 py-1">
                          Rejeter
                        </button>
                      </>
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
