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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchFeaturedStores,
  Category,
  Product,
  Store,
} from "@/api/mockApi";

export default function HomeScreen() {
  const router = useRouter();
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

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
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
          colors={["#2563EB"]}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour !</Text>
        <Text style={styles.subtitle}>Que cherchez-vous aujourd'hui ?</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={22}
          color="#94A3B8"
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>
          Rechercher des produits, boutiques...
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
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
                <Ionicons name="cube" size={24} color="#2563EB" />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Boutiques en vedette</Text>
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
              <View style={styles.storeImage}>
                <Ionicons name="storefront" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.storeName} numberOfLines={1}>
                {store.name}
              </Text>
              <Text style={styles.storeLocation}>
                {store.commune}, {store.quartier}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produits recommandés</Text>
        </View>
        <View style={styles.productGrid}>
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <View style={styles.productImage}>
                <Ionicons name="image" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                {product.price_gnf.toLocaleString("fr-FR")} GNF
              </Text>
              {product.compare_at_price_gnf && (
                <Text style={styles.productOldPrice}>
                  {product.compare_at_price_gnf.toLocaleString("fr-FR")} GNF
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { paddingBottom: 100 },
  header: { padding: 20, paddingTop: 10 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { fontSize: 16, color: "#94A3B8", flex: 1 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1E293B" },
  categoryList: { paddingHorizontal: 20, gap: 12 },
  categoryCard: { alignItems: "center", width: 80 },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryName: { fontSize: 12, textAlign: "center", color: "#1E293B" },
  storeList: { paddingHorizontal: 20, gap: 12 },
  storeCard: { width: 160, alignItems: "center" },
  storeImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#1E293B",
  },
  storeLocation: { fontSize: 11, textAlign: "center", color: "#94A3B8" },
  productGrid: {
    flexDirection: "row",
    flexWrap: "justify",
    paddingHorizontal: 20,
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productImage: {
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
  },
  productPrice: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  productOldPrice: {
    fontSize: 11,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
});
