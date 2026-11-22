/**
 * BamanaShop — Shared Contracts
 *
 * Zod schemas and TypeScript types for all domain entities.
 * This is the single source of truth for data shapes shared across apps and backend.
 */

import { z } from "zod";

// ============================================================================
// Primitives & Branded Types
// ============================================================================

/** GNF amount in integer minor units (no fractional GNF in product pricing) */
export const GnfAmount = z.number().int().nonnegative().brand<"GnfAmount">();
export type GnfAmount = z.infer<typeof GnfAmount>;

/** ISO 8601 datetime string */
export const IsoDateTime = z.string().datetime().brand<"IsoDateTime">();
export type IsoDateTime = z.infer<typeof IsoDateTime>;

/** UUID v4 */
export const Uuid = z.string().uuid().brand<"Uuid">();
export type Uuid = z.infer<typeof Uuid>;

/** Phone number in E.164 format (e.g., +224XXXXXXXXX for Guinea) */
export const PhoneE164 = z
  .string()
  .regex(/^\+224\d{9}$/)
  .brand<"PhoneE164">();
export type PhoneE164 = z.infer<typeof PhoneE164>;

// ============================================================================
// Enums
// ============================================================================

export const UserRole = z.enum([
  "customer",
  "seller",
  "courier",
  "partner_manager",
  "admin",
  "staff",
]);
export type UserRole = z.infer<typeof UserRole>;

export const RoleStatus = z.enum([
  "pending",
  "approved",
  "suspended",
  "rejected",
]);
export type RoleStatus = z.infer<typeof RoleStatus>;

export const OrderStatus = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const PaymentStatus = z.enum([
  "pending",
  "requires_action",
  "paid",
  "failed",
  "cash_due",
  "cash_collected",
  "refunded",
  "partially_refunded",
  "under_review",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentMethod = z.enum(["cod", "orange_money"]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const DeliveryStatus = z.enum([
  "unassigned",
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "returned",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatus>;

export const PayoutStatus = z.enum([
  "pending",
  "payable",
  "processing",
  "paid",
  "on_hold",
  "disputed",
]);
export type PayoutStatus = z.infer<typeof PayoutStatus>;

export const StoreStatus = z.enum([
  "draft",
  "pending_review",
  "active",
  "suspended",
  "closed",
]);
export type StoreStatus = z.infer<typeof StoreStatus>;

export const ProductStatus = z.enum([
  "draft",
  "active",
  "out_of_stock",
  "archived",
]);
export type ProductStatus = z.infer<typeof ProductStatus>;

export const FinancialEntryType = z.enum([
  "order_revenue",
  "delivery_fee_collected",
  "payment_fee",
  "platform_commission",
  "courier_cost",
  "seller_payout",
  "refund_to_customer",
  "adjustment",
]);
export type FinancialEntryType = z.infer<typeof FinancialEntryType>;

export const DeliveryProofType = z.enum(["photo", "signature", "otp", "note"]);
export type DeliveryProofType = z.infer<typeof DeliveryProofType>;

export const IncidentType = z.enum([
  "customer_unavailable",
  "address_not_found",
  "customer_refused",
  "damaged_goods",
  "vehicle_issue",
  "safety_concern",
  "other",
]);
export type IncidentType = z.infer<typeof IncidentType>;

// ============================================================================
// Core Entities
// ============================================================================

export const Profile = z.object({
  id: Uuid,
  phone: PhoneE164,
  full_name: z.string().min(1).max(120),
  avatar_url: z.string().url().nullable().optional(),
  preferred_language: z.enum(["fr", "en", "ff"]).default("fr"),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Profile = z.infer<typeof Profile>;

export const RoleMembership = z.object({
  id: Uuid,
  user_id: Uuid,
  role: UserRole,
  status: RoleStatus,
  approved_by: Uuid.nullable().optional(),
  approved_at: IsoDateTime.nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type RoleMembership = z.infer<typeof RoleMembership>;

export const SellerProfile = z.object({
  id: Uuid,
  user_id: Uuid,
  business_name: z.string().min(1).max(200),
  business_registration_number: z.string().max(100).nullable().optional(),
  tax_id: z.string().max(100).nullable().optional(),
  bank_account_name: z.string().max(200).nullable().optional(),
  bank_account_number: z.string().max(100).nullable().optional(),
  bank_name: z.string().max(100).nullable().optional(),
  status: RoleStatus,
  approved_by: Uuid.nullable().optional(),
  approved_at: IsoDateTime.nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type SellerProfile = z.infer<typeof SellerProfile>;

export const CourierProfile = z.object({
  id: Uuid,
  user_id: Uuid,
  partner_id: Uuid.nullable().optional(),
  vehicle_type: z
    .enum(["motorcycle", "bicycle", "car", "walking"])
    .nullable()
    .optional(),
  vehicle_plate: z.string().max(20).nullable().optional(),
  status: RoleStatus,
  approved_by: Uuid.nullable().optional(),
  approved_at: IsoDateTime.nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type CourierProfile = z.infer<typeof CourierProfile>;

export const DeliveryPartner = z.object({
  id: Uuid,
  name: z.string().min(1).max(200),
  contact_phone: PhoneE164,
  contact_email: z.string().email().nullable().optional(),
  coverage_zones: z.array(z.string()).default([]),
  base_fee_gnf: GnfAmount,
  per_km_fee_gnf: GnfAmount,
  cod_handling_fee_gnf: GnfAmount,
  is_active: z.boolean().default(true),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type DeliveryPartner = z.infer<typeof DeliveryPartner>;

export const Category = z.object({
  id: Uuid,
  parent_id: Uuid.nullable().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Category = z.infer<typeof Category>;

export const Store = z.object({
  id: Uuid,
  seller_id: Uuid,
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  address_line: z.string().max(500),
  commune: z.string().max(100),
  quartier: z.string().max(100),
  landmark: z.string().max(200).nullable().optional(),
  phone: PhoneE164,
  email: z.string().email().nullable().optional(),
  opening_hours: z.record(z.string()).default({}),
  status: StoreStatus,
  commission_rate_bps: z.number().int().min(0).max(10000).default(1000), // basis points, default 10%
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Store = z.infer<typeof Store>;

export const Product = z.object({
  id: Uuid,
  store_id: Uuid,
  category_id: Uuid,
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  description: z.string().max(5000).nullable().optional(),
  price_gnf: GnfAmount,
  compare_at_price_gnf: GnfAmount.nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
  weight_grams: z.number().int().nonnegative().nullable().optional(),
  status: ProductStatus,
  is_featured: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Product = z.infer<typeof Product>;

export const ProductImage = z.object({
  id: Uuid,
  product_id: Uuid,
  url: z.string().url(),
  alt_text: z.string().max(200).nullable().optional(),
  display_order: z.number().int().default(0),
  created_at: IsoDateTime,
});
export type ProductImage = z.infer<typeof ProductImage>;

export const InventoryMovement = z.object({
  id: Uuid,
  product_id: Uuid,
  quantity_delta: z.number().int(), // positive for restock, negative for sale/reservation
  reason: z.enum([
    "restock",
    "sale",
    "reservation",
    "release",
    "adjustment",
    "return",
  ]),
  reference_id: Uuid.nullable().optional(), // order_id, return_id, etc.
  created_by: Uuid,
  created_at: IsoDateTime,
});
export type InventoryMovement = z.infer<typeof InventoryMovement>;

export const Address = z.object({
  id: Uuid,
  user_id: Uuid,
  label: z.string().max(50).nullable().optional(), // "home", "work", etc.
  commune: z.string().min(1).max(100),
  quartier: z.string().min(1).max(100),
  landmark: z.string().max(200).nullable().optional(),
  street_details: z.string().max(500).nullable().optional(),
  phone: PhoneE164,
  instructions: z.string().max(1000).nullable().optional(),
  is_default: z.boolean().default(false),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Address = z.infer<typeof Address>;

export const Order = z.object({
  id: Uuid,
  customer_id: Uuid,
  store_id: Uuid,
  status: OrderStatus,
  subtotal_gnf: GnfAmount,
  delivery_fee_gnf: GnfAmount,
  payment_fee_gnf: GnfAmount,
  total_gnf: GnfAmount,
  commission_rate_bps: z.number().int().min(0).max(10000),
  commission_gnf: GnfAmount,
  courier_cost_gnf: GnfAmount,
  seller_payable_gnf: GnfAmount,
  payment_method: PaymentMethod,
  payment_status: PaymentStatus,
  delivery_status: DeliveryStatus,
  delivery_address_id: Uuid,
  delivery_address_snapshot: z.object({
    commune: z.string(),
    quartier: z.string(),
    landmark: z.string().nullable().optional(),
    street_details: z.string().nullable().optional(),
    phone: PhoneE164,
    instructions: z.string().nullable().optional(),
  }),
  assigned_courier_id: Uuid.nullable().optional(),
  assigned_partner_id: Uuid.nullable().optional(),
  prepared_at: IsoDateTime.nullable().optional(),
  ready_for_pickup_at: IsoDateTime.nullable().optional(),
  picked_up_at: IsoDateTime.nullable().optional(),
  delivered_at: IsoDateTime.nullable().optional(),
  cancelled_at: IsoDateTime.nullable().optional(),
  cancellation_reason: z.string().max(500).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
  // Optional relations loaded via Supabase joins
  order_items: z.array(z.lazy(() => OrderItem)).optional(),
  delivery_jobs: z.array(z.lazy(() => DeliveryJob)).optional(),
});
export type Order = z.infer<typeof Order>;

export const OrderItem = z.object({
  id: Uuid,
  order_id: Uuid,
  product_id: Uuid,
  product_name: z.string(),
  product_sku: z.string().nullable().optional(),
  unit_price_gnf: GnfAmount,
  quantity: z.number().int().positive(),
  line_total_gnf: GnfAmount,
  created_at: IsoDateTime,
  // Optional relation loaded via Supabase joins
  product: z.object({
    name: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
  }).nullable().optional(),
});
export type OrderItem = z.infer<typeof OrderItem>;

export const Payment = z.object({
  id: Uuid,
  order_id: Uuid,
  method: PaymentMethod,
  status: PaymentStatus,
  amount_gnf: GnfAmount,
  currency: z.literal("GNF"),
  external_reference: z.string().max(200).nullable().optional(),
  provider_response: z.record(z.unknown()).nullable().optional(),
  paid_at: IsoDateTime.nullable().optional(),
  failed_at: IsoDateTime.nullable().optional(),
  failure_reason: z.string().max(500).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Payment = z.infer<typeof Payment>;

export const PaymentEvent = z.object({
  id: Uuid,
  payment_id: Uuid,
  event_type: z.string().max(100),
  provider_event_id: z.string().max(200),
  payload: z.record(z.unknown()),
  processed: z.boolean().default(false),
  processed_at: IsoDateTime.nullable().optional(),
  error: z.string().max(1000).nullable().optional(),
  created_at: IsoDateTime,
});
export type PaymentEvent = z.infer<typeof PaymentEvent>;

export const DeliveryJob = z.object({
  id: Uuid,
  order_id: Uuid,
  partner_id: Uuid,
  courier_id: Uuid.nullable().optional(),
  status: DeliveryStatus,
  pickup_address: z.object({
    commune: z.string(),
    quartier: z.string(),
    landmark: z.string().nullable().optional(),
    street_details: z.string().nullable().optional(),
    phone: PhoneE164,
    store_name: z.string(),
  }),
  dropoff_address: z.object({
    commune: z.string(),
    quartier: z.string(),
    landmark: z.string().nullable().optional(),
    street_details: z.string().nullable().optional(),
    phone: PhoneE164,
    instructions: z.string().nullable().optional(),
  }),
  distance_km: z.number().nonnegative().nullable().optional(),
  estimated_fee_gnf: GnfAmount,
  actual_fee_gnf: GnfAmount.nullable().optional(),
  cod_amount_gnf: GnfAmount.nullable().optional(),
  cod_collected_gnf: GnfAmount.nullable().optional(),
  assigned_at: IsoDateTime.nullable().optional(),
  accepted_at: IsoDateTime.nullable().optional(),
  picked_up_at: IsoDateTime.nullable().optional(),
  delivered_at: IsoDateTime.nullable().optional(),
  failed_at: IsoDateTime.nullable().optional(),
  failure_reason: z.string().max(500).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
  // Optional relation loaded via Supabase joins
  courier: z.object({
    id: Uuid,
    user: z.object({
      full_name: z.string().nullable().optional(),
      phone: PhoneE164.nullable().optional(),
    }).nullable().optional(),
    vehicle_type: z.string().nullable().optional(),
    vehicle_plate: z.string().nullable().optional(),
  }).nullable().optional(),
});
export type DeliveryJob = z.infer<typeof DeliveryJob>;

export const DeliveryEvent = z.object({
  id: Uuid,
  delivery_job_id: Uuid,
  status: DeliveryStatus,
  actor_id: Uuid, // courier or admin
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  created_at: IsoDateTime,
});
export type DeliveryEvent = z.infer<typeof DeliveryEvent>;

export const DeliveryProof = z.object({
  id: Uuid,
  delivery_job_id: Uuid,
  type: DeliveryProofType,
  url: z.string().url().nullable().optional(), // photo/signature
  otp_code: z.string().max(10).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  captured_by: Uuid,
  captured_at: IsoDateTime,
});
export type DeliveryProof = z.infer<typeof DeliveryProof>;

export const Incident = z.object({
  id: Uuid,
  delivery_job_id: Uuid,
  reported_by: Uuid,
  type: IncidentType,
  description: z.string().max(2000),
  resolution: z.string().max(2000).nullable().optional(),
  resolved_by: Uuid.nullable().optional(),
  resolved_at: IsoDateTime.nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Incident = z.infer<typeof Incident>;

export const CommissionRule = z.object({
  id: Uuid,
  name: z.string().min(1).max(100),
  scope: z.enum(["global", "category", "store"]),
  scope_id: Uuid.nullable().optional(), // category_id or store_id
  rate_bps: z.number().int().min(0).max(10000),
  min_order_gnf: GnfAmount.nullable().optional(),
  max_commission_gnf: GnfAmount.nullable().optional(),
  is_active: z.boolean().default(true),
  effective_from: IsoDateTime,
  effective_to: IsoDateTime.nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type CommissionRule = z.infer<typeof CommissionRule>;

export const FinancialEntry = z.object({
  id: Uuid,
  order_id: Uuid.nullable().optional(),
  store_id: Uuid.nullable().optional(),
  delivery_job_id: Uuid.nullable().optional(),
  type: FinancialEntryType,
  amount_gnf: z.number().int(), // can be negative for debits
  currency: z.literal("GNF"),
  description: z.string().max(500),
  reference_id: Uuid.nullable().optional(),
  reference_type: z.string().max(50).nullable().optional(),
  created_at: IsoDateTime,
});
export type FinancialEntry = z.infer<typeof FinancialEntry>;

export const SellerPayout = z.object({
  id: Uuid,
  store_id: Uuid,
  period_start: IsoDateTime,
  period_end: IsoDateTime,
  gross_sales_gnf: GnfAmount,
  total_commission_gnf: GnfAmount,
  total_delivery_cost_gnf: GnfAmount,
  total_refunds_gnf: GnfAmount,
  adjustments_gnf: z.number().int().default(0),
  net_payable_gnf: GnfAmount,
  status: PayoutStatus,
  paid_at: IsoDateTime.nullable().optional(),
  paid_by: Uuid.nullable().optional(),
  payment_reference: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type SellerPayout = z.infer<typeof SellerPayout>;

export const Refund = z.object({
  id: Uuid,
  order_id: Uuid,
  payment_id: Uuid,
  amount_gnf: GnfAmount,
  reason: z.string().max(500),
  status: z.enum([
    "pending",
    "approved",
    "processing",
    "completed",
    "rejected",
  ]),
  approved_by: Uuid.nullable().optional(),
  processed_at: IsoDateTime.nullable().optional(),
  external_reference: z.string().max(200).nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Refund = z.infer<typeof Refund>;

export const SupportTicket = z.object({
  id: Uuid,
  user_id: Uuid,
  order_id: Uuid.nullable().optional(),
  subject: z.string().max(200),
  description: z.string().max(5000),
  status: z.enum([
    "open",
    "in_progress",
    "waiting_customer",
    "waiting_seller",
    "waiting_courier",
    "resolved",
    "closed",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  assigned_to: Uuid.nullable().optional(),
  resolved_at: IsoDateTime.nullable().optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type SupportTicket = z.infer<typeof SupportTicket>;

export const AuditLog = z.object({
  id: Uuid,
  actor_id: Uuid.nullable().optional(),
  action: z.string().max(100),
  entity_type: z.string().max(50),
  entity_id: Uuid,
  old_values: z.record(z.unknown()).nullable().optional(),
  new_values: z.record(z.unknown()).nullable().optional(),
  ip_address: z.string().max(45).nullable().optional(),
  user_agent: z.string().max(500).nullable().optional(),
  created_at: IsoDateTime,
});
export type AuditLog = z.infer<typeof AuditLog>;

// ============================================================================
// API Request/Response Schemas (for Edge Functions / API routes)
// ============================================================================

export const PaginationParams = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type PaginationParams = z.infer<typeof PaginationParams>;

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  });

export const ApiError = z.object({
  code: z.string().max(50),
  message: z.string().max(500),
  details: z.record(z.unknown()).nullable().optional(),
});
export type ApiError = z.infer<typeof ApiError>;

export const ApiSuccess = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

// ============================================================================
// Mock Data Fixtures (for app development before backend ready)
// ============================================================================

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "11111111-1111-1111-1111-111111111111" as Uuid,
    parent_id: null,
    name: "Alimentation",
    slug: "alimentation",
    description: "Produits alimentaires",
    image_url: null,
    display_order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
  {
    id: "22222222-2222-2222-2222-222222222222" as Uuid,
    parent_id: null,
    name: "Électronique",
    slug: "electronique",
    description: "Appareils électroniques",
    image_url: null,
    display_order: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
  {
    id: "33333333-3333-3333-3333-333333333333" as Uuid,
    parent_id: null,
    name: "Mode",
    slug: "mode",
    description: "Vêtements et accessoires",
    image_url: null,
    display_order: 3,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
  {
    id: "44444444-4444-4444-4444-444444444444" as Uuid,
    parent_id: null,
    name: "Maison",
    slug: "maison",
    description: "Articles pour la maison",
    image_url: null,
    display_order: 4,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
];

export const MOCK_STORE: Store = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as Uuid,
  seller_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" as Uuid,
  name: "Boutique Demo Conakry",
  slug: "boutique-demo-conakry",
  description: "Boutique de démonstration pour le développement",
  logo_url: null,
  banner_url: null,
  address_line: "Route de Donka",
  commune: "Dixinn",
  quartier: "Donka",
  landmark: "Près de l'hôpital Donka",
  phone: "+224620000000" as PhoneE164,
  email: "demo@bamanashop.gn",
  opening_hours: { "lundi-samedi": "08:00-20:00", dimanche: "10:00-18:00" },
  status: "active",
  commission_rate_bps: 1000,
  created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1111111-1111-1111-1111-111111111111" as Uuid,
    store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as Uuid,
    category_id: "11111111-1111-1111-1111-111111111111" as Uuid,
    name: "Riz parfumé 5kg",
    slug: "riz-parfume-5kg",
    description: "Riz de qualité supérieure",
    price_gnf: 50000 as GnfAmount,
    compare_at_price_gnf: 55000 as GnfAmount,
    sku: "RIZ-5KG-001",
    barcode: null,
    weight_grams: 5000,
    status: "active",
    is_featured: true,
    images: [],
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
  {
    id: "p2222222-2222-2222-2222-222222222222" as Uuid,
    store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as Uuid,
    category_id: "11111111-1111-1111-1111-111111111111" as Uuid,
    name: "Huile végétale 1L",
    slug: "huile-vegetale-1l",
    description: "Huile de cuisson pure",
    price_gnf: 15000 as GnfAmount,
    compare_at_price_gnf: null,
    sku: "HUILE-1L-001",
    barcode: null,
    weight_grams: 920,
    status: "active",
    is_featured: false,
    images: [],
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
  {
    id: "p3333333-3333-3333-3333-333333333333" as Uuid,
    store_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" as Uuid,
    category_id: "22222222-2222-2222-2222-222222222222" as Uuid,
    name: "Smartphone Android 128Go",
    slug: "smartphone-android-128go",
    description: "Dernier modèle 2025",
    price_gnf: 1200000 as GnfAmount,
    compare_at_price_gnf: 1350000 as GnfAmount,
    sku: "PHONE-AND-128",
    barcode: null,
    weight_grams: 180,
    status: "active",
    is_featured: true,
    images: [],
    created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
    updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  },
];

export const MOCK_CART_ITEMS = [
  { product: MOCK_PRODUCTS[0], quantity: 2 },
  { product: MOCK_PRODUCTS[1], quantity: 1 },
];

export const MOCK_DELIVERY_PARTNER: DeliveryPartner = {
  id: "dddddddd-dddd-dddd-dddd-dddddddddddd" as Uuid,
  name: "Express Guinée",
  contact_phone: "+224620111111" as PhoneE164,
  contact_email: "ops@expressgn.gn",
  coverage_zones: ["Kaloum", "Dixinn", "Matam", "Ratoma", "Matoto"],
  base_fee_gnf: 5000 as GnfAmount,
  per_km_fee_gnf: 1000 as GnfAmount,
  cod_handling_fee_gnf: 2000 as GnfAmount,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z" as IsoDateTime,
  updated_at: "2026-01-01T00:00:00Z" as IsoDateTime,
};
