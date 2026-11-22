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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { fetchCategories, Category } from "@/api";
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

const categoryColors: Record<string, string> = {
  alimentation: "#F97316",
  electronique: "#3B82F6",
  mode: "#EC4899",
  maison: "#06B6D4",
  sante: "#16A34A",
  sport: "#8B5CF6",
  beaute: "#F472B6",
  auto: "#64748B",
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
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
      <View style={styles.header}>
        <Text style={styles.title}>Catégories</Text>
        <Text style={styles.subtitle}>Trouvez ce dont vous avez besoin</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((cat) => {
          const color =
            categoryColors[cat.slug] ?? SemanticColors.primaryAction;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/(tabs)/categories/${cat.slug}`)}
            >
              <View
                style={[styles.categoryIcon, { backgroundColor: `${color}15` }]}
              >
                <Ionicons
                  name={categoryIcons[cat.slug] ?? "cube"}
                  size={28}
                  color={color}
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.allCategoriesTitle}>
        <Text style={styles.allCategoriesTitleText}>Toutes les catégories</Text>
      </View>

      <View style={styles.grid}>
        {categories.map((cat) => {
          const color =
            categoryColors[cat.slug] ?? SemanticColors.primaryAction;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.gridCard}
              onPress={() => router.push(`/(tabs)/categories/${cat.slug}`)}
            >
              <View
                style={[styles.gridIcon, { backgroundColor: `${color}15` }]}
              >
                <Ionicons
                  name={categoryIcons[cat.slug] ?? "cube"}
                  size={24}
                  color={color}
                />
              </View>
              <Text style={styles.gridName} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={styles.gridCount}>
                {cat.description ? "Voir produits" : "Bientôt disponible"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: Spacing.xl },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
  categoryList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  categoryCard: { alignItems: "center", width: 88 },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.xs,
    textAlign: "center",
    color: SemanticColors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  allCategoriesTitle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  allCategoriesTitleText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  gridCard: {
    width: "48%",
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
    alignItems: "center",
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  gridName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: "center",
    color: SemanticColors.textPrimary,
    marginBottom: 2,
  },
  gridCount: {
    fontSize: FontSize.xs,
    textAlign: "center",
    color: SemanticColors.textTertiary,
  },
});
