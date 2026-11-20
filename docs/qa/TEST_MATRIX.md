# BamanaShop — Matrice de Tests QA

Version: 1.0 · 19 novembre 2026

## Objectif

Documenter la couverture de tests pour chaque rôle × flux × état, servant de référence pour :
- Planification des tests de régression
- Revue avant release
- Suivi des lacunes de couverture

## Rôles & Permissions

| Rôle | Accès Principal | Restrictions Clés |
|------|----------------|-------------------|
| `customer` | Ses commandes, profil, adresses, panier | Ne voit pas commandes d'autres clients |
| `seller` | Sa boutique, ses produits, ses commandes | Ne voit pas produits/commandes d'autres vendeurs |
| `courier` | Missions assignées uniquement | Ne peut pas chercher missions non assignées |
| `admin` | Tout | Aucune (mais audit log) |

---

## Matrice de Couverture : Customer App

| Flux | État Initial | Action | Résultat Attendu | Test Unitaire | Test Intégration | E2E | Note |
|------|--------------|--------|------------------|---------------|------------------|-----|------|
| **Auth** | Non connecté | Inscription | Compte créé, rôle `customer` approved | ✅ | ✅ | ✅ | |
| **Auth** | Non connecté | Connexion | Session créée, profil chargé | ✅ | ✅ | ✅ | |
| **Auth** | Connecté | Déconnexion | Session détruite, redirection login | ✅ | | ✅ | |
| **Catalogue** | Connecté | Parcourir catégories | Liste catégories actives | ✅ | ✅ | ✅ | |
| **Catalogue** | Connecté | Rechercher produits | Résultats filtrés | ✅ | ✅ | ✅ | |
| **Catalogue** | Connecté | Voir fiche produit | Détails, images, prix, stock | ✅ | ✅ | ✅ | |
| **Catalogue** | Connecté | Voir boutique | Produits de la boutique | ✅ | ✅ | ✅ | |
| **Panier** | Produit en stock | Ajouter au panier | Item ajouté, quantité 1 | ✅ | ✅ | ✅ | |
| **Panier** | Article dans panier | Modifier quantité | Quantité mise à jour | ✅ | ✅ | ✅ | |
| **Panier** | Multiples articles mêmes boutique | Continuer | OK | ✅ | ✅ | ✅ | |
| **Panier** | Articles de boutiques différentes | Ajouter 2ème boutique | Erreur "panier mono-vendeur" | ✅ | ✅ | ✅ | Règle métier |
| **Panier** | Stock insuffisant | Ajouter > stock | Erreur stock | ✅ | ✅ | ✅ | |
| **Checkout** | Panier valide + adresse | Choisir COD | Résumé correct, total計 | ✅ | ✅ | ✅ | |
| **Checkout** | Panier valide + adresse | Choisir Orange Money | Désactivé si pas d'accès | ✅ | | ✅ | Bloqué MVP |
| **Checkout** | Panier valide | Confirmer commande | Order créé `pending`, stock réservé | ✅ | ✅ | ✅ | Via Edge Function |
| **Commandes** | Commande `pending` | Voir historique | Liste chronologique | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `preparing` | Voir détails | Timeline, articles, adresse | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `delivered` | Voir preuve | Photo/signature/Otp | ✅ | | ✅ | |
| **Commandes** | Commande `pending` | Annuler | Statut `cancelled`, stock libéré | ✅ | ✅ | ✅ | |
| **Profil** | Connecté | Modifier profil | MAJ nom, téléphone | ✅ | ✅ | | |
| **Profil** | Connecté | Gérer adresses | CRUD adresses | ✅ | ✅ | ✅ | |
| **Profil** | Connecté | Changer mdp | MAJ sécurisée | | ✅ | | |

---

## Matrice de Couverture : Pro App - Seller Space

| Flux | État Initial | Action | Résultat Attendu | Test Unitaire | Test Intégration | E2E | Note |
|------|--------------|--------|------------------|---------------|------------------|-----|------|
| **Auth** | Vendeur approuvé | Connexion | Accès espace vendeur | ✅ | ✅ | ✅ | |
| **Auth** | Vendeur en attente | Connexion | Message "en attente d'approbation" | ✅ | ✅ | ✅ | |
| **Auth** | Multi-rôle | Sélection rôle | Navigation vers bon espace | ✅ | ✅ | ✅ | |
| **Dashboard** | Connecté | Voir stats | Commandes du jour, CA, alertes stock | ✅ | ✅ | ✅ | |
| **Produits** | Connecté | Lister produits | Produits de SA boutique seulement | ✅ | ✅ | ✅ | RLS |
| **Produits** | Produit existant | Modifier prix/stock | MAJ immédiate | ✅ | ✅ | ✅ | |
| **Produits** | Nouveau produit | Créer | Produit `draft` puis `active` | ✅ | ✅ | ✅ | |
| **Produits** | Produit actif | Archiver | Statut `archived` | ✅ | ✅ | | |
| **Commandes** | Commande `pending` | Confirmer | Statut `confirmed` | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `confirmed` | Préparer | Statut `preparing` | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `preparing` | Prêt à collecter | Statut `ready_for_pickup` | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `ready` | Voir détails livraison | Adresse, client, articles | ✅ | ✅ | ✅ | |
| **Commandes** | Commande `pending` | Annuler | Statut `cancelled`, stock libéré | ✅ | ✅ | ✅ | |
| **Boutique** | Connecté | Modifier infos | MAJ nom, heures, description | ✅ | ✅ | | |
| **Revenus** | Historique existant | Voir payables | Montants nets, statuts | ✅ | | ✅ | |
| **Revenus** | Payable disponible | Demander virement | Statut `processing` | | | ✅ | Admin valide |

---

## Matrice de Couverture : Pro App - Courier Space

| Flux | État Initial | Action | Résultat Attendu | Test Unitaire | Test Intégration | E2E | Note |
|------|--------------|--------|------------------|---------------|------------------|-----|------|
| **Auth** | Livreur approuvé | Connexion | Accès espace livreur | ✅ | ✅ | ✅ | |
| **Auth** | Livreur en attente | Connexion | Message "en attente" | ✅ | ✅ | ✅ | |
| **Missions** | Missions assignées | Liste missions | Seulement SES missions | ✅ | ✅ | ✅ | RLS |
| **Mission** | `assigned` | Accepter | Statut `accepted` | ✅ | ✅ | ✅ | |
| **Mission** | `accepted` | Collecter | Statut `picked_up`, timestamp | ✅ | ✅ | ✅ | |
| **Mission** | `picked_up` | En route | Statut `in_transit` | ✅ | ✅ | ✅ | |
| **Mission** | `in_transit` | Livrer | Statut `delivered` | ✅ | ✅ | ✅ | |
| **Mission** | `delivered` | Preuve | Photo/signature/OTP sauvée | ✅ | ✅ | ✅ | |
| **Mission** | `assigned` | Signaler incident | Incident créé, admin notifié | ✅ | ✅ | ✅ | |
| **Mission** | `delivered` | Voir historique | Dans onglet Historique | ✅ | | ✅ | |
| **Gains** | Livraisons terminées | Voir récap | Nombre, COD collecté | ✅ | | | |

---

## Matrice de Couverture : Admin Dashboard

| Flux | Action | Résultat Attendu | Test Unitaire | Test Intégration | E2E | Note |
|------|--------|------------------|---------------|------------------|-----|------|
| **Auth** | Connexion admin | Accès dashboard | ✅ | ✅ | ✅ | Middleware |
| **Vendeurs** | Lister vendeurs | Filtres statut, recherche | ✅ | ✅ | ✅ | |
| **Vendeurs** | Approuver vendeur | Rôle `seller` approved | ✅ | ✅ | ✅ | |
| **Vendeurs** | Suspendre vendeur | Statut `suspended` | ✅ | ✅ | | |
| **Boutiques** | Lister boutiques | Filtres, actions | ✅ | ✅ | | |
| **Produits** | Modérer produits | Activer/archiver | ✅ | ✅ | | |
| **Commandes** | Lister commandes | Filtres multi-critères | ✅ | ✅ | ✅ | |
| **Commandes** | Voir détail | Timeline complète | ✅ | ✅ | ✅ | |
| **Commandes** | Override statut | Tout statut possible | ✅ | ✅ | | Admin only |
| **Commandes** | Rembourser | Création refund | ✅ | ✅ | | |
| **Dispatch** | Voir non assignées | Liste commandes prêtes | ✅ | ✅ | ✅ | |
| **Dispatch** | Assigner livreur | Création delivery_job | ✅ | ✅ | ✅ | Edge Function |
| **Dispatch** | Voir en cours | Tracking temps réel | | | ✅ | Realtime |
| **Finances** | Journal financier | Append-only, filtres | | ✅ | | |
| **Payables** | Générer période | Calcul automatique | ✅ | ✅ | ✅ | |
| **Payables** | Marquer payé | Preuve + référence | | | ✅ | |
| **Support** | Voir tickets | Filtres priorité/statut | ✅ | ✅ | ✅ | |
| **Support** | Répondre/résoudre | MAJ statut | ✅ | ✅ | | |
| **Settings** | CRUD commissions | Règles versionnées | ✅ | ✅ | | |
| **Settings** | CRUD partenaires | Zones, tarifs | ✅ | ✅ | | |

---

## Tests de Sécurité (RLS - Négatifs)

| Scénario | Tentative | Résultat Attendu | Test |
|----------|-----------|------------------|------|
| Client A | SELECT orders WHERE customer_id = B | 0 rows / 403 | ✅ |
| Vendeur A | SELECT products WHERE store_id = B | 0 rows | ✅ |
| Vendeur A | INSERT products (store_id = B) | 403 / RLS violation | ✅ |
| Livreur | SELECT delivery_jobs WHERE courier_id ≠ self | 0 rows | ✅ |
| Livreur | UPDATE delivery_jobs SET status = 'delivered' (non assigné) | 403 | ✅ |
| Admin | Tous accès | 200 / données complètes | ✅ |
| Non-auth | Accès /dashboard | 302 → /login | ✅ |
| Client | POST /api/orders/[id]/status | 403 | ✅ |

---

## Tests de Résilience

| Scénario | Description | Critère de Succès |
|----------|-------------|-------------------|
| **Double soumission** | Clic rapide 2x "Commander" | 1 seule commande créée (idempotence) |
| **Stock concurrent** | 2 clients même produit, stock 1 | 1 commande OK, 1 erreur stock |
| **Webhook dupliqué** | Même provider_event_id reçu 2x | 1 seul payment_event processed=true |
| **Webhook désordonné** | paid reçu avant requires_action | Gestion état correcte |
| **Paiement échoué** | Provider renvoie failed | Order status failed, stock libéré |
| **Annulation livraison** | Courier signale échec | Incident créé, order returned possible |
| **Reversement double** | Admin clique 2x "Payer" | 1 seul payout créé (vérif référence) |

---

## Couverture Actuelle vs Cible

| Catégorie | Couverture Actuelle | Cible MVP | Gap |
|-----------|---------------------|-----------|-----|
| Auth & Rôles | 80% | 100% | Multi-rôle, refresh token |
| Customer Flows | 70% | 100% | Orange Money, offline |
| Seller Flows | 60% | 100% | Images produits, exports |
| Courier Flows | 65% | 100% | Navigation GPS, offline proof |
| Admin Flows | 75% | 100% | Realtime, exports CSV/PDF |
| RLS Sécurité | 90% | 100% | Tests cross-tenant |
| Résilience | 50% | 80% | Chaos testing |

---

## Exécution des Tests

```bash
# Tests unitaires (tous workspaces)
pnpm test

# Tests RLS (requiert Supabase local)
pnpm supabase:start && pnpm supabase:reset && pnpm test:rls

# Tests E2E (requiert apps en dev)
pnpm dev &
pnpm test:e2e

# Couverture
pnpm test --coverage
```

---

## Critères de Release MVP

- [ ] Tous les tests unitaires passent
- [ ] Tous les tests RLS passent (0 fuite de données)
- [ ] 5 parcours E2E critiques passent (Customer→Order, Seller→Prepare, Courier→Deliver, Admin→Dispatch, Admin→Payout)
- [ ] 0 vulnérabilité critique détectée
- [ ] Temps de réponse API < 500ms (p95)
- [ ] Aucune régression sur `main` branch