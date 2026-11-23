-- BamanaShop — RLS Policies
-- Version: 1.0
-- Date: 2026-11-19

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check if current user has a specific role with approved status
CREATE OR REPLACE FUNCTION has_role(target_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM role_memberships
    WHERE user_id = auth.uid()
    AND role = target_role
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin/staff
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role('admin') OR has_role('staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is seller of a specific store
CREATE OR REPLACE FUNCTION is_store_seller(store_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stores s
    JOIN seller_profiles sp ON sp.id = s.seller_id
    WHERE s.id = store_uuid
    AND sp.user_id = auth.uid()
    AND sp.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is assigned courier for a delivery job
CREATE OR REPLACE FUNCTION is_assigned_courier(job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM delivery_jobs
    WHERE id = job_id
    AND courier_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is partner manager for a partner
CREATE OR REPLACE FUNCTION is_partner_manager(partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM courier_profiles
    WHERE partner_id = is_partner_manager.partner_id
    AND user_id = auth.uid()
    AND status = 'approved'
  ) OR has_role('partner_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's approved roles
CREATE OR REPLACE FUNCTION get_my_roles()
RETURNS TEXT[] AS $$
DECLARE
  roles TEXT[];
BEGIN
  SELECT ARRAY_AGG(role::TEXT) INTO roles
  FROM role_memberships
  WHERE user_id = auth.uid()
  AND status = 'approved';
  RETURN COALESCE(roles, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Profiles: Users see only their own profile
-- ============================================================================

CREATE POLICY "profiles_select_own" ON profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin can see all profiles
CREATE POLICY "profiles_admin_all" ON profiles
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Role Memberships: Users see only their own; Admins manage
-- ============================================================================

CREATE POLICY "role_memberships_select_own" ON role_memberships
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "role_memberships_admin_all" ON role_memberships
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Seller Profiles: Seller sees own; Admin sees all
-- ============================================================================

CREATE POLICY "seller_profiles_select_own" ON seller_profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "seller_profiles_insert_own" ON seller_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "seller_profiles_update_own" ON seller_profiles
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "seller_profiles_admin_all" ON seller_profiles
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Courier Profiles: Courier sees own; Partner manager sees their couriers; Admin sees all
-- ============================================================================

CREATE POLICY "courier_profiles_select_own" ON courier_profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "courier_profiles_partner_manager" ON courier_profiles
FOR SELECT USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM courier_profiles cp
    WHERE cp.id = courier_profiles.id
    AND cp.partner_id = partner_id
    AND EXISTS (
      SELECT 1 FROM courier_profiles mgr
      WHERE mgr.user_id = auth.uid()
      AND mgr.partner_id = partner_id
      AND mgr.status = 'approved'
    )
  )
);

CREATE POLICY "courier_profiles_admin_all" ON courier_profiles
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Delivery Partners: Public read for active partners; Admin manages
-- ============================================================================

CREATE POLICY "delivery_partners_public_read" ON delivery_partners
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "delivery_partners_admin_all" ON delivery_partners
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Categories: Public read for active; Admin manages
-- ============================================================================

CREATE POLICY "categories_public_read" ON categories
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "categories_admin_all" ON categories
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Stores: Public read for active; Seller manages own; Admin all
-- ============================================================================

CREATE POLICY "stores_public_read" ON stores
FOR SELECT USING (status = 'active');

CREATE POLICY "stores_seller_select" ON stores
FOR SELECT USING (is_store_seller(id));

CREATE POLICY "stores_seller_update" ON stores
FOR UPDATE USING (is_store_seller(id)) WITH CHECK (is_store_seller(id));

CREATE POLICY "stores_admin_all" ON stores
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Products: Public read for active in active stores; Seller manages own store's products; Admin all
-- ============================================================================

CREATE POLICY "products_public_read" ON products
FOR SELECT USING (
  status = 'active' AND EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.status = 'active'
  )
);

CREATE POLICY "products_seller_select" ON products
FOR SELECT USING (is_store_seller(store_id));

CREATE POLICY "products_seller_manage" ON products
FOR ALL USING (is_store_seller(store_id)) WITH CHECK (is_store_seller(store_id));

CREATE POLICY "products_admin_all" ON products
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Product Images: Follow product permissions
-- ============================================================================

CREATE POLICY "product_images_public_read" ON product_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id
    AND p.status = 'active'
    AND s.status = 'active'
  )
);

CREATE POLICY "product_images_seller_manage" ON product_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_images.product_id
    AND is_store_seller(p.store_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_images.product_id
    AND is_store_seller(p.store_id)
  )
);

CREATE POLICY "product_images_admin_all" ON product_images
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Inventory Movements: Seller sees own store's; Admin all
-- ============================================================================

CREATE POLICY "inventory_movements_seller_select" ON inventory_movements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = inventory_movements.product_id
    AND is_store_seller(p.store_id)
  )
);

CREATE POLICY "inventory_movements_seller_insert" ON inventory_movements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = inventory_movements.product_id
    AND is_store_seller(p.store_id)
  )
);

CREATE POLICY "inventory_movements_admin_all" ON inventory_movements
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Addresses: User sees own; Admin all
-- ============================================================================

CREATE POLICY "addresses_own_all" ON addresses
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses_admin_all" ON addresses
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Orders: Customer sees own; Seller sees their store's; Courier sees assigned; Admin all
-- ============================================================================

CREATE POLICY "orders_customer_select" ON orders
FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "orders_seller_select" ON orders
FOR SELECT USING (is_store_seller(store_id));

CREATE POLICY "orders_courier_select" ON orders
FOR SELECT USING (
  assigned_courier_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.order_id = orders.id
    AND dj.courier_id = auth.uid()
  )
);

CREATE POLICY "orders_customer_insert" ON orders
FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Seller can update status (confirmed, preparing, ready_for_pickup)
CREATE POLICY "orders_seller_update_status" ON orders
FOR UPDATE USING (is_store_seller(store_id)) WITH CHECK (
  is_store_seller(store_id)
  AND (status IN ('confirmed', 'preparing', 'ready_for_pickup', 'cancelled'))
);

-- Courier can update delivery status
CREATE POLICY "orders_courier_update_delivery" ON orders
FOR UPDATE USING (
  assigned_courier_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.order_id = orders.id
    AND dj.courier_id = auth.uid()
  )
) WITH CHECK (
  (assigned_courier_id = auth.uid() OR EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.order_id = orders.id
    AND dj.courier_id = auth.uid()
  ))
  AND (delivery_status IN ('accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'))
);

CREATE POLICY "orders_admin_all" ON orders
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Order Items: Follow order permissions
-- ============================================================================

CREATE POLICY "order_items_customer_select" ON order_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

CREATE POLICY "order_items_seller_select" ON order_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND is_store_seller(orders.store_id))
);

CREATE POLICY "order_items_courier_select" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND (o.assigned_courier_id = auth.uid() OR EXISTS (
      SELECT 1 FROM delivery_jobs dj WHERE dj.order_id = o.id AND dj.courier_id = auth.uid()
    ))
  )
);

CREATE POLICY "order_items_admin_all" ON order_items
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Payments: Customer sees own order's; Seller sees their store's; Admin all
-- ============================================================================

CREATE POLICY "payments_customer_select" ON payments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
);

CREATE POLICY "payments_seller_select" ON payments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND is_store_seller(orders.store_id))
);

CREATE POLICY "payments_admin_all" ON payments
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Payment Events: Admin only (webhook processing)
-- ============================================================================

CREATE POLICY "payment_events_admin_all" ON payment_events
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Delivery Jobs: Courier sees assigned; Partner manager sees partner's; Seller sees their orders'; Admin all
-- ============================================================================

CREATE POLICY "delivery_jobs_courier_select" ON delivery_jobs
FOR SELECT USING (courier_id = auth.uid());

CREATE POLICY "delivery_jobs_partner_select" ON delivery_jobs
FOR SELECT USING (
  partner_id IN (
    SELECT partner_id FROM courier_profiles
    WHERE user_id = auth.uid()
    AND status = 'approved'
  )
);

CREATE POLICY "delivery_jobs_seller_select" ON delivery_jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = delivery_jobs.order_id AND is_store_seller(o.store_id)
  )
);

CREATE POLICY "delivery_jobs_courier_update" ON delivery_jobs
FOR UPDATE USING (courier_id = auth.uid()) WITH CHECK (
  courier_id = auth.uid()
  AND status IN ('accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned')
);

CREATE POLICY "delivery_jobs_admin_all" ON delivery_jobs
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Delivery Events: Courier/Admin create; All involved parties read
-- ============================================================================

CREATE POLICY "delivery_events_involved_select" ON delivery_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.id = delivery_events.delivery_job_id
    AND (
      dj.courier_id = auth.uid()
      OR EXISTS (SELECT 1 FROM orders o WHERE o.id = dj.order_id AND o.customer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM orders o WHERE o.id = dj.order_id AND is_store_seller(o.store_id))
    )
  )
);

CREATE POLICY "delivery_events_courier_insert" ON delivery_events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.id = delivery_events.delivery_job_id
    AND dj.courier_id = auth.uid()
  )
);

CREATE POLICY "delivery_events_admin_all" ON delivery_events
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Delivery Proofs: Courier creates; Involved parties read; Admin all
-- ============================================================================

CREATE POLICY "delivery_proofs_involved_select" ON delivery_proofs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.id = delivery_proofs.delivery_job_id
    AND (
      dj.courier_id = auth.uid()
      OR EXISTS (SELECT 1 FROM orders o WHERE o.id = dj.order_id AND o.customer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM orders o WHERE o.id = dj.order_id AND is_store_seller(o.store_id))
    )
  )
);

CREATE POLICY "delivery_proofs_courier_insert" ON delivery_proofs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.id = delivery_proofs.delivery_job_id
    AND dj.courier_id = auth.uid()
  )
);

CREATE POLICY "delivery_proofs_admin_all" ON delivery_proofs
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Incidents: Reporter/Admin; Courier sees assigned job's incidents
-- ============================================================================

CREATE POLICY "incidents_reporter_select" ON incidents
FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "incidents_courier_select" ON incidents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM delivery_jobs dj
    WHERE dj.id = incidents.delivery_job_id
    AND dj.courier_id = auth.uid()
  )
);

CREATE POLICY "incidents_reporter_insert" ON incidents
FOR INSERT WITH CHECK (reported_by = auth.uid());

CREATE POLICY "incidents_admin_all" ON incidents
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Commission Rules: Admin only
-- ============================================================================

CREATE POLICY "commission_rules_admin_all" ON commission_rules
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Financial Entries: Admin only (internal accounting)
-- ============================================================================

CREATE POLICY "financial_entries_admin_all" ON financial_entries
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Seller Payouts: Seller sees own store's; Admin all
-- ============================================================================

CREATE POLICY "seller_payouts_seller_select" ON seller_payouts
FOR SELECT USING (is_store_seller(store_id));

CREATE POLICY "seller_payouts_admin_all" ON seller_payouts
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Refunds: Customer sees own order's; Seller sees their store's; Admin all
-- ============================================================================

CREATE POLICY "refunds_customer_select" ON refunds
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = refunds.order_id AND orders.customer_id = auth.uid())
);

CREATE POLICY "refunds_seller_select" ON refunds
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = refunds.order_id AND is_store_seller(orders.store_id))
);

CREATE POLICY "refunds_admin_all" ON refunds
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Support Tickets: User sees own; Assigned staff sees; Admin all
-- ============================================================================

CREATE POLICY "support_tickets_user_select" ON support_tickets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "support_tickets_assigned_select" ON support_tickets
FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "support_tickets_user_insert" ON support_tickets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_staff_update" ON support_tickets
FOR UPDATE USING (assigned_to = auth.uid() OR is_admin()) WITH CHECK (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "support_tickets_admin_all" ON support_tickets
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Audit Logs: Admin only
-- ============================================================================

CREATE POLICY "audit_logs_admin_all" ON audit_logs
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public reference data
GRANT SELECT ON categories, delivery_partners TO anon, authenticated;

-- Grant full access to authenticated on their own data (via RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;