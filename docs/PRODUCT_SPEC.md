# BamanaShop — Spécification produit

Version : 1.0 · 19 novembre 2026

## 1. But

Créer une marketplace généraliste multi-vendeurs à Conakry, en Guinée. BamanaShop met en relation les clients, les commerçants et les partenaires de livraison. La plateforme fournit le catalogue, les commandes, les paiements pris en charge, la coordination logistique, le support et la comptabilité des commissions.

## 2. Surfaces produit

### BamanaShop — Customer (mobile)
Application destinée aux acheteurs. Fonctionnalités :
- inscription, connexion, profil et téléphone ;
- découverte des catégories, boutiques et produits ;
- recherche, filtres et fiches produits ;
- panier mono-vendeur pour le MVP ;
- adresses structurées avec commune, quartier, repère et instructions ;
- récapitulatif clair des produits, livraison et total ;
- paiement COD et Orange Money uniquement lorsque l'accès marchand est validé ;
- historique, suivi, annulation selon les règles, signalement et support.

### BamanaShop Pro — Seller + Courier (mobile)
Une seule application, avec une navigation et des permissions propres à chaque rôle.

Espace vendeur :
- onboarding, informations de boutique et statut de vérification ;
- gestion des produits, photos, prix et stocks ;
- réception et traitement des commandes ;
- préparation et signalement « prêt à collecter » ;
- historique des ventes, commissions et sommes à reverser ;
- demandes de support et incidents.

Espace livreur :
- profil et statut d'approbation ;
- liste des missions assignées ;
- informations strictement nécessaires à la collecte et à la livraison ;
- transitions : assignée, acceptée, collectée, en route, livrée, échec/retour ;
- preuve de livraison et incident ;
- déclaration d'espèces collectées, si le contrat du partenaire prévoit ce flux.

Un même compte peut avoir vendeur et livreur, mais chaque action doit vérifier le rôle, le statut d'approbation et la ressource ciblée côté serveur. Les partenaires de livraison peuvent être des organisations avec plusieurs livreurs ; le modèle doit permettre de rattacher les comptes à un partenaire sans donner accès aux données des autres.

### BamanaShop Admin — web interne
- validation/suspension des vendeurs et livreurs ;
- gestion des catégories, produits et modération ;
- commandes et sous-états ;
- dispatch manuel et gestion des partenaires ;
- configuration versionnée des commissions et tarifs ;
- rapprochement paiements/COD ;
- journal financier, reversements, remboursements et litiges ;
- support, audit et indicateurs.

## 3. Rôles

- `customer` : client final.
- `seller` : opérateur d'une boutique.
- `courier` : livreur assigné à des missions.
- `partner_manager` : responsable d'un partenaire logistique (si nécessaire).
- `admin` et rôles staff plus limités : équipe interne.

Les rôles privilégiés ne doivent jamais dépendre de champs de métadonnées modifiables par l'utilisateur. Les autorisations sont administrées côté serveur et vérifiées par les politiques RLS / fonctions.

## 4. Flux principal

1. Le vendeur approuvé publie un produit et un stock disponible.
2. Le client parcourt le catalogue et ajoute des produits d'une seule boutique.
3. Au checkout, le backend revalide le prix, le statut du produit et le stock.
4. Le backend calcule les montants, crée la commande et réserve/décrémente le stock de façon atomique.
5. Le vendeur accepte ou refuse selon les règles de disponibilité.
6. À la préparation, Admin assigne manuellement un partenaire ou un livreur habilité.
7. Le livreur collecte, transporte et confirme la remise ou signale un échec.
8. Le paiement est confirmé par une preuve fiable ; COD est rapproché avec la personne qui a encaissé.
9. Les commissions, frais, coûts et montants dus sont journalisés.
10. Le reversement vendeur est enregistré avec référence et justificatif.

## 5. Commandes et états séparés

Ne pas créer un statut unique mélangeant commande, paiement, livraison et reversement.

- Commande : pending, confirmed, preparing, ready_for_pickup, completed, cancelled, returned.
- Paiement : pending, requires_action, paid, failed, cash_due, cash_collected, refunded, partially_refunded, under_review.
- Livraison : unassigned, assigned, accepted, picked_up, in_transit, delivered, failed, returned.
- Reversement : pending, payable, processing, paid, on_hold, disputed.

Les transitions doivent être validées côté serveur et historisées. Les noms définitifs peuvent être ajustés dans les contrats avant migration.

## 6. Règles commerciales MVP

- Une commande concerne un seul vendeur.
- Le vendeur définit le prix ; BamanaShop affiche les frais avant confirmation.
- Les commissions sont configurables par catégorie, vendeur ou règle générale selon la politique approuvée.
- Chaque commande conserve un snapshot du taux et des montants utilisés.
- La livraison est facturée selon une grille validée et visible avant checkout.
- Le dispatch est manuel dans Admin.
- COD et Orange Money sont des cibles fonctionnelles ; toute activation dépend des contrats, accès marchands, documentation et tests.
- Aucun wallet ni conservation de fonds par BamanaShop n'est implémenté par défaut.
- Les produits interdits ou soumis à autorisation ne peuvent être listés sans validation appropriée.

## 7. Hors périmètre MVP

- panier multi-vendeurs et sous-commandes automatiques ;
- flotte logistique propre ;
- optimisation d'itinéraire avancée ;
- intégration API de coursiers non documentée ;
- split-payment automatique ;
- wallet client ou vendeur ;
- crédit, paiement fractionné ou BNPL ;
- extension multi-pays ;
- publicité et abonnement vendeur ;
- recommandations personnalisées avancées.

## 8. Critères d'acceptation

Le MVP doit démontrer un parcours complet avec un client, un vendeur approuvé, un livreur autorisé, une commande, une preuve de livraison, un paiement rapproché et un montant vendeur calculé correctement. Les tests doivent couvrir les permissions, les doubles soumissions, les webhooks répétés, les stocks concurrents, les annulations, les remboursements et les livraisons échouées.
