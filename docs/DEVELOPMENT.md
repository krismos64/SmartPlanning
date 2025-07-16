# 👨‍💻 Guide de développement - SmartPlanning

## Installation locale

### Prérequis

- Node.js >= 18.0.0
- npm ou yarn
- MongoDB (local ou Atlas)
- Git

### Étapes d'installation

1. **Cloner le projet**

   ```bash
   git clone https://github.com/krismos64/SmartPlanning
   cd smartplanning
   ```

2. **Installation des dépendances**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configuration des variables d'environnement**

   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Configurer les variables dans backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Configurer les variables dans frontend/.env.local
   ```

4. **Démarrage en mode développement**

   ```bash
   # Terminal 1 - Backend (port 5050)
   cd backend
   npm run dev

   # Terminal 2 - Frontend (port 5173)
   cd frontend
   npm run dev
   ```

## Structure du projet

```
smartplanning/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuration (DB, env, passport)
│   │   ├── middlewares/       # Middlewares Express
│   │   ├── models/            # Modèles MongoDB/Mongoose
│   │   ├── routes/            # Routes API
│   │   ├── scripts/           # Scripts de migration/admin
│   │   └── utils/             # Utilitaires
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages/écrans
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── context/           # Contextes React
│   │   ├── services/          # Services API
│   │   └── types/             # Types TypeScript
│   ├── package.json
│   └── vite.config.ts
└── docs/                      # Documentation
```

## Commandes de développement

### Backend

```bash
# Développement avec hot reload
npm run dev

# Build TypeScript
npm run build

# Démarrage production
npm start

# Linting
npm run lint

# Scripts de base de données
npm run create-admin          # Créer un utilisateur admin
npm run migrate              # Migration des données
npm run migrate:employees    # Migration employés
npm run reset-database       # Réinitialiser complètement la DB
npm run cleanup-orphaned     # Nettoyer les données orphelines

# Tests
npm test                     # Tests généraux
npm run test:security        # Tests de sécurité spécifiques
npm run test:watch          # Tests en mode watch
```

### Frontend

```bash
# Développement
npm run dev

# Build de production
npm run build

# Aperçu du build
npm run preview

# Tests
npm test
```

## Conventions de code

### TypeScript

- Mode strict activé
- Pas de `any` - utiliser des types explicites
- Interfaces pour les objets complexes
- Types d'union pour les valeurs limitées

### Backend

- Structure modulaire avec séparation des responsabilités
- Middlewares pour la logique transversale
- Validation des inputs avec des schemas
- Gestion d'erreurs centralisée

### Frontend

- Composants fonctionnels avec hooks
- Props typées avec interfaces
- Context pour l'état global
- Hooks personnalisés pour la logique métier

### Styles

- TailwindCSS pour le styling
- Classes utilitaires
- Responsive mobile-first
- Support thème clair/sombre

## Base de données

### Modèles principaux

- **User**: Utilisateurs du système
- **Company**: Entreprises clientes
- **Team**: Équipes au sein des entreprises
- **Employee**: Employés avec compétences
- **WeeklySchedule**: Plannings hebdomadaires
- **VacationRequest**: Demandes de congés
- **Task**: Tâches assignées
- **Incident**: Incidents rapportés

### Scripts utiles

```bash
# Initialiser la DB avec des données de test
cd backend && ts-node src/scripts/init-db.ts

# Créer un utilisateur admin
cd backend && ts-node src/scripts/create-admin-user.ts

# Migration depuis l'environnement de test
cd backend && npm run migrate
```

## API

### Architecture REST

- Routes organisées par domaine
- Middleware d'authentification JWT
- Contrôle d'accès basé sur les rôles
- Validation des données d'entrée

### Authentification

L'API utilise des cookies httpOnly sécurisés (recommandé) ou des tokens JWT :

```typescript
// Configuration axios avec cookies
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5050/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alternative avec token JWT
Authorization: Bearer <jwt_token>
```

### Endpoints principaux

```
# Authentification
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/google

# Utilisateurs
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

# Équipes
GET    /api/teams
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id

# Planning
GET    /api/weekly-schedules
POST   /api/weekly-schedules
PUT    /api/weekly-schedules/:id

# IA
POST   /api/ai/generate-schedule
```

## Tests

### Configuration

- Jest pour les tests unitaires
- React Testing Library pour les composants
- Supertest pour les tests d'API

### Lancement des tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Tests en mode watch
npm test -- --watch
```

## Debugging

### Backend

```bash
# Mode debug avec Node.js
DEBUG=* npm run dev

# Logs détaillés
NODE_ENV=development npm run dev
```

### Frontend

- React DevTools
- Redux DevTools (si utilisé)
- Console du navigateur
- Network tab pour les requêtes API

## Performance

### Backend

- Indices MongoDB optimisés
- Pagination des résultats
- Cache des requêtes fréquentes
- Compression gzip

### Frontend

- Code splitting avec Vite
- Lazy loading des composants
- Optimisation des images
- Bundle analysis avec `npm run build:analyze`

## Sécurité

### Bonnes pratiques

- **Validation stricte** des inputs côté client et serveur
- **Sanitisation** des données utilisateur
- **Protection CSRF** avec cookies SameSite
- **Rate limiting** pour prévenir les attaques
- **HTTPS** obligatoire en production
- **Variables d'environnement** pour tous les secrets
- **Intégrité référentielle** avec cascades automatiques

### Authentification sécurisée

- **JWT** avec cookies httpOnly sécurisés
- **Google OAuth** en option
- **Hashage bcrypt** pour les mots de passe
- **Validation** des références cross-collections
- **Tests de sécurité** automatisés (14/15 réussis)

## Git Workflow

### Branches

```bash
main          # Production
develop       # Développement
feature/*     # Nouvelles fonctionnalités
hotfix/*      # Corrections urgentes
```

### Commits

```bash
# Format conventionnel
feat: ajout de la gestion des équipes
fix: correction du bug d'authentification
docs: mise à jour de la documentation
style: formatage du code
refactor: restructuration des composants
test: ajout des tests unitaires
```

## Intégration IA

### OpenAI API

- Configuration dans `backend/src/config/openai.ts`
- Routes dédiées dans `backend/src/routes/ai.routes.ts`
- Interface utilisateur dans `frontend/src/components/modals/AI*.tsx`

### Fonctionnalités

- Génération automatique de plannings
- Assistant conversationnel
- Optimisation des ressources
- Prédiction des besoins

## Débogage commun

### Problèmes fréquents

1. **Port déjà utilisé**

   ```bash
   lsof -ti:5050 | xargs kill -9  # Backend
   lsof -ti:5173 | xargs kill -9  # Frontend
   ```

2. **Problèmes de CORS**

   - Vérifier la configuration dans `backend/src/app.ts`
   - S'assurer que l'origine frontend est autorisée

3. **Erreurs MongoDB**

   - Vérifier la connexion dans `backend/src/config/db.ts`
   - Contrôler les variables d'environnement

4. **Build frontend échoue**
   - Vérifier les variables d'environnement VITE\_\*
   - Nettoyer le cache : `rm -rf node_modules && npm install`
