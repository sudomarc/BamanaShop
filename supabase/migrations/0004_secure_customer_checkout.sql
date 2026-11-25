-- Secure customer checkout: server-authoritative prices, stock and ownership.
-- All order amounts and snapshots are derived from database rows, never client input.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_customer_idempotency_key_uidx
  ON public.orders (customer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- The previous public RPC accepted an arbitrary customer id and calculated a
-- zero subtotal. Retire it; only the authenticated checkout RPC below remains.
REVOKE EXECUTE ON FUNCTION public.create_order(
  UUID, UUID, UUID, public.payment_method, UUID, UUID
) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;
REVOKE INSERT ON public.payments FROM anon, authenticated;
REVOKE INSERT ON public.inventory_movements FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_store_id UUID,
  p_delivery_address_id UUID,
  p_payment_method public.payment_method,
  p_items JSONB,
  p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_customer_id UUID := auth.uid();
  v_store RECORD;
  v_address RECORD;
  v_partner RECORD;
  v_product RECORD;
  v_item RECORD;
  v_order_id UUID;
  v_fingerprint TEXT;
  v_existing_fingerprint TEXT;
  v_stock BIGINT;
  v_line_total BIGINT;
  v_subtotal BIGINT := 0;
  v_delivery_fee BIGINT := 0;
  v_payment_fee BIGINT := 0;
  v_total BIGINT := 0;
  v_commission BIGINT := 0;
  v_courier_cost BIGINT := 0;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_payment_method <> 'cod'::public.payment_method THEN
    RAISE EXCEPTION 'This payment method is not enabled yet'
      USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL
     OR pg_catalog.length(p_idempotency_key) < 8
     OR pg_catalog.length(p_idempotency_key) > 128 THEN
    RAISE EXCEPTION 'Invalid checkout request key' USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL
     OR pg_catalog.jsonb_typeof(p_items) <> 'array'
     OR pg_catalog.jsonb_array_length(p_items) < 1
     OR pg_catalog.jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Cart must contain between 1 and 50 distinct products'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_array_elements(p_items) AS entry(item)
    WHERE pg_catalog.jsonb_typeof(entry.item) <> 'object'
       OR entry.item->>'product_id' IS NULL
       OR entry.item->>'quantity' IS NULL
       OR (entry.item->>'quantity') !~ '^[0-9]+$'
  ) THEN
    RAISE EXCEPTION 'Cart contains an invalid product or quantity'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_array_elements(p_items) AS entry(item)
    GROUP BY entry.item->>'product_id'
    HAVING pg_catalog.count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cart contains duplicate product lines'
      USING ERRCODE = '22023';
  END IF;

  v_fingerprint := pg_catalog.md5(
    p_store_id::TEXT || ':' ||
    p_delivery_address_id::TEXT || ':' ||
    p_payment_method::TEXT || ':' ||
    p_items::TEXT
  );

  -- Serialize retries using the same key so a lost response cannot create a
  -- second order or reserve inventory twice.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_customer_id::TEXT || ':' || p_idempotency_key, 0)
  );

  SELECT o.id, o.idempotency_fingerprint
    INTO v_order_id, v_existing_fingerprint
  FROM public.orders AS o
  WHERE o.customer_id = v_customer_id
    AND o.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION 'Checkout request key was already used for a different cart'
        USING ERRCODE = '22023';
    END IF;
    RETURN v_order_id;
  END IF;

  SELECT s.id, s.status, s.commission_rate_bps, sp.status AS seller_status
    INTO v_store
  FROM public.stores AS s
  JOIN public.seller_profiles AS sp ON sp.id = s.seller_id
  WHERE s.id = p_store_id;

  IF NOT FOUND OR v_store.status <> 'active' OR v_store.seller_status <> 'approved' THEN
    RAISE EXCEPTION 'Store is not available for ordering' USING ERRCODE = '22023';
  END IF;

  SELECT a.commune, a.quartier, a.landmark, a.street_details,
         a.phone, a.instructions
    INTO v_address
  FROM public.addresses AS a
  WHERE a.id = p_delivery_address_id
    AND a.user_id = v_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery address does not belong to the current customer'
      USING ERRCODE = '42501';
  END IF;

  -- Keep the MVP dispatch manual. This lowest active tariff is only the
  -- disclosed checkout estimate; no partner or courier is assigned here.
  SELECT dp.base_fee_gnf, dp.cod_handling_fee_gnf
    INTO v_partner
  FROM public.delivery_partners AS dp
  WHERE dp.is_active = TRUE
  ORDER BY (dp.base_fee_gnf + dp.cod_handling_fee_gnf), dp.id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No delivery tariff is configured' USING ERRCODE = '22023';
  END IF;

  v_delivery_fee := v_partner.base_fee_gnf + v_partner.cod_handling_fee_gnf;
  v_courier_cost := v_partner.base_fee_gnf;

  -- Lock products in a stable order and validate prices/stock from the DB.
  FOR v_item IN
    SELECT (entry.item->>'product_id')::UUID AS product_id,
           (entry.item->>'quantity')::INTEGER AS quantity
    FROM pg_catalog.jsonb_array_elements(p_items) AS entry(item)
    ORDER BY (entry.item->>'product_id')::UUID
  LOOP
    IF v_item.quantity < 1 OR v_item.quantity > 1000 THEN
      RAISE EXCEPTION 'Product quantity must be between 1 and 1000'
        USING ERRCODE = '22023';
    END IF;

    SELECT p.id, p.name, p.sku, p.price_gnf
      INTO v_product
    FROM public.products AS p
    WHERE p.id = v_item.product_id
      AND p.store_id = p_store_id
      AND p.status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product is unavailable or belongs to another store'
        USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(pg_catalog.sum(im.quantity_delta), 0)
      INTO v_stock
    FROM public.inventory_movements AS im
    WHERE im.product_id = v_item.product_id;

    IF v_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name
        USING ERRCODE = '22023';
    END IF;

    v_line_total := v_product.price_gnf * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_commission := pg_catalog.round(
    v_subtotal::NUMERIC * v_store.commission_rate_bps / 10000
  )::BIGINT;
  v_total := v_subtotal + v_delivery_fee + v_payment_fee;

  INSERT INTO public.orders (
    customer_id, store_id, status, subtotal_gnf, delivery_fee_gnf,
    payment_fee_gnf, total_gnf, commission_rate_bps, commission_gnf,
    courier_cost_gnf, seller_payable_gnf, payment_method, payment_status,
    delivery_status, delivery_address_id, delivery_address_snapshot,
    idempotency_key, idempotency_fingerprint, created_at, updated_at
  ) VALUES (
    v_customer_id, p_store_id, 'pending', v_subtotal, v_delivery_fee,
    v_payment_fee, v_total, v_store.commission_rate_bps, v_commission,
    v_courier_cost, v_subtotal - v_commission - v_courier_cost,
    p_payment_method, 'cash_due', 'unassigned', p_delivery_address_id,
    pg_catalog.jsonb_build_object(
      'commune', v_address.commune,
      'quartier', v_address.quartier,
      'landmark', v_address.landmark,
      'street_details', v_address.street_details,
      'phone', v_address.phone,
      'instructions', v_address.instructions
    ),
    p_idempotency_key, v_fingerprint, pg_catalog.now(), pg_catalog.now()
  )
  RETURNING id INTO v_order_id;

  -- Insert immutable line snapshots and reserve stock atomically.
  FOR v_item IN
    SELECT (entry.item->>'product_id')::UUID AS product_id,
           (entry.item->>'quantity')::INTEGER AS quantity
    FROM pg_catalog.jsonb_array_elements(p_items) AS entry(item)
    ORDER BY (entry.item->>'product_id')::UUID
  LOOP
    SELECT p.id, p.name, p.sku, p.price_gnf
      INTO v_product
    FROM public.products AS p
    WHERE p.id = v_item.product_id
      AND p.store_id = p_store_id
      AND p.status = 'active';

    v_line_total := v_product.price_gnf * v_item.quantity;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_sku,
      unit_price_gnf, quantity, line_total_gnf
    ) VALUES (
      v_order_id, v_product.id, v_product.name, v_product.sku,
      v_product.price_gnf, v_item.quantity, v_line_total
    );

    INSERT INTO public.inventory_movements (
      product_id, quantity_delta, reason, reference_id, created_by
    ) VALUES (
      v_product.id, -v_item.quantity, 'reservation', v_order_id, v_customer_id
    );
  END LOOP;

  INSERT INTO public.payments (
    order_id, method, status, amount_gnf, currency, created_at, updated_at
  ) VALUES (
    v_order_id, p_payment_method, 'cash_due', v_total, 'GNF',
    pg_catalog.now(), pg_catalog.now()
  );

  -- Do not book revenue or seller payables before cash is collected and
  -- reconciled by the operations team.
  RETURN v_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_customer_order(
  UUID, UUID, public.payment_method, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order(
  UUID, UUID, public.payment_method, JSONB, TEXT
) TO authenticated;
