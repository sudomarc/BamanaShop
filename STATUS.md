# BamanaShop — État du projet

Dernière revue : 24 novembre 2026

## Base examinée

- Dépôt : `sudomarc/BamanaShop`
- Base : `main`, commit `d24372079614b093fcc4d4905360e3c56dddeb82`
- Architecture : monorepo pnpm/TypeScript, applications React Native CLI (`apps/customer`, `apps/pro`), dashboard Next.js (`apps/admin`), packages partagés et migrations Supabase.
- La vitrine HTML historique existe toujours et reste distincte de l'application transactionnelle.

## État vérifié

| Domaine | État | Preuve / limite |
|---|---|---|
| Workspace et packages partagés | VALIDÉ CI | Build des packages partagés, lint, formatage et typecheck passent |
| Customer — panier mono-boutique | IMPLÉMENTÉ | Règle dans le store, rejet des paniers persistés multi-boutiques ; tests unitaires passent |
| Customer — checkout | IMPLÉMENTÉ, PR NON MERGÉE | Le serveur recalcule montants et frais ; prix et devis obsolètes refusés ; réservation atomique du stock ; clé d'idempotence persistée |
| Customer — annulation | IMPLÉMENTÉ, PR NON MERGÉE | RPC limité au propriétaire d'une commande COD en attente ; libération du stock et échec du paiement COD dans le trigger |
| Customer — paiement COD | PARTIEL | Création de la dette COD ; encaissement et rapprochement réels non implémentés |
| Orange Money | BLOQUÉ | Pas d'intégration marchand, webhook vérifié ou sandbox démontré ; option désactivée dans Customer |
| Livraison partenaire | PARTIEL | Tarif d'estimation serveur ; dispatch opérationnel, preuve de livraison et rapprochement COD à compléter |
| Pro — vendeur | MOCK / PARTIEL | Dashboard et commandes contiennent encore des données statiques |
| Pro — livreur | MOCK / PARTIEL | Missions affichées depuis des données statiques |
| Pro — onboarding | TODO | Inscription progressive, sélection multiple des activités commerciales et persistance des profils manquent |
| Pro — accès par rôle | À CORRIGER | Sans rôle approuvé, l'application expose encore les deux espaces dans l'interface |
| Admin web | PARTIEL | Build de production CI réussi ; permissions et mutations métier doivent encore être auditées |
| Supabase / RLS | PARTIEL | Migrations locales validées ; aucun test complet d'isolation entre sessions Auth n'est encore démontré |
| APK / appareil | NON VÉRIFIÉ | Le build Android n'est pas déclenché sur cette PR ; aucun APK de cette révision n'a été installé/testé via ADB |

## PR #28 — Checkout sécurisé

- Branche : `fix/secure-customer-checkout`
- État : ouverte, brouillon, non fusionnée.
- Commit vérifié : `b2e12a713ed1ab935068c1ffc5f49a43d0f285c5`
- CI GitHub Actions : tous les jobs obligatoires réussis sur ce commit.
- Contrôles réussis : build des packages partagés, lint, Prettier, typecheck, tests unitaires, validation PNG, validation SEO, build Admin.
- Vérification Supabase locale réussie : démarrage, `db reset`, application de toutes les migrations, génération des types et vérification des types.
- La migration `0004_secure_customer_checkout.sql` utilise des implémentations internes dans le schéma `private` et des wrappers invoker dans `public`. Le schéma `private` est exclu des schémas API locaux.
- Le projet Supabase distant connecté était vide lors de la revue : aucune migration enregistrée et aucune table applicative dans `public`. Il n'a pas été modifié. Le schéma n'est donc pas encore déployé sur le projet distant.

## Travaux restants

1. Implémenter l'onboarding Pro avec sélection multiple des activités (commerce physique, vente en ligne, grossiste, distributeur), validation et persistance.
2. Fermer l'accès aux dashboards Pro sans rôle approuvé, puis remplacer les statistiques et missions mockées par des lectures et mutations autorisées.
3. Compléter produits, stocks, fournisseurs, ventes et commandes selon les activités sélectionnées.
4. Auditer les mutations Admin et sécuriser les transitions vendeur/livreur côté serveur, pas seulement dans l'interface.
5. Ajouter des tests RLS avec plusieurs sessions Auth et des tentatives d'accès croisé.
6. Compléter encaissement COD, journal financier, remboursements et reversements.
7. Obtenir les accès marchands et tests sandbox avant toute activation Orange Money.
8. Formaliser partenaires, zones, tarifs, responsabilité de collecte COD et preuves de livraison.
9. Préparer un seed de démonstration via Supabase Auth ; tout compte de démonstration faible doit rester local et être refusé sur les environnements distants.
10. Déployer explicitement les migrations sur le projet Supabase distant après validation de ses paramètres API ; construire les APK et vérifier sur appareil via ADB.

## Règle de suivi

Un parcours n'est terminé que lorsque le comportement réel, les autorisations serveur, la gestion des erreurs, les tests et la build correspondante sont vérifiés. Toute donnée ou action mockée doit rester identifiée comme telle et ne jamais être présentée comme une opération réelle.
