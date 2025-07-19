# Monitoring et Observabilité - SmartPlanning

## Vue d'ensemble

SmartPlanning intègre un système de monitoring complet basé sur OpenTelemetry pour fournir une observabilité complète de l'application. Le système collecte les traces, métriques et logs pour une surveillance proactive des performances et de la santé de l'application.

**Statut d'implémentation** : ✅ **COMPLET** - Version 1.6.0  
**Interface admin** : ✅ Opérationnelle à `/monitoring`  
**Métriques temps réel** : ✅ Auto-refresh 30 secondes  
**Alertes intelligentes** : ✅ Seuils configurables  
**Validation Zod** : ✅ Dashboard intégré avec métriques d'erreurs  
**Assistant IA** : ✅ Monitoring des performances et usage de l'IA

## Architecture du Monitoring

### 🏗️ **Stack Technologique**

- **OpenTelemetry** : Standard ouvert pour l'observabilité (simplifié)
- **Service de métriques** : Collecte en mémoire pour performances optimales
- **Métriques temps réel** : Calculs instantanés avec persistance locale
- **Logs structurés** : Console logging avec corrélation contextuelle
- **Interface React** : Dashboard moderne avec Framer Motion
- **API sécurisée** : Endpoints administrateurs (`/api/monitoring/*`)
- **Validation Zod** : Monitoring intégré des erreurs de validation

### 📊 **Métriques Collectées**

#### Authentification
- `auth_attempts_total` : Nombre total de tentatives d'authentification
- `auth_success_rate` : Taux de réussite des connexions
- `auth_duration` : Temps de traitement des authentifications

#### 🚀 Intelligence Artificielle (Assistant IA Planning)
- `ai_requests_total` : Nombre de requêtes vers OpenRouter (Gemini 2.0 Flash)
- `ai_request_duration_seconds` : Temps de réponse des requêtes IA
- `ai_success_rate` : Taux de réussite des requêtes IA
- `ai_tokens_used` : Nombre de tokens consommés
- `ai_wizard_sessions_total` : Nombre de sessions Assistant IA démarrées
- `ai_wizard_completions_total` : Nombre de générations réussies
- `ai_wizard_step_duration` : Temps passé par étape du wizard
- `ai_wizard_abandonment_rate` : Taux d'abandon par étape

#### Génération de Plannings
- `planning_generations_total` : Nombre de plannings générés
- `planning_generation_duration` : Temps de génération des plannings
- `planning_success_rate` : Taux de réussite des générations

#### Système
- `active_users` : Nombre d'utilisateurs actifs
- `memory_usage` : Utilisation de la mémoire
- `cpu_usage` : Utilisation du CPU
- `database_queries` : Métriques des requêtes base de données

#### Validation des Données (Version 1.5.0)
- `validation_errors_total` : Nombre total d'erreurs de validation Zod
- `validation_errors_body` : Erreurs dans les données body
- `validation_errors_params` : Erreurs dans les paramètres de route
- `validation_errors_query` : Erreurs dans les paramètres de requête
- `validation_errors_by_route` : Erreurs groupées par route API

## Dashboard de Monitoring

### 🖥️ **Interface d'administration**

Le dashboard `/monitoring` propose 5 sections principales :

1. **Vue d'ensemble** : Métriques clés et indicateurs globaux
2. **Métriques** : Données détaillées par catégorie
3. **Erreurs Zod** : Dashboard de validation avec graphiques et tableaux
4. **Alertes** : Notifications actives et historique
5. **Système** : Informations techniques et santé

### 📊 **Section "Erreurs Zod" - Dashboard de Validation**

#### Vue d'ensemble
Cette section fournit une visualisation complète et interactive des métriques d'erreurs de validation Zod collectées via OpenTelemetry.

#### Fonctionnalités principales

**1. Onglet "Erreurs Zod"**
- Position : Entre "Métriques" et "Alertes"
- Icône : `Shield` (bouclier)
- Badge dynamique : Affiche le nombre total d'erreurs
- Couleur du badge : ⚠️ Warning (< 100 erreurs) / ❌ Error (≥ 100 erreurs)

**2. Vue d'ensemble enrichie**
Trois nouvelles cartes métriques dans la vue d'ensemble :
- **Erreurs de validation** : Nombre total avec indicateur de criticité
- **Routes affectées** : Nombre de routes API avec des erreurs
- **Type principal** : Type d'erreur le plus fréquent (Body/Params/Query)

**3. Alerte contextuelle**
- Seuil : > 100 erreurs de validation
- Type : Warning avec icône `AlertTriangle`
- Message : "Le nombre d'erreurs de validation a dépassé le seuil de 100. Vérifiez vos formulaires côté client."

#### Visualisations

**1. Métriques principales (4 cartes)**
```typescript
interface ValidationMetrics {
  total_errors: number;      // Total des erreurs
  body_errors: number;       // Erreurs dans le body
  params_errors: number;     // Erreurs dans les paramètres
  query_errors: number;      // Erreurs dans les query params
}
```

**2. Graphique à barres groupées**
- **Librairie** : Recharts
- **Type** : BarChart avec barres groupées
- **Données** : Top 10 des routes avec le plus d'erreurs
- **Axes** :
  - X : Routes API (format raccourci, ex: `auth/register`)
  - Y : Nombre d'erreurs
- **Séries** : 3 barres par route
  - 🔵 Body (bleu #3B82F6)
  - 🟢 Params (vert #10B981)
  - 🟡 Query (jaune #F59E0B)

**3. Tableau détaillé**
- **Colonnes** : Route, Total, Body, Params, Query, Sévérité
- **Fonctionnalités** :
  - ✅ Tri par colonne (clic sur en-tête)
  - 🔍 Recherche par route
  - 🎯 Filtrage par type (All/Body/Params/Query)
  - 📊 Badges de sévérité dynamiques

**4. Système de sévérité**
```typescript
const getSeverityBadge = (total: number) => {
  if (total >= 50) return "Critique" (rouge)
  if (total >= 20) return "Élevé" (orange)
  if (total >= 5) return "Modéré" (jaune)
  return "Faible" (bleu)
}
```

#### Intégration technique

**API Backend**
```typescript
// Endpoint : GET /api/monitoring/metrics/realtime
{
  "validation": {
    "total_errors": 132,
    "body_errors": 89,
    "params_errors": 25,
    "query_errors": 18,
    "by_route": {
      "/api/auth/register": {
        "body": 45,
        "params": 0,
        "query": 2,
        "total": 47
      }
    }
  }
}
```

**Composant React**
```typescript
// frontend/src/components/monitoring/ZodValidationDashboard.tsx
const ZodValidationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'body' | 'params' | 'query'>('all');
  
  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchValidationMetrics, 30000);
    return () => clearInterval(interval);
  }, []);
}
```

## Système de Validation Zod

### 🔧 **Architecture de la validation**

#### Composants principaux

```
backend/src/
├── middlewares/
│   ├── validation.middleware.ts     # Middleware principal
│   └── errorHandler.middleware.ts   # Gestionnaire d'erreurs
├── schemas/
│   ├── index.ts                     # Exports centralisés
│   ├── auth.schemas.ts              # Schémas d'authentification
│   ├── company.schemas.ts           # Schémas d'entreprise
│   └── employee.schemas.ts          # Schémas d'employé
└── monitoring/
    └── metrics.ts                   # Collecte des métriques
```

#### Middleware de validation

```typescript
import { validateRequest } from '../middlewares/validation.middleware';
import { registerSchema } from '../schemas/auth.schemas';

// Utilisation sur une route
router.post('/register', 
  validateRequest({ 
    body: registerSchema,
    schemaName: 'auth.register' 
  }),
  registerController
);
```

### 📋 **Schémas de validation**

#### Schémas d'authentification
```typescript
const registerSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  email: createEmailSchema(),
  password: createPasswordSchema(),
  companyName: z.string().min(2, "Minimum 2 caractères"),
  companyAddress: z.string().min(5, "Minimum 5 caractères"),
  companySize: z.enum(['small', 'medium', 'large']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions d'utilisation"
  })
});
```

#### Schémas d'entreprise
```typescript
const createCompanySchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  siret: z.string().regex(/^\d{14}$/, "SIRET invalide (14 chiffres requis)"),
  address: z.string().min(10, "Adresse complète requise"),
  industry: z.enum(['retail', 'services', 'manufacturing', 'technology']),
  size: z.enum(['small', 'medium', 'large']),
  contactEmail: createEmailSchema(),
  contactPhone: createPhoneSchema()
});
```

#### Fonctions utilitaires
```typescript
// Validation ObjectId MongoDB
const createObjectIdSchema = () => 
  z.string().regex(/^[0-9a-fA-F]{24}$/, "ID MongoDB invalide");

// Validation email
const createEmailSchema = () => 
  z.string().email("L'adresse email n'est pas valide");

// Validation mot de passe
const createPasswordSchema = () => 
  z.string()
    .min(8, "Minimum 8 caractères requis")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           "Format invalide");
```

### 🌐 **Messages d'erreur français**

```typescript
const customErrorMessages = {
  required_error: "Ce champ est obligatoire",
  invalid_type_error: "Type de données invalide",
  too_small: "Valeur trop petite ou trop courte",
  too_big: "Valeur trop grande ou trop longue",
  invalid_string: "Format de chaîne invalide",
  invalid_email: "L'adresse email n'est pas valide",
  invalid_url: "L'URL n'est pas valide",
  invalid_date: "Date invalide",
  invalid_enum_value: "Valeur non autorisée",
  unrecognized_keys: "Champs non autorisés détectés",
  custom: "Validation personnalisée échouée"
};
```

## Implémentation Technique

### 🎯 **Architecture Simplifiée**

L'implémentation utilise une approche simplifiée mais efficace pour le monitoring :

#### Service de Métriques
- **Classe MetricsService singleton** : Collecte et stockage en mémoire
- **Calculs temps réel** : Moyennes et taux calculés à la volée
- **Performance optimisée** : Pas d'impact sur les performances applicatives
- **Persistance légère** : Données conservées pendant l'uptime du serveur

#### Interface Frontend
- **Page MonitoringPage.tsx** : Dashboard complet avec 5 sections
- **Auto-refresh intelligent** : Mise à jour toutes les 30 secondes
- **Responsive design** : Compatible mobile et desktop
- **Thème adaptatif** : Mode clair/sombre automatique

#### API Endpoints
- **Routes sécurisées** : Middleware admin obligatoire
- **Réponses optimisées** : JSON structuré pour performance
- **Gestion d'erreurs** : Fallbacks et messages explicites

### 📈 **Collecte des métriques**

#### Authentification
```typescript
// Enregistrement des tentatives d'authentification
metricsService.recordAuthAttempt(success, method, userId);

// Exemple d'utilisation
try {
  const user = await authenticateUser(email, password);
  metricsService.recordAuthAttempt(true, 'email', user.id);
} catch (error) {
  metricsService.recordAuthAttempt(false, 'email');
}
```

#### Intelligence Artificielle
```typescript
const startTime = Date.now();
try {
  const response = await openai.chat.completions.create(params);
  const duration = Date.now() - startTime;
  
  metricsService.recordAIRequest(duration, true, 'gpt-4', response.usage?.total_tokens);
} catch (error) {
  const duration = Date.now() - startTime;
  metricsService.recordAIRequest(duration, false, 'gpt-4');
}
```

#### Validation des données
```typescript
// Enregistrement automatique via middleware
import { metricsService } from '../monitoring/metrics';

// Dans validation.middleware.ts
metricsService.incrementValidationError(
  req.originalUrl,           // Route concernée
  'body'                     // Type : body, params, query
);

// Exemple d'utilisation
if (error instanceof ZodError) {
  const validationType = config.body ? 'body' : 
                        config.params ? 'params' : 'query';
  
  metricsService.incrementValidationError(req.originalUrl, validationType);
}
```

## Configuration

### Backend (Node.js)

#### Configuration Simplifiée
```bash
# Aucune variable spécifique requise
# Le monitoring fonctionne avec la configuration par défaut
NODE_ENV=development  # ou production
PORT=5050

# Seuils d'alertes (optionnel)
VALIDATION_ERROR_THRESHOLD=100
VALIDATION_MONITORING_ENABLED=true
```

#### Initialisation Automatique
```typescript
// app.ts - Middleware automatique
import { metricsMiddleware } from './monitoring/metrics';
import { tracingMiddleware } from './monitoring/telemetry';

app.use(metricsMiddleware);     // Collecte automatique HTTP
app.use(tracingMiddleware);     // Traces OpenTelemetry

// Routes monitoring
app.use('/api/monitoring', monitoringRoutes);
```

### Frontend (React)

#### Configuration Dashboard
```typescript
// frontend/src/pages/MonitoringPage.tsx
const MonitoringPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'system' | 'validation'>('overview');
  
  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);
};
```

## Alertes et Notifications

### Seuils Configurés

| Métrique | Seuil Warning | Seuil Critical |
|----------|---------------|----------------|
| Temps réponse IA | >15s | >30s |
| Échec authentification | >5% | >10% |
| Utilisateurs actifs | >300 | >500 |
| Utilisation mémoire | >60% | >80% |
| Temps réponse API | >500ms | >1s |
| Erreurs de validation | >50 | >100 |

### Types d'alertes

- **Info** : Informations générales (charge élevée)
- **Warning** : Attention requise (performance dégradée)
- **Error** : Action immédiate requise (service indisponible)

### Alertes de validation

```typescript
// Génération automatique d'alertes
if (metrics.validation.total_errors > VALIDATION_ERROR_THRESHOLD) {
  alerts.push({
    id: 'high_validation_errors',
    severity: 'warning',
    message: 'Nombre élevé d\'erreurs de validation',
    value: metrics.validation.total_errors,
    threshold: VALIDATION_ERROR_THRESHOLD
  });
}
```

## Tests

### Tests Cypress - Dashboard de Validation

```typescript
describe('Dashboard de Validation Zod', () => {
  it('devrait afficher les métriques de validation', () => {
    cy.visit('/monitoring');
    cy.contains('Erreurs Zod').click();
    
    // Vérifier les métriques principales
    cy.contains('Total erreurs').should('be.visible');
    cy.contains('132').should('be.visible');
    
    // Vérifier le graphique
    cy.get('.recharts-wrapper').should('be.visible');
    
    // Vérifier le tableau
    cy.contains('Erreurs par route').should('be.visible');
  });

  it('devrait permettre de filtrer les erreurs par type', () => {
    cy.visit('/monitoring');
    cy.contains('Erreurs Zod').click();
    
    // Utiliser le filtre par type
    cy.get('select').select('body');
    
    // Vérifier que seules les routes avec des erreurs body sont affichées
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });
});
```

### Tests unitaires

```typescript
describe('Validation Middleware', () => {
  it('devrait valider les données correctes', async () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };
    
    const schema = z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email()
    });
    
    expect(() => schema.parse(validData)).not.toThrow();
  });
});
```

## Utilisation

### Intégration dans les routes

```typescript
import { validateRequest } from '../middlewares/validation.middleware';
import { createCompanySchema } from '../schemas/company.schemas';

// Route avec validation
router.post('/companies', 
  authenticateToken,
  validateRequest({ 
    body: createCompanySchema,
    schemaName: 'company.create' 
  }),
  createCompanyController
);
```

### Gestion des erreurs

```typescript
// Réponse d'erreur standardisée
{
  "success": false,
  "message": "Données de requête invalides",
  "errors": [
    {
      "field": "email",
      "message": "L'adresse email n'est pas valide",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2025-07-17T14:00:00.000Z"
}
```

## Bonnes Pratiques

### 🎯 **Métriques**
- Utiliser des noms cohérents et descriptifs
- Inclure des labels pertinents
- Éviter les cardinalités trop élevées
- Mesurer ce qui compte vraiment

### 🔍 **Validation**
- **Réutilisabilité** : Créer des fonctions utilitaires pour les validations communes
- **Clarté** : Messages d'erreur explicites et en français
- **Performance** : Schémas optimisés pour la rapidité
- **Maintenance** : Centralisation dans le dossier `schemas/`

### 📝 **Logs**
- Utiliser des formats structurés
- Inclure la corrélation avec les traces
- Respecter les niveaux de logs
- Protéger les données sensibles

### ⚡ **Performance**
- Échantillonner les traces si nécessaire
- Optimiser les requêtes de métriques
- Utiliser des caches appropriés
- Monitorer l'impact du monitoring

## Roadmap

### Phase 1 ✅ (Complétée - Version 1.4.0)
- ✅ Configuration OpenTelemetry simplifiée
- ✅ Métriques business essentielles (auth, IA, planning, système)
- ✅ Interface de monitoring complète (4 sections)
- ✅ Alertes intelligentes avec seuils configurables
- ✅ Auto-refresh temps réel (30 secondes)
- ✅ API monitoring sécurisée (admin only)
- ✅ Intégration seamless dans l'interface admin

### Phase 1.5 ✅ (Complétée - Version 1.5.0)
- ✅ Dashboard de validation des données avec Zod
- ✅ Métriques d'erreurs de validation par route et type
- ✅ Graphiques interactifs (Top 10 routes avec erreurs)
- ✅ Tableau détaillé avec tri, filtres et recherche
- ✅ Alertes contextuelles pour seuils d'erreurs dépassés
- ✅ Tests automatisés Cypress pour validation du dashboard
- ✅ Documentation complète du système de validation

### Phase 2 🔄 (Future)
- Dashboards Grafana (si besoin)
- Historique persistant base de données
- Intégration notifications externes
- Métriques avancées de business

### Phase 3 📋 (Planifié)
- Machine learning pour anomalies
- Prédictions de charge
- Optimisations automatiques
- Rapports d'analyse avancés

## Métriques de performance

### KPIs suivis

- **Temps de validation** : < 50ms par requête
- **Taux d'erreur** : < 5% des requêtes
- **Couverture** : 100% des endpoints publics
- **Disponibilité** : 99.9% du dashboard de monitoring

### Optimisations

- **Schémas compilés** : Validation rapide avec Zod
- **Cache des schémas** : Réutilisation des instances
- **Validation lazy** : Chargement à la demande
- **Métriques asynchrones** : Pas d'impact sur les performances

## Support

Pour toute question ou problème :
1. Consulter les logs : `backend/logs/`
2. Vérifier la santé : `/api/monitoring/health`
3. Consulter cette documentation
4. Contacter l'équipe technique

---

**Note** : Ce système de monitoring est conçu pour évoluer avec les besoins de SmartPlanning. Les métriques et alertes peuvent être ajustées selon les retours d'expérience et les exigences business.

**Version** : 1.5.0 - Monitoring complet avec validation Zod intégrée