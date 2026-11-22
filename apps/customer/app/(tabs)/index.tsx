"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { useCartStore } from "@/store/cartStore";
import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchFeaturedStores,
  Category,
  Product,
  Store,
} from "@/api";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [cats, products, stores] = await Promise.all([
        fetchCategories(),
        fetchFeaturedProducts(),
        fetchFeaturedStores(),
      ]);
      setCategories(cats);
      setFeaturedProducts(products);
      setFeaturedStores(stores);
    } catch (error) {
      console.error("Failed to load home data:", error);
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
  }, []);

  const cartCount = getTotalItems();

  const categoryIcons: Record<string, string> = {
    alimentation: "restaurant",
    electronique: "phone-portrait",
    mode: "shirt",
    maison: "home",
    sante: "medical",
    sport: "fitness",
    beaute: "sparkles",
    auto: "car",
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
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
      {/* Header with location and search */}
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={20}
            color={SemanticColors.primaryAction}
          />
          <Text style={styles.locationText}>Conakry, Matam</Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={SemanticColors.textTertiary}
          />
        </View>
        <Text style={styles.greeting}>Bonjour !</Text>
        <Text style={styles.subtitle}>Que cherchez-vous aujourd'hui ?</Text>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/search")}
      >
        <Ionicons
          name="search"
          size={22}
          color={SemanticColors.textTertiary}
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>
          Rechercher produits, boutiques...
        </Text>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => router.push("/(tabs)/categories")}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={SemanticColors.textTertiary}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/(tabs)/categories/${cat.slug}`)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={categoryIcons[cat.slug] ?? "cube"}
                  size={24}
                  color={SemanticColors.primaryAction}
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Stores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Boutiques en vedette</Text>
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => router.push("/(tabs)/stores")}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={SemanticColors.textTertiary}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storeList}
        >
          {featuredStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => router.push(`/store/${store.id}`)}
            >
              {store.logo_url ? (
                <Image
                  source={{ uri: store.logo_url }}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.storeImagePlaceholder}>
                  <Ionicons
                    name="storefront"
                    size={32}
                    color={SemanticColors.textTertiary}
                  />
                </View>
              )}
              <Text style={styles.storeName} numberOfLines={1}>
                {store.name}
              </Text>
              <Text style={styles.storeLocation}>
                {store.commune}, {store.quartier}
              </Text>
              <View style={styles.storeMeta}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.storeRating}>4.8</Text>
                <Text style={styles.storeDistance}>2.3 km</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produits recommandés</Text>
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={SemanticColors.textTertiary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productGrid}>
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              {product.images?.[0] ? (
                <Image
                  source={{ uri: product.images[0] }}
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
              {product.is_featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Vedette</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productStore}>Boutique Demo</Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>
                    {product.price_gnf.toLocaleString("fr-FR")} GNF
                  </Text>
                  {product.compare_at_price_gnf && (
                    <Text style={styles.productOldPrice}>
                      {product.compare_at_price_gnf.toLocaleString("fr-FR")} GNF
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cart Button (floating) */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: 100 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: SemanticColors.textPrimary,
  },
  greeting: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: SemanticColors.inputBackground,
    borderRadius: BorderRadius.input,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchPlaceholder: {
    fontSize: FontSize.base,
    color: SemanticColors.textPlaceholder,
    flex: 1,
  },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: {
    fontSize: FontSize.sm,
    color: SemanticColors.primaryAction,
    fontWeight: FontWeight.medium,
  },
  categoryList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  categoryCard: { alignItems: "center", width: 80 },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: SemanticColors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.xs,
    textAlign: "center",
    color: SemanticColors.textPrimary,
  },
  storeList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  storeCard: { width: 160, alignItems: "center" },
  storeImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  storeImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    backgroundColor: SemanticColors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  storeName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: "center",
    color: SemanticColors.textPrimary,
  },
  storeLocation: {
    fontSize: FontSize.xs,
    textAlign: "center",
    color: SemanticColors.textTertiary,
  },
  storeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  storeRating: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: "#F59E0B",
  },
  storeDistance: { fontSize: FontSize.xs, color: SemanticColors.textTertiary },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
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
  productStore: {
    fontSize: FontSize.xs,
    color: SemanticColors.textTertiary,
    marginBottom: 4,
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
  floatingCart: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SemanticColors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
});

// Import shadows
import { Shadows } from "@/constants/theme";
