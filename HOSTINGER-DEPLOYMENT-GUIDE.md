# 🚀 Guide Déploiement Frontend Hostinger - SmartPlanning

## ✅ Problème Images Résolu

### 🔧 Corrections Appliquées

**Problème initial :**

- Images référencées avec `/src/assets/images/...`
- Chemins invalides en production
- Images non chargées sur Hostinger

**Solution appliquée :**

- ✅ Images copiées vers `frontend/public/images/`
- ✅ Références corrigées vers `/images/...`
- ✅ Script de build automatisé créé
- ✅ Test de build réussi (9 images copiées)

## 📋 Étapes de Déploiement

### 1. Préparation du Build

```bash
# Depuis le dossier racine SmartPlanning
cd frontend
./build-production.sh
```

**Vérifications automatiques :**

- ✅ 9 images copiées dans `dist/images/`
- ✅ Build généré (16MB total)
- ✅ `index.html` et assets créés

### 2. Compression pour Upload

```bash
# Créer une archive ZIP du dossier dist
cd dist
zip -r smartplanning-frontend.zip .
```

**Ou via interface graphique :**

- Sélectionner tout le contenu du dossier `dist/`
- Clic droit → Compresser
- Nommer : `smartplanning-frontend.zip`

### 3. Connexion Hostinger cPanel

1. **Se connecter à Hostinger**

   - URL : https://hpanel.hostinger.com
   - Domaine : smartplanning.fr

2. **Accéder au File Manager**
   - Aller dans "Files" → "File Manager"
   - Naviguer vers `public_html/`

### 4. Upload et Extraction

1. **Nettoyer public_html (si nécessaire)**

   ```
   - Supprimer les anciens fichiers
   - Garder uniquement .htaccess si présent
   ```

2. **Upload du ZIP**

   - Cliquer "Upload Files"
   - Sélectionner `smartplanning-frontend.zip`
   - Attendre la fin de l'upload

3. **Extraction**
   - Clic droit sur le fichier ZIP
   - "Extract" → "Extract Here"
   - Supprimer le fichier ZIP après extraction

### 5. Configuration .htaccess

**Vérifier que le fichier `.htaccess` est présent dans `public_html/` :**

```apache
# Gestion des routes SPA React
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirection HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Gestion des assets statiques
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Redirection vers index.html pour les routes SPA
    RewriteRule ^ index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache des images
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Sécurité
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 6. Vérification du Déploiement

**Tests à effectuer :**

1. **Page d'accueil**

   - ✅ https://smartplanning.fr charge correctement
   - ✅ Logo SmartPlanning visible
   - ✅ Images des témoignages chargées

2. **Images spécifiques à tester :**

   - ✅ `/images/logo-smartplanning.webp`
   - ✅ `/images/user-camille.webp`
   - ✅ `/images/user-sofiane.webp`
   - ✅ `/images/user-lisa.webp`
   - ✅ `/images/business-smartplanning.webp`
   - ✅ `/images/bd.webp`
   - ✅ `/images/bd1.webp`
   - ✅ `/images/preview-video.webp`
   - ✅ `/images/comic-smartplanning.webp`

3. **Navigation**

   - ✅ Routes SPA fonctionnelles (/inscription, /contact, etc.)
   - ✅ Pas d'erreurs 404 sur les routes React

4. **Performance**
   - ✅ Images optimisées (format WebP)
   - ✅ Compression GZIP active
   - ✅ Cache navigateur configuré

### 7. Résolution de Problèmes

**Si les images ne se chargent pas :**

1. **Vérifier les permissions**

   ```
   Dossier images/ : 755
   Fichiers .webp : 644
   ```

2. **Vérifier la structure**

   ```
   public_html/
   ├── index.html
   ├── assets/
   ├── images/           ← IMPORTANT
   │   ├── logo-smartplanning.webp
   │   ├── user-camille.webp
   │   └── ...
   └── .htaccess
   ```

3. **Tester les URLs directes**
   - https://smartplanning.fr/images/logo-smartplanning.webp
   - Doit afficher l'image directement

**Si les routes ne fonctionnent pas :**

- Vérifier que `.htaccess` est bien présent
- Vérifier que mod_rewrite est activé sur Hostinger

## 🎯 Checklist Final

- [ ] Build frontend exécuté avec succès
- [ ] 9 images présentes dans dist/images/
- [ ] Archive ZIP créée
- [ ] Upload sur Hostinger terminé
- [ ] Extraction réussie
- [ ] .htaccess configuré
- [ ] https://smartplanning.fr accessible
- [ ] Toutes les images chargent correctement
- [ ] Navigation SPA fonctionnelle

## 📊 Informations Techniques

- **Taille du build :** 16MB
- **Images :** 9 fichiers WebP optimisés
- **Chunks JS :** Optimisés avec code splitting
- **Compression :** GZIP activée
- **Cache :** 1 mois pour les images

---

**✅ Frontend prêt pour la production !**

Une fois le backend Render opérationnel, SmartPlanning sera 100% fonctionnel sur https://smartplanning.fr
