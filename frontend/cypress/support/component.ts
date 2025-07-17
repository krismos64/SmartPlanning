import './commands'
import '@cypress/code-coverage/support'

// Configuration pour les tests de composants
import { mount } from 'cypress/react18'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)