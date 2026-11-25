# BamanaShop — État du projet

Dernière revue du dépôt : 24 novembre 2026

## Base examinée

- Dépôt : `sudomarc/BamanaShop`
- Branche de référence examinée : `main`
- Commit de base de cette revue : `d24372079614b093fcc4d4905360e3c56dddeb82`
- Architecture réellement présente : monorepo pnpm/TypeScript, deux applications React Native CLI (`apps/customer`, `apps/pro`), dashboard Next.js (`apps/admin`), packages partagés et migrations Supabase.
- La vitrine HTML historique est toujours présente et reste distincte de l'application transactionnelle.

Cette revue est une inspection du code GitHub. Aucun build Android local, lancement sur appareil, test de navigation réel ni test contre une base Supabase distante n'est revendiqué ici.

## État fonctionnel observé

| Domaine | État observé | Limites principales |
|---|---|---|
| Workspace et architecture | PRESENT | Vérification locale complète à refaire |
| Customer — catalogue et navigation | PARTIEL | Plusieurs états et actions restent à vérifier |
| Customer — panier mono-vendeur | EN CORRECTION | Le store imposait désormais la règle localement dans la branche dédiée ; migration historique possible dans les paniers déjà persistés |
| Customer — checkout | EN CORRECTION | Nouveau RPC transactionnel sur branche, CI non encore validée |
| Customer — annulation | EN CORRECTION | Nouveau RPC limité aux commandes COD en attente sur branche |
| Pro — vendeur | PARTIEL | Tableau de bord contient encore des données statiques ; parcours de gestion non démontré comme opérationnel |
| Pro — livreur | PARTIEL | Missions présentées comme données statiques ; flux réel non démontré |
| Pro — onboarding commercial | TODO | Les activités boutique physique, vente en ligne, grossiste et distributeur ne sont pas encore modélisées |
| Admin web | PARTIEL | Pages présentes ; autorisations, mutations et données réelles à auditer |
| Supabase / RLS | PARTIEL | Schéma et politiques présents ; les tests d'isolation actuels ne démontrent pas encore des sessions utilisateur réelles |
| Paiement COD | CIBLE MVP | Rapprochement et encaissement opérationnels à compléter |
| Orange Money | BLOCKED | Aucun accès marchand, webhook vérifié ou sandbox démontré ; option désactivée dans Customer sur la branche de correction |
| Livraison partenaire | PARTIEL | Dispatch manuel ciblé ; intégration opérationnelle et preuve de livraison à vérifier |
| APK Android | PARTIEL | Projets Gradle natifs versionnés ; PR #26 séparée concerne la réparation du workflow Android |

## Correction en cours — checkout client

Branche : `fix/secure-customer-checkout`

Changements proposés, non encore intégrés à `main` :

- Retrait de l'insertion directe des commandes par le client.
- Nouveau RPC authentifié qui dérive prix, adresse, frais, commission et total depuis les données serveur.
- Vérification du propriétaire de l'adresse, de l'état de la boutique et de l'approbation du vendeur.
- Verrouillage des produits et vérification du stock avant insertion atomique des lignes et réservations.
- Clé d'idempotence par client afin qu'une répétition de requête ne crée pas une seconde commande.
- Enregistrement de la commande et du paiement COD sans comptabiliser de revenu avant rapprochement.
- Libération du stock lors de l'annulation.
- Annulation serveur limitée au propriétaire d'une commande COD encore en attente.
- Restriction des anciens RPC privilégiés de paiement, dispatch et reversement au rôle serveur.
- Panier mono-vendeur contrôlé dans le store et à nouveau au checkout.

La migration ajoute des assertions ACL qui feront échouer son application si les RPC privilégiés restent exécutables par les rôles client. Ces assertions devront être confirmées par l'exécution CI.

## Blocages produit et techniques restants

1. Implémenter l'onboarding Pro progressif avec sélection multiple des activités commerciales, validation et persistance.
2. Remplacer les statistiques et missions statiques de Pro par des lectures et mutations backend autorisées.
3. Finaliser la gestion des produits, stocks, fournisseurs, ventes et commandes adaptée aux activités sélectionnées.
4. Auditer puis sécuriser les mutations Admin et les transitions de commandes/livraisons.
5. Ajouter de vrais tests RLS avec plusieurs sessions Auth et des tentatives d'accès croisé.
6. Compléter le rapprochement COD, le journal financier, les remboursements et les reversements.
7. Obtenir les accords, identifiants marchands et tests sandbox avant toute activation Orange Money.
8. Formaliser les partenaires de livraison, tarifs, responsabilité de collecte COD et preuves.
9. Mettre en place le seed de démonstration via Supabase Auth ; le compte faible demandé doit rester strictement local/demo et être refusé sur tout environnement distant ou production.
10. Exécuter lint, format, typecheck, tests, build Admin, migrations locales et builds APK ; installer et lancer les APK via ADB.

## Règle de suivi

Ne déclarer un parcours terminé que lorsque son comportement, les autorisations serveur, les erreurs, les tests et le build correspondant sont vérifiés. Les fonctionnalités mockées doivent rester explicitement identifiées comme telles, jamais présentées comme des opérations réelles.
