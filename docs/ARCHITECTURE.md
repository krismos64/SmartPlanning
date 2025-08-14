# 🏗️ Guide d'architecture - SmartPlanning

## Vue d'ensemble

SmartPlanning utilise une architecture séparée moderne (découplée) avec un backend Node.js/Express et un frontend React, déployés sur des serveurs différents mais communicant via une API REST sécurisée.

**Mise à jour** : 14 Août 2025 - Version 2.2.1 Production Déployée  
**Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance  
**🚀 Révolution** : AdvancedSchedulingEngine remplace les solutions IA externes (99.97% amélioration)

## Architecture générale

```
┌─────────────────┐    HTTPS/REST API    ┌─────────────────┐
│   Frontend      │◄──────────────────────►│    Backend      │
│   React + Vite  │    (JSON + JWT)       │ Node.js/Express │
│   Port 5173     │                       │   Port 5050     │
│ (Hostinger)     │                       │   (Render)      │
└─────────────────┘                       └─────────────────┘
                                                    │
                                                    │ Mongoose ODM
                                                    ▼
                                          ┌─────────────────┐
                                          │  MongoDB Atlas  │
                                          │   (Cloud DB)    │
                                          └─────────────────┘
```

## Stack technique détaillé

### Frontend (React + TypeScript)

**Technologies principales :**

- **React 18** : Framework UI avec hooks et contexte
- **TypeScript** : Typage strict pour la fiabilité
- **Vite** : Build tool moderne avec HMR ultra-rapide
- **TailwindCSS** : Framework CSS utility-first
- **React Router** : Navigation SPA avec lazy loading

**Composants et UI :**

- **Lucide React** : Icônes modernes et cohérentes
- **Framer Motion** : Animations fluides et performantes (Assistant IA Planning)
- **Lottie React** : Animations complexes (JSON)
- **React Hot Toast** : Notifications élégantes
- **React Helmet Async** : Gestion SEO et meta tags

**Assistant IA Planning Futuriste (v1.6.0) :**

- **Glassmorphism Design** : Effets de verre avec backdrop-blur
- **Particules animées** : Système de particules flottantes
- **Wizard moderne** : Interface 6 étapes avec navigation progressive
- **Mode adaptatif** : Optimisation automatique light/dark

**État et données :**

- **React Context** : Gestion d'état global (auth, thème)
- **Axios** : Client HTTP avec intercepteurs automatiques
- **React Hook Form** : Gestion de formulaires performante

**Performance :**

- **Code splitting** : Chaque page = chunk séparé
- **Lazy loading** : Composants chargés à la demande
- **Bundle optimisé** : 1.9MB → 389KB (-80%)
- **Compression gzip** : Réduction supplémentaire de 70%

### Backend (Node.js + TypeScript)

**Technologies principales :**

- **Node.js 18+** : Runtime JavaScript côté serveur
- **Express.js** : Framework web minimaliste et rapide
- **TypeScript** : Développement typé côté serveur
- **Mongoose** : ODM pour MongoDB avec validation

**Sécurité :**

- **JWT** : Tokens d'authentification sécurisés
- **bcrypt** : Hashage des mots de passe (salt 10)
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Politique stricte cross-origin
- **express-rate-limit** : Protection DoS

**Middleware et utilitaires :**

- **Morgan** : Logging HTTP détaillé
- **Compression** : gzip/brotli automatique
- **Multer** : Upload de fichiers multipart
- **Passport** : Authentification OAuth Google

**Performance :**

- **Cache HTTP** : Stratégie intelligente par endpoint
- **Index MongoDB** : Requêtes optimisées
- **Compression** : Réduction automatique de 70%
- **Health checks** : Monitoring continu

### Base de données (MongoDB Atlas)

**Architecture :**

- **MongoDB Atlas** : Cluster cloud managé
- **Mongoose ODM** : Schémas typés et validation
- **Index optimisés** : Performance des requêtes
- **Replica Set** : Haute disponibilité

**Modèles principaux :**

- `User` : Utilisateurs avec authentification
- `Company` : Entreprises multi-tenant
- `Team` : Équipes organisationnelles
- `Employee` : Profils détaillés employés
- `WeeklySchedule` : Plannings hebdomadaires
- `VacationRequest` : Demandes de congés
- `Task` & `Incident` : Gestion opérationnelle

## Patterns architecturaux

### 1. Separation of Concerns

**Frontend responsabilités :**

- Présentation et interaction utilisateur
- Validation côté client
- Navigation et routing
- Gestion d'état local

**Backend responsabilités :**

- Logique métier
- Authentification et autorisation
- Validation côté serveur
- Persistence des données

### 2. API-First Design

- **Contrat API** : OpenAPI/Swagger ready
- **Versioning** : URL versioning (`/api/v1/`)
- **Status codes** : HTTP standards respectés
- **Error handling** : Réponses JSON structurées

### 3. Component-Driven Development

**Architecture des composants :**

```
src/components/
├── ui/              # Composants réutilisables (Button, Modal, etc.)
├── layout/          # Structure (Header, Footer, Sidebar)
├── admin/           # Fonctionnalités administratives
├── modals/          # Modales spécialisées
└── pages/           # Composants pages complets
```

### 4. Hook-Based Logic

- **Hooks personnalisés** : `useAuth`, `useTheme`, `useToast`
- **Logique réutilisable** : Extraction dans hooks
- **Side effects** : `useEffect` pour API calls
- **Performance** : `useMemo`, `useCallback` stratégiques

## Sécurité et authentification

### JWT avec cookies httpOnly

**Flux d'authentification :**

1. User login → Backend vérifie credentials
2. Backend génère JWT → Stockage cookie httpOnly
3. Frontend reçoit user data → Mise à jour contexte
4. Requêtes suivantes → Cookie auto-inclus
5. Backend vérifie JWT → Autorisation accordée

**Avantages :**

- **XSS Protection** : JS ne peut pas accéder au token
- **CSRF Protection** : SameSite policy
- **Auto-logout** : Expiration automatique
- **Cross-domain** : Support production

### Role-Based Access Control (RBAC)

**Hiérarchie des rôles :**

```
admin > directeur > manager > employee
```

**Permissions par rôle :**

- **admin** : Accès global, gestion système
- **directeur** : Gestion entreprise, équipes, utilisateurs
- **manager** : Gestion équipe assignée, plannings, congés
- **employee** : Consultation, demandes personnelles

## Performance et optimisations

### Frontend optimizations

**Build optimizations :**

- **Manual chunks** : Bibliothèques groupées logiquement
- **Tree shaking** : Code mort éliminé
- **Minification** : Terser pour JS, cssnano pour CSS
- **Asset optimization** : Images optimisées automatiquement

**Runtime optimizations :**

- **Lazy loading** : `React.lazy()` + Suspense
- **Memoization** : `React.memo()` pour composants purs
- **Virtual scrolling** : Pour grandes listes
- **Debouncing** : Pour recherche et filtres

### Backend optimizations

**Database optimizations :**

- **Index strategies** : Compound indexes pour requêtes complexes
- **Projection** : Sélection champs nécessaires uniquement
- **Aggregation** : Pipeline optimisé pour statistiques
- **Connection pooling** : Mongoose connection management

**HTTP optimizations :**

- **Compression middleware** : gzip/brotli niveau 6
- **ETag support** : Cache validation intelligente
- **HTTP/2** : Support automatique via Render
- **CDN ready** : Headers pour mise en cache

## Intégrations externes

### 🚀 AdvancedSchedulingEngine Ultra-Performant (Révolution 2.2.1)

**Architecture révolutionnaire - Moteur personnalisé :**

```
┌─────────────────────┐    API REST     ┌─────────────────────┐   TypeScript   ┌─────────────────────┐
│   Planning Wizard   │◄───────────────►│   Backend Routes    │◄─────────────►│ AdvancedScheduling  │
│  (7 étapes + UX)    │   Constraints   │   autoGenerate/     │  Algorithms   │     Engine          │
│  Framer Motion      │     (JSON)      │   + Zod Validation  │   (2-5ms)     │   (3 Strategies)    │
│  Glassmorphism      │                 │                     │               │   100% Reliable     │
│  Particules         │                 │                     │               │                     │
└─────────────────────┘                 └─────────────────────┘               └─────────────────────┘
```

**🎨 Interface Ultra-Moderne :**

- **Planning Wizard 7 étapes** : Navigation progressive avec validation temps réel
- **Glassmorphism avancé** : Design futuriste avec effets transparence et particules
- **Animations Framer Motion** : Système immersif avec micro-interactions fluides
- **Thèmes adaptatifs** : Light/Dark avec optimisations automatiques avancées
- **Feedback instantané** : Génération ultra-rapide avec confettis de célébration

**🚀 AdvancedSchedulingEngine :**

- **Moteur personnalisé TypeScript** : Algorithmes natifs ultra-optimisés (2-5ms)
- **Performance révolutionnaire** : 99.97% plus rapide que solutions IA externes
- **3 stratégies intelligentes** : Distribution équilibrée, préférences, concentration
- **Fiabilité totale** : Aucune dépendance externe, disponibilité 100%
- **Validation Zod** : Schémas TypeScript français avec gestion erreurs contextuelles

**📊 Fonctionnalités Production :**

- **Génération instantanée** : Plannings avec contraintes légales et métiers
- **Interface immersive** : Expérience utilisateur révolutionnaire
- **Gestion absences avancée** : 5 types d'exceptions avec validation temps réel
- **Types complets** : Interface TypeScript stricte avec PlanningConstraints

### 🚀 AdvancedSchedulingEngine Production (v2.2.1) - Révolution Technique

**Architecture révolutionnaire - Moteur personnalisé :**

```
┌─────────────────────┐    API REST     ┌─────────────────────┐   TypeScript   ┌─────────────────────┐
│   Planning Wizard   │◄───────────────►│   Backend Routes    │◄─────────────►│ AdvancedScheduling  │
│  (7 étapes UX)      │  POST /auto-    │  autoGenerate.route │   Algorithms   │     Engine          │
│  Configuration      │   Generate/     │  + Zod Validation   │   (2-5ms)     │  3 Smart Strategies │
│  Types TypeScript   │  generate-from- │   + MongoDB Save    │  Native Code  │   Legal Compliance  │
│                     │   constraints   │                     │               │   Perfect Sync      │
└─────────────────────┘                 └─────────────────────┘               └─────────────────────┘
```

**🔧 Architecture révolutionnaire :**

- **Moteur personnalisé** : `backend/src/services/planning/generateSchedule.ts` (547 lignes)
- **Algorithmes TypeScript natifs** : 3 stratégies intelligentes ultra-optimisées
- **Performance exceptionnelle** : 2-5ms génération vs 15-30s solutions IA (99.97% amélioration)
- **Fiabilité totale** : Aucune dépendance externe, disponibilité 100%
- **API endpoint optimisée** : `/api/autoGenerate/generate-from-constraints`

**⚖️ Gestion avancée des contraintes :**

- **Contraintes employés** : Heures contractuelles, préférences, 5 types d'exceptions
- **Contraintes entreprise** : Horaires ouverture, personnel minimum, règles métiers
- **Conformité légale** : 11h repos obligatoires, pauses déjeuner, limites horaires
- **Validation temps réel** : Contrôles cohérence instantanés avec messages français

**💾 Intégration MongoDB optimisée :**

- **Modèle GeneratedSchedule** : Sauvegarde automatique avec métadonnées enrichies
- **Cache intelligent** : Optimisation Redis avec TTL adaptatif
- **Statistiques complètes** : Temps génération, stratégie utilisée, compliance
- **Interface validation** : Intégration parfaite avec Planning Wizard

**🎯 Performance et fiabilité production :**

- **Génération ultra-rapide** : 2-5ms constantes, algorithmes optimisés
- **Types TypeScript stricts** : Interfaces complètes pour sécurité données
- **Gestion erreurs française** : Messages contextuels avec codes spécifiques
- **Tests production** : Validation workflow génération → sauvegarde → affichage

### Upload et assets (Cloudinary)

**Flux d'upload :**

1. Frontend → File selection (images)
2. Backend → Validation (type, taille)
3. Cloudinary → Traitement et stockage
4. Database → URL de l'image stockée
5. Frontend → Affichage optimisé

### Authentification (Google OAuth)

**OAuth 2.0 Flow :**

1. Frontend → Redirect vers Google
2. Google → User authorization
3. Backend → Code exchange pour tokens
4. Backend → Profile retrieval + User creation
5. Frontend → Auto-login avec JWT

## Monitoring et observability

### Health checks

**Endpoints de santé :**

- `GET /api/health` : Status général
- Database connectivity check
- External services status
- Memory usage et uptime

### Logging strategy

**Niveaux de logs :**

- **Error** : Erreurs critiques système
- **Warn** : Situations anormales non critiques
- **Info** : Événements importants (login, etc.)
- **Debug** : Informations développement

### Performance monitoring

**Métriques surveillées :**

- **Response time** : Temps de réponse API
- **Throughput** : Requêtes par seconde
- **Error rate** : Taux d'erreur 4xx/5xx
- **Database performance** : Temps de requête

## Évolutivité et maintenance

### Scalabilité horizontale

**Frontend :**

- **CDN Distribution** : Assets statiques globaux
- **Edge caching** : Mise en cache géographique
- **Load balancing** : Répartition du trafic

**Backend :**

- **Stateless design** : Aucun état serveur stocké
- **Database sharding** : Partitionnement par tenant
- **Microservices ready** : Architecture modulaire

### Maintenance et updates

**Déploiement :**

- **CI/CD Pipeline** : Tests automatiques + déploiement
- **Blue-green deployment** : Déploiement sans interruption
- **Rollback strategy** : Retour version précédente rapide

**Database migrations :**

- **Versioning** : Scripts de migration numérotés
- **Backwards compatibility** : Compatibilité ascendante
- **Data validation** : Vérification intégrité post-migration

---

**🚀 SmartPlanning Architecture v2.2.1 - Excellence Technique Atteinte**

**Documentation mise à jour** : 14 Août 2025  
**Version architecture** : 2.2.1 (Production déployée)  
**Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance  
**Production** : https://smartplanning.fr (Hostinger + Render + MongoDB Atlas)  
**Innovation majeure** : AdvancedSchedulingEngine (99.97% amélioration performance)

**🏆 Révolution Technique :**
- ✅ Moteur de planification personnalisé (2-5ms vs 15-30s)
- ✅ Architecture production stable et scalable  
- ✅ Sécurité parfaite 15/15 tests (100%)
- ✅ Performance exceptionnelle (bundle -80%, compression -70%)
- ✅ Structure projet optimisée avec documentation complète

*SmartPlanning représente l'excellence technique absolue en planification intelligente.*
