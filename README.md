# SmartPlanning

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)
![État](https://img.shields.io/badge/État-En%20développement-orange?style=flat-square)

SmartPlanning est une application SaaS de gestion intelligente des plannings avec IA intégrée, construite avec la stack MERN + TypeScript.

## Table des matières

- [Introduction](#introduction)
- [Fonctionnalités clés](#fonctionnalités-clés)
- [État d'avancement](#état-davancement)
- [Stack technique](#stack-technique)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer l'application](#lancer-lapplication)
- [Scripts d'initialisation](#scripts-dinitialisation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Auteurs & Crédits](#auteurs--crédits)
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
- Authentification JWT avec options email/password et Google OAuth
- Contrôle d'accès basé sur les rôles (RBAC)
- Documentation API complète

## État d'avancement

### Version actuelle : 1.1.0

**Fonctionnalités implémentées :**

✅ **Architecture de base**

- Structure complète du projet (frontend/backend)
- Configuration TypeScript
- Configuration de MongoDB avec Mongoose
- Système de routes API Express

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

- Système JWT pour l'authentification
- Support pour Google OAuth
- Contrôle d'accès basé sur les rôles (RBAC)
- Protection des routes API
- Validation des formulaires côté client et serveur

✅ **Expérience utilisateur avancée**

- Mode clair/sombre basé sur les préférences système
- Interfaces responsives pour desktop et mobile
- Système de notifications et toasts
- Modals et confirmations pour les actions importantes
- Composants UI optimisés et réutilisables

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

- Finalisation des modules d'administration (gestion des utilisateurs, entreprises, équipes)
- Correction des problèmes TypeScript dans les composants UI
- Amélioration du système de filtrage et de recherche dans les interfaces administratives
- Optimisation de performance avec useMemo pour les listes filtrées
- Mise en place d'un système de gestion des erreurs unifié
- Amélioration de l'accessibilité des composants UI

## Stack technique

| Catégorie                     | Technologies                                                      |
| ----------------------------- | ----------------------------------------------------------------- |
| **Frontend**                  | React.js, TypeScript, TailwindCSS, Framer Motion, React Router    |
| **Backend**                   | Node.js, Express.js, TypeScript, JWT                              |
| **Base de données**           | MongoDB Atlas, Mongoose                                           |
| **Intelligence artificielle** | OpenAI API                                                        |
| **Authentification**          | JWT, Google OAuth, Passport.js                                    |
| **Upload de fichiers**        | Cloudinary, Multer                                                |
| **Déploiement**               | Docker, Vercel/Netlify (Frontend), Heroku/Digital Ocean (Backend) |
| **Outils de développement**   | ESLint, Prettier, Jest, React Testing Library                     |

## Changelog

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

```
# Base de données
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartplanning

# Authentification
JWT_SECRET=votre_secret_jwt_très_sécurisé
JWT_EXPIRATION=1d
REFRESH_TOKEN_SECRET=votre_refresh_secret_très_sécurisé
REFRESH_TOKEN_EXPIRATION=7d

# API OpenAI
OPENAI_API_KEY=votre_clé_api_openai

# Authentification Google OAuth
GOOGLE_CLIENT_ID=votre_id_client_google
GOOGLE_CLIENT_SECRET=votre_secret_client_google
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Configuration serveur
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)

Créez un fichier `.env.local` dans le dossier `frontend` avec les variables suivantes :

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=votre_id_client_google
```

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
# Tests backend
cd backend
npm test

# Tests frontend
cd frontend
npm test
```

## Déploiement

L'application peut être déployée sur différentes plateformes :

### Backend

- Heroku
- Digital Ocean
- AWS

### Frontend

- Vercel
- Netlify
- AWS Amplify

Une démo de l'application est disponible sur [https://smartplanning.fr](https://smartplanning.fr).

Développé dans le cadre d'un projet de gestion innovante des ressources humaines.

---
