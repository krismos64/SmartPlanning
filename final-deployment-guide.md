# 🚀 Guide Final de Déploiement SmartPlanning

## ✅ État Actuel

- ✅ Backend compilé sans erreur
- ✅ Frontend compilé sans erreur
- ✅ Tous les fichiers de configuration créés
- ✅ Scripts de déploiement prêts

## 🎯 Étapes Finales (15-30 minutes)

### 1. Déploiement Backend sur Render

#### A. Créer le service sur Render

1. Aller sur [render.com](https://render.com)
2. Connecter votre repository GitHub
3. Créer un nouveau "Web Service"
4. Sélectionner le repository SmartPlanning
5. Configurer :
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

#### B. Variables d'environnement Render

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://votre_user:votre_password@cluster.mongodb.net/smartplanning
JWT_SECRET=votre_jwt_secret_32_caracteres_minimum
FRONTEND_URL=https://smartplanning.fr
CLIENT_URL=https://smartplanning.fr
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
GOOGLE_CALLBACK_URL=https://votre-app.onrender.com/api/auth/google/callback
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@smartplanning.fr
SMTP_PASS=votre_mot_de_passe_email
SESSION_SECRET=votre_session_secret
```

### 2. Déploiement Frontend sur Hostinger

#### A. Préparer les fichiers

```bash
cd frontend
npm run build
```

#### B. Upload sur Hostinger

1. Connectez-vous à votre cPanel Hostinger
2. Ouvrir "Gestionnaire de fichiers"
3. Aller dans `public_html/`
4. Supprimer tous les fichiers existants
5. Uploader tout le contenu du dossier `frontend/dist/`
6. S'assurer que le fichier `.htaccess` est présent

### 3. Configuration DNS (si pas déjà fait)

#### A. Hostinger DNS

- A Record: `@` → IP de votre hébergement
- CNAME: `www` → `smartplanning.fr`

#### B. Render Custom Domain (optionnel)

- Ajouter `api.smartplanning.fr` pointant vers votre service Render

### 4. Tests Post-Déploiement

#### A. Backend Health Check

```bash
curl https://votre-app.onrender.com/api/health
# Doit retourner: {"status":"OK","timestamp":"..."}
```

#### B. Frontend

- Visiter https://smartplanning.fr
- Vérifier que l'app se charge
- Tester l'authentification
- Vérifier les appels API

### 5. Configuration Email

#### A. Hostinger Email

1. Créer l'adresse `contact@smartplanning.fr`
2. Noter le mot de passe pour SMTP_PASS
3. Tester l'envoi d'email

### 6. Monitoring et Logs

#### A. Render Logs

- Surveiller les logs de déploiement
- Vérifier qu'il n'y a pas d'erreurs au démarrage

#### B. Tests Fonctionnels

- [ ] Inscription utilisateur
- [ ] Connexion/déconnexion
- [ ] Création d'équipe
- [ ] Planification
- [ ] Notifications email

## 🔧 Commandes Utiles

### Redéploiement rapide

```bash
# Backend (auto via GitHub push)
git add . && git commit -m "update" && git push

# Frontend
cd frontend && npm run build
# Puis upload dist/ sur Hostinger
```

### Debug

```bash
# Logs Render
# Aller dans Dashboard Render > Votre service > Logs

# Test API local
cd backend && npm run dev
# Test frontend local
cd frontend && npm run dev
```

## 🚨 Points d'Attention

1. **CORS**: Vérifier que FRONTEND_URL est correct
2. **MongoDB**: Whitelist l'IP de Render (0.0.0.0/0 pour simplifier)
3. **SSL**: Hostinger gère automatiquement Let's Encrypt
4. **Cache**: Vider le cache navigateur après déploiement

## 📞 Support

En cas de problème :

1. Vérifier les logs Render
2. Tester les endpoints API individuellement
3. Vérifier la configuration DNS
4. Contrôler les variables d'environnement

---

**Temps estimé total**: 15-30 minutes selon la vitesse de déploiement Render.
