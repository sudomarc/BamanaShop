"use client";

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";

// Using React Native components for consistency, but in Next.js these would be HTML elements
// This is a placeholder - actual implementation would use Next.js components

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("commissions");

  const tabs = [
    { id: "commissions", label: "Règles de commission" },
    { id: "partners", label: "Partenaires livraison" },
    { id: "categories", label: "Catégories" },
    { id: "general", label: "Général" },
  ];

  const mockCommissionRules = [
    {
      id: "1",
      name: "Globale par défaut",
      scope: "Global",
      rate: "10%",
      minOrder: "—",
      maxCommission: "50 000 GNF",
      active: true,
    },
    {
      id: "2",
      name: "Électronique",
      scope: "Catégorie: Électronique",
      rate: "12%",
      minOrder: "100 000 GNF",
      maxCommission: "150 000 GNF",
      active: true,
    },
    {
      id: "3",
      name: "Alimentation",
      scope: "Catégorie: Alimentation",
      rate: "8%",
      minOrder: "—",
      maxCommission: "30 000 GNF",
      active: true,
    },
    {
      id: "4",
      name: "Boutique Aissata",
      scope: "Boutique: Aissata",
      rate: "10%",
      minOrder: "—",
      maxCommission: "—",
      active: false,
    },
  ];

  const mockDeliveryPartners = [
    {
      id: "1",
      name: "Express Guinée",
      phone: "+224 62 01 11 11",
      email: "ops@expressgn.gn",
      zones: "Kaloum, Dixinn, Matam, Ratoma, Matoto",
      baseFee: "5 000 GNF",
      perKm: "1 000 GNF",
      codFee: "2 000 GNF",
      active: true,
    },
    {
      id: "2",
      name: "Livraison Rapide",
      phone: "+224 62 02 22 22",
      email: "contact@livraisonrapide.gn",
      zones: "Kaloum, Dixinn, Matam",
      baseFee: "4 000 GNF",
      perKm: "1 200 GNF",
      codFee: "1 500 GNF",
      active: true,
    },
  ];

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Paramètres</h1>
      </header>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "commissions" && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Règles de commission</h2>
            <button className="btn btn-primary">Nouvelle règle</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Portée</th>
                  <th>Taux</th>
                  <th>Min. commande</th>
                  <th>Max. commission</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockCommissionRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-medium">{rule.name}</td>
                    <td>{rule.scope}</td>
                    <td className="font-medium">{rule.rate}</td>
                    <td>{rule.minOrder}</td>
                    <td>{rule.maxCommission}</td>
                    <td>
                      <span
                        className={`badge ${rule.active ? "badge-success" : "badge-neutral"}`}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost text-sm px-2 py-1">
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "partners" && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Partenaires de livraison</h2>
            <button className="btn btn-primary">Ajouter partenaire</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Zones</th>
                  <th>Frais base</th>
                  <th>Par km</th>
                  <th>Frais COD</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockDeliveryPartners.map((partner) => (
                  <tr key={partner.id}>
                    <td className="font-medium">{partner.name}</td>
                    <td>{partner.phone}</td>
                    <td className="text-sm">{partner.email}</td>
                    <td className="text-sm">{partner.zones}</td>
                    <td>{partner.baseFee}</td>
                    <td>{partner.perKm}</td>
                    <td>{partner.codFee}</td>
                    <td>
                      <span
                        className={`badge ${partner.active ? "badge-success" : "badge-neutral"}`}
                      >
                        {partner.active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost text-sm px-2 py-1">
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Catégories de produits</h2>
            <button className="btn btn-primary">Nouvelle catégorie</button>
          </div>
          <p className="p-4 text-slate-500">
            Gestion des catégories (à implémenter avec arbre hiérarchique)
          </p>
        </div>
      )}

      {activeTab === "general" && (
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Paramètres généraux</h2>
          </div>
          <div className="p-4 space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-2">
                Devise par défaut
              </label>
              <select className="input">
                <option>GNF (Franc guinéen)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Fuseau horaire
              </label>
              <select className="input">
                <option>Africa/Conakry (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Langue par défaut
              </label>
              <select className="input">
                <option>Français</option>
                <option>Anglais</option>
                <option>Pular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Commission par défaut
              </label>
              <div className="flex items-center gap-2">
                <input type="number" className="input w-24" defaultValue="10" />
                <span>%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frais de livraison par défaut
              </label>
              <input
                type="number"
                className="input w-40"
                defaultValue="5000"
                placeholder="GNF"
              />
            </div>
            <button className="btn btn-primary">Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}
