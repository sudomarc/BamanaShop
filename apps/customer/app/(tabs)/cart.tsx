"use client";

import { useState, useEffect } from "react";
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
import { calculateOrderTotals } from "@bamanashop/domain";
import {
  formatGnf,
  GnfAmount,
  PaymentMethod,
  Product,
} from "@bamanashop/contracts";
import { MOCK_DELIVERY_PARTNER } from "@bamanashop/contracts";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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

  // Load cart from async storage or context
  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      calculateTotals();
    } else {
      setTotals(null);
    }
  }, [cartItems, paymentMethod, deliveryCommune]);

  const loadCart = async () => {
    // In real app, load from AsyncStorage or Zustand cart store
    // For now, use mock data
    if (cartItems.length === 0) {
      // Mock cart for demo
    }
  };

  const loadAddresses = async () => {
    const mockAddresses = [
      { id: "addr-1", label: "Domicile", commune: "Matam" },
      { id: "addr-2", label: "Travail", commune: "Kaloum" },
    ];
    setAddresses(mockAddresses);
    setSelectedAddressId("addr-1");
  };

  const calculateTotals = async () => {
    if (cartItems.length === 0) return;
    try {
      const mockStore = {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        commission_rate_bps: 1000,
      };
      const result = await calculateOrderTotals({
        items: cartItems.map((i) => ({
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

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i,
      );
    });
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
    if (cartItems.length === 0) {
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
      router.push("/(tabs)/orders");
    } catch {
      Alert.alert("Erreur", "Impossible de créer la commande");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#94A3B8" />
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
        data={cartItems}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.productInfo}>
              <View style={styles.productImage}>
                <Ionicons name="image" size={32} color="#94A3B8" />
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.productPrice}>
                  {formatGnf(item.product.price_gnf)}
                </Text>
              </View>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, -1)}
              >
                <Ionicons name="remove" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.product.id, 1)}
              >
                <Ionicons name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        listKey="cartItems"
      />

      <View style={styles.deliverySection}>
        <Text style={styles.sectionTitle}>Livraison</Text>
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
                <Text style={styles.addressCommune}>{addr.commune}</Text>
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
        <Text style={styles.sectionTitle}>Paiement</Text>
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
              color="#2563EB"
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
              Sous-total ({cartItems.reduce((s, i) => s + i.quantity, 0)}{" "}
              articles)
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

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  continueShoppingBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#2563EB",
    borderRadius: 12,
  },
  continueShoppingBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productInfo: { flexDirection: "row", flex: 1 },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  productDetails: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 14, fontWeight: "500", color: "#1E293B" },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyButton: { padding: 10, backgroundColor: "#F8FAFC" },
  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  deliverySection: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  addressSelector: { gap: 8 },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
  },
  addressOptionSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  addressOptionContent: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: "500", color: "#1E293B" },
  addressCommune: { fontSize: 12, color: "#64748B", marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    backgroundColor: "#2563EB",
    borderRadius: 5,
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentOptionSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  paymentOptionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  paymentOptionLabel: { fontSize: 14, fontWeight: "500", color: "#1E293B" },
  paymentOptionDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  summarySection: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 14, color: "#64748B" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
    paddingTop: 12,
  },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  summaryTotalValue: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  checkoutButton: {
    margin: 16,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
});
