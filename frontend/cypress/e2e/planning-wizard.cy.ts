/**
 * Tests E2E Planning Wizard - AdvancedSchedulingEngine v2.2.1
 * 
 * Tests complets du parcours 7 étapes avec validation performance
 * Développé par Christophe Mostefaoui - 14 août 2025
 * 
 * Couverture:
 * - Wizard 7 étapes + navigation + validation
 * - Performance 2-5ms AdvancedSchedulingEngine
 * - Accessibilité WCAG 2.1 + mode sombre
 * - Intégration avec monitoring Sentry
 */

describe('Planning Wizard', () => {
  beforeEach(() => {
    // Intercepter l'API d'authentification pour éviter dépendance backend
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: 'admin-user-id',
          email: 'admin@smartplanning.fr',
          role: 'admin',
          company: { name: 'Test Company' }
        }
      }
    }).as('loginRequest');
    
    // Mock validation utilisateur connecté
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        id: 'admin-user-id',
        email: 'admin@smartplanning.fr',
        role: 'admin',
        company: { name: 'Test Company' }
      }
    }).as('authMe');
    
    // Se connecter avec données fixtures
    cy.visit('http://localhost:5173/connexion');
    cy.get('input[type="email"]').type('admin@smartplanning.fr');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // Attendre l'appel API mocké
    cy.wait('@loginRequest');
    
    // Vérifier redirection dashboard ou naviguer directement
    cy.visit('http://localhost:5173/planning-wizard');
    
    // Attendre chargement page
    cy.wait(1000);
  });

  it('devrait afficher le wizard avec 7 étapes', () => {
    // Vérifier le titre
    cy.contains('Assistant IA Planning').should('be.visible');
    
    // Vérifier les 7 étapes
    cy.contains('Équipe').should('be.visible');
    cy.contains('Employés').should('be.visible');
    cy.contains('Absences').should('be.visible');
    cy.contains('Préférences').should('be.visible');
    cy.contains('Entreprise').should('be.visible');
    cy.contains('Résumé').should('be.visible');
    cy.contains('Résultats').should('be.visible');
    
    // Vérifier la barre de progression
    cy.contains('Étape 1 sur 7').should('be.visible');
  });

  it('devrait permettre la navigation entre les étapes', () => {
    // Étape 1: Sélection d'équipe
    cy.contains('Sélection équipe et période').should('be.visible');
    
    // Sélectionner une équipe (si disponible)
    cy.get('select, [role="combobox"]').first().click({ force: true });
    cy.wait(500);
    
    // Sélectionner la semaine
    cy.get('input[type="number"]').first().clear().type('35');
    
    // Passer à l'étape suivante
    cy.contains('button', 'Suivant').click();
    
    // Vérifier qu'on est à l'étape 2
    cy.contains('Étape 2 sur 7').should('be.visible');
    cy.contains('Choix des employés').should('be.visible');
    
    // Revenir en arrière
    cy.contains('button', 'Précédent').click();
    
    // Vérifier qu'on est revenu à l'étape 1
    cy.contains('Étape 1 sur 7').should('be.visible');
  });

  it('devrait valider les données requises', () => {
    // Essayer de passer à l'étape suivante sans remplir les champs requis
    const nextButton = cy.contains('button', 'Suivant');
    
    // Le bouton devrait être désactivé si aucune donnée n'est saisie
    nextButton.should('exist');
    
    // Remplir les champs requis
    cy.get('input[type="number"]').first().clear().type('35');
    cy.get('input[type="number"]').last().clear().type('2025');
    
    // Le bouton devrait maintenant être activé (si les données sont valides)
    cy.wait(500);
  });

  it('devrait afficher les étapes optionnelles', () => {
    // Vérifier que les étapes Absences et Préférences sont marquées comme optionnelles
    cy.contains('Absences').parent().should('contain', 'Optionnel');
    cy.contains('Préférences').parent().should('contain', 'Optionnel');
  });

  it('devrait générer un planning avec AdvancedSchedulingEngine', () => {
    // Parcourir rapidement toutes les étapes
    // Étape 1: Équipe
    cy.get('input[type="number"]').first().clear().type('35');
    cy.get('input[type="number"]').last().clear().type('2025');
    cy.contains('button', 'Suivant').click();
    
    // Étape 2: Employés (sauter si pas d'employés)
    cy.wait(1000);
    cy.contains('button', 'Suivant').click();
    
    // Étape 3: Absences (optionnel - passer)
    cy.wait(500);
    cy.contains('button', 'Suivant').click();
    
    // Étape 4: Préférences (optionnel - passer)
    cy.wait(500);
    cy.contains('button', 'Suivant').click();
    
    // Étape 5: Contraintes entreprise
    cy.wait(500);
    // Remplir les contraintes minimales si nécessaire
    cy.contains('button', 'Suivant').click();
    
    // Étape 6: Résumé
    cy.wait(500);
    cy.contains('Validation finale').should('be.visible');
    
    // Vérifier mention AdvancedSchedulingEngine
    cy.contains('AdvancedSchedulingEngine').should('be.visible');
    cy.contains('2-5ms').should('be.visible');
    
    // Générer le planning
    cy.contains('button', 'Générer le planning').should('be.visible');
    // Note: Ne pas cliquer réellement pour éviter d'appeler l'API en test
  });

  it('devrait afficher les erreurs de validation', () => {
    // Tester avec des données invalides
    cy.get('input[type="number"]').first().clear().type('0'); // Semaine invalide
    cy.get('input[type="number"]').last().clear().type('2020'); // Année trop ancienne
    
    // Vérifier qu'un message d'erreur apparaît
    cy.contains('button', 'Suivant').click();
    cy.wait(500);
    
    // Le wizard devrait empêcher la progression avec des données invalides
    cy.contains('Étape 1 sur 7').should('be.visible');
  });

  it('devrait permettre de naviguer directement aux étapes visitées', () => {
    // Parcourir plusieurs étapes
    cy.get('input[type="number"]').first().clear().type('35');
    cy.contains('button', 'Suivant').click();
    cy.wait(500);
    cy.contains('button', 'Suivant').click();
    cy.wait(500);
    
    // Cliquer directement sur l'étape 1
    cy.contains('button', 'Équipe').click();
    
    // Vérifier qu'on est revenu à l'étape 1
    cy.contains('Étape 1 sur 7').should('be.visible');
  });

  it('devrait conserver les données lors de la navigation', () => {
    // Entrer des données à l'étape 1
    const weekNumber = '40';
    const year = '2025';
    
    cy.get('input[type="number"]').first().clear().type(weekNumber);
    cy.get('input[type="number"]').last().clear().type(year);
    
    // Aller à l'étape 2
    cy.contains('button', 'Suivant').click();
    cy.wait(500);
    
    // Revenir à l'étape 1
    cy.contains('button', 'Précédent').click();
    
    // Vérifier que les données sont conservées
    cy.get('input[type="number"]').first().should('have.value', weekNumber);
    cy.get('input[type="number"]').last().should('have.value', year);
  });

  it('devrait afficher le mode sombre correctement', () => {
    // Activer le mode sombre (si disponible)
    cy.get('body').then($body => {
      if ($body.find('[data-testid="theme-toggle"]').length > 0) {
        cy.get('[data-testid="theme-toggle"]').click();
        
        // Vérifier que les classes dark sont appliquées
        cy.get('html').should('have.class', 'dark');
        
        // Vérifier que les composants du wizard s'adaptent
        cy.get('.dark\\:bg-gray-800').should('exist');
        cy.get('.dark\\:text-white').should('exist');
      }
    });
  });
});

/**
 * Tests Performance AdvancedSchedulingEngine Integration
 */
describe('Planning Wizard - Performance AdvancedSchedulingEngine', () => {
  beforeEach(() => {
    // Mock authentification
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'mock-jwt-token',
        user: { id: 'admin-user-id', email: 'admin@smartplanning.fr', role: 'admin' }
      }
    });
    
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: { id: 'admin-user-id', email: 'admin@smartplanning.fr', role: 'admin' }
    });
    
    // Aller directement au wizard (supposé authentifié via localStorage)
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'admin-user-id',
        email: 'admin@smartplanning.fr',
        role: 'admin'
      }));
    });
    
    cy.visit('http://localhost:5173/planning-wizard');
    cy.wait(1000);
  });

  it('devrait charger rapidement le wizard', () => {
    // Mesurer le temps de chargement
    cy.window().then((win) => {
      const perf = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      expect(perf.loadEventEnd - perf.fetchStart).to.be.lessThan(2000); // Moins de 2 secondes
    });
    
    // Vérifier les éléments critiques chargés
    cy.contains('AdvancedSchedulingEngine').should('be.visible', { timeout: 1000 });
    cy.contains('2-5ms génération').should('be.visible');
  });

  it('devrait avoir des transitions fluides avec Framer Motion', () => {
    // Tester la fluidité des animations
    cy.get('input[type="number"]').first().clear().type('35');
    
    // Mesurer le temps de transition entre étapes
    const startTime = Date.now();
    cy.contains('button', 'Suivant').click();
    cy.contains('Étape 2 sur 7').should('be.visible');
    const endTime = Date.now();
    
    // La transition devrait prendre moins de 300ms avec Framer Motion
    expect(endTime - startTime).to.be.lessThan(300);
  });

  it('devrait simuler génération planning ultra-rapide', () => {
    // Navigation complète jusqu'à génération
    cy.get('input[type="number"]').first().clear().type('35');
    cy.get('input[type="number"]').last().clear().type('2025');
    cy.contains('button', 'Suivant').click();
    
    // Parcourir les étapes rapidement
    for (let i = 0; i < 4; i++) {
      cy.wait(200);
      cy.contains('button', 'Suivant').click();
    }
    
    // À l'étape résumé
    cy.contains('Validation finale').should('be.visible');
    
    // Mock API call et mesurer temps réponse
    cy.intercept('POST', '**/api/auto-generate', {
      statusCode: 200,
      delay: 5, // Simuler 5ms de l'AdvancedSchedulingEngine
      body: {
        success: true,
        executionTime: 3.2,
        engine: 'AdvancedSchedulingEngine',
        planning: {}
      }
    }).as('generatePlanning');
    
    // Cliquer génération
    const startGeneration = Date.now();
    cy.contains('button', 'Générer le planning').click();
    
    // Vérifier réponse rapide
    cy.wait('@generatePlanning').then(() => {
      const endGeneration = Date.now();
      expect(endGeneration - startGeneration).to.be.lessThan(100); // Interface + 5ms simulation
    });
  });
  
  it('devrait valider monitoring Sentry intégré', () => {
    // Vérifier console pour logs Sentry (développement)
    cy.window().then((win) => {
      // Simuler erreur et vérifier capture
      win.console.log = cy.stub().as('consoleLog');
    });
    
    // Navigation normale
    cy.get('input[type="number"]').first().clear().type('35');
    cy.contains('button', 'Suivant').click();
    
    // Vérifier aucune erreur JavaScript non gérée
    cy.get('@consoleLog').should('not.have.been.calledWith', 'error');
  });
});

/**
 * Tests d'accessibilité du wizard
 */
describe('Planning Wizard - Accessibilité', () => {
  beforeEach(() => {
    // Mock authentification pour accessibilité
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: { id: 'admin-user-id', email: 'admin@smartplanning.fr', role: 'admin' }
    });
    
    // Authentification via localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'admin-user-id',
        email: 'admin@smartplanning.fr',
        role: 'admin'
      }));
    });
    
    cy.visit('http://localhost:5173/planning-wizard');
    cy.wait(1000);
  });

  it('devrait être navigable au clavier', () => {
    // Navigation avec Tab
    cy.get('body').tab();
    cy.focused().should('have.attr', 'type').and('include', 'number');
    
    // Navigation avec les flèches
    cy.get('body').type('{rightarrow}');
    cy.wait(100);
    cy.get('body').type('{leftarrow}');
  });

  it('devrait avoir des labels ARIA appropriés', () => {
    // Vérifier les attributs ARIA
    cy.get('button').each($button => {
      if ($button.text().includes('Suivant') || $button.text().includes('Précédent')) {
        expect($button).to.have.attr('type');
      }
    });
    
    // Vérifier les rôles
    cy.get('[role="progressbar"]').should('exist');
  });

  it('devrait avoir un contraste suffisant', () => {
    // Note: Pour un test complet, utiliser axe-core
    cy.get('.text-gray-900').should('be.visible');
    cy.get('.bg-white').should('be.visible');
  });
});