export type DeliveryPartnerQuote = {
  id: string;
  base_fee_gnf: number;
  cod_handling_fee_gnf: number;
  coverage_zones: string[];
};

/**
 * Select the cheapest active partner that serves the requested commune.
 * An empty coverage list means the partner has no geographic restriction.
 */
export function selectDeliveryPartner<T extends DeliveryPartnerQuote>(
  partners: readonly T[],
  commune: string,
): T | null {
  const normalizedCommune = commune.trim().toLowerCase();
  const eligible = partners.filter(
    (partner) =>
      partner.coverage_zones.length === 0 ||
      partner.coverage_zones.some(
        (zone) => zone.trim().toLowerCase() === normalizedCommune,
      ),
  );

  return [...eligible].sort(
    (a, b) =>
      a.base_fee_gnf +
      a.cod_handling_fee_gnf -
      (b.base_fee_gnf + b.cod_handling_fee_gnf) ||
      a.id.localeCompare(b.id),
  )[0] ?? null;
}
