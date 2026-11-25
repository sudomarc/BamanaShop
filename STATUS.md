# BamanaShop — État du projet

Mise à jour : 25 novembre 2026

## Références vérifiées

- Dépôt : `sudomarc/BamanaShop`
- Branche principale : `main`
- HEAD de `main` vérifié : `def99676548ae35e45db5ed9ae928af75b43daea`
- Monorepo pnpm présent : `apps/customer`, `apps/pro`, `apps/admin`, `packages/contracts`, `packages/domain`, `supabase`.
- PR #29 (garde d'accès Pro selon les rôles approuvés) est intégrée à `main`.
- PR #30 (candidature Pro multi-activité) est ouverte en brouillon.
- PR #31 (chemin explicite vers `apksigner` dans le workflow Android) est ouverte en brouillon.
- PR #28 (checkout serveur) a été fermée sans merge ; ses changements ne sont pas présents dans `main`.

## État de `main`

| Domaine | État vérifié | Limite actuelle |
|---|---|---|
| Workspace | Présent | Vérifier les frontières de packages à chaque changement |
| Supabase | Migrations `0001` à `0003` présentes | La migration Pro de PR #30 n'est pas encore intégrée |
| Customer | App mobile et parcours panier/commande présents | Le durcissement checkout de PR #28 n'est pas intégré ; le client ne doit pas être considéré comme source de vérité |
| Pro | Authentification et garde d'accès selon rôles approuvés intégrées via PR #29 | Pas encore de formulaire de candidature sur `main` |
| Admin | Dashboard Next.js présent | La page vendeurs utilise encore des données mockées ; aucun workflow d'approbation vendeur/livreur vérifié |
| Paiements | Méthodes et structures de paiement présentes dans le modèle | Aucune intégration fournisseur réelle ni rapprochement de paiements vérifié |
| Livraison | Modèles de partenaires et de zones présents | Aucun contrat/API partenaire de livraison confirmé |
| Android | Workflow de build APK présent | Le run manuel #45540866677 a compilé l'APK mais a échoué à la vérification car `apksigner` n'était pas trouvé dans le PATH ; PR #31 corrige le chemin, sans build final validé sur le nouveau commit |

## Travail ouvert

### PR #30 — Onboarding Pro

- Formulaire progressif en trois étapes pour les comptes déjà authentifiés.
- Activités cumulables : commerce physique, vente en ligne, grossiste, distributeur.
- Candidature livreur facultative, avec véhicule.
- RPC serveur qui valide et crée les profils et demandes de rôles en attente.
- Protection des champs d'approbation contre l'auto-validation.
- CI #45542828904 : succès, incluant lint, Prettier, typecheck, tests unitaires, build Admin, reset Supabase local et génération des types.
- Non vérifié : build Android Pro, test sur appareil, approbation Admin réelle, déploiement Supabase distant.
- Dépendance restante : interface Admin sécurisée pour examiner et approuver les demandes.

### PR #31 — Vérification APK

- Remplace l'appel `apksigner` dépendant du PATH par le binaire du SDK Android.
- Les exécutions CI sur le nouveau HEAD sont en cours ; ne pas déclarer le correctif validé avant leur conclusion.

### Checkout sécurisé

- PR #28 fermée sans merge.
- Les changements de checkout serveur, d'idempotence, de réservation de stock, de contrôle des tarifs et d'annulation restent sur sa branche et ne sont pas actifs sur `main`.
- Ne pas annoncer le checkout actuel comme transactionnellement sécurisé avant intégration et validation de ce correctif.

## Prochaines actions

1. Terminer et faire relire PR #30.
2. Ajouter l'authentification Admin et un workflow serveur d'examen/approbation des demandes Pro.
3. Terminer PR #31 puis reconstruire l'APK sur le HEAD validé et tester l'installation ADB.
4. Reprendre le durcissement checkout dans une PR explicitement acceptée ; ajouter des tests d'intégration pour les sessions RLS, l'idempotence, les prix et le stock.
5. Valider les contrats fournisseurs, le rapprochement COD, les remboursements et les obligations commerciales avant tout paiement réel.

## Règle de mise à jour

Mettre à jour ce fichier à chaque PR intégrée : changements livrés, preuves CI, tests réellement exécutés, limites connues et prochaine action. Distinguer systématiquement `main`, les branches ouvertes et les intégrations externes non vérifiées.
