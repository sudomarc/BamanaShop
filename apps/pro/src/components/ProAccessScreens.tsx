import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuthStore } from "@/store/authStore";
import type { RoleStatus, UserRole } from "@bamanashop/contracts";

type ProRole = Extract<UserRole, "seller" | "courier">;

const roleLabels: Record<ProRole, string> = {
  seller: "Espace vendeur",
  courier: "Espace livreur",
};

const statusLabels: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Approuvé",
  suspended: "Suspendu",
  rejected: "Refusé",
};

export function BackendUnavailableScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BAMANASHOP PRO</Text>
        <Text style={styles.title}>Service indisponible</Text>
        <Text style={styles.body}>
          L'application n'est pas reliée à un projet Supabase. Les espaces
          vendeur et livreur restent verrouillés tant que le backend n'est pas
          configuré.
        </Text>
      </View>
    </View>
  );
}

export function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const result = await signIn(email, password);
    if (result.error) setError(result.error.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BAMANASHOP PRO</Text>
        <Text style={styles.title}>Connexion professionnelle</Text>
        <Text style={styles.body}>
          Connectez-vous avec le compte auquel un accès vendeur ou livreur a été
          attribué.
        </Text>

        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="nom@exemple.com"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={loading || !email.trim() || !password}
          onPress={() => void handleSignIn()}
          style={[
            styles.primaryButton,
            (loading || !email.trim() || !password) && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function AccessReviewScreen({
  profileError,
  requestedRoles,
  roleStatuses,
  onRetry,
  onSignOut,
}: {
  profileError: string | null;
  requestedRoles: UserRole[];
  roleStatuses: Record<UserRole, RoleStatus | null>;
  onRetry: () => void;
  onSignOut: () => void | Promise<void>;
}) {
  const user = useAuthStore((state) => state.user);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setActionError(null);
    try {
      await onSignOut();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Déconnexion impossible.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BAMANASHOP PRO</Text>
        <Text style={styles.title}>Accès non disponible</Text>
        <Text style={styles.body}>
          {profileError
            ? "Les autorisations de ce compte n'ont pas pu être vérifiées. Aucun espace professionnel ne sera ouvert."
            : "Ce compte ne possède actuellement aucun rôle vendeur ou livreur approuvé."}
        </Text>
        {user?.email ? <Text style={styles.account}>{user.email}</Text> : null}

        {profileError ? <Text style={styles.error}>{profileError}</Text> : null}

        <View style={styles.statusList}>
          {(["seller", "courier"] as const).map((role) => {
            const status = requestedRoles.includes(role)
              ? roleStatuses[role]
              : null;
            return (
              <View key={role} style={styles.statusRow}>
                <Text style={styles.statusName}>{roleLabels[role]}</Text>
                <Text style={styles.statusValue}>
                  {status ? statusLabels[status] : "Aucune demande enregistrée"}
                </Text>
              </View>
            );
          })}
        </View>

        {profileError ? (
          <Pressable
            accessibilityRole="button"
            disabled={profileLoading}
            onPress={onRetry}
            style={[
              styles.primaryButton,
              profileLoading && styles.disabledButton,
            ]}
          >
            {profileLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Réessayer</Text>
            )}
          </Pressable>
        ) : null}

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RolePickerScreen({
  roles,
  onSelect,
  onSignOut,
}: {
  roles: ProRole[];
  onSelect: (role: ProRole) => void;
  onSignOut: () => void | Promise<void>;
}) {
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    try {
      await onSignOut();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Déconnexion impossible.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BAMANASHOP PRO</Text>
        <Text style={styles.title}>Choisissez votre espace</Text>
        <Text style={styles.body}>
          Les deux rôles sont approuvés pour {user?.email ?? "ce compte"}.
          Choisissez l'espace à ouvrir.
        </Text>
        {roles.map((role) => (
          <Pressable
            accessibilityRole="button"
            key={role}
            onPress={() => onSelect(role)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{roleLabels[role]}</Text>
          </Pressable>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  eyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  account: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 9,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 9,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  statusList: {
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  statusRow: {
    borderBottomColor: "#F1F5F9",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  statusName: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  statusValue: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
});
