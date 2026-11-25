import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuthStore } from "@/store/authStore";

export default function SellerDashboardScreen() {
  const sellerProfile = useAuthStore((state) => state.sellerProfile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ESPACE VENDEUR</Text>
          <Text style={styles.title}>
            {sellerProfile?.business_name ?? "Profil vendeur"}
          </Text>
          <Text style={styles.subtitle}>
            Statut du profil : {sellerProfile?.status ?? "non disponible"}
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={26} color="#2563EB" />
          <Text style={styles.noticeTitle}>Gestion commerciale non activée</Text>
          <Text style={styles.noticeBody}>
            Les statistiques de ventes, les commandes réelles, les stocks et les
            paiements ne sont pas encore connectés à cet espace. Aucune donnée
            fictive n'est affichée comme une vente ou une opération réelle.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctions à connecter</Text>
          <Text style={styles.item}>• Commandes et préparation</Text>
          <Text style={styles.item}>• Catalogue et gestion des stocks</Text>
          <Text style={styles.item}>• Fournisseurs et approvisionnement</Text>
          <Text style={styles.item}>• Ventes, encaissements et reversements</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 48 },
  header: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: { color: "#64748B", fontSize: 13, marginTop: 6 },
  notice: {
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  noticeTitle: {
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  noticeBody: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  item: { color: "#475569", fontSize: 13, lineHeight: 24 },
});
