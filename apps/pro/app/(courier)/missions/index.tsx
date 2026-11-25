import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuthStore } from "@/store/authStore";

export default function CourierMissionsScreen() {
  const courierProfile = useAuthStore((state) => state.courierProfile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ESPACE LIVREUR</Text>
          <Text style={styles.title}>Missions de livraison</Text>
          <Text style={styles.subtitle}>
            Véhicule : {courierProfile?.vehicle_type ?? "non renseigné"}
          </Text>
          <Text style={styles.subtitle}>
            Statut du profil : {courierProfile?.status ?? "non disponible"}
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons name="bicycle-outline" size={28} color="#2563EB" />
          <Text style={styles.noticeTitle}>Missions non connectées</Text>
          <Text style={styles.noticeBody}>
            L'affectation des livraisons, l'acceptation des missions, le suivi
            du trajet, la preuve de remise et les gains ne sont pas encore
            reliés à des opérations réelles. Aucune mission ou rémunération
            fictive n'est affichée.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flux à implémenter</Text>
          <Text style={styles.item}>
            • Réception et acceptation d'une mission
          </Text>
          <Text style={styles.item}>• Retrait chez le vendeur</Text>
          <Text style={styles.item}>• Suivi et mise à jour du trajet</Text>
          <Text style={styles.item}>• Confirmation de livraison et preuve</Text>
          <Text style={styles.item}>• Rapprochement des encaissements COD</Text>
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
