# BamanaShop — Architecture technique

Version : 1.0 · 19 novembre 2026

## 1. Architecture cible

Monorepo TypeScript contenant :
- `apps/customer` : React Native Community CLI (sans Expo) + React Navigation, application acheteur.
- `apps/pro` : React Native Community CLI (sans Expo) + React Navigation, application vendeur + livreur.
- `apps/admin` : Next.js, interface web interne.
- `packages/contracts` : types et schémas d'échange partagés.
- `packages/domain` : règles métier pures et calculs testables.
- `supabase` : migrations PostgreSQL, politiques RLS, Edge Functions, tests SQL.

Le workspace racine sera géré par pnpm. L'orchestrateur est propriétaire des fichiers de configuration racine.

## 2. Backend

Supabase fournit PostgreSQL, Auth, Storage, Realtime et Edge Functions. Les clients utilisent les clés publiques prévues pour le navigateur/mobile. Toute clé service-role, secret de paiement ou secret webhook reste côté serveur.

Les mutations sensibles passent par des fonctions métier sécurisées :
- créer une commande et réserver le stock ;
- calculer le prix et la commission ;
- confirmer un paiement via un événement vérifié ;
- effectuer une transition de commande/livraison ;
- enregistrer un remboursement ou reversement ;
- créer une écriture de journal financier.

Ne pas faire confiance au prix, rôle, commission, total, statut de paiement ou statut de livraison envoyés par le client.

## 3. Autorisation et RLS

- Activer RLS sur chaque table exposée.
- Les clients ne lisent que leurs profils, adresses, paniers et commandes.
- Un vendeur ne lit/modifie que sa boutique, ses produits, son stock et les commandes de sa boutique.
- Un livreur ne lit que les missions qui lui sont assignées et les données strictement nécessaires.
- Un responsable logistique est limité à son organisation et ses missions.
- Les rôles staff sont gérés dans des tables/claims contrôlés par le backend, jamais dans des user metadata librement modifiables.
- Toute mise à jour vérifie l'ancienne et la nouvelle appartenance ; écrire des politiques UPDATE avec USING et WITH CHECK.
- Les vues exposées ne doivent pas contourner RLS ; préférer security_invoker lorsque disponible.
- Tester explicitement les tentatives d'accès croisé (IDOR/BOLA).

## 4. Modèle financier

Les montants sont en GNF entiers. Pas de float. Utiliser bigint en base si nécessaire et convertir en chaîne sûre aux frontières JSON si les valeurs peuvent dépasser la précision entière JavaScript.

Séparer :
- montant produits ;
- frais client de livraison ;
- frais de paiement ;
- commission plateforme ;
- coût partenaire ;
- marge livraison ;
- montant vendeur payable ;
- remboursements et ajustements.

Chaque ordre garde un snapshot des prix et de la règle de commission. Le journal financier est append-only ; les corrections se font par écritures compensatoires. Un payable vendeur interne n'est pas un wallet et ne prouve pas que des fonds ont été reçus. Le rapprochement bancaire/prestataire/COD est obligatoire avant le marquage payé d'un reversement.

## 5. Paiements

Définir une interface provider indépendante de l'application :
- création d'une intention de paiement côté serveur ;
- stockage d'une référence externe idempotente ;
- validation serveur des webhooks/callbacks avec les mécanismes officiels du prestataire ;
- vérification de montant, devise, référence et état ;
- journalisation de chaque événement reçu ;
- gestion des événements dupliqués et désordonnés ;
- rapprochement et reprise manuelle.

COD est un flux d'encaissement distinct. Il faut savoir qui détient l'espèce, quand elle est remise et quelle preuve la réconcilie. Orange Money reste désactivé tant que les accès marchands et tests d'intégration ne sont pas validés. Ne pas inventer les endpoints ou le protocole d'un prestataire.

## 6. Livraison

Le MVP utilise un dispatch manuel dans Admin. Le domaine logistique garde une interface d'adaptateur afin d'ajouter une API partenaire ultérieurement sans refaire le modèle de commande. Une mission contient vendeur/point de collecte, destination client, partenaire, livreur, coût, frais client, événements, preuve de remise et incident.

Limiter les données personnelles visibles par le livreur à ce qui est nécessaire à la mission. Les statuts et preuves doivent être horodatés et attribués à un acteur.

## 7. Données principales

Le schéma détaillé sera produit par l'agent Platform et validé avant migration :
profiles, role_memberships, seller_profiles, delivery_partners, stores, categories, products, product_images, inventory_movements, addresses, orders, order_items, payments, payment_events, delivery_jobs, delivery_events, commission_rules, financial_entries, seller_payouts, refunds, support_tickets, audit_logs.

Utiliser clés étrangères, contraintes CHECK, index métier, contraintes d'idempotence et transactions pour préserver l'intégrité.

## 8. Qualité et observabilité

- TypeScript strict.
- Validation des entrées aux frontières API.
- Tests unitaires pour le domaine, tests d'intégration DB/RLS, tests de parcours.
- Logs structurés sans données personnelles ou secrets.
- Suivi des erreurs, latence, webhooks et échecs de livraison.
- Environnements séparés local/dev/staging/production.
- Données de seed fictives, clairement identifiées.
- Sauvegarde et procédure de restauration vérifiée avant lancement.

## 9. Décisions provisoires à valider en implémentation

- Choisir des versions React Native CLI, React Navigation, Next.js et Supabase compatibles, à partir de la documentation officielle.
- Les projets Android Gradle doivent être versionnés dans chaque application mobile. Aucun Expo, Expo Router, EAS ou Expo Prebuild.
- Ne pas ajouter Redis, microservices ou une couche d'orchestration complexe avant qu'un besoin mesuré existe.
