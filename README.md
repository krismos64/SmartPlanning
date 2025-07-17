# SmartPlanning

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.3.2-blue?style=flat-square)
![Security](https://img.shields.io/badge/Security-Audited-green?style=flat-square)
![Tests](https://img.shields.io/badge/Security%20Tests-14%2F15%20Pass-brightgreen?style=flat-square)
![État](https://img.shields.io/badge/État-Production%20Stable-brightgreen?style=flat-square)

SmartPlanning est une application SaaS complète de gestion intelligente des plannings d'équipe avec intégration IA, développée en TypeScript pour une gestion optimisée des ressources humaines. L'application utilise une architecture moderne séparée (frontend React/backend Node.js) avec des fonctionnalités d'IA avancées pour l'optimisation automatique des plannings.

## 🚀 Optimisations SEO & Performance

Notre plateforme a été optimisée pour les moteurs de recherche et les performances avec les améliorations suivantes :

### 🔍 **Référencement naturel (SEO)**
- ✅ **Sitemap.xml complet** : Toutes les pages indexées pour un meilleur référencement
- ✅ **Robots.txt optimisé** : Directives d'exploration pour protéger les données sensibles
- ✅ **Meta tags enrichis** : Open Graph et Twitter Cards pour les réseaux sociaux
- ✅ **URLs canoniques** : Prévention du contenu dupliqué
- ✅ **Mots-clés français RH/Planning** : Ciblage des termes de recherche pertinents
- ✅ **Schema.org** : Données structurées pour les moteurs de recherche
- ✅ **Analytics intégrés** : Suivi des performances et conversions

### ⚡ **Performance & Optimisations**
- ✅ **Bundle réduit de 80%** : 1.9MB → 389KB pour un chargement ultra-rapide
- ✅ **Code-splitting avancé** : 70+ chunks avec lazy loading intelligent
- ✅ **Compression gzip/brotli** : -70% de données transférées
- ✅ **Cache HTTP intelligent** : Assets (1 an), API publiques (1h)
- ✅ **Rate limiting DoS** : Protection 100 req/15min par IP
- ✅ **Images optimisées** : WebP, compression et lazy loading

🌐 **Application déployée** : [https://smartplanning.fr](https://smartplanning.fr)  
🔧 **API Backend** : [https://smartplanning.onrender.com](https://smartplanning.onrender.com)  
📚 **Documentation technique** : Consultez le dossier `docs/` pour les guides détaillés

## Table des matières

- [Introduction](#introduction)
- [Fonctionnalités clés](#fonctionnalités-clés)
- [État d'avancement](#état-davancement)
- [Stack technique](#stack-technique)
- [Documentation détaillée](#documentation-détaillée)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer l'application](#lancer-lapplication)
- [Scripts d'initialisation](#scripts-dinitialisation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Changelog](#changelog)

## Introduction

SmartPlanning révolutionne la gestion des plannings d'équipe grâce à l'intelligence artificielle. Notre solution permet aux entreprises d'optimiser automatiquement les horaires de travail en tenant compte des contraintes individuelles, des congés et des compétences requises.

Conçue pour les PME et les grandes entreprises, SmartPlanning simplifie la gestion des ressources humaines tout en garantissant une meilleure satisfaction des employés et une productivité accrue.

## Fonctionnalités clés

🤖 **Création automatique de planning avec IA**

- Génération optimisée des plannings hebdomadaires et mensuels
- Prise en compte des contraintes individuelles et des préférences
- Adaptation en temps réel aux imprévus (absences, surcharge, etc.)

👥 **Gestion complète des ressources**

- Gestion des employés et de leurs compétences
- Système de demande et validation des congés
- Suivi des tâches et leur répartition
- Gestion des incidents et remplacements

🎨 **Interface utilisateur intuitive**

- UI moderne développée avec React et TailwindCSS
- Tableaux de bord personnalisés selon les rôles
- Responsive design pour une utilisation sur tous les appareils
- Notifications et alertes configurables

🔒 **Sécurité et API robuste**

- API RESTful sécurisée avec Node.js et Express
- Authentification JWT hybride : cookies httpOnly + localStorage fallback
- Options d'authentification : email/password et Google OAuth
- Contrôle d'accès basé sur les rôles (RBAC)
- Tests de sécurité automatisés complets (14/15 réussis)
- Protection contre XSS, injection NoSQL et attaques CSRF
- Configuration cross-origin HTTPS optimisée
- Documentation API complète

## État d'avancement

### Version actuelle : 1.3.2 (Stable - Production)

**Statut de l'architecture** : ✅ **Ultra Clean** - Architecture optimisée et conforme aux bonnes pratiques MERN  
**Statut déploiement** : ✅ **Production stable** - Déployé et opérationnel sur smartplanning.fr  
**Sécurité** : ✅ **Audit complet** - 14/15 tests de sécurité réussis (93% de couverture)

**Fonctionnalités implémentées :**

✅ **Architecture de base**

- Structure complète du projet (frontend/backend)
- Configuration TypeScript
- Configuration de MongoDB avec Mongoose
- Système de routes API Express

✅ **Architecture API et communication frontend-backend**

- Instance axios centralisée (axiosInstance) pour tous les appels API
- Système d'intercepteurs pour la gestion automatique de l'authentification
- Gestion unifiée des erreurs et des réponses API
- Structure modulaire pour les services API côté frontend

✅ **Modèles de données**

- Utilisateurs et authentification
- Entreprises et équipes
- Employés et leurs compétences
- Plannings et horaires
- Incidents et tâches
- Demandes de congés

✅ **Administration et gestion**

- **Gestion complète des utilisateurs**
  - Création, modification et suppression d'utilisateurs
  - Attribution de rôles (admin, directeur, manager, employé)
  - Activation/désactivation des comptes
  - Upload de photos de profil (intégration Cloudinary)
  - Filtrage par rôle, statut et entreprise
- **Gestion des entreprises**

  - Création et édition des entreprises
  - Upload de logos
  - Association des utilisateurs à leurs entreprises
  - Vue globale de toutes les entreprises

- **Gestion des équipes**
  - Création d'équipes au sein des entreprises
  - Attribution de responsables d'équipe
  - Ajout/suppression de membres
  - Organisation hiérarchique

✅ **Interface utilisateur**

- Page d'accueil et authentification
- Tableau de bord principal avec statistiques
- Interfaces administratives complètes
- Visualisation des plannings hebdomadaires
- Interface de suivi des incidents
- Gestion des tâches des employés
- Système de demande de congés

✅ **Authentification et sécurité**

- Système JWT hybride : cookies httpOnly + localStorage fallback
- Support pour Google OAuth 2.0
- Contrôle d'accès basé sur les rôles (RBAC)
- Protection globale des routes API avec middleware
- Tests de sécurité automatisés (14/15 tests réussis)
- Protection contre les vulnérabilités OWASP
- Configuration cross-origin HTTPS optimisée
- Validation des formulaires côté client et serveur
- Audit de sécurité complet et corrections appliquées

✅ **Expérience utilisateur avancée**

- Mode clair/sombre basé sur les préférences système
- Interfaces responsives pour desktop et mobile
- Système de notifications et toasts
- Modals et confirmations pour les actions importantes
- Composants UI optimisés et réutilisables

✅ **Optimisations performance**

- **Bundle splitting avancé** : Code-splitting automatique avec lazy loading
- **Compression intelligente** : Gzip/Brotli pour -70% de données transférées
- **Cache HTTP optimisé** : Assets statiques (1 an), API publiques (1h)
- **Rate limiting** : Protection DoS avec 100 req/15min par IP
- **Temps de chargement** : Réduction de 80% du bundle principal (1.9MB → 389KB)

✅ **Gestion des équipes et collaborateurs par les managers**

- **Interface complète de gestion d'équipe**
  - Tableau de bord dédié aux managers pour la gestion de leurs équipes
  - Création, modification et suppression d'équipes
  - Assignation de responsabilités et de rôles au sein des équipes
  - Vue d'ensemble des membres de l'équipe avec leurs compétences
  - Filtrage et recherche avancés des membres
- **Gestion des collaborateurs**
  - Ajout et suppression de collaborateurs dans les équipes
  - Modification des informations des collaborateurs (compétences, disponibilités, etc.)
  - Suivi des performances et disponibilités
  - Gestion des accréditations et accès
  - Attribution de tâches spécifiques aux collaborateurs

✅ **Génération et validation de plannings**

- **Interface de validation des plannings générés**
  - Visualisation des plannings générés par l'IA pour approbation
  - Possibilité de modifier les plannings avant validation
  - Système de rejet avec commentaires
- **Intégration avec le système de planification standard**
  - Bouton de navigation vers la page de validation des plannings IA
  - Transformation des plannings validés en plannings officiels

**Fonctionnalités en cours de développement :**

🔄 **Intelligence artificielle**

- Algorithmes d'optimisation des plannings
- Assistant virtuel pour la gestion d'équipe
- Prédiction des besoins en personnel

🔄 **Intégrations**

- Calendriers externes (Google Calendar, Outlook)
- Outils de communication (Slack, Microsoft Teams)
- Systèmes de comptabilité et ERP

🔄 **Fonctionnalités avancées**

- Rapports et analyses de performance
- Export et import de données
- Applications mobiles (iOS/Android)

### Dernières mises à jour

**🔐 Authentification Cross-Origin & UX (Version 1.3.2 - Décembre 2024)**

- **Résolution du problème d'authentification cross-origin**
  - Système hybride : cookies httpOnly + localStorage fallback
  - Configuration optimisée pour HTTPS cross-origin (smartplanning.fr ↔ render.com)
  - Correction des props React et élimination des redirections intempestives
  - Logs de debug ajoutés pour monitoring des cookies
  - Gestion automatique des fallbacks d'authentification

- **Améliorations UX critiques**
  - Élimination des redirections automatiques sur les pages publiques
  - Correction des erreurs styled-components (isDarkMode → $isDarkMode)
  - Optimisation des intercepteurs axios pour les erreurs 401
  - Amélioration de l'expérience utilisateur sur la page d'accueil
  - Compatibilité cross-browser optimisée

**⚡ Optimisations Performance Majeures (Version 1.3.1)**

- **Bundle size et performances frontend optimisées**
  - Code-splitting avancé : 1.9MB → 70+ chunks (plus gros : 389KB) = **-80%**
  - Lazy loading : Toutes les pages chargées à la demande avec Suspense
  - Organisation thématique : react-vendor, ui-motion, pdf, lottie séparés
  - Configuration Vite optimisée : chunks manuels et assets organisés
  - Temps de chargement initial considérablement réduit

- **Compression et cache HTTP implémentés**
  - Compression gzip/brotli niveau 6 : **-70% données transférées**
  - Cache intelligent : Assets statiques (1 an), API publiques (1h), API privées (no-cache)
  - Headers optimisés : Cache-Control, Expires, Pragma
  - Rate limiting renforcé : 100 req/15min par IP avec exemptions intelligentes

**🏗️ Architecture Ultra Clean (Mise à jour majeure précédente)**

- **Audit complet de l'architecture et optimisation**
  - Analyse détaillée de la structure projet : 0 fichiers mal rangés identifiés
  - Identification et nettoyage des redondances : -54% de la taille du repo
  - Élimination des fichiers debug/temporaires : 58KB supprimés
  - Suppression des images dupliquées : 12MB économisés
  - Sécurisation des fichiers d'environnement : variables sensibles protégées
  - Consolidation des scripts backend : organisation optimisée
  - Score global des bonnes pratiques : 6.25/10 → améliorations identifiées

**🛡️ Sécurité (Mise à jour majeure précédente)**

- **Audit de sécurité complet et corrections critiques appliquées**
  - Migration de localStorage vers cookies httpOnly sécurisés
  - Suppression de l'authentification simulée et implémentation JWT réelle
  - Élimination des logs sensibles exposant des données privées
  - Protection globale des routes avec middleware d'authentification
- **Tests de sécurité automatisés implémentés**
  - Suite de 15 tests de sécurité automatisés (14/15 réussis)
  - Tests d'authentification, autorisation et protection des cookies
  - Tests de protection contre XSS, injection NoSQL et attaques CSRF
  - Infrastructure de test avec MongoDB Memory Server
  - Documentation CI/CD pour intégration continue des tests sécuritaires

**Fonctionnalités précédentes**

- Finalisation des interfaces de gestion d'équipes et de collaborateurs pour les managers
- Ajout de la page de validation des plannings générés par l'IA
- Implémentation de l'interface de validation/rejet des plannings générés
- Intégration avec le système de plannings hebdomadaires
- Finalisation des modules d'administration (gestion des utilisateurs, entreprises, équipes)
- Correction des problèmes TypeScript dans les composants UI
- Amélioration du système de filtrage et de recherche dans les interfaces administratives
- Optimisation de performance avec useMemo pour les listes filtrées
- Mise en place d'un système de gestion des erreurs unifié
- Amélioration de l'accessibilité des composants UI

## Stack technique

| Catégorie                     | Technologies                                                          |
| ----------------------------- | --------------------------------------------------------------------- |
| **Frontend**                  | React 18, TypeScript, Vite, TailwindCSS, Framer Motion, React Router, Lottie |
| **Backend**                   | Node.js 18+, Express.js, TypeScript, JWT, bcrypt, Helmet             |
| **Base de données**           | MongoDB Atlas, Mongoose (ODM), Index optimisés                       |
| **Intelligence artificielle** | OpenAI API, GPT-4 pour génération de plannings                       |
| **Authentification**          | JWT hybride (cookies httpOnly + localStorage), Google OAuth 2.0, Passport.js |
| **Upload de fichiers**        | Cloudinary (images), Multer (middleware)                             |
| **Déploiement**               | Docker, Hostinger (Frontend), Render (Backend), MongoDB Atlas        |
| **Tests et sécurité**         | Jest, Supertest, MongoDB Memory Server, Tests de sécurité (14/15)    |
| **Performance**               | Code-splitting Vite, Lazy loading, Compression gzip/brotli (-70%)    |
| **Monitoring & Logs**         | Morgan (HTTP logs), Health checks, Uptime monitoring                 |
| **Outils de développement**   | ESLint, Prettier, React Testing Library, TypeScript strict           |
| **UI/UX**                     | Lucide React (icônes), React Hot Toast, Styled Components, Thèmes    |
| **Internationalisation**      | i18next, react-i18next (support multilingue)                         |
| **PDF & Export**              | jsPDF, jsPDF-autotable (génération de rapports)                      |

## Documentation détaillée

Pour une documentation complète, consultez le dossier `docs/` :

- **[Guide de la base de données](docs/DATABASE.md)** - Architecture et modèles de données
- **[Documentation API](docs/API.md)** - Endpoints et schémas de l'API REST
- **[Guide de déploiement](docs/DEPLOYMENT.md)** - Instructions de déploiement en production
- **[Guide de développement](docs/DEVELOPMENT.md)** - Configuration et développement local

## Changelog

### Version 1.3.2 (Dernière - Authentification & UX)

- **🔐 Résolution critique : Authentification cross-origin**
  - **Système hybride implémenté** : cookies httpOnly + localStorage fallback
  - **Configuration HTTPS optimisée** : sameSite='none' avec secure=true pour cross-origin
  - **Logs de debug ajoutés** : monitoring des cookies et troubleshooting
  - **Gestion automatique** : fallback transparent si cookies cross-origin échouent
  - **Compatibilité navigateurs** : solution robuste pour tous les navigateurs

- **🎨 Corrections UX majeures**
  - **Élimination des redirections intempestives** : pas de redirection automatique depuis la page d'accueil
  - **Correction des erreurs React** : props `isDarkMode` → `$isDarkMode` pour styled-components
  - **Optimisation des intercepteurs** : gestion intelligente des erreurs 401
  - **Pages publiques optimisées** : pas de vérification auth sur les pages publiques
  - **Expérience utilisateur fluidifiée** : navigation naturelle sans interruptions

- **⚡ Optimisations techniques**
  - **AuthContext amélioré** : logique de vérification adaptative selon la page
  - **Axios intercepteurs optimisés** : gestion des erreurs cross-origin
  - **Logs structurés** : debugging facilité en production
  - **Nettoyage automatique** : tokens supprimés à la déconnexion

### Version 1.3.1 (Sécurité)

- **🛡️ Audit de sécurité complet et corrections critiques**

  - **Migration vers l'authentification sécurisée**

    - Remplacement de localStorage par des cookies httpOnly sécurisés
    - Suppression complète de l'authentification simulée (mock)
    - Implémentation d'un système JWT réel avec validation stricte
    - Configuration des cookies avec SameSite=Strict et expiration appropriée

  - **Renforcement de la protection des routes**

    - Middleware global de protection pour toutes les routes `/api/admin/*`
    - Validation des tokens JWT avec gestion des erreurs appropriée
    - Contrôle d'accès strict basé sur les rôles utilisateur

  - **Nettoyage des données sensibles**
    - Élimination des logs exposant des mots de passe et tokens
    - Suppression des données utilisateur hardcodées
    - Protection contre l'exposition d'informations sensibles

- **🧪 Tests de sécurité automatisés complets**

  - **Infrastructure de test robuste**

    - Configuration Jest avec TypeScript et MongoDB Memory Server
    - Environnement de test isolé avec setup/teardown automatique
    - Variables d'environnement dédiées aux tests

  - **Suite de tests de sécurité (14/15 réussis)**

    - Tests d'authentification : login/logout sécurisés, validation JWT
    - Tests de cookies : configuration httpOnly, expiration, suppression
    - Tests de protection : XSS, injection NoSQL, validation d'entrées
    - Tests de performance : temps de réponse, protection DoS
    - Tests d'autorisation : contrôle d'accès par rôle, isolation des données

  - **Documentation et CI/CD**
    - Guide complet d'intégration GitHub Actions
    - Scripts de test sécurisé : `npm run test:security`
    - Rapport détaillé des vulnérabilités corrigées
    - Configuration pre-commit hooks pour validation continue

### Version 1.3.0

- **Intégration de l'interface de validation des plannings générés par l'IA**

  - Ajout d'une nouvelle page `ManagerPlanningValidationPage` pour la validation des plannings générés
  - Interface permettant aux managers de visualiser, modifier, approuver ou rejeter les plannings
  - Système de conversion des plannings validés en plannings officiels
  - Intégration des retours utilisateurs pour améliorer la génération future

- **Amélioration de la page de plannings hebdomadaires**

  - Ajout d'un bouton de navigation vers la page de validation des plannings IA
  - Utilisation de l'icône Brain de Lucide pour indiquer les fonctionnalités liées à l'IA
  - Animation avec Framer Motion pour une meilleure expérience utilisateur
  - Préparation pour l'intégration complète des algorithmes d'IA

- **Finalisation des interfaces de gestion pour les managers**

  - Interface complète pour la création, modification et suppression d'équipes
  - Système de gestion des collaborateurs avec ajout/suppression et modification des informations
  - Tableaux de bord dédiés avec filtres et recherche avancés
  - Gestion des permissions et rôles au sein des équipes
  - Interfaces responsives adaptées aux différents appareils

- **Refactorisation et optimisations**
  - Réorganisation du code pour faciliter l'intégration future des services d'IA
  - Amélioration des performances de chargement des plannings
  - Meilleure gestion des états de chargement et des erreurs

### Version 1.2.0

- **Refactorisation des appels API avec axiosInstance**

  - Centralisation des appels API via une instance axios configurée
  - Remplacement de tous les imports et appels directs à axios par axiosInstance dans les fichiers frontend
  - Amélioration de la cohérence et de la maintenabilité du code
  - Standardisation des en-têtes de requêtes et de la gestion des erreurs

- **Mise en place d'un système d'intercepteurs**

  - Création d'un système d'intercepteurs pour gérer l'authentification
  - Ajout automatique du token d'authentification aux en-têtes des requêtes
  - Gestion automatique des erreurs 401 (Unauthorized) avec redirection vers la page de login
  - Centralisation de la logique d'authentification pour une meilleure sécurité

- **Optimisation de l'architecture frontend**
  - Séparation claire des responsabilités entre les composants et les services API
  - Amélioration de la gestion des erreurs API avec messages utilisateur appropriés
  - Structure modulaire facilitant les futures évolutions

### Version 1.1.0

- **Correction et amélioration des composants UI**

  - Résolution des problèmes de typage TypeScript dans les composants Badge, Avatar et Button
  - Amélioration de la cohérence visuelle des composants dans les thèmes clair/sombre
  - Optimisation de l'accessibilité avec l'utilisation d'attributs aria-label

- **Administration des utilisateurs - Améliorations**

  - Ajout de la propriété `companyId` au type User pour corriger les erreurs TypeScript
  - Correction des filtres par entreprise dans la gestion utilisateurs
  - Amélioration visuelle des badges de rôle et statut
  - Implémentation de feedback visuel pour les actions d'édition et suppression

- **Gestion des entreprises - Optimisations**

  - Amélioration de l'interface de gestion des entreprises
  - Optimisation des requêtes API pour une meilleure performance
  - Support multi-équipes au sein d'une entreprise

- **Refactoring et typage**
  - Amélioration du typage dans tous les composants administratifs
  - Utilisation cohérente des interfaces TypeScript
  - Séparation claire des responsabilités dans les services API

### Version 1.0.0

- **Filtre par entreprise sur la gestion des utilisateurs**

  - Ajout d'un menu déroulant pour filtrer les utilisateurs par entreprise dans la page de gestion des utilisateurs (`UserManagementPage`).
  - Les administrateurs peuvent sélectionner une entreprise pour n'afficher que les utilisateurs associés (`user.companyId`).
  - Le filtre est responsive, avec une option "-- Toutes les entreprises --" pour afficher tout le monde.
  - Les filtres par rôle et statut restent disponibles et combinables.

- **Optimisation du rendu des utilisateurs**

  - Utilisation de `useMemo` pour optimiser le recalcul des utilisateurs filtrés.
  - Les filtres sont désormais plus performants même avec beaucoup de données.

- **Amélioration UX des menus déroulants (`<Select />`)**

  - Augmentation de la hauteur maximale des dropdowns à `max-h-96` (384px) avec `overflow-y-auto`.
  - Permet d'afficher plus d'options sans scroll immédiat, surtout pour les entreprises.
  - Comportement responsive : la hauteur reste raisonnable sur mobile.
  - Aucun impact sur les autres composants utilisant `<Select />`.

- **Divers**
  - Ajout de commentaires explicites sur tous les effets et blocs importants.
  - Correction de petits bugs d'affichage et d'UX sur la gestion des utilisateurs et entreprises.

---

## Installation locale

Suivez ces étapes pour installer le projet localement :

```bash
# Cloner le dépôt
git clone https://github.com/votre-organisation/smartplanning.git
cd smartplanning

# Installer les dépendances du backend
cd backend
npm install

# Installer les dépendances du frontend
cd ../frontend
npm install
```

## Variables d'environnement

### Backend (.env)

Créez un fichier `.env` dans le dossier `backend` avec les variables suivantes :

```bash
# Base de données
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartplanning

# Authentification JWT
JWT_SECRET=votre_secret_jwt_très_sécurisé_minimum_32_caractères
JWT_EXPIRATION=1d
REFRESH_TOKEN_SECRET=votre_refresh_secret_très_sécurisé
REFRESH_TOKEN_EXPIRATION=7d

# Intelligence artificielle
OPENAI_API_KEY=sk-votre_clé_api_openai

# Authentification Google OAuth
GOOGLE_CLIENT_ID=votre_id_client_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_secret_client_google
GOOGLE_CALLBACK_URL=http://localhost:5050/api/auth/google/callback

# Upload de fichiers (Cloudinary)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Configuration serveur (IMPORTANT: port 5050)
PORT=5050
NODE_ENV=development

# Email (optionnel - pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
```

### Frontend (.env.local)

Créez un fichier `.env.local` dans le dossier `frontend` avec les variables suivantes :

```bash
# URL de l'API backend (IMPORTANT: port 5050)
VITE_API_URL=http://localhost:5050/api

# Google OAuth (même client ID que le backend)
VITE_GOOGLE_CLIENT_ID=votre_id_client_google.apps.googleusercontent.com

# Environnement
VITE_NODE_ENV=development
```

**Note importante** : Le backend utilise le port **5050** (pas 5000) pour éviter les conflits avec d'autres services.

## Lancer l'application

Pour lancer l'application en mode développement :

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Le backend sera accessible à l'adresse [http://localhost:5050](http://localhost:5050) et le frontend à [http://localhost:5173](http://localhost:5173).

## Scripts d'initialisation

Pour initialiser la base de données avec des données de test :

```bash
cd backend
npx ts-node src/scripts/init-db.ts
```

Pour migrer les données de test vers la base de données de production :

```bash
cd backend
npm run migrate
```

Ces scripts créeront :

- Des comptes utilisateurs de test (admin, manager, employé)
- Des données de planning exemple
- Des congés et demandes exemple
- Des structures d'entreprise et d'équipe

## Tests

Pour exécuter les tests :

```bash
# Tests backend (généraux)
cd backend
npm test

# Tests de sécurité spécifiques
npm run test:security

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm test -- --coverage

# Tests frontend
cd frontend
npm test
```

### Tests de Sécurité

Le projet inclut une suite complète de tests de sécurité automatisés :

- **Tests d'authentification** : Validation des login/logout et cookies httpOnly
- **Tests d'autorisation** : Vérification des contrôles d'accès par rôle
- **Tests de protection** : Validation contre XSS, injection NoSQL, CSRF
- **Tests de performance** : Mesure des temps de réponse critiques
- **Tests d'isolation** : Vérification de la séparation des données

**Résultats actuels :** 14/15 tests réussis (93% de réussite)

## Déploiement

L'application SmartPlanning est déployée en production :

### Architecture de déploiement

- **Frontend** : Déployé sur Hostinger à l'adresse [https://smartplanning.fr](https://smartplanning.fr)
- **Backend** : Déployé sur Render à l'adresse [https://smartplanning.onrender.com](https://smartplanning.onrender.com)
- **Base de données** : MongoDB Atlas (cluster cloud)

### Autres options de déploiement

Pour des déploiements alternatifs, consultez le [Guide de déploiement](docs/DEPLOYMENT.md).

**Décembre 2024** - Application en production stable avec architecture ultra clean, SEO optimisé, authentification cross-origin et sécurité renforcée.

## Analyse d'architecture

### Audit complet effectué

**✅ Structure du projet analysée**
- Architecture MERN respectée avec séparation claire backend/frontend
- Organisation modulaire optimale (models, routes, components)
- Nomenclature cohérente selon le contexte métier français

**✅ Redondances identifiées et éliminées**
- Images dupliquées : `frontend/src/assets/images/` → `frontend/public/images/` (12MB économisés)
- Scripts backend consolidés : `backend/scripts/` → `backend/src/scripts/`
- Fichiers debug supprimés : 58KB de fichiers temporaires nettoyés
- Fichiers de build exclus du versioning : `backend/dist/` non-tracké

**✅ Bonnes pratiques vérifiées**
- TypeScript strict mode activé dans les deux projets
- Sécurité : JWT hybride, CORS, tests automatisés (14/15 passent)
- Performance : Bundle splitting, compression gzip/brotli, cache HTTP
- Structure modulaire : Composants UI réutilisables, hooks personnalisés
- SEO : Sitemap.xml, robots.txt, meta tags, Schema.org
- Documentation : CLAUDE.md, README.md, et documentation API complète

**📊 Score global des bonnes pratiques : 7.5/10** ⬆️ (+1.25)
- Structure et organisation : 8/10 ✅
- TypeScript et typage : 7/10 ✅ ⬆️
- Sécurité : 8/10 ✅ ⬆️
- Performance : 9/10 ✅ ⬆️
- Accessibilité : 5/10 ⚠️ ⬆️
- SEO : 9/10 ✅ ⬆️
- Tests : 6/10 ⚠️ ⬆️
- Documentation : 8/10 ✅ ⬆️

**🎯 Améliorations prioritaires restantes**
1. Accessibilité (audit a11y, ARIA labels, navigation clavier)
2. Tests E2E et couverture de code frontend
3. Monitoring et logging professionnel (OpenTelemetry)
4. Validation des données avec Zod/Joi
5. Optimisations mobile (PWA, service workers)

---

## Comptes de test disponibles

Pour tester l'application, vous pouvez utiliser les comptes suivants :

### 👑 Directeur
- **Marie DUBOIS** : `marie.dubois@supermarche-plus.fr` / `Directeur2025@`
  - Accès complet à toutes les fonctionnalités administratives
  - Gestion des entreprises, utilisateurs et équipes

### 👥 Managers
- **Pierre MARTIN** (Rayon Alimentaire) : `pierre.martin@supermarche-plus.fr` / `Manager2025@`
- **Sophie BERNARD** (Rayon Textile) : `sophie.bernard@supermarche-plus.fr` / `Manager2025@`
- **Jean ROUSSEAU** (Caisse et Accueil) : `jean.rousseau@supermarche-plus.fr` / `Manager2025@`
- **Isabelle MOREAU** (Électroménager) : `isabelle.moreau@supermarche-plus.fr` / `Manager2025@`
- **Thomas LAURENT** (Logistique) : `thomas.laurent@supermarche-plus.fr` / `Manager2025@`

### 👤 Employés
- **Maxime ANDRE** : `maxime.andre@supermarche-plus.fr` / `Employee2025@`
- **Antoine GARCIA** (Vendeur rayon frais) : `antoine.garcia@supermarche-plus.fr` / `Employee2025@`
- **Hugo MOREAU** (Vendeur vêtements homme) : `hugo.moreau@supermarche-plus.fr` / `Employee2025@`
- **Quentin MARTIN** (Caissier) : `quentin.martin@supermarche-plus.fr` / `Employee2025@`
- **Adrien FONTAINE** (Vendeur électroménager) : `adrien.fontaine@supermarche-plus.fr` / `Employee2025@`
- **Guillaume BOYER** (Magasinier) : `guillaume.boyer@supermarche-plus.fr` / `Employee2025@`

### 🔐 Administrateur système
Pour créer un compte administrateur, utilisez le script :
```bash
cd backend && npm run create-admin
```

---

**💡 Conseil** : Commencez par vous connecter avec le compte directeur pour avoir une vue d'ensemble de l'application, puis testez les différents rôles pour comprendre les permissions.

**🚀 Déploiement** : L'application est disponible en production sur [https://smartplanning.fr](https://smartplanning.fr) avec les mêmes comptes de test.
