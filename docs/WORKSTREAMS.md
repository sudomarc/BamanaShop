# BamanaShop — Répartition de travail en quatre sous-agents

Le travail parallèle est limité à quatre sous-agents, plus l'orchestrateur principal. Chaque agent a un propriétaire de fichiers exclusif.

## Agent 1 — Platform, data et sécurité

**Objectif :** définir et implémenter le socle serveur et les contrats partagés.

Périmètre exclusif :
- `supabase/**`
- `packages/contracts/**`
- `packages/domain/**`
- tests SQL sous `supabase/tests/**`

Livrables :
- modèle de données initial et migrations ;
- Auth, modèle des rôles/memberships et RLS ;
- contrats TypeScript et schémas de validation ;
- règles pures de calcul prix/commission ;
- fonctions métier sécurisées initiales ;
- tests négatifs d'isolation vendeur/client/livreur/admin.

Ne pas modifier les applications, Admin, fichiers racine ou workflows CI.

## Agent 2 — Application Customer

**Objectif :** créer l'application mobile d'achat.

Périmètre exclusif : `apps/customer/**`.

Livrables :
- base Expo / React Native et navigation ;
- onboarding, connexion et profil ;
- accueil, catégories, recherche, fiches produit et boutique ;
- panier mono-vendeur et checkout ;
- historique et suivi de commande ;
- états loading/empty/error/offline ;
- tests des composants et parcours de l'app.

Consommer les contrats partagés de l'agent Platform. En attendant, utiliser des fixtures et adaptateurs mockés typés ; ne pas inventer une API concurrente. Aucun paiement réel.

## Agent 3 — Application Pro (vendeur + livreur)

**Objectif :** créer une seule application mobile avec deux espaces métier séparés.

Périmètre exclusif : `apps/pro/**`.

Livrables :
- base Expo / React Native et navigation par rôles autorisés ;
- onboarding et sélection d'espace si compte multi-rôle ;
- espace vendeur : boutique, produits, stocks, commandes, revenus et payables ;
- espace livreur : missions assignées, collecte, livraison, preuve et incident ;
- refus des accès non autorisés et états loading/empty/error/offline ;
- tests de navigation et permissions UI.

L'UI ne remplace jamais les contrôles serveur. Aucun vendeur ne peut accéder aux données d'un autre ; aucun livreur ne peut chercher des missions non assignées. Aucun paiement/reversement réel.

## Agent 4 — Admin web et QA

**Objectif :** créer la console interne et le socle de tests de parcours.

Périmètre exclusif :
- `apps/admin/**`
- `tests/**`
- `docs/qa/**`

Livrables :
- base Next.js / TypeScript ;
- navigation et pages Admin ;
- gestion vendeurs, catalogue, commandes, dispatch, paiements, payables et support ;
- permissions staff et états de chargement/erreur ;
- stratégie et premiers tests end-to-end sur données fictives ;
- matrice de tests de bout en bout client-vendeur-livreur-admin.

Ne pas modifier `supabase/**`, `packages/**`, les deux apps mobiles ou fichiers racine.

## Orchestrateur principal

Seul l'orchestrateur modifie :
- `package.json` racine ;
- `pnpm-workspace.yaml` ;
- configurations TypeScript communes ;
- lint/format/test/build racine ;
- `.github/workflows/**` ;
- `README.md`, `AGENTS.md`, `ROADMAP.md`, `STATUS.md` ;
- les intégrations croisées et les fichiers de configuration partagés.

L'orchestrateur fixe les contrats et conventions, intègre les branches, résout les conflits, exécute tous les checks et met à jour la roadmap.

## Dépendances et ordre

1. L'agent Platform publie d'abord les types de base (profils, rôles, boutique, produit, commande, livraison, paiement).
2. Customer, Pro et Admin peuvent construire leurs interfaces en parallèle sur des mocks typés.
3. Les intégrations API commencent quand les signatures partagées sont stabilisées.
4. QA automatise les parcours après disponibilité des écrans et contrats, sans bloquer la création initiale du dashboard.
5. L'orchestrateur intègre par PR et vérifie la compatibilité globale.

## Règles de collaboration

- Un agent = un périmètre de fichiers ; ne pas écrire dans les fichiers d'un autre agent.
- Ne pas modifier le root manifest, le lockfile ou les configs globales sans autorisation de l'orchestrateur.
- Ne pas créer une abstraction partagée ad hoc dans une app ; demander un contrat à l'agent Platform.
- Ne pas fusionner des mocks en fausses implémentations de paiement ou logistique.
- Chaque agent annonce fichiers modifiés, contrats exposés, commandes exécutées, résultats, limites et prochaines dépendances.
- Pas de push direct sur `main`. L'orchestrateur fait une revue avant toute PR intégration.
