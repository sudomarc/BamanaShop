"use client";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { useAuthStore } from "@/store/authStore";
import { formatGnf } from "@bamanashop/domain";

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { sellerProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - would come from API
  const stats = [
    {
      label: "Commandes aujourd'hui",
      value: "12",
      icon: "bag-handle",
      color: "#2563EB",
      trend: "+3",
    },
    {
      label: "En préparation",
      value: "5",
      icon: "time",
      color: "#F59E0B",
      trend: "—",
    },
    {
      label: "Prêt à collecter",
      value: "3",
      icon: "checkmark-circle",
      color: "#10B981",
      trend: "+1",
    },
    {
      label: "CA aujourd'hui",
      value: formatGnf(1250000),
      icon: "cash",
      color: "#059669",
      trend: "+12%",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-20261119-001",
      customer: "Mamadou D.",
      items: 3,
      amount: "85 000 GNF",
      status: "preparing",
      time: "08:32",
    },
    {
      id: "ORD-20261119-002",
      customer: "Fatou B.",
      items: 1,
      amount: "1 250 000 GNF",
      status: "confirmed",
      time: "08:15",
    },
    {
      id: "ORD-20261119-003",
      customer: "Ibrahima K.",
      items: 2,
      amount: "45 000 GNF",
      status: "preparing",
      time: "07:58",
    },
  ];

  const lowStockProducts = [
    {
      id: "p1111111-1111-1111-1111-111111111111",
      name: "Huile Végétale 1L",
      stock: 3,
      threshold: 10,
    },
    {
      id: "p4444444-4444-4444-4444-444444444444",
      name: "Sucre en Poudre 1kg",
      stock: 5,
      threshold: 20,
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2563EB"]}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>
            {sellerProfile?.business_name ?? "Ma Boutique"}
          </Text>
          <Text style={styles.storeStatus}>
            Statut: <Text style={styles.statusApproved}>Approuvée</Text>
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <TouchableOpacity
            key={stat.label}
            style={styles.statCard}
            onPress={() =>
              router.push(
                `/(seller)/${i === 0 ? "orders" : i === 3 ? "earnings" : "dashboard"}`,
              )
            }
          >
            <View style={styles.statIcon}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
            <Text style={styles.statTrend}>{stat.trend}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          <TouchableOpacity onPress={() => router.push("/(seller)/orders")}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/(seller)/orders/${order.id}`)}
          >
            <View style={styles.orderMain}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderCustomer}>
                  {order.customer} • {order.items} articles
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.amount}</Text>
                <View style={styleStatusBadge(order.status)}>
                  <Text style={styles.statusBadgeText}>
                    {order.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.orderTime}>{order.time}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {lowStockProducts.length > 0 && (
        <View style={[styles.section, styles.alertSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="alert-circle"
              size={20}
              color="#DC2626"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>
              Stock faible ({lowStockProducts.length})
            </Text>
          </View>
          {lowStockProducts.map((product) => (
            <View key={product.id} style={styles.lowStockItem}>
              <Text style={styles.lowStockName}>{product.name}</Text>
              <Text style={styles.lowStockQty}>
                Stock: {product.stock} / Seuil: {product.threshold}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push("/(seller)/products")}
          >
            <Text style={styles.viewAllBtnText}>Gérer les stocks</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// Helper for status badge styles
function styleStatusBadge(status: string) {
  const base = styles.statusBadge;
  switch (status) {
    case "confirmed":
      return [base, { backgroundColor: "#DBEAFE" }];
    case "preparing":
      return [base, { backgroundColor: "#FEF3C7" }];
    case "ready_for_pickup":
      return [base, { backgroundColor: "#D1FAE5" }];
    case "completed":
      return [base, { backgroundColor: "#D1FAE5" }];
    case "cancelled":
      return [base, { backgroundColor: "#FEE2E2" }];
    default:
      return base;
  }
}

import { useState } from "react";

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { paddingBottom: 100 },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  storeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storeName: { fontSize: 20, fontWeight: "700", color: "#1E293B" },
  storeStatus: { fontSize: 13, color: "#64748B" },
  statusApproved: { color: "#10B981", fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statContent: { flex: 1 },
  statLabel: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statTrend: { fontSize: 11, color: "#10B981", fontWeight: "600" },
  section: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  alertSection: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  seeAll: { fontSize: 13, color: "#2563EB", fontWeight: "500" },
  orderCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  orderMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "600",
    color: "#2563EB",
  },
  orderCustomer: { fontSize: 13, color: "#64748B", marginTop: 2 },
  orderRight: { alignItems: "flex-end" },
  orderAmount: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  orderTime: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
  lowStockItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  lowStockName: { fontSize: 13, fontWeight: "500", color: "#1E293B" },
  lowStockQty: { fontSize: 12, color: "#DC2626", marginTop: 2 },
  viewAllBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  viewAllBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
});
