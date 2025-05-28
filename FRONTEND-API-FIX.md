# 🔧 Fix Frontend API URL - Problème CORS localhost

## 🚨 Problème Identifié

Votre frontend en production (`https://smartplanning.fr`) essaie d'appeler l'API locale :

```
http://localhost:5050/api/upload/public
```

Au lieu de l'API de production :

```
https://smartplanning-backend.onrender.com/api/upload/public
```

## ✅ Cause et Solution

**Cause :** Le fichier `.env.production` n'était pas correctement nommé (était `env.production`)

**Solution :** Configuration correcte des variables d'environnement Vite

## 🚀 Corrections Appliquées

### 1. Fichier d'Environnement Corrigé

✅ **Avant :** `frontend/env.production` (incorrect)
✅ **Après :** `frontend/.env.production` (correct)

**Contenu :**

```
VITE_API_URL=https://smartplanning-backend.onrender.com/api
VITE_APP_NAME=SmartPlanning
VITE_APP_VERSION=1.0.0
```

### 2. Script de Build Amélioré

Le script `build-production.sh` a été amélioré pour :

- ✅ Vérifier les variables d'environnement
- ✅ Tester l'accessibilité de l'API
- ✅ Détecter l'URL utilisée dans le build final
- ✅ Créer automatiquement `.env.production` si manquant

## 🔧 Étapes de Correction

### 1. Rebuild du Frontend

```bash
cd frontend
./build-production.sh
```

**Le script va maintenant :**

1. Vérifier que `.env.production` existe
2. Tester l'API de production
3. Construire avec la bonne URL
4. Vérifier que l'URL de production est dans le build

### 2. Vérification de l'URL Backend

**Problème détecté :** L'API Render retourne 404

```bash
curl -I https://smartplanning-backend.onrender.com/api/health
# HTTP/2 404
```

**Solutions possibles :**

1. **Vérifier l'URL exacte de votre service Render**

   - Aller sur render.com
   - Vérifier l'URL de votre service
   - Peut être différente de `smartplanning-backend.onrender.com`

2. **Vérifier que le service est déployé**

   - Le service doit être en état "Live"
   - Pas d'erreurs dans les logs

3. **URLs possibles :**
   ```
   https://smartplanning-backend-XXXX.onrender.com/api/health
   https://votre-nom-service.onrender.com/api/health
   ```

### 3. Mise à Jour de l'URL (si nécessaire)

Si l'URL Render est différente, modifier `.env.production` :

```bash
# Remplacer par la vraie URL de votre service Render
echo "VITE_API_URL=https://VOTRE-VRAIE-URL.onrender.com/api" > .env.production
echo "VITE_APP_NAME=SmartPlanning" >> .env.production
echo "VITE_APP_VERSION=1.0.0" >> .env.production
```

### 4. Redéploiement

```bash
# 1. Rebuild avec la bonne URL
./build-production.sh

# 2. Upload sur Hostinger
# - Compresser dist/
# - Upload via cPanel
# - Extraire dans public_html/
```

## 🧪 Tests de Validation

### 1. Test API Backend

```bash
# Remplacer par votre vraie URL Render
curl https://VOTRE-URL.onrender.com/api/health
```

**Réponse attendue :**

```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### 2. Test Frontend

1. Aller sur `https://smartplanning.fr`
2. Ouvrir les DevTools (F12)
3. Onglet Network
4. Essayer une action (inscription, upload)
5. **Vérifier que les requêtes vont vers votre URL Render et non localhost**

### 3. Test Upload d'Image

1. Aller sur inscription
2. Essayer d'uploader une photo de profil
3. **Doit appeler :** `https://VOTRE-URL.onrender.com/api/upload/public`
4. **Ne doit PAS appeler :** `http://localhost:5050/api/upload/public`

## 🔍 Debugging

### Vérifier l'URL dans le Build

```bash
cd frontend/dist/assets
grep -r "localhost:5050" *.js
# Ne doit rien retourner

grep -r "onrender.com" *.js
# Doit trouver votre URL Render
```

### Vérifier les Variables Vite

Dans le code, l'URL est récupérée via :

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
```

En production, `import.meta.env.VITE_API_URL` doit contenir votre URL Render.

## 📋 Checklist

- [ ] Fichier `.env.production` correctement nommé
- [ ] URL Render correcte dans `.env.production`
- [ ] Service Render accessible (200 OK sur /api/health)
- [ ] Build frontend avec script amélioré
- [ ] Vérification que localhost n'est pas dans le build
- [ ] Upload sur Hostinger
- [ ] Test frontend : requêtes vers Render

## 🎯 Résultat Attendu

**Avant :**

```
❌ http://localhost:5050/api/upload/public
❌ CORS Error
```

**Après :**

```
✅ https://VOTRE-URL.onrender.com/api/upload/public
✅ Upload fonctionnel
```

---

**⚠️ Important :** Trouvez d'abord la vraie URL de votre service Render avant de rebuild le frontend.
