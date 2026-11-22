# BamanaShop Marketplace

> **Generalist marketplace for Conakry, Guinea (GNF currency)**
> Two mobile apps + one internal web dashboard, backed by Supabase/PostgreSQL

## 🏗️ Architecture

```
BamanaShop/
├── apps/
│   ├── customer/          # React Native CLI / React Navigation - Buyer app
│   ├── pro/               # React Native CLI / React Navigation - Seller + Courier app
│   └── admin/             # Next.js - Internal admin dashboard
├── packages/
│   ├── contracts/         # Zod schemas + TypeScript types (shared)
│   └── domain/            # Pure business logic (shared, no I/O)
├── supabase/
│   ├── migrations/        # SQL migrations (schema, RLS, functions)
│   ├── seed/              # Development seed data
│   └── tests/             # RLS isolation tests
├── tests/                 # E2E / integration tests (Admin QA)
└── docs/                  # Documentation
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── PRODUCT_SPEC.md
    ├── ROADMAP.md
    ├── STATUS.md
    └── WORKSTREAMS.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 12 (`npm install -g pnpm@12.21.0`)

### Installation

```bash
# Clone and enter the repo
cd /home/marco/DEV/BamanaShop

# Install dependencies (all workspaces)
pnpm install --frozen-lockfile

# Configure environment
cp .env.example .env.local
# Edit .env.local for Admin/server tools. Never expose the service-role key to mobile apps.
# Create .env.mobile containing only SUPABASE_URL and SUPABASE_ANON_KEY for Customer/Pro builds.

# Start local Supabase with the workspace-pinned Supabase CLI (2.122.1)
pnpm supabase:start

# Reset and migrate the local Supabase database only
pnpm supabase:reset

# Generate TypeScript types from the local database
pnpm supabase:types

# Start all development servers
pnpm dev
```

This starts:
- **Customer app** (React Native CLI) → `pnpm dev:customer` (starts the development Metro bundler only)
- **Pro app** (React Native CLI) → `pnpm dev:pro` (starts the development Metro bundler only)
- **Admin dashboard** (Next.js) → `pnpm dev:admin` at http://localhost:3000

## 📦 Workspace Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:customer` | Start Customer React Native app |
| `pnpm dev:pro` | Start Pro React Native app |
| `pnpm dev:admin` | Start Admin Next.js app |
| `pnpm build` | Build shared packages and Admin web app |
| `pnpm build:packages` | Build shared packages only |
| `pnpm build:customer:android` | Build Customer production APK |
| `pnpm build:pro:android` | Build Pro production APK |
| `pnpm lint` | ESLint all workspaces |
| `pnpm format:check` | Prettier check all workspaces |
| `pnpm typecheck` | TypeScript strict check all workspaces |
| `pnpm test` | Run all unit tests |
| `pnpm test:rls` | Run RLS isolation tests |
| `pnpm verify:all` | Full CI pipeline (lint + format + typecheck + test + build) |
| `pnpm supabase:start` | Start local Supabase |
| `pnpm supabase:stop` | Stop local Supabase |
| `pnpm supabase:reset` | Reset DB & run migrations |
| `pnpm supabase:types` | Generate DB types to packages/contracts |

## 👥 Workstream Ownership

| Workstream | Agent | Paths | Responsibilities |
|------------|-------|-------|------------------|
| **Platform** | Platform Agent | `supabase/**`, `packages/contracts/**`, `packages/domain/**`, `supabase/tests/**` | DB schema, RLS, contracts, domain logic, Edge Functions |
| **Customer** | Customer Agent | `apps/customer/**` | Buyer app: discovery, catalog, cart, checkout, orders |
| **Pro** | Pro Agent | `apps/pro/**` | Seller + Courier spaces (role-separated) |
| **Admin + QA** | Admin Agent | `apps/admin/**`, `tests/**`, `docs/qa/**` | Dashboard, moderation, dispatch, finance, E2E tests |
| **Orchestrator** | (Human) | Root configs, CI, integration | `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.github/workflows/**`, `README.md` |

**Strict rule:** No agent modifies another workstream's paths. Coordinate via contracts.

## 🗄️ Database (Supabase)

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (extends auth.users) | User owns |
| `role_memberships` | Roles: customer, seller, courier, admin | User owns / Admin all |
| `seller_profiles` | Seller business info | Seller owns / Admin all |
| `courier_profiles` | Courier vehicle/partner info | Courier owns / Partner mgr / Admin |
| `delivery_partners` | Logistics partners | Public read / Admin all |
| `categories` | Product categories (hierarchical) | Public read / Admin all |
| `stores` | Seller storefronts | Public read active / Seller write / Admin all |
| `products` | Store products | Public read active / Seller write / Admin all |
| `orders` | Customer orders | Customer own / Seller store / Courier assigned / Admin all |
| `order_items` | Order line items | Follows order |
| `payments` | Payment records | Follows order |
| `payment_events` | Webhook logs | Admin only |
| `delivery_jobs` | Dispatch missions | Courier assigned / Partner mgr / Seller store / Admin all |
| `delivery_events` | Status timeline | Involved parties |
| `delivery_proofs` | Proof of delivery | Courier create / Involved read / Admin all |
| `incidents` | Delivery issues | Reporter / Courier / Admin |
| `commission_rules` | Configurable commissions | Admin only |
| `financial_entries` | Immutable audit journal | Admin only |
| `seller_payouts` | Payable calculations | Seller own / Admin all |
| `refunds` | Refund tracking | Follows order |
| `support_tickets` | Customer/seller/courier support | User own / Assigned / Admin |
| `audit_logs` | Security audit trail | Admin only |

### Financial Rules

- All amounts: **integer GNF** (no decimals)
- Server-side calculations only (Edge Functions / DB functions)
- Immutable snapshots at checkout
- Append-only financial journal
- Payouts require manual reconciliation before marking paid

### RLS Policy Pattern

```sql
-- Example: Seller can only manage their own store's products
CREATE POLICY "products_seller_manage" ON products
FOR ALL USING (
  is_store_seller(store_id)
) WITH CHECK (
  is_store_seller(store_id)
);

-- Helper function
CREATE FUNCTION is_store_seller(p_store_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores s
    JOIN seller_profiles sp ON sp.id = s.seller_id
    WHERE s.id = p_store_id AND sp.user_id = auth.uid() AND sp.status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

## 💰 Payment Flows (MVP)

### Cash on Delivery (COD)
1. Customer selects COD at checkout
2. Order created with `payment_status = 'cash_due'`
3. Admin dispatches to courier partner
4. Courier collects cash on delivery
5. Admin reconciles cash with partner
6. Seller payout calculated after reconciliation

### Orange Money (Post-MVP, requires access)
- Merchant onboarding required
- Sandbox testing mandatory
- Webhook verification with idempotence
- Server-side callback validation only

**No wallet, no split payments, no automatic payouts in MVP.**

## 📱 App Features

### Customer App (React Native CLI)
- Home: categories, featured stores/products
- Search & filters
- Store & product details
- Mono-seller cart with price breakdown
- Address management (commune/quartier/landmark)
- Checkout: COD / Orange Money (when enabled)
- Order history with status timeline
- Profile & settings

### Pro App (React Native CLI) - Two Spaces
**Seller Space:**
- Dashboard: today's orders, revenue, low stock alerts
- Products CRUD with images, stock, pricing
- Order management: confirm → prepare → ready_for_pickup
- Store settings & opening hours
- Earnings: revenue, payables, payout requests

**Courier Space:**
- Assigned missions list with filters
- Mission detail: pickup/dropoff, navigation, actions
- Status transitions: accept → picked_up → in_transit → delivered/failed
- Proof capture: photo, signature, OTP
- Incident reporting
- Earnings: deliveries, COD collected, partner payouts

### Admin Dashboard (Next.js)
- Orders: list, filter, dispatch, manual status override
- Dispatch: assign couriers/partners manually
- Sellers: approve/suspend, view stores/products/orders
- Products: moderation
- Finance: immutable journal, GMV, commissions
- Payables: period calculations, mark paid with proof
- Support: ticket management
- Settings: commission rules, delivery partners, categories

## 🧪 Testing

```bash
# Unit tests (domain logic, components)
pnpm test

# RLS isolation tests (requires local Supabase)
pnpm supabase:start
pnpm supabase:reset
pnpm test:rls

# E2E tests (requires all apps running)
pnpm dev        # in one terminal
pnpm test:e2e   # in another (Playwright/Cypress)
```

## 📄 Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical architecture
- [Decisions](docs/DECISIONS.md) - Decision register (D-001 through D-009)
- [Product Spec](docs/PRODUCT_SPEC.md) - Detailed product specification
- [Roadmap](ROADMAP.md) - Product & technical roadmap (Phases 0-8)
- [Status](STATUS.md) - Current project status & blockers
- [Workstreams](docs/WORKSTREAMS.md) - Four-agent governance model

## 🛡️ Security

- **RLS on every exposed table** - tested in CI
- **No service-role keys in clients** - only in Edge Functions/Admin API
- **Financial rules server-side only** - never trust client prices/status
- **Immutable audit trail** - append-only financial_entries + audit_logs
- **Idempotent webhooks** - payment_events with unique provider_event_id

## 🚫 MVP Exclusions

- Multi-seller cart / order splitting
- Own logistics fleet
- Automatic payouts / split payments
- Wallet / stored value
- Credit / BNPL / installments
- Multi-country
- Ads / seller subscriptions
- Advanced routing optimization

## 📋 License

MIT License - see [LICENSE](LICENSE)

## 👤 Maintainer

**Sudomarc** - Technical repository maintainer  
(Not the brand creator - NovaCreations attribution preserved on legacy pages)

---

*This monorepo replaces the legacy static HTML storefront. The static site remains at `index.html` et al. for historical reference.*

## Android APKs

Customer and Pro have checked-in native Android Gradle projects. Build APKs with `./BUILD_AND_INSTALL.sh customer dev 1.2.3` or `./BUILD_AND_INSTALL.sh pro beta 1.2.3`, or use the **Android APK** GitHub Actions workflow. The JavaScript bundle is embedded in each APK; an installed APK does not need a Metro server. See [Android build instructions](docs/ANDROID_GITHUB_ACTIONS.md).


> **Android runtime:** Metro is not required for installed APKs. The Android build embeds the JavaScript bundle in DEV, BETA and PRODUCTION. DEV keeps Android debuggable for ADB/Logcat while React Native developer support stays disabled.
