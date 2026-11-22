"use client";

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { launchImageLibrary } from "react-native-image-picker";
import { useAuthStore } from "@/store/authStore";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing, FontSize, FontWeight } from "@/constants/theme";

const menuItems = [
  {
    label: "Mes adresses",
    icon: "location",
    route: "/(tabs)/profile/addresses",
  },
  {
    label: "Moyens de paiement",
    icon: "card",
    route: "/(tabs)/profile/payment",
  },
  {
    label: "Notifications",
    icon: "notifications",
    route: "/(tabs)/profile/notifications",
  },
  { label: "Sécurité", icon: "shield", route: "/(tabs)/profile/security" },
  { label: "Langue", icon: "language", route: "/(tabs)/profile/language" },
  {
    label: "Aide & Support",
    icon: "help-circle",
    route: "/(tabs)/profile/support",
  },
  {
    label: "Conditions d'utilisation",
    icon: "document-text",
    route: "/(tabs)/profile/terms",
  },
  {
    label: "Politique de confidentialité",
    icon: "lock-closed",
    route: "/(tabs)/profile/privacy",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    profile,
    roles,
    signOut,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useAuthStore();
  const [avatar, setAvatar] = useState<string | null>(
    profile?.avatar_url ?? null,
  );

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
      includeBase64: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        "Erreur",
        result.errorMessage ?? "Impossible d'ouvrir la galerie",
      );
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) setAvatar(uri);
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      await disableBiometric();
    } else {
      try {
        await enableBiometric();
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Échec de l'activation",
        );
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        onPress: () => signOut(),
        style: "destructive",
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestHeader}>
          <Ionicons
            name="person-circle"
            size={60}
            color={SemanticColors.primaryAction}
          />
          <Text style={styles.guestTitle}>Bienvenue</Text>
          <Text style={styles.guestSubtitle}>
            Connectez-vous pour accéder à votre compte
          </Text>
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerButtonText}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons
              name="person"
              size={40}
              color={SemanticColors.textTertiary}
            />
          )}
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.full_name ?? "Utilisateur"}
          </Text>
          <Text style={styles.profilePhone}>
            {user.phone ?? "+224 XX XXXXXXX"}
          </Text>
          <View style={styles.profileRoles}>
            {roles.map((role) => (
              <View key={role} style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons
                name="cart"
                size={22}
                color={SemanticColors.primaryAction}
              />
            </View>
            <Text style={styles.quickActionLabel}>Mon panier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons
                name="bag-handle"
                size={22}
                color={SemanticColors.success}
              />
            </View>
            <Text style={styles.quickActionLabel}>Mes commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="heart" size={22} color={SemanticColors.error} />
            </View>
            <Text style={styles.quickActionLabel}>Favoris</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="cash" size={22} color={SemanticColors.warning} />
            </View>
            <Text style={styles.quickActionLabel}>Portefeuille</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={SemanticColors.textSecondary}
                style={styles.menuIcon}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={SemanticColors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Biometric Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <TouchableOpacity style={styles.menuItem} onPress={toggleBiometric}>
          <Ionicons
            name={biometricEnabled ? "finger-print" : "finger-print-outline"}
            size={22}
            color={SemanticColors.textSecondary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Connexion biométrique</Text>
            <Text style={styles.menuDesc}>
              {biometricEnabled
                ? "Activée - Utilisez votre empreinte"
                : "Désactivée - Activez pour plus de sécurité"}
            </Text>
          </View>
          <View
            style={[
              styles.toggleTrack,
              biometricEnabled && styles.toggleTrackOn,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                biometricEnabled && styles.toggleThumbOn,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)/profile/about")}
          >
            <Ionicons
              name="information-circle"
              size={22}
              color={SemanticColors.textSecondary}
              style={styles.menuIcon}
            />
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>À propos</Text>
              <Text style={styles.menuDesc}>Version 1.0.0</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)/profile/legal")}
          >
            <Ionicons
              name="document-text"
              size={22}
              color={SemanticColors.textSecondary}
              style={styles.menuIcon}
            />
            <Text style={styles.menuLabel}>Mentions légales</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons
          name="log-out"
          size={20}
          color={SemanticColors.error}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>BamanaShop v1.0.0</Text>
    </ScrollView>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    customer: "Client",
    seller: "Commerçant",
    courier: "Livreur",
    partner_manager: "Gestionnaire",
    admin: "Admin",
    staff: "Staff",
  };
  return labels[role] ?? role;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  scrollView: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  contentContainer: { paddingBottom: Spacing.xl },
  guestHeader: {
    alignItems: "center",
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  guestTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
    marginTop: Spacing.md,
  },
  guestSubtitle: {
    fontSize: FontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  loginButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  registerButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: SemanticColors.primaryAction,
    borderRadius: BorderRadius.button,
    alignItems: "center",
  },
  registerButtonText: {
    color: SemanticColors.primaryAction,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: SemanticColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderDefault,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SemanticColors.primaryBackground,
    borderWidth: 3,
    borderColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: SemanticColors.screenBackground,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: SemanticColors.textPrimary,
  },
  profilePhone: {
    fontSize: FontSize.sm,
    color: SemanticColors.textSecondary,
    marginTop: 2,
  },
  profileRoles: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: SemanticColors.primaryBackground,
    borderRadius: BorderRadius.badge,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.primaryAction,
  },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.textTertiary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    width: "23%",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: SemanticColors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    textAlign: "center",
    color: SemanticColors.textPrimary,
  },
  menuList: {
    backgroundColor: SemanticColors.cardBackground,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: SemanticColors.cardBorder,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderDefault,
  },
  menuIcon: { marginRight: Spacing.md },
  menuContent: { flex: 1 },
  menuLabel: {
    fontSize: FontSize.base,
    color: SemanticColors.textPrimary,
  },
  menuDesc: {
    fontSize: FontSize.xs,
    color: SemanticColors.textTertiary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: SemanticColors.borderDefault,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: SemanticColors.primaryAction,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    ...Shadows.sm,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  signOutButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SemanticColors.errorBackground,
    borderWidth: 1,
    borderColor: SemanticColors.error,
    borderRadius: BorderRadius.button,
  },
  signOutText: {
    color: SemanticColors.error,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  versionText: {
    textAlign: "center",
    color: SemanticColors.textTertiary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
});
