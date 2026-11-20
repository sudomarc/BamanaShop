"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

const navigation = [
  { title: "Tableau de bord", href: "/dashboard", icon: "📊" },
  { title: "Vendeurs", href: "/dashboard/sellers", icon: "👥" },
  { title: "Boutiques", href: "/dashboard/stores", icon: "🏪" },
  { title: "Produits", href: "/dashboard/products", icon: "📦" },
  { title: "Commandes", href: "/dashboard/orders", icon: "📋" },
  { title: "Dispatch", href: "/dashboard/dispatch", icon: "🚚" },
  { title: "Finances", href: "/dashboard/finance", icon: "💰" },
  { title: "Payables", href: "/dashboard/payables", icon: "🧾" },
  { title: "Support", href: "/dashboard/support", icon: "🎧" },
  { title: "Paramètres", href: "/dashboard/settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const supabase = createSupabaseClient();

  return (
    <div className="flex min-h-screen">
      <aside
        className={`sidebar transition-all duration-200 ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="sidebar-header">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xl"
            style={{ color: "var(--color-primary)" }}
          >
            <span>🛍️</span>
            {sidebarOpen && <span>BamanaShop Admin</span>}
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
              {sidebarOpen && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="header">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost lg:hidden"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </header>
        <main className="main flex-1">{children}</main>
      </div>
    </div>
  );
}
