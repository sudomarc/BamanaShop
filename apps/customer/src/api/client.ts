/**
 * BamanaShop — API Client
 * Supabase-based API with fallback to mock data for development
 */

import { createSupabaseClient, isSupabaseConfigured } from "@/utils/supabase";
import type {
  Category,
  Product,
  Store,
  Address,
  Order,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
  GnfAmount,
  Uuid,
  PhoneE164,
  IsoDateTime,
} from "@bamanashop/contracts";
import {
  MOCK_CATEGORIES,
  MOCK_STORE,
  MOCK_PRODUCTS,
  MOCK_DELIVERY_PARTNER,
} from "@bamanashop/contracts";

const supabase = createSupabaseClient();

// Check if we're in mock mode (no Supabase config)
const isMockMode = !isSupabaseConfigured;

// ============================================================================
// Generic API Helpers
// ============================================================================

async function from(table: string) {
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
  PaymentStatus,
  DeliveryStatus,
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
  return data as Category[];
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
    category: categoryData as Category,
    products: (products ?? []) as Product[],
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
  return data as Store[];
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
  return data as Store;
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
  return data as Product[];
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
  return data as Product[];
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
  return data as Product;
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
  return data as Address[];
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
  return data as Address;
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
  return data as Address;
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
  return data as Order[];
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
  return data as Order;
}

export async function createOrder(params: {
  storeId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  deliveryAddressId: string;
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
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
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
  return { status: data.status, paidAt: data.paid_at };
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
  return (data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    created_at: string;
  }>;
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
  return data as Product[];
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
  return data as Store[];
}
