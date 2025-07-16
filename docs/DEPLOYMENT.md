# 🚀 Guide de déploiement - SmartPlanning

## Vue d'ensemble

SmartPlanning utilise une architecture séparée déployée en production depuis juillet 2025 :

- **Backend** : Déployé sur Render ([https://smartplanning.onrender.com](https://smartplanning.onrender.com))
- **Frontend** : Déployé sur Hostinger ([https://smartplanning.fr](https://smartplanning.fr))
- **Base de données** : MongoDB Atlas (cluster cloud sécurisé)

## Prérequis

- Node.js >= 18.0.0
- MongoDB Atlas
- Comptes Render et Hostinger
- Variables d'environnement configurées

## Variables d'environnement

### Backend (.env)

```env
# Base de données
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartplanning

# Authentification
JWT_SECRET=votre_secret_jwt_très_sécurisé
JWT_EXPIRATION=1d
REFRESH_TOKEN_SECRET=votre_refresh_secret_très_sécurisé

# API OpenAI
OPENAI_API_KEY=votre_clé_api_openai

# Google OAuth
GOOGLE_CLIENT_ID=votre_id_client_google
GOOGLE_CLIENT_SECRET=votre_secret_client_google
GOOGLE_CALLBACK_URL=https://smartplanning.onrender.com/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Configuration serveur
PORT=5050
NODE_ENV=production
```

### Frontend (.env.local)

```env
VITE_API_URL=https://smartplanning.onrender.com/api
VITE_GOOGLE_CLIENT_ID=votre_id_client_google
```

## Déploiement automatique

### Utilisation du script

```bash
# Déploiement complet
./deploy.sh all

# Déploiement backend uniquement
./deploy.sh backend

# Déploiement frontend uniquement
./deploy.sh frontend
```

### Vérification pré-déploiement

```bash
./check-deployment.sh
```

## Déploiement manuel

### Backend sur Render

1. **Connexion au service**

   ```bash
   git push origin main
   ```

2. **Configuration Render**

   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Node.js
   - Auto-Deploy: Yes

3. **Variables d'environnement**
   - Configurer toutes les variables listées ci-dessus

4. **Optimisations performance intégrées**
   - **Compression gzip/brotli** : Niveau 6, seuil 1KB, -70% données transférées
   - **Cache HTTP intelligent** :
     - Assets statiques : 1 an (immutable)
     - API publiques (health, sitemap) : 1 heure
     - API privées : no-cache (sécurité)
   - **Rate limiting** : 100 requêtes/15min par IP avec exemptions tests/health
   - **Headers de sécurité** : Helmet avec CORS strict pour smartplanning.fr

### Frontend sur Hostinger

1. **Build de production optimisé**

   ```bash
   cd frontend
   npm run build
   # Build avec code-splitting : 1.9MB → 389KB (-80%)
   # 70+ chunks avec lazy loading automatique
   ```

2. **Upload des fichiers**
   - Uploader le contenu du dossier `dist/` vers le dossier public_html
   - Configurer les redirections pour SPA

## Health Check

Le backend expose un endpoint de santé :

```
GET /api/health
```

## Configuration CORS

En production, CORS est configuré pour :

- Origin: `https://smartplanning.fr`
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH

## Base de données

### Scripts d'initialisation

```bash
# Création d'un utilisateur admin
cd backend && npm run create-admin

# Migration des données
cd backend && npm run migrate
```

### Sauvegarde

```bash
# Export MongoDB
mongodump --uri="votre_mongodb_uri" --out=backup/

# Import MongoDB
mongorestore --uri="votre_mongodb_uri" backup/
```

## Monitoring

### Logs

- Backend : Utilise Morgan pour les logs HTTP
- Health check automatique toutes les 15 minutes

### Métriques

- Uptime : Surveillé via le health check
- Performance : Monitoring Render intégré

## Résolution de problèmes

### Erreurs communes

1. **CORS Error**

   - Vérifier la configuration des origins autorisées
   - S'assurer que FRONTEND_URL correspond au domaine de production

2. **MongoDB Connection**

   - Vérifier MONGODB_URI
   - Contrôler les IP autorisées dans MongoDB Atlas

3. **Build Frontend**
   - Vérifier les variables d'environnement VITE\_\*
   - S'assurer que l'API URL est correcte

### Debug

```bash
# Logs backend Render
render logs -s votre-service-id

# Test de connectivité API
curl https://smartplanning.onrender.com/api/health
```

## Rollback

En cas de problème :

1. **Revert Git**

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Redéploiement manuel**
   - Utiliser l'interface Render pour redéployer une version antérieure
   - Restaurer le frontend depuis une sauvegarde

## Sécurité

### Mesures de sécurité en production

- **HTTPS** : Toutes les connexions chiffrées
- **JWT** : Cookies httpOnly sécurisés avec SameSite=none pour cross-origin
- **CORS** : Configuration stricte pour smartplanning.fr uniquement
- **Validation** : Contrôle strict des entrées utilisateur
- **Rate limiting** : Protection contre les attaques par déni de service
- **Headers** : Sécurité renforcée avec Helmet.js
- **Authentification** : Support OAuth Google + authentification locale
- **Base de données** : Connexions chiffrées vers MongoDB Atlas

### Tests de sécurité

Le projet inclut une suite de tests de sécurité automatisés :

```bash
# Exécuter les tests de sécurité
npm run test:security
```

**Résultats actuels :** 14/15 tests réussis (93% de couverture sécuritaire)
