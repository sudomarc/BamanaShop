-- BamanaShop — Initial Schema Migration
-- Version: 1.0
-- Date: 2026-11-19

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Custom Types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'seller', 'courier', 'partner_manager', 'admin', 'staff');
CREATE TYPE role_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'requires_action', 'paid', 'failed', 'cash_due', 'cash_collected', 'refunded', 'partially_refunded', 'under_review');
CREATE TYPE payment_method AS ENUM ('cod', 'orange_money');
CREATE TYPE delivery_status AS ENUM ('unassigned', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned');
CREATE TYPE payout_status AS ENUM ('pending', 'payable', 'processing', 'paid', 'on_hold', 'disputed');
CREATE TYPE store_status AS ENUM ('draft', 'pending_review', 'active', 'suspended', 'closed');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'out_of_stock', 'archived');
CREATE TYPE financial_entry_type AS ENUM ('order_revenue', 'delivery_fee_collected', 'payment_fee', 'platform_commission', 'courier_cost', 'seller_payout', 'refund_to_customer', 'adjustment');
CREATE TYPE delivery_proof_type AS ENUM ('photo', 'signature', 'otp', 'note');
CREATE TYPE incident_type AS ENUM ('customer_unavailable', 'address_not_found', 'customer_refused', 'damaged_goods', 'vehicle_issue', 'safety_concern', 'other');

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  avatar_url TEXT,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'ff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role memberships (server-managed, not user-editable)
CREATE TABLE role_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status role_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_role_memberships_user_id ON role_memberships(user_id);
CREATE INDEX idx_role_memberships_role_status ON role_memberships(role, status);

-- Seller profiles
CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name VARCHAR(200) NOT NULL,
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  bank_account_name VARCHAR(200),
  bank_account_number VARCHAR(100),
  bank_name VARCHAR(100),
  status role_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courier profiles
CREATE TABLE courier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'walking')),
  vehicle_plate VARCHAR(20),
  status role_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery partners
CREATE TABLE delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  coverage_zones TEXT[] NOT NULL DEFAULT '{}',
  base_fee_gnf BIGINT NOT NULL DEFAULT 5000,
  per_km_fee_gnf BIGINT NOT NULL DEFAULT 1000,
  cod_handling_fee_gnf BIGINT NOT NULL DEFAULT 2000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address_line VARCHAR(500) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  quartier VARCHAR(100) NOT NULL,
  landmark VARCHAR(200),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  opening_hours JSONB NOT NULL DEFAULT '{}',
  status store_status NOT NULL DEFAULT 'draft',
  commission_rate_bps INT NOT NULL DEFAULT 1000 CHECK (commission_rate_bps BETWEEN 0 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_seller_id ON stores(seller_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_commune ON stores(commune);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  description TEXT,
  price_gnf BIGINT NOT NULL CHECK (price_gnf >= 0),
  compare_at_price_gnf BIGINT CHECK (compare_at_price_gnf >= 0),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  weight_grams INT CHECK (weight_grams >= 0),
  status product_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Inventory movements (append-only ledger)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_delta INT NOT NULL,
  reason VARCHAR(20) NOT NULL CHECK (reason IN ('restock', 'sale', 'reservation', 'release', 'adjustment', 'return')),
  reference_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_reference_id ON inventory_movements(reference_id);

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(50),
  commune VARCHAR(100) NOT NULL,
  quartier VARCHAR(100) NOT NULL,
  landmark VARCHAR(200),
  street_details VARCHAR(500),
  phone VARCHAR(20) NOT NULL,
  instructions VARCHAR(1000),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default) WHERE is_default;

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal_gnf BIGINT NOT NULL CHECK (subtotal_gnf >= 0),
  delivery_fee_gnf BIGINT NOT NULL CHECK (delivery_fee_gnf >= 0),
  payment_fee_gnf BIGINT NOT NULL CHECK (payment_fee_gnf >= 0),
  total_gnf BIGINT NOT NULL CHECK (total_gnf >= 0),
  commission_rate_bps INT NOT NULL CHECK (commission_rate_bps BETWEEN 0 AND 10000),
  commission_gnf BIGINT NOT NULL CHECK (commission_gnf >= 0),
  courier_cost_gnf BIGINT NOT NULL CHECK (courier_cost_gnf >= 0),
  seller_payable_gnf BIGINT NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  delivery_status delivery_status NOT NULL DEFAULT 'unassigned',
  delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  delivery_address_snapshot JSONB NOT NULL,
  assigned_courier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
  prepared_at TIMESTAMPTZ,
  ready_for_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX idx_orders_assigned_courier_id ON orders(assigned_courier_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(100),
  unit_price_gnf BIGINT NOT NULL CHECK (unit_price_gnf >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total_gnf BIGINT NOT NULL CHECK (line_total_gnf >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_gnf BIGINT NOT NULL CHECK (amount_gnf >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'GNF',
  external_reference VARCHAR(200),
  provider_response JSONB,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_reference ON payments(external_reference);

-- Payment events (webhook log)
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  provider_event_id VARCHAR(200) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payment_id, provider_event_id)
);

CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX idx_payment_events_processed ON payment_events(processed);

-- Delivery jobs
CREATE TABLE delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
  partner_id UUID NOT NULL REFERENCES delivery_partners(id) ON DELETE RESTRICT,
  courier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status delivery_status NOT NULL DEFAULT 'unassigned',
  pickup_address JSONB NOT NULL,
  dropoff_address JSONB NOT NULL,
  distance_km NUMERIC(10,2),
  estimated_fee_gnf BIGINT NOT NULL CHECK (estimated_fee_gnf >= 0),
  actual_fee_gnf BIGINT CHECK (actual_fee_gnf >= 0),
  cod_amount_gnf BIGINT CHECK (cod_amount_gnf >= 0),
  cod_collected_gnf BIGINT CHECK (cod_collected_gnf >= 0),
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_jobs_order_id ON delivery_jobs(order_id);
CREATE INDEX idx_delivery_jobs_partner_id ON delivery_jobs(partner_id);
CREATE INDEX idx_delivery_jobs_courier_id ON delivery_jobs(courier_id);
CREATE INDEX idx_delivery_jobs_status ON delivery_jobs(status);

-- Delivery events
CREATE TABLE delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_job_id UUID NOT NULL REFERENCES delivery_jobs(id) ON DELETE CASCADE,
  status delivery_status NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_events_delivery_job_id ON delivery_events(delivery_job_id);

-- Delivery proofs
CREATE TABLE delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_job_id UUID NOT NULL REFERENCES delivery_jobs(id) ON DELETE CASCADE,
  type delivery_proof_type NOT NULL,
  url TEXT,
  otp_code VARCHAR(10),
  note VARCHAR(500),
  captured_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_proofs_delivery_job_id ON delivery_proofs(delivery_job_id);

-- Incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_job_id UUID NOT NULL REFERENCES delivery_jobs(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type incident_type NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_delivery_job_id ON incidents(delivery_job_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);

-- Commission rules
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'category', 'store')),
  scope_id UUID,
  rate_bps INT NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
  min_order_gnf BIGINT CHECK (min_order_gnf >= 0),
  max_commission_gnf BIGINT CHECK (max_commission_gnf >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_rules_scope ON commission_rules(scope, scope_id);
CREATE INDEX idx_commission_rules_active ON commission_rules(is_active, effective_from, effective_to);

-- Financial entries (append-only audit journal)
CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  delivery_job_id UUID REFERENCES delivery_jobs(id) ON DELETE SET NULL,
  type financial_entry_type NOT NULL,
  amount_gnf BIGINT NOT NULL, -- can be negative
  currency CHAR(3) NOT NULL DEFAULT 'GNF',
  description VARCHAR(500) NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_entries_order_id ON financial_entries(order_id);
CREATE INDEX idx_financial_entries_store_id ON financial_entries(store_id);
CREATE INDEX idx_financial_entries_type ON financial_entries(type);
CREATE INDEX idx_financial_entries_created_at ON financial_entries(created_at);

-- Seller payouts
CREATE TABLE seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_sales_gnf BIGINT NOT NULL CHECK (gross_sales_gnf >= 0),
  total_commission_gnf BIGINT NOT NULL CHECK (total_commission_gnf >= 0),
  total_delivery_cost_gnf BIGINT NOT NULL CHECK (total_delivery_cost_gnf >= 0),
  total_refunds_gnf BIGINT NOT NULL CHECK (total_refunds_gnf >= 0),
  adjustments_gnf BIGINT NOT NULL DEFAULT 0,
  net_payable_gnf BIGINT NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_reference VARCHAR(200),
  notes VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_payouts_store_id ON seller_payouts(store_id);
CREATE INDEX idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX idx_seller_payouts_period ON seller_payouts(period_start, period_end);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  amount_gnf BIGINT NOT NULL CHECK (amount_gnf > 0),
  reason VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  external_reference VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'waiting_seller', 'waiting_courier', 'resolved', 'closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_order_id ON support_tickets(order_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_memberships_updated_at BEFORE UPDATE ON role_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courier_profiles_updated_at BEFORE UPDATE ON courier_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_partners_updated_at BEFORE UPDATE ON delivery_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_jobs_updated_at BEFORE UPDATE ON delivery_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_payouts_updated_at BEFORE UPDATE ON seller_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();