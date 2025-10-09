# 📊 SmartPlanning PostgreSQL Database

Ce dossier contient le **script SQL complet** pour créer la base de données PostgreSQL de SmartPlanning.

## 📁 Fichiers

- `init-smartplanning-postgresql.sql` - Script complet de création de la base de données

## 🚀 Utilisation

### 1️⃣ Pré-requis

- PostgreSQL 15+ installé
- Accès superuser PostgreSQL
- Client psql disponible

### 2️⃣ Création rapide

```bash
# Créer la base de données
createdb smartplanning

# Exécuter le script d'initialisation
psql -d smartplanning -f database/init-smartplanning-postgresql.sql
```

### 3️⃣ Création complète (avec nettoyage)

```bash
# Supprimer l'ancienne base si elle existe
dropdb smartplanning --if-exists

# Créer une nouvelle base propre
createdb smartplanning \
  --encoding=UTF8 \
  --locale=fr_FR.UTF-8

# Exécuter le script
psql -d smartplanning -f database/init-smartplanning-postgresql.sql
```

### 4️⃣ Vérification

```bash
# Se connecter à la base
psql -d smartplanning

# Lister les tables
\dt

# Vérifier une table
\d company

# Compter les enregistrements seeds
SELECT COUNT(*) FROM role WHERE is_system_role = TRUE;
-- Résultat attendu: 4 (admin, directeur, manager, employee)

# Quitter
\q
```

## 📋 Contenu du script

### 🔧 Extensions PostgreSQL

- `uuid-ossp` : Génération UUID (futures fonctionnalités)
- `pg_trgm` : Recherche full-text performante
- `btree_gin` : Index composites optimisés

### 📊 Tables créées (20 tables)

#### Core Entities (Multi-tenant)

1. **company** - Entreprises clientes (racine multi-tenant)
2. **user** - Utilisateurs et authentification (RBAC)
3. **team** - Équipes de travail
4. **employee** - Employés (1-to-1 avec User)

#### Planning Entities

5. **weekly_schedule** - Plannings hebdomadaires validés
6. **generated_schedule** - Plannings générés par IA
7. **shift** - Vue dénormalisée des créneaux (performance)

#### Operations Entities

8. **vacation_request** - Demandes de congés
9. **task** - Tâches opérationnelles
10. **incident** - Incidents opérationnels
11. **event** - Événements calendrier

#### AI / Chatbot Entities

12. **chatbot_interaction** - Historique chatbot
13. **chatbot_settings** - Configuration chatbot

#### SaaS / Billing Entities

14. **subscription** - Abonnements Stripe
15. **payment** - Historique paiements

#### Advanced Features (RBAC & Audit)

16. **role** - Rôles système et personnalisés
17. **user_role** - Attribution rôles (many-to-many)
18. **permission** - Permissions fine-grained
19. **role_permission** - Attribution permissions (many-to-many)
20. **audit_log** - Journal d'audit complet (RGPD)

### 🎯 Index créés

**70+ index optimisés** pour :

- Requêtes temporelles (DESC sur dates)
- Jointures FK
- Recherches fréquentes (status, companyId)
- Performance queries

### ⚙️ Triggers

**Trigger automatique** sur toutes les tables avec `updated_at` :

- Mise à jour automatique du timestamp lors des UPDATE

### 🌱 Seeds initiaux

#### Rôles système (4 rôles)

- `admin` - Administrateur système (accès complet)
- `directeur` - Directeur d'entreprise (gestion complète)
- `manager` - Manager d'équipe (gestion planning)
- `employee` - Employé (consultation)

#### Permissions système (14 permissions)

- planning:create, read, update, delete, validate
- vacation:create, read, approve, reject
- analytics:view
- company:manage
- users:manage
- tasks:create, assign

### 📈 Vues utilitaires (2 vues)

1. `v_active_schedules` - Plannings validés de la semaine courante
2. `v_pending_vacations` - Demandes de congés en attente

## 🔐 Caractéristiques de sécurité

### Multi-tenant strict

- Toutes les données isolées par `company_id`
- Cascade DELETE sur suppression entreprise
- Index optimisés pour filtrage par company

### Contraintes de validation

- CHECK constraints sur tous les enums
- Validation des emails (regex)
- Validation des dates (end >= start)
- Validation des heures contractuelles (1-60)

### Audit trail complet

- Table `audit_log` avec BIGSERIAL (volume important)
- Stockage IP, User-Agent, changements before/after
- Index partitionnés par date

## 📐 Architecture JSON

### Champs JSONB pour flexibilité

```sql
-- company.default_opening_hours
{
  "monday": { "start": "09:00", "end": "18:00", "isOpen": true },
  "tuesday": { "start": "09:00", "end": "18:00", "isOpen": true }
}

-- employee.preferences
{
  "preferredDays": ["monday", "tuesday"],
  "avoidedDays": ["sunday"],
  "maxConsecutiveDays": 6,
  "preferSplitShifts": false
}

-- weekly_schedule.schedule
{
  "monday": [
    {
      "employeeId": 1,
      "startTime": "09:00",
      "endTime": "17:00",
      "position": "Vendeur",
      "skills": ["caisse"],
      "breakStart": "12:00",
      "breakEnd": "13:00"
    }
  ]
}

-- generated_schedule.metrics
{
  "generationTime": 2.5,
  "strategy": "preferences",
  "qualityScore": 0.95,
  "constraintsRespected": 14,
  "employeesSatisfaction": 0.92
}
```

## 🛠 Commandes utiles

### Backup

```bash
# Dump complet
pg_dump smartplanning > backup-$(date +%Y%m%d).sql

# Dump structure seule (sans données)
pg_dump smartplanning --schema-only > schema-only.sql

# Dump données seules
pg_dump smartplanning --data-only > data-only.sql
```

### Restore

```bash
# Restaurer depuis backup
psql smartplanning < backup-20251009.sql
```

### Maintenance

```bash
# Analyser les stats PostgreSQL
psql smartplanning -c "ANALYZE;"

# Vacuum complet
psql smartplanning -c "VACUUM ANALYZE;"

# Taille de la base
psql smartplanning -c "SELECT pg_size_pretty(pg_database_size('smartplanning'));"
```

### Monitoring

```bash
# Connexions actives
psql smartplanning -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'smartplanning';"

# Requêtes lentes
psql smartplanning -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Index non utilisés
psql smartplanning -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT IN (SELECT indexrelname FROM pg_stat_user_indexes WHERE idx_scan > 0);"
```

## 🔄 Migrations Prisma

### Après création manuelle

```bash
# 1. Synchroniser Prisma avec la base existante
npx prisma db pull

# 2. Générer le Prisma Client
npx prisma generate

# 3. (Optionnel) Créer une migration initiale
npx prisma migrate dev --name init --create-only
```

### Pour futures migrations

```bash
# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer en production
npx prisma migrate deploy
```

## 📚 Ressources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema Prisma](/backend/prisma/schema.prisma)
- [Architecture Database](/docs/database-postgresql-architecture.md)

## ⚠️ Important

1. **Production** : Commenter les lignes `DROP DATABASE` avant d'exécuter
2. **Backup** : Toujours faire un backup avant modification
3. **Permissions** : Configurer les permissions PostgreSQL selon environnement
4. **SSL** : Activer SSL en production
5. **Connection Pool** : Configurer Prisma connection pooling

## 🎯 Prochaines étapes

Après création de la base :

```bash
# 1. Générer Prisma Client
cd backend
npx prisma generate

# 2. Créer un administrateur
npm run create-admin

# 3. Lancer le serveur
npm run dev
```

## 📊 Statistiques script

- **Lignes SQL** : 1000+
- **Tables** : 20
- **Index** : 70+
- **Triggers** : 15
- **Vues** : 2
- **Seeds** : 18 entrées (4 rôles + 14 permissions)
- **Extensions** : 3
