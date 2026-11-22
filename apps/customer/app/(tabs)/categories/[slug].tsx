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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "@/navigation/compat";
import { fetchCategoryWithProducts, Category, Product } from "@/api";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

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

const categoryLabels: Record<string, string> = {
  alimentation: "Alimentation",
  electronique: "Électronique",
  mode: "Mode & Accessoires",
  maison: "Maison & Jardin",
  sante: "Santé & Beauté",
  sport: "Sport & Loisirs",
  beaute: "Beauté",
  auto: "Auto & Moto",
};

export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchCategoryWithProducts(slug);
      setCategory(data.category);
      setProducts(data.products);
    } catch (error) {
      console.error("Failed to load category:", error);
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
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SemanticColors.primaryAction} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning" size={48} color={SemanticColors.textTertiary} />
        <Text style={styles.emptyTitle}>Catégorie introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = categoryLabels[category.slug]
    ? SemanticColors.primaryAction
    : SemanticColors.primaryAction;

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
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderTop}>
          <View
            style={[
              styles.categoryHeaderIcon,
              { backgroundColor: `${SemanticColors.primaryAction}15` },
            ]}
          >
            <Ionicons
              name={categoryIcons[category.slug] ?? "cube"}
              size={28}
              color={SemanticColors.primaryAction}
            />
          </View>
          <View style={styles.categoryHeaderInfo}>
            <Text style={styles.categoryHeaderTitle}>{category.name}</Text>
            <Text style={styles.categoryHeaderSubtitle}>
              {category.description ?? "Découvrez nos produits"}
            </Text>
          </View>
        </View>
      </View>

      {/* Products */}
      <View style={styles.productsSection}>
        <View style={styles.productsHeader}>
          <Text style={styles.productsTitle}>
            {products.length} produit{products.length > 1 ? "s" : ""}
          </Text>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube" size={48} color={SemanticColors.textTertiary} />
            <Text style={styles.emptyProductsTitle}>Aucun produit</Text>
            <Text style={styles.emptyProductsSubtitle}>
              Cette catégorie est vide pour le moment
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
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
                    <Ionicons name="image" size={32} color={SemanticColors.textTertiary} />
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
                      {item.price_gnf.toLocaleString("fr-FR")} GNF
                    </Text>
                    {item.compare_at_price_gnf && (
                      <Text style={styles.productOldPrice}>
                        {item.compare_at_price_gnf.toLocaleString("fr-FR")} GNF
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

// Need to import Image at the top
import { Image } from "react-native";

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
  categoryHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderDefault,
  },
  categoryHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  categoryHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryHeaderInfo: { flex: 1 },
  categoryHeaderTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
  categoryHeaderSubtitle: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
  productsSection: { padding: Spacing.md },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  productsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
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
  emptyProductsSubtitle: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.xs,
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
});