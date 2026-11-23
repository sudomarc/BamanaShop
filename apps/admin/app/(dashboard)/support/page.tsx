const mockTickets = [
  {
    id: "TKT-001",
    user: "Mamadou D.",
    email: "mamadou@email.com",
    subject: "Commande non reçue",
    order: "ORD-20261118-005",
    status: "open",
    priority: "high",
    createdAt: "2026-11-19 08:15",
  },
  {
    id: "TKT-002",
    user: "Aissata Barry (vendeur)",
    email: "aissata@bamanashop.gn",
    subject: "Problème stock",
    order: "ORD-20261119-001",
    status: "in_progress",
    priority: "normal",
    createdAt: "2026-11-19 07:42",
    assignedTo: "Admin",
  },
  {
    id: "TKT-003",
    user: "Ibrahima K.",
    email: "ibra@email.com",
    subject: "Produit endommagé",
    order: "ORD-20261117-012",
    status: "waiting_customer",
    priority: "normal",
    createdAt: "2026-11-18 15:30",
  },
  {
    id: "TKT-004",
    user: "Moussa Keita (livreur)",
    email: "moussa@expressgn.gn",
    subject: "Adresse introuvable",
    order: "ORD-20261119-002",
    status: "open",
    priority: "urgent",
    createdAt: "2026-11-19 09:05",
  },
];

export default function SupportPage() {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Support & Tickets</h1>
      </header>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Sujet</th>
              <th>Commande</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Assigné à</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="font-mono text-sm">{ticket.id}</td>
                <td className="text-sm">
                  <div className="font-medium">{ticket.user}</div>
                  <div className="text-slate-500">{ticket.email}</div>
                </td>
                <td>{ticket.subject}</td>
                <td className="font-mono text-sm">{ticket.order}</td>
                <td>
                  <span
                    className={`badge ${
                      ticket.status === "resolved"
                        ? "badge-success"
                        : ticket.status === "in_progress"
                          ? "badge-info"
                          : ticket.status === "waiting_customer"
                            ? "badge-warning"
                            : "badge-neutral"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      ticket.priority === "urgent"
                        ? "badge-danger"
                        : ticket.priority === "high"
                          ? "badge-warning"
                          : "badge-info"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </td>
                <td>{ticket.assignedTo ?? "—"}</td>
                <td className="text-sm text-slate-500">{ticket.createdAt}</td>
                <td>
                  <button className="btn btn-ghost text-sm px-2 py-1">
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
