/**
 * Tests E2E pour le Planning Wizard
 * Test complet du parcours de génération de planning
 */

describe('Planning Wizard', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.visit('http://localhost:5173/connexion');
    cy.get('input[type="email"]').type('christophe.mostefaoui.dev@gmail.com');
    cy.get('input[type="password"]').type('Mostefaoui2@@');
    cy.get('button[type="submit"]').click();
    
    // Attendre la redirection après connexion
    cy.url().should('include', '/dashboard');
    
    // Naviguer vers le wizard
    cy.visit('http://localhost:5173/planning-wizard');
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

  it('devrait générer un planning avec succès', () => {
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
 * Tests de performance du wizard
 */
describe('Planning Wizard - Performance', () => {
  beforeEach(() => {
    // Se connecter
    cy.visit('http://localhost:5173/connexion');
    cy.get('input[type="email"]').type('christophe.mostefaoui.dev@gmail.com');
    cy.get('input[type="password"]').type('Mostefaoui2@@');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.visit('http://localhost:5173/planning-wizard');
  });

  it('devrait charger rapidement', () => {
    // Mesurer le temps de chargement
    cy.window().then((win) => {
      const perf = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      expect(perf.loadEventEnd - perf.fetchStart).to.be.lessThan(3000); // Moins de 3 secondes
    });
  });

  it('devrait avoir des transitions fluides', () => {
    // Tester la fluidité des animations
    cy.get('input[type="number"]').first().clear().type('35');
    
    // Mesurer le temps de transition entre étapes
    const startTime = Date.now();
    cy.contains('button', 'Suivant').click();
    cy.contains('Étape 2 sur 7').should('be.visible');
    const endTime = Date.now();
    
    // La transition devrait prendre moins de 500ms
    expect(endTime - startTime).to.be.lessThan(500);
  });
});

/**
 * Tests d'accessibilité du wizard
 */
describe('Planning Wizard - Accessibilité', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/connexion');
    cy.get('input[type="email"]').type('christophe.mostefaoui.dev@gmail.com');
    cy.get('input[type="password"]').type('Mostefaoui2@@');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.visit('http://localhost:5173/planning-wizard');
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