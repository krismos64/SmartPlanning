import './commands'
import '@cypress/code-coverage/support'

// Désactiver les erreurs de type uncaught exception qui peuvent survenir lors des tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorer les erreurs de type ResizeObserver loop limit exceeded
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  // Ignorer les erreurs de type Non-Error promise rejection
  if (err.message.includes('Non-Error promise rejection')) {
    return false
  }
  return true
})

// Configuration pour les tests E2E
beforeEach(() => {
  // Nettoyer le localStorage avant chaque test
  cy.clearLocalStorage()
  // Nettoyer les cookies
  cy.clearCookies()
})