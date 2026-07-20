# CHANGELOG

Ce fichier décrit tous les changements apportés au projet **BamanaShop**. Chaque version est documentée par ordre chronologique, avec les améliorations, corrections de bugs et nouvelles fonctionnalités.

## [1.1.0] - 2024-11-20

### Ajouté
- **Panier d'achat interactif** : Ajout d'un panier d'achat persistant en JavaScript (sauvegarde dans `localStorage`) avec la possibilité d'ajouter ou retirer des articles, modifier la quantité, calculer le prix total et simuler la validation de la commande avec notification.
- **Barre de recherche et filtres de catégorie** : Filtrage en temps réel des produits par saisie de texte et par boutons de catégories ("Tous", "Bamana", "Vintage", "Nostalgie").
- **Thème Sombre (Dark Mode)** : Bouton d'activation/désactivation du mode sombre avec persistance locale de la préférence de l'utilisateur.
- **Lightbox d'images** : Visualisation en plein écran et agrandissement des images de produits en cliquant dessus.
- **Formulaire de contact interactif** : Validation complète côté client (champs requis, format e-mail) et notifications par toast de succès personnalisées lors de l'envoi réussi.
- **Notifications Toast** : Système élégant de notifications éphémères pour guider l'expérience utilisateur (ajout au panier, changement de thème, validation de formulaire).

### Modifié
- **Refonte visuelle et CSS Premium** : Transition vers un design responsive, élégant et moderne en remplaçant la mise en page fixe par une grille dynamique (CSS Grid) et Flexbox.
- **Charte graphique culturelle** : Introduction de variables CSS pour un thème aux teintes chaleureuses et authentiques (or chaud, terre cuite, bronze foncé, lin clair).
- **Structure HTML & Validation** : Correction et standardisation de la structure de toutes les pages (`index.html`, `politique.html`, `utilisation.html`) pour assurer la conformité aux standards W3C (correction des balises fermées incorrectement, etc.) et uniformiser l'en-tête et le pied de page.
- **Optimisation typographique** : Intégration de polices haut de gamme de Google Fonts (*Playfair Display* et *Plus Jakarta Sans*).

## [1.0.0] - 2024-11-10

### Ajouté
- Création de la structure de base du site web avec `index.html`.
- Ajout des sections principales : **Accueil**, **Produits**, **À propos**, **Contact**.
- Mise en place de la navigation entre les différentes sections.
- Ajout de liens vers les réseaux sociaux (GitHub, Instagram) et le contact par email.
- Inclusion d'un pied de page avec mentions légales et avertissement sur le développement en cours.
- Ajout des images de produit dans le dossier `res/img/`.

### Modifié
- Mise en place d'un style de base via le fichier `styles/style.css`.
