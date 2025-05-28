# 🚀 Guide de Déploiement SmartPlanning

## Vue d'ensemble

Ce guide détaille le déploiement complet de SmartPlanning :

- **Backend** : Render (Node.js + MongoDB)
- **Frontend** : Hostinger (domaine smartplanning.fr)

## 📋 Prérequis

- [ ] Compte Render.com
- [ ] Compte Hostinger avec domaine smartplanning.fr
- [ ] MongoDB Atlas configuré
- [ ] Google OAuth configuré
- [ ] SMTP Hostinger configuré

## 🛠️ Déploiement Backend (Render)

### 1. Préparation

```bash
# Cloner le repo et aller dans le backend
cd backend

# Installer les dépendances
npm install

# Compiler TypeScript
npm run build
```

### 2. Configuration Render

1. **Créer un nouveau Web Service sur Render**
2. **Connecter votre repository GitHub**
3. **Configuration du service :**
   - **Name** : `smartplanning-backend`
   - **Environment** : `Node`
   - **Region** : `Frankfurt`
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`

### 3. Variables d'environnement Render

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartplanning
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
FRONTEND_URL=https://smartplanning.fr
CLIENT_URL=https://smartplanning.fr
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url.onrender.com/api/auth/google/callback
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@smartplanning.fr
SMTP_PASS=your_email_password
SESSION_SECRET=your_session_secret_key
```

### 4. Déploiement automatique

Le fichier `render.yaml` est configuré pour le déploiement automatique.

## 🌐 Déploiement Frontend (Hostinger)

### 1. Build de production

```bash
cd frontend

# Installer les dépendances
npm install

# Build pour production
npm run build
```

### 2. Configuration de l'API

Créer `frontend/.env.production` :

```env
VITE_API_URL=https://smartplanning-backend.onrender.com/api
```

### 3. Upload sur Hostinger

**Option A : Via FileZilla (FTP)**

1. Connectez-vous avec vos identifiants FTP Hostinger
2. Naviguez vers `/public_html/`
3. Supprimez le contenu existant
4. Uploadez tout le contenu de `frontend/dist/`

**Option B : Via le gestionnaire de fichiers Hostinger**

1. Connectez-vous au panel Hostinger
2. Accédez au gestionnaire de fichiers
3. Naviguez vers `public_html`
4. Supprimez le contenu existant
5. Uploadez le contenu de `frontend/dist/`

## 🔧 Script de déploiement automatisé

```bash
# Déployer tout
./deploy.sh

# Déployer seulement le backend
./deploy.sh backend

# Déployer seulement le frontend
./deploy.sh frontend
```

## 🔐 Configuration OAuth Google

1. **Google Cloud Console** : https://console.cloud.google.com/
2. **Créer un projet** ou sélectionner un existant
3. **Activer Google+ API**
4. **Créer des identifiants OAuth 2.0**
5. **URLs autorisées** :
   - Origins : `https://smartplanning.fr`, `https://your-backend.onrender.com`
   - Redirects : `https://your-backend.onrender.com/api/auth/google/callback`

## 📧 Configuration Email (Hostinger)

1. **Créer l'email** : `contact@smartplanning.fr`
2. **Configurer SMTP** :
   - Host : `smtp.hostinger.com`
   - Port : `465`
   - Security : `SSL`

## 🗄️ Configuration MongoDB Atlas

1. **Créer un cluster** sur MongoDB Atlas
2. **Configurer les IP autorisées** : `0.0.0.0/0` (ou spécifique à Render)
3. **Créer un utilisateur** avec droits lecture/écriture
4. **Récupérer la connection string**

## ✅ Tests post-déploiement

### Backend

- [ ] Health check : `https://your-backend.onrender.com/api/health`
- [ ] API accessible : `https://your-backend.onrender.com/api`
- [ ] Connexion MongoDB OK
- [ ] OAuth Google fonctionnel

### Frontend

- [ ] Site accessible : `https://smartplanning.fr`
- [ ] Connexion/inscription
- [ ] Appels API fonctionnels
- [ ] Interface responsive

## 🚨 Dépannage

### Erreurs courantes

**Backend ne démarre pas**

- Vérifier les variables d'environnement
- Consulter les logs Render
- Vérifier la connection MongoDB

**Frontend ne charge pas**

- Vérifier l'URL API dans `.env.production`
- Vérifier les CORS sur le backend
- Consulter la console navigateur

**OAuth ne fonctionne pas**

- Vérifier les URLs de redirection Google
- Vérifier les variables `GOOGLE_CLIENT_*`
- Vérifier les domaines autorisés

## 📊 Monitoring

### Render

- Logs en temps réel
- Métriques de performance
- Alertes automatiques

### Hostinger

- Statistiques de trafic
- Monitoring uptime
- Logs d'accès

## 🔄 Mise à jour

### Backend

1. Push sur la branche `main`
2. Render redéploie automatiquement
3. Vérifier les logs

### Frontend

1. `npm run build` en local
2. Upload du nouveau `dist/`
3. Vider le cache navigateur

## 📞 Support

- **Render** : https://render.com/docs
- **Hostinger** : Panel d'administration
- **MongoDB Atlas** : https://docs.atlas.mongodb.com/

---

**Dernière mise à jour** : $(date)
**Version** : 1.0.0
