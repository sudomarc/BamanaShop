export interface CheckoutKey {
  context: string;
  key: string;
}

export function createCheckoutKey(): string {
  return [Date.now().toString(36), Math.random().toString(36).slice(2)].join(
    "-",
  );
}

export function resolveCheckoutKey(
  context: string,
  current: CheckoutKey | null,
  generateKey: () => string = createCheckoutKey,
): CheckoutKey {
  if (current?.context === context) return current;
  return { context, key: generateKey() };
}
