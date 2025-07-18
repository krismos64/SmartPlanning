# 📅 Gestion des Absences Exceptionnelles - SmartPlanning

## Vue d'ensemble

La gestion des absences exceptionnelles dans SmartPlanning permet aux utilisateurs de déclarer et de gérer facilement les absences de leurs employés lors de la génération de plannings IA. Cette fonctionnalité, introduite dans la version 1.7.0, offre une interface intuitive et complète pour tous les types d'absences.

**Version** : 1.7.0 (Juillet 2025)  
**Status** : ✅ Production stable  
**Intégration** : Wizard IA Planning - Étape 3  
**Support** : Absences multiples par employé

## 🎯 Fonctionnalités Principales

### Types d'Absences Supportés

- **🏥 Arrêt maladie** : Absence complète pour raison médicale
- **🏖️ Congés** : Absence prévue pour vacances ou repos
- **📚 Formation** : Absence pour formation professionnelle
- **🚫 Indisponible** : Absence pour raison personnelle
- **⏰ Horaires réduits** : Travail en matinée uniquement (8h-12h)

### Capacités Avancées

- **🔄 Absences multiples** : Plusieurs absences par employé
- **📅 Validation de dates** : Vérification des conflits
- **💬 Commentaires** : Raison et contexte pour chaque absence
- **🎨 Interface moderne** : Design glassmorphism avec animations
- **⚡ Temps réel** : Validation et feedback instantanés

## 📋 Guide d'Utilisation

### Accès à la Gestion des Absences

1. **Navigation** : Accédez au Planning Wizard IA
2. **Étape 3** : "Absences & Contraintes" après sélection des employés
3. **Interface** : Cartes employés avec gestion d'absences individuelle

### Ajouter une Absence

1. **Sélection employé** : Choisissez l'employé concerné
2. **Bouton "Ajouter une absence"** : Cliquez sur le bouton + avec bordure pointillée
3. **Formulaire** : Remplissez les informations :
   - **Type d'absence** : Sélectionnez parmi les 5 types disponibles
   - **Date d'absence** : Choisissez la date avec validation minimale
   - **Raison/Commentaire** : Ajoutez un contexte (optionnel)
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
  date: string;
  reason: string;
  type: 'unavailable' | 'reduced' | 'training' | 'sick' | 'vacation';
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

### Backend (Node.js + Express)

```typescript
// Fonction utilitaire pour calculer les dates de la semaine
function getWeekDateRange(weekNumber: number, year: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7;
  const mondayOfWeek = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  
  // Ajustement pour Monday = premier jour
  const dayOfWeek = mondayOfWeek.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  mondayOfWeek.setDate(mondayOfWeek.getDate() + mondayOffset);
  
  return { start: mondayOfWeek, end: sundayOfWeek };
}

// Logique de génération avec prise en compte des absences
const hasUnavailableException = emp.exceptions && emp.exceptions.some(exc => 
  exc.date === dayDateString && 
  (exc.type === 'unavailable' || exc.type === 'sick' || exc.type === 'vacation')
);

const hasReducedHours = emp.exceptions && emp.exceptions.some(exc => 
  exc.date === dayDateString && exc.type === 'reduced'
);
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

### Traitement des Absences

1. **Validation** : Vérification des exceptions par employé
2. **Correspondance dates** : Calcul des dates de la semaine planifiée
3. **Application des règles** :
   - **Absence complète** : Aucun créneau pour la journée
   - **Horaires réduits** : Matin uniquement (8h-12h)
   - **Formation** : Traité comme absence complète

### Logs et Debugging

```typescript
// Logs détaillés pour diagnostic
console.log(`❌ [AI GENERATION] Absence pour ${emp.name} le ${day}: ${dayDateString}`);
console.log(`🔄 [AI GENERATION] Horaires réduits pour ${emp.name} le ${day}`);
```

## 📊 Exemples d'Utilisation

### Cas d'Usage Typiques

1. **Employé malade** :
   - Type : "Arrêt maladie"
   - Date : Jour de l'absence
   - Raison : "Grippe - certificat médical"

2. **Congés programmés** :
   - Type : "Congés"
   - Date : Jour de congé
   - Raison : "Congés annuels"

3. **Formation professionnelle** :
   - Type : "Formation"
   - Date : Jour de formation
   - Raison : "Formation sécurité obligatoire"

4. **Rendez-vous médical** :
   - Type : "Horaires réduits"
   - Date : Jour du rendez-vous
   - Raison : "Rendez-vous médical après-midi"

### Absences Multiples

```typescript
// Exemple d'employé avec plusieurs absences
const employeeWithMultipleAbsences = {
  id: "employee123",
  name: "Marie Dupont",
  exceptions: [
    {
      date: "2025-07-21",
      type: "sick",
      reason: "Grippe"
    },
    {
      date: "2025-07-23",
      type: "reduced",
      reason: "Rendez-vous médical"
    },
    {
      date: "2025-07-25",
      type: "vacation",
      reason: "Congés d'été"
    }
  ]
};
```

## 🚀 Améliorations Futures

### Version 1.8.0 (Q1 2026)

- **📱 Notifications** : Alertes pour conflits d'absences
- **📊 Statistiques** : Tableau de bord des absences
- **🔄 Templates** : Absences récurrentes
- **📅 Intégration calendrier** : Sync avec Google Calendar

### Version 1.9.0 (Q2 2026)

- **🤖 IA prédictive** : Suggestion d'absences probables
- **📈 Analytics** : Tendances d'absences par équipe
- **🔗 Intégrations RH** : Sync avec systèmes RH existants
- **📱 App mobile** : Gestion des absences sur mobile

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

### Configuration

```typescript
// Configuration des types d'absences
const ABSENCE_TYPES = {
  sick: { label: 'Arrêt maladie', color: 'red' },
  vacation: { label: 'Congés', color: 'blue' },
  training: { label: 'Formation', color: 'green' },
  unavailable: { label: 'Indisponible', color: 'gray' },
  reduced: { label: 'Horaires réduits', color: 'orange' }
};
```

## 📚 Ressources Complémentaires

- **[Guide utilisateur](AI_ASSISTANT.md)** : Utilisation complète du wizard IA
- **[API Documentation](API.md)** : Endpoints et schémas
- **[Architecture](ARCHITECTURE.md)** : Vue d'ensemble technique
- **[Développement](DEVELOPMENT.md)** : Configuration locale

---

**📞 Support** : Pour toute question sur la gestion des absences, consultez la documentation ou contactez l'équipe de développement.

**🎯 Objectif** : Simplifier la gestion des absences pour des plannings plus précis et une meilleure satisfaction des employés.