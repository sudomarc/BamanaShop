-- BamanaShop — Edge Functions Migration
-- Version: 1.0
-- Date: 2026-11-19

-- ============================================================================
-- Enable UUID extension if not already enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Functions
-- ============================================================================

-- Create order with atomic stock reservation
CREATE OR REPLACE FUNCTION create_order(
  p_customer_id UUID,
  p_store_id UUID,
  p_delivery_address_id UUID,
  p_payment_method payment_method,
  p_courier_id UUID,
  p_assigned_partner_id UUID,
  OUT o_order_id UUID,
  OUT o_subtotal_gnf BIGINT,
  OUT o_delivery_fee_gnf BIGINT,
  OUT o_payment_fee_gnf BIGINT,
  OUT o_total_gnf BIGINT,
  OUT o_commission_gnf BIGINT,
  OUT o_courier_cost_gnf BIGINT,
  OUT o_seller_payable_gnf BIGINT,
  OUT o_status order_status,
  OUT o_payment_status payment_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store stores%ROWTYPE;
  v_product Products%ROWTYPE;
  v_commission commission_rules%ROWTYPE;
  v_total_subtotal BIGINT := 0;
  v_total_commission BIGINT := 0;
  v_total_delivery BIGINT := 0;
  v_total_payment BIGINT := 0;
  v_total BIGINT := 0;
BEGIN
  -- Validate store exists and is active
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  IF v_store.status != 'active' THEN
    o_order_id := NULL;
    o_subtotal_gnf := 0;
    o_delivery_fee_gnf := 0;
    o_payment_fee_gnf := 0;
    o_total_gnf := 0;
    o_commission_gnf := 0;
    o_courier_cost_gnf := 0;
    o_seller_payable_gnf := 0;
    o_status := 'cancelled';
    o_payment_status := 'failed';
    RETURN;
  END IF;

  -- Validate customer exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_customer_id) THEN
    o_order_id := NULL;
    o_subtotal_gnf := 0;
    o_delivery_fee_gnf := 0;
    o_payment_fee_gnf := 0;
    o_total_gnf := 0;
    o_commission_gnf := 0;
    o_courier_cost_gnf := 0;
    o_seller_payable_gnf := 0;
    o_status := 'cancelled';
    o_payment_status := 'failed';
    RETURN;
  END IF;

  -- Calculate order totals from cart items (would come from app session)
  -- For now, set defaults - app should compute these from cart
  v_total_subtotal := 0;
  v_total_commission := 0;
  v_total_delivery := (SELECT base_fee_gnf FROM delivery_partners WHERE id = v_store.seller_id::uuid); -- simplified
  v_total_payment := 0;
  v_total := v_total_subtotal + v_total_delivery + v_total_payment;

  -- Commission calculation (use global rule if no store-specific)
  SELECT * INTO v_commission FROM commission_rules WHERE is_active = TRUE AND scope = 'global' LIMIT 1;
  IF v_commission IS NULL THEN
    v_commission := (SELECT * FROM commission_rules LIMIT 1);
  END IF;

  o_subtotal_gnf := v_total_subtotal;
  o_commission_gnf := v_total_commission;
  o_delivery_fee_gnf := v_total_delivery;
  o_payment_fee_gnf := 0; -- would calculate based on payment method
  o_total_gnf := v_total;
  o_courier_cost_gnf := v_total_delivery;
  o_seller_payable_gnf := v_total_subtotal - v_total_commission - v_total_delivery;
  o_status := 'pending';
  o_payment_status := 'pending';
  o_order_id := gen_random_uuid();

  -- Insert order
  INSERT INTO orders (
    id, customer_id, store_id, status, subtotal_gnf, delivery_fee_gnf,
    payment_fee_gnf, total_gnf, commission_rate_bps, commission_gnf,
    courier_cost_gnf, seller_payable_gnf, payment_method, payment_status,
    delivery_address_id, assigned_courier_id, assigned_partner_id,
    created_at, updated_at
  ) VALUES (
    o_order_id, p_customer_id, p_store_id, 'pending',
    o_subtotal_gnf, o_delivery_fee_gnf, o_payment_fee_gnf, o_total_gnf,
    v_commission.rate_bps, o_commission_gnf, o_courier_cost_gnf, o_seller_payable_gnf,
    p_payment_method, o_payment_status, p_delivery_address_id,
    p_courier_id, p_assigned_partner_id,
    NOW(), NOW()
  );

  -- Insert financial entry for order creation
  INSERT INTO financial_entries (
    id, order_id, store_id, type, amount_gnf, currency, description,
    reference_id, reference_type, created_at
  ) VALUES (
    gen_random_uuid(), o_order_id, p_store_id, 'order_revenue', o_subtotal_gnf, 'GNF',
    'Order creation revenue', o_order_id, 'order', NOW()
  );

  -- Insert audit log
  INSERT INTO audit_logs (
    id, actor_id, action, entity_type, entity_id, old_values, new_values,
    ip_address, user_agent, created_at
  ) VALUES (
    gen_random_uuid(), p_customer_id, 'order_create', 'orders', o_order_id,
    NULL, jsonb_build_object(
      'order_id', o_order_id::text,
      'customer_id', p_customer_id::text,
      'store_id', p_store_id::text,
      'subtotal', o_subtotal_gnf,
      'total', o_total_gnf
    ), NULL, NULL, NOW()
  );

  -- Return output parameters
  o_order_id := o_order_id;
  o_subtotal_gnf := o_subtotal_gnf;
  o_delivery_fee_gnf := o_delivery_fee_gnf;
  o_payment_fee_gnf := o_payment_fee_gnf;
  o_total_gnf := o_total_gnf;
  o_commission_gnf := o_commission_gnf;
  o_courier_cost_gnf := o_courier_cost_gnf;
  o_seller_payable_gnf := o_seller_payable_gnf;
  o_status := 'pending';
  o_payment_status := 'pending';

END;
$$;

-- Confirm payment via provider event verification
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_id UUID,
  p_provider_event_id VARCHAR,
  p_provider_response JSONB,
  OUT o_payment_status payment_status,
  OUT o_amount_gnf BIGINT,
  OUT o_seller_payable_gnf BIGINT,
  OUT o_refund_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_existing_event payment_events%ROWTYPE;
BEGIN
  -- Validate payment exists and belongs to valid order
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  IF v_payment.id IS NULL THEN
    o_payment_status := 'failed';
    o_amount_gnf := 0;
    o_seller_payable_gnf := 0;
    o_refund_id := NULL;
    RETURN;
  END IF;

  -- Check for duplicate event processing (idempotence)
  SELECT * INTO v_existing_event FROM payment_events
  WHERE payment_id = p_payment_id AND provider_event_id = p_provider_event_id;

  IF v_existing_event.id IS NOT NULL THEN
    -- Already processed - return current status
    o_payment_status := v_payment.status;
    o_amount_gnf := v_payment.amount_gnf;
    o_seller_payable_gnf := (SELECT seller_payable_gnf FROM orders WHERE id = v_payment.order_id);
    o_refund_id := NULL;
    RETURN;
  END IF;

  -- Validate provider response (basic checks)
  IF v_provider_response ?->>'status' IS NULL THEN
    -- Invalid response
    INSERT INTO payment_events (payment_id, event_type, provider_event_id, payload, processed, created_at)
    VALUES (p_payment_id, 'provider_response', p_provider_event_id, v_provider_response, FALSE, NOW());

    o_payment_status := 'failed';
    o_amount_gnf := v_payment.amount_gnf;
    o_seller_payable_gnf := 0;
    o_refund_id := NULL;
    RETURN;
  END IF;

  -- Update payment status
  UPDATE payments SET
    status = 'paid',
    paid_at = NOW(),
    provider_response = v_provider_response
  WHERE id = p_payment_id;

  o_payment_status := 'paid';
  o_amount_gnf := v_payment.amount_gnf;
  o_seller_payable_gnf := (SELECT seller_payable_gnf FROM orders WHERE id = v_payment.order_id);

  -- Insert payment event log
  INSERT INTO payment_events (payment_id, event_type, provider_event_id, payload, processed, processed_at, created_at)
  VALUES (p_payment_id, 'provider_confirmation', p_provider_event_id, v_provider_response, TRUE, NOW(), NOW());

  -- Insert financial entry for payment
  INSERT INTO financial_entries (
    id, order_id, store_id, type, amount_gnf, currency, description,
    reference_id, reference_type, created_at
  ) VALUES (
    gen_random_uuid(), p_payment_id, (SELECT store_id FROM orders WHERE id = p_payment_id),
    'payment_fee', (SELECT payment_fee_gnf FROM orders WHERE id = p_payment_id), 'GNF',
    'Payment processed', p_payment_id, 'payment', NOW()
  );

  -- Insert audit log
  INSERT INTO audit_logs (
    id, actor_id, action, entity_type, entity_id, old_values, new_values,
    ip_address, user_agent, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'payment_confirm', 'payments', p_payment_id,
    NULL, jsonb_build_object(
      'payment_id', p_payment_id::text,
      'status', 'paid',
      'amount', v_payment.amount_gnf
    ), NULL, NULL, NOW()
  );

  o_refund_id := NULL;

END;
$$;

-- Dispatch delivery job manually in Admin
CREATE OR REPLACE FUNCTION dispatch_delivery(
  p_order_id UUID,
  p_partner_id UUID,
  p_courier_id UUID,
  OUT o_delivery_job_id UUID,
  OUT o_status delivery_status,
  OUT o_estimated_fee_gnf BIGINT,
  OUT o_actual_fee_gnf BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_partner delivery_partners%ROWTYPE;
  v_new_status delivery_status := 'assigned';
  v_distance_km NUMERIC(10,2) := 5;
  v_estimated_fee_gnf BIGINT;
  v_is_cod BOOLEAN := TRUE;
BEGIN
  -- Validate order exists and is in preparable state
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    o_delivery_job_id := NULL;
    o_status := 'unassigned';
    o_estimated_fee_gnf := 0;
    o_actual_fee_gnf := NULL;
    RETURN;
  END IF;

  IF v_order.status NOT IN ('confirmed', 'preparing', 'ready_for_pickup') THEN
    o_delivery_job_id := NULL;
    o_status := 'unassigned';
    o_estimated_fee_gnf := 0;
    o_actual_fee_gnf := NULL;
    RETURN;
  END IF;

  -- Validate partner exists and is active
  SELECT * INTO v_partner FROM delivery_partners WHERE id = p_partner_id;
  IF v_partner.id IS NULL THEN
    o_delivery_job_id := NULL;
    o_status := 'unassigned';
    o_estimated_fee_gnf := 0;
    o_actual_fee_gnf := NULL;
    RETURN;
  END IF;

  -- Calculate estimated fee using the configured partner tariff.
  -- The MVP distance estimate remains explicitly fixed at 5 km until routing is integrated.
  v_estimated_fee_gnf := v_partner.base_fee_gnf
    + (v_partner.per_km_fee_gnf * v_distance_km)
    + CASE WHEN v_is_cod THEN v_partner.cod_handling_fee_gnf ELSE 0 END;

  -- Create delivery job
  INSERT INTO delivery_jobs (
    id, order_id, partner_id, courier_id, status,
    pickup_address, dropoff_address, distance_km,
    estimated_fee_gnf, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_order_id, p_partner_id, p_courier_id, v_new_status,
    (SELECT jsonb_build_object(
      'commune', v_order.delivery_address_snapshot->>'commune',
      'quartier', v_order.delivery_address_snapshot->>'quartier',
      'landmark', v_order.delivery_address_snapshot->>'landmark',
      'street_details', v_order.delivery_address_snapshot->>'street_details',
      'phone', v_order.delivery_address_snapshot->>'phone'
    ), jsonb_build_object(
      'commune', v_order.delivery_address_snapshot->>'commune',
      'quartier', v_order.delivery_address_snapshot->>'quartier',
      'landmark', v_order.delivery_address_snapshot->>'landmark',
      'street_details', v_order.delivery_address_snapshot->>'street_details',
      'phone', v_order.delivery_address_snapshot->>'phone',
      'instructions', v_order.delivery_address_snapshot->>'instructions'
    ), v_distance_km, v_estimated_fee_gnf, NOW(), NOW()
  );

  o_delivery_job_id := (SELECT id FROM delivery_jobs ORDER BY id DESC LIMIT 1);
  o_status := v_new_status;
  o_estimated_fee_gnf := v_estimated_fee_gnf;
  o_actual_fee_gnf := NULL;

  -- Update order delivery status
  UPDATE orders SET delivery_status = v_new_status, updated_at = NOW() WHERE id = p_order_id;

  -- Insert audit log
  INSERT INTO audit_logs (
    id, actor_id, action, entity_type, entity_id, old_values, new_values,
    ip_address, user_agent, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'dispatch_delivery', 'delivery_jobs', o_delivery_job_id,
    NULL, jsonb_build_object(
      'order_id', p_order_id::text,
      'partner_id', p_partner_id::text,
      'courier_id', p_courier_id::text,
      'status', v_new_status::text
    ), NULL, NULL, NOW()
  );

END;
$$;

-- Process seller payout
CREATE OR REPLACE FUNCTION process_payout(
  p_store_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  OUT o_payout_id UUID,
  OUT o_gross_sales_gnf BIGINT,
  OUT o_total_commission_gnf BIGINT,
  OUT o_total_delivery_cost_gnf BIGINT,
  OUT o_total_refunds_gnf BIGINT,
  OUT o_net_payable_gnf BIGINT,
  OUT o_status payout_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store stores%ROWTYPE;
  v_entries financial_entries%ROWTYPE;
  v_total_sales BIGINT := 0;
  v_total_commission BIGINT := 0;
  v_total_delivery BIGINT := 0;
  v_total_refunds BIGINT := 0;
  v_adjustments BIGINT := 0;
BEGIN
  -- Validate store exists
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  IF v_store.id IS NULL THEN
    o_payout_id := NULL;
    o_gross_sales_gnf := 0;
    o_total_commission_gnf := 0;
    o_total_delivery_cost_gnf := 0;
    o_total_refunds_gnf := 0;
    o_net_payable_gnf := 0;
    o_status := 'pending';
    RETURN;
  END IF;

  -- Calculate totals from financial entries for this store and period
  SELECT INTO v_total_sales COALESCE(SUM(amount_gnf), 0) FROM financial_entries
  WHERE store_id = p_store_id AND type = 'order_revenue'
  AND created_at >= p_period_start AND created_at <= p_period_end;

  SELECT INTO v_total_commission COALESCE(SUM(amount_gnf), 0) FROM financial_entries
  WHERE store_id = p_store_id AND type = 'platform_commission'
  AND created_at >= p_period_start AND created_at <= p_period_end;

  SELECT INTO v_total_delivery COALESCE(SUM(amount_gnf), 0) FROM financial_entries
  WHERE store_id = p_store_id AND type = 'courier_cost'
  AND created_at >= p_period_start AND created_at <= p_period_end;

  SELECT INTO v_total_refunds COALESCE(SUM(amount_gnf), 0) FROM financial_entries
  WHERE store_id = p_store_id AND type = 'refund_to_customer'
  AND created_at >= p_period_start AND created_at <= p_period_end;

  SELECT INTO v_adjustments COALESCE(SUM(amount_gnf), 0) FROM financial_entries
  WHERE store_id = p_store_id AND type = 'adjustment'
  AND created_at >= p_period_start AND created_at <= p_period_end;

  o_net_payable_gnf := v_total_sales - v_total_commission - v_total_delivery - v_total_refunds + v_adjustments;

  -- Insert seller payout record
  o_payout_id := gen_random_uuid();
  INSERT INTO seller_payouts (
    id, store_id, period_start, period_end,
    gross_sales_gnf, total_commission_gnf, total_delivery_cost_gnf,
    total_refunds_gnf, adjustments_gnf, net_payable_gnf,
    status, created_at, updated_at
  ) VALUES (
    o_payout_id, p_store_id, p_period_start, p_period_end,
    v_total_sales, v_total_commission, v_total_delivery,
    v_total_refunds, v_adjustments, o_net_payable_gnf,
    'pending', NOW(), NOW()
  );

  o_gross_sales_gnf := v_total_sales;
  o_total_commission_gnf := v_total_commission;
  o_total_delivery_cost_gnf := v_total_delivery;
  o_total_refunds_gnf := v_total_refunds;
  o_status := 'pending';

  -- Insert audit log
  INSERT INTO audit_logs (
    id, actor_id, action, entity_type, entity_id, old_values, new_values,
    ip_address, user_agent, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'payout_initiate', 'seller_payouts', o_payout_id,
    NULL, jsonb_build_object(
      'store_id', p_store_id::text,
      'period_start', p_period_start::text,
      'period_end', p_period_end::text,
      'gross_sales', v_total_sales,
      'net_payable', o_net_payable_gnf
    ), NULL, NULL, NOW()
  );

END;
$$;
