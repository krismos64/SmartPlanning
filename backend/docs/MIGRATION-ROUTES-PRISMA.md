# Migration des Routes Mongoose vers Prisma - PostgreSQL

**Date**: 2025-10-08
**Statut**: En cours
**Technicien**: Claude Code

## Contexte

Migration de 16 fichiers de routes de Mongoose (MongoDB) vers Prisma ORM (PostgreSQL).
Les 5 routes admin ont déjà été migrées avec succès (adminTeam, companies, employees, teams, users).

## Schéma de Migration

### Types de Modifications Principales

1. **Imports**: `import mongoose from "mongoose"` → `import prisma from "../config/prisma"`
2. **Validation ID**: `mongoose.Types.ObjectId.isValid()` → `parseInt(id, 10)` + `isNaN()`
3. **Find Operations**: `Model.find()` → `prisma.model.findMany()`
4. **FindById**: `Model.findById()` → `prisma.model.findUnique({ where: { id: parseInt() } })`
5. **Create**: `new Model().save()` → `prisma.model.create({ data: {...} })`
6. **Update**: `Model.findByIdAndUpdate()` → `prisma.model.update({ where: {}, data: {} })`
7. **Delete**: `Model.findByIdAndDelete()` → `prisma.model.delete({ where: {} })`
8. **Populate**: `.populate()` → `include: { relation: { select: {...} } }`
9. **Count**: `Model.countDocuments()` → `prisma.model.count()`

### Correspondances des Modèles

| Mongoose | Prisma |
|----------|--------|
| Company | prisma.company |
| User | prisma.user |
| Employee | prisma.employee |
| Team | prisma.team |
| WeeklySchedule | prisma.weeklySchedule |
| GeneratedSchedule | prisma.generatedSchedule |
| VacationRequest | prisma.vacationRequest |
| Task | prisma.task |
| Incident | prisma.incident |
| Event | prisma.event |
| ChatbotInteraction | prisma.chatbotInteraction |
| ChatbotSettings | prisma.chatbotSettings |
| Subscription | prisma.subscription |
| Payment | prisma.payment |

### Champs Modifiés

- `contractHoursPerWeek` → `contractualHours`
- `photoUrl` → `profilePicture` (User) / `photoUrl` reste pour Employee
- `logoUrl` → `logo` (Company)
- `managerIds` (array) → `managerId` (int) + `manager` relation
- ObjectId → Int

## Fichiers à Migrer

### Priorité 1 - Simples (Routes avec peu de logique métier)

1. `/routes/companies.route.ts` (2 routes GET)
2. `/routes/password.routes.ts` (1 route PUT)
3. `/routes/profile.routes.ts` (1 route PUT)
4. `/routes/generatedSchedules.route.ts` (1 route PUT)

### Priorité 2 - Moyennes (Logique métier modérée)

5. `/routes/employees/accessibleEmployees.route.ts` (1 route GET complexe)
6. `/routes/tasks.routes.ts` (4 routes CRUD)
7. `/routes/incidents.route.ts` (4 routes CRUD)
8. `/routes/teams.route.ts` (6 routes)
9. `/routes/performance.routes.ts` (8 routes)

### Priorité 3 - Complexes (Logique métier avancée + agrégations)

10. `/routes/employee.routes.ts` (7 routes + transactions)
11. `/routes/users.routes.ts` (9 routes + upload Cloudinary)
12. `/routes/stats.routes.ts` (1 route avec agrégations complexes)
13. `/routes/vacations.routes.ts` (9 routes + logique de permissions)
14. `/routes/weeklySchedules.route.ts` (7 routes + agrégations MongoDB)

### Priorité 4 - Très Complexes (IA + algorithmes)

15. `/routes/ai.routes.ts` (Routes IA + OpenRouter + algorithmes planning)
16. `/routes/autoGenerate.route.ts` (Génération automatique + cache Redis)

## Stratégie de Migration

### Phase 1: Routes Simples (Fichiers 1-4)
- Conversion directe sans logique complexe
- Tests unitaires à chaque étape
- Validation des réponses API

### Phase 2: Routes Moyennes (Fichiers 5-9)
- Attention aux relations Prisma
- Gestion des erreurs Prisma (P2025, P2002)
- Tests de permissions par rôle

### Phase 3: Routes Complexes (Fichiers 10-14)
- Remplacer agrégations MongoDB par jointures Prisma
- Transactions Prisma pour opérations atomiques
- Optimisation des requêtes

### Phase 4: Routes IA (Fichiers 15-16)
- Conserver la logique algorithmique
- Adapter uniquement les appels DB
- Tests de performance planning

## Points d'Attention Critiques

### Transactions
```typescript
// Avant (Mongoose)
const session = await mongoose.startSession();
session.startTransaction();
await Model.create([{...}], { session });
await session.commitTransaction();

// Après (Prisma)
await prisma.$transaction(async (tx) => {
  await tx.model.create({ data: {...} });
});
```

### Agrégations MongoDB → Prisma
```typescript
// Mongoose $lookup → Prisma include
const results = await prisma.model.findMany({
  where: {...},
  include: {
    relation: {
      select: { field: true }
    }
  }
});
```

### Arrays Int[]
```typescript
// Prisma supporte Int[] nativement
// Mais pour managerIds → manager relation 1-to-1
const team = await prisma.team.findUnique({
  where: { id },
  include: {
    manager: { select: { firstName: true, lastName: true } }
  }
});
```

### Gestion Erreurs Prisma
```typescript
catch (error: any) {
  if (error.code === 'P2025') {
    return res.status(404).json({ message: "Ressource non trouvée" });
  }
  if (error.code === 'P2002') {
    return res.status(400).json({ message: "Contrainte unique violée" });
  }
  return res.status(500).json({ message: "Erreur serveur" });
}
```

## Checklist par Fichier

- [ ] Imports Prisma
- [ ] Validation ID (parseInt)
- [ ] CRUD operations
- [ ] Relations (include/select)
- [ ] Gestion erreurs
- [ ] Tests manuels
- [ ] Documentation mise à jour

## Progression

| Fichier | Statut | Routes | Notes |
|---------|--------|--------|-------|
| companies.route.ts | ⏳ En cours | 2/2 | |
| password.routes.ts | ⏳ En cours | 1/1 | |
| profile.routes.ts | ⏳ En cours | 1/1 | |
| generatedSchedules.route.ts | ⏳ En cours | 1/1 | |
| accessibleEmployees.route.ts | ⏳ En cours | 1/1 | |
| tasks.routes.ts | ⏳ En cours | 4/4 | |
| incidents.route.ts | ⏳ En cours | 4/4 | |
| teams.route.ts | ⏳ En cours | 6/6 | |
| performance.routes.ts | ⏳ En cours | 8/8 | |
| employee.routes.ts | ⏳ En cours | 7/7 | |
| users.routes.ts | ⏳ En cours | 9/9 | |
| stats.routes.ts | ⏳ En cours | 1/1 | Agrégations complexes |
| vacations.routes.ts | ⏳ En cours | 9/9 | Logique permissions |
| weeklySchedules.route.ts | ⏳ En cours | 7/7 | Agrégations MongoDB |
| ai.routes.ts | ⏳ En cours | 6/6 | IA + OpenRouter |
| autoGenerate.route.ts | ⏳ En cours | 1/1 | Cache Redis |

**Total**: 0/66 routes migrées (0%)

## Tests Requis Après Migration

1. Tests authentification/autorisation
2. Tests CRUD complets
3. Tests relations Prisma
4. Tests permissions par rôle
5. Tests agrégations
6. Tests transactions
7. Tests performance (temps réponse)
8. Tests intégration frontend

## Références

- Documentation Prisma: https://www.prisma.io/docs
- Schéma complet: `/backend/prisma/schema.prisma`
- Exemples routes admin migrées: `/backend/src/routes/admin/`
