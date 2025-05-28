# 🔧 Fix OAuth Google - Configuration Render

## 🚨 Problème Identifié

L'authentification Google redirige vers `localhost:3000` au lieu de `smartplanning.fr`.

**Cause :** Variables d'environnement OAuth manquantes sur Render.

## ✅ Solution - Configuration Render

### 1. Accéder aux Variables d'Environnement

1. Aller sur [render.com](https://render.com)
2. Sélectionner votre service `smartplanning-backend`
3. Aller dans l'onglet **"Environment"**

### 2. Ajouter les Variables Manquantes

**Variables à ajouter manuellement :**

```
GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_google_client_secret
SMTP_PASS=votre_mot_de_passe_email_hostinger
```

**Variables déjà configurées automatiquement :**

- ✅ `CLIENT_URL=https://smartplanning.fr`
- ✅ `GOOGLE_CALLBACK_URL=https://smartplanning-backend.onrender.com/api/auth/google/callback`
- ✅ `SMTP_HOST=smtp.hostinger.com`
- ✅ `SMTP_PORT=465`
- ✅ `SMTP_USER=contact@smartplanning.fr`

### 3. Configuration Google Cloud Console

**Vérifier les URLs autorisées :**

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionner votre projet SmartPlanning
3. APIs & Services → Credentials
4. Modifier votre OAuth 2.0 Client ID

**Authorized JavaScript origins :**

```
https://smartplanning.fr
https://smartplanning-backend.onrender.com
```

**Authorized redirect URIs :**

```
https://smartplanning-backend.onrender.com/api/auth/google/callback
```

### 4. Redéploiement

Après avoir ajouté les variables :

1. Cliquer sur **"Manual Deploy"** → **"Deploy latest commit"**
2. Attendre la fin du déploiement (2-3 minutes)
3. Tester l'endpoint : `https://smartplanning-backend.onrender.com/api/health`

## 🧪 Tests de Validation

### 1. Test Backend

```bash
curl https://smartplanning-backend.onrender.com/api/health
```

**Réponse attendue :**

```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### 2. Test OAuth Google

1. Aller sur `https://smartplanning.fr`
2. Cliquer sur "Connexion"
3. Cliquer sur "Continuer avec Google"
4. **Vérifier que la redirection se fait vers `smartplanning.fr` et non `localhost`**

### 3. Test Complet

**URL de test OAuth :**

```
https://smartplanning-backend.onrender.com/api/auth/google
```

**Flux attendu :**

1. Redirection vers Google OAuth
2. Authentification Google
3. Redirection vers : `https://smartplanning.fr/oauth/callback?token=...`
4. Connexion automatique sur SmartPlanning

## 📋 Checklist de Validation

- [ ] Variables d'environnement ajoutées sur Render
- [ ] Google Cloud Console configuré avec bonnes URLs
- [ ] Redéploiement effectué
- [ ] Test endpoint `/api/health` OK
- [ ] Test OAuth Google redirige vers `smartplanning.fr`
- [ ] Connexion Google fonctionnelle

## 🔍 Debugging

**Si ça ne fonctionne toujours pas :**

1. **Vérifier les logs Render :**

   - Onglet "Logs" dans votre service
   - Chercher les erreurs OAuth

2. **Vérifier les variables :**

   ```bash
   # Dans les logs Render, vous devriez voir :
   CLIENT_URL: https://smartplanning.fr
   GOOGLE_CALLBACK_URL: https://smartplanning-backend.onrender.com/api/auth/google/callback
   ```

3. **Test direct de l'API :**
   ```bash
   curl -I https://smartplanning-backend.onrender.com/api/auth/google
   # Doit retourner une redirection 302 vers Google
   ```

## 🎯 Résultat Attendu

Après cette correction, l'authentification Google redirigera correctement vers :

```
https://smartplanning.fr/oauth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Au lieu de :

```
http://localhost:3000/oauth/callback?token=...
```

---

**✅ Une fois ces étapes terminées, OAuth Google fonctionnera parfaitement !**
