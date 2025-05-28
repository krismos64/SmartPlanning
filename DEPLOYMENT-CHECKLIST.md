# ✅ Checklist de Déploiement SmartPlanning

## 📋 Pré-déploiement

### Vérifications techniques

- [ ] `./check-deployment.sh` passe sans erreur
- [ ] Backend compile : `cd backend && npm run build`
- [ ] Frontend build : `cd frontend && npm run build`
- [ ] Tous les tests passent
- [ ] Variables d'environnement documentées

### Comptes et services

- [ ] Compte Render.com créé
- [ ] Compte Hostinger actif
- [ ] Domaine `smartplanning.fr` configuré
- [ ] MongoDB Atlas cluster créé
- [ ] Google OAuth configuré
- [ ] Email SMTP Hostinger configuré

## 🚀 Déploiement Backend (Render)

### Configuration service

- [ ] Nouveau Web Service créé
- [ ] Repository GitHub connecté
- [ ] Branche `main` sélectionnée
- [ ] Root Directory : `backend`
- [ ] Build Command : `npm install && npm run build`
- [ ] Start Command : `npm start`
- [ ] Auto-Deploy activé

### Variables d'environnement

- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI` (MongoDB Atlas)
- [ ] `JWT_SECRET` (32+ caractères)
- [ ] `FRONTEND_URL=https://smartplanning.fr`
- [ ] `CLIENT_URL=https://smartplanning.fr`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL`
- [ ] `SMTP_HOST=smtp.hostinger.com`
- [ ] `SMTP_PORT=465`
- [ ] `SMTP_USER=contact@smartplanning.fr`
- [ ] `SMTP_PASS`
- [ ] `SESSION_SECRET`

### Tests backend

- [ ] Déploiement réussi (logs verts)
- [ ] Health check : `/api/health` répond 200
- [ ] API accessible : `/api` répond
- [ ] Connexion MongoDB OK
- [ ] Pas d'erreurs dans les logs

## 🌐 Déploiement Frontend (Hostinger)

### Préparation

- [ ] `cd frontend && npm run build`
- [ ] Dossier `dist/` généré
- [ ] Fichier `dist/index.html` présent
- [ ] Fichier `.htaccess` inclus
- [ ] URL API configurée : `VITE_API_URL`

### Upload

- [ ] Connexion FTP/Panel Hostinger
- [ ] Navigation vers `public_html/`
- [ ] Suppression contenu existant
- [ ] Upload complet de `frontend/dist/`
- [ ] Vérification fichiers uploadés

### Tests frontend

- [ ] Site accessible : `https://smartplanning.fr`
- [ ] Page d'accueil charge
- [ ] Pas d'erreurs console
- [ ] Routes fonctionnent (SPA)
- [ ] Ressources statiques chargent

## 🔐 Configuration OAuth Google

### Google Cloud Console

- [ ] Projet créé/sélectionné
- [ ] Google+ API activée
- [ ] Credentials OAuth 2.0 créés
- [ ] Authorized JavaScript origins :
  - [ ] `https://smartplanning.fr`
  - [ ] `https://votre-backend.onrender.com`
- [ ] Authorized redirect URIs :
  - [ ] `https://votre-backend.onrender.com/api/auth/google/callback`

## 📧 Configuration Email

### Hostinger Email

- [ ] Email `contact@smartplanning.fr` créé
- [ ] Mot de passe défini
- [ ] SMTP configuré :
  - [ ] Host : `smtp.hostinger.com`
  - [ ] Port : `465`
  - [ ] Security : `SSL`

## 🗄️ Configuration MongoDB Atlas

### Cluster

- [ ] Cluster créé (région proche)
- [ ] Utilisateur créé avec droits R/W
- [ ] IP autorisées : `0.0.0.0/0`
- [ ] Connection string récupérée
- [ ] Test de connexion OK

## ✅ Tests post-déploiement

### Tests fonctionnels

- [ ] **Accueil** : `https://smartplanning.fr` charge
- [ ] **API Health** : `https://backend.onrender.com/api/health`
- [ ] **Inscription** : Nouveau compte fonctionne
- [ ] **Connexion** : Login avec email/password
- [ ] **OAuth Google** : Connexion Google fonctionne
- [ ] **Dashboard** : Interface principale accessible
- [ ] **Plannings** : Création/visualisation
- [ ] **Employés** : Gestion équipes
- [ ] **Notifications** : Emails envoyés

### Tests techniques

- [ ] **Performance** : Temps de chargement < 3s
- [ ] **Mobile** : Interface responsive
- [ ] **HTTPS** : Certificats SSL actifs
- [ ] **CORS** : Pas d'erreurs cross-origin
- [ ] **Logs** : Pas d'erreurs serveur
- [ ] **Monitoring** : Métriques Render OK

## 🚨 Rollback plan

### En cas de problème

- [ ] Logs Render consultés
- [ ] Variables d'environnement vérifiées
- [ ] Version précédente identifiée
- [ ] Procédure de rollback documentée

## 📊 Monitoring post-déploiement

### Première semaine

- [ ] Logs quotidiens vérifiés
- [ ] Performance monitorée
- [ ] Feedback utilisateurs collecté
- [ ] Métriques d'usage analysées

---

**Date de déploiement** : ****\_\_\_****  
**Déployé par** : ****\_\_\_****  
**Version** : 1.0.0  
**Status** : ⏳ En cours / ✅ Terminé / ❌ Échec
