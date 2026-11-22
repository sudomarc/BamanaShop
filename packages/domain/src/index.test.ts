/**
 * BamanaShop — Domain Logic Tests
 */

import { describe, it, expect } from "vitest";
import {
  calculateLineTotal,
  calculateSubtotal,
  calculateDeliveryFee,
  calculatePaymentFee,
  calculateCommission,
  calculateOrderTotals,
  validateCartItems,
  checkStock,
  reserveStock,
  calculateSellerPayout,
  formatGnf,
  parseGnf,
  canTransitionOrder,
  getValidNextStatuses,
} from "./index";

// Mock data - use plain objects to avoid TypeScript branded type issues in tests
const gnf = (n: number) => n;

// Mock data - plain objects to avoid TypeScript branded type issues
const mockStore = {
  id: "store-1",
  commission_rate_bps: 1000,
};

const mockPartner = {
  base_fee_gnf: 5000,
  per_km_fee_gnf: 1000,
  cod_handling_fee_gnf: 2000,
};

const createMockOrder = (overrides: Record<string, any> = {}) => ({
  id: "order-1",
  customer_id: "customer-1",
  store_id: "store-1",
  status: "pending",
  subtotal_gnf: 0,
  delivery_fee_gnf: 0,
  payment_fee_gnf: 0,
  total_gnf: 0,
  commission_rate_bps: 1000,
  commission_gnf: 0,
  courier_cost_gnf: 0,
  seller_payable_gnf: 0,
  payment_method: "cod",
  payment_status: "pending",
  delivery_status: "unassigned",
  delivery_address_id: "addr-1",
  delivery_address_snapshot: {
    commune: "Matam",
    quartier: "Hamdallaye",
    landmark: null,
    street_details: null,
    phone: "+224620000001",
    instructions: null,
  },
  assigned_courier_id: null,
  assigned_partner_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const mockProduct = { id: "prod-1" };

describe("Price & Commission Calculations", () => {
  it("calculateLineTotal returns correct total", () => {
    // The function returns branded types, so we test with plain numbers
    expect(calculateLineTotal(50000 as any, 2)).toBe(100000);
    expect(calculateLineTotal(15000 as any, 1)).toBe(15000);
  });

  it("calculateLineTotal throws for zero or negative quantity", () => {
    expect(() => calculateLineTotal(50000 as any, 0)).toThrow(
      "Quantity must be positive",
    );
    expect(() => calculateLineTotal(50000 as any, -1)).toThrow(
      "Quantity must be positive",
    );
  });

  it("calculateSubtotal sums items correctly", () => {
    const items = [
      { unitPrice: 50000 as any, quantity: 2 },
      { unitPrice: 15000 as any, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(115000);
  });

  it("calculateDeliveryFee computes base + per km + COD", () => {
    const fee = calculateDeliveryFee(
      {
        base_fee_gnf: 5000,
        per_km_fee_gnf: 1000,
        cod_handling_fee_gnf: 2000,
      } as any,
      5,
      true,
    );
    // base 5000 + 5km * 1000 + COD 2000 = 12000
    expect(fee).toBe(12000);
  });

  it("calculateDeliveryFee computes base only for same commune COD", () => {
    const fee = calculateDeliveryFee(
      {
        base_fee_gnf: 5000,
        per_km_fee_gnf: 1000,
        cod_handling_fee_gnf: 2000,
      } as any,
      0,
      true,
    );
    // base 5000 + COD 2000 = 7000
    expect(fee).toBe(7000);
  });

  it("calculatePaymentFee returns 0 for COD", () => {
    expect(calculatePaymentFee("cod" as any, 100000 as any)).toBe(0);
  });

  it("calculatePaymentFee returns 1.5% capped at 5000 for Orange Money", () => {
    expect(calculatePaymentFee("orange_money" as any, 100000 as any)).toBe(
      1500,
    );
    expect(calculatePaymentFee("orange_money" as any, 500000 as any)).toBe(
      5000,
    ); // capped
  });

  it("calculateCommission calculates basis points correctly", () => {
    expect(calculateCommission(100000 as any, 1000)).toBe(10000); // 10%
    expect(calculateCommission(50000 as any, 800)).toBe(4000); // 8%
  });
});

describe("Order Totals", () => {
  const mockStore = { id: "store-1", commission_rate_bps: 1000 };
  const mockPartner = {
    base_fee_gnf: 5000,
    per_km_fee_gnf: 1000,
    cod_handling_fee_gnf: 2000,
  };

  it("calculateOrderTotals computes all amounts correctly", () => {
    const result = calculateOrderTotals({
      items: [
        { unitPrice: 50000 as any, quantity: 2 },
        { unitPrice: 15000 as any, quantity: 1 },
      ],
      store: mockStore as any,
      partner: {
        base_fee_gnf: 5000,
        per_km_fee_gnf: 1000,
        cod_handling_fee_gnf: 2000,
      } as any,
      distanceKm: 5,
      paymentMethod: "cod" as any,
      commissionRules: [],
      categoryId: "cat-1",
    });

    expect(result.subtotal).toBe(115000);
    expect(result.deliveryFee).toBe(12000); // 5000 + 5000 + 2000
    expect(result.paymentFee).toBe(0);
    expect(result.total).toBe(127000);
    expect(result.commission).toBe(11500); // 1000 bps = 10%
    expect(result.courierCost).toBe(10000); // 5000 + 5000
    expect(result.sellerPayable).toBe(93500); // 115000 - 11500 - 10000
  });

  it("calculateOrderTotals with Orange Money includes payment fee on subtotal + delivery", () => {
    const result = calculateOrderTotals({
      items: [{ unitPrice: 100000 as any, quantity: 1 }],
      store: { id: "store-1", commission_rate_bps: 1000 } as any,
      partner: {
        base_fee_gnf: 5000,
        per_km_fee_gnf: 1000,
        cod_handling_fee_gnf: 2000,
      } as any,
      distanceKm: 0,
      paymentMethod: "orange_money" as any,
      commissionRules: [],
      categoryId: "cat-1",
    });

    // Payment fee is 1.5% of (subtotal + deliveryFee) = 1.5% of 105000 = 1575
    expect(result.paymentFee).toBe(1575);
    expect(result.total).toBe(106575); // 100000 + 5000 + 1575
  });
});

describe("Cart Validation", () => {
  it("validateCartItems rejects empty cart", () => {
    const result = validateCartItems([]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Cart is empty");
  });

  it("validateCartItems accepts single store", () => {
    const result = validateCartItems([
      { storeId: "store-1" },
      { storeId: "store-1" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.storeId).toBe("store-1");
  });

  it("validateCartItems rejects multiple stores", () => {
    const result = validateCartItems([
      { storeId: "store-1" },
      { storeId: "store-2" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("MVP supports only one store per order");
  });
});

describe("Stock Validation", () => {
  const mockProduct = { id: "prod-1" };
  const movements = [
    { productId: "prod-1", quantityDelta: 100 },
    { productId: "prod-1", quantityDelta: -20 },
  ];

  it("checkStock returns available when stock sufficient", () => {
    const result = checkStock({ id: "prod-1" } as any, 50, movements);
    expect(result.available).toBe(true);
    expect(result.availableQuantity).toBe(80);
  });

  it("checkStock returns unavailable when stock insufficient", () => {
    const result = checkStock({ id: "prod-1" } as any, 100, movements);
    expect(result.available).toBe(false);
    expect(result.availableQuantity).toBe(80);
  });

  it("reserveStock succeeds when stock available", () => {
    const result = reserveStock({ id: "prod-1" } as any, 30, movements);
    expect(result.success).toBe(true);
    expect(result.newStock).toBe(50);
  });

  it("reserveStock fails when stock insufficient", () => {
    const result = reserveStock({ id: "prod-1" } as any, 100, movements);
    expect(result.success).toBe(false);
  });
});

describe("Seller Payout Calculation", () => {
  it("calculateSellerPayout computes net payable correctly", () => {
    const orders = [
      {
        subtotal: 100000,
        commission: 10000,
        courierCost: 5000,
        refunds: 0,
      } as any,
      {
        subtotal: 50000,
        commission: 5000,
        courierCost: 3000,
        refunds: 2000,
      } as any,
    ];
    const result = calculateSellerPayout({ orders, adjustments: 1000 as any });
    expect(result.grossSales).toBe(150000);
    expect(result.commission).toBe(15000);
    expect(result.deliveryCosts).toBe(8000);
    expect(result.refunds).toBe(2000);
    expect(result.adjustments).toBe(1000);
    expect(result.netPayable).toBe(126000); // 150000 - 15000 - 8000 - 2000 + 1000
  });
});

describe("Formatters", () => {
  it("formatGnf formats amount correctly", () => {
    expect(formatGnf(50000 as any)).toContain("50");
    expect(formatGnf(1250000 as any)).toContain("1");
  });

  it("parseGnf parses formatted string", () => {
    expect(parseGnf("50 000 GNF")).toBe(50000);
    expect(parseGnf("1 250 000 GNF")).toBe(1250000);
  });

  it("parseGnf returns null for invalid input", () => {
    expect(parseGnf("invalid")).toBeNull();
  });
});

describe("Order State Machine", () => {
  const mockOrder = {
    id: "order-1",
    customer_id: "customer-1",
    store_id: "store-1",
    status: "pending",
    subtotal_gnf: 0,
    delivery_fee_gnf: 0,
    payment_fee_gnf: 0,
    total_gnf: 0,
    commission_rate_bps: 1000,
    commission_gnf: 0,
    courier_cost_gnf: 0,
    seller_payable_gnf: 0,
    payment_method: "cod",
    payment_status: "pending",
    delivery_status: "unassigned",
    delivery_address_id: "addr-1",
    delivery_address_snapshot: {
      commune: "Matam",
      quartier: "Hamdallaye",
      landmark: null,
      street_details: null,
      phone: "+224620000001",
      instructions: null,
    },
    assigned_courier_id: null,
    assigned_partner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("canTransitionOrder allows customer to cancel pending", () => {
    expect(
      canTransitionOrder(
        "pending",
        "cancelled",
        "customer" as any,
        {
          id: "order-1",
          status: "pending",
          delivery_status: "unassigned",
        } as any,
      ),
    ).toBe(true);
  });

  it("canTransitionOrder denies customer confirming", () => {
    expect(
      canTransitionOrder(
        "pending",
        "confirmed",
        "customer" as any,
        {
          id: "order-1",
          status: "pending",
          delivery_status: "unassigned",
        } as any,
      ),
    ).toBe(false);
  });

  it("canTransitionOrder allows seller to confirm", () => {
    expect(
      canTransitionOrder(
        "pending",
        "confirmed",
        "seller" as any,
        {
          id: "order-1",
          status: "pending",
          delivery_status: "unassigned",
        } as any,
      ),
    ).toBe(true);
  });

  it("canTransitionOrder allows seller to prepare", () => {
    expect(
      canTransitionOrder(
        "confirmed",
        "preparing",
        "seller" as any,
        {
          id: "order-1",
          status: "confirmed",
          delivery_status: "unassigned",
        } as any,
      ),
    ).toBe(true);
  });

  it("canTransitionOrder allows seller to ready_for_pickup", () => {
    const preparingOrder = {
      id: "order-1",
      status: "preparing",
      delivery_status: "unassigned",
    };
    expect(
      canTransitionOrder(
        "preparing",
        "ready_for_pickup",
        "seller" as any,
        preparingOrder as any,
      ),
    ).toBe(true);
  });

  it("canTransitionOrder denies seller ready_for_pickup when assigned", () => {
    const assignedOrder = {
      id: "order-1",
      status: "ready_for_pickup",
      delivery_status: "assigned",
    };
    expect(
      canTransitionOrder(
        "ready_for_pickup",
        "cancelled",
        "seller" as any,
        assignedOrder as any,
      ),
    ).toBe(false);
  });

  it("getValidNextStatuses returns correct transitions for seller", () => {
    const statuses = getValidNextStatuses(
      "pending",
      "seller" as any,
      {
        id: "order-1",
        status: "pending",
        delivery_status: "unassigned",
      } as any,
    );
    // Seller can confirm (cancel allowed for pending but only for customer/admin)
    expect(statuses).toContain("confirmed");
    expect(statuses).not.toContain("cancelled");
  });
});