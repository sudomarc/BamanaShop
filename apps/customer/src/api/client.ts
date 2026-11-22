/**
 * BamanaShop — API Client
 * Supabase-based API with fallback to mock data for development
 */

import { createSupabaseClient, isSupabaseConfigured } from "@/utils/supabase";
import type { Database } from "@/types/database";
import type {
  Category,
  Product,
  Store,
  Address,
  Order,
  PaymentMethod,
  OrderStatus,
  ProductStatus,
  PaymentStatus,
  DeliveryStatus,
  StoreStatus,
  GnfAmount,
  Uuid,
  PhoneE164,
  IsoDateTime,
} from "@bamanashop/contracts";
import {
  MOCK_CATEGORIES,
  MOCK_STORE,
  MOCK_PRODUCTS,
} from "@bamanashop/contracts";

const supabase = createSupabaseClient();

// Check if we're in mock mode (no Supabase config)
const isMockMode = !isSupabaseConfigured;

// ---------------------------------------------------------------------------
// DB row -> contract entity mappers
// database.ts rows carry plain `string`/`number` ids and amounts, while the
// shared contracts brand them (Uuid, GnfAmount, PhoneE164). Map explicitly at
// the boundary instead of casting through `any` or `unknown`.
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

function mapOrder(row: OrderRow): Order {
  return {
    ...row,
    id: row.id as Uuid,
    customer_id: row.customer_id as Uuid,
    store_id: row.store_id as Uuid,
    delivery_address_id: row.delivery_address_id as Uuid,
    assigned_courier_id: row.assigned_courier_id as Uuid | null,
    assigned_partner_id: row.assigned_partner_id as Uuid | null,
    status: row.status as OrderStatus,
    payment_method: row.payment_method as PaymentMethod,
    payment_status: row.payment_status as PaymentStatus,
    delivery_status: row.delivery_status as DeliveryStatus,
    subtotal_gnf: row.subtotal_gnf as GnfAmount,
    delivery_fee_gnf: row.delivery_fee_gnf as GnfAmount,
    payment_fee_gnf: row.payment_fee_gnf as GnfAmount,
    total_gnf: row.total_gnf as GnfAmount,
    commission_gnf: row.commission_gnf as GnfAmount,
    courier_cost_gnf: row.courier_cost_gnf as GnfAmount,
    delivery_address_snapshot:
      row.delivery_address_snapshot as Order["delivery_address_snapshot"],
    seller_payable_gnf: row.seller_payable_gnf as GnfAmount,
    prepared_at: row.prepared_at as IsoDateTime | null,
    ready_for_pickup_at: row.ready_for_pickup_at as IsoDateTime | null,
    picked_up_at: row.picked_up_at as IsoDateTime | null,
    delivered_at: row.delivered_at as IsoDateTime | null,
    cancelled_at: row.cancelled_at as IsoDateTime | null,
    created_at: row.created_at as IsoDateTime,
    updated_at: row.updated_at as IsoDateTime,
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    ...row,
    id: row.id as Uuid,
    store_id: row.store_id as Uuid,
    category_id: row.category_id as Uuid,
    price_gnf: row.price_gnf as GnfAmount,
    compare_at_price_gnf: row.compare_at_price_gnf as GnfAmount | null,
    status: row.status as ProductStatus,
    created_at: row.created_at as IsoDateTime,
    updated_at: row.updated_at as IsoDateTime,
    images: [],
  };
}

function mapStore(row: StoreRow): Store {
  return {
    ...row,
    id: row.id as Uuid,
    seller_id: row.seller_id as Uuid,
    phone: row.phone as PhoneE164,
    status: row.status as StoreStatus,
    opening_hours: row.opening_hours as Record<string, string>,
    created_at: row.created_at as IsoDateTime,
    updated_at: row.updated_at as IsoDateTime,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    ...row,
    id: row.id as Uuid,
    parent_id: row.parent_id as Uuid | null,
    created_at: row.created_at as IsoDateTime,
    updated_at: row.updated_at as IsoDateTime,
  };
}

function mapAddress(row: AddressRow): Address {
  return {
    ...row,
    id: row.id as Uuid,
    user_id: row.user_id as Uuid,
    phone: row.phone as PhoneE164,
    created_at: row.created_at as IsoDateTime,
    updated_at: row.updated_at as IsoDateTime,
  };
}

// ============================================================================
// Generic API Helpers
// ============================================================================

// Preserve the table literal type so Supabase query builder methods resolve to
// the correct row type instead of collapsing to `never`.
type TableName = keyof Database["public"]["Tables"];

async function from<Tables extends TableName>(table: Tables) {
  return supabase.from(table);
}

export type {
  Category,
  Product,
  Store,
  Address,
  Order,
  PaymentMethod,
  OrderStatus,
  ProductStatus,
  PaymentStatus,
  DeliveryStatus,
  StoreStatus,
  GnfAmount,
  Uuid,
  PhoneE164,
  IsoDateTime,
};

export async function fetchFeaturedProducts(): Promise<Product[]> {
  return fetchProducts({ featured: true, limit: 10 });
}

export async function fetchFeaturedStores(): Promise<Store[]> {
  return fetchStores({ limit: 10 });
}

// ============================================================================
// Categories
// ============================================================================

export async function fetchCategories(): Promise<Category[]> {
  if (isMockMode) return MOCK_CATEGORIES;

  const { data, error } = await (
    await from("categories")
  )
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export async function fetchCategoryWithProducts(
  slug: string,
): Promise<{ category: Category | null; products: Product[] }> {
  if (isMockMode) {
    const category = MOCK_CATEGORIES.find((c) => c.slug === slug) ?? null;
    const products = category
      ? MOCK_PRODUCTS.filter((p) => p.category_id === category.id)
      : [];
    return { category, products };
  }

  const { data: categoryData } = await (
    await from("categories")
  )
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!categoryData) return { category: null, products: [] };

  const { data: products } = await (
    await from("products")
  )
    .select("*")
    .eq("category_id", categoryData.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return {
    category: categoryData ? mapCategory(categoryData) : null,
    products: (products ?? []).map(mapProduct),
  };
}

// ============================================================================
// Stores
// ============================================================================

export async function fetchStores(params?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Store[]> {
  if (isMockMode) return [MOCK_STORE];

  let query = (await from("stores")).select("*").eq("status", "active");

  if (params?.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit ?? 20) - 1,
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapStore);
}

export async function fetchStore(id: string): Promise<Store | null> {
  if (isMockMode) return id === MOCK_STORE.id ? MOCK_STORE : null;

  const { data, error } = await (
    await from("stores")
  )
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data ? mapStore(data) : null;
}

export async function fetchStoreProducts(
  storeId: string,
  categoryId?: string,
): Promise<Product[]> {
  if (isMockMode)
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.store_id === storeId && (!categoryId || p.category_id === categoryId),
    );

  let query = (await from("products"))
    .select("*")
    .eq("store_id", storeId)
    .eq("status", "active");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query.order("is_featured", {
    ascending: false,
  });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

// ============================================================================
// Products
// ============================================================================

export async function fetchProducts(params?: {
  storeId?: string;
  categoryId?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  if (isMockMode)
    return MOCK_PRODUCTS.filter((p) => {
      if (params?.storeId && p.store_id !== params.storeId) return false;
      if (params?.categoryId && p.category_id !== params.categoryId)
        return false;
      if (params?.featured !== undefined && p.is_featured !== params.featured)
        return false;
      if (params?.search) {
        const search = params.search.toLowerCase();
        return p.name.toLowerCase().includes(search);
      }
      return true;
    });

  let query = (await from("products")).select("*").eq("status", "active");

  if (params?.storeId) query = query.eq("store_id", params.storeId);
  if (params?.categoryId) query = query.eq("category_id", params.categoryId);
  if (params?.featured) query = query.eq("is_featured", true);
  if (params?.search) query = query.ilike("name", `%${params.search}%`);
  if (params?.limit) query = query.limit(params.limit);
  if (params?.offset)
    query = query.range(
      params.offset,
      params.offset + (params.limit ?? 20) - 1,
    );

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchProduct(id: string): Promise<Product | null> {
  if (isMockMode) return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;

  const { data, error } = await (
    await from("products")
  )
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data ? mapProduct(data) : null;
}

export async function fetchProductImages(productId: string): Promise<string[]> {
  if (isMockMode) return [];

  const { data, error } = await (
    await from("product_images")
  )
    .select("url")
    .eq("product_id", productId)
    .order("display_order");

  if (error) throw error;
  return data?.map((i) => i.url) ?? [];
}

// ============================================================================
// Cart (local persistence with AsyncStorage)
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_STORAGE_KEY = "@bamanashop:cart";

export interface CartItem {
  product: Product;
  quantity: number;
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function addToCart(
  product: Product,
  quantity: number = 1,
): Promise<void> {
  const cart = await getCart();
  const existingIndex = cart.findIndex((i) => i.product.id === product.id);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product, quantity });
  }

  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export async function updateCartQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const cart = await getCart();
  const updated =
    quantity <= 0
      ? cart.filter((i) => i.product.id !== productId)
      : cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i));

  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
}

export async function removeFromCart(productId: string): Promise<void> {
  const cart = await getCart();
  const updated = cart.filter((i) => i.product.id !== productId);
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
}

export async function clearCart(): Promise<void> {
  await AsyncStorage.removeItem(CART_STORAGE_KEY);
}

// ============================================================================
// Addresses
// ============================================================================

export async function fetchAddresses(): Promise<Address[]> {
  if (isMockMode)
    return [
      {
        id: "addr-1" as Uuid,
        user_id: "mock-user" as Uuid,
        label: "Domicile",
        commune: "Matam",
        quartier: "Hamdallaye",
        landmark: "Près de la mosquée",
        phone: "+224620000000" as PhoneE164,
        is_default: true,
        created_at: new Date().toISOString() as IsoDateTime,
        updated_at: new Date().toISOString() as IsoDateTime,
      },
    ];

  const { data, error } = await (
    await from("addresses")
  )
    .select("*")
    .order("is_default", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapAddress);
}

export async function createAddress(
  address: Omit<Address, "id" | "created_at" | "updated_at">,
): Promise<Address> {
  if (isMockMode)
    return {
      ...address,
      id: "mock-new" as Uuid,
      created_at: "" as IsoDateTime,
      updated_at: "" as IsoDateTime,
    };

  const { data, error } = await (
    await from("addresses")
  )
    .insert(address)
    .select()
    .single();

  if (error) throw error;
  return mapAddress(data!);
}

export async function updateAddress(
  id: string,
  updates: Partial<Address>,
): Promise<Address> {
  if (isMockMode) return { ...updates, id } as Address;

  const { data, error } = await (
    await from("addresses")
  )
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAddress(data!);
}

export async function deleteAddress(id: string): Promise<void> {
  if (isMockMode) return;

  const { error } = await (await from("addresses")).delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(id: string): Promise<void> {
  if (isMockMode) return;

  // First unset all defaults
  await (await from("addresses")).update({ is_default: false }).neq("id", id);
  // Then set the new default
  const { error } = await (
    await from("addresses")
  )
    .update({ is_default: true })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Orders
// ============================================================================

export async function fetchOrders(params?: {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  if (isMockMode) return [];

  let query = (await from("orders")).select(`
    *,
    order_items (
      *,
      product:products (
        name,
        slug
      )
    ),
    delivery_jobs (
      id,
      status,
      courier:courier_profiles (
        id,
        user:profiles (
          full_name,
          phone
        )
      )
    )
  `);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  query = query.order("created_at", { ascending: false });

  if (params?.limit) query = query.limit(params.limit);
  if (params?.offset)
    query = query.range(
      params.offset,
      params.offset + (params.limit ?? 20) - 1,
    );

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function fetchOrder(id: string): Promise<Order | null> {
  if (isMockMode) return null;

  const { data, error } = await (
    await from("orders")
  )
    .select(
      `
      *,
      order_items (
        *,
        product:products (
          name,
          slug,
          price_gnf
        )
      ),
      payment:payments (*),
      delivery_jobs (
        *,
        courier:courier_profiles (
          id,
          user:profiles (
            full_name,
            phone
          )
        ),
        delivery_events (*),
        delivery_proofs (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data ? mapOrder(data) : null;
}

export async function createOrder(params: {
  customerId: string;
  storeId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  deliveryAddressId: string;
  deliveryAddressSnapshot: Order["delivery_address_snapshot"];
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  paymentFee: number;
  total: number;
  commissionRateBps: number;
  commission: number;
  courierCost: number;
  sellerPayable: number;
}): Promise<Order> {
  if (isMockMode)
    return {
      id: "mock-order" as Uuid,
      customer_id: "mock-user" as Uuid,
      store_id: params.storeId as Uuid,
      status: "pending",
      subtotal_gnf: params.subtotal as GnfAmount,
      delivery_fee_gnf: params.deliveryFee as GnfAmount,
      payment_fee_gnf: params.paymentFee as GnfAmount,
      total_gnf: params.total as GnfAmount,
      commission_rate_bps: params.commissionRateBps,
      commission_gnf: params.commission as GnfAmount,
      courier_cost_gnf: params.courierCost as GnfAmount,
      seller_payable_gnf: params.sellerPayable as GnfAmount,
      payment_method: params.paymentMethod,
      payment_status: "pending",
      delivery_status: "unassigned",
      delivery_address_id: params.deliveryAddressId as Uuid,
      delivery_address_snapshot: {
        commune: "",
        quartier: "",
        phone: "+224620000000" as PhoneE164,
      },
      created_at: new Date().toISOString() as IsoDateTime,
      updated_at: new Date().toISOString() as IsoDateTime,
    };

  const { data, error } = await (
    await from("orders")
  )
    .insert({
      customer_id: params.customerId as Uuid,
      store_id: params.storeId as Uuid,
      status: "pending",
      subtotal_gnf: params.subtotal as GnfAmount,
      delivery_fee_gnf: params.deliveryFee as GnfAmount,
      payment_fee_gnf: params.paymentFee as GnfAmount,
      total_gnf: params.total as GnfAmount,
      commission_rate_bps: params.commissionRateBps,
      commission_gnf: params.commission as GnfAmount,
      courier_cost_gnf: params.courierCost as GnfAmount,
      seller_payable_gnf: params.sellerPayable as GnfAmount,
      payment_method: params.paymentMethod,
      payment_status: "pending",
      delivery_address_id: params.deliveryAddressId as Uuid,
      delivery_address_snapshot: params.deliveryAddressSnapshot,
      created_at: new Date().toISOString() as IsoDateTime,
      updated_at: new Date().toISOString() as IsoDateTime,
    })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("Order creation returned no row");
  return mapOrder(data);
}

export async function cancelOrder(
  orderId: string,
  reason: string,
): Promise<void> {
  if (isMockMode) return;

  const { error } = await (
    await from("orders")
  )
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw error;
}

// ============================================================================
// Delivery Tracking
// ============================================================================

export async function fetchDeliveryJob(jobId: string) {
  if (isMockMode) return null;

  const { data, error } = await (
    await from("delivery_jobs")
  )
    .select(
      `
      *,
      courier:courier_profiles (
        id,
        user:profiles (
          full_name,
          phone
        ),
        vehicle_type,
        vehicle_plate
      ),
      delivery_events (
        *,
        actor:profiles (
          full_name
        )
      ),
      delivery_proofs (*)
    `,
    )
    .eq("id", jobId)
    .single();

  if (error) return null;
  return data;
}

export async function subscribeToDeliveryJob(
  jobId: string,
  callback: (job: Record<string, unknown>) => void,
) {
  if (isMockMode) return () => {};

  const channel = supabase
    .channel(`delivery-job:${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "delivery_jobs",
        filter: `id=eq.${jobId}`,
      },
      (payload) => callback(payload.new),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "delivery_events",
        filter: `delivery_job_id=eq.${jobId}`,
      },
      (payload) => callback(payload.new),
    )
    .subscribe();

  return () => channel.unsubscribe();
}

// ============================================================================
// Payments
// ============================================================================

export async function initiatePayment(params: {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  phone: string;
}): Promise<{ paymentId: string; actionUrl?: string }> {
  if (isMockMode) return { paymentId: "mock-payment", actionUrl: undefined };

  const { data, error } = await supabase.functions.invoke("initiate-payment", {
    body: params,
  });

  if (error) throw error;
  return data;
}

export async function checkPaymentStatus(paymentId: string): Promise<{
  status: PaymentStatus;
  paidAt?: string;
}> {
  if (isMockMode) return { status: "pending" };

  const { data, error } = await (
    await from("payments")
  )
    .select("status, paid_at")
    .eq("id", paymentId)
    .single();

  if (error) throw error;
  return {
    status: data.status as PaymentStatus,
    paidAt: data.paid_at ?? undefined,
  };
}

// ============================================================================
// Notifications
// ============================================================================

export async function fetchNotifications(params?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    created_at: string;
  }>
> {
  if (isMockMode) return [];

  let query = (await from("notifications"))
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.unreadOnly) query = query.eq("read", false);
  if (params?.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    data: n.data as Record<string, unknown>,
    read: n.read,
    created_at: n.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isMockMode) return;

  const { error } = await (
    await from("notifications")
  )
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function registerPushToken(
  token: string,
  platform: "ios" | "android" | "web",
): Promise<void> {
  if (isMockMode) return;

  const { error } = await (
    await from("push_tokens")
  ).upsert({ token, platform, updated_at: new Date().toISOString() });

  if (error) throw error;
}

// ============================================================================
// Search
// ============================================================================

export async function searchProducts(query: string): Promise<Product[]> {
  if (isMockMode)
    return MOCK_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    );

  const { data, error } = await (
    await from("products")
  )
    .select("*")
    .eq("status", "active")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function searchStores(query: string): Promise<Store[]> {
  if (isMockMode)
    return [MOCK_STORE].filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()),
    );

  const { data, error } = await (
    await from("stores")
  )
    .select("*")
    .eq("status", "active")
    .ilike("name", `%${query}%`)
    .limit(20);

  if (error) throw error;
  return (data ?? []).map(mapStore);
}
