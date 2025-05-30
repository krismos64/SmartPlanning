# 🤖 Guide : Système IA de Génération de Plannings

## 📋 Vue d'ensemble

Le système IA de SmartPlanning offre deux modes de génération automatique de plannings :

- **Génération Rapide** : Prompt amélioré avec contraintes prédéfinies
- **Génération Assistée** : Conversation interactive avec l'IA pour personnaliser

## 🚀 Nouvelles fonctionnalités

### Backend - Routes API

#### 1. `/api/ai/conversation` (POST)

**Interaction conversationnelle avec l'IA**

```json
{
  "teamId": "string",
  "year": 2024,
  "weekNumber": 45,
  "message": "Je veux optimiser les horaires pour cette semaine",
  "conversationHistory": []
}
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "message": "Réponse de l'IA...",
    "questions": ["Question 1 ?", "Question 2 ?"],
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "needsMoreInfo": true,
    "readyToGenerate": false,
    "conversationHistory": []
  }
}
```

#### 2. `/api/ai/generate-with-context` (POST)

**Génération enrichie avec contexte conversationnel**

```json
{
  "teamId": "string",
  "year": 2024,
  "weekNumber": 45,
  "constraints": ["Contraintes définies via conversation IA"],
  "conversationSummary": "Résumé de l'échange...",
  "additionalRequirements": "Exigences supplémentaires..."
}
```

#### 3. `/api/ai/generate-schedule` (POST) - Amélioré

**Génération rapide avec prompt enrichi**

- Contexte employé détaillé (ancienneté, statut, heures contractuelles)
- Règles techniques précises
- Objectifs de planification clairs
- Conseils d'optimisation

### Frontend - Composants

#### 1. `AIScheduleGeneratorModal`

**Modal principal avec 4 étapes :**

- **Mode** : Sélection génération rapide/assistée
- **Rapide** : Contraintes prédéfinies + notes
- **Conversation** : Chat avec IA + questions suggérées
- **Résumé** : Finalisation avant génération

#### 2. `AITeamSelectorModal`

**Sélection d'équipe et période**

- Liste des équipes disponibles
- Sélection année/semaine
- Validation des données

#### 3. `useAIScheduleModal` Hook

**Gestion d'état centralisée**

```typescript
const aiModal = useAIScheduleModal({
  onScheduleGenerated: (data) => console.log(data),
});
```

## 🎯 Workflow utilisateur

### Génération Rapide

1. Clic sur "Générer avec IA"
2. Sélection équipe + période
3. Choix contraintes prédéfinies
4. Notes optionnelles
5. Génération immédiate

### Génération Assistée

1. Clic sur "Générer avec IA"
2. Sélection équipe + période
3. **Conversation avec l'IA :**
   - L'IA se présente et récapitule l'équipe
   - Pose des questions pour clarifier les besoins
   - Identifie les contraintes manquantes
   - Suggère des optimisations
4. **Résumé final :**
   - Édition du résumé de conversation
   - Ajout d'exigences supplémentaires
5. Génération enrichie

## 🔧 Intégration technique

### Dans une page existante :

```typescript
import { useAIScheduleModal } from '../hooks/useAIScheduleModal';
import AITeamSelectorModal from '../components/modals/AITeamSelectorModal';
import AIScheduleGeneratorModal from '../components/modals/AIScheduleGeneratorModal';

const [isAISelectorOpen, setIsAISelectorOpen] = useState(false);

const aiModal = useAIScheduleModal({
  onScheduleGenerated: (data) => {
    console.log('Planning généré:', data);
    // Actualiser la liste des plannings
  }
});

// Bouton d'ouverture
<Button onClick={() => setIsAISelectorOpen(true)}>
  <Bot className="w-4 h-4 mr-2" />
  Générer avec IA
</Button>

// Modals
<AITeamSelectorModal
  isOpen={isAISelectorOpen}
  onClose={() => setIsAISelectorOpen(false)}
  onTeamSelected={(teamId, teamName, year, weekNumber) => {
    setIsAISelectorOpen(false);
    aiModal.openModal(teamId, teamName, year, weekNumber);
  }}
/>

{aiModal.selectedTeam && (
  <AIScheduleGeneratorModal
    isOpen={aiModal.isOpen}
    onClose={aiModal.closeModal}
    teamId={aiModal.selectedTeam.id}
    teamName={aiModal.selectedTeam.name}
    year={aiModal.selectedWeek.year}
    weekNumber={aiModal.selectedWeek.weekNumber}
    onScheduleGenerated={aiModal.handleScheduleGenerated}
  />
)}
```

## 📊 Améliorations de l'IA

### Contexte enrichi

- **Employés** : Nom, contrat, préférences, ancienneté, statut
- **Équipe** : Taille, total heures contractuelles
- **Période** : Semaine précise avec date de début

### Prompt optimisé

- **Objectifs clairs** : Respect des heures contractuelles, préférences, équité
- **Règles techniques** : Format horaire, pauses, repos légaux
- **Conseils d'optimisation** : Alternance, groupement, chevauchements

### Conversation intelligente

- **Questions pertinentes** : Horaires d'ouverture, charge de travail, événements
- **Suggestions adaptées** : Basées sur l'équipe et les contraintes
- **Historique maintenu** : Continuité de la conversation

## 🎛️ Configuration

### Variables d'environnement

```bash
OPENROUTER_API_KEY=your_api_key_here
```

### Modèle IA utilisé

- **Modèle** : `mistralai/devstral-small:free`
- **Température** : 0.6-0.8 (selon le mode)
- **Format de sortie** : JSON strict

## 🔄 Flux de données

```
1. Utilisateur → Sélection équipe/période
2. Frontend → API /ai/conversation (mode assisté)
3. IA → Questions/suggestions
4. Utilisateur → Réponses/clarifications
5. IA → readyToGenerate: true
6. Frontend → API /ai/generate-with-context
7. IA → Planning optimisé JSON
8. Backend → Sauvegarde GeneratedSchedule
9. Frontend → Affichage/validation
```

## 📈 Métriques et suivi

Les plannings générés incluent :

- **Métadonnées** : Source (conversation/rapide), timestamp, contexte
- **Traçabilité** : Historique des échanges, contraintes appliquées
- **Validation** : Status draft → approuvé/rejeté

## 🎨 Interface utilisateur

### Design system

- **Couleurs** : Dégradé bleu-violet pour l'IA
- **Icônes** : Bot, MessageSquare, Zap, Brain
- **Animations** : Transitions fluides entre étapes
- **Responsive** : Adapté mobile/desktop

### États de l'interface

- **Loading** : Spinner pendant génération
- **Messages** : Toast success/error
- **Questions** : Boutons cliquables
- **Historique** : Bulle de conversation

## 🚀 Prochaines évolutions

1. **Sauvegarde de templates** de conversation
2. **Apprentissage** des préférences utilisateur
3. **Suggestions proactives** basées sur l'historique
4. **Intégration agenda** externe
5. **Optimisation multiéquipes** simultanée

---

**🎯 Le système est maintenant pleinement opérationnel et intégré dans AdminPlanningPage !**
