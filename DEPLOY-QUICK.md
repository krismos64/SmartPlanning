# 🚀 Déploiement Rapide SmartPlanning

## TL;DR - Commandes essentielles

```bash
# 1. Vérification pré-déploiement
./check-deployment.sh

# 2. Déploiement automatique
./deploy.sh

# 3. Build manuel si nécessaire
cd backend && npm run build
cd ../frontend && npm run build
```

## 🎯 Backend sur Render

### Configuration rapide

1. **Render.com** → New Web Service
2. **Connect GitHub** → Votre repo
3. **Settings** :
   - Name: `smartplanning-backend`
   - Root Directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm start`

### Variables d'environnement (copier/coller)

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartplanning
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
FRONTEND_URL=https://smartplanning.fr
CLIENT_URL=https://smartplanning.fr
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@smartplanning.fr
SMTP_PASS=votre_mot_de_passe_email
```

## 🌐 Frontend sur Hostinger

### Upload rapide

1. **Build** : `cd frontend && npm run build`
2. **FTP/Panel** → `public_html/`
3. **Upload** tout le contenu de `frontend/dist/`
4. **Inclure** le fichier `.htaccess`

### Vérification

- ✅ Site accessible : `https://smartplanning.fr`
- ✅ API fonctionne : Console navigateur sans erreurs
- ✅ Connexion/inscription OK

## 🔧 Dépannage express

### Backend ne démarre pas

```bash
# Vérifier les logs Render
# Vérifier MONGODB_URI
# Vérifier JWT_SECRET (min 32 chars)
```

### Frontend erreur API

```bash
# Vérifier frontend/env.production
# VITE_API_URL=https://votre-backend.onrender.com/api
```

### OAuth Google ne marche pas

```bash
# Google Console → Credentials
# Authorized origins: https://smartplanning.fr
# Authorized redirects: https://votre-backend.onrender.com/api/auth/google/callback
```

## 📱 Test rapide post-déploiement

1. **Backend** : `https://votre-backend.onrender.com/api/health`
2. **Frontend** : `https://smartplanning.fr`
3. **Connexion** : Tester login/register
4. **API** : Vérifier console navigateur

---

**Temps estimé** : 15-30 minutes  
**Prérequis** : Comptes Render + Hostinger + MongoDB Atlas
