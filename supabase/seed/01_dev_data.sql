-- BamanaShop — Development Seed Data
-- Run after migrations: supabase db reset
-- Contains clearly identified MOCK/DEV data for local development

-- ============================================================================
-- Delivery Partners (dev)
-- ============================================================================

INSERT INTO delivery_partners (id, name, contact_phone, contact_email, coverage_zones, base_fee_gnf, per_km_fee_gnf, cod_handling_fee_gnf, is_active) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Express Guinée (DEV)', '+224620111111', 'ops@expressgn.gn', ARRAY['Kaloum','Dixinn','Matam','Ratoma','Matoto'], 5000, 1000, 2000, TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Livraison Rapide (DEV)', '+224620222222', 'contact@livraisonrapide.gn', ARRAY['Kaloum','Dixinn','Matam'], 4000, 1200, 1500, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Categories (dev)
-- ============================================================================

INSERT INTO categories (id, parent_id, name, slug, description, display_order, is_active) VALUES
('11111111-1111-1111-1111-111111111111', NULL, 'Alimentation', 'alimentation', 'Produits alimentaires et boissons', 1, TRUE),
('22222222-2222-2222-2222-222222222222', NULL, 'Électronique', 'electronique', 'Téléphones, accessoires, informatique', 2, TRUE),
('33333333-3333-3333-3333-333333333333', NULL, 'Mode', 'mode', 'Vêtements, chaussures, accessoires', 3, TRUE),
('44444444-4444-4444-4444-444444444444', NULL, 'Maison', 'maison', 'Décoration, ustensiles, électroménager', 4, TRUE),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Riz & Céréales', 'riz-cereales', 'Riz, maïs, mil, fonio', 1, TRUE),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Huiles & Condiments', 'huiles-condiments', 'Huiles, cubes, épices', 2, TRUE),
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Smartphones', 'smartphones', 'Téléphones Android et iOS', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Commission Rules (dev)
-- ============================================================================

INSERT INTO commission_rules (id, name, scope, scope_id, rate_bps, is_active, effective_from) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Commission Globale Par Défaut', 'global', NULL, 1000, TRUE, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Commission Électronique', 'category', '22222222-2222-2222-2222-222222222222', 1200, TRUE, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Commission Alimentation', 'category', '11111111-1111-1111-1111-111111111111', 800, TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Dev Users (created via Supabase Auth, then profiles inserted)
-- These UUIDs match the auth.users that will be created
-- Run this AFTER creating users in Supabase Auth dashboard or via script
-- ============================================================================

-- NOTE: These profiles assume the following auth.users exist:
-- Customer: 'c1111111-1111-1111-1111-111111111111'
-- Seller: 's2222222-2222-2222-2222-222222222222'
-- Courier: 'c3333333-3333-3333-3333-333333333333'
-- Admin: 'a4444444-4444-4444-4444-444444444444'

-- Profiles
INSERT INTO profiles (id, phone, full_name, preferred_language) VALUES
('c1111111-1111-1111-1111-111111111111', '+224620000001', 'Mamadou Diallo (DEV Customer)', 'fr'),
('s2222222-2222-2222-2222-222222222222', '+224620000002', 'Aissata Barry (DEV Seller)', 'fr'),
('c3333333-3333-3333-3333-333333333333', '+224620000003', 'Ibrahima Camara (DEV Courier)', 'fr'),
('a4444444-4444-4444-4444-444444444444', '+224620000004', 'Admin BamanaShop (DEV)', 'fr')
ON CONFLICT (id) DO NOTHING;

-- Role Memberships (approved)
INSERT INTO role_memberships (user_id, role, status, approved_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'customer', 'approved', NOW()),
('s2222222-2222-2222-2222-222222222222', 'seller', 'approved', NOW()),
('c3333333-3333-3333-3333-333333333333', 'courier', 'approved', NOW()),
('a4444444-4444-4444-4444-444444444444', 'admin', 'approved', NOW()),
-- Multi-role example: seller also courier
('s2222222-2222-2222-2222-222222222222', 'courier', 'approved', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Seller Profile
INSERT INTO seller_profiles (id, user_id, business_name, business_registration_number, tax_id, bank_account_name, bank_account_number, bank_name, status, approved_at) VALUES
('55555555-5555-5555-5555-555555555555', 's2222222-2222-2222-2222-222222222222', 'Boutique Aissata (DEV)', 'REG-2024-001234', 'TAX-2024-567890', 'Aissata Barry', '00123456789', 'BICIGUI', 'approved', NOW())
ON CONFLICT (id) DO NOTHING;

-- Courier Profile (linked to Express Guinée)
INSERT INTO courier_profiles (id, user_id, partner_id, vehicle_type, vehicle_plate, status, approved_at) VALUES
('66666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'motorcycle', 'CG-1234-AB', 'approved', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Store (DEV)
-- ============================================================================

INSERT INTO stores (id, seller_id, name, slug, description, address_line, commune, quartier, landmark, phone, email, opening_hours, status, commission_rate_bps) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Boutique Aissata Conakry', 'boutique-aissata-conakry', 'Boutique de démonstration pour le développement - Alimentation générale', 'Route de Donka', 'Dixinn', 'Donka', 'Près de l''hôpital Donka', '+224620000002', 'aissata@bamanashop.gn', '{"lundi-samedi": "08:00-20:00", "dimanche": "10:00-18:00"}', 'active', 1000)
ON CONFLICT (id) DO NOTHING;

-- Products (DEV)
INSERT INTO products (id, store_id, category_id, name, slug, description, price_gnf, compare_at_price_gnf, sku, weight_grams, status, is_featured) VALUES
('p1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Riz Parfumé 5kg (DEV)', 'riz-parfume-5kg-dev', 'Riz de qualité supérieure, grain long', 50000, 55000, 'RIZ-5KG-001', 5000, 'active', TRUE),
('p2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'Huile Végétale 1L (DEV)', 'huile-vegetale-1l-dev', 'Huile de cuisson pure, bidon 1L', 15000, NULL, 'HUILE-1L-001', 920, 'active', FALSE),
('p3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'Smartphone Android 128Go (DEV)', 'smartphone-android-128go-dev', 'Dernier modèle 2025, 6Go RAM, 128Go stockage', 1200000, 1350000, 'PHONE-AND-128', 180, 'active', TRUE),
('p4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Sucre en Poudre 1kg (DEV)', 'sucre-poudre-1kg-dev', 'Sucre blanc pur, sachet 1kg', 12000, NULL, 'SUCRE-1KG-001', 1000, 'active', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Product Images (DEV - placeholder URLs)
INSERT INTO product_images (product_id, url, alt_text, display_order) VALUES
('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Riz Parfumé 5kg', 1),
('p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1474979266404-7eaacb987c32?w=400', 'Huile Végétale 1L', 1),
('p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'Smartphone Android', 1),
('p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400', 'Sucre en Poudre 1kg', 1)
ON CONFLICT DO NOTHING;

-- Inventory Movements (initial stock)
INSERT INTO inventory_movements (product_id, quantity_delta, reason, reference_id, created_by) VALUES
('p1111111-1111-1111-1111-111111111111', 100, 'restock', NULL, 's2222222-2222-2222-2222-222222222222'),
('p2222222-2222-2222-2222-222222222222', 50, 'restock', NULL, 's2222222-2222-2222-2222-222222222222'),
('p3333333-3333-3333-3333-333333333333', 10, 'restock', NULL, 's2222222-2222-2222-2222-222222222222'),
('p4444444-4444-4444-4444-444444444444', 200, 'restock', NULL, 's2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Addresses (DEV)
INSERT INTO addresses (id, user_id, label, commune, quartier, landmark, street_details, phone, instructions, is_default) VALUES
('77777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111', 'Domicile', 'Matam', 'Hamdallaye', 'Mosquée Hamdallaye', 'Rue 12, porte 45', '+224620000001', 'Sonner à la porte bleue', TRUE)
ON CONFLICT (id) DO NOTHING;