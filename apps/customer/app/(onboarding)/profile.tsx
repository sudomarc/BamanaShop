"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "@/navigation/compat";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useAuthStore } from "@/store/authStore";
import { SemanticColors } from "@/constants/colors";
import { BorderRadius, Spacing } from "@/constants/theme";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"fr" | "en" | "ff">("fr");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const languages = [
    { code: "fr" as const, name: "Français", flag: "🇫🇷" },
    { code: "en" as const, name: "English", flag: "🇺🇸" },
    { code: "ff" as const, name: "Pulaar", flag: "🇬🇳" },
  ];

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
      includeBase64: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert("Erreur", result.errorMessage ?? "Impossible d'ouvrir la galerie");
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) setAvatar(uri);
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: "photo",
      cameraType: "back",
      saveToPhotos: false,
      includeBase64: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert("Erreur", result.errorMessage ?? "Impossible d'ouvrir la caméra");
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) setAvatar(uri);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError("Veuillez entrer votre nom complet");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères");
      return;
    }
    setError("");
    setSaving(true);

    try {
      // Upload avatar if selected
      let avatarUrl = null;
      if (avatar && !avatar.startsWith("http")) {
        // In real app, upload to Supabase Storage
        // For now, just store locally
        avatarUrl = avatar;
      }

      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        preferred_language: selectedLanguage,
      });

      // Mark onboarding complete
      router.replace("/(tabs)");
    } catch (error) {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons
            name="person-circle"
            size={60}
            color={SemanticColors.primaryAction}
          />
          <Text style={styles.title}>Complétez votre profil</Text>
          <Text style={styles.subtitle}>
            Ces informations seront visibles par les commerçants
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera" size={32} color={SemanticColors.textTertiary} />
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Appuyez pour ajouter une photo</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person"
              size={22}
              color={SemanticColors.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Votre nom complet"
              autoCapitalize="words"
              autoCompleteType="name"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Langue préférée</Text>
          <View style={styles.languageSelector}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === lang.code &&
                      styles.languageNameSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {selectedLanguage === lang.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={SemanticColors.primaryAction}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={SemanticColors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || !fullName.trim()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Continuer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.skipButtonText}>Ignorer pour maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  scrollContent: { flexGrow: 1, padding: Spacing.md, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: Spacing.xl },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: SemanticColors.textPrimary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: SemanticColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  avatarSection: { alignItems: "center", marginBottom: Spacing.xl },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SemanticColors.primaryBackground,
    borderWidth: 3,
    borderColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: SemanticColors.screenBackground,
  },
  avatarHint: {
    fontSize: 13,
    color: SemanticColors.textTertiary,
  },
  inputGroup: { marginBottom: Spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: SemanticColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SemanticColors.inputBackground,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.input,
  },
  inputIcon: { marginHorizontal: Spacing.md },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: SemanticColors.textPrimary,
    paddingHorizontal: Spacing.sm,
  },
  languageSelector: { flexDirection: "row", gap: Spacing.sm },
  languageOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
    backgroundColor: SemanticColors.inputBackground,
  },
  languageOptionSelected: {
    borderColor: SemanticColors.primaryAction,
    backgroundColor: SemanticColors.primaryBackground,
  },
  languageFlag: { fontSize: 20 },
  languageName: {
    fontSize: 14,
    fontWeight: "500",
    color: SemanticColors.textPrimary,
  },
  languageNameSelected: {
    color: SemanticColors.primaryAction,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: SemanticColors.errorBackground,
    borderWidth: 1,
    borderColor: SemanticColors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: SemanticColors.error, fontSize: 13 },
  primaryButton: {
    height: 56,
    borderRadius: BorderRadius.button,
    backgroundColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: { opacity: 0.6 },
  skipButton: { alignItems: "center", marginTop: Spacing.sm },
  skipButtonText: {
    color: SemanticColors.textTertiary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});