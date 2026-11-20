# BamanaShop — Registre des décisions

Les décisions ci-dessous constituent la base de travail. Toute modification doit être motivée et consignée.

## D-001 — Deux applications mobiles et un Admin web
**Statut : accepté.**
- BamanaShop Customer est l'app client.
- BamanaShop Pro réunit vendeurs et livreurs dans une seule app, avec rôles et permissions distincts.
- BamanaShop Admin est une console web interne, pas une troisième app mobile.

## D-002 — Lancement à Conakry, modèle généraliste
**Statut : accepté.**
Le catalogue est généraliste et le marché initial est Conakry. La devise commerciale est GNF. L'extension géographique est hors MVP.

## D-003 — Panier mono-vendeur au MVP
**Statut : accepté.**
Une commande ne contient qu'une boutique. Cela limite les complexités de préparation, livraison, commission et règlement. Le panier multi-vendeurs sera réévalué après le pilote.

## D-004 — Livraison par partenaires
**Statut : accepté.**
La plateforme travaille avec des livreurs/partenaires externes. Dispatch manuel dans Admin au départ. Aucune intégration API n'est supposée avant réception d'une documentation partenaire et d'un accord.

## D-005 — Pas de wallet ni de split settlement présumé
**Statut : accepté.**
Les payables vendeurs sont un suivi comptable interne. BamanaShop ne construit pas de wallet et ne conserve pas de fonds comme service financier. Le flux d'encaissement et reversement doit être validé auprès des prestataires et conseils compétents.

## D-006 — Paiements initiaux
**Statut : cible fonctionnelle, disponibilité non validée.**
COD et Orange Money sont ciblés. L'activation dépend des conditions marchandes, credentials, documentation, validation juridique et tests de sandbox/prod. MTN Mobile Money et les cartes ne sont pas dans le périmètre initial confirmé.

## D-007 — Stack
**Statut : baseline provisoire.**
TypeScript, pnpm workspaces, Expo / React Native, Next.js et Supabase. Les versions seront sélectionnées à l'installation après vérification des compatibilités et documentation officielles.

## D-008 — Conservation du prototype et attribution
**Statut : accepté.**
Le site HTML existant reste une vitrine historique non transactionnelle jusqu'à décision de migration distincte. Préserver l'attribution NovaCreations existante ; Sudomarc est mainteneur technique du dépôt. Les droits d'exploitation commerciale doivent être clarifiés avant lancement.

## D-009 — Quatre sous-agents avec ownership exclusif
**Statut : accepté.**
Les responsabilités et chemins exclusifs sont décrits dans [WORKSTREAMS.md](WORKSTREAMS.md). L'orchestrateur possède les configurations racine et l'intégration.
