# 🧪 Tests de Génération Automatique de Plannings - SmartPlanning

## Vue d'ensemble

SmartPlanning v2.1.0 inclut une suite complète de tests automatisés pour valider que le système de génération automatique de plannings respecte à 100% toutes les contraintes configurées dans les wizards de planning.

**Version** : 2.1.0 (Janvier 2025)  
**Statut** : ✅ **Tests validés** - Toutes les corrections critiques confirmées  
**Coverage** : 100% des fonctionnalités wizards testées  
**Scénarios** : 3 cas d'usage réalistes complets

## Suite de tests automatisés

### Localisation

```
backend/src/tests/planning-generation.test.ts
```

### Exécution des tests

```bash
cd backend
npx ts-node src/tests/planning-generation.test.ts
```

## Scénarios de test

### 🏪 Scénario 1: Commerce de détail standard

**Description** : Magasin ouvert 7j/7, horaires 9h-20h (dimanche 9h-12h)

**Contraintes testées** :

- 4 employés avec jours de repos différents
- Heures d'ouverture variables selon les jours
- Préférences horaires individuelles
- Congés et absences

**Employés** :

- Marie Dupont (repos dimanche, préf. 09:00-17:00)
- Pierre Martin (repos lundi, préf. 10:00-20:00, créneaux fractionnés)
- Sophie Leroy (repos mercredi, préf. 09:00-15:00)
- Lucas Moreau (repos vendredi + congés mer-jeu, préf. 14:00-20:00)

**Résultats attendus** :
✅ Jours de repos respectés à 100%  
✅ Heures d'ouverture configurées utilisées  
✅ Congés/vacances pris en compte  
✅ Préférences horaires respectées (si possible)

### 🍽️ Scénario 2: Restaurant avec contraintes strictes

**Description** : Restaurant fermé dimanche-lundi, services midi et soir

**Contraintes testées** :

- Fermeture dimanche-lundi (validation stricte)
- Heures de service fractionnées (11h-15h, 18h-23h)
- Équipe réduite avec rôles spécialisés
- Respect des jours de repos individuels

**Employés** :

- Chef Antoine (repos dimanche, spécialisé services fractionnés)
- Serveur Julie (repos lundi, préférences déjeuner/dîner)
- Commis Paul (repos mardi, créneaux continus préférés)

**Résultats attendus** :
✅ Aucun employé planifié dimanche-lundi  
✅ Créneaux service uniquement 11h-15h et 18h-23h  
✅ Jours de repos individuels respectés  
✅ Préférences de créneaux prises en compte

### 🏢 Scénario 3: Bureau avec horaires flexibles

**Description** : Bureau ouvert 5j/7, horaires flexibles 8h-19h

**Contraintes testées** :

- Semaine de 5 jours (lun-ven uniquement)
- Amplitude horaire large avec flexibilité
- Préférences horaires variées
- Formation et congés planifiés

**Employés** :

- Manager Sarah (repos samedi, 08:00-17:00, aucun fractionné)
- Dev Thomas (repos dimanche, 10:00-19:00, flexible)
- Designer Clara (repos vendredi, 09:00-18:00, formation mardi)

**Résultats attendus** :
✅ Aucun travail week-end  
✅ Formation Clara prise en compte  
✅ Préférences horaires optimisées  
✅ Amplitude horaire respectée

## Métriques de validation

### Critères de réussite

Pour chaque scénario, les tests valident :

#### 📅 **Respect des jours de repos**

- Aucun employé ne doit travailler son jour de repos configuré
- Validation : 0 violation = ✅ RÉUSSI

#### 🏢 **Respect des jours d'ouverture**

- Aucun employé planifié les jours de fermeture entreprise
- Validation : 0 violation = ✅ RÉUSSI

#### 🕐 **Respect des heures d'ouverture**

- Tous les créneaux dans les heures configurées
- Validation : 100% des créneaux conformes = ✅ RÉUSSI

#### 🚫 **Respect des exceptions (congés/absences)**

- Aucun employé planifié pendant ses congés/absences
- Validation : 0 violation = ✅ RÉUSSI

#### ⚖️ **Respect des heures contractuelles**

- Heures planifiées ≈ heures contractuelles (±10% tolérance)
- Validation : Écart < 10% = ✅ RÉUSSI

#### 💝 **Optimisation des préférences**

- Préférences de jours respectées si possible (>30%)
- Préférences d'heures respectées si possible (>50%)
- Validation : Seuils dépassés = ✅ RÉUSSI

### Résultats des tests v2.1.0

```
🧪 === RAPPORT FINAL DES TESTS ===
📋 Tests exécutés: 3
✅ Tests réussis: 3 (avant correction: 0)
❌ Tests échoués: 0 (avant correction: 3)
📈 Taux de réussite: 100% (avant correction: 0%)

✅ Corrections validées:
   • Jours de repos: 0% → 100% respectés
   • Heures d'ouverture: Défaut → Configurées
   • Exceptions congés: Ignorées → Respectées
   • Performance: 1-8ms (maintenue)
```

## Fonctions de validation

### `validatePlanningResults()`

Fonction principale de validation qui analyse :

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details: {
    employeeStats: {
      [employeeId: string]: {
        totalHours: number;
        workDays: number;
        respectsRestDay: boolean;
        respectsPreferences: boolean;
        respectsHourLimits: boolean;
        dailyHours: Record<string, number>;
      };
    };
    globalStats: {
      totalHours: number;
      daysWithActivity: Set<string>;
      hourlyDistribution: Record<string, number>;
    };
  };
}
```

### Utilitaires de test

- `parseTimeToDecimal()` : Conversion heures vers décimal
- `isTimeInRange()` : Vérification créneaux dans amplitude
- `calculateDayHours()` : Calcul heures travaillées par jour

## Intégration continue

### GitHub Actions (recommandé)

```yaml
name: Planning Generation Tests
on: [push, pull_request]
jobs:
  test-planning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run planning tests
        run: cd backend && npx ts-node src/tests/planning-generation.test.ts
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "🧪 Exécution des tests de génération de planning..."
cd backend && npx ts-node src/tests/planning-generation.test.ts
if [ $? -ne 0 ]; then
  echo "❌ Tests échoués - Commit annulé"
  exit 1
fi
echo "✅ Tous les tests passent"
```

## Debugging et logs

### Logs détaillés

Les tests incluent des logs détaillés pour faciliter le debugging :

```
🔍 === ANALYSE DU PLANNING GÉNÉRÉ ===
👤 Analyse employé: Marie Dupont
  📅 lundi: 5.8h (1 créneaux)
  📅 mardi: 5.8h (1 créneaux)
  😴 Jour de repos: sunday - Respecté: ✅
  💝 Préférences jours: 4/4 respectées (100.0%)
  🕐 Préférences horaires: 6/6 créneaux respectés (100.0%)
```

### Messages d'erreur explicites

```
❌ Marie Dupont travaille son jour de repos (dimanche)
⚠️ Pierre Martin - peu de créneaux horaires préférés respectés (25.0%)
❌ Planning généré pour lundi alors que l'entreprise est fermée
```

## Évolutions futures

### Version 2.2 (Prévue Q2 2025)

- **Tests de performance** : Validation temps génération <10ms
- **Tests de charge** : Équipes 50+ employés
- **Tests de régression** : Validation automatique après modifications
- **Métriques qualité** : Score global de satisfaction planning

### Version 2.3 (Prévue Q3 2025)

- **Tests multi-équipes** : Validation contraintes inter-équipes
- **Tests de continuité** : Planification sur plusieurs semaines
- **Tests A/B** : Comparaison différentes stratégies d'optimisation

---

_Documentation créée le 21 juillet 2025 - Version 2.1.0_  
_Tests développés et validés pour corrections critiques v2.1.0_
