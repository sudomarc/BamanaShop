import { describe, expect, it } from "vitest";
import {
  buildProApplicationPayload,
  type ProApplicationDraft,
} from "../utils/proApplication";

const validDraft: ProApplicationDraft = {
  fullName: "Aissata Barry",
  phone: "+224620000001",
  businessName: "Boutique Aissata",
  activities: ["physical_store"],
  physicalStore: {
    commune: "Dixinn",
    quartier: "Donka",
    addressLine: "Route de Donka",
  },
  onlineSeller: { channels: "", deliveryZones: "" },
  wholesaler: { goods: "", minimumOrderGnf: "" },
  distributor: { suppliers: "", distributionZones: "" },
  courierRequested: false,
  vehicleType: "",
  vehiclePlate: "",
};

describe("Pro business onboarding validation", () => {
  it("builds a validated physical store application", () => {
    expect(buildProApplicationPayload(validDraft)).toEqual({
      fullName: "Aissata Barry",
      phone: "+224620000001",
      businessName: "Boutique Aissata",
      businessActivities: ["physical_store"],
      businessDetails: {
        physical_store: {
          commune: "Dixinn",
          quartier: "Donka",
          address_line: "Route de Donka",
        },
      },
      courierRequested: false,
      vehicleType: null,
      vehiclePlate: null,
    });
  });

  it("requires a valid Guinean phone number", () => {
    expect(() =>
      buildProApplicationPayload({ ...validDraft, phone: "620000001" }),
    ).toThrow("numéro guinéen");
  });

  it("requires at least one business activity or courier access", () => {
    expect(() =>
      buildProApplicationPayload({ ...validDraft, activities: [] }),
    ).toThrow("Sélectionnez au moins une activité");
  });

  it("validates online channels and delivery zones", () => {
    expect(() =>
      buildProApplicationPayload({
        ...validDraft,
        activities: ["online_seller"],
        onlineSeller: { channels: "Facebook, Instagram", deliveryZones: "" },
      }),
    ).toThrow("zones de livraison");
  });

  it("normalizes comma-separated business lists", () => {
    const payload = buildProApplicationPayload({
      ...validDraft,
      activities: ["online_seller"],
      onlineSeller: {
        channels: "Facebook, Instagram, Facebook",
        deliveryZones: "Matam; Ratoma",
      },
    });

    expect(payload.businessDetails.online_seller).toEqual({
      channels: ["Facebook", "Instagram"],
      delivery_zones: ["Matam", "Ratoma"],
    });
  });

  it("requires a positive whole-GNF minimum order for wholesalers", () => {
    expect(() =>
      buildProApplicationPayload({
        ...validDraft,
        activities: ["wholesaler"],
        wholesaler: { goods: "Riz, huile", minimumOrderGnf: "0" },
      }),
    ).toThrow("montant GNF positif");
  });

  it("supports a courier-only application", () => {
    const payload = buildProApplicationPayload({
      ...validDraft,
      activities: [],
      courierRequested: true,
      vehicleType: "motorcycle",
      vehiclePlate: "CG-1234-AB",
    });

    expect(payload.businessName).toBeNull();
    expect(payload.businessActivities).toEqual([]);
    expect(payload.courierRequested).toBe(true);
    expect(payload.vehicleType).toBe("motorcycle");
  });

  it("rejects invalid courier vehicles and oversized plates", () => {
    expect(() =>
      buildProApplicationPayload({
        ...validDraft,
        activities: [],
        courierRequested: true,
        vehicleType: "spaceship",
      }),
    ).toThrow("moyen de transport valide");

    expect(() =>
      buildProApplicationPayload({
        ...validDraft,
        activities: [],
        courierRequested: true,
        vehicleType: "car",
        vehiclePlate: "123456789012345678901",
      }),
    ).toThrow("ne doit pas dépasser 20");
  });
});
