# 🚨 DÉPLOIEMENT URGENT - Correction CORS

## ✅ Problème Résolu

**Toutes les références `localhost:5050` ont été supprimées du code source !**

- ✅ 8 fichiers corrigés
- ✅ Build propre généré (0 référence localhost)
- ✅ 8 références à `smartplanning.onrender.com` dans le build
- ✅ ZIP prêt : `smartplanning-frontend-FIXED.zip` (15MB)

## 📤 Déploiement Immédiat

### 1. Upload sur Hostinger (2 minutes)

1. **Connexion cPanel Hostinger**

   - Aller sur votre cPanel Hostinger
   - File Manager → `public_html/`

2. **Sauvegarde (optionnel)**

   ```bash
   # Renommer l'ancien contenu
   mv index.html index.html.old
   mv assets assets.old
   mv images images.old
   ```

3. **Upload du nouveau build**
   - Upload `smartplanning-frontend-FIXED.zip`
   - Clic droit → Extract
   - Supprimer le ZIP après extraction

### 2. Test Immédiat

**URL à tester :** https://smartplanning.fr

**Vérifications :**

- ✅ Plus d'erreur CORS dans la console
- ✅ Appels API vers `smartplanning.onrender.com`
- ✅ Upload d'images fonctionnel
- ✅ OAuth Google fonctionnel

## 🔧 Corrections Appliquées

### Fichiers Modifiés

```
frontend/src/context/AuthContext.tsx
frontend/src/services/api.ts
frontend/src/api/axiosInstance.ts
frontend/src/pages/RegisterPage.tsx
frontend/src/pages/ContactPage.tsx
frontend/src/pages/LoginPage.tsx
frontend/src/pages/WeeklySchedulePage.tsx
frontend/src/components/layout/LayoutWithSidebar.tsx
```

### Changement

```diff
- const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
+ const API_URL = import.meta.env.VITE_API_URL || "https://smartplanning.onrender.com/api";
```

## 🎯 Résultat Attendu

**Avant :**

```
❌ Access to XMLHttpRequest at 'http://localhost:5050/api/companies/me'
   from origin 'https://smartplanning.fr' has been blocked by CORS policy
```

**Après :**

```
✅ Appels API vers https://smartplanning.onrender.com/api/companies/me
✅ Pas d'erreur CORS
✅ Application fonctionnelle
```

## 🚀 Déploiement en 30 secondes

```bash
# Si vous avez accès SSH à Hostinger
scp smartplanning-frontend-FIXED.zip user@host:~/public_html/
ssh user@host "cd public_html && unzip -o smartplanning-frontend-FIXED.zip"
```

---

**⚡ Le problème CORS sera résolu dès que ce build sera déployé !**
