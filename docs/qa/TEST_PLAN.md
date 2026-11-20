# Plan de Tests QA — BamanaShop MVP

Version: 1.0 · 19 novembre 2026

## 1. Objectifs

Valider que le MVP BamanaShop répond aux critères d'acceptation définis dans [PRODUCT_SPEC.md](../PRODUCT_SPEC.md#8-critères-dacceptation) :

> Le MVP doit démontrer un parcours complet avec un client, un vendeur approuvé, un livreur autorisé, une commande, une preuve de livraison, un paiement rapproché et un montant vendeur calculé correctement. Les tests doivent couvrir les permissions, les doubles soumissions, les webhooks répétés, les stocks concurrents, les annulations, les remboursements et les livraisons échouées.

## 2. Périmètre de Tests

### In Scope (MVP)
- ✅ Parcours Client : Découverte → Panier → Checkout COD → Commande → Suivi
- ✅ Parcours Vendeur : Login → Dashboard → Produits → Commandes → Préparation → Prêt
- ✅ Parcours Livreur : Login → Missions → Accepter → Collecter → Livrer → Preuve
- ✅ Parcours Admin : Login → Commandes → Dispatch → Rapprochement → Payables
- ✅ Sécurité : RLS isolation, Auth/Role guards
- ✅ Résilience : Idempotence, stock concurrent, webhooks dupliqués

### Out of Scope (Post-MVP)
- ❌ Orange Money (accès non validé)
- ❌ Multi-seller cart
- ❌ Wallet / split payments
- ❌ Push notifications
- ❌ Mode offline complet
- ❌ Tests de charge / performance

## 3. Stratégie de Tests

### Pyramide de Tests

```
                    ┌─────────────┐
                    │   E2E (5)   │  Parcours critiques bout-en-bout
                   ├───────────────┤
                  │  Intégration  │  API, DB, RLS, Edge Functions
                 ├─────────────────┤
                │   Unitaires     │  Domain logic, composants, utils
               ├────────────────────┤
```

### Répartition des Efforts

| Niveau | % Effort | Outils | Responsable |
|--------|----------|--------|-------------|
| Unitaires | 60% | Vitest | Chaque workstream |
| Intégration | 25% | Vitest + Supabase local | Platform + Admin |
| E2E | 15% | Playwright | Admin + QA |

## 4. Scénarios de Tests Critiques (E2E)

### TC-E2E-001 : Parcours Client Complet (Happy Path)
**Objectif** : Valider le flux acheteur de bout en bout
**Prérequis** : Vendeur approuvé avec produits en stock, livreur disponible, partenaire actif
**Données** : Client test, adresse Matam, panier 2 articles même boutique

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Client se connecte | Dashboard client affiché |
| 2 | Parcourt catalogue, ajoute 2 produits | Panier = 2 items, même boutique |
| 3 | Va au panier, choisit adresse, COD | Récapitulatif correct (sous-total + livraison) |
| 4 | Confirme commande | Order créé `pending`, notification |
| 5 | Vendeur connecte, voit commande | Statut `pending` dans dashboard |
| 6 | Vendeur confirme → prépare → prêt | Statuts `confirmed` → `preparing` → `ready_for_pickup` |
| 7 | Admin dispatch → assigne livreur | Delivery job créé, statut `assigned` |
| 8 | Livreur connecte, accepte mission | Statut `accepted` |
| 9 | Livreur collecte → en route → livre | `picked_up` → `in_transit` → `delivered` + preuve |
| 10 | Admin rapproche COD | Payment `cash_collected`, financial entry |
| 11 | Admin génère payable période | Payout `payable` avec bon montant |
| 12 | Admin marque payé (preuve virement) | Payout `paid`, seller notified |

**Critères de Succès** : Toutes étapes passent sans erreur, montants cohérents, RLS respecté

---

### TC-E2E-002 : Annulation Commande par Client
**Objectif** : Client annule avant préparation
**Prérequis** : Commande `pending`
**Résultat** : Statut `cancelled`, stock libéré, notification vendeur

---

### TC-E2E-003 : Stock Concurrent
**Objectif** : Deux clients tentent d'acheter le dernier stock
**Prérequis** : Produit stock = 1
**Résultat** : 1 commande OK, 1 erreur "stock insuffisant", pas de survente

---

### TC-E2E-004 : Livraison Échouée + Incident
**Objectif** : Client absent, livreur signale incident
**Prérequis** : Mission `in_transit`
**Résultat** : Incident créé, admin notifié, order `failed` ou `returned`

---

### TC-E2E-005 : Remboursement Post-Livraison
**Objectif** : Client signale produit endommagé, remboursement
**Prérequis** : Order `completed`, payment `paid`
**Résultat** : Refund créé, financial entry `refund_to_customer`, seller payable ajusté

---

## 5. Tests d'Intégration (Par Workstream)

### Platform (Supabase + Packages)
| ID | Test | Description |
|----|------|-------------|
| PL-INT-001 | Migration clean | `pnpm supabase:reset` passe sans erreur |
| PL-INT-002 | Seed data | Données de dev insérées correctement |
| PL-INT-003 | RLS policies | Tous tests `pnpm test:rls` passent |
| PL-INT-004 | Edge Functions | `create_order`, `confirm_payment`, `dispatch_delivery`, `process_payout` retournent résultats attendus |
| PL-INT-005 | Domain logic | `calculateOrderTotals`, `calculateCommission`, `validateCartItems` tests unitaires passent |
| PL-INT-006 | Type generation | `pnpm supabase:types` génère types sans erreur |
| PL-INT-007 | Financial journal | Écritures append-only, montants cohérents |

### Customer App
| ID | Test | Description |
|----|------|-------------|
| CU-INT-001 | Auth flow | Login/register/logout fonctionnent |
| CU-INT-002 | Cart mono-seller | Erreur si boutique différente |
| CU-INT-003 | Checkout COD | Order créé via mock API |
| CU-INT-004 | Order history | Liste + détails + timeline |
| CU-INT-005 | Loading/Empty/Error | Tous états couverts |

### Pro App - Seller
| ID | Test | Description |
|----|------|-------------|
| PR-S-INT-001 | Role gate | Vendeur non approuvé bloqué |
| PR-S-INT-002 | Products CRUD | Create/read/update/archive |
| PR-S-INT-003 | Order transitions | pending→confirmed→preparing→ready |
| PR-S-INT-004 | Low stock alert | Affiché sur dashboard |

### Pro App - Courier
| ID | Test | Description |
|----|------|-------------|
| PR-C-INT-001 | Mission list | Seulement missions assignées |
| PR-C-INT-002 | Status flow | assigned→accepted→picked_up→delivered |
| PR-C-INT-003 | Proof capture | Photo/signature/OTP saved |
| PR-C-INT-004 | Incident report | Created with type/description |

### Admin Dashboard
| ID | Test | Description |
|----|------|-------------|
| AD-INT-001 | Auth guard | Non-admin redirigé vers /login |
| AD-INT-002 | Orders list | Filtres, pagination, actions |
| AD-INT-003 | Dispatch flow | Assign courier → delivery_job créé |
| AD-INT-004 | Payables calc | Génération période, montants corrects |
| AD-INT-005 | Finance journal | Append-only, filtres, export |

## 6. Tests de Sécurité (RLS)

| ID | Test Négatif | Résultat Attendu |
|----|--------------|------------------|
| SEC-001 | Client A lit orders Client B | 0 rows |
| SEC-002 | Vendeur A lit products Vendeur B | 0 rows |
| SEC-003 | Vendeur A insert products Store B | 403 / RLS violation |
| SEC-004 | Livreur lit delivery_jobs non assignés | 0 rows |
| SEC-005 | Client update order status | 403 |
| SEC-006 | Non-admin accède /dashboard | 302 → /login |
| SEC-007 | Service role key absent clients | Vérifié bundle |

## 7. Tests de Résilience

| ID | Scénario | Critère |
|----|----------|---------|
| RES-001 | Double clic "Commander" | 1 seule order (idempotence) |
| RES-002 | 2 clients même produit, stock 1 | 1 OK, 1 erreur |
| RES-003 | Webhook paiement dupliqué | 1 seul processed=true |
| RES-004 | Webhook désordonné | État final correct |
| RES-005 | Paiement échoué → stock libéré | Order failed, stock restauré |
| RES-006 | Livraison échouée → incident | Incident créé |

## 8. Environnements & Données de Test

### Environnement Local (Développement)
- Supabase local via Docker (`pnpm supabase:start`)
- Seed data `01_dev_data.sql` (utilisateurs, boutique, produits, stock)
- Mock APIs pour paiement/livraison

### Environnement CI (GitHub Actions)
- Postgres service container
- Migrations appliquées
- Tests RLS + unitaires

### Données de Test Clés

| Entité | ID | Notes |
|--------|-----|-------|
| Customer | `c1111111-1111-1111-1111-111111111111` | Client test |
| Seller | `s2222222-2222-2222-2222-222222222222` | Vendeur approuvé |
| Courier | `c3333333-3333-3333-3333-333333333333` | Livreur approuvé |
| Admin | `a4444444-4444-4444-4444-444444444444` | Admin test |
| Store | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | Boutique active |
| Products | `p1111111-...` à `p4444444-...` | 4 produits en stock |
| Partner | `dddddddd-dddd-dddd-dddd-dddddddddddd` | Express Guinée |

## 9. Critères de Release (Definition of Done)

### Blocage Release (Must Have)
- [ ] Tous tests unitaires passent (`pnpm test`)
- [ ] Tous tests RLS passent (`pnpm test:rls`)
- [ ] 5 scénarios E2E critiques passent (TC-E2E-001 à 005)
- [ ] 0 vulnérabilité critique (npm audit / Snyk)
- [ ] `pnpm verify:all` passe (lint + format + typecheck + test + build)
- [ ] Aucune régression sur `main` (git diff clean)

### Recommandé (Should Have)
- [ ] Couverture tests unitaires > 80% (domain, contracts)
- [ ] Tests intégration Platform passent
- [ ] Documentation QA à jour (TEST_MATRIX, BUG_TEMPLATE)
- [ ] Temps de réponse API < 500ms p95 local

### Nice to Have
- [ ] Tests E2E automatisés dans CI
- [ ] Monitoring d'erreurs configuré (Sentry)
- [ ] Tests de charge basiques (k6)

## 10. Exécution & Rapport

### Commandes de Lancement

```bash
# Suite complète locale
export PATH="/home/marco/.npm-global/bin:$PATH"
pnpm install
pnpm supabase:start
pnpm supabase:reset
pnpm verify:all

# Tests RLS seulement
pnpm test:rls

# Tests E2E (apps doivent tourner)
pnpm dev &
sleep 30
pnpm test:e2e
```

### Format de Rapport

| Exécution | Date | Env | Tests Passés | Tests Échoués | Bloquants | Notes |
|-----------|------|-----|--------------|---------------|-----------|-------|
| #1 | 2026-11-19 | Local | 142 | 3 | 1 | Stock concurrent flaky |
| #2 | 2026-11-20 | CI | 145 | 0 | 0 | Vert |

### Suivi des Défauts

| ID | Titre | Severité | Statut | Propriétaire | Résolution |
|----|-------|----------|--------|--------------|------------|
| BUG-001 | ... | High | Open | Platform | En cours |

---

## 11. Maintenance

- **Mise à jour** : À chaque nouvelle fonctionnalité ou correction de bug
- **Revue** : Hebdomadaire lors du sprint review
- **Archivage** : Rapports conservés 6 mois

---

*Plan de tests version 1.0 — Aligné sur PRODUCT_SPEC.md et ROADMAP.md Phase 3-6*