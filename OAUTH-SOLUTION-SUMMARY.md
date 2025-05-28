# 🔧 Solution OAuth Google - Redirection localhost

## 🚨 Problème Identifié

Votre authentification Google redirige vers :

```
http://localhost:3000/oauth/callback?token=...
```

Au lieu de :

```
https://smartplanning.fr/oauth/callback?token=...
```

## ✅ Cause et Solution

**Cause :** Variables d'environnement OAuth manquantes sur Render

**Solution :** Configuration des variables sur Render + Google Cloud Console

## 🚀 Actions Immédiates (5 minutes)

### 1. Configuration Render

1. **Aller sur [render.com](https://render.com)**
2. **Sélectionner votre service `smartplanning-backend`**
3. **Onglet "Environment"**
4. **Ajouter ces 3 variables :**

```
GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_google_client_secret
SMTP_PASS=votre_mot_de_passe_email_hostinger
```

### 2. Google Cloud Console

1. **Aller sur [console.cloud.google.com](https://console.cloud.google.com/)**
2. **APIs & Services → Credentials**
3. **Modifier votre OAuth 2.0 Client ID**
4. **Ajouter ces URLs :**

**Authorized JavaScript origins :**

```
https://smartplanning.fr
https://smartplanning-backend.onrender.com
```

**Authorized redirect URIs :**

```
https://smartplanning-backend.onrender.com/api/auth/google/callback
```

### 3. Redéploiement

1. **Sur Render : Manual Deploy → Deploy latest commit**
2. **Attendre 2-3 minutes**

## 🧪 Test de Validation

**Après configuration :**

1. Aller sur `https://smartplanning.fr`
2. Cliquer "Connexion" → "Continuer avec Google"
3. **Vérifier que ça redirige vers `smartplanning.fr` et non `localhost`**

## 📁 Fichiers Créés

- ✅ `render.yaml` - Mis à jour avec variables OAuth
- ✅ `RENDER-OAUTH-FIX.md` - Guide détaillé
- ✅ `check-oauth-config.sh` - Script de vérification

## 🔍 Script de Vérification

```bash
./check-oauth-config.sh
```

Ce script teste automatiquement :

- ✅ Backend accessible
- ✅ Redirection OAuth Google
- ✅ URLs de callback
- ✅ Frontend accessible

## 🎯 Résultat Attendu

**Avant :**

```
http://localhost:3000/oauth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Après :**

```
https://smartplanning.fr/oauth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Checklist

- [ ] Variables ajoutées sur Render
- [ ] Google Cloud Console configuré
- [ ] Redéploiement effectué
- [ ] Test OAuth Google OK
- [ ] Redirection vers smartplanning.fr

---

**⏱️ Temps estimé : 5-10 minutes maximum**

**✅ Une fois terminé, OAuth Google fonctionnera parfaitement !**
