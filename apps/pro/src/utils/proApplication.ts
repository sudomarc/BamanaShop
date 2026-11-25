import type { Json } from "@/types/database";

export const PRO_BUSINESS_ACTIVITIES = [
  "physical_store",
  "online_seller",
  "wholesaler",
  "distributor",
] as const;

export type ProBusinessActivity = (typeof PRO_BUSINESS_ACTIVITIES)[number];
export type ProVehicleType = "motorcycle" | "bicycle" | "car" | "walking";

export type ProApplicationDraft = {
  fullName: string;
  phone: string;
  businessName: string;
  activities: ProBusinessActivity[];
  physicalStore: {
    commune: string;
    quartier: string;
    addressLine: string;
  };
  onlineSeller: {
    channels: string;
    deliveryZones: string;
  };
  wholesaler: {
    goods: string;
    minimumOrderGnf: string;
  };
  distributor: {
    suppliers: string;
    distributionZones: string;
  };
  courierRequested: boolean;
  vehicleType: string;
  vehiclePlate: string;
};

export type ProApplicationPayload = {
  fullName: string;
  phone: string;
  businessName: string | null;
  businessActivities: ProBusinessActivity[];
  businessDetails: Record<string, Json>;
  courierRequested: boolean;
  vehicleType: ProVehicleType | null;
  vehiclePlate: string | null;
};

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} est obligatoire.`);
  return normalized;
}

function parseList(value: string, label: string): string[] {
  const items = [...new Set(value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean))];
  if (items.length === 0) throw new Error(`${label} : indiquez au moins une valeur.`);
  return items;
}

export function buildProApplicationPayload(
  draft: ProApplicationDraft,
): ProApplicationPayload {
  const fullName = requiredText(draft.fullName, "Le nom complet");
  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error("Le nom complet doit contenir entre 2 et 120 caractères.");
  }

  const phone = draft.phone.trim();
  if (!/^\+224\d{9}$/.test(phone)) {
    throw new Error("Saisissez un numéro guinéen au format +224XXXXXXXXX.");
  }

  const activities = [...new Set(draft.activities)];
  if (activities.length !== draft.activities.length) {
    throw new Error("Une activité commerciale est sélectionnée plusieurs fois.");
  }
  if (activities.length === 0 && !draft.courierRequested) {
    throw new Error("Sélectionnez au moins une activité ou l'accès livreur.");
  }

  const businessDetails: Record<string, Json> = {};
  let businessName: string | null = null;

  if (activities.length > 0) {
    businessName = requiredText(draft.businessName, "Le nom de l'entreprise");
    if (businessName.length > 200) {
      throw new Error("Le nom de l'entreprise ne doit pas dépasser 200 caractères.");
    }
  }

  if (activities.includes("physical_store")) {
    businessDetails.physical_store = {
      commune: requiredText(draft.physicalStore.commune, "La commune du commerce"),
      quartier: requiredText(draft.physicalStore.quartier, "Le quartier du commerce"),
      address_line: requiredText(draft.physicalStore.addressLine, "L'adresse du commerce"),
    };
  }

  if (activities.includes("online_seller")) {
    businessDetails.online_seller = {
      channels: parseList(draft.onlineSeller.channels, "Les canaux de vente"),
      delivery_zones: parseList(
        draft.onlineSeller.deliveryZones,
        "Les zones de livraison",
      ),
    };
  }

  if (activities.includes("wholesaler")) {
    const minimumOrder = Number(draft.wholesaler.minimumOrderGnf.replace(/\s/g, ""));
    if (!Number.isSafeInteger(minimumOrder) || minimumOrder <= 0) {
      throw new Error("Le minimum de commande grossiste doit être un montant GNF positif.");
    }
    businessDetails.wholesaler = {
      goods: parseList(draft.wholesaler.goods, "Les catégories de marchandises"),
      minimum_order_gnf: minimumOrder,
    };
  }

  if (activities.includes("distributor")) {
    businessDetails.distributor = {
      suppliers: parseList(draft.distributor.suppliers, "Les fournisseurs"),
      distribution_zones: parseList(
        draft.distributor.distributionZones,
        "Les zones de distribution",
      ),
    };
  }

  const validVehicleTypes: ProVehicleType[] = [
    "motorcycle",
    "bicycle",
    "car",
    "walking",
  ];
  let vehicleType: ProVehicleType | null = null;
  let vehiclePlate: string | null = null;

  if (draft.courierRequested) {
    if (!validVehicleTypes.includes(draft.vehicleType as ProVehicleType)) {
      throw new Error("Sélectionnez un moyen de transport valide.");
    }
    vehicleType = draft.vehicleType as ProVehicleType;
    vehiclePlate = draft.vehiclePlate.trim() || null;
    if (vehiclePlate && vehiclePlate.length > 20) {
      throw new Error("L'immatriculation ne doit pas dépasser 20 caractères.");
    }
  }

  return {
    fullName,
    phone,
    businessName,
    businessActivities: activities,
    businessDetails,
    courierRequested: draft.courierRequested,
    vehicleType,
    vehiclePlate,
  };
}
