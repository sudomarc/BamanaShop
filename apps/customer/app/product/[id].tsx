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
  Image,
  FlatList,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "@/navigation/compat";
import { useCartStore } from "@/store/cartStore";
import { fetchProduct, fetchProductImages, Product } from "@/api";
import { GnfAmount } from "@bamanashop/contracts";
import { formatGnf } from "@bamanashop/domain";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const loadData = async () => {
    try {
      const [prod, imgs] = await Promise.all([
        fetchProduct(id),
        fetchProductImages(id),
      ]);
      setProduct(prod);
      setImages(imgs);
    } catch (error) {
      console.error("Failed to load product:", error);
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

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    Alert.alert(
      "Ajouté au panier",
      `${product.name} x${quantity} ajouté à votre panier`,
      [
        { text: "Continuer mes achats", style: "cancel" },
        { text: "Voir le panier", onPress: () => router.push("/(tabs)/cart") },
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

  if (!product) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="warning"
          size={48}
          color={SemanticColors.textTertiary}
        />
        <Text style={styles.emptyTitle}>Produit introuvable</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allImages = images;

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
      {/* Image Gallery */}
      <View style={styles.imageGallery}>
        <FlatList
          data={allImages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const index = Math.round(
              nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width,
            );
            setSelectedImageIndex(index);
          }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          )}
          contentContainerStyle={styles.galleryContent}
        />
        {allImages.length > 1 && (
          <View style={styles.imageIndicators}>
            {allImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.indicator,
                  i === selectedImageIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <View style={styles.storeInfo}>
            <Ionicons
              name="storefront"
              size={16}
              color={SemanticColors.textSecondary}
            />
            <Text style={styles.storeName}>Boutique Demo Conakry</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons
              name={product.is_featured ? "heart" : "heart-outline"}
              size={24}
              color={SemanticColors.error}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.productTitle}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>
            {formatGnf(product.price_gnf as unknown as GnfAmount)}
          </Text>
          {product.compare_at_price_gnf && (
            <Text style={styles.oldPrice}>
              {formatGnf(product.compare_at_price_gnf as unknown as GnfAmount)}
            </Text>
          )}
          {product.compare_at_price_gnf && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -
                {Math.round(
                  ((product.compare_at_price_gnf - product.price_gnf) /
                    product.compare_at_price_gnf) *
                    100,
                )}
                %
              </Text>
            </View>
          )}
        </View>

        {product.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantité</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={
                  quantity <= 1
                    ? SemanticColors.textTertiary
                    : SemanticColors.primaryAction
                }
              />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons
                name="add"
                size={20}
                color={SemanticColors.primaryAction}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Ionicons
            name="cart"
            size={22}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addToCartText}>
            Ajouter au panier -{" "}
            {formatGnf(product.price_gnf as unknown as GnfAmount)}
          </Text>
        </TouchableOpacity>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons
              name="truck"
              size={20}
              color={SemanticColors.primaryAction}
            />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Livraison rapide</Text>
              <Text style={styles.featureDesc}>Dans votre quartier</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="shield"
              size={20}
              color={SemanticColors.primaryAction}
            />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Paiement sécurisé</Text>
              <Text style={styles.featureDesc}>
                À la livraison ou Orange Money
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="refresh"
              size={20}
              color={SemanticColors.primaryAction}
            />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Retour facile</Text>
              <Text style={styles.featureDesc}>Sous 7 jours</Text>
            </View>
          </View>
        </View>
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
  contentContainer: { paddingBottom: 100 },
  imageGallery: {
    height: 300,
    backgroundColor: SemanticColors.backgroundTertiary,
  },
  galleryContent: { minWidth: "100%" },
  galleryImage: {
    width: "100%",
    height: 300,
  },
  imageIndicators: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  indicatorActive: {
    width: 24,
    backgroundColor: "#FFFFFF",
  },
  productInfo: {
    backgroundColor: SemanticColors.screenBackground,
    padding: Spacing.md,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeName: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
  },
  favoriteButton: {
    padding: 8,
  },
  productTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  currentPrice: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    color: SemanticColors.primaryAction,
  },
  oldPrice: {
    fontSize: FontSize.md,
    color: SemanticColors.textTertiary,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: SemanticColors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.badge,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  descriptionSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    lineHeight: 22,
  },
  quantitySection: {
    marginBottom: Spacing.lg,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    backgroundColor: SemanticColors.inputBackground,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  qtyButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
    minWidth: 50,
    textAlign: "center",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
    marginBottom: Spacing.xl,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  features: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  featureDesc: {
    fontSize: FontSize.xs,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
});
