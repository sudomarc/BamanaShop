"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { calculateOrderTotals } from "@bamanashop/domain";
import {
  formatGnf,
  GnfAmount,
  PaymentMethod,
  Product,
  DeliveryPartner,
} from "@bamanashop/contracts";
import { MOCK_DELIVERY_PARTNER } from "@bamanashop/contracts";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight, Shadows } from "@/constants/theme";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getStoreId } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [addresses, setAddresses] = useState<
    Array<{ id: string; label: string; commune: string }>
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<{
    subtotal: GnfAmount;
    deliveryFee: GnfAmount;
    paymentFee: GnfAmount;
    total: GnfAmount;
    commission: GnfAmount;
    courierCost: GnfAmount;
    sellerPayable: GnfAmount;
  } | null>(null);
  const [deliveryCommune, setDeliveryCommune] = useState("Matam");

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      calculateTotals();
    } else {
      setTotals(null);
    }
  }, [items, paymentMethod, deliveryCommune]);

  const loadAddresses = async () => {
    const mockAddresses = [
      { id: "addr-1", label: "Domicile", commune: "Matam", quartier: "Hamdallaye" },
      { id: "addr-2", label: "Travail", commune: "Kaloum", quartier: "Centre" },
    ];
    setAddresses(mockAddresses);
    setSelectedAddressId("addr-1");
  };

  const calculateTotals = async () => {
    if (items.length === 0) return;
    try {
      const mockStore = {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        commission_rate_bps: 1000,
      };
      const result = await calculateOrderTotals({
        items: items.map((i) => ({
          unitPrice: i.product.price_gnf,
          quantity: i.quantity,
        })),
        store: mockStore,
        partner: MOCK_DELIVERY_PARTNER,
        distanceKm: 5,
        paymentMethod,
        commissionRules: [],
        categoryId: "11111111-1111-1111-1111-111111111111",
      });
      setTotals(result);
    } catch {
      console.error("Calculate totals error");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Veuillez vous connecter pour commander",
      );
      router.push("/(auth)/login");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Panier vide", "Ajoutez des produits avant de commander");
      return;
    }
    if (!selectedAddressId) {
      Alert.alert("Adresse requise", "Sélectionnez une adresse de livraison");
      return;
    }

    setLoading(true);
    try {
      // Mock order creation
      await new Promise((r) => setTimeout(r, 1000));
      clearCart();
      router.push("/(tabs)/orders");
    } catch {
      Alert.alert("Erreur", "Impossible de créer la commande");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={SemanticColors.textTertiary} />
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtitle}>
          Ajoutez des produits pour commencer
        </Text>
        <TouchableOpacity
          style={styles.continueShoppingBtn}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.continueShoppingBtnText}>
            Continuer mes achats
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            {item.product.images?.[0] ? (
              <Image
                source={{ uri: item.product.images[0] }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image" size={32} color={SemanticColors.textTertiary} />
              </View>
            )}
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.productPrice}>
                {formatGnf(item.product.price_gnf)}
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, -1)}
              >
                <Ionicons name="remove" size={20} color={SemanticColors.primaryAction} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, 1)}
              >
                <Ionicons name="add" size={20} color={SemanticColors.primaryAction} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        listKey="cartItems"
      />

      <View style={styles.deliverySection}>
        <Text style={styles.sectionTitle}>Adresse de livraison</Text>
        <View style={styles.addressSelector}>
          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[
                styles.addressOption,
                selectedAddressId === addr.id && styles.addressOptionSelected,
              ]}
              onPress={() => setSelectedAddressId(addr.id)}
            >
              <View style={styles.addressOptionContent}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.addressCommune}>
                  {addr.quartier}, {addr.commune}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedAddressId === addr.id && styles.radioInner,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Méthode de paiement</Text>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "cod" && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod("cod")}
        >
          <View style={styles.paymentOptionContent}>
            <Ionicons
              name="cash"
              size={24}
              color={SemanticColors.primaryAction}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={styles.paymentOptionLabel}>
                Paiement à la livraison (COD)
              </Text>
              <Text style={styles.paymentOptionDesc}>
                Payez en espèces au livreur
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioOuter,
              paymentMethod === "cod" && styles.radioInner,
            ]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "orange_money" && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod("orange_money")}
        >
          <View style={styles.paymentOptionContent}>
            <Ionicons
              name="card"
              size={24}
              color="#F59E0B"
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={styles.paymentOptionLabel}>Orange Money</Text>
              <Text style={styles.paymentOptionDesc}>
                Paiement mobile (bientôt disponible)
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioOuter,
              paymentMethod === "orange_money" && styles.radioInner,
            ]}
          />
        </TouchableOpacity>
      </View>

      {totals && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Sous-total ({items.reduce((s, i) => s + i.quantity, 0)} articles)
            </Text>
            <Text style={styles.summaryValue}>
              {formatGnf(totals.subtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>
              {formatGnf(totals.deliveryFee)}
            </Text>
          </View>
          {totals.paymentFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de paiement</Text>
              <Text style={styles.summaryValue}>
                {formatGnf(totals.paymentFee)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={[styles.summaryLabel, styles.summaryTotalLabel]}>
              Total à payer
            </Text>
            <Text style={[styles.summaryValue, styles.summaryTotalValue]}>
              {formatGnf(totals.total)}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.checkoutButton, loading && styles.buttonDisabled]}
        onPress={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.checkoutButtonText}>
            Commander pour {totals ? formatGnf(totals.total) : "0 GNF"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Need to import Image
import { Image } from "react-native";

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  continueShoppingBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
  },
  continueShoppingBtnText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  productDetails: { flex: 1, justifyContent: "center" },
  productName: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: SemanticColors.textPrimary },
  productPrice: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.primaryAction,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  qtyButton: { padding: 12, backgroundColor: SemanticColors.backgroundSecondary },
  qtyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    minWidth: 28,
    textAlign: "center",
    color: SemanticColors.textPrimary,
  },
  deliverySection: {
    margin: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  paymentSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.md,
  },
  addressSelector: { gap: Spacing.sm },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
  },
  addressOptionSelected: { borderColor: SemanticColors.primaryAction, backgroundColor: SemanticColors.primaryBackground },
  addressOptionContent: { flex: 1 },
  addressLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: SemanticColors.textPrimary },
  addressCommune: { fontSize: FontSize.sm, color: SemanticColors.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: SemanticColors.borderDefault,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: 5,
    borderColor: SemanticColors.primaryAction,
    borderWidth: 2,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  paymentOptionSelected: { borderColor: SemanticColors.primaryAction, backgroundColor: SemanticColors.primaryBackground },
  paymentOptionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  paymentOptionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: SemanticColors.textPrimary },
  paymentOptionDesc: { fontSize: FontSize.sm, color: SemanticColors.textSecondary, marginTop: 2 },
  summarySection: {
    margin: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  summaryLabel: { fontSize: FontSize.base, color: SemanticColors.textSecondary },
  summaryValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: SemanticColors.textPrimary },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: SemanticColors.borderDefault,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  summaryTotalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: SemanticColors.textPrimary },
  summaryTotalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: SemanticColors.primaryAction },
  checkoutButton: {
    margin: Spacing.md,
    height: 56,
    borderRadius: BorderRadius.button,
    backgroundColor: SemanticColors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: { color: "#FFFFFF", fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  buttonDisabled: { opacity: 0.6 },
});