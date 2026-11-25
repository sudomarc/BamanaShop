import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  buildProApplicationPayload,
  type ProApplicationDraft,
  type ProBusinessActivity,
  type ProVehicleType,
} from "@/utils/proApplication";

const activityOptions: Array<{
  value: ProBusinessActivity;
  label: string;
  detail: string;
}> = [
  {
    value: "physical_store",
    label: "Commerce physique",
    detail: "Boutique, magasin ou point de vente",
  },
  {
    value: "online_seller",
    label: "Vente en ligne",
    detail: "Vente via réseaux sociaux ou site web",
  },
  {
    value: "wholesaler",
    label: "Grossiste",
    detail: "Vente en quantités et commandes minimales",
  },
  {
    value: "distributor",
    label: "Distributeur",
    detail: "Approvisionnement et distribution de produits",
  },
];

const vehicleOptions: Array<{ value: ProVehicleType; label: string }> = [
  { value: "motorcycle", label: "Moto" },
  { value: "bicycle", label: "Vélo" },
  { value: "car", label: "Voiture" },
  { value: "walking", label: "À pied" },
];

const emptyDraft: ProApplicationDraft = {
  fullName: "",
  phone: "",
  businessName: "",
  activities: [],
  physicalStore: { commune: "", quartier: "", addressLine: "" },
  onlineSeller: { channels: "", deliveryZones: "" },
  wholesaler: { goods: "", minimumOrderGnf: "" },
  distributor: { suppliers: "", distributionZones: "" },
  courierRequested: false,
  vehicleType: "motorcycle",
  vehiclePlate: "",
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

export function ProApplicationForm({
  initialDraft,
  loading,
  onCancel,
  onSubmit,
}: {
  initialDraft?: Partial<ProApplicationDraft>;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: ReturnType<typeof buildProApplicationPayload>,
  ) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState<ProApplicationDraft>({
    ...emptyDraft,
    ...initialDraft,
    physicalStore: {
      ...emptyDraft.physicalStore,
      ...initialDraft?.physicalStore,
    },
    onlineSeller: {
      ...emptyDraft.onlineSeller,
      ...initialDraft?.onlineSeller,
    },
    wholesaler: {
      ...emptyDraft.wholesaler,
      ...initialDraft?.wholesaler,
    },
    distributor: {
      ...emptyDraft.distributor,
      ...initialDraft?.distributor,
    },
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const selectedLabels = useMemo(
    () =>
      activityOptions
        .filter((option) => draft.activities.includes(option.value))
        .map((option) => option.label),
    [draft.activities],
  );

  const update = <K extends keyof ProApplicationDraft>(
    key: K,
    value: ProApplicationDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const updateNested = <
    K extends "physicalStore" | "onlineSeller" | "wholesaler" | "distributor",
    P extends keyof ProApplicationDraft[K],
  >(
    key: K,
    property: P,
    value: ProApplicationDraft[K][P],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [property]: value },
    }));
  };

  const toggleActivity = (activity: ProBusinessActivity) => {
    setDraft((current) => ({
      ...current,
      activities: current.activities.includes(activity)
        ? current.activities.filter((item) => item !== activity)
        : [...current.activities, activity],
    }));
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!draft.fullName.trim()) {
        setError("Saisissez votre nom complet.");
        return false;
      }
      if (!draft.phone.trim()) {
        setError("Saisissez votre numéro de téléphone.");
        return false;
      }
      if (draft.activities.length === 0 && !draft.courierRequested) {
        setError("Sélectionnez au moins une activité ou l'accès livreur.");
        return false;
      }
      return true;
    }

    try {
      buildProApplicationPayload(draft);
      return true;
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Vérifiez les informations saisies.",
      );
      return false;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload = buildProApplicationPayload(draft);
      const submitError = await onSubmit(payload);
      if (submitError) setError(submitError);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Vérifiez les informations saisies.",
      );
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BAMANASHOP PRO · CANDIDATURE</Text>
        <Text style={styles.title}>Votre activité professionnelle</Text>
        <Text style={styles.subtitle}>Étape {step} sur 3</Text>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
          />
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.sectionTitle}>Vos coordonnées</Text>
            <Field
              label="Nom complet"
              value={draft.fullName}
              onChangeText={(value) => update("fullName", value)}
              placeholder="Prénom et nom"
            />
            <Field
              label="Téléphone guinéen"
              value={draft.phone}
              onChangeText={(value) => update("phone", value)}
              placeholder="+224XXXXXXXXX"
              keyboardType="phone-pad"
            />

            <Text style={styles.sectionTitle}>Que souhaitez-vous faire ?</Text>
            <Text style={styles.helper}>
              Sélectionnez toutes les activités que vous exercez. Vous pouvez en
              choisir plusieurs.
            </Text>
            {activityOptions.map((option) => {
              const selected = draft.activities.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleActivity(option.value)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selected && styles.checkboxSelected,
                    ]}
                  >
                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.label}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.courierRequested }}
              onPress={() =>
                update("courierRequested", !draft.courierRequested)
              }
              style={[
                styles.option,
                draft.courierRequested && styles.optionSelected,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  draft.courierRequested && styles.checkboxSelected,
                ]}
              >
                {draft.courierRequested ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Livreur</Text>
                <Text style={styles.optionDetail}>
                  Effectuer des livraisons pour BamanaShop
                </Text>
              </View>
            </Pressable>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {draft.activities.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  Informations commerciales
                </Text>
                <Field
                  label="Nom de l'entreprise ou du commerce"
                  value={draft.businessName}
                  onChangeText={(value) => update("businessName", value)}
                  placeholder="Nom commercial"
                />
              </>
            ) : null}

            {draft.activities.includes("physical_store") ? (
              <>
                <Text style={styles.sectionTitle}>Commerce physique</Text>
                <Field
                  label="Commune"
                  value={draft.physicalStore.commune}
                  onChangeText={(value) =>
                    updateNested("physicalStore", "commune", value)
                  }
                  placeholder="Ex. Dixinn"
                />
                <Field
                  label="Quartier"
                  value={draft.physicalStore.quartier}
                  onChangeText={(value) =>
                    updateNested("physicalStore", "quartier", value)
                  }
                  placeholder="Nom du quartier"
                />
                <Field
                  label="Adresse du commerce"
                  value={draft.physicalStore.addressLine}
                  onChangeText={(value) =>
                    updateNested("physicalStore", "addressLine", value)
                  }
                  placeholder="Rue, repère et numéro"
                  multiline
                />
              </>
            ) : null}

            {draft.activities.includes("online_seller") ? (
              <>
                <Text style={styles.sectionTitle}>Vente en ligne</Text>
                <Field
                  label="Canaux de vente"
                  value={draft.onlineSeller.channels}
                  onChangeText={(value) =>
                    updateNested("onlineSeller", "channels", value)
                  }
                  placeholder="Facebook, Instagram, site web…"
                />
                <Field
                  label="Zones de livraison"
                  value={draft.onlineSeller.deliveryZones}
                  onChangeText={(value) =>
                    updateNested("onlineSeller", "deliveryZones", value)
                  }
                  placeholder="Matam, Ratoma, Dixinn…"
                />
              </>
            ) : null}

            {draft.activities.includes("wholesaler") ? (
              <>
                <Text style={styles.sectionTitle}>Grossiste</Text>
                <Field
                  label="Marchandises proposées"
                  value={draft.wholesaler.goods}
                  onChangeText={(value) =>
                    updateNested("wholesaler", "goods", value)
                  }
                  placeholder="Riz, huile, boissons…"
                />
                <Field
                  label="Commande minimale (GNF)"
                  value={draft.wholesaler.minimumOrderGnf}
                  onChangeText={(value) =>
                    updateNested("wholesaler", "minimumOrderGnf", value)
                  }
                  placeholder="100000"
                  keyboardType="numeric"
                />
              </>
            ) : null}

            {draft.activities.includes("distributor") ? (
              <>
                <Text style={styles.sectionTitle}>Distribution</Text>
                <Field
                  label="Fournisseurs ou marques"
                  value={draft.distributor.suppliers}
                  onChangeText={(value) =>
                    updateNested("distributor", "suppliers", value)
                  }
                  placeholder="Noms des fournisseurs"
                />
                <Field
                  label="Zones de distribution"
                  value={draft.distributor.distributionZones}
                  onChangeText={(value) =>
                    updateNested("distributor", "distributionZones", value)
                  }
                  placeholder="Communes ou régions couvertes"
                />
              </>
            ) : null}

            {draft.courierRequested ? (
              <>
                <Text style={styles.sectionTitle}>Profil livreur</Text>
                <Text style={styles.label}>Moyen de transport</Text>
                <View style={styles.chipRow}>
                  {vehicleOptions.map((option) => {
                    const selected = draft.vehicleType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => update("vehicleType", option.value)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {draft.vehicleType !== "walking" ? (
                  <Field
                    label="Immatriculation (facultatif)"
                    value={draft.vehiclePlate}
                    onChangeText={(value) => update("vehiclePlate", value)}
                    placeholder="Ex. CG-1234-AB"
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.sectionTitle}>Vérification de la demande</Text>
            <Text style={styles.helper}>
              Vérifiez vos informations avant l'envoi. Votre accès restera en
              attente jusqu'à validation par l'équipe BamanaShop.
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nom</Text>
              <Text style={styles.summaryValue}>{draft.fullName.trim()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Téléphone</Text>
              <Text style={styles.summaryValue}>{draft.phone.trim()}</Text>
            </View>
            {draft.businessName.trim() ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Commerce</Text>
                <Text style={styles.summaryValue}>
                  {draft.businessName.trim()}
                </Text>
              </View>
            ) : null}
            {selectedLabels.map((label) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Activité</Text>
                <Text style={styles.summaryValue}>{label}</Text>
              </View>
            ))}
            {draft.courierRequested ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livreur</Text>
                <Text style={styles.summaryValue}>
                  {
                    vehicleOptions.find(
                      (option) => option.value === draft.vehicleType,
                    )?.label
                  }
                </Text>
              </View>
            ) : null}
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                L'envoi crée une demande en attente. Il ne donne pas
                immédiatement accès aux espaces vendeur ou livreur.
              </Text>
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            disabled={loading}
            onPress={
              step === 1 ? onCancel : () => setStep((current) => current - 1)
            }
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {step === 1 ? "Annuler" : "Retour"}
            </Text>
          </Pressable>
          {step < 3 ? (
            <Pressable
              disabled={loading}
              onPress={() => {
                if (validateStep()) setStep((current) => current + 1);
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Continuer</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void handleSubmit()}
              style={[styles.primaryButton, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Envoyer la demande</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
  },
  eyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: { color: "#0F172A", fontSize: 23, fontWeight: "700" },
  subtitle: { color: "#64748B", fontSize: 12, marginTop: 8 },
  progressTrack: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },
  progressFill: { height: 5, backgroundColor: "#2563EB", borderRadius: 5 },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
  },
  helper: { color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { color: "#334155", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    minHeight: 46,
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  multilineInput: { minHeight: 76, paddingTop: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  optionSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  optionText: { flex: 1 },
  optionTitle: { color: "#0F172A", fontSize: 14, fontWeight: "700" },
  optionDetail: { color: "#64748B", fontSize: 12, marginTop: 3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  chipText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#1D4ED8" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 10,
    gap: 12,
  },
  summaryLabel: { color: "#64748B", fontSize: 13 },
  summaryValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  notice: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  noticeText: { color: "#1E40AF", fontSize: 12, lineHeight: 18 },
  error: { color: "#B91C1C", fontSize: 13, lineHeight: 19, marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
});
