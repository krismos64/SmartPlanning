# 🔧 Documentation API - SmartPlanning

## Vue d'ensemble

L'API SmartPlanning est une API REST ultra-performante construite avec Node.js, Express et TypeScript. Elle utilise MongoDB Atlas et intègre l'AdvancedSchedulingEngine personnalisé pour une génération de plannings révolutionnaire.

**URL de base**: `https://smartplanning.onrender.com/api`  
**Version**: 2.2.1 (14 Août 2025)  
**Développeur**: [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance
**Application**: [SmartPlanning Production](https://smartplanning.fr)
**Status de l'API**: [Health Check](https://smartplanning.onrender.com/api/health)  
**🚀 Innovation Majeure**: AdvancedSchedulingEngine (2-5ms génération vs 15-30s solutions IA)

## Authentification

### Cookies httpOnly (Recommandé)

L'API utilise des cookies httpOnly sécurisés pour l'authentification. Après connexion, le token JWT est automatiquement stocké dans un cookie sécurisé.

**Configuration requise :**

- `credentials: 'include'` dans les requêtes
- `withCredentials: true` pour axios

### JWT Token (Alternative)

Pour les clients qui ne supportent pas les cookies :

```http
Authorization: Bearer <jwt_token>
```

### Google OAuth

Endpoint de redirection pour l'authentification Google :

```http
GET /api/auth/google
```

**Flux OAuth :**

1. Redirection vers Google
2. Callback vers `/api/auth/google/callback`
3. Redirection vers le frontend avec token

## Endpoints

### 🔐 Authentification

#### Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse :**

```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "manager",
    "companyId": "company_id",
    "photoUrl": "https://example.com/photo.jpg"
  }
}
```

**Note :** Le token JWT est automatiquement stocké dans un cookie httpOnly sécurisé.

#### Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee"
}
```

### 👥 Utilisateurs

#### Lister les utilisateurs

```http
GET /api/users
Authorization: Bearer <token>
```

#### Créer un utilisateur

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "manager",
  "companyId": "company_id"
}
```

#### Mettre à jour un utilisateur

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "role": "admin"
}
```

#### Supprimer un utilisateur

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

### 🏢 Entreprises

#### Lister les entreprises

```http
GET /api/companies
Authorization: Bearer <token>
```

#### Créer une entreprise

```http
POST /api/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Entreprise Example",
  "address": "123 Rue Example",
  "phone": "+33123456789",
  "email": "contact@example.com"
}
```

### 👥 Équipes

#### Lister les équipes

```http
GET /api/teams
Authorization: Bearer <token>
```

#### Créer une équipe

```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Équipe Dev",
  "description": "Équipe de développement",
  "managerId": "manager_user_id",
  "companyId": "company_id"
}
```

#### Ajouter un membre à l'équipe

```http
POST /api/teams/:teamId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "employee_id"
}
```

### 👤 Employés

#### Lister les employés

```http
GET /api/employees
Authorization: Bearer <token>
```

#### Créer un employé

```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Alice",
  "lastName": "Martin",
  "email": "alice@example.com",
  "position": "Développeur",
  "skills": ["JavaScript", "React", "Node.js"],
  "teamId": "team_id"
}
```

### 📅 Plannings

#### Lister les plannings hebdomadaires

```http
GET /api/weekly-schedules
Authorization: Bearer <token>
```

**Paramètres de requête :**

- `week`: Semaine (format ISO)
- `teamId`: ID de l'équipe
- `employeeId`: ID de l'employé

#### Créer un planning

```http
POST /api/weekly-schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "week": "2024-01-15",
  "teamId": "team_id",
  "schedules": [
    {
      "employeeId": "employee_id",
      "monday": { "start": "09:00", "end": "17:00" },
      "tuesday": { "start": "09:00", "end": "17:00" },
      "isVacation": false
    }
  ]
}
```

#### 🚀 AdvancedSchedulingEngine - Révolution Technique (V2.2.1)

**🎯 Innovation majeure par Christophe Mostefaoui :**

- ✅ **Performance révolutionnaire** : 2-5ms génération native (99.97% amélioration)
- ✅ **Fiabilité totale** : Aucune dépendance externe (vs OpenRouter/Gemini)
- ✅ **Algorithmes personnalisés** : 3 stratégies intelligentes de génération
- ✅ **Respect légal complet** : 11h repos, pauses déjeuner, contraintes métiers
- ✅ **Gestion avancée exceptions** : 5 types d'absences avec validation temps réel
- ✅ **Intégration Wizard parfaite** : Synchronisation 100% interface/moteur

```http
POST /api/autoGenerate/generate-from-constraints
Authorization: Bearer <token>
Content-Type: application/json

{
  "weekNumber": 30,
  "year": 2025,
  "employees": [
    {
      "_id": "66b8c1234567890123456789",
      "contractHoursPerWeek": 35,
      "exceptions": [
        {
          "date": "2025-08-21",
          "type": "vacation"
        },
        {
          "date": "2025-08-23", 
          "type": "reduced"
        }
      ],
      "preferences": {
        "preferredDays": ["lundi", "mardi", "mercredi", "jeudi"],
        "allowSplitShifts": false,
        "preferredHours": ["09:00-17:00"],
        "maxConsecutiveDays": 5
      },
      "restDay": "dimanche"
    }
  ],
  "companyConstraints": {
    "openDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "openHours": ["08:00-20:00"],
    "minEmployeesPerSlot": 1,
    "maxHoursPerDay": 8,
    "minHoursPerDay": 2,
    "mandatoryLunchBreak": true,
    "lunchBreakDuration": 60
  }
}
```

**Réponse (Succès AdvancedSchedulingEngine) :**

```json
{
  "success": true,
  "message": "Planning généré avec succès par l'AdvancedSchedulingEngine",
  "planning": {
    "66b8c1234567890123456789": {
      "lundi": [
        {
          "start": "09:00",
          "end": "12:00"
        },
        {
          "start": "13:00",
          "end": "17:00"
        }
      ],
      "mardi": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "mercredi": [
        {
          "start": "08:00",
          "end": "16:00"
        }
      ]
    }
  },
  "metadata": {
    "weekNumber": 30,
    "year": 2025,
    "employeeCount": 1,
    "generatedAt": "2025-08-14T14:30:00.000Z",
    "generationTimeMs": 3,
    "engine": "AdvancedSchedulingEngine v2.2.1",
    "strategy": "distribution",
    "stats": {
      "totalHoursPlanned": 35,
      "averageHoursPerEmployee": 35,
      "employeesWithFullSchedule": 1,
      "daysWithActivity": 5,
      "exceptionsProcessed": 2,
      "legalConstraintsRespected": true
    }
  },
  "scheduleId": "66b8c9876543210987654321"
}
```

**Réponse (Erreur de validation) :**

```json
{
  "success": false,
  "message": "Paramètres de génération invalides",
  "issues": [
    {
      "field": "employees.0.contractHoursPerWeek",
      "message": "Le nombre d'heures contractuelles doit être positif",
      "code": "invalid_type"
    }
  ]
}
```

**AdvancedSchedulingEngine - Caractéristiques Techniques :**

- 🚀 **Moteur personnalisé TypeScript** : Algorithmes natifs ultra-optimisés (2-5ms)
- 🧠 **3 stratégies intelligentes** : Distribution équilibrée, préférences, concentration
- ⚖️ **Conformité légale parfaite** : Respect automatique 11h repos, pauses déjeuner
- 🎯 **Gestion avancée exceptions** : 5 types (vacation, sick, unavailable, training, reduced)
- 📊 **Métadonnées enrichies** : Temps génération, stratégie utilisée, compliance légale
- 💾 **Intégration MongoDB** : Sauvegarde optimisée avec modèle GeneratedSchedule
- ✅ **Validation Zod française** : Messages d'erreur localisés et contextuels
- 🔄 **Fiabilité totale** : Aucune dépendance externe, disponibilité 100%

### 🏖️ Congés

#### Lister les demandes de congés

```http
GET /api/vacations
Authorization: Bearer <token>
```

#### Créer une demande de congé

```http
POST /api/vacations
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-07-15",
  "endDate": "2024-07-20",
  "reason": "Congés d'été",
  "type": "vacation"
}
```

#### Approuver/Rejeter une demande

```http
PUT /api/vacations/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved", // "approved", "rejected"
  "comments": "Approuvé pour les dates demandées"
}
```

### ✅ Tâches

#### Lister les tâches

```http
GET /api/tasks
Authorization: Bearer <token>
```

#### Créer une tâche

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Développer nouvelle fonctionnalité",
  "description": "Implémenter le système de notifications",
  "assignedTo": "employee_id",
  "dueDate": "2024-08-01",
  "priority": "high",
  "status": "pending"
}
```

### 🚨 Incidents

#### Lister les incidents

```http
GET /api/incidents
Authorization: Bearer <token>
```

#### Créer un incident

```http
POST /api/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Problème serveur",
  "description": "Le serveur ne répond plus",
  "severity": "high",
  "reportedBy": "employee_id",
  "assignedTo": "tech_lead_id"
}
```

### 🤖 Planning Wizard Ultra-Performant

#### 🚀 Assistant Planning avec AdvancedSchedulingEngine

**Note**: L'ancienne solution IA externe a été remplacée par l'AdvancedSchedulingEngine personnalisé développé par Christophe Mostefaoui, offrant des performances 99.97% supérieures.

##### Génération Wizard (Production) - RECOMMANDÉE

```http
POST /api/autoGenerate/generate-from-constraints
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "673b123456789abcdef12345",
  "weekNumber": 4,
  "year": 2025,
  "employees": [
    {
      "id": "emp_001",
      "name": "Marie Dupont",
      "email": "marie.dupont@company.fr",
      "weeklyHours": 35,
      "restDay": "sunday",
      "allowSplitShifts": false,
      "preferredHours": ["09:00-17:00"]
    }
  ],
  "companyConstraints": {
    "openingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "openingHours": [
      {
        "day": "monday",
        "hours": ["09:00-12:00", "14:00-18:00"]
      }
    ],
    "minStaffSimultaneously": 2
  },
  "preferences": {
    "favorSplit": false,
    "favorUniformity": true,
    "balanceWorkload": true,
    "prioritizeEmployeePreferences": true
  }
}
```

**Réponse (Succès) :**

```json
{
  "success": true,
  "schedule": [
    {
      "employeeId": "emp_001",
      "employeeName": "Marie Dupont",
      "day": "monday",
      "slots": [
        {
          "start": "09:00",
          "end": "12:00",
          "duration": 3
        },
        {
          "start": "14:00",
          "end": "18:00",
          "duration": 4
        }
      ],
      "totalHours": 7
    }
  ],
  "message": "Planning généré avec succès par l'IA",
  "processingTime": 1250
}
```

**Réponse (Erreur) :**

```json
{
  "success": false,
  "error": "Contraintes incompatibles : impossible de générer un planning optimal",
  "details": "Nombre d'employés insuffisant pour couvrir tous les créneaux requis"
}
```

##### Génération classique (Déprécié)

```http
POST /api/ai/generate-schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "team_id",
  "week": "2024-01-15",
  "constraints": {
    "workingHours": "09:00-17:00",
    "lunchBreak": "12:00-13:00",
    "maxConsecutiveDays": 5
  },
  "preferences": {
    "balanceWorkload": true,
    "respectSkills": true,
    "minimizeOvertime": true
  }
}
```

**Note :** Les anciennes endpoints IA externes sont maintenant obsolètes. L'AdvancedSchedulingEngine via `/api/autoGenerate/generate-from-constraints` est la solution recommandée offrant performances natives exceptionnelles.

**Fonctionnalités du Planning Wizard Production :**

- 🎨 **Interface ultra-moderne** : Wizard 7 étapes avec animations Framer Motion
- ⚡ **Configuration granulaire** : Contraintes détaillées par employé et entreprise  
- 🚀 **AdvancedSchedulingEngine** : Génération native 2-5ms sans dépendance externe
- 📊 **Feedback instantané** : Génération temps réel avec particules d'animation
- 🌓 **Mode adaptatif** : Interface optimisée thèmes light/dark
- 🎯 **Gestion absences** : 5 types d'exceptions avec validation temps réel
- ✅ **Production stable** : Déployé sur https://smartplanning.fr

### 📊 Statistiques

#### Statistiques globales

```http
GET /api/stats
Authorization: Bearer <token>
```

**Réponse :**

```json
{
  "users": {
    "total": 150,
    "active": 142,
    "byRole": {
      "admin": 5,
      "manager": 25,
      "employee": 120
    }
  },
  "schedules": {
    "thisWeek": 45,
    "thisMonth": 180
  },
  "vacations": {
    "pending": 12,
    "approved": 35,
    "rejected": 3
  }
}
```

### 📊 Monitoring et Observabilité

**Note**: Tous les endpoints de monitoring nécessitent un rôle administrateur.

#### Métriques temps réel

```http
GET /api/monitoring/metrics/realtime
Authorization: Bearer <admin_token>
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-17T10:30:00.000Z",
    "auth": {
      "total_attempts": 156,
      "success_rate": 0.95
    },
    "ai": {
      "total_requests": 23,
      "avg_duration": 2450,
      "success_rate": 0.96
    },
    "planning": {
      "total_generations": 8,
      "avg_duration": 1200
    },
    "system": {
      "active_users": 42,
      "memory_usage": {
        "heapUsed": 128000000,
        "heapTotal": 256000000,
        "external": 32000000,
        "arrayBuffers": 8000000
      },
      "uptime": 86400
    }
  }
}
```

#### Métriques historiques

```http
GET /api/monitoring/metrics/historical/:period
Authorization: Bearer <admin_token>
```

**Paramètres :**

- `period`: `1h`, `24h`, `7d`, `30d`

**Réponse :**

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-01-17T09:30:00.000Z",
      "auth_attempts": 45,
      "ai_requests": 12,
      "active_users": 38,
      "response_time": 120,
      "error_rate": 0.02
    }
  ],
  "period": "1h"
}
```

#### Alertes actives

```http
GET /api/monitoring/alerts
Authorization: Bearer <admin_token>
```

**Réponse :**

```json
{
  "success": true,
  "data": [
    {
      "id": "ai_slow_response",
      "severity": "warning",
      "message": "Temps de réponse IA élevé",
      "value": 32000,
      "threshold": 30000,
      "timestamp": "2025-01-17T10:25:00.000Z"
    }
  ],
  "count": 1
}
```

#### Logs système

```http
GET /api/monitoring/logs/:level?limit=100
Authorization: Bearer <admin_token>
```

**Paramètres :**

- `level`: `info`, `warn`, `error`, `all` (optionnel, défaut: `info`)
- `limit`: Nombre de logs (query param, défaut: 100)

**Réponse :**

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-01-17T10:30:00.000Z",
      "level": "info",
      "message": "Log message",
      "component": "auth",
      "userId": "user_123",
      "metadata": {
        "operation": "login",
        "duration": 150
      }
    }
  ],
  "level": "info"
}
```

#### Statistiques système

```http
GET /api/monitoring/system/stats
Authorization: Bearer <admin_token>
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "nodejs": {
      "version": "v18.17.0",
      "uptime": 86400,
      "memory": {
        "heapUsed": 128000000,
        "heapTotal": 256000000
      }
    },
    "system": {
      "platform": "linux",
      "arch": "x64",
      "env": "production"
    },
    "application": {
      "version": "2.2.1",
      "startTime": "2025-08-14T08:00:00.000Z",
      "engine": "AdvancedSchedulingEngine",
      "developer": "Christophe Mostefaoui"
    }
  }
}
```

#### Health check monitoring

```http
GET /api/monitoring/health
Authorization: Bearer <admin_token>
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-17T10:30:00.000Z",
    "uptime": 86400,
    "checks": {
      "database": {
        "status": "healthy",
        "responseTime": 75
      },
      "advancedSchedulingEngine": {
        "status": "healthy",
        "responseTime": 3,
        "version": "2.2.1"
      },
      "memory": {
        "status": "healthy",
        "usage": {
          "heapUsed": 128000000,
          "heapTotal": 256000000
        }
      }
    }
  }
}
```

#### Collecter des métriques manuellement

```http
POST /api/monitoring/metrics/collect
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "auth",
  "data": {
    "success": true,
    "method": "email",
    "userId": "user_123"
  }
}
```

**Types supportés :**

- `auth`: Tentatives d'authentification
- `planning`: Génération AdvancedSchedulingEngine
- `wizard`: Utilisation du Planning Wizard
- `performance`: Métriques de performance système

### 📁 Upload de fichiers

#### Upload de photo de profil

```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData: file=<image_file>
```

## Codes de statut HTTP

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | Succès                           |
| 201  | Créé avec succès                 |
| 400  | Requête invalide                 |
| 401  | Non authentifié                  |
| 403  | Accès interdit                   |
| 404  | Ressource non trouvée            |
| 409  | Conflit (ex: email déjà utilisé) |
| 500  | Erreur serveur interne           |

## Format d'erreur

```json
{
  "error": {
    "message": "Description de l'erreur",
    "code": "ERROR_CODE",
    "details": {
      "field": "Détails spécifiques"
    }
  }
}
```

## Pagination

Pour les endpoints qui retournent des listes :

**Paramètres de requête :**

- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 20, max: 100)
- `sort`: Champ de tri (ex: "createdAt", "-createdAt" pour desc)

**Réponse avec pagination :**

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 98,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtrage et recherche

**Paramètres de requête communs :**

- `search`: Recherche textuelle
- `status`: Filtrer par statut
- `role`: Filtrer par rôle
- `companyId`: Filtrer par entreprise
- `teamId`: Filtrer par équipe
- `startDate` / `endDate`: Filtrer par période

Exemple :

```http
GET /api/users?search=john&role=manager&companyId=123
```

## Rate Limiting

- **Limite générale**: 100 requêtes/minute par IP
- **Authentification**: 5 tentatives/minute par IP
- **Upload**: 10 fichiers/minute par utilisateur

## Health Check

```http
GET /api/health
```

**Réponse :**

```json
{
  "status": "OK",
  "timestamp": "2025-08-14T14:30:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "version": "2.2.1",
  "developer": "Christophe Mostefaoui",
  "engine": "AdvancedSchedulingEngine",
  "application": "https://smartplanning.fr",
  "performance": {
    "planningGeneration": "2-5ms",
    "improvement": "99.97%"
  }
}
```

---

**🎯 SmartPlanning API v2.2.1** - Révolution technique par [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

**🚀 AdvancedSchedulingEngine** : Performance native exceptionnelle (2-5ms vs 15-30s solutions IA)  
**✅ Production stable** : Déployé sur [SmartPlanning.fr](https://smartplanning.fr)  
**📊 Excellence technique** : 99.97% d'amélioration des performances

*Documentation API mise à jour le 14 août 2025*
