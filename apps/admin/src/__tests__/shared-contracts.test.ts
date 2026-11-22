import { describe, expect, it } from "vitest";
import { OrderStatus } from "@bamanashop/contracts";

describe("shared contracts OrderStatus", () => {
  it("exposes completed as an order status", () => {
    expect(OrderStatus.safeParse("completed").success).toBe(true);
  });
});
