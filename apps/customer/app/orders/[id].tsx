"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "@/navigation/compat";
import { fetchOrder, Order, OrderStatus, DeliveryStatus } from "@/api";
import { formatGnf, GnfAmount } from "@bamanashop/contracts";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "En attente", color: "#F59E0B", icon: "time" },
  confirmed: { label: "Confirmée", color: "#3B82F6", icon: "checkmark-circle" },
  preparing: { label: "En préparation", color: "#8B5CF6", icon: "construct" },
  ready_for_pickup: { label: "Prête pour retrait", color: "#06B6D4", icon: "bag-handle" },
  in_transit: { label: "En livraison", color: "#3B82F6", icon: "bicycle" },
  delivered: { label: "Livrée", color: "#16A34A", icon: "checkmark-done" },
  cancelled: { label: "Annulée", color: "#DC2626", icon: "close-circle" },
  returned: { label: "Retournée", color: "#64748B", icon: "return-up-back" },
};

const deliveryStatusConfig: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
  unassigned: { label: "Non assignée", color: "#94A3B8", icon: "help-circle" },
  assigned: { label: "Assignée", color: "#3B82F6", icon: "person-add" },
  accepted: { label: "Acceptée", color: "#8B5CF6", icon: "checkmark-circle" },
  picked_up: { label: "Récupérée", color: "#06B6D4", icon: "bag-handle" },
  in_transit: { label: "En transit", color: "#3B82F6", icon: "bicycle" },
  delivered: { label: "Livrée", color: "#16A34A", icon: "checkmark-done" },
  failed: { label: "Échec", color: "#DC2626", icon: "close-circle" },
  returned: { label: "Retournée", color: "#64748B", icon: "return-up-back" },
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      const data = await fetchOrder(id);
      setOrder(data);
    } catch (error) {
      console.error("Failed to load order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order || order.status === "cancelled" || order.status === "delivered") return;

    Alert.alert(
      "Annuler la commande",
      "Êtes-vous sûr de vouloir annuler cette commande ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          onPress: async () => {
            setCancelling(true);
            try {
              // In real app, call cancel API
              // await cancelOrder(id, "Client a annulé");
              Alert.alert("Annulée", "La commande a été annulée");
              router.back();
            } catch {
              Alert.alert("Erreur", "Impossible d'annuler");
            } finally {
              setCancelling(false);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning" size={48} color={SemanticColors.textTertiary} />
        <Text style={styles.emptyTitle}>Commande introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusConfig = (status: OrderStatus) => statusConfig[status];
  const getDeliveryConfig = (status: DeliveryStatus) => deliveryStatusConfig[status];

  const timeline = [
    { key: "pending", label: "Commandée", time: order.created_at, completed: true },
    { key: "confirmed", label: "Confirmée", time: order.prepared_at, completed: order.status !== "pending" },
    { key: "preparing", label: "En préparation", time: order.prepared_at, completed: ["confirmed", "preparing", "ready_for_pickup", "in_transit", "delivered"].includes(order.status) },
    { key: "ready_for_pickup", label: "Prête", time: order.ready_for_pickup_at, completed: ["ready_for_pickup", "in_transit", "delivered"].includes(order.status) },
    { key: "in_transit", label: "En livraison", time: order.picked_up_at, completed: ["in_transit", "delivered"].includes(order.status) },
    { key: "delivered", label: "Livrée", time: order.delivered_at, completed: order.status === "delivered" },
  ];

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusRow}>
          <Text style={styles.orderNumber}>Commande #{order.id.slice(0, 8).toUpperCase()}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusConfig(order.status).color}15` },
            ]}
          >
            <Ionicons
              name={getStatusConfig(order.status).icon}
              size={14}
              color={getStatusConfig(order.status).color}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: getStatusConfig(order.status).color },
              ]}
            >
              {getStatusConfig(order.status).label}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {timeline.map((step) => (
            <View key={step.key} style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View
                style={[
                  styles.timelineDot,
                  step.completed && { backgroundColor: SemanticColors.success },
                  step.key === order.status && { backgroundColor: SemanticColors.primaryAction },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineLabel,
                    step.completed && { color: SemanticColors.textPrimary },
                    step.key === order.status && {
                      color: SemanticColors.primaryAction,
                      fontWeight: FontWeight.bold,
                    },
                  ]}
                >
                  {step.label}
                </Text>
                {step.time && step.completed && (
                  <Text style={styles.timelineTime}>
                    {new Date(step.time).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        <FlatList
          data={order.order_items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              {item.product?.images?.[0] ? (
                <Image
                  source={{ uri: item.product.images[0] }}
                  style={styles.orderItemImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.orderItemImagePlaceholder}>
                  <Ionicons name="image" size={24} color={SemanticColors.textTertiary} />
                </View>
              )}
              <View style={styles.orderItemDetails} style={{ flex: 1 }}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.product?.name ?? item.product_name}
                </Text>
                <Text style={styles.orderItemQty}>Quantité: {item.quantity}</Text>
                <Text style={styles.orderItemPrice}>
                  {formatGnf(item.unit_price_gnf as unknown as GnfAmount)} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.orderItemTotal}>
                {formatGnf(item.line_total_gnf as unknown as GnfAmount)}
              </Text>
            </View>
          )}
          listKey="orderItems"
        />
      </View>

      {/* Delivery Info */}
      {order.delivery_jobs?.[0] && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraison</Text>
          <TouchableOpacity style={styles.deliveryCard} onPress={() => router.push(`/orders/${id}/tracking`)}>
            <View style={styles.deliveryCardRow}>
              <View style={styles.deliveryIcon}>
                <Ionicons name="truck" size={20} color={SemanticColors.primaryAction} />
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Statut de livraison</Text>
                <View style={[
                  styles.deliveryStatusBadge,
                  { backgroundColor: `${getDeliveryConfig(order.delivery_status).color}15` },
                ]}>
                  <Ionicons
                    name={getDeliveryConfig(order.delivery_status).icon}
                    size={12}
                    color={getDeliveryConfig(order.delivery_status).color}
                  />
                  <Text
                    style={[
                      styles.deliveryStatusText,
                      { color: getDeliveryConfig(order.delivery_status).color },
                    ]}
                  >
                    {getDeliveryConfig(order.delivery_status).label}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={SemanticColors.textTertiary} />
            </View>
            {order.delivery_jobs[0].courier && (
              <View style={styles.courierInfo}>
                <Ionicons name="person" size={16} color={SemanticColors.textSecondary} />
                <Text style={styles.courierName}>
                  Livreur: {order.delivery_jobs[0].courier.user?.full_name ?? "Assigné"}
                </Text>
                {order.delivery_jobs[0].courier.phone && (
                  <Text style={styles.courierPhone}>
                    {order.delivery_jobs[0].courier.user?.phone}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adresse de livraison</Text>
        <View style={styles.addressCard}>
          {order.delivery_address_snapshot.landmark && (
            <Text style={styles.addressLine}>
              {order.delivery_address_snapshot.landmark}
            </Text>
          )}
          <Text style={styles.addressLine}>
            {order.delivery_address_snapshot.quarter}, {order.delivery_address_snapshot.commune}
          </Text>
          <Text style={styles.addressPhone}>
            {order.delivery_address_snapshot.phone}
          </Text>
          {order.delivery_address_snapshot.instructions && (
            <Text style={styles.addressInstructions}>
              {order.delivery_address_snapshot.instructions}
            </Text>
          )}
        </View>
      </View>

      {/* Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paiement</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={order.payment_method === "cod" ? "cash" : "card"}
                size={20}
                color={SemanticColors.primaryAction}
              />
              <Text style={styles.paymentMethodText}>
                {order.payment_method === "cod" ? "Paiement à la livraison" : "Orange Money"}
              </Text>
            </View>
            <View
              style={[
                styles.paymentStatusBadge,
                {
                  backgroundColor:
                    order.payment_status === "paid"
                      ? `${SemanticColors.success}15`
                      : order.payment_status === "failed"
                      ? `${SemanticColors.error}15`
                      : `${SemanticColors.warning}15`,
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentStatusText,
                  {
                    color:
                      order.payment_status === "paid"
                        ? SemanticColors.success
                        : order.payment_status === "failed"
                        ? SemanticColors.error
                        : SemanticColors.warning,
                  },
                ]}
              >
                {order.payment_status === "paid"
                  ? "Payé"
                  : order.payment_status === "failed"
                  ? "Échoué"
                  : "En attente"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail des prix</Text>
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Sous-total</Text>
            <Text style={styles.priceValue}>
              {formatGnf(order.subtotal_gnf as unknown as GnfAmount)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frais de livraison</Text>
            <Text style={styles.priceValue}>
              {formatGnf(order.delivery_fee_gnf as unknown as GnfAmount)}
            </Text>
          </View>
          {order.payment_fee_gnf > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de paiement</Text>
              <Text style={styles.priceValue}>
                {formatGnf(order.payment_fee_gnf as unknown as GnfAmount)}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.priceTotal]}>
            <Text style={[styles.priceLabel, styles.priceTotalLabel]}>Total</Text>
            <Text style={[styles.priceValue, styles.priceTotalValue]}>
              {formatGnf(order.total_gnf as unknown as GnfAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {["pending", "confirmed", "preparing"].includes(order.status) && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={cancelling}>
          {cancelling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.cancelButtonText}>Annuler la commande</Text>
          )}
        </TouchableOpacity>
      )}

      {order.status === "delivered" && (
        <TouchableOpacity style={styles.reorderButton} onPress={() => Alert.alert("Récommander", "Fonctionnalité bientôt disponible")}>
          <Text style={styles.reorderButtonText}>Recommander</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: Spacing.xl },
  statusHeader: {
    backgroundColor: SemanticColors.cardBackground,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderDefault,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  orderNumber: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
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
  timeline: { gap: Spacing.md },
  timelineItem: { flexDirection: "row", gap: Spacing.md },
  timelineLine: {
    width: 2,
    height: "100%",
    backgroundColor: SemanticColors.borderDefault,
    marginTop: 8,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SemanticColors.borderDefault,
    marginTop: 2,
    flexShrink: 0,
  },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineLabel: { fontSize: FontSize.sm, color: SemanticColors.textSecondary },
  timelineTime: { fontSize: FontSize.xs, color: SemanticColors.textTertiary, marginTop: 2 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.md,
  },
  orderItem: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderDefault,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  orderItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemDetails: { flex: 1, justifyContent: "center" },
  orderItemName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: SemanticColors.textPrimary },
  orderItemQty: { fontSize: FontSize.xs, color: SemanticColors.textTertiary, marginTop: 2 },
  orderItemPrice: { fontSize: FontSize.xs, color: SemanticColors.textSecondary, marginTop: 2 },
  orderItemTotal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  deliveryCard: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  deliveryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  deliveryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: SemanticColors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryInfo: { flex: 1 },
  deliveryLabel: { fontSize: FontSize.xs, color: SemanticColors.textTertiary, textTransform: "uppercase" },
  deliveryStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.badge,
  },
  deliveryStatusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  courierInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: SemanticColors.borderDefault,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  courierName: { fontSize: FontSize.sm, color: SemanticColors.textPrimary },
  courierPhone: { fontSize: FontSize.xs, color: SemanticColors.textSecondary },
  addressCard: {
    backgroundColor: SemanticColors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  addressLine: { fontSize: FontSize.base, color: SemanticColors.textPrimary },
  addressPhone: { fontSize: FontSize.sm, color: SemanticColors.textSecondary, marginTop: 2 },
  addressInstructions: { fontSize: FontSize.sm, color: SemanticColors.textTertiary, marginTop: Spacing.sm, fontStyle: "italic" },
  paymentCard: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentMethod: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  paymentMethodText: { fontSize: FontSize.base, color: SemanticColors.textPrimary },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },
  paymentStatusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  priceBreakdown: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.xs },
  priceLabel: { fontSize: FontSize.base, color: SemanticColors.textSecondary },
  priceValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: SemanticColors.textPrimary },
  priceTotal: { borderTopWidth: 1, borderTopColor: SemanticColors.borderDefault, marginTop: Spacing.sm, paddingTop: Spacing.md },
  priceTotalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: SemanticColors.textPrimary },
  priceTotalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: SemanticColors.primaryAction },
  cancelButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: SemanticColors.errorBackground,
    borderWidth: 1,
    borderColor: SemanticColors.error,
    borderRadius: BorderRadius.button,
    alignItems: "center",
  },
  cancelButtonText: { color: SemanticColors.error, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  reorderButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
    alignItems: "center",
  },
  reorderButtonText: { color: SemanticColors.primaryAction, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
});