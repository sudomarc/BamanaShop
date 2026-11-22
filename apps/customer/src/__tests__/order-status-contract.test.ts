import { describe, expect, it } from "vitest";
import { OrderStatus } from "@bamanashop/contracts";

describe("OrderStatus contract alignment with DB schema", () => {
  it("treats completed as a valid order status", () => {
    expect(OrderStatus.safeParse("completed").success).toBe(true);
  });

  it("rejects in_transit as an order status (belongs to delivery cycle)", () => {
    expect(OrderStatus.safeParse("in_transit").success).toBe(false);
  });

  it("rejects delivered as an order status (belongs to delivery cycle)", () => {
    expect(OrderStatus.safeParse("delivered").success).toBe(false);
  });
});
