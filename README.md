# BamanaShop

BamanaShop is being developed into a general-purpose multi-vendor marketplace launching in Conakry, Guinea.

## Product structure

- **BamanaShop** — customer mobile app for discovering products, shopping, paying and tracking orders.
- **BamanaShop Pro** — one mobile app for sellers and delivery couriers, with separate role-based workspaces.
- **BamanaShop Admin** — internal Next.js web dashboard for marketplace operations, seller moderation, orders, commissions, payment reconciliation and delivery dispatch.

The three interfaces share one secured backend and PostgreSQL database.

## Current repository status

The existing root HTML/CSS/JavaScript site is a legacy, non-transactional storefront prototype. It has no production accounts, order backend, payment processing, seller portal or logistics integration. It is retained as a visual/history reference while the marketplace monorepo is prepared. Do not use it to accept real orders or payments.

## Project documents

- [Product specification](docs/PRODUCT_SPEC.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Current status and next actions](STATUS.md)
- [Four-agent workstream boundaries](docs/WORKSTREAMS.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Development start prompt](docs/START_PROMPT.md)

## Technology baseline

- pnpm workspaces and TypeScript
- Expo / React Native: Customer and Pro apps
- Next.js: Admin dashboard
- Supabase: PostgreSQL, Auth, Storage, Realtime and Edge Functions

The root workspace scaffold is planned; commands will be documented after the manifests are created and verified.

## Important product constraints

- Initial market: Conakry. Currency: GNF.
- Checkout is single-seller per order for the MVP.
- Delivery is provided by external partners; dispatch starts manually in Admin.
- Cash on delivery and Orange Money are target payment methods, subject to provider onboarding, contracts, technical verification and applicable approvals.
- Seller payables are an auditable accounting balance, not a customer or seller wallet. Do not custody or split funds without an approved legal and provider model.
- No production payment or delivery integration may be claimed until it has been tested end-to-end with authorized provider access.

## Repository conventions

Read [AGENTS.md](AGENTS.md) before making changes. Use a feature branch and Pull Request; never push directly to `main`. Preserve the existing NovaCreations attribution on legacy public pages. Sudomarc is the repository maintainer; repository ownership does not establish brand ownership.

## Legacy storefront

The root `index.html` and its supporting assets remain a demonstration storefront. Its checkout is simulated and must not be represented as a real commerce service while the new platform is under development.
