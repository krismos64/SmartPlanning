# 🔧 Documentation API - SmartPlanning

## Vue d'ensemble

L'API SmartPlanning est une API REST construite avec Node.js, Express et TypeScript. Elle utilise MongoDB comme base de données et JWT pour l'authentification.

**URL de base**: `https://smartplanning.onrender.com/api`  
**Version**: 1.3.1 (Juillet 2025)  
**Documentation interactive**: Consultez Postman ou utilisez curl pour tester les endpoints  
**Status de l'API**: [Health Check](https://smartplanning.onrender.com/api/health)

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

### 🤖 Intelligence Artificielle

#### Générer un planning avec l'IA

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

**Réponse :**

```json
{
  "generatedSchedule": {
    "week": "2024-01-15",
    "teamId": "team_id",
    "schedules": [...],
    "confidence": 0.95,
    "optimizationScore": 8.7
  },
  "recommendations": [
    "Équilibrer la charge de travail entre les équipes",
    "Prévoir des créneaux de formation"
  ]
}
```

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
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```
