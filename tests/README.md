# Tests de l'API SmartPlanning

Ce dossier contient les scripts de test API déplacés depuis la racine du projet.

## Structure

- `api/` : Tests API JavaScript pour validation des endpoints
  - `test-api-response.js` : Tests de réponse API
  - `test-api.js` : Tests généraux API  
  - `test-planning-validation.js` : Tests de validation des plannings
  - `test-wizard-api.js` : Tests API du Planning Wizard

## Utilisation

Ces scripts sont des tests manuels/utilitaires pour valider l'API en développement :

```bash
# Depuis la racine du projet
cd tests/api
node test-api.js
node test-planning-validation.js
```

## Note

Ces tests sont complémentaires aux tests automatisés :
- Tests backend : `backend/src/__tests__/`
- Tests frontend : `frontend/src/tests/` et `frontend/cypress/`