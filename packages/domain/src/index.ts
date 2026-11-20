/**
 * BamanaShop — Domain Logic
 *
 * Pure business logic functions with no I/O dependencies.
 * Testable, composable, and safe to use in both client and server.
 */

import type {
  GnfAmount,
  Order,
  Product,
  Store,
  DeliveryPartner,
  CommissionRule,
  PaymentMethod,
  OrderStatus,
} from "@bamanashop/contracts";

// Type assertion helper for Zod branded types
const gnf = (n: number): GnfAmount => n as unknown as GnfAmount;

// ============================================================================
// Price & Commission Calculations
// ============================================================================

/** Calculate line total for an order item */
export function calculateLineTotal(
  unitPrice: GnfAmount,
  quantity: number,
): GnfAmount {
  if (quantity <= 0) throw new Error("Quantity must be positive");
  return gnf(unitPrice * quantity);
}

/** Calculate order subtotal from items */
export function calculateSubtotal(
  items: ReadonlyArray<{ unitPrice: GnfAmount; quantity: number }>,
): GnfAmount {
  return gnf(
    items.reduce(
      (sum, item) => sum + calculateLineTotal(item.unitPrice, item.quantity),
      0,
    ),
  );
}

/** Calculate delivery fee based on partner pricing */
export function calculateDeliveryFee(
  partner: DeliveryPartner,
  distanceKm: number | null,
  isCod: boolean,
): GnfAmount {
  let fee: number = partner.base_fee_gnf;
  if (distanceKm !== null && distanceKm > 0) {
    fee += Math.round(partner.per_km_fee_gnf * distanceKm);
  }
  if (isCod) {
    fee += partner.cod_handling_fee_gnf;
  }
  return gnf(fee);
}

/** Calculate payment processing fee (simplified for MVP) */
export function calculatePaymentFee(
  method: PaymentMethod,
  amount: GnfAmount,
): GnfAmount {
  if (method === "cod") return gnf(0);
  return gnf(Math.min(Math.round(amount * 0.015), 5000));
}

/** Find applicable commission rule for a store/category */
export function findCommissionRule(
  rules: ReadonlyArray<CommissionRule>,
  storeId: string,
  categoryId: string,
): CommissionRule | null {
  const now = new Date();
  // Priority: store-specific > category-specific > global
  const storeRule = rules.find(
    (r) =>
      r.is_active &&
      r.scope === "store" &&
      r.scope_id === storeId &&
      new Date(r.effective_from as string) <= now &&
      (r.effective_to === null || new Date(r.effective_to as string) >= now),
  );
  if (storeRule) return storeRule;

  const categoryRule = rules.find(
    (r) =>
      r.is_active &&
      r.scope === "category" &&
      r.scope_id === categoryId &&
      new Date(r.effective_from as string) <= now &&
      (r.effective_to === null || new Date(r.effective_to as string) >= now),
  );
  if (categoryRule) return categoryRule;

  const globalRule = rules.find(
    (r) =>
      r.is_active &&
      r.scope === "global" &&
      new Date(r.effective_from as string) <= now &&
      (r.effective_to === null || new Date(r.effective_to as string) >= now),
  );
  return globalRule ?? null;
}

/** Calculate commission amount from subtotal and rate in basis points */
export function calculateCommission(
  subtotal: GnfAmount,
  rateBps: number,
): GnfAmount {
  return gnf(Math.round((subtotal * rateBps) / 10000));
}

// ============================================================================
// Order Totals
// ============================================================================

export interface OrderTotals {
  subtotal: GnfAmount;
  deliveryFee: GnfAmount;
  paymentFee: GnfAmount;
  total: GnfAmount;
  commission: GnfAmount;
  courierCost: GnfAmount;
  sellerPayable: GnfAmount;
}

export function calculateOrderTotals(params: {
  items: ReadonlyArray<{ unitPrice: GnfAmount; quantity: number }>;
  store: Store;
  partner: DeliveryPartner;
  distanceKm: number | null;
  paymentMethod: PaymentMethod;
  commissionRules: ReadonlyArray<CommissionRule>;
  categoryId: string;
}): OrderTotals {
  const subtotal = calculateSubtotal(params.items);
  const deliveryFee = calculateDeliveryFee(
    params.partner,
    params.distanceKm,
    params.paymentMethod === "cod",
  );
  const paymentFee = calculatePaymentFee(
    params.paymentMethod,
    (subtotal + deliveryFee) as unknown as GnfAmount,
  );
  const total = gnf(subtotal + deliveryFee + paymentFee);

  const commissionRule = findCommissionRule(
    params.commissionRules,
    params.store.id,
    params.categoryId,
  );
  const commissionRate =
    commissionRule?.rate_bps ?? params.store.commission_rate_bps;
  const commission = calculateCommission(subtotal, commissionRate);

  const courierCost = gnf(
    params.partner.base_fee_gnf +
      (params.distanceKm ?? 0) * params.partner.per_km_fee_gnf,
  );
  const sellerPayable = gnf(subtotal - commission - courierCost);

  return {
    subtotal,
    deliveryFee,
    paymentFee,
    total,
    commission,
    courierCost,
    sellerPayable,
  };
}

// ============================================================================
// Order State Machine
// ============================================================================

type ValidTransition = {
  from: OrderStatus;
  to: OrderStatus;
  requiresRole?: "customer" | "seller" | "courier" | "admin";
  condition?: (order: Order) => boolean;
};

const ORDER_TRANSITIONS: ValidTransition[] = [
  { from: "pending", to: "cancelled", requiresRole: "customer" },
  { from: "pending", to: "confirmed", requiresRole: "seller" },
  { from: "confirmed", to: "preparing", requiresRole: "seller" },
  { from: "preparing", to: "ready_for_pickup", requiresRole: "seller" },
  {
    from: "ready_for_pickup",
    to: "cancelled",
    requiresRole: "seller",
    condition: (o) => o.delivery_status === "unassigned",
  },
  {
    from: "ready_for_pickup",
    to: "preparing",
    requiresRole: "admin",
    condition: (o) => o.delivery_status === "assigned",
  },
  {
    from: "ready_for_pickup",
    to: "completed",
    requiresRole: "courier",
    condition: (o) => o.delivery_status === "delivered",
  },
  { from: "pending", to: "cancelled", requiresRole: "admin" },
  { from: "confirmed", to: "cancelled", requiresRole: "admin" },
  { from: "preparing", to: "cancelled", requiresRole: "admin" },
  { from: "completed", to: "returned", requiresRole: "customer" },
  { from: "completed", to: "returned", requiresRole: "admin" },
];

export function canTransitionOrder(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  actorRole: "customer" | "seller" | "courier" | "admin",
  order: Order,
): boolean {
  const transition = ORDER_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === targetStatus,
  );
  if (!transition) return false;
  if (transition.requiresRole && transition.requiresRole !== actorRole)
    return false;
  if (transition.condition && !transition.condition(order)) return false;
  return true;
}

export function getValidNextStatuses(
  currentStatus: OrderStatus,
  actorRole: "customer" | "seller" | "courier" | "admin",
  order: Order,
): OrderStatus[] {
  return ORDER_TRANSITIONS.filter(
    (t) =>
      t.from === currentStatus &&
      (!t.requiresRole || t.requiresRole === actorRole) &&
      (!t.condition || t.condition(order)),
  ).map((t) => t.to);
}

// ============================================================================
// Cart Rules (MVP: mono-seller)
// ============================================================================

export interface CartValidationResult {
  valid: boolean;
  error?: string;
  storeId?: string;
}

export function validateCartItems(
  items: ReadonlyArray<{ storeId: string }>,
): CartValidationResult {
  if (items.length === 0) return { valid: false, error: "Cart is empty" };
  const storeIds = new Set(items.map((i) => i.storeId));
  if (storeIds.size > 1)
    return { valid: false, error: "MVP supports only one store per order" };
  return { valid: true, storeId: items[0].storeId };
}

// ============================================================================
// Stock Validation
// ============================================================================

export interface StockCheckResult {
  available: boolean;
  availableQuantity: number;
  requestedQuantity: number;
}

export function checkStock(
  product: Product,
  requestedQty: number,
  movements: ReadonlyArray<{ productId: string; quantityDelta: number }>,
): StockCheckResult {
  const currentStock = movements
    .filter((m) => m.productId === product.id)
    .reduce((sum, m) => sum + m.quantityDelta, 0);

  return {
    available: currentStock >= requestedQty,
    availableQuantity: currentStock,
    requestedQuantity: requestedQty,
  };
}

export function reserveStock(
  product: Product,
  quantity: number,
  _movements: ReadonlyArray<{ productId: string; quantityDelta: number }>,
): { success: boolean; newStock: number } {
  const check = checkStock(product, quantity, _movements);
  if (!check.available)
    return { success: false, newStock: check.availableQuantity };
  return { success: true, newStock: check.availableQuantity - quantity };
}

// ============================================================================
// Seller Payout Calculation
// ============================================================================

export interface PayoutCalculation {
  grossSales: GnfAmount;
  commission: GnfAmount;
  deliveryCosts: GnfAmount;
  refunds: GnfAmount;
  adjustments: GnfAmount;
  netPayable: GnfAmount;
}

export function calculateSellerPayout(params: {
  orders: ReadonlyArray<{
    subtotal: GnfAmount;
    commission: GnfAmount;
    courierCost: GnfAmount;
    refunds: GnfAmount;
  }>;
  adjustments: GnfAmount;
}): PayoutCalculation {
  const grossSales = gnf(params.orders.reduce((sum, o) => sum + o.subtotal, 0));
  const commission = gnf(
    params.orders.reduce((sum, o) => sum + o.commission, 0),
  );
  const deliveryCosts = gnf(
    params.orders.reduce((sum, o) => sum + o.courierCost, 0),
  );
  const refunds = gnf(params.orders.reduce((sum, o) => sum + o.refunds, 0));

  const netPayable = gnf(
    grossSales - commission - deliveryCosts - refunds + params.adjustments,
  );

  return {
    grossSales,
    commission,
    deliveryCosts,
    refunds,
    adjustments: params.adjustments,
    netPayable,
  };
}

// ============================================================================
// Delivery Fee Estimation (for customer-facing display)
// ============================================================================

export function estimateDeliveryFee(
  partner: DeliveryPartner,
  customerCommune: string,
  storeCommune: string,
  isCod: boolean,
): { estimated: GnfAmount; exact: boolean } {
  const sameCommune =
    customerCommune.toLowerCase() === storeCommune.toLowerCase();
  const estimatedKm = sameCommune ? 0 : 5;
  const fee = calculateDeliveryFee(partner, estimatedKm, isCod);
  return { estimated: fee, exact: false };
}

// ============================================================================
// Financial Journal Helpers
// ============================================================================

export interface FinancialEntryParams {
  orderId: string | null;
  storeId: string | null;
  deliveryJobId: string | null;
  type:
    | "order_revenue"
    | "delivery_fee_collected"
    | "payment_fee"
    | "platform_commission"
    | "courier_cost"
    | "seller_payout"
    | "refund_to_customer"
    | "adjustment";
  amount: number;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
}

export function createFinancialEntry(params: FinancialEntryParams) {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return {
    id: g.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    order_id: params.orderId,
    store_id: params.storeId,
    delivery_job_id: params.deliveryJobId,
    type: params.type,
    amount_gnf: params.amount,
    currency: "GNF",
    description: params.description,
    reference_id: params.referenceId,
    reference_type: params.referenceType,
    created_at: new Date().toISOString(),
  };
}

// ============================================================================
// Formatters
// ============================================================================

export function formatGnf(amount: GnfAmount): string {
  return new Intl.NumberFormat("fr-GN", {
    style: "currency",
    currency: "GNF",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function parseGnf(formatted: string): GnfAmount | null {
  const num = parseInt(formatted.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(num) ? null : (num as unknown as GnfAmount);
}
