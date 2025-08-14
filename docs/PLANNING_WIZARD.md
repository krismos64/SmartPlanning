# Planning Wizard - Documentation

## Vue d'ensemble

Le Planning Wizard est un assistant interactif en 7 étapes pour générer automatiquement des plannings optimisés. Il utilise le moteur **AdvancedSchedulingEngine** qui génère des plannings en 2-5ms avec respect total des contraintes légales et préférences.

## Architecture

### Frontend
- **Composant principal**: `/frontend/src/pages/PlanningWizard.tsx`
- **Composants d'étapes**: `/frontend/src/components/planning/`
  - TeamSelectorStep.tsx
  - EmployeeSelectionStep.tsx
  - AbsencesStep.tsx
  - PreferencesStep.tsx
  - CompanyConstraintsStep.tsx
  - SummaryStep.tsx
  - ResultsStep.tsx

### Backend
- **Route API**: `POST /api/schedules/auto-generate`
- **Service**: `/backend/src/services/planning/generateSchedule.ts`
- **Validation**: Schémas Zod avec messages en français
- **Sauvegarde**: MongoDB avec modèle GeneratedSchedule

## Utilisation

### 1. Accès au Wizard
```
URL: http://localhost:5173/planning-wizard
Authentification: Requise (admin, directeur, manager)
```

### 2. Parcours des étapes

#### Étape 1: Sélection d'équipe
- Choix de l'équipe à planifier
- Sélection semaine (1-53) et année
- **Requis**: Oui

#### Étape 2: Sélection des employés
- Choix des employés à inclure
- Affichage heures contractuelles
- **Requis**: Oui (au moins 1 employé)

#### Étape 3: Absences (Optionnel)
- Congés validés
- Absences maladie
- Formations
- **Requis**: Non

#### Étape 4: Préférences (Optionnel)
- Jours préférés
- Créneaux horaires souhaités
- Jours consécutifs max
- **Requis**: Non

#### Étape 5: Contraintes entreprise
- Jours/heures d'ouverture
- Min/max heures par jour
- Pause déjeuner obligatoire
- **Requis**: Oui

#### Étape 6: Résumé
- Validation des paramètres
- Aperçu avant génération
- **Requis**: Validation

#### Étape 7: Résultats
- Planning généré
- Statistiques
- Export et validation

## API

### Endpoint
```http
POST /api/schedules/auto-generate
Authorization: Bearer {token}
Content-Type: application/json
```

### Payload
```typescript
{
  weekNumber: number,      // 1-53
  year: number,           // >= 2023
  employees: [{
    _id: string,
    contractHoursPerWeek: number,
    exceptions?: [{
      date: string,       // "YYYY-MM-DD"
      type: "vacation" | "sick" | "training"
    }],
    preferences?: {
      preferredDays?: string[],      // ["lundi", "mardi"]
      preferredHours?: string[],     // ["09:00-17:00"]
      allowSplitShifts?: boolean,
      maxConsecutiveDays?: number
    },
    restDay?: string      // "monday", "tuesday", etc.
  }],
  companyConstraints?: {
    openDays?: string[],           // ["monday", "tuesday"]
    openHours?: string[],          // ["08:00-18:00"]
    minEmployeesPerSlot?: number,
    maxHoursPerDay?: number,       // 4-12
    minHoursPerDay?: number,       // 1-12
    mandatoryLunchBreak?: boolean,
    lunchBreakDuration?: number    // 30-120 minutes
  }
}
```

### Réponse
```typescript
{
  success: true,
  message: string,
  planning: {
    [employeeId]: {
      [day]: [{
        start: string,     // "09:00"
        end: string,       // "17:00"
        isLunchBreak?: boolean
      }]
    }
  },
  savedSchedules: number,
  metadata: {
    weekNumber: number,
    year: number,
    employeeCount: number,
    generatedAt: string,
    stats: {
      totalHoursPlanned: number,
      averageHoursPerEmployee: number,
      employeesWithFullSchedule: number,
      daysWithActivity: number
    }
  }
}
```

## Algorithme de génération

### Stratégies disponibles
1. **Distribution équitable**: Répartit les heures de manière uniforme
2. **Préférences prioritaires**: Optimise selon les souhaits employés
3. **Concentration**: Minimise le nombre de jours travaillés

### Contraintes respectées
- ✅ 11h de repos minimum entre 2 jours
- ✅ Pause déjeuner obligatoire si configurée
- ✅ Maximum heures/jour respecté
- ✅ Heures contractuelles atteintes
- ✅ Jours de repos obligatoires
- ✅ Exceptions (congés, formations)

## Tests

### Tests unitaires
```bash
cd backend
npm test -- planning-wizard
```

### Tests E2E Cypress
```bash
cd frontend
npm run cypress:open
# Sélectionner planning-wizard.cy.ts
```

### Test API manuel
```bash
node test-wizard-api.js
```

## Performance

- **Génération**: 2-5ms pour 100+ employés
- **Sauvegarde DB**: ~50ms par planning
- **Réponse totale**: < 500ms
- **Optimisations**:
  - Cache des calculs intermédiaires
  - Index MongoDB sur employeeId
  - Validation Zod optimisée

## Sécurité

- ✅ Authentification JWT requise
- ✅ Validation Zod complète
- ✅ Sanitisation des entrées
- ✅ Rate limiting (100 req/15min)
- ✅ Isolation multi-tenant

## Débogage

### Logs backend
```typescript
console.log('🚀 Génération planning semaine', weekNumber);
console.log('📊 Employés traités:', employeeCount);
console.log('✅ Planning généré en', performance.now() - start, 'ms');
```

### Erreurs communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Aucun employé fourni" | Liste vide | Sélectionner au moins 1 employé |
| "Numéro semaine invalide" | < 1 ou > 53 | Utiliser 1-53 |
| "Heures contractuelles invalides" | <= 0 | Vérifier contrats employés |
| "Exception année différente" | Date hors année | Ajuster dates exceptions |

## Améliorations futures

- [ ] Mode batch pour plusieurs équipes
- [ ] Templates de contraintes réutilisables
- [ ] IA prédictive pour suggestions
- [ ] Notifications temps réel (WebSocket)
- [ ] Export PDF du planning
- [ ] Intégration calendrier (iCal, Google)

## Support

Pour toute question ou problème:
- Documentation: `/docs/PLANNING_WIZARD.md`
- Issues GitHub: `smartplanning/issues`
- Contact: support@smartplanning.fr