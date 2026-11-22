"use client";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { useAuthStore } from "@/store/authStore";
import { formatGnf } from "@bamanashop/domain";

import { GnfAmount } from "@bamanashop/contracts";

const mockMissions = [
  {
    id: "DEL-001",
    orderId: "ORD-20261119-001",
    store: "Boutique Aissata",
    customer: "Mamadou D.",
    pickup: "Dixinn, Donka",
    dropoff: "Matam, Hamdallaye",
    status: "assigned",
    distance: "4.2 km",
    fee: 7000 as GnfAmount,
    codAmount: 85000 as GnfAmount,
    assignedAt: "08:45",
  },
  {
    id: "DEL-002",
    orderId: "ORD-20261119-002",
    store: "Tech Store Conakry",
    customer: "Fatou B.",
    pickup: "Kaloum, Centre",
    dropoff: "Ratoma, Kipé",
    status: "assigned",
    distance: "6.8 km",
    fee: 9800 as GnfAmount,
    codAmount: 1250000 as GnfAmount,
    assignedAt: "09:12",
  },
  {
    id: "DEL-003",
    orderId: "ORD-20261119-003",
    store: "Mode Africaine",
    customer: "Ibrahima K.",
    pickup: "Kaloum, Marché",
    dropoff: "Ratoma, Cosa",
    status: "accepted",
    distance: "3.1 km",
    fee: 6100 as GnfAmount,
    codAmount: 45000 as GnfAmount,
    assignedAt: "09:30",
  },
];

export default function CourierMissionsScreen() {
  const router = useRouter();
  const { courierProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "#F59E0B";
      case "accepted":
        return "#2563EB";
      case "picked_up":
        return "#10B981";
      case "in_transit":
        return "#8B5CF6";
      case "delivered":
        return "#059669";
      case "failed":
        return "#DC2626";
      default:
        return "#64748B";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assignée";
      case "accepted":
        return "Acceptée";
      case "picked_up":
        return "Collectée";
      case "in_transit":
        return "En route";
      case "delivered":
        return "Livrée";
      case "failed":
        return "Échec";
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.courierInfo}>
          <Text style={styles.courierName}>
            {courierProfile
              ? `Livreur: ${courierProfile.vehicle_type ?? "Moto"}`
              : "Livreur"}
          </Text>
          <Text style={styles.courierStatus}>
            Statut: <Text style={styles.statusActive}>Actif</Text>
          </Text>
        </View>
        <View style={styles.earningsSummary}>
          <Text style={styles.earningsLabel}>Gains aujourd'hui</Text>
          <Text style={styles.earningsAmount}>
            {formatGnf(24500 as GnfAmount)}
          </Text>
        </View>
      </View>

      <FlatList
        data={mockMissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.missionCard}
            onPress={() => router.push(`/(courier)/missions/${item.id}`)}
          >
            <View style={styles.missionHeader}>
              <View style={styles.missionId}>
                <Text style={styles.missionIdText}>{item.id}</Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.missionRoute}>
              <View style={styles.routePoint}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#2563EB" }]}
                />
                <View style={styles.routeLine} />
                <View
                  style={[styles.routeDot, { backgroundColor: "#10B981" }]}
                />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeLabel}>1. {item.pickup}</Text>
                <Text style={styles.routeLabel}>{item.store}</Text>
                <Text style={styles.routeLabel}>2. {item.dropoff}</Text>
                <Text style={styles.routeLabel}>{item.customer}</Text>
              </View>
            </View>

            <View style={styles.missionDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="navigate" size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{item.distance}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash" size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{formatGnf(item.fee)}</Text>
              </View>
              {item.codAmount > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="card" size={16} color="#94A3B8" />
                  <Text style={[styles.detailText, { color: "#F59E0B" }]}>
                    COD: {formatGnf(item.codAmount)}
                  </Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{item.assignedAt}</Text>
              </View>
            </View>

            <View style={styles.missionActions}>
              {item.status === "assigned" && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={(e) => {
                    e.stopPropagation(); /* Accept mission */
                  }}
                >
                  <Text style={styles.actionBtnText}>Accepter</Text>
                </TouchableOpacity>
              )}
              {item.status === "accepted" && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={(e) => {
                    e.stopPropagation(); /* Start pickup */
                  }}
                >
                  <Text style={styles.actionBtnText}>Collecter</Text>
                </TouchableOpacity>
              )}
              {item.status === "picked_up" && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={(e) => {
                    e.stopPropagation(); /* Start delivery */
                  }}
                >
                  <Text style={styles.actionBtnText}>Livrer</Text>
                </TouchableOpacity>
              )}
              {item.status === "in_transit" && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={(e) => {
                    e.stopPropagation(); /* Complete delivery */
                  }}
                >
                  <Text style={styles.actionBtnText}>Confirmer livraison</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyText}>Aucune mission assignée</Text>
            <Text style={styles.emptySubtext}>
              Les nouvelles missions apparaîtront ici
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

import { useState } from "react";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courierInfo: {},
  courierName: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  courierStatus: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusActive: { color: "#10B981", fontWeight: "600" },
  earningsSummary: { alignItems: "flex-end" },
  earningsLabel: { fontSize: 11, color: "#94A3B8", textTransform: "uppercase" },
  earningsAmount: { fontSize: 18, fontWeight: "700", color: "#059669" },
  listContent: { padding: 16, paddingBottom: 100 },
  missionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  missionId: { flexDirection: "row", alignItems: "center", gap: 8 },
  missionIdText: {
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
    color: "#2563EB",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  missionRoute: { marginBottom: 12, flexDirection: "row" },
  routePoint: { width: 20, alignItems: "center" },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  routeLine: { width: 2, height: 24, backgroundColor: "#E2E8F0" },
  routeLabels: { flex: 1, marginLeft: 8 },
  routeLabel: { fontSize: 12, color: "#475569", marginBottom: 2 },
  missionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 11, color: "#64748B" },
  missionActions: { flexDirection: "row", gap: 8 },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  actionBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 12,
  },
  emptySubtext: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
});
