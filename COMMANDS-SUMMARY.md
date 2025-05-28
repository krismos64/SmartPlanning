# 📋 Résumé des Commandes - SmartPlanning

## 🚀 Commandes de Déploiement

### Vérification finale

```bash
./pre-deployment-final-check.sh
```

### Génération des secrets

```bash
./generate-secrets.sh
```

### Déploiement complet

```bash
./deploy.sh all
```

### Déploiement backend uniquement

```bash
./deploy.sh backend
```

### Déploiement frontend uniquement

```bash
./deploy.sh frontend
```

---

## 🔧 Commandes de Build

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

---

## 🧪 Commandes de Test

### Test backend local

```bash
cd backend
npm run dev
```

### Test frontend local

```bash
cd frontend
npm run dev
```

### Vérification pré-déploiement

```bash
./check-deployment.sh
```

---

## 📦 Variables d'Environnement Render

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://[USER]:[PASS]@[CLUSTER].mongodb.net/smartplanning
JWT_SECRET=[Généré par ./generate-secrets.sh]
SESSION_SECRET=[Généré par ./generate-secrets.sh]
FRONTEND_URL=https://smartplanning.fr
CLIENT_URL=https://smartplanning.fr
GOOGLE_CLIENT_ID=[Votre Google Client ID]
GOOGLE_CLIENT_SECRET=[Votre Google Client Secret]
GOOGLE_CALLBACK_URL=https://[VOTRE-APP].onrender.com/api/auth/google/callback
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@smartplanning.fr
SMTP_PASS=[Mot de passe email Hostinger]
```

---

## 🌐 URLs de Test

### Backend Health Check

```bash
curl https://[VOTRE-APP].onrender.com/api/health
```

### Frontend

```
https://smartplanning.fr
```

---

## 📁 Structure des Fichiers Créés

```
SmartPlanning/
├── backend/
│   ├── package.json ✅
│   ├── tsconfig.json ✅
│   ├── env.example ✅
│   ├── Dockerfile ✅
│   └── src/app.ts ✅ (health endpoint)
├── frontend/
│   ├── vite.config.ts ✅
│   ├── .htaccess ✅
│   └── env.production ✅
├── render.yaml ✅
├── deploy.sh ✅
├── check-deployment.sh ✅
├── generate-secrets.sh ✅
├── docker-compose.yml ✅
├── DEPLOYMENT.md ✅
├── DEPLOY-QUICK.md ✅
├── DEPLOYMENT-CHECKLIST.md ✅
├── final-deployment-guide.md ✅
├── READY-TO-DEPLOY.md ✅
└── COMMANDS-SUMMARY.md ✅ (ce fichier)
```

---

## ⚡ Déploiement Express (5 minutes)

1. **Générer les secrets** :

   ```bash
   ./generate-secrets.sh
   ```

2. **Vérification finale** :

   ```bash
   ./pre-deployment-final-check.sh
   ```

3. **Render** : Créer service + variables env

4. **Hostinger** : Upload `frontend/dist/` vers `public_html/`

5. **Test** : Vérifier les URLs

---

_Tous les fichiers sont prêts - Déploiement en 15-25 minutes maximum !_
