# 👨‍💻 Guide de développement - SmartPlanning

## Installation locale

### Prérequis

- **Node.js** >= 18.0.0 (recommandé: 18.x ou 20.x LTS)
- **npm** >= 8.0.0 ou **yarn** >= 1.22.0
- **PostgreSQL** (local ou cloud recommandé)
- **Git** pour le versioning
- **Compte Google Cloud** (pour OAuth - optionnel)
- **Compte OpenRouter** (pour l'Assistant IA Planning avec Gemini 2.0 Flash - recommandé)  
- **Tests automatisés** configurés pour validation génération planning
- **Compte Cloudinary** (pour l'upload d'images - optionnel)

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
   # Accessible sur http://localhost:5050
   # API disponible sur http://localhost:5050/api

   # Terminal 2 - Frontend (port 5173)  
   cd frontend
   npm run dev
   # Accessible sur http://localhost:5173
   # Redirection automatique des appels API vers le backend
   ```

5. **Vérification de l'installation**

   ```bash
   # Tester le backend
   curl http://localhost:5050/api/health
   
   # Ouvrir le frontend dans le navigateur
   open http://localhost:5173
   ```

## Structure du projet

```
smartplanning/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuration (DB, env, passport)
│   │   ├── middlewares/       # Middlewares Express
│   │   ├── prisma/            # Schéma Prisma et migrations
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

# Build de production (optimisé avec code-splitting)
npm run build

# Aperçu du build
npm run preview

# Tests
npm test
```

## 🚀 Optimisations Performance

### Bundle Splitting et Code-Splitting

Le projet utilise des optimisations avancées pour les performances :

#### Configuration Vite optimisée

- **Code-splitting automatique** : Chaque page est chargée à la demande (lazy loading)
- **Chunks manuels** : Bibliothèques séparées par fonction (react-vendor, ui-motion, pdf, lottie)
- **Suspense** : Loading spinner pendant les chargements
- **Organisation des assets** : JS, CSS, images dans des dossiers séparés

#### Résultats des optimisations

- **Bundle principal** : Réduit de 1.9MB → 389KB (**-80%**)
- **70+ chunks** : Pages individuelles de 1-86KB
- **Chargement initial** : Considérablement plus rapide
- **Navigation** : Pages secondaires non bloquantes

### Compression et Cache

#### Backend
- **Compression gzip/brotli** : Niveau 6 pour équilibrer performance/CPU
- **Rate limiting** : 100 requêtes/15min par IP
- **Cache HTTP intelligent** :
  - Assets statiques : 1 an (immutable)
  - API publiques : 1 heure
  - API privées : Pas de cache (sécurité)

#### Commandes de build optimisé

```bash
# Frontend - Build avec métriques détaillées
cd frontend && npm run build
# Affiche la taille de chaque chunk et compression gzip

# Backend - Build avec compression
cd backend && npm run build
# Inclut middleware de compression et cache
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

### Assistant IA Planning Futuriste

- **Framer Motion** : Animations avancées et micro-interactions
- **Glassmorphism** : Effets de verre avec backdrop-blur
- **Particules animées** : Système de particules flottantes
- **Mode adaptatif** : Optimisation automatique light/dark
- **TypeScript strict** : Typage complet avec interfaces dédiées

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

- Index PostgreSQL optimisés et contraintes relationnelles
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

### 🚀 Assistant IA Planning Futuriste (Version 1.6.0)

**Architecture moderne** :
- **Frontend** : `frontend/src/pages/PlanningWizard.tsx` - Interface wizard futuriste
- **Types** : `frontend/src/types/PlanningConstraints.ts` - Types TypeScript complets
- **Backend** : `backend/src/routes/ai.routes.ts` - API `/ai/schedule/generate-from-constraints`

**Technologies utilisées** :
- **OpenRouter** : Intégration avec modèle DeepSeek R1 optimisé
- **Framer Motion** : Animations avancées et particules flottantes
- **Glassmorphism** : Design moderne avec effets de transparence
- **Zod validation** : Validation robuste des contraintes de planification

**Développement local** :
```bash
# Variables d'environnement requises (Version 1.7.1)
OPENROUTER_API_KEY=sk-or-v1-your-api-key  # Obligatoire pour Gemini 2.0 Flash

# Test de l'interface
cd frontend && npm run dev
# Naviguer vers /planning-wizard
```

### Fonctionnalités IA

- **🎯 Génération intelligente** : Plannings optimisés avec contraintes granulaires
- **💫 Interface immersive** : Wizard en 6 étapes avec animations fluides
- **⚡ Temps réel** : Feedback progressif avec particules d'énergie
- **🧠 Assistant conversationnel** : Configuration intuitive des préférences IA
- **📊 Optimisation avancée** : Équilibrage charge, préférences employés, contraintes entreprise

### 🚀 Génération automatique de plannings (Version 2.0.0)

**Architecture du système** :
- **Frontend Service** : `frontend/src/services/autoGenerateSchedule.ts` - Service API avec validation
- **Backend Route** : `backend/src/routes/autoGenerate.route.ts` - Endpoint REST avec Zod
- **Core Engine** : `backend/src/services/planning/generateSchedule.ts` - AdvancedSchedulingEngine
- **Integration** : `frontend/src/pages/PlanningWizard.tsx` - Interface utilisateur unifiée

**Technologies et algorithmes** :
- **AdvancedSchedulingEngine** : Moteur personnalisé ultra-rapide (2-5ms)
- **3 stratégies optimisées** : Distribution, préférences, concentration
- **Validation légale intégrée** : Conformité automatique (11h repos, pauses)
- **Système de fallback** : Génération alternative garantie en cas d'échec
- **Validation Zod** : Schémas complets avec messages d'erreur français
- **PostgreSQL persistence** : Sauvegarde automatique avec schéma Prisma

**Développement et tests** :
```bash
# Test du service de génération
cd backend
npm run dev

# Test de l'endpoint
curl -X POST http://localhost:5050/api/schedules/auto-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "weekNumber": 30,
    "year": 2025,
    "employees": [
      {
        "_id": "emp_123",
        "contractHoursPerWeek": 35,
        "preferences": {
          "preferredDays": ["lundi", "mardi"],
          "preferredHours": ["09:00-17:00"]
        }
      }
    ],
    "companyConstraints": {
      "openDays": ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
      "openHours": ["08:00-18:00"],
      "minEmployeesPerSlot": 1
    }
  }'

# Vérification des plannings générés
# Les plannings apparaissent automatiquement dans /manager/validation-planning
```

**Debugging spécifique** :
```bash
# Logs détaillés de génération
DEBUG=planning:* npm run dev

# Test du moteur AdvancedSchedulingEngine
cd backend && node test-new-engine.js

# Vérification de la base de données
mongosh "mongodb://localhost:27017/smartplanning"
> db.generatedschedules.find().limit(5)
```

**Métriques et monitoring** :
- **Temps de génération** : 2-5ms par planning (99.97% plus rapide qu'avant)
- **Score qualité** : 100/100 en tests automatisés
- **Conformité légale** : 100% respect contraintes automatique
- **Taux de succès** : Surveillance via logs backend
- **Fallback usage** : Tracking des échecs du solveur principal
- **Validation errors** : Dashboard Zod intégré au monitoring

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

3. **Erreurs PostgreSQL**

   - Vérifier la connexion Prisma dans `backend/src/config/db.ts`
   - Contrôler les variables d'environnement DATABASE_URL

4. **Build frontend échoue**
   - Vérifier les variables d'environnement VITE\_\*
   - Nettoyer le cache : `rm -rf node_modules && npm install`

5. **AdvancedSchedulingEngine ne fonctionne pas**
   ```bash
   # Plus de clés API requises ! Moteur natif intégré
   # echo $OPENROUTER_API_KEY  # DEPRECATED - Plus nécessaire
   
   # Tester l'endpoint ultra-performant
   curl -X POST http://localhost:5050/api/autoGenerate/generate-from-constraints \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-jwt-token>" \
     -d '{"teamId": "test", "weekNumber": 1, "year": 2025, "employees": []}'
   ```

6. **Animations lentes ou saccadées**
   - Désactiver les particules en mode développement
   - Réduire le nombre d'éléments animés simultanément
   - Vérifier les performances avec React DevTools

7. **Génération automatique de planning échoue**
   ```bash
   # Tester le moteur directement
   cd backend && node test-new-engine.js
   
   # Tester le service via API
   curl -X POST http://localhost:5050/api/schedules/auto-generate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <jwt-token>" \
     -d '{"weekNumber": 1, "year": 2025, "employees": [{"_id": "test", "contractHoursPerWeek": 35}]}'
   
   # Vérifier les logs d'erreur
   tail -f backend/logs/planning.log
   ```

8. **Plannings générés n'apparaissent pas dans la validation**
   - Vérifier la sauvegarde en base : `db.generatedschedules.find()`
   - Contrôler le champ `generatedBy` (doit être 'AI')
   - Vérifier les permissions de l'utilisateur (manager/admin)
   - Examiner les logs de correspondance employé/planning

9. **Performance du moteur AdvancedSchedulingEngine**
   - Génération exceptionnelle 2-5ms constantes (toutes tailles d'équipe)
   - Performance production mesurée : 99.97% plus rapide vs solutions IA
   - Validation automatique des contraintes légales (11h repos, pauses)
   - Cache intelligent avec dégradation gracieuse en production
   - Fiabilité 100% : aucune dépendance externe, disponibilité maximale

---

## 🚀 Excellence Développement v2.2.1 (14 Août 2025)

### Innovations Techniques par Christophe Mostefaoui

**AdvancedSchedulingEngine Révolutionnaire :**
- 🚀 **Performance native** : 2-5ms génération TypeScript (vs 15-30s IA)
- ⚡ **Zéro dépendance** : Élimination coûts API, fiabilité 100%
- 🏗️ **Architecture optimisée** : Index PostgreSQL optimisés + cache intelligent
- 🔒 **Sécurité parfaite** : 15/15 tests (100% protection)

**Interface Ultra-Moderne :**
- 🎨 **Planning Wizard** : 7 étapes immersives + confettis célébration
- 📦 **Bundle optimisé** : 389KB (-80%) + 70 chunks lazy loading
- 🌓 **Thèmes adaptatifs** : Light/dark avec animations Framer Motion
- 💎 **Glassmorphism premium** : Effets verre + particules interactives

### URLs Développement

- **🖥️ Frontend Dev** : http://localhost:5173
- **🔧 Backend Dev** : http://localhost:5050
- **❤️ Health Check** : http://localhost:5050/api/health
- **🎨 Planning Wizard** : http://localhost:5173/planning-wizard

### Commandes Essentielles

```bash
# Démarrage rapide développement
npm run dev          # Backend (terminal 1)
npm run dev          # Frontend (terminal 2)

# Tests et optimisation
npm run test:security    # 15/15 tests sécurité ✅
npm run optimize-database # Optimisation PostgreSQL
npm run test:planning    # Tests AdvancedSchedulingEngine
```

**🏆 SmartPlanning v2.2.1** - Excellence technique et innovation par [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

---

*Documentation développement mise à jour le 14 août 2025 - Version 2.2.1*  
*Développé par [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance*
