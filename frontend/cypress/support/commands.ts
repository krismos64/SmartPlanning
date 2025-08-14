/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<void>
      loginAsAdmin(): Chainable<void>
      loginAsManager(): Chainable<void>
      loginAsEmployee(): Chainable<void>
      waitForPageLoad(): Chainable<void>
      clickWhenVisible(selector: string): Chainable<void>
      typeWhenVisible(selector: string, text: string): Chainable<void>
      goToPlanningWizard(): Chainable<void>
      generatePlanningMock(employeesCount: number, expectedTime: number): Chainable<void>
      validateEnginePerformance(maxTimeMs: number): Chainable<void>
      checkSentryHealth(): Chainable<void>
      tab(): Chainable<void>
    }
  }
}

// Commande pour se connecter avec des identifiants
Cypress.Commands.add('loginAs', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

// Commande pour se connecter en tant qu'admin
Cypress.Commands.add('loginAsAdmin', () => {
  // Mock authentification sans dépendance backend
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
  
  // Authentification via localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'mock-jwt-token');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'admin-user-id',
      email: 'admin@smartplanning.fr',
      role: 'admin'
    }));
  });
})

// Commande pour se connecter en tant que manager
Cypress.Commands.add('loginAsManager', () => {
  cy.loginAs('manager@smartplanning.fr', 'manager123')
})

// Commande pour se connecter en tant qu'employé
Cypress.Commands.add('loginAsEmployee', () => {
  cy.loginAs('employee@smartplanning.fr', 'employee123')
})

// Commande pour attendre le chargement de la page
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
  cy.get('body').should('be.visible')
})

// Commande pour cliquer quand l'élément est visible
Cypress.Commands.add('clickWhenVisible', (selector: string) => {
  cy.get(selector).should('be.visible').click()
})

// Commande pour taper quand l'élément est visible
Cypress.Commands.add('typeWhenVisible', (selector: string, text: string) => {
  cy.get(selector).should('be.visible').type(text)
})

/**
 * Nouvelles commandes AdvancedSchedulingEngine v2.2.1
 */

// Navigation Planning Wizard avec auth
Cypress.Commands.add('goToPlanningWizard', () => {
  cy.loginAsAdmin();
  cy.visit('/planning-wizard');
  
  // Vérifier chargement wizard
  cy.contains('Assistant IA Planning').should('be.visible');
  cy.contains('AdvancedSchedulingEngine').should('be.visible');
  cy.contains('Étape 1 sur 7').should('be.visible');
});

// Mock génération planning avec performance
Cypress.Commands.add('generatePlanningMock', (employeesCount: number, expectedTime: number) => {
  cy.intercept('POST', '**/api/auto-generate', {
    statusCode: 200,
    delay: expectedTime,
    body: {
      success: true,
      executionTime: expectedTime,
      engine: 'AdvancedSchedulingEngine v2.2.1',
      employeesCount,
      planning: {},
      performance: {
        generation_time_ms: expectedTime,
        improvement_vs_ai: 99.97,
        legal_compliance: true
      }
    }
  }).as('generatePlanning');
});

// Validation performance moteur
Cypress.Commands.add('validateEnginePerformance', (maxTimeMs: number) => {
  const startTime = Date.now();
  
  cy.wait('@generatePlanning').then(() => {
    const totalTime = Date.now() - startTime;
    expect(totalTime).to.be.lessThan(maxTimeMs + 50);
    
    cy.contains('Planning généré avec succès').should('be.visible');
    cy.contains('AdvancedSchedulingEngine').should('be.visible');
  });
});

// Health check Sentry
Cypress.Commands.add('checkSentryHealth', () => {
  cy.visit('/monitoring/sentry');
  cy.contains('Sentry Health').should('be.visible');
  cy.contains('AdvancedSchedulingEngine monitoring').should('be.visible');
});

// Navigation clavier
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' });
});