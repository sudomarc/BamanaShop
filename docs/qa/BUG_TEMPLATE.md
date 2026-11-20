# Template de Rapport de Bug — BamanaShop

## 📋 Informations Générales

| Champ | Valeur |
|-------|--------|
| **ID** | BUG-XXXX (auto-généré) |
| **Titre** | [Concis, ex: "COD payment not recorded for delivered order"] |
| **Severité** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Priorité** | P0 (Bloquant) / P1 (Urgent) / P2 (Normal) / P3 (Backlog) |
| **Rapporté par** | [Nom/Role] |
| **Date** | YYYY-MM-DD |
| **Environnement** | Local / Dev / Staging / Prod |
| **App concernée** | Customer / Pro (Seller) / Pro (Courier) / Admin / Platform |
| **Build/Commit** | [Hash ou version] |

---

## 🐛 Description du Bug

### Comportement Observé
[Description claire et factuelle de ce qui se passe actuellement]

### Comportement Attendu
[Description de ce qui devrait se passer]

### Étapes de Reproduction
1. [Étape 1 - ex: "Connecter en tant que vendeur approuvé"]
2. [Étape 2 - ex: "Aller dans Commandes > ORD-20261119-001"]
3. [Étape 3 - ex: "Cliquer sur 'Prêt à collecter'"]
4. [Résultat observé - ex: "Erreur 500, statut ne change pas"]

### Conditions de Reproduction
- [ ] Toujours reproductible
- [ ] Parfois reproductible (fréquence: %)
- [ ] Dépend de données spécifiques
- [ ] Dépend de timing/race condition

---

## 🔍 Contexte Technique

### Logs / Messages d'Erreur
```
[Coller ici les logs pertinents, stack traces, erreurs console, etc.]
```

### Requête API / Payload
```json
{
  "endpoint": "/api/orders/xxx/status",
  "method": "PATCH",
  "payload": { "status": "ready_for_pickup" },
  "response": { "status": 500, "error": "..." }
}
```

### Base de Données
- Tables concernées: [ex: orders, delivery_jobs]
- Requête SQL pour reproduire: [si applicable]

---

## 📱 Captures d'Écran / Vidéos

| Capture | Description |
|---------|-------------|
| ![Screenshot 1](url) | État avant action |
| ![Screenshot 2](url) | Erreur affichée |

---

## 🎯 Impact Utilisateur

| Rôle | Impact |
|------|--------|
| Customer | [ex: "Ne peut pas finaliser commande COD"] |
| Seller | [ex: "Ne peut pas marquer commande prête"] |
| Courier | [ex: "Ne voit pas mission assignée"] |
| Admin | [ex: "Dashboard affiche mauvais chiffres"] |
| Business | [ex: "Perte de revenus, Ltiges clients"] |

**Utilisateurs affectés**: [Tous / Un segment / Un utilisateur spécifique]
**Contournement existant**: [Oui/Non - décrire si oui]

---

## 🔧 Analyse Racine (Root Cause)

### Hypothèse 1
[Description de la cause suspectée]

### Hypothèse 2
[Autre cause possible]

### Preuves
- [ ] Logs confirment
- [ ] Reproduction en local
- [ ] Code review identifie
- [ ] Test unitaire échoue

---

## ✅ Plan de Correction

### Fix Proposé
[Description de la correction technique]

### Fichiers à Modifier
- `path/to/file1.ts` - [Description changement]
- `path/to/file2.sql` - [Description migration si nécessaire]

### Tests de Régression
- [ ] Test unitaire ajouté: `describe('fix for BUG-XXXX')`
- [ ] Test intégration: [scénario]
- [ ] Test E2E: [parcours complet]
- [ ] Test RLS: [si modification permissions]

---

## 📦 Déploiement

| Étape | Responsable | Statut |
|-------|-------------|--------|
| Fix développé | [Dev] | ☐ |
| Code review | [Reviewer] | ☐ |
| Tests locaux passent | [Dev] | ☐ |
| CI passe (lint/type/test/build) | [CI] | ☐ |
| Déployé sur Dev | [DevOps] | ☐ |
| Validé par QA | [QA] | ☐ |
| Déployé sur Staging | [DevOps] | ☐ |
| Déployé sur Prod | [DevOps] | ☐ |

---

## 🔄 Suivi Post-Fix

- [ ] Monitoring d'erreurs 24h post-déploiement
- [ ] Métriques business vérifiées
- [ ] Retours utilisateurs collectés
- [ ] Documentation mise à jour si nécessaire
- [ ] Fermeture du ticket

---

## 📝 Notes Additionnelles

[Tout contexte additionnel, liens vers issues connexes, décisions architecturales, etc.]

---

*Template version 1.0 — Utiliser pour tous les bugs rapportés sur BamanaShop*