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
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "@/navigation/compat";
import { fetchStore, fetchStoreProducts, Store, Product } from "@/api";
import { formatGnf, GnfAmount } from "@bamanashop/contracts";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

export default function StoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [storeData, productsData] = await Promise.all([
        fetchStore(id),
        fetchStoreProducts(id),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load store:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="warning"
          size={48}
          color={SemanticColors.textTertiary}
        />
        <Text style={styles.emptyTitle}>Boutique introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = [...new Set(products.map((p) => p.category_id))];

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
      {/* Store Header */}
      <View style={styles.storeHeader}>
        {store.banner_url ? (
          <Image
            source={{ uri: store.banner_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons
              name="storefront"
              size={48}
              color={SemanticColors.textTertiary}
            />
          </View>
        )}
        <View style={styles.storeInfo}>
          {store.logo_url ? (
            <Image
              source={{ uri: store.logo_url }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons
                name="storefront"
                size={32}
                color={SemanticColors.textTertiary}
              />
            </View>
          )}
          <View style={styles.storeMeta}>
            <Text style={styles.storeName}>{store.name}</Text>
            <View style={styles.storeLocation}>
              <Ionicons
                name="location"
                size={14}
                color={SemanticColors.textTertiary}
              />
              <Text style={styles.storeLocationText}>
                {store.commune}, {store.quartier}
              </Text>
            </View>
            <View style={styles.storeRating}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.storeRatingText}>4.8</Text>
              <Text style={styles.storeReviews}>(124 avis)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Store Details */}
      <View style={styles.detailsSection}>
        {store.description && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Description</Text>
            <Text style={styles.detailText}>{store.description}</Text>
          </View>
        )}

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Informations</Text>
          <View style={styles.detailRow}>
            <Ionicons
              name="call"
              size={18}
              color={SemanticColors.primaryAction}
            />
            <Text style={styles.detailValue}>{store.phone}</Text>
          </View>
          {store.email && (
            <View style={styles.detailRow}>
              <Ionicons
                name="mail"
                size={18}
                color={SemanticColors.primaryAction}
              />
              <Text style={styles.detailValue}>{store.email}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons
              name="time"
              size={18}
              color={SemanticColors.primaryAction}
            />
            <Text style={styles.detailValue}>
              {Object.entries(store.opening_hours)
                .map(([day, hours]) => `${day}: ${hours}`)
                .join(" | ")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="location"
              size={18}
              color={SemanticColors.primaryAction}
            />
            <Text style={styles.detailValue}>
              {store.address_line}, {store.landmark ?? ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>
        {categories.map((catId) => (
          <TouchableOpacity
            key={catId}
            style={[
              styles.categoryChip,
              selectedCategory === catId && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(catId)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === catId && styles.categoryChipTextActive,
              ]}
            >
              Catégorie {catId.slice(0, 4)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>
          {filteredProducts.length} produit
          {filteredProducts.length > 1 ? "s" : ""}
        </Text>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons
              name="bag-handle-outline"
              size={48}
              color={SemanticColors.textTertiary}
            />
            <Text style={styles.emptyProductsTitle}>
              {selectedCategory
                ? "Aucun produit dans cette catégorie"
                : "Aucun produit disponible"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridWrapper}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                {item.images?.[0] ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons
                      name="image"
                      size={32}
                      color={SemanticColors.textTertiary}
                    />
                  </View>
                )}
                {item.is_featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>Vedette</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>
                      {formatGnf(item.price_gnf as unknown as GnfAmount)}
                    </Text>
                    {item.compare_at_price_gnf && (
                      <Text style={styles.productOldPrice}>
                        {formatGnf(
                          item.compare_at_price_gnf as unknown as GnfAmount,
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.gridContent}
          />
        )}
      </View>
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
  storeHeader: {
    height: 220,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: 180,
  },
  bannerPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    position: "absolute",
    bottom: -40,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  storeMeta: { flex: 1, marginTop: Spacing.sm },
  storeName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storeLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  storeLocationText: {
    fontSize: FontSize.sm,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  storeRatingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
  },
  storeReviews: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
  },
  detailsSection: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  detailCard: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  detailTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontSize: FontSize.base,
    color: SemanticColors.textPrimary,
    flex: 1,
  },
  categoryFilter: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.badge,
    backgroundColor: SemanticColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: SemanticColors.primaryAction,
    borderColor: SemanticColors.primaryAction,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
  },
  categoryChipTextActive: { color: "#FFFFFF" },
  productsSection: { paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.md,
  },
  gridWrapper: { gap: Spacing.md },
  gridContent: { paddingBottom: Spacing.md },
  productCard: {
    width: "48%",
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  productImage: {
    height: 120,
    width: "100%",
  },
  productImagePlaceholder: {
    height: 120,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    zIndex: 1,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
    backgroundColor: SemanticColors.primaryAction,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.badge,
  },
  productInfo: { padding: Spacing.sm },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
    marginBottom: 2,
  },
  productPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  productPrice: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: SemanticColors.primaryAction,
  },
  productOldPrice: {
    fontSize: FontSize.xs,
    color: SemanticColors.textTertiary,
    textDecorationLine: "line-through",
  },
  emptyProducts: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyProductsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginTop: Spacing.md,
  },
});
