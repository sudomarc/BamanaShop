import { describe, expect, it, vi } from "vitest";
import {
  resolveCheckoutKey,
  type CheckoutKey,
} from "@/utils/checkoutIdempotency";

describe("checkout idempotency key", () => {
  it("reuses the key for an identical checkout context", () => {
    const current: CheckoutKey = {
      context: "same-cart-and-address",
      key: "stable-key",
    };
    const generateKey = vi.fn(() => "new-key");

    const result = resolveCheckoutKey(
      "same-cart-and-address",
      current,
      generateKey,
    );

    expect(result).toBe(current);
    expect(result.key).toBe("stable-key");
    expect(generateKey).not.toHaveBeenCalled();
  });

  it("creates a new key when the checkout context changes", () => {
    const current: CheckoutKey = {
      context: "old-cart-and-address",
      key: "old-key",
    };

    const result = resolveCheckoutKey(
      "new-cart-and-address",
      current,
      () => "new-key",
    );

    expect(result).toEqual({
      context: "new-cart-and-address",
      key: "new-key",
    });
  });

  it("creates a key after the cart is cleared", () => {
    const result = resolveCheckoutKey(
      "new-cart",
      null,
      () => "new-key",
    );

    expect(result.key).toBe("new-key");
    expect(result.context).toBe("new-cart");
  });
});
