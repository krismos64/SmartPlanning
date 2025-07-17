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
  cy.loginAs('admin@smartplanning.fr', 'admin123')
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