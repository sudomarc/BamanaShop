# BamanaShop — État du projet

Mise à jour : 19 novembre 2026

## État vérifié du dépôt

- Dépôt : `sudomarc/BamanaShop`
- Branche de base : `main`
- Commit de base vérifié : `631bc24c8479eef62df45bdcec89e5f9774ca292`
- Branche de préparation : `chore/marketplace-project-foundation`
- Le dépôt de base contient une vitrine statique HTML/CSS/JavaScript.
- Aucun workspace mobile, dashboard Next.js, backend marketplace ou dossier Supabase n'était présent dans l'arbre de base.
- Le panier existant utilise le stockage local du navigateur et le checkout affiche une simulation ; il ne réalise pas de transaction réelle.
- Aucun `ROADMAP.md` ni `STATUS.md` n'existait sur la branche de base.

## Situation actuelle

**Statut global :** cadrage prêt ; implémentation applicative non commencée.

| Domaine | Statut | Note |
|---|---|---|
| Vision produit | DONE | Deux apps mobiles + Admin web |
| Roadmap et gouvernance | DONE | Documents de cadrage ajoutés |
| Workspace monorepo | TODO | Prochaine tâche technique |
| Supabase / schéma / RLS | TODO | Aucun schéma appliqué |
| App Customer | TODO | Pas de code applicatif |
| App Pro | TODO | Pas de code applicatif |
| Admin web | TODO | Pas de dashboard |
| Paiements réels | BLOCKED | Contrat, accès et tests fournisseur requis |
| Livraison intégrée | BLOCKED | Partenaire et contrat/API non confirmés |
| Ouverture commerciale | BLOCKED | Validation juridique, commerciale et opérationnelle requise |

## Prochaine itération

- [ ] L'orchestrateur crée le workspace pnpm et les configurations racine.
- [ ] L'agent Platform propose les contrats et le schéma initial avant que les autres workstreams ne fassent des appels réseau réels.
- [ ] Les agents Customer et Pro créent des parcours UI sur des données mockées typées.
- [ ] L'agent Admin & QA crée l'interface interne et les premiers tests.
- [ ] Aucun paiement ni reversement réel pendant le bootstrap.

## Blocages externes à lever

1. Confirmer les droits commerciaux sur la marque et les attributions existantes.
2. Vérifier les obligations juridiques et administratives applicables à l'opérateur marketplace.
3. Obtenir les conditions et accès marchands des prestataires de paiement.
4. Choisir les partenaires de livraison et formaliser tarifs, zones, SLA, preuve de livraison, responsabilités et encaissement COD.
5. Définir les conditions vendeurs, commissions, remboursements, retours et délais de reversement.

## Règle de mise à jour

Mettre à jour ce fichier à chaque PR intégrée : statut par lot, changements livrés, vérifications réellement exécutées, incidents connus et prochaine action. Ne jamais déclarer une intégration ou un test réussi sans preuve.
