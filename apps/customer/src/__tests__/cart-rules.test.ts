import { describe, expect, it } from "vitest";
import {
  assertSingleStoreCart,
  SINGLE_STORE_CART_ERROR,
} from "@/utils/cartRules";

describe("single-store cart rule", () => {
  it("allows adding a product to an empty cart", () => {
    expect(() =>
      assertSingleStoreCart([], { store_id: "store-a" }),
    ).not.toThrow();
  });

  it("allows adding products from the current store", () => {
    expect(() =>
      assertSingleStoreCart(
        [{ product: { store_id: "store-a" } }],
        { store_id: "store-a" },
      ),
    ).not.toThrow();
  });

  it("rejects a product from another store", () => {
    expect(() =>
      assertSingleStoreCart(
        [{ product: { store_id: "store-a" } }],
        { store_id: "store-b" },
      ),
    ).toThrow(SINGLE_STORE_CART_ERROR);
  });

  it("rejects legacy carts that already contain multiple stores", () => {
    expect(() =>
      assertSingleStoreCart(
        [
          { product: { store_id: "store-a" } },
          { product: { store_id: "store-b" } },
        ],
        { store_id: "store-a" },
      ),
    ).toThrow(SINGLE_STORE_CART_ERROR);
  });
});
