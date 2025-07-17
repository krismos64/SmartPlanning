# Tests E2E et Couverture de Code - Frontend SmartPlanning

## Vue d'ensemble

Ce projet utilise **Cypress** pour les tests End-to-End (E2E) et les tests de composants, avec une couverture de code intégrée via **Istanbul/NYC**.

## Structure des tests

```
cypress/
├── e2e/                    # Tests E2E
│   ├── auth.cy.ts         # Tests d'authentification
│   ├── dashboard.cy.ts    # Tests du tableau de bord
│   ├── employees.cy.ts    # Tests gestion employés
│   ├── planning.cy.ts     # Tests gestion planning
│   └── vacations.cy.ts    # Tests gestion congés
├── component/             # Tests de composants
│   ├── Button.cy.tsx      # Tests du composant Button
│   └── Modal.cy.tsx       # Tests du composant Modal
├── fixtures/              # Données de test
│   └── users.json         # Utilisateurs de test
└── support/               # Configuration et commandes
    ├── commands.ts        # Commandes Cypress personnalisées
    ├── e2e.ts            # Configuration E2E
    └── component.ts       # Configuration composants
```

## Scripts disponibles

### Tests E2E
```bash
# Ouvrir Cypress en mode interactif
npm run cypress:open

# Exécuter tous les tests E2E
npm run test:e2e

# Ouvrir seulement les tests E2E
npm run test:e2e:open

# Exécuter Cypress en mode headless
npm run cypress:run
```

### Tests de composants
```bash
# Exécuter les tests de composants
npm run test:component

# Ouvrir les tests de composants en mode interactif
npm run test:component:open
```

### Tests unitaires et couverture
```bash
# Exécuter les tests unitaires
npm run test

# Tests unitaires en mode watch
npm run test:watch

# Tests avec couverture de code
npm run test:coverage

# Exécuter tous les tests (unitaires + E2E)
npm run test:all
```

### Rapports de couverture
```bash
# Générer le rapport de couverture
npm run coverage:report

# Ouvrir le rapport de couverture dans le navigateur
npm run coverage:open
```

## Configuration

### Cypress (cypress.config.ts)
- **Base URL**: `http://localhost:5173`
- **Viewport**: 1280x720
- **Timeouts**: 10 secondes
- **Vidéos et screenshots**: Activés
- **Couverture de code**: Intégrée via `@cypress/code-coverage`

### Couverture de code (.nycrc.json)
- **Seuils de couverture**:
  - Lignes: 70%
  - Fonctions: 70%
  - Branches: 60%
  - Statements: 70%
- **Formats de rapport**: HTML, Text, JSON, LCOV
- **Dossier de sortie**: `coverage/`

## Commandes personnalisées

### Authentification
```typescript
// Se connecter avec des identifiants
cy.loginAs('email@example.com', 'password')

// Se connecter en tant qu'admin
cy.loginAsAdmin()

// Se connecter en tant que manager
cy.loginAsManager()

// Se connecter en tant qu'employé
cy.loginAsEmployee()
```

### Utilitaires
```typescript
// Attendre le chargement de la page
cy.waitForPageLoad()

// Cliquer quand l'élément est visible
cy.clickWhenVisible('[data-testid="button"]')

// Taper quand l'élément est visible
cy.typeWhenVisible('input[name="email"]', 'test@example.com')
```

## Données de test

### Utilisateurs (cypress/fixtures/users.json)
```json
{
  "admin": {
    "email": "admin@smartplanning.fr",
    "password": "admin123",
    "role": "admin"
  },
  "manager": {
    "email": "manager@smartplanning.fr",
    "password": "manager123", 
    "role": "manager"
  },
  "employee": {
    "email": "employee@smartplanning.fr",
    "password": "employee123",
    "role": "employee"
  }
}
```

## Bonnes pratiques

### Structure des tests
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Configuration avant chaque test
    cy.loginAsAdmin()
    cy.visit('/page')
    cy.waitForPageLoad()
  })

  it('should do something', () => {
    // Test logic
  })
})
```

### Sélecteurs
- Utiliser `data-testid` pour les éléments de test
- Éviter les sélecteurs CSS fragiles
- Préférer les sélecteurs sémantiques

### Assertions
```typescript
// Vérifier la visibilité
cy.get('[data-testid="element"]').should('be.visible')

// Vérifier le contenu
cy.contains('Expected text').should('be.visible')

// Vérifier l'URL
cy.url().should('include', '/expected-path')
```

## Intégration CI/CD

### GitHub Actions
```yaml
- name: Run E2E tests
  run: |
    npm run build
    npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Scripts de vérification
```bash
# Vérifier que tous les tests passent
npm run test:all

# Vérifier la couverture de code
npm run test:coverage
```

## Dépannage

### Problèmes courants

1. **Tests qui échouent par intermittence**
   - Augmenter les timeouts
   - Utiliser `cy.wait()` avec parcimonie
   - Vérifier les conditions d'attente

2. **Couverture de code incomplète**
   - Vérifier la configuration Istanbul
   - S'assurer que les fichiers sont instrumentés
   - Vérifier les exclusions dans `.nycrc.json`

3. **Problèmes de viewport**
   - Ajuster `viewportWidth` et `viewportHeight`
   - Tester sur différentes résolutions

### Debugging
```typescript
// Pause et inspection
cy.pause()
cy.debug()

// Logs détaillés
cy.log('Message de debug')

// Screenshots
cy.screenshot('nom-du-screenshot')
```

## Métriques et rapports

### Couverture de code
- Rapport HTML: `coverage/index.html`
- Rapport texte affiché dans la console
- Rapport LCOV pour les outils CI/CD

### Métriques Cypress
- Temps d'exécution des tests
- Taux de réussite/échec
- Vidéos et screenshots des échecs

## Maintenance

### Mise à jour des dépendances
```bash
npm update cypress @cypress/code-coverage
```

### Nettoyage
```bash
# Nettoyer les rapports
rm -rf coverage cypress/videos cypress/screenshots

# Nettoyer le cache Cypress
npx cypress cache clear
```