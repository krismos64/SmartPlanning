# Système de Gestion des Demandes de Congés - SmartPlanning

## Vue d'ensemble

Le système de gestion des demandes de congés permet aux employés de faire des demandes de congés et aux managers, directeurs et administrateurs de les gérer (approuver, rejeter, modifier, supprimer).

## Architecture

### Backend (API)

#### Modèle VacationRequest

- **Champs principaux** : employeeId, startDate, endDate, reason, status, requestedBy, updatedBy
- **Statuts** : pending, approved, rejected
- **Population** : employé avec photo de profil, utilisateur qui a mis à jour

#### Routes API

1. **GET /api/vacations** - Récupérer les demandes selon le rôle
2. **POST /api/vacations** - Créer une nouvelle demande
3. **GET /api/vacations/:id** - Récupérer une demande spécifique
4. **PUT /api/vacations/:id** - Mettre à jour une demande
5. **DELETE /api/vacations/:id** - Supprimer une demande
6. **PATCH /api/vacations/:id/approve** - Approuver une demande (nouveau)
7. **PATCH /api/vacations/:id/reject** - Rejeter une demande (nouveau)

#### Système de permissions

- **Admin** : Accès total à toutes les demandes
- **Directeur** : Accès aux demandes des employés de son entreprise
- **Manager** : Accès aux demandes des membres de ses équipes
- **Employé** : Accès uniquement à ses propres demandes

### Frontend

#### Structure des composants

1. **VacationsPage.tsx** - Page principale (conservée)
2. **VacationManagement.tsx** - Composants optimisés :
   - `useVacationPermissions` - Hook pour les permissions
   - `VacationActions` - Composant pour actions d'approbation/rejet

#### Fonctionnalités clés

- **Affichage adaptatif** selon le rôle utilisateur
- **Actions contextuelles** : approuver/rejeter avec commentaires
- **Filtres avancés** pour admin/directeur
- **Interface responsive** desktop/mobile
- **Gestion des permissions** granulaire

## Nouvelles fonctionnalités ajoutées

### 1. Approbation/Rejet optimisées

- Routes dédiées `/approve` et `/reject`
- Formulaires de commentaires pour les actions
- Interface utilisateur intuitive avec confirmations

### 2. Photos de profil

- Affichage des photos des employés dans les demandes
- Population automatique dans toutes les routes

### 3. Permissions granulaires

- Hook `useVacationPermissions` pour centraliser la logique
- Affichage conditionnel selon les droits utilisateur
- Actions contextuelles selon le rôle

### 4. Interface améliorée

- Composant `VacationActions` réutilisable
- Formulaires d'approbation/rejet intégrés
- Feedback visuel pour les actions

## Utilisation

### Pour les employés

1. Créer une demande de congé via le formulaire
2. Consulter le statut de leurs demandes
3. Modifier/supprimer les demandes en attente

### Pour les managers/directeurs/admins

1. Consulter toutes les demandes de leur périmètre
2. Approuver/rejeter avec commentaires
3. Modifier les demandes existantes
4. Créer des demandes pour d'autres employés
5. Filtrer et rechercher dans les demandes

## Tests recommandés

### Backend

```bash
# Tester l'approbation
curl -X PATCH http://localhost:5000/api/vacations/[ID]/approve \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Approuvé pour formation"}'

# Tester le rejet
curl -X PATCH http://localhost:5000/api/vacations/[ID]/reject \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Période trop chargée"}'
```

### Frontend

1. Tester avec différents rôles (employee, manager, directeur, admin)
2. Vérifier les permissions d'affichage
3. Tester les actions d'approbation/rejet
4. Valider la responsivité mobile/desktop

## Améliorations futures

1. **Notifications en temps réel** lors des changements de statut
2. **Calendrier visuel** pour voir les congés approuvés
3. **Rapports** et statistiques détaillées
4. **Intégration email** pour les notifications
5. **Validation des conflits** de dates entre employés
6. **Historique des modifications** avec audit trail

## Structure des permissions

| Rôle      | Voir toutes     | Créer pour autres | Approuver/Rejeter | Filtres avancés |
| --------- | --------------- | ----------------- | ----------------- | --------------- |
| Employee  | ❌              | ❌                | ❌                | ❌              |
| Manager   | ✅ (équipes)    | ✅ (équipes)      | ✅                | ❌              |
| Directeur | ✅ (entreprise) | ✅ (entreprise)   | ✅                | ✅ (équipes)    |
| Admin     | ✅              | ✅                | ✅                | ✅              |

Cette implémentation respecte les bonnes pratiques et offre une expérience utilisateur optimale pour tous les rôles.
