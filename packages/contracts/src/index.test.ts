/**
 * BamanaShop — Contracts Tests
 *
 * Tests for Zod schemas and type inference.
 */

import { describe, it, expect } from "vitest";
import {
  GnfAmount,
  PhoneE164,
  IsoDateTime,
  Uuid,
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Profile,
  SellerProfile,
  Store,
  Product,
  Order,
  MOCK_CATEGORIES,
  MOCK_STORE,
  MOCK_PRODUCTS,
  MOCK_DELIVERY_PARTNER,
  PaginationParams,
  ApiError,
  ApiSuccess,
} from "./index";

describe("Primitive Types", () => {
  it("GnfAmount accepts valid non-negative integers", () => {
    expect(GnfAmount.safeParse(0).success).toBe(true);
    expect(GnfAmount.safeParse(50000).success).toBe(true);
    expect(GnfAmount.safeParse(1250000).success).toBe(true);
  });

  it("GnfAmount rejects negative numbers", () => {
    expect(GnfAmount.safeParse(-1).success).toBe(false);
  });

  it("GnfAmount rejects non-integers", () => {
    expect(GnfAmount.safeParse(50000.5).success).toBe(false);
  });

  it("PhoneE164 accepts valid Guinea numbers", () => {
    expect(PhoneE164.safeParse("+224620000001").success).toBe(true);
    expect(PhoneE164.safeParse("+224620123456").success).toBe(true);
  });

  it("PhoneE164 rejects invalid formats", () => {
    expect(PhoneE164.safeParse("224620000001").success).toBe(false); // missing +
    expect(PhoneE164.safeParse("+33620000001").success).toBe(false); // wrong country code
    expect(PhoneE164.safeParse("+22462000000").success).toBe(false); // too short
  });

  it("IsoDateTime accepts valid ISO dates", () => {
    expect(IsoDateTime.safeParse("2026-11-19T10:30:00Z").success).toBe(true);
    expect(IsoDateTime.safeParse("2026-01-01T00:00:00.000Z").success).toBe(
      true,
    );
  });

  it("IsoDateTime rejects invalid dates", () => {
    expect(IsoDateTime.safeParse("2026-11-19").success).toBe(false);
    expect(IsoDateTime.safeParse("invalid").success).toBe(false);
  });

  it("Uuid accepts valid UUIDs", () => {
    expect(Uuid.safeParse("123e4567-e89b-12d3-a456-426614174000").success).toBe(
      true,
    );
    expect(Uuid.safeParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").success).toBe(
      true,
    );
  });

  it("Uuid rejects invalid UUIDs", () => {
    expect(Uuid.safeParse("invalid").success).toBe(false);
    expect(Uuid.safeParse("123").success).toBe(false);
  });
});

describe("Enums", () => {
  it("UserRole accepts valid roles", () => {
    [
      "customer",
      "seller",
      "courier",
      "partner_manager",
      "admin",
      "staff",
    ].forEach((role) => {
      expect(UserRole.safeParse(role).success).toBe(true);
    });
  });

  it("UserRole rejects invalid roles", () => {
    expect(UserRole.safeParse("invalid").success).toBe(false);
    expect(UserRole.safeParse("buyer").success).toBe(false);
  });

  it("OrderStatus accepts valid statuses", () => {
    [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "completed",
      "cancelled",
      "returned",
    ].forEach((status) => {
      expect(OrderStatus.safeParse(status).success).toBe(true);
    });
  });

  it("PaymentStatus accepts valid statuses", () => {
    [
      "pending",
      "requires_action",
      "paid",
      "failed",
      "cash_due",
      "cash_collected",
      "refunded",
      "partially_refunded",
      "under_review",
    ].forEach((status) => {
      expect(PaymentStatus.safeParse(status).success).toBe(true);
    });
  });

  it("PaymentMethod accepts cod and orange_money", () => {
    expect(PaymentMethod.safeParse("cod").success).toBe(true);
    expect(PaymentMethod.safeParse("orange_money").success).toBe(true);
  });

  it("PaymentMethod rejects other methods", () => {
    expect(PaymentMethod.safeParse("card").success).toBe(false);
    expect(PaymentMethod.safeParse("bank_transfer").success).toBe(false);
  });
});

describe("Entity Schemas", () => {
  it("Profile validates correctly", () => {
    const profile = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      phone: "+224620000001",
      full_name: "Mamadou Diallo",
      avatar_url: null,
      preferred_language: "fr",
      created_at: "2026-11-19T10:00:00Z",
      updated_at: "2026-11-19T10:00:00Z",
    };
    expect(Profile.safeParse(profile).success).toBe(true);
  });

  it("Profile rejects invalid data", () => {
    const profile = {
      id: "invalid",
      phone: "224620000001", // missing +
      full_name: "",
      preferred_language: "xx",
      created_at: "invalid",
      updated_at: "invalid",
    };
    const result = Profile.safeParse(profile);
    expect(result.success).toBe(false);
  });

  it("SellerProfile validates multiple business activities and details", () => {
    const sellerProfile = {
      id: "55555555-5555-5555-5555-555555555555",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      business_name: "Boutique Aissata",
      business_activities: ["physical_store", "online_seller"],
      business_details: {
        physical_store: {
          commune: "Dixinn",
          quartier: "Donka",
          address_line: "Route de Donka",
        },
        online_seller: {
          channels: ["Facebook", "Instagram"],
          delivery_zones: ["Matam", "Ratoma"],
        },
      },
      status: "pending",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    expect(SellerProfile.safeParse(sellerProfile).success).toBe(true);
  });

  it("SellerProfile defaults missing activity metadata", () => {
    const sellerProfile = {
      id: "55555555-5555-5555-5555-555555555555",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      business_name: "Boutique Aissata",
      status: "pending",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const parsed = SellerProfile.safeParse(sellerProfile);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.business_activities).toEqual([]);
      expect(parsed.data.business_details).toEqual({});
    }
  });

  it("Store validates correctly", () => {
    const store = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      seller_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Boutique Test",
      slug: "boutique-test",
      description: null,
      logo_url: null,
      banner_url: null,
      address_line: "Route de Donka",
      commune: "Dixinn",
      quartier: "Donka",
      landmark: "Près hôpital",
      phone: "+224620000002",
      email: "test@bamanashop.gn",
      opening_hours: {},
      status: "active",
      commission_rate_bps: 1000,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(Store.safeParse(store).success).toBe(true);
  });

  it("Store rejects invalid commission_rate_bps", () => {
    const store = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      seller_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Boutique Test",
      slug: "boutique-test",
      address_line: "Route",
      commune: "Dixinn",
      quartier: "Donka",
      phone: "+224620000002",
      commission_rate_bps: 15000, // exceeds 10000
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(Store.safeParse(store).success).toBe(false);
  });

  it("Product validates correctly", () => {
    const product = {
      id: "11111111-1111-1111-1111-111111111111",
      store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      category_id: "11111111-1111-1111-1111-111111111111",
      name: "Riz 5kg",
      slug: "riz-5kg",
      description: null,
      price_gnf: 50000,
      compare_at_price_gnf: null,
      sku: "RIZ-5KG-001",
      barcode: null,
      weight_grams: 5000,
      status: "active",
      is_featured: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const result = Product.safeParse(product);
    if (!result.success) {
      console.log("Product validation errors:", result.error.issues);
    }
    expect(result.success).toBe(true);
  });

  it("Product rejects negative price", () => {
    const product = {
      id: "p1111111-1111-1111-1111-111111111111",
      store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      category_id: "11111111-1111-1111-1111-111111111111",
      name: "Test",
      slug: "test",
      price_gnf: -100,
      status: "active",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(Product.safeParse(product).success).toBe(false);
  });

  it("Order validates correctly", () => {
    const order = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      customer_id: "c1111111-1111-1111-1111-111111111111",
      store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      status: "pending",
      subtotal_gnf: 50000,
      delivery_fee_gnf: 5000,
      payment_fee_gnf: 0,
      total_gnf: 55000,
      commission_rate_bps: 1000,
      commission_gnf: 5000,
      courier_cost_gnf: 5000,
      seller_payable_gnf: 40000,
      payment_method: "cod",
      payment_status: "pending",
      delivery_status: "unassigned",
      delivery_address_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      delivery_address_snapshot: {
        commune: "Matam",
        quartier: "Hamdallaye",
        landmark: "Mosquée",
        street_details: null,
        phone: "+224620000001",
        instructions: null,
      },
      created_at: "2026-11-19T10:00:00Z",
      updated_at: "2026-11-19T10:00:00Z",
    };
    const result = Order.safeParse(order);
    if (!result.success) {
      console.log("Order validation errors:", result.error.issues);
    }
    expect(result.success).toBe(true);
  });
});

describe("Mock Data Fixtures", () => {
  it("MOCK_CATEGORIES has 4 categories", () => {
    expect(MOCK_CATEGORIES).toHaveLength(4);
    expect(MOCK_CATEGORIES[0].name).toBe("Alimentation");
  });

  it("MOCK_STORE has correct data", () => {
    expect(MOCK_STORE.name).toBe("Boutique Demo Conakry");
    expect(MOCK_STORE.commune).toBe("Dixinn");
    expect(MOCK_STORE.status).toBe("active");
  });

  it("MOCK_PRODUCTS has 3 products", () => {
    expect(MOCK_PRODUCTS).toHaveLength(3);
    expect(MOCK_PRODUCTS[0].name).toBe("Riz parfumé 5kg");
    expect(MOCK_PRODUCTS[0].price_gnf).toBe(50000);
  });

  it("MOCK_DELIVERY_PARTNER has correct data", () => {
    expect(MOCK_DELIVERY_PARTNER.name).toBe("Express Guinée");
    expect(MOCK_DELIVERY_PARTNER.base_fee_gnf).toBe(5000);
  });
});

describe("API Response Schemas", () => {
  it("PaginationParams validates", () => {
    PaginationParams.parse({ page: 1, limit: 20 });
  });

  it("ApiError validates", () => {
    ApiError.parse({ code: "NOT_FOUND", message: "Resource not found" });
  });

  it("ApiSuccess wraps data", () => {
    const success = ApiSuccess(Store);
    const result = success.safeParse({ data: MOCK_STORE });
    expect(result.success).toBe(true);
  });
});
