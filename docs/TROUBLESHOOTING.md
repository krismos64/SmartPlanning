# 🛠️ Guide de Résolution de Problèmes - SmartPlanning v2.2.1

## Diagnostic et Solutions

Ce guide vous aide à résoudre les problèmes courants rencontrés avec SmartPlanning et son AdvancedSchedulingEngine révolutionnaire.

**Version** : 2.2.1 (14 Août 2025) - Production Déployée  
**Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance

---

## 🚨 Problèmes Critiques

### ❌ Application inaccessible

**Symptômes** : Page blanche ou erreur de connexion

**Solutions** :
1. **Vérifier URLs production** :
   - ✅ Frontend : https://smartplanning.fr
   - ✅ API : https://smartplanning.onrender.com/api/health

2. **Diagnostic connexion** :
   ```bash
   # Test API backend
   curl https://smartplanning.onrender.com/api/health
   
   # Réponse attendue : {"status": "OK", "version": "2.2.1"}
   ```

3. **Vérifier status services** :
   - **Render** : Dashboard services backend
   - **Hostinger** : Panel hébergement frontend
   - **MongoDB Atlas** : Cluster database status

**Escalade** : Si problème persiste > 5 minutes, contacter [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

---

## 🎨 Problèmes Planning Wizard

### 🚫 Génération planning échoue

**Symptômes** : Erreur lors de l'étape 7 ou pas de résultat

**Diagnostics AdvancedSchedulingEngine** :
1. **Contraintes incohérentes** :
   - Heures contractuelles <= 0
   - Semaine invalide (< 1 ou > 53)
   - Aucun employé sélectionné

2. **Exceptions problématiques** :
   - Dates hors année planifiée
   - Format date incorrect (utiliser YYYY-MM-DD)
   - Conflits multiples exceptions

**Solutions** :
```javascript
// Validation données avant envoi
const validatePlanningData = (data) => {
  // Vérifier semaine
  if (data.weekNumber < 1 || data.weekNumber > 53) {
    return "Numéro semaine invalide (1-53)";
  }
  
  // Vérifier employés
  if (!data.employees || data.employees.length === 0) {
    return "Sélectionner au moins 1 employé";
  }
  
  // Vérifier heures contractuelles
  const invalidHours = data.employees.filter(emp => 
    !emp.contractHoursPerWeek || emp.contractHoursPerWeek <= 0
  );
  if (invalidHours.length > 0) {
    return "Heures contractuelles invalides détectées";
  }
  
  return null; // Validation OK
};
```

### 🎭 Animations lentes ou saccadées

**Symptômes** : Interface qui rame, particules lentes

**Solutions performance** :
1. **Optimiser navigateur** :
   - Fermer onglets inutiles (< 10 recommandé)
   - Vider cache : Ctrl+Shift+Del / Cmd+Shift+Del
   - Désactiver extensions bloqueurs publicité

2. **Hardware insuffisant** :
   - **RAM minimum** : 4GB recommandé
   - **GPU** : Accélération matérielle activée
   - **CPU** : 64-bit requis

3. **Désactivation animations** (mode dégradé) :
   ```javascript
   // Dans localStorage navigateur
   localStorage.setItem('smartplanning_animations', 'disabled');
   ```

### 📱 Interface mobile problématique

**Symptômes** : Affichage déformé sur mobile/tablette

**Solutions responsive** :
1. **Zoom navigateur** : Réinitialiser à 100%
2. **Orientation** : Portrait recommandé pour wizard
3. **Navigateur** : Chrome/Safari recommandés
4. **Version OS** : iOS 14+ / Android 10+ requis

---

## 🔐 Problèmes Authentification

### 🚪 Connexion impossible

**Symptômes** : Erreur login ou redirection infinie

**Solutions** :
1. **Vérifier identifiants** :
   - Email correct et confirmé
   - Mot de passe respectant règles sécurité
   - Compte non suspendu

2. **Problème cookies** :
   ```javascript
   // Vider cookies SmartPlanning
   document.cookie = "smartplanning_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
   
   // Rafraîchir page
   window.location.reload();
   ```

3. **Paramètres navigateur** :
   - Cookies activés (obligatoire)
   - JavaScript activé
   - Stockage local disponible

### 🔄 Déconnexion automatique

**Symptômes** : Session expirée trop rapidement

**Diagnostics** :
- **Token JWT expiré** : Normal après 24h
- **Inactivité** : Déconnexion auto après 2h inactivité
- **Problème réseau** : Perte connexion temporaire

**Solutions** :
```bash
# Vérifier token validity
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://smartplanning.onrender.com/api/auth/verify

# Refresh token si disponible
curl -X POST https://smartplanning.onrender.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## ⚡ Problèmes Performance

### 🐌 AdvancedSchedulingEngine lent (>10ms)

**Symptômes** : Génération planning > 10ms (anormal)

**Diagnostics avancés** :
1. **Taille équipe excessive** :
   - **Limite testée** : 200 employés max
   - **Performance garantie** : <10ms jusqu'à 100 employés

2. **Contraintes complexes** :
   - Exceptions multiples par employé (>5)
   - Règles entreprise très restrictives
   - Préférences contradictoires multiples

**Solutions optimisation** :
```javascript
// Optimiser payload API
const optimizePayload = (data) => {
  // Supprimer propriétés inutiles
  const cleaned = {
    weekNumber: data.weekNumber,
    year: data.year,
    employees: data.employees.map(emp => ({
      _id: emp._id,
      contractHoursPerWeek: emp.contractHoursPerWeek,
      // Inclure seulement exceptions nécessaires
      exceptions: emp.exceptions?.filter(ex => 
        isValidDate(ex.date) && ex.type
      ) || [],
      preferences: emp.preferences || {}
    })),
    companyConstraints: data.companyConstraints
  };
  return cleaned;
};
```

### 📊 Dashboard monitoring inaccessible

**Symptômes** : Erreur 403/404 sur `/monitoring`

**Solutions** :
1. **Vérifier permissions** :
   - Rôle Admin obligatoire
   - Authentification valide
   - Token non expiré

2. **Test direct API** :
   ```bash
   curl -H "Authorization: Bearer ADMIN_TOKEN" \
     https://smartplanning.onrender.com/api/monitoring/metrics/realtime
   ```

---

## 🗄️ Problèmes Base de Données

### 💾 MongoDB erreurs connexion

**Symptômes** : Erreurs 500, données non sauvegardées

**Diagnostics MongoDB Atlas** :
1. **Connexion cluster** :
   ```javascript
   // Test connexion depuis backend
   const { MongoClient } = require('mongodb');
   
   async function testConnection() {
     try {
       const client = new MongoClient(process.env.MONGODB_URI);
       await client.connect();
       console.log('✅ MongoDB connecté');
       await client.close();
     } catch (error) {
       console.error('❌ MongoDB erreur:', error.message);
     }
   }
   ```

2. **Whitelist IP** : Vérifier IP Render autorisée
3. **Quotas dépassés** : Vérifier utilisation Atlas

### 📈 Performance requêtes lente

**Symptômes** : Réponses API > 2 secondes

**Solutions optimisation** :
1. **Index MongoDB** : Vérifier 28 index actifs
2. **Requêtes complexes** : Analyser explain plans
3. **Cache invalidé** : Bien que désactivé prod, vérifier TTL

---

## 🔧 Problèmes Configuration

### 🌐 Variables environnement manquantes

**Symptômes** : Erreur 500 au démarrage backend

**Variables critiques** :
```bash
# Obligatoires production
NODE_ENV=production
PORT=5050
MONGODB_URI=mongodb+srv://...
JWT_SECRET=32+_caractères_minimum

# Optionnelles mais recommandées
GOOGLE_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
```

**Validation** :
```javascript
// Script validation environnement
const requiredVars = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET'];
const missing = requiredVars.filter(var => !process.env[var]);

if (missing.length > 0) {
  console.error('❌ Variables manquantes:', missing);
  process.exit(1);
}
```

### 🔑 Secrets JWT invalides

**Symptômes** : Tokens rejetés, authentification échoue

**Solutions** :
1. **Longueur minimum** : 32 caractères absolument
2. **Caractères spéciaux** : Éviter caractères shell problématiques
3. **Régénération** : Nouveau secret = déconnexion tous utilisateurs

```bash
# Générer nouveau JWT secret sécurisé
openssl rand -base64 48
```

---

## 🔍 Diagnostic Avancé

### 📋 Health Check Complet

**Script diagnostic automatique** :
```bash
#!/bin/bash
echo "🔍 Diagnostic SmartPlanning v2.2.1"

# 1. Test frontend
echo "Frontend:" 
curl -s -I https://smartplanning.fr | head -1

# 2. Test API backend
echo "Backend API:"
curl -s https://smartplanning.onrender.com/api/health | jq .

# 3. Test AdvancedSchedulingEngine
echo "AdvancedSchedulingEngine:"
curl -s -X POST https://smartplanning.onrender.com/api/autoGenerate/health \
  -H "Content-Type: application/json" | jq .

# 4. Test MongoDB (nécessite auth)
echo "Base données: (Vérifier Atlas Dashboard)"
```

### 🕵️ Logs Production

**Localisation logs** :
1. **Render Backend** : Dashboard → Logs en temps réel
2. **Frontend** : Console navigateur (F12)
3. **MongoDB** : Atlas Dashboard → Monitoring

**Niveaux logs critiques** :
```
ERROR : Erreurs bloquantes
WARN  : Alertes performance/sécurité  
INFO  : Génération plannings réussies
DEBUG : Détails techniques (dev seulement)
```

---

## 📞 Support & Escalade

### 🆘 Quand contacter le support ?

**Escalade immédiate** si :
- Application indisponible > 5 minutes
- Perte données utilisateur
- Faille sécurité suspectée
- Performance dégradée > 50%

### 📋 Informations à fournir

**Template rapport bug** :
```
🐛 RAPPORT PROBLÈME SMARTPLANNING

Environnement:
- URL: [https://smartplanning.fr ou autre]
- Navigateur: [Chrome/Firefox/Safari + version]
- OS: [Windows/Mac/Linux/iOS/Android]
- Résolution: [1920x1080 ou mobile]

Problème:
- Symptômes: [Description détaillée]
- Étapes reproduction: [1. 2. 3...]
- Erreurs affichées: [Screenshots si possible]
- Heure occurrence: [Timestamp précis]

Contexte:
- Rôle utilisateur: [Admin/Manager/Employee]
- Fonction utilisée: [Planning Wizard/Dashboard/etc.]
- Données impliquées: [Taille équipe, etc.]

Logs:
- Console navigateur: [F12 → Console]
- Network errors: [F12 → Network]
- Health check: [curl api/health]
```

### 📧 Contact Développeur

**[Christophe Mostefaoui](https://christophe-dev-freelance.fr/)**
- **Expertise** : AdvancedSchedulingEngine, performance système
- **Délai réponse** : < 24h problèmes critiques
- **Support** : Architecture, optimisation, débogage avancé

---

## 🔮 Prévention & Monitoring

### 📊 Surveillance Proactive

**Métriques à surveiller** :
1. **AdvancedSchedulingEngine** : <5ms génération
2. **API globale** : <1s réponse moyenne
3. **Erreurs validation** : <100 par heure
4. **Disponibilité** : >99.9% uptime

**Dashboard alerts** : Configurées automatiquement dans `/monitoring`

### 🛡️ Maintenance Préventive

**Actions régulières recommandées** :
1. **Logs monitoring** : Vérification quotidienne alertes
2. **Performance baseline** : Comparaison métriques mensuelles
3. **Security updates** : Suivi notifications sécurité
4. **Backup verification** : Test restauration MongoDB

---

**🛠️ SmartPlanning Troubleshooting v2.2.1 - Guide Expert**

**Performance** : Diagnostic ultra-rapide + solutions techniques éprouvées  
**Support** : Contact développeur expert pour cas complexes  
**Prévention** : Monitoring proactif pour éviter problèmes futurs

*Guide troubleshooting mis à jour le 14 août 2025 - Développé par [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)*