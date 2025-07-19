# 🤖 Génération automatique de plannings - SmartPlanning

## Vue d'ensemble

Le système de génération automatique de plannings utilise des algorithmes d'optimisation mathématique (programmation linéaire) pour créer des plannings hebdomadaires optimaux en tenant compte des contraintes multiples et des préférences des employés.

**Version** : 1.8.0 (Juillet 2025)  
**Algorithme principal** : jsLPSolver (JavaScript Linear Programming Solver)  
**Système de fallback** : Génération alternative garantie  
**Intégration** : Seamless avec PlanningWizard existant

## Architecture du système

### Composants principaux

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Système de génération automatique                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend (React + TypeScript)           Backend (Node.js + Express)    │
│  ┌─────────────────────────────┐         ┌─────────────────────────────┐ │
│  │     PlanningWizard.tsx      │   API   │   autoGenerate.route.ts     │ │
│  │  - Collecte préférences     │◄───────►│  - Validation Zod           │ │
│  │  - Interface contraintes    │  POST   │  - Authentification JWT     │ │
│  │  - Gestion exceptions       │         │  - Gestion erreurs          │ │
│  └─────────────────────────────┘         └─────────────────────────────┘ │
│           │                                         │                    │
│           │                                         │                    │
│  ┌─────────────────────────────┐         ┌─────────────────────────────┐ │
│  │  autoGenerateSchedule.ts    │         │   generateSchedule.ts       │ │
│  │  - Service frontend         │         │  - Algorithme jsLPSolver    │ │
│  │  - Validation client        │         │  - Système de fallback      │ │
│  │  - Gestion erreurs axios    │         │  - Optimisation contraintes │ │
│  └─────────────────────────────┘         └─────────────────────────────┘ │
│                                                     │                    │
│                                                     │                    │
│                                           ┌─────────────────────────────┐ │
│                                           │      MongoDB Atlas          │ │
│                                           │  - GeneratedSchedule model  │ │
│                                           │  - Métadonnées complètes    │ │
│                                           │  - Statistiques détaillées  │ │
│                                           └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Algorithme de génération

### jsLPSolver - Programmation linéaire

Le système utilise **jsLPSolver**, une bibliothèque JavaScript de programmation linéaire pour résoudre les problèmes d'optimisation de plannings :

```typescript
function buildSolverModel(
  employees: Employee[],
  weekDates: string[],
  availableSlots: TimeSlot[],
  companyConstraints: CompanyConstraints
): SolverModel {
  const model = {
    optimize: 'satisfaction',
    opType: 'max',
    constraints: {},
    variables: {},
    ints: {} // Variables entières pour les créneaux
  };

  // Construction des contraintes d'heures contractuelles
  employees.forEach(employee => {
    model.constraints[`hours_${employee._id}`] = {
      min: employee.contractHoursPerWeek * 0.9, // Marge de 10%
      max: employee.contractHoursPerWeek * 1.1
    };
  });

  // Variables binaires pour chaque créneau/employé
  availableSlots.forEach(slot => {
    employees.forEach(employee => {
      const varName = `assign_${employee._id}_${slot.day}_${slot.start}`;
      model.variables[varName] = {
        satisfaction: calculatePreferenceScore(employee, slot),
        [`hours_${employee._id}`]: slot.duration
      };
    });
  });

  return model;
}
```

### Système de fallback

En cas d'échec du solveur principal, un système de fallback garantit toujours la génération d'un planning :

```typescript
function generateFallbackPlanning(
  employees: Employee[],
  availableSlots: TimeSlot[],
  weekDates: string[]
): GeneratedPlanning {
  // Algorithme de distribution équitable simple
  // 1. Calcul des heures cibles par employé
  // 2. Attribution séquentielle des créneaux
  // 3. Respect des contraintes minimales
  // 4. Équilibrage des charges
}
```

## Types et interfaces

### Interface de données d'entrée

```typescript
export interface GeneratePlanningPayload {
  weekNumber: number;
  year: number;
  employees: {
    _id: string;
    contractHoursPerWeek: number;
    exceptions?: {
      date: string; // Format ISO: YYYY-MM-DD
      type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
    }[];
    preferences?: {
      preferredDays?: string[]; // ["lundi", "mardi", ...]
      preferredHours?: string[]; // ["09:00-17:00", ...]
    };
  }[];
  companyConstraints?: {
    openDays?: string[]; // Jours d'ouverture
    openHours?: string[]; // Heures d'ouverture
    minEmployeesPerSlot?: number; // Minimum d'employés par créneau
  };
}
```

### Interface de réponse

```typescript
export interface AutoGenerationResponse {
  success: true;
  message: string;
  planning: GeneratedPlanning;
  metadata: PlanningMetadata;
}

export interface GeneratedPlanning {
  [employeeId: string]: {
    [day: string]: {
      start: string; // Format "HH:MM"
      end: string;   // Format "HH:MM"
    }[];
  };
}

export interface PlanningStats {
  totalHoursPlanned: number;
  averageHoursPerEmployee: number;
  employeesWithFullSchedule: number;
  daysWithActivity: number;
}
```

## API Endpoint

### POST /api/schedules/auto-generate

**Headers :**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Exemple de requête :**
```json
{
  "weekNumber": 30,
  "year": 2025,
  "employees": [
    {
      "_id": "employee_123",
      "contractHoursPerWeek": 35,
      "exceptions": [
        {
          "date": "2025-07-21",
          "type": "vacation"
        }
      ],
      "preferences": {
        "preferredDays": ["lundi", "mardi", "mercredi", "jeudi"],
        "preferredHours": ["09:00-17:00"]
      }
    }
  ],
  "companyConstraints": {
    "openDays": ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
    "openHours": ["08:00-18:00"],
    "minEmployeesPerSlot": 2
  }
}
```

**Réponse de succès :**
```json
{
  "success": true,
  "message": "Planning généré et sauvegardé avec succès",
  "planning": {
    "employee_123": {
      "lundi": [
        { "start": "09:00", "end": "12:00" },
        { "start": "13:00", "end": "17:00" }
      ],
      "mardi": [
        { "start": "08:00", "end": "16:00" }
      ]
    }
  },
  "metadata": {
    "weekNumber": 30,
    "year": 2025,
    "employeeCount": 1,
    "generatedAt": "2025-07-19T10:30:00.000Z",
    "stats": {
      "totalHoursPlanned": 35,
      "averageHoursPerEmployee": 35,
      "employeesWithFullSchedule": 1,
      "daysWithActivity": 5
    }
  },
  "scheduleId": "generated_schedule_id"
}
```

## Validation des données

### Validation Zod côté backend

```typescript
const planningRequestSchema = z.object({
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2023),
  employees: z.array(z.object({
    _id: z.string().min(1),
    contractHoursPerWeek: z.number().positive(),
    exceptions: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(['vacation', 'sick', 'unavailable', 'training', 'reduced'])
    })).optional(),
    preferences: z.object({
      preferredDays: z.array(z.string()).optional(),
      preferredHours: z.array(z.string()).optional()
    }).optional()
  })).min(1),
  companyConstraints: z.object({
    openDays: z.array(z.string()).optional(),
    openHours: z.array(z.string()).optional(),
    minEmployeesPerSlot: z.number().positive().optional()
  }).optional()
});
```

### Validation côté frontend

```typescript
export async function autoGenerateSchedule(
  payload: GeneratePlanningPayload
): Promise<AutoGenerationResponse> {
  // Validation basique côté client
  if (!payload.employees || payload.employees.length === 0) {
    throw new Error('Aucun employé fourni pour la génération du planning');
  }

  if (payload.weekNumber < 1 || payload.weekNumber > 53) {
    throw new Error('Le numéro de semaine doit être entre 1 et 53');
  }

  // Validation des heures contractuelles
  for (const employee of payload.employees) {
    if (employee.contractHoursPerWeek <= 0) {
      throw new Error(`Heures contractuelles invalides pour l'employé ${employee._id}`);
    }
  }

  // Appel API avec gestion d'erreurs complète
  const response = await axiosInstance.post<AutoGenerationResponse>(
    '/schedules/auto-generate',
    payload,
    { timeout: 30000 }
  );

  return response.data;
}
```

## Intégration frontend

### PlanningWizard - Collecte des préférences

Le `PlanningWizard` a été modifié pour collecter les préférences des employés et intégrer le nouveau système :

```typescript
// Collecte des préférences employés
const [employeePreferences, setEmployeePreferences] = useState<{
  [key: string]: {
    preferredDays: string[];
    preferredHours: string[];
  };
}>({});

// Fonction de génération mise à jour
const generateSchedule = async () => {
  const payload: GeneratePlanningPayload = {
    weekNumber: constraints.weekNumber,
    year: constraints.year,
    employees: employeesWithExceptions.map(emp => ({
      _id: emp._id,
      contractHoursPerWeek: emp.contractHoursPerWeek || 35,
      exceptions: emp.exceptions,
      preferences: employeePreferences[emp._id]
    })),
    companyConstraints: {
      openDays: constraints.companyConstraints?.openingDays || [],
      openHours: openHours.length > 0 ? openHours : ["09:00-18:00"],
      minEmployeesPerSlot: constraints.companyConstraints?.minStaffSimultaneously || 1
    }
  };

  try {
    const response = await autoGenerateSchedule(payload);
    toast.success(`🎉 Planning généré avec succès !`);
    navigate('/manager/validation-planning');
  } catch (error) {
    toast.error(`Erreur : ${error.message}`);
  }
};
```

## Gestion des contraintes

### Types de contraintes supportées

1. **Contraintes employés :**
   - Heures contractuelles hebdomadaires
   - Jours de préférence
   - Heures de préférence
   - Exceptions (congés, absences, formations)

2. **Contraintes entreprise :**
   - Jours d'ouverture
   - Heures d'ouverture
   - Nombre minimum d'employés par créneau

3. **Contraintes logiques :**
   - Pas de chevauchement d'horaires
   - Respect des pauses légales
   - Équilibrage des charges

### Algorithme de résolution

```typescript
function solvePlanningConstraints(
  employees: Employee[],
  constraints: AllConstraints
): PlanningResult {
  // 1. Construction du modèle mathématique
  const solverModel = buildSolverModel(employees, constraints);
  
  // 2. Résolution avec jsLPSolver
  const solution = solver.Solve(solverModel);
  
  // 3. Vérification de faisabilité
  if (solution.feasible) {
    return buildPlanningFromSolution(solution, employees);
  }
  
  // 4. Système de fallback si infaisable
  return generateFallbackPlanning(employees, constraints);
}
```

## Performance et optimisations

### Optimisations algorithme

- **Pré-calcul des créneaux** : Génération des créneaux disponibles avant optimisation
- **Variables binaires** : Utilisation de variables entières pour réduire l'espace de recherche
- **Contraintes hiérarchiques** : Priorisation des contraintes critiques

### Optimisations système

- **Timeout intelligent** : 30 secondes maximum pour génération
- **Cache des préférences** : Stockage temporaire des choix utilisateur
- **Validation en amont** : Vérification de cohérence avant traitement

## Monitoring et métriques

### Métriques collectées

- Temps de génération par planning
- Taux de succès du solveur principal
- Utilisation du système de fallback
- Satisfaction des contraintes

### Logs détaillés

```typescript
logger.info('Planning generation started', {
  component: 'planning-generation',
  weekNumber,
  year,
  employeeCount: employees.length,
  constraintsCount: Object.keys(companyConstraints).length
});

logger.info('Planning generation completed', {
  component: 'planning-generation',
  success: true,
  generationTime: Date.now() - startTime,
  employeesScheduled: Object.keys(result.planning).length,
  totalHours: result.metadata.stats.totalHoursPlanned
});
```

## Tests et validation

### Tests unitaires

- Tests du service `generateSchedule.ts`
- Tests de validation Zod
- Tests des fonctions utilitaires

### Tests d'intégration

- Tests de l'endpoint `/api/schedules/auto-generate`
- Tests de l'intégration frontend/backend
- Tests du workflow complet

### Tests de performance

- Benchmarks avec différentes tailles d'équipes
- Tests de montée en charge
- Validation des timeouts

## Dépannage et résolution de problèmes

### Erreurs courantes

1. **Contraintes incompatibles**
   - Vérifier la cohérence des heures d'ouverture
   - S'assurer que les heures contractuelles sont réalisables

2. **Timeout de génération**
   - Réduire le nombre d'employés par batch
   - Simplifier les contraintes complexes

3. **Échec du solveur**
   - Le système de fallback prend automatiquement le relais
   - Vérifier les logs pour identifier la cause

### Logs de debug

```bash
# Activer les logs détaillés
DEBUG=planning:* npm run dev

# Logs spécifiques à la génération
DEBUG=planning:generation npm run dev
```

## Évolutions futures

### Améliorations prévues

- **Contraintes avancées** : Gestion des compétences et certifications
- **Optimisation multi-objectifs** : Équilibrage satisfaction/coûts
- **Machine Learning** : Apprentissage des préférences historiques
- **API temps réel** : WebSocket pour suivi de progression

### Intégrations

- **Calendriers externes** : Google Calendar, Outlook
- **Systèmes RH** : Import automatique des données employés
- **Analytics avancées** : Tableaux de bord de performance

---

**Documentation mise à jour** : Juillet 2025 - Version 1.8.0  
**Auteur** : Équipe SmartPlanning  
**Licence** : Propriétaire