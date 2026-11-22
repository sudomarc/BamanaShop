"use client";

import { useState, useEffect } from "react";
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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "@/navigation/compat";
import { useAuthStore } from "@/store/authStore";
import type { PhoneE164 } from "@bamanashop/contracts";
import { SemanticColors } from "@/constants/colors";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sendOtp, loading, verifyOtp } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Check if coming from deep link with phone pre-filled
  useEffect(() => {
    if (params.phone) {
      setPhone(params.phone as string);
    }
  }, [params]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Format as +224 XX XXXXXXX
    if (digits.startsWith("224")) {
      const rest = digits.slice(3);
      if (rest.length <= 2) return `+224 ${rest}`;
      if (rest.length <= 9) return `+224 ${rest.slice(0, 2)} ${rest.slice(2)}`;
      return `+224 ${rest.slice(0, 2)} ${rest.slice(2, 9)}`;
    }
    if (digits.length <= 2) return `+224 ${digits}`;
    if (digits.length <= 9)
      return `+224 ${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `+224 ${digits.slice(0, 2)} ${digits.slice(2, 9)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  const validatePhone = (phone: string): boolean => {
    // Check if it matches Guinea format +224 XX XXXXXXX
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 12 && cleaned.startsWith("224");
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      setError("Numéro invalide. Format: +224 XX XXXXXXX");
      return;
    }
    setError("");

    const { error: sendError } = await sendOtp(
      phone.replace(/\s/g, "") as PhoneE164,
    );
    if (sendError) {
      setError(sendError.message);
      return;
    }

    setSentCode(true);
    setCountdown(60);
  };

  const handleVerifyOtp = async () => {
    if (code.length !== 6) {
      setError("Veuillez entrer les 6 chiffres");
      return;
    }
    setError("");

    const { error: verifyError } = await verifyOtp(
      phone.replace(/\s/g, "") as PhoneE164,
      code,
    );

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    // Check if profile needs completion
    const { profile } = useAuthStore.getState();
    if (!profile?.full_name) {
      router.replace("/(onboarding)/profile");
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCode("");
    await handleSendOtp();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Ionicons
            name="storefront"
            size={60}
            color={SemanticColors.primaryAction}
          />
          <Text style={styles.appName}>BamanaShop</Text>
          <Text style={styles.appTagline}>Vos courses livrées chez vous</Text>
        </View>

        {!sentCode ? (
          <>
            <Text style={styles.welcomeTitle}>Connexion</Text>
            <Text style={styles.welcomeSubtitle}>
              Entrez votre numéro pour recevoir un code par SMS
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={SemanticColors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+224</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="XX XXXXXXX"
                  keyboardType="phone-pad"
                  autoCompleteType="tel"
                  maxLength={16}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading || !validatePhone(phone)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Envoyer le code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.termsText}
              onPress={() => router.push("/(auth)/terms")}
            >
              <Text style={styles.termsTextContent}>
                En continuant, vous acceptez nos{" "}
                <Text style={styles.termsLink}>Conditions d'utilisation</Text>
                {" et notre "}
                <Text style={styles.termsLink}>
                  Politique de confidentialité
                </Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.welcomeTitle}>Vérification</Text>
            <Text style={styles.welcomeSubtitle}>
              Nous avons envoyé un code à 6 chiffres au{" "}
              <Text style={styles.phoneHighlight}>{phone}</Text>
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={SemanticColors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.codeInputContainer}>
              {[...Array(6)].map((_, i) => (
                <TextInput
                  key={i}
                  style={[
                    styles.codeInput,
                    code.length > i && styles.codeInputFilled,
                    i === code.length && styles.codeInputFocused,
                  ]}
                  value={code[i] || ""}
                  onChangeText={(text) => {
                    if (text.length <= 1 && /^\d*$/.test(text)) {
                      setCode(code.slice(0, i) + text + code.slice(i + 1));
                    }
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  textAlign="center"
                  autoComplete="one-time-code"
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <Text style={styles.resendText}>
              {countdown > 0 ? (
                `Renvoyer dans {countdown}s`
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Renvoyer le code</Text>
                </TouchableOpacity>
              )}
            </Text>

            <TouchableOpacity
              style={styles.changeNumberButton}
              onPress={() => {
                setSentCode(false);
                setCode("");
              }}
            >
              <Text style={styles.changeNumberText}>Changer de numéro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Vérifier</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SemanticColors.screenBackground },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 32 },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: SemanticColors.textPrimary,
    marginTop: 12,
  },
  appTagline: {
    fontSize: 14,
    color: SemanticColors.textSecondary,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: SemanticColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: SemanticColors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  phoneHighlight: {
    fontWeight: "600",
    color: SemanticColors.primaryAction,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: SemanticColors.errorBackground,
    borderWidth: 1,
    borderColor: SemanticColors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { color: SemanticColors.error, fontSize: 13 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: SemanticColors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SemanticColors.inputBackground,
    borderWidth: 1,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 0,
  },
  countryCode: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: SemanticColors.borderDefault,
    backgroundColor: SemanticColors.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.input,
    borderBottomLeftRadius: BorderRadius.input,
    height: "100%",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "500",
    color: SemanticColors.textPrimary,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: SemanticColors.textPrimary,
    paddingHorizontal: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: BorderRadius.button,
    backgroundColor: SemanticColors.primaryAction,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: SemanticColors.buttonTextOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: { opacity: 0.6 },
  termsText: { marginTop: 16, alignItems: "center" },
  termsTextContent: {
    fontSize: 12,
    color: SemanticColors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: SemanticColors.primaryAction,
    fontWeight: "500",
  },
  // Code input styles
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 32,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: "600",
    color: SemanticColors.textPrimary,
    textAlign: "center",
    backgroundColor: SemanticColors.inputBackground,
    borderWidth: 2,
    borderColor: SemanticColors.borderDefault,
    borderRadius: BorderRadius.md,
  },
  codeInputFilled: {
    borderColor: SemanticColors.primaryAction,
    backgroundColor: SemanticColors.primaryBackground,
  },
  codeInputFocused: {
    borderColor: SemanticColors.primaryAction,
    borderWidth: 3,
  },
  resendText: {
    textAlign: "center",
    color: SemanticColors.textSecondary,
    marginBottom: 16,
  },
  resendLink: {
    color: SemanticColors.primaryAction,
    fontWeight: "600",
  },
  changeNumberButton: {
    marginBottom: 24,
    alignItems: "center",
  },
  changeNumberText: {
    color: SemanticColors.textTertiary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

// Import here to avoid circular dependency
import { BorderRadius } from "@/constants/theme";
