# BamanaShop — Roadmap produit et technique

Dernière mise à jour : 19 novembre 2026

## Cap produit verrouillé

BamanaShop est une marketplace généraliste qui démarre à Conakry (Guinée), en GNF. Le produit comprend **deux applications mobiles** et **un dashboard web interne** :
- **BamanaShop (Customer)** : application mobile des clients.
- **BamanaShop Pro** : une seule application mobile pour vendeurs et livreurs, avec espaces et permissions distincts selon les rôles.
- **BamanaShop Admin** : dashboard web de l'équipe BamanaShop.

Backend et base de données sont partagés. Le MVP utilise un panier mono-vendeur par commande, une livraison par partenaire externe avec dispatch manuel, le paiement à la livraison et une intégration Orange Money uniquement après accès marchand et validation. Aucun portefeuille électronique ni split-payment automatique n'est prévu.

## Règles de suivi

- États : `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Une phase n'est terminée que lorsque ses critères de sortie sont vérifiés.
- Les dépendances et blocages externes doivent être inscrits dans `STATUS.md`.
- Chaque changement passe par une branche et une Pull Request.
- L'orchestrateur tient à jour ce fichier et `STATUS.md` après chaque lot intégré.

## Phase 0 — Cadrage et gouvernance
Statut : DONE pour le cadrage documentaire ; vérifications commerciales/juridiques encore ouvertes.

- [x] Définir les trois interfaces : Customer, Pro (seller + courier), Admin web.
- [x] Définir le marché initial, la devise, le panier mono-vendeur et le modèle de livraison partenaire.
- [x] Fixer les limites de sécurité financière : pas de wallet, pas de faux paiements confirmés, pas de split-payment présumé.
- [x] Définir les périmètres de quatre sous-agents.
- [ ] Confirmer les droits d'exploitation de la marque et clarifier les attributions existantes.
- [ ] Vérifier le cadre juridique, l'enregistrement et les obligations applicables à l'opérateur.
- [ ] Obtenir les conditions d'accès marchand et la documentation technique des moyens de paiement.
- [ ] Identifier au moins un partenaire de livraison, ses zones, tarifs, SLA, responsabilités et modalités COD.
- [ ] Définir les contrats vendeurs, la politique de commissions, retours, remboursements et litiges.

**Sortie :** décisions externes documentées et propriétaires identifiés. Le développement local peut commencer sans attendre les intégrations de production.

## Phase 1 — Fondations du monorepo et contrats
Statut : TODO

- [ ] Créer le workspace pnpm TypeScript et les scripts racine.
- [ ] Créer les squelettes Expo Customer et Pro, et Next.js Admin.
- [ ] Créer les packages partagés de contrats et domaine.
- [ ] Configurer Supabase local/dev, migrations et types générés.
- [ ] Définir les rôles, memberships, permissions et politiques RLS.
- [ ] Configurer lint, format, typecheck, tests, CI et exemples d'environnement.
- [ ] Ajouter un seed de développement avec données fictives clairement identifiées.

**Sortie :** les trois interfaces démarrent, partagent des contrats typés, et les contrôles automatisés passent.

## Phase 2 — Identité, boutiques et catalogue
Statut : TODO

- [ ] Authentification et profil client.
- [ ] Onboarding vendeur et vérification administrative.
- [ ] Profils de rôle vendeur/livreur et approbation.
- [ ] Boutiques, catégories, produits, images et stocks.
- [ ] Recherche, filtres, fiches produits et pages boutique.
- [ ] Modération des catégories et produits.
- [ ] Tests d'isolation des données entre vendeurs.

**Sortie :** un vendeur approuvé publie un produit ; un client le découvre ; les autres vendeurs ne peuvent pas voir ou modifier ses données privées.

## Phase 3 — Panier et commandes
Statut : TODO

- [ ] Panier limité à une boutique pour le MVP.
- [ ] Adresse structurée : commune, quartier, repère, téléphone et instructions.
- [ ] Calcul serveur du sous-total, frais et total.
- [ ] Vérification/réservation atomique du stock.
- [ ] Création idempotente de commande et snapshots de prix.
- [ ] États de commande et notifications.
- [ ] Annulation, indisponibilité, retour et remboursement.

**Sortie :** le parcours de commande fonctionne avec un paiement de test ou COD sans incohérence de stock ni double commande.

## Phase 4 — Paiements et comptabilité
Statut : TODO

- [ ] Modèle de paiement avec adaptateurs de prestataires.
- [ ] COD : encaissement, responsabilité de collecte et rapprochement.
- [ ] Orange Money : sandbox d'abord, validation serveur des callbacks/webhooks, idempotence.
- [ ] Règles de commission configurables et snapshots par commande.
- [ ] Journal financier append-only et écritures compensatoires.
- [ ] Calcul du payable vendeur et du coût/marge livraison.
- [ ] Workflow de reversement manuel, justificatif et rapprochement.
- [ ] Tests de bout en bout et tests de répétition de webhooks.

**Sortie :** chaque franc encaissé, dû, remboursé ou reversé est traçable. Aucune intégration réelle sans contrat et accès autorisés.

## Phase 5 — Livraison partenaire
Statut : TODO

- [ ] Zones et grilles tarifaires configurables.
- [ ] Missions de livraison et assignation manuelle par Admin.
- [ ] Application Pro : tâches livreur et transitions autorisées.
- [ ] Collecte, preuve de remise, échec, retour et incident.
- [ ] Gestion COD et rapprochement des espèces avec le partenaire.
- [ ] Historique d'événements et notification client.
- [ ] Adaptateur API uniquement si le partenaire fournit une API documentée.

**Sortie :** une commande est préparée, assignée, collectée et livrée avec preuves et responsabilité identifiables.

## Phase 6 — Admin, support et exploitation
Statut : TODO

- [ ] Vue consolidée commandes, vendeurs, catalogue, paiements et livraisons.
- [ ] Support, litiges, annulations et remboursements.
- [ ] Audit des actions administratives sensibles.
- [ ] Rapports GMV, commissions, marges, échecs et reversements en attente.
- [ ] Gestion des rôles staff et permissions minimales.
- [ ] Sauvegardes, observabilité, alertes et procédures d'incident.

**Sortie :** l'équipe peut exploiter le pilote sans accès direct à la base de production.

## Phase 7 — Pilote fermé à Conakry
Statut : TODO

- [ ] Test complet sur Android réel et réseau mobile variable.
- [ ] Revue sécurité, RLS et secrets.
- [ ] Vérification des textes contractuels et politiques.
- [ ] Vérification du parcours client-vendeur-livreur-support.
- [ ] Onboarder un petit groupe de vendeurs et partenaires vérifiés.
- [ ] Exécuter des commandes pilotes avec suivi financier réel autorisé.
- [ ] Corriger les incidents avant toute ouverture publique.

**Sortie :** go/no-go formel basé sur des commandes livrées, paiements rapprochés, reversements prouvés et support opérationnel.

## Phase 8 — Lancement et extension
Statut : TODO

- [ ] Publication contrôlée des deux applications mobiles.
- [ ] Acquisition vendeurs et clients.
- [ ] Suivi des indicateurs : GMV, commandes, panier moyen, conversion, commission nette, livraison réussie, litiges et reversements.
- [ ] Optimisation des coûts logistiques.
- [ ] Panier multi-vendeurs, intégrations logistiques avancées et autres moyens de paiement après validation.
- [ ] Extension géographique après validation du modèle à Conakry.

**Sortie :** activité mesurable, rentable par commande après coûts, et reproductible.

## Ordre de démarrage immédiat

1. Orchestrateur : établir le workspace, scripts racine, CI minimale et conventions d'intégration.
2. Agent Platform : fournir les contrats TypeScript, le modèle de données initial, auth, rôles et RLS.
3. Agent Customer : créer le squelette de l'application client et les premiers écrans catalogue.
4. Agent Pro : créer le squelette vendeur/livreur avec navigation liée au rôle.
5. Agent Admin & QA : créer le dashboard opérationnel et le socle de tests.
6. Intégrer les workstreams progressivement ; ne pas connecter de paiement réel pendant cette première itération.
