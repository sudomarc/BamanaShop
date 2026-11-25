"use client";

import { useEffect, useRef, useState } from "react";
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
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  fetchAddresses,
  createOrder,
  fetchDeliveryPartners,
  fetchStore,
} from "@/api";
import { isSupabaseConfigured } from "@/utils/supabase";
import { calculateOrderTotals } from "@bamanashop/domain";
import { GnfAmount, PaymentMethod } from "@bamanashop/contracts";
import { formatGnf } from "@bamanashop/domain";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, updateQuantity, clearCart, getCheckoutKey } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [addresses, setAddresses] = useState<
    Array<{
      id: string;
      label: string;
      commune: string;
      quartier: string;
      landmark: string | null | undefined;
      street_details: string | null | undefined;
      phone: string;
      instructions: string | null | undefined;
    }>
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const totalsRequestId = useRef(0);
  const [totals, setTotals] = useState<{
    subtotal: GnfAmount;
    deliveryFee: GnfAmount;
    paymentFee: GnfAmount;
    total: GnfAmount;
    commission: GnfAmount;
    courierCost: GnfAmount;
    sellerPayable: GnfAmount;
  } | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (items.length > 0 && addresses.length > 0 && selectedAddressId) {
      calculateTotals();
    } else {
      totalsRequestId.current += 1;
      setTotals(null);
    }

    return () => {
      totalsRequestId.current += 1;
    };
  }, [items, paymentMethod, addresses, selectedAddressId]);

  const loadAddresses = async () => {
    try {
      const addresses = await fetchAddresses();
      setAddresses(
        addresses.map((a) => ({
          id: a.id,
          label: a.label ?? "",
          commune: a.commune,
          quartier: a.quartier,
          landmark: a.landmark,
          street_details: a.street_details,
          phone: a.phone,
          instructions: a.instructions,
        })),
      );
      setSelectedAddressId(
        addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "",
      );
    } catch {
      Alert.alert("Erreur", "Impossible de charger les adresses");
    }
  };

  const calculateTotals = async () => {
    if (items.length === 0) return;

    const requestId = ++totalsRequestId.current;
    setTotals(null);

    try {
      // Get store from first item's product
      const storeId = items[0].product.store_id;
      const [store, partners] = await Promise.all([
        fetchStore(storeId),
        fetchDeliveryPartners(),
      ]);

      if (!store) throw new Error("Store not found");
      if (partners.length === 0) throw new Error("No active delivery partners");

      const deliveryAddress = addresses.find(
        (address) => address.id === selectedAddressId,
      );
      if (!deliveryAddress) throw new Error("Delivery address not found");

      // Match the server: only partners covering this commune are eligible.
      const eligiblePartners = partners.filter(
        (candidate) =>
          candidate.coverage_zones.length === 0 ||
          candidate.coverage_zones.some(
            (zone) =>
              zone.trim().toLocaleLowerCase() ===
              deliveryAddress.commune.trim().toLocaleLowerCase(),
          ),
      );
      if (eligiblePartners.length === 0) {
        throw new Error("Aucun partenaire ne dessert cette commune.");
      }

      // Match the server tariff selection: lowest base + COD handling fee,
      // then stable partner ID ordering for deterministic ties.
      const partner = [...eligiblePartners].sort(
        (a, b) =>
          a.base_fee_gnf +
          a.cod_handling_fee_gnf -
          (b.base_fee_gnf + b.cod_handling_fee_gnf) ||
          a.id.localeCompare(b.id),
      )[0];

      // Routing is not integrated yet; the server uses a zero-distance estimate.
      const distanceKm = 0;

      const result = await calculateOrderTotals({
        items: items.map((i) => ({
          unitPrice: i.product.price_gnf,
          quantity: i.quantity,
        })),
        store,
        partner,
        distanceKm,
        paymentMethod,
        commissionRules: [],
        categoryId: items[0].product.category_id,
      });
      if (requestId === totalsRequestId.current) {
        setTotals(result);
      }
    } catch (error) {
      if (requestId === totalsRequestId.current) {
        console.error("Calculate totals error:", error);
        Alert.alert("Erreur", "Impossible de calculer les totaux");
      }
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
    if (
      items.some((item) => item.product.store_id !== items[0].product.store_id)
    ) {
      Alert.alert(
        "Panier invalide",
        "Une commande doit concerner une seule boutique. Retirez les produits d'autres boutiques avant de continuer.",
      );
      return;
    }
    if (!selectedAddressId) {
      Alert.alert("Adresse requise", "Sélectionnez une adresse de livraison");
      return;
    }
    if (!totals) {
      Alert.alert(
        "Récapitulatif indisponible",
        "Attendez le recalcul du total avant de confirmer la commande.",
      );
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        Alert.alert(
          "Backend non configuré",
          "Cette commande ne peut pas être créée : les variables d'environnement Supabase (SUPABASE_URL / SUPABASE_ANON_KEY) sont manquantes. BamanaShop ne simule aucun succès de commande sans backend réel.",
        );
        return;
      }

      if (!addresses.some((address) => address.id === selectedAddressId)) {
        throw new Error("Adresse de livraison introuvable");
      }

      const checkoutItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        expectedUnitPrice: item.product.price_gnf,
      }));
      const expectedDeliveryFee = totals.deliveryFee;
      const checkoutContext = JSON.stringify({
        storeId: items[0].product.store_id,
        items: checkoutItems,
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        expectedDeliveryFee,
      });
      const idempotencyKey = getCheckoutKey(checkoutContext);

      const order = await createOrder({
        storeId: items[0].product.store_id,
        items: checkoutItems,
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        expectedDeliveryFee,
        idempotencyKey,
      });

      const currentItems = useCartStore.getState().items;
      const cartUnchanged =
        currentItems.length === checkoutItems.length &&
        checkoutItems.every((checkoutItem, index) => {
          const currentItem = currentItems[index];
          return (
            currentItem?.product.id === checkoutItem.productId &&
            currentItem.quantity === checkoutItem.quantity &&
            currentItem.product.price_gnf === checkoutItem.expectedUnitPrice
          );
        });

      if (cartUnchanged) clearCart();
      router.push(`/orders/${order.id}`);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de créer la commande",
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cart-outline"
          size={64}
          color={SemanticColors.textTertiary}
        />
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
            <View style={styles.productImagePlaceholder}>
              <Ionicons
                name="image"
                size={32}
                color={SemanticColors.textTertiary}
              />
            </View>
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
                disabled={loading}
                onPress={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={SemanticColors.primaryAction}
                />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                disabled={loading}
                onPress={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={SemanticColors.primaryAction}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
              disabled={loading}
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
          disabled
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
                Non disponible pour le moment
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
        disabled={loading || !totals}
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
  productName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
  },
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
  qtyButton: {
    padding: 12,
    backgroundColor: SemanticColors.backgroundSecondary,
  },
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
  addressOptionSelected: {
    borderColor: SemanticColors.primaryAction,
    backgroundColor: SemanticColors.primaryBackground,
  },
  addressOptionContent: { flex: 1 },
  addressLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
  },
  addressCommune: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
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
  paymentOptionSelected: {
    borderColor: SemanticColors.primaryAction,
    backgroundColor: SemanticColors.primaryBackground,
  },
  paymentOptionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  paymentOptionLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
  },
  paymentOptionDesc: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
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
  summaryLabel: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: SemanticColors.borderDefault,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  summaryTotalLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.primaryAction,
  },
  checkoutButton: {
    margin: Spacing.md,
    height: 56,
    borderRadius: BorderRadius.button,
    backgroundColor: SemanticColors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  buttonDisabled: { opacity: 0.6 },
});
