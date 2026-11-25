import { describe, expect, it } from "vitest";
import { selectDeliveryPartner } from "@/utils/deliveryRules";

const partner = (
  id: string,
  base_fee_gnf: number,
  cod_handling_fee_gnf: number,
  coverage_zones: string[],
) => ({ id, base_fee_gnf, cod_handling_fee_gnf, coverage_zones });

describe("delivery partner selection", () => {
  it("ignores cheaper partners outside the selected commune", () => {
    const selected = selectDeliveryPartner(
      [
        partner("outside", 1000, 0, ["Kaloum"]),
        partner("inside", 5000, 1000, ["Matam"]),
      ],
      "Matam",
    );

    expect(selected?.id).toBe("inside");
  });

  it("treats an empty coverage list as unrestricted", () => {
    const selected = selectDeliveryPartner(
      [partner("global", 4000, 1000, [])],
      "Ratoma",
    );

    expect(selected?.id).toBe("global");
  });

  it("matches commune names case-insensitively", () => {
    const selected = selectDeliveryPartner(
      [partner("case-insensitive", 4000, 1000, ["  mAtAm "])],
      "Matam",
    );

    expect(selected?.id).toBe("case-insensitive");
  });

  it("chooses the lowest tariff and breaks ties by ID", () => {
    const selected = selectDeliveryPartner(
      [
        partner("z-partner", 4000, 1000, ["Matam"]),
        partner("a-partner", 3000, 2000, ["Matam"]),
        partner("expensive", 6000, 1000, ["Matam"]),
      ],
      "Matam",
    );

    expect(selected?.id).toBe("a-partner");
  });

  it("returns null when no partner covers the commune", () => {
    const selected = selectDeliveryPartner(
      [partner("outside", 1000, 0, ["Kaloum"])],
      "Matam",
    );

    expect(selected).toBeNull();
  });
});
