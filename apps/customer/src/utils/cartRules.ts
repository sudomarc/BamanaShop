export const SINGLE_STORE_CART_ERROR =
  "Le panier est limité à une seule boutique. Videz-le avant de choisir une autre boutique.";

type StoreBoundProduct = {
  store_id: string;
};

type StoreBoundCartItem = {
  product: StoreBoundProduct;
};

/**
 * Keep each customer cart scoped to one store.
 * Also reject legacy persisted carts that already contain multiple stores.
 */
export function assertSingleStoreCart(
  items: ReadonlyArray<StoreBoundCartItem>,
  product: StoreBoundProduct,
): void {
  const existingStoreId = items[0]?.product.store_id;

  if (
    existingStoreId &&
    (product.store_id !== existingStoreId ||
      items.some((item) => item.product.store_id !== existingStoreId))
  ) {
    throw new Error(SINGLE_STORE_CART_ERROR);
  }
}
