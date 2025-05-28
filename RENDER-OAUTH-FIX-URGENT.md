# 🚨 FIX URGENT - OAuth Google Render

## ⚠️ PROBLÈME IDENTIFIÉ

**Erreur 400 : redirect_uri_mismatch**

L'authentification Google redirige vers `localhost:3000` au lieu de `smartplanning.fr`.

**Cause :** Variable `CLIENT_URL` manquante sur Render.

## ✅ SOLUTION IMMÉDIATE (2 minutes)

### 1. Ajouter la Variable sur Render

1. **Aller sur [render.com](https://render.com)**
2. **Sélectionner votre service `smartplanning-backend`**
3. **Onglet "Environment"**
4. **Cliquer "Add Environment Variable"**
5. **Ajouter :**

```
Key: CLIENT_URL
Value: https://smartplanning.fr
```

### 2. Redéployer

1. **Cliquer "Manual Deploy"**
2. **"Deploy latest commit"**
3. **Attendre 2-3 minutes**

### 3. Tester

1. Aller sur `https://smartplanning.fr`
2. Cliquer "Connexion" → "Continuer avec Google"
3. **Vérifier redirection vers `smartplanning.fr/oauth/callback`**

## 🔍 VÉRIFICATION

**Avant (incorrect) :**

```
http://localhost:3000/oauth/callback?token=...
```

**Après (correct) :**

```
https://smartplanning.fr/oauth/callback?token=...
```

## 📋 Variables Render Complètes

**Variables déjà configurées :**

- ✅ `FRONTEND_URL=https://smartplanning.fr`
- ✅ `GOOGLE_CALLBACK_URL=https://smartplanning-backend.onrender.com/api/auth/google/callback`

**Variable à ajouter :**

- ❌ `CLIENT_URL=https://smartplanning.fr` ← **MANQUANTE**

**Variables optionnelles (si pas encore ajoutées) :**

- `GOOGLE_CLIENT_ID=votre_client_id`
- `GOOGLE_CLIENT_SECRET=votre_client_secret`
- `SMTP_PASS=votre_mot_de_passe_email`

## 🎯 RÉSULTAT ATTENDU

Après cette correction, OAuth Google fonctionnera parfaitement et redirigera vers votre domaine de production.

---

**⏱️ Temps de correction : 2 minutes maximum**
