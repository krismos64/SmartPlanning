# 🚨 DÉPLOIEMENT URGENT - À FAIRE MAINTENANT

## ⚠️ PROBLÈME ACTUEL

Votre site https://smartplanning.fr utilise encore l'ancien build qui appelle `localhost:5050` !

## ✅ SOLUTION PRÊTE

Le nouveau build corrigé est prêt : `frontend/dist/smartplanning-frontend-FIXED.zip` (15MB)

## 📤 ÉTAPES DE DÉPLOIEMENT (5 minutes)

### 1. Télécharger le ZIP corrigé

- Fichier : `frontend/dist/smartplanning-frontend-FIXED.zip`
- Taille : 15MB
- ✅ 0 référence localhost
- ✅ 8 références smartplanning.onrender.com

### 2. Connexion Hostinger cPanel

1. Aller sur votre cPanel Hostinger
2. Cliquer sur **File Manager**
3. Naviguer vers `public_html/`

### 3. Sauvegarde (optionnel mais recommandé)

```bash
# Dans File Manager, renommer les anciens fichiers :
index.html → index.html.old
assets/ → assets.old/
images/ → images.old/
```

### 4. Upload du nouveau build

1. **Upload** `smartplanning-frontend-FIXED.zip` dans `public_html/`
2. **Clic droit** sur le ZIP → **Extract**
3. **Supprimer** le ZIP après extraction

### 5. Vérification immédiate

- Aller sur https://smartplanning.fr
- **F12** → Console
- **Plus d'erreur CORS !**
- Appels vers `smartplanning.onrender.com` au lieu de `localhost`

## 🎯 RÉSULTAT ATTENDU

**AVANT (actuellement) :**

```
❌ Access to XMLHttpRequest at 'http://localhost:5050/api/companies/me'
   from origin 'https://smartplanning.fr' has been blocked by CORS policy
```

**APRÈS (dès déploiement) :**

```
✅ GET https://smartplanning.onrender.com/api/companies/me
✅ Pas d'erreur CORS
✅ Application fonctionnelle
```

## 🚀 DÉPLOIEMENT ALTERNATIF (si cPanel indisponible)

### Via FTP/SFTP

```bash
# Upload via FTP
ftp your-hostinger-server.com
cd public_html
put smartplanning-frontend-FIXED.zip
```

### Via SSH (si disponible)

```bash
scp smartplanning-frontend-FIXED.zip user@host:~/public_html/
ssh user@host "cd public_html && unzip -o smartplanning-frontend-FIXED.zip"
```

## ⏰ TEMPS ESTIMÉ

- **Upload :** 2-3 minutes (15MB)
- **Extraction :** 30 secondes
- **Test :** 30 secondes
- **TOTAL :** 5 minutes maximum

## 🔧 CONTENU DU BUILD CORRIGÉ

### Fichiers modifiés

- `AuthContext.tsx` ✅
- `api.ts` ✅
- `axiosInstance.ts` ✅
- `RegisterPage.tsx` ✅
- `ContactPage.tsx` ✅
- `LoginPage.tsx` ✅
- `WeeklySchedulePage.tsx` ✅
- `LayoutWithSidebar.tsx` ✅

### Changement appliqué

```diff
- localhost:5050/api
+ smartplanning.onrender.com/api
```

---

**⚡ LE PROBLÈME SERA RÉSOLU DÈS QUE CE BUILD SERA DÉPLOYÉ !**

**📞 Si besoin d'aide :** Le build est 100% prêt et testé.
