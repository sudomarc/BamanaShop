"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { fetchOrders, Order, OrderStatus } from "@/api";
import { formatGnf, GnfAmount } from "@bamanashop/contracts";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "En attente", color: "#F59E0B", icon: "time" },
  confirmed: { label: "Confirmée", color: "#3B82F6", icon: "checkmark-circle" },
  preparing: { label: "En préparation", color: "#8B5CF6", icon: "construct" },
  ready_for_pickup: { label: "Prête", color: "#06B6D4", icon: "bag-handle" },
  in_transit: { label: "En livraison", color: "#3B82F6", icon: "bicycle" },
  delivered: { label: "Livrée", color: "#16A34A", icon: "checkmark-done" },
  cancelled: { label: "Annulée", color: "#DC2626", icon: "close-circle" },
  returned: { label: "Retournée", color: "#64748B", icon: "return-up-back" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "active") {
      return !["delivered", "cancelled", "returned"].includes(order.status);
    }
    return ["delivered", "cancelled", "returned"].includes(order.status);
  });

  const getStatusConfig = (status: OrderStatus) => statusConfig[status];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed" size={48} color={SemanticColors.textTertiary} />
        <Text style={styles.emptyTitle}>Connexion requise</Text>
        <Text style={styles.emptySubtitle}>
          Connectez-vous pour voir vos commandes
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[SemanticColors.primaryAction]}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "active" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === "active" && styles.tabButtonTextActive,
          ]}>
            En cours ({filteredOrders.filter(o => !["delivered", "cancelled", "returned"].includes(o.status)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "past" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === "past" && styles.tabButtonTextActive,
          ]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === "active" ? "bag-handle-outline" : "time-outline"}
            size={48}
            color={SemanticColors.textTertiary}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === "active" ? "Aucune commande en cours" : "Aucun historique"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "active"
              ? "Vos commandes en cours apparaîtront ici"
              : "Vos anciennes commandes apparaîtront ici"}
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.shopButtonText}>Faire mes courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${item.id}`)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>Commande #{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={styles.orderStatusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusConfig(item.status).color}15` },
                    ]}
                  >
                    <Ionicons
                      name={getStatusConfig(item.status).icon}
                      size={14}
                      color={getStatusConfig(item.status).color}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusConfig(item.status).color },
                      ]}
                    >
                      {getStatusConfig(item.status).label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.orderStore}>
                <Ionicons name="storefront" size={16} color={SemanticColors.textSecondary} />
                <Text style={styles.orderStoreName}>Boutique Demo Conakry</Text>
              </View>

              <View style={styles.orderItems}>
                {item.order_items?.slice(0, 2).map((oi: any, idx: number) => (
                  <View key={idx} style={styles.orderItemRow}>
                    <Text style={styles.orderItemName} numberOfLines={1}>
                      {oi.product?.name ?? oi.product_name}
                    </Text>
                    <Text style={styles.orderItemQty}>x{oi.quantity}</Text>
                  </View>
                ))}
                {(item.order_items?.length ?? 0) > 2 && (
                  <Text style={styles.orderItemMore}>
                    +{(item.order_items.length - 2)} autre{item.order_items.length > 3 ? "s" : ""}
                  </Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotalLabel}>Total</Text>
                <Text style={styles.orderTotal}>
                  {formatGnf(item.total_gnf as unknown as GnfAmount)}
                </Text>
              </View>

              {item.status === "in_transit" && (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/orders/${item.id}`);
                  }}
                >
                  <Ionicons name="map" size={16} color={SemanticColors.primaryAction} />
                  <Text style={styles.trackButtonText}>Suivre la livraison</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: Spacing.xl },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: SemanticColors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    margin: Spacing.md,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: SemanticColors.cardBackground,
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textSecondary,
  },
  tabButtonTextActive: {
    color: SemanticColors.primaryAction,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  loginButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  shopButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
  },
  shopButtonText: {
    color: SemanticColors.primaryAction,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  orderCard: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  orderInfo: { flex: 1 },
  orderNumber: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  orderDate: {
    fontSize: FontSize.xs,
    color: SemanticColors.textTertiary,
    marginTop: 2,
  },
  orderStatusContainer: { alignItems: "flex-end" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  orderStore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  orderStoreName: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
  },
  orderItems: { marginBottom: Spacing.sm, gap: 4 },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderItemName: {
    fontSize: FontSize.sm,
    color: SemanticColors.textPrimary,
    flex: 1,
  },
  orderItemQty: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
  },
  orderItemMore: {
    fontSize: FontSize.xs,
    color: SemanticColors.textTertiary,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: SemanticColors.borderDefault,
    marginTop: Spacing.sm,
  },
  orderTotalLabel: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
  },
  orderTotal: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: SemanticColors.primaryAction,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: SemanticColors.primaryBackground,
    borderRadius: BorderRadius.md,
  },
  trackButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: SemanticColors.primaryAction,
  },
});

// Import Shadows
import { Shadows } from "@/constants/theme";