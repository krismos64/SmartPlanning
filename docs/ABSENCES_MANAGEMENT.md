# 📅 Gestion des Absences Exceptionnelles - SmartPlanning

## Vue d'ensemble

La gestion des absences exceptionnelles dans SmartPlanning permet aux utilisateurs de déclarer et de gérer facilement les absences de leurs employés lors de la génération de plannings IA. Cette fonctionnalité, introduite dans la version 1.7.0, offre une interface intuitive et complète pour tous les types d'absences.

**Version** : 2.2.1 (Août 2025)  
**Status** : ✅ Production déployée - https://smartplanning.fr  
**Intégration** : Wizard IA Planning - Étape 3 (Absences)  
**Support** : Absences multiples par employé avec validation avancée

## 🎯 Fonctionnalités Principales

### Types d'Absences Supportés

- **🏥 Maladie** : Absence complète pour raison médicale (`sick`)
- **🏖️ Congés** : Absence prévue pour vacances ou repos (`vacation`)
- **📚 Formation** : Absence pour formation professionnelle (`training`)
- **🚫 Indisponible** : Absence pour raison personnelle (`unavailable`)
- **⏰ Horaires réduits** : Travail partiel selon préférences (`reduced`)

### Capacités Avancées

- **🔄 Absences multiples** : Plusieurs absences par employé avec gestion individuelle
- **📅 Validation avancée** : Correspondance dates de semaine planifiée
- **💬 Descriptions** : Raison et contexte pour chaque absence (optionnel)
- **🎨 Interface moderne** : Design glassmorphism avec animations Framer Motion
- **⚡ Intégration temps réel** : Prise en compte immédiate dans la génération IA
- **🔧 Moteur optimisé** : Génération 2-5ms avec AdvancedSchedulingEngine

## 📋 Guide d'Utilisation

### Accès à la Gestion des Absences

1. **Navigation** : Accédez au Planning Wizard IA depuis le dashboard
2. **Étape 3** : "Absences" (optionnelle) après sélection des employés  
3. **Interface** : Vue par employé avec cartes d'absence colorées par type
4. **URL** : https://smartplanning.fr/planning-wizard (étape 3)

### Ajouter une Absence

1. **Sélection employé** : Choisissez l'employé concerné
2. **Bouton "Ajouter une absence"** : Cliquez sur le bouton + avec bordure pointillée
3. **Formulaire** : Remplissez les informations :
   - **Type d'absence** : Congés, Maladie, Formation, Indisponible, Horaires réduits
   - **Date d'absence** : Sélecteur de date avec validation
   - **Description** : Contexte optionnel (ex: "Rendez-vous médical")
4. **Validation** : L'absence est ajoutée immédiatement

### Gérer Plusieurs Absences

1. **Ajout multiple** : Cliquez plusieurs fois sur "Ajouter une absence"
2. **Cartes individuelles** : Chaque absence a sa propre carte rouge
3. **Numérotation** : Absence #1, #2, etc. pour identification
4. **Suppression** : Bouton corbeille pour supprimer une absence

### Modification d'une Absence

1. **Sélection** : Cliquez sur la carte de l'absence à modifier
2. **Modification** : Changez type, date ou commentaire
3. **Sauvegarde** : Automatique lors du changement
4. **Suppression** : Bouton corbeille en haut à droite

## 🔧 Architecture Technique

### Frontend (React + TypeScript)

```typescript
interface EmployeeException {
  date: string; // Format ISO (YYYY-MM-DD)
  type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
  description?: string; // Optionnel
}

interface EmployeeConstraint {
  id: string;
  name: string;
  email: string;
  exceptions?: EmployeeException[];
  // ... autres propriétés
}

// État des absences dans le composant
const [employeeExceptions, setEmployeeExceptions] = useState<{
  [key: string]: EmployeeException[]
}>({});
```

### Backend (AdvancedSchedulingEngine)

```typescript
// Validation des exceptions dans le moteur de planification
function isEmployeeAvailable(employee: Employee, date: Date): boolean {
  // Vérifier les exceptions (congés, absences)
  const hasBlockingException = employee.exceptions?.some(exception => {
    const exceptionDate = new Date(exception.date);
    const isSameDate = exceptionDate.toDateString() === date.toDateString();
    const isBlockingType = ['vacation', 'sick', 'unavailable'].includes(exception.type);
    
    return isSameDate && isBlockingType;
  });

  return !hasBlockingException;
}

// Gestion des horaires réduits
const hasReducedHours = employee.exceptions?.some(exception => {
  const exceptionDate = new Date(exception.date);
  return exceptionDate.toDateString() === date.toDateString() && 
         exception.type === 'reduced';
});

// Types supportés dans le backend
interface EmployeeException {
  date: string; // ISO format (YYYY-MM-DD)
  type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
  description?: string;
}
```

## 🎨 Interface Utilisateur

### Design System

**Couleurs principales** :
- **Fond** : `bg-red-50 dark:bg-red-900/20`
- **Bordures** : `border-red-200 dark:border-red-700/50`
- **Texte** : `text-red-700 dark:text-red-300`
- **Boutons** : `text-red-600 dark:text-red-400`

### Animations

```typescript
// Animation d'apparition des cartes d'absence
const cardAnimation = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: exceptionIndex * 0.1 }
};

// Animation des boutons
const buttonAnimation = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};
```

### Responsive Design

- **Desktop** : Grille 2 colonnes pour type/date
- **Mobile** : Colonnes empilées
- **Tablette** : Adaptation automatique selon l'espace

## 🔄 Logique de Génération

### Traitement des Absences (AdvancedSchedulingEngine)

1. **Validation des dates** : Correspondance avec la semaine planifiée
2. **Classification des exceptions** :
   - **Blocantes** : `vacation`, `sick`, `unavailable` → aucun créneau
   - **Formation** : `training` → traité comme blocant
   - **Partielles** : `reduced` → horaires adaptés selon préférences
3. **Génération intelligente** : Adaptation automatique des créneaux
4. **Performance** : Validation en 2-5ms par employé

### Logs et Debugging (Production)

```typescript
// Logs de diagnostic dans le moteur de planification
console.log(`🚫 ${employee._id} - exception le ${day}:`, exception.type);
console.log(`⏰ ${employee.firstName} ${employee.lastName} - horaires adaptés`);

// Monitoring des exceptions
if (process.env.NODE_ENV === 'development') {
  console.log(`📊 Total exceptions traitées: ${processedExceptions.length}`);
}
```

## 📊 Exemples d'Utilisation

### Cas d'Usage Typiques

1. **Employé malade** :
   - Type : "Maladie" (`sick`)
   - Date : Jour de l'absence
   - Description : "Grippe - arrêt médical"

2. **Congés programmés** :
   - Type : "Congés" (`vacation`)
   - Date : Jour de congé
   - Description : "Vacances d'été"

3. **Formation professionnelle** :
   - Type : "Formation" (`training`)
   - Date : Jour de formation
   - Description : "Formation obligatoire sécurité"

4. **Rendez-vous médical** :
   - Type : "Horaires réduits" (`reduced`)
   - Date : Jour du rendez-vous
   - Description : "RDV médical 14h"

### Absences Multiples

```typescript
// Exemple d'employé avec plusieurs absences
const employeeWithMultipleAbsences = {
  id: "employee123",
  name: "Marie Dupont",
  exceptions: [
    {
      date: "2025-08-21",
      type: "sick",
      description: "Grippe saisonnière"
    },
    {
      date: "2025-08-23",
      type: "reduced",
      description: "RDV spécialiste après-midi"
    },
    {
      date: "2025-08-25",
      type: "vacation",
      description: "Congés d'été - dernière semaine"
    }
  ]
};
```

## 🚀 État Actuel et Futures Améliorations

### Version 2.2.1 - Production (Août 2025)

**✅ Fonctionnalités Actuelles :**
- Gestion complète des 5 types d'absences
- Interface intuitive dans le Planning Wizard  
- Intégration parfaite avec AdvancedSchedulingEngine (2-5ms)
- Support absences multiples par employé
- Validation temps réel avec génération immédiate

### Version 2.3.0 (Q4 2025) - Planifié

- **📊 Dashboard absences** : Vue globale par équipe/période
- **📱 Notifications avancées** : Alertes conflits et validations
- **🔄 Templates d'absences** : Modèles récurrents (RTT, formations)
- **📈 Analytics** : Statistiques et tendances d'absences

### Version 2.4.0 (Q1 2026) - Roadmap

- **📅 Intégration calendrier** : Sync bidirectionnelle Google/Outlook
- **🤖 IA prédictive** : Suggestions intelligentes d'absences probables
- **🔗 API RH** : Intégration systèmes RH existants (Workday, BambooHR)
- **📱 App mobile** : Gestion nomade des absences

## 🛠️ Développement et Maintenance

### Tests

```typescript
// Tests unitaires pour la gestion des absences
describe('Absence Management', () => {
  test('should add new absence to employee', () => {
    // Test d'ajout d'absence
  });
  
  test('should validate absence dates', () => {
    // Test de validation des dates
  });
  
  test('should handle multiple absences', () => {
    // Test d'absences multiples
  });
});
```

### Configuration Actuelle (AbsencesStep.tsx)

```typescript
// Types d'absences avec thème adaptatif
const getExceptionTypes = (isDarkMode: boolean) => [
  { 
    value: 'vacation', 
    label: 'Congés', 
    color: 'bg-blue-500', 
    bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
  },
  { 
    value: 'sick', 
    label: 'Maladie', 
    color: 'bg-red-500',
    bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
  },
  { 
    value: 'training', 
    label: 'Formation', 
    color: 'bg-green-500',
    bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
  },
  // ... autres types
];
```

## 📚 Ressources Complémentaires

- **[Guide utilisateur](AI_ASSISTANT.md)** : Utilisation complète du wizard IA
- **[API Documentation](API.md)** : Endpoints et schémas
- **[Architecture](ARCHITECTURE.md)** : Vue d'ensemble technique
- **[Développement](DEVELOPMENT.md)** : Configuration locale

---

**📞 Support** : Documentation complète disponible, application déployée sur https://smartplanning.fr

**🎯 Objectif** : Gestion intuitive des absences pour des plannings IA ultra-précis et une satisfaction employé optimale

**📊 Performance** : AdvancedSchedulingEngine - Génération 2-5ms avec prise en compte complète des absences  
**🚀 Production** : Système stable et opérationnel en production (Version 2.2.1)