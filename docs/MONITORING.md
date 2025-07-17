# Monitoring et Observabilité - SmartPlanning

## Vue d'ensemble

SmartPlanning intègre un système de monitoring complet basé sur OpenTelemetry pour fournir une observabilité complète de l'application. Le système collecte les traces, métriques et logs pour une surveillance proactive des performances et de la santé de l'application.

**Statut d'implémentation** : ✅ **COMPLET** - Version 1.4.0  
**Interface admin** : ✅ Opérationnelle à `/monitoring`  
**Métriques temps réel** : ✅ Auto-refresh 30 secondes  
**Alertes intelligentes** : ✅ Seuils configurables

## Architecture du Monitoring

### 🏗️ **Stack Technologique**

- **OpenTelemetry** : Standard ouvert pour l'observabilité (simplifié)
- **Service de métriques** : Collecte en mémoire pour performances optimales
- **Métriques temps réel** : Calculs instantanés avec persistance locale
- **Logs structurés** : Console logging avec corrélation contextuelle
- **Interface React** : Dashboard moderne avec Framer Motion
- **API sécurisée** : Endpoints administrateurs (`/api/monitoring/*`)

### 📊 **Métriques Collectées**

#### Authentification
- `auth_attempts_total` : Nombre total de tentatives d'authentification
- `auth_success_rate` : Taux de réussite des connexions
- `auth_duration` : Temps de traitement des authentifications

#### Intelligence Artificielle
- `ai_requests_total` : Nombre de requêtes vers l'API OpenAI
- `ai_request_duration_seconds` : Temps de réponse des requêtes IA
- `ai_success_rate` : Taux de réussite des requêtes IA
- `ai_tokens_used` : Nombre de tokens consommés

#### Génération de Plannings
- `planning_generations_total` : Nombre de plannings générés
- `planning_generation_duration` : Temps de génération des plannings
- `planning_success_rate` : Taux de réussite des générations

#### Système
- `active_users` : Nombre d'utilisateurs actifs
- `memory_usage` : Utilisation de la mémoire
- `cpu_usage` : Utilisation du CPU
- `database_queries` : Métriques des requêtes base de données

## Implémentation Actuelle (Version 1.4.0)

### 🎯 **Architecture Simplifiée**

L'implémentation actuelle utilise une approche simplifiée mais efficace pour le monitoring :

#### Service de Métriques
- **Classe MetricsService singleton** : Collecte et stockage en mémoire
- **Calculs temps réel** : Moyennes et taux calculés à la volée
- **Performance optimisée** : Pas d'impact sur les performances applicatives
- **Persistance légère** : Données conservées pendant l'uptime du serveur

#### Interface Frontend
- **Page MonitoringPage.tsx** : Dashboard complet avec 4 sections
- **Auto-refresh intelligent** : Mise à jour toutes les 30 secondes
- **Responsive design** : Compatible mobile et desktop
- **Thème adaptatif** : Mode clair/sombre automatique

#### API Endpoints
- **Routes sécurisées** : Middleware admin obligatoire
- **Réponses optimisées** : JSON structuré pour performance
- **Gestion d'erreurs** : Fallbacks et messages explicites

### 📈 **Données Disponibles**

#### Temps réel
- Utilisateurs actifs, taux de réussite auth, temps IA, uptime système
- Métriques mémoire Node.js avec pourcentages d'utilisation
- Alertes automatiques basées sur seuils prédéfinis

#### Historique simulé
- Données de test pour démonstration (1h, 24h, 7d, 30d)
- Prêt pour intégration base de données future

## Configuration

### Backend (Node.js)

#### Configuration Actuelle (Simplifiée)
```bash
# Aucune variable spécifique requise
# Le monitoring fonctionne avec la configuration par défaut
NODE_ENV=development  # ou production
PORT=5050
```

#### Initialisation Automatique
```typescript
// app.ts - Middleware automatique
import { metricsMiddleware } from './monitoring/metrics';

app.use(metricsMiddleware);  // Collecte automatique HTTP

// Routes monitoring
app.use('/api/monitoring', monitoringRoutes);
```

### Frontend (React)

L'interface de monitoring est accessible aux administrateurs via `/monitoring` et offre :
- Vue d'ensemble des métriques en temps réel
- Historique des performances
- Alertes actives
- Informations système

## Utilisation

### 🎯 **Accès à l'Interface**

1. **Connexion Admin** : Se connecter avec un compte administrateur
2. **Navigation** : Accéder à "Monitoring" dans le menu latéral
3. **Dashboards** : Naviguer entre les différents onglets

### 📈 **Dashboards Disponibles**

#### Vue d'ensemble
- **Utilisateurs actifs** : Nombre en temps réel
- **Taux de réussite auth** : Pourcentage de connexions réussies
- **Temps moyen IA** : Performance des requêtes OpenAI
- **Uptime** : Temps de fonctionnement du serveur

#### Métriques détaillées
- **Authentification** : Statistiques complètes des connexions
- **IA** : Performance et coûts des requêtes OpenAI
- **Plannings** : Métriques de génération
- **Mémoire** : Utilisation des ressources système

#### Alertes
- **Temps de réponse élevé** : >30s pour l'IA
- **Taux d'échec auth** : >10% d'échecs
- **Charge système** : >500 utilisateurs simultanés
- **Utilisation mémoire** : >80% de la heap

#### Système
- **Node.js** : Version, uptime, mémoire
- **Plateforme** : OS, architecture
- **Application** : Version, temps de démarrage

## API Endpoints

### Métriques en temps réel
```
GET /api/monitoring/metrics/realtime
```

### Métriques historiques
```
GET /api/monitoring/metrics/historical/:period
```
Périodes supportées : `1h`, `24h`, `7d`, `30d`

### Alertes actives
```
GET /api/monitoring/alerts
```

### Logs
```
GET /api/monitoring/logs/:level?limit=100
```

### Statistiques système
```
GET /api/monitoring/system/stats
```

### Santé de l'application
```
GET /api/monitoring/health
```

## Intégration avec l'Application

### Instrumenter du code

#### Authentification
```typescript
import { metricsService } from '../monitoring/metrics';

// Enregistrer une tentative d'authentification
metricsService.recordAuthAttempt(true, 'email', userId);
```

#### Requêtes IA
```typescript
const startTime = Date.now();
try {
  // Requête OpenAI
  const response = await openai.chat.completions.create(params);
  const duration = Date.now() - startTime;
  
  metricsService.recordAIRequest(duration, true, 'gpt-4', response.usage?.total_tokens);
} catch (error) {
  const duration = Date.now() - startTime;
  metricsService.recordAIRequest(duration, false, 'gpt-4');
}
```

#### Génération de plannings
```typescript
const startTime = Date.now();
try {
  // Génération du planning
  const planning = await generatePlanning(employees);
  const duration = Date.now() - startTime;
  
  metricsService.recordPlanningGeneration(duration, true, employees.length);
} catch (error) {
  const duration = Date.now() - startTime;
  metricsService.recordPlanningGeneration(duration, false, employees.length);
}
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

### Types d'alertes

- **Info** : Informations générales (charge élevée)
- **Warning** : Attention requise (performance dégradée)
- **Error** : Action immédiate requise (service indisponible)

## Déploiement

### Docker Compose (recommandé)
```yaml
version: '3.8'
services:
  smartplanning-backend:
    # Configuration existante
    environment:
      - JAEGER_ENDPOINT=http://jaeger:14268/api/traces
      - PROMETHEUS_PORT=9090
    depends_on:
      - jaeger
      - prometheus

  jaeger:
    image: jaegertracing/all-in-one:1.45
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  prometheus:
    image: prom/prometheus:v2.40.7
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Configuration Prometheus
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'smartplanning'
    static_configs:
      - targets: ['smartplanning-backend:9090']
```

## Maintenance

### Nettoyage des logs
```bash
# Rotation automatique configurée (10MB max, 5 fichiers)
# Nettoyage manuel si nécessaire
rm -f backend/logs/*.log
```

### Maintenance des métriques
```bash
# Redémarrage du service de métriques
curl -X POST http://localhost:5050/api/monitoring/metrics/collect
```

### Surveillance des performances
```bash
# Vérification santé
curl http://localhost:5050/api/monitoring/health

# Métriques Prometheus
curl http://localhost:9090/metrics
```

## Dépannage

### Problèmes courants

1. **Métriques manquantes**
   - Vérifier l'initialisation d'OpenTelemetry
   - Contrôler les logs d'erreur
   - Redémarrer le service

2. **Traces non visibles**
   - Vérifier la connexion Jaeger
   - Contrôler l'endpoint configuré
   - Vérifier les permissions réseau

3. **Performance dégradée**
   - Réduire la fréquence de collecte
   - Optimiser les requêtes de métriques
   - Augmenter les ressources système

### Logs de débogage
```bash
# Activer les logs détaillés
export LOG_LEVEL=debug

# Vérifier les logs OpenTelemetry
tail -f backend/logs/combined.log | grep telemetry
```

## Bonnes Pratiques

### 🎯 **Métriques**
- Utiliser des noms cohérents et descriptifs
- Inclure des labels pertinents
- Éviter les cardinalités trop élevées
- Mesurer ce qui compte vraiment

### 🔍 **Traces**
- Tracer les opérations critiques
- Inclure des attributs métier
- Propager le contexte entre services
- Gérer les erreurs et exceptions

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

## Support

Pour toute question ou problème :
1. Consulter les logs : `backend/logs/`
2. Vérifier la santé : `/api/monitoring/health`
3. Consulter cette documentation
4. Contacter l'équipe technique

---

**Note** : Ce système de monitoring est conçu pour évoluer avec les besoins de SmartPlanning. Les métriques et alertes peuvent être ajustées selon les retours d'expérience et les exigences business.