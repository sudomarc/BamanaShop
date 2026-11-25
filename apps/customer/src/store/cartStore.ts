/**
 * BamanaShop — Cart Store
 * Global cart state with persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "@bamanashop/contracts";
import { assertSingleStoreCart } from "@/utils/cartRules";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutKey {
  context: string;
  key: string;
}

interface CartState {
  items: CartItem[];
  checkoutKey: CheckoutKey | null;
  getCheckoutKey: (context: string) => string;
  resetCheckoutKey: () => void;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getStoreId: () => string | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      checkoutKey: null,

      getCheckoutKey: (context) => {
        const current = get().checkoutKey;
        if (current?.context === context) return current.key;

        const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        set({ checkoutKey: { context, key } });
        return key;
      },

      resetCheckoutKey: () => set({ checkoutKey: null }),

      addItem: (product: Product, quantity = 1) => {
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("La quantité doit être un entier positif.");
        }

        assertSingleStoreCart(get().items, product);

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.product.id === product.id,
          );
          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems, checkoutKey: null };
          }
          return {
            items: [...state.items, { product, quantity }],
            checkoutKey: null,
          };
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i,
          ),
          checkoutKey: null,
        }));
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
          checkoutKey: null,
        }));
      },

      clearCart: () => {
        set({ items: [], checkoutKey: null });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price_gnf * item.quantity,
          0,
        );
      },

      getStoreId: () => {
        const items = get().items;
        if (items.length === 0) return null;
        return items[0].product.store_id;
      },
    }),
    {
      name: "bamanashop-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        checkoutKey: state.checkoutKey,
      }),
    },
  ),
);
