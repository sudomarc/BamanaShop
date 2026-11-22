# AGENTS.md — BamanaShop

## Product direction
BamanaShop is becoming a general-purpose multi-vendor marketplace, launching in Conakry, Guinea. The product consists of exactly two mobile apps and one internal web console:
- `apps/customer`: customer shopping app (React Native Community CLI + React Navigation).
- `apps/pro`: one Pro app for both sellers and delivery couriers, with role-specific access and navigation (React Native Community CLI + React Navigation).
- `apps/admin`: internal administration dashboard (Next.js).
All three use one secured backend and one PostgreSQL database.

## Identity and attribution
- Keep public-facing product copy in French initially; use clear, maintainable English identifiers in code.
- Preserve the existing NovaCreations creator/distributor attribution on legacy public pages. Do not silently reassign brand ownership or authorship.
- Sudomarc is the technical repository maintainer; do not infer brand ownership from repository ownership.
- Do not remove or rewrite the legacy HTML storefront until a separate migration decision is approved. It remains a non-transactional demo and must never imply that it processes real orders or payments.

## Product invariants
- Initial market: Conakry, Guinea. Currency: GNF.
- Exactly two mobile apps: Customer and Pro (seller + courier). Admin is a web dashboard, not a third mobile app.
- A Pro account can have seller, courier, or both roles. Every action and data access must be authorized by the backend; UI hiding is not security.
- MVP checkout is single-seller per order. Multi-seller cart and order splitting are out of scope until explicitly approved.
- Delivery is fulfilled by external partners. Start with manual dispatch in Admin; do not invent partner APIs.
- Initial payment targets are cash on delivery and Orange Money, subject to merchant onboarding, provider documentation, and legal approval. Other payment methods are not assumed available.
- Do not build a wallet, store customer funds, or imply automatic split settlements. Seller balances are internal payables backed by reconciled transactions, not electronic money.
- Never mark payments as paid based only on client redirects. Verify provider events server-side and make webhook handling idempotent.
- No real payment, payout, or production courier integration without approved credentials, contracts, sandbox tests, and explicit release approval.

## Architecture baseline
- TypeScript monorepo with pnpm workspaces.
- Mobile apps use the React Native Community CLI and React Navigation. Expo, Expo Router, EAS Build and Expo Prebuild are prohibited.
- Android Gradle projects are versioned in each mobile app. Metro may bundle JavaScript during a build, but installed APKs must never require a Metro server at runtime.
- React Native Community CLI + React Navigation for both mobile apps; Next.js for Admin.
- Supabase for PostgreSQL, Auth, Storage, Realtime and Edge Functions.
- Shared contracts and domain rules belong in packages; trusted financial and authorization logic belongs server-side.
- Enable and test RLS on every exposed table. Never put service-role keys or provider secrets in client bundles.
- Store GNF amounts as integer minor units (GNF has no fractional amount in product pricing); use safe integer/bigint handling end-to-end. Never use floating-point money arithmetic.
- Preserve immutable order price/commission snapshots and an auditable financial journal. Correct mistakes with compensating entries, not destructive edits.

## Mobile build constraints
- Build Android APKs with the checked-in Gradle projects and the Android SDK. Do not generate projects with Expo Prebuild.
- DEV APKs must embed the JavaScript bundle, remain Android-debuggable, and disable React Native developer support so they do not connect to Metro at runtime.
- BETA and PRODUCTION APKs must embed the JavaScript bundle and have `android:debuggable=false`.
- Install, inspect and collect logs through ADB. Never claim standalone behavior until the APK has been inspected and run without Metro.

## Repository workflow
- Read this file and the relevant docs before changing code.
- Work on a feature branch and use a Pull Request. Never push directly to `main`.
- Keep changes scoped and minimal. Do not overwrite another agent's files or modify files outside your assigned workstream without coordination.
- Do not commit secrets, real customer data, provider credentials, or production exports. Keep local secrets in ignored environment files and provide safe example files.
- Pin dependencies and commit the lockfile. Do not invent package scripts; inspect package manifests first.
- Add or update tests for changed behavior. Run relevant lint, typecheck, tests and build; report commands and actual results.
- Inspect `git diff` and `git status` before finishing. Never claim a check passed unless it was run.

## Four-agent ownership boundaries
The orchestrator owns root workspace configuration, integration, CI, cross-workstream changes and final review.
1. Platform agent: `supabase/**`, `packages/contracts/**`, `packages/domain/**`, and platform tests under `supabase/tests/**`.
2. Customer app agent: `apps/customer/**` only.
3. Pro app agent: `apps/pro/**` only.
4. Admin and QA agent: `apps/admin/**`, `tests/**`, and QA documentation under `docs/qa/**`.
Agents must not edit another workstream's paths. Coordinate shared contracts before consuming them; use typed mocks/adapters while contracts are being finalized. The orchestrator alone owns root `package.json`, `pnpm-workspace.yaml`, root TypeScript config, CI workflows and repo-wide tooling.

## Definition of done
A task is complete only when behavior is implemented, authorization and error states are considered, tests are added, checks are run, and the diff is reviewed. Document external blockers explicitly. A polished screen with fake success states is not a completed commerce feature.
