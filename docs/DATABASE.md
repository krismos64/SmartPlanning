# 🗄️ Guide de la base de données - SmartPlanning

## Vue d'ensemble

SmartPlanning utilise MongoDB Atlas comme base de données NoSQL cloud avec Mongoose comme ODM (Object Document Mapper). L'architecture de données est conçue pour supporter une application SaaS multi-entreprises avec gestion hiérarchique des utilisateurs et plannings ultra-performants.

**Version** : 2.2.1 (14 Août 2025) - Production Déployée  
**Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance  
**Base de données** : MongoDB Atlas (Cloud optimisé)  
**🚀 Innovation majeure** : 28 index composites ultra-optimisés pour AdvancedSchedulingEngine

## Architecture générale

### Modèle de données

La base de données SmartPlanning suit une architecture relationnelle adaptée au NoSQL avec les entités principales suivantes :

```
Company (Entreprise)
├── Users (Utilisateurs)
│   ├── Employees (Employés)
│   │   ├── WeeklySchedules (Plannings hebdomadaires)
│   │   ├── GeneratedSchedules (Plannings AdvancedSchedulingEngine) 🆕
│   │   ├── VacationRequests (Demandes de congés)
│   │   ├── Tasks (Tâches)
│   │   └── Incidents (Incidents)
│   └── Teams (Équipes)
├── ChatbotSettings (Paramètres chatbot)
├── ChatbotInteractions (Historique IA)
└── Events (Événements)
```

### Principes de conception

- **Multi-tenancy** : Isolation des données par entreprise (`companyId`)
- **Intégrité référentielle** : Validation et cascades automatiques avancées
- **Sécurité** : Hashage bcrypt, validation Zod, protection données sensibles
- **Performance ultra-optimisée** : 28 index composites pour AdvancedSchedulingEngine
- **MongoDB Atlas** : Cloud managé avec haute disponibilité et backup automatique
- **Évolutivité** : Schema flexible avec optimisations production déployées

## Modèles de données détaillés

### 1. Company (Entreprise)

Le modèle central qui regroupe toutes les données d'une organisation.

```typescript
interface ICompany {
  name: string;           // Nom unique de l'entreprise
  logoUrl?: string;       // URL du logo (Cloudinary)
  plan: CompanyPlan;      // Plan d'abonnement (free, standard, premium, enterprise)
  createdAt: Date;        // Date de création
  updatedAt: Date;        // Date de dernière modification
}
```

**Caractéristiques :**
- ✅ Nom unique dans la base
- ✅ Support des logos via Cloudinary
- ✅ Gestion des plans d'abonnement
- ✅ Cascade de suppression complète

### 2. User (Utilisateur)

Modèle central pour l'authentification et les permissions.

```typescript
interface IUser {
  firstName: string;           // Prénom
  lastName: string;            // Nom
  email: string;               // Email unique
  password: string;            // Mot de passe hashé (bcrypt)
  role: UserRole;              // Rôle (admin, directeur, manager, employee)
  status: "active" | "inactive";
  isEmailVerified: boolean;
  
  // Relations
  companyId?: ObjectId;        // Entreprise associée
  teamIds?: ObjectId[];        // Équipes gérées/associées
  
  // OAuth
  google?: GoogleProfile;      // Profil Google OAuth
  
  // Fonctionnalités
  photoUrl?: string;           // Photo de profil
  bio?: string;                // Biographie
  phone?: string;              // Téléphone
  preferences?: UserPreferences; // Préférences UI
  loginHistory?: LoginHistoryItem[]; // Historique des connexions
  
  // Réinitialisation
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}
```

**Caractéristiques :**
- ✅ Authentification JWT + Google OAuth
- ✅ Système de rôles hiérarchiques
- ✅ Hashage automatique des mots de passe
- ✅ Validation des références (company, teams)
- ✅ Cascade de suppression des données liées

### 3. Team (Équipe)

Regroupement organisationnel au sein d'une entreprise.

```typescript
interface ITeam {
  name: string;               // Nom de l'équipe
  companyId: ObjectId;        // Entreprise propriétaire
  managerIds: ObjectId[];     // Managers de l'équipe (Users)
  employeeIds: ObjectId[];    // Employés de l'équipe (Employees)
  createdAt: Date;
  updatedAt: Date;
}
```

**Caractéristiques :**
- ✅ Validation des managers et employés
- ✅ Synchronisation avec User.teamIds
- ✅ Cascade de suppression des données liées

### 4. Employee (Employé)

Profil détaillé d'un employé avec ses préférences et contraintes.

```typescript
interface IEmployee {
  // Identité
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
  
  // Relations
  userId?: ObjectId;          // Utilisateur associé (optionnel)
  companyId: ObjectId;        // Entreprise
  teamId?: ObjectId;          // Équipe assignée
  
  // Contrat
  status: EmployeeStatus;     // actif, inactif
  role?: string;              // employee, manager, directeur
  contractHoursPerWeek: number;
  startDate?: Date;
  
  // Préférences de planning
  preferences?: {
    preferredDays?: string[];    // ["lundi", "mardi", ...]
    preferredHours?: string[];   // ["09:00-17:00", ...]
  };
}
```

**Caractéristiques :**
- ✅ Lien optionnel avec User (pour les employés non-utilisateurs)
- ✅ Préférences de planning pour l'IA
- ✅ Validation des contraintes horaires
- ✅ Synchronisation bidirectionnelle avec User.teamIds

### 5. WeeklySchedule (Planning hebdomadaire)

Planning détaillé d'un employé pour une semaine donnée.

```typescript
interface IWeeklySchedule {
  employeeId: ObjectId;
  year: number;
  weekNumber: number;         // 1-53
  
  // Planning
  scheduleData: Map<string, string[]>; // {"lundi": ["09:00-12:00", "14:00-17:00"]}
  dailyDates: Map<string, Date>;       // {"lundi": Date}
  totalWeeklyMinutes: number;
  
  // Métadonnées
  status: "approved" | "draft";
  updatedBy: ObjectId;        // Utilisateur qui a modifié
  notes?: string;
  dailyNotes?: Map<string, string>;
}
```

**Caractéristiques :**
- ✅ Index unique par employé/année/semaine
- ✅ Validation des données de planning
- ✅ Support des notes par jour
- ✅ Calcul automatique des heures totales

### 6. GeneratedSchedule (Planning AdvancedSchedulingEngine) 🆕

Stockage optimisé des plannings générés par l'AdvancedSchedulingEngine ultra-performant.

```typescript
interface IGeneratedSchedule {
  employeeId: ObjectId;          // Employé concerné
  scheduleData: {                // Planning généré
    [day: string]: {
      slots: string[];           // ["09:00-12:00", "14:00-17:00"]
    }
  };
  
  // Métadonnées de génération
  generatedBy: string | ObjectId; // Utilisateur ou "AdvancedSchedulingEngine"
  timestamp: Date;               // Date de génération
  status: "draft" | "approved";  // Statut du planning
  
  // Contexte de génération
  weekNumber: number;            // Semaine (1-53)
  year: number;                  // Année
  
  // Métadonnées avancées (optionnel)
  metadata?: {
    generationTimeMs?: number;   // Temps de génération (2-5ms)
    engine?: string;             // "AdvancedSchedulingEngine v2.2.1"
    strategy?: string;           // "distribution" | "preferences" | "concentration"
    legalCompliance?: boolean;   // Conformité légale validée
  };
}
```

**Caractéristiques révolutionnaires :**
- ✅ **Performance exceptionnelle** : Index ultra-optimisés pour requêtes <10ms
- ✅ **Métadonnées enrichies** : Temps génération, stratégie, conformité légale
- ✅ **Intégration AdvancedSchedulingEngine** : Synchronisation parfaite avec moteur natif
- ✅ **Validation automatique** : Contraintes légales et métiers intégrées
- ✅ **Cache intelligent** : Optimisation Redis pour plannings fréquents

### 7. VacationRequest (Demande de congés)

Système de gestion des demandes de congés avec workflow d'approbation.

```typescript
interface IVacationRequest {
  employeeId: ObjectId;
  startDate: Date;
  endDate: Date;
  status: VacationRequestStatus; // pending, approved, rejected
  
  // Workflow
  requestedBy: ObjectId;      // Utilisateur demandeur
  updatedBy?: ObjectId;       // Utilisateur qui a traité
  reason?: string;            // Raison de la demande
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Caractéristiques :**
- ✅ Validation des dates (fin >= début)
- ✅ Normalisation des dates (UTC 12:00)
- ✅ Workflow d'approbation
- ✅ Traçabilité des modifications

### 7. Task (Tâche)

Gestion des tâches assignées aux employés.

```typescript
interface ITask {
  employeeId: ObjectId;
  title: string;
  dueDate?: Date;
  status: TaskStatus;         // pending, inProgress, completed
  createdAt: Date;
  updatedAt: Date;
}
```

### 8. Incident (Incident)

Gestion des incidents et événements exceptionnels.

```typescript
interface IIncident {
  employeeId: ObjectId;
  title: string;
  description?: string;
  severity: IncidentSeverity; // low, medium, high, critical
  status: IncidentStatus;     // open, inProgress, resolved, closed
  reportedBy: ObjectId;
  assignedTo?: ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 9. ChatbotSettings (Paramètres chatbot)

Configuration du chatbot IA par entreprise.

```typescript
interface IChatbotSettings {
  companyId: ObjectId;
  isEnabled: boolean;
  language: string;
  welcomeMessage?: string;
  customInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 10. ChatbotInteraction (Interaction chatbot)

Historique des interactions avec le chatbot.

```typescript
interface IChatbotInteraction {
  userId: ObjectId;
  companyId: ObjectId;
  question: string;
  response: string;
  timestamp: Date;
  metadata?: any;
}
```

## Intégrité référentielle

### Cascades de suppression

Le système implémente des cascades automatiques pour maintenir l'intégrité :

#### Suppression d'un User
```typescript
// Supprime automatiquement :
- Employee.userId (référence)
- VacationRequest.requestedBy/updatedBy
- WeeklySchedule.updatedBy
- Task.employeeId (via Employee)
- Incident.employeeId (via Employee)
- Team.managerIds (référence)
```

#### Suppression d'une Company
```typescript
// Supprime automatiquement :
- Tous les Users.companyId
- Tous les Employees.companyId
- Toutes les Teams.companyId
- Tous les WeeklySchedules (via Employee)
- Toutes les VacationRequests (via Employee)
- Toutes les Tasks (via Employee)
- Tous les Incidents (via Employee)
- ChatbotSettings.companyId
```

#### Suppression d'une Team
```typescript
// Met à jour automatiquement :
- Employee.teamId (suppression de la référence)
- User.teamIds (suppression de la référence)
// Supprime automatiquement :
- WeeklySchedules des employés
- VacationRequests des employés
- Tasks des employés
- Incidents des employés
```

### Validation des références

Tous les modèles valident l'existence des références avant sauvegarde :

```typescript
// Exemple : Employee
userSchema.pre('save', async function() {
  if (this.companyId) {
    const company = await Company.findById(this.companyId);
    if (!company) throw new Error('Company not found');
  }
});
```

## Index et performances

### Index ultra-optimisés (28 index composites)

**🚀 Révolution performance** : Script d'optimisation automatique développé par Christophe Mostefaoui

```typescript
// User - 5 index optimisés
userSchema.index({ email: 1 }, { unique: true, background: true });
userSchema.index({ companyId: 1, role: 1 }, { background: true });
userSchema.index({ status: 1 }, { background: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });
userSchema.index({ lastLogin: -1 }, { background: true });

// Employee - 6 index composites
employeeSchema.index({ companyId: 1, teamId: 1, status: 1 });
employeeSchema.index({ teamId: 1, status: 1 });
employeeSchema.index({ companyId: 1, status: 1 });
employeeSchema.index({ email: 1 }, { sparse: true });
employeeSchema.index({ userId: 1 }, { sparse: true });
employeeSchema.index({ companyId: 1, contractHoursPerWeek: 1 });

// GeneratedSchedule - 5 index ultra-optimisés pour AdvancedSchedulingEngine
generatedScheduleSchema.index({ employeeId: 1, year: -1, weekNumber: -1 });
generatedScheduleSchema.index({ employeeId: 1, status: 1 });
generatedScheduleSchema.index({ year: -1, weekNumber: -1, status: 1 });
generatedScheduleSchema.index({ timestamp: -1 });
generatedScheduleSchema.index({ generatedBy: 1, timestamp: -1 });

// Team - 2 index optimisés
teamSchema.index({ companyId: 1, name: 1 });
teamSchema.index({ managerId: 1 }, { sparse: true });

// VacationRequest - 3 index composites
vacationRequestSchema.index({ employeeId: 1, startDate: -1, endDate: -1 });
vacationRequestSchema.index({ status: 1, startDate: 1, endDate: 1 });
vacationRequestSchema.index({ startDate: 1, endDate: 1 });

// Task & Incident - Index optimisés par équipe et statut
```

**Performance mesurée** :
- Requêtes Employee : <50ms (vs 200ms+ avant optimisation)
- Requêtes GeneratedSchedule : <10ms pour AdvancedSchedulingEngine
- Requêtes complexes multi-collections : <100ms

### Optimisations avancées production

- **28 index composites** : Optimisation automatique via script `optimize-database.ts`
- **Background creation** : Index créés sans bloquer les opérations
- **Sparse indexes** : Économie d'espace pour champs optionnels
- **Performance monitoring** : Analyse automatique des requêtes lentes
- **MongoDB Atlas** : Cluster cloud avec réplication et sauvegarde
- **Cache intelligent** : Intégration Redis pour données fréquentes

## Synchronisation bidirectionnelle

### User ↔ Employee

Le système maintient la cohérence entre `User.teamIds` et `Employee.teamId` :

```typescript
// Après sauvegarde Employee
employeeSchema.post('save', async function(doc) {
  if (doc.userId && doc.teamId) {
    await User.findByIdAndUpdate(doc.userId, {
      $addToSet: { teamIds: doc.teamId }
    });
  }
});
```

## Scripts de maintenance avancés

### Optimisation automatique des performances

```bash
# Créer les 28 index optimisés automatiquement
npm run optimize-database
```

**Développé par Christophe Mostefaoui** - Le script crée automatiquement :
- 28 index composites ultra-optimisés
- Analyse des performances des requêtes
- Statistiques détaillées par collection
- Recommandations d'optimisation

### Nettoyage des données orphelines

```bash
# Exécuter le nettoyage avancé
npm run cleanup-orphaned
```

Le script identifie et corrige :
- Références orphelines (User.companyId, Employee.userId, etc.)
- Données incohérentes (User.teamIds vs Employee.teamId)
- Collections orphelines (GeneratedSchedule sans Employee)
- Validation de l'intégrité référentielle

### Scripts de production

```bash
# Réinitialiser la base avec un admin
npm run reset-database

# Créer un utilisateur administrateur
npm run create-admin

# Migration des employés
npm run migrate:employees
```

## Sécurité

### Hashage des mots de passe

```typescript
// Middleware automatique
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
```

### Validation des entrées

- **Email** : Regex de validation
- **Mot de passe** : Complexité RGPD
- **Dates** : Validation des plages
- **URLs** : Validation des formats

### Protection des données sensibles

```typescript
// Exclusion par défaut
password: { select: false }

// Méthode de comparaison sécurisée
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

## Évolutivité

### Ajout de nouveaux modèles

1. Créer le modèle avec validation
2. Ajouter les relations nécessaires
3. Implémenter les middlewares de cascade
4. Créer les index appropriés
5. Mettre à jour les scripts de maintenance

### Modifications de schéma

- **MongoDB** : Schema flexible par nature
- **Mongoose** : Migration via scripts
- **Validation** : Adaptation progressive
- **Index** : Création en arrière-plan

## Maintenance et monitoring

### Commandes utiles

```bash
# Vérifier l'intégrité
npm run cleanup-orphaned

# Créer un utilisateur admin
npm run create-admin

# Migrer des données
npm run migrate
```

### Surveillance

- **Performances** : Index lents, requêtes N+1
- **Intégrité** : Références orphelines, cascades
- **Sécurité** : Tentatives d'injection, accès non autorisés
- **Espace** : Croissance des collections, documents volumineux

---

---

**🚀 SmartPlanning Database v2.2.1 - Excellence Technique MongoDB**

**Dernière mise à jour** : 14 Août 2025  
**Version de la base** : 2.2.1 (Production déployée avec optimisations)  
**Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Expert Freelance  
**Base de données** : MongoDB Atlas Cloud (haute disponibilité)  
**Performance** : 28 index composites ultra-optimisés  
**Innovation** : Script d'optimisation automatique + AdvancedSchedulingEngine

**🎯 Résultats exceptionnels** :
✅ Requêtes <50ms pour Employee  
✅ Requêtes <10ms pour GeneratedSchedule  
✅ 28 index composites optimisés automatiquement  
✅ Intégrité référentielle complète avec cascades  
✅ Production stable sur MongoDB Atlas