describe('Employee Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/employees')
    cy.waitForPageLoad()
  })

  it('should display employees list', () => {
    cy.contains('Gestion des employés').should('be.visible')
    cy.get('[data-testid="employees-table"]').should('be.visible')
  })

  it('should create new employee', () => {
    cy.get('[data-testid="add-employee-btn"]').click()
    cy.get('[data-testid="employee-modal"]').should('be.visible')
    
    cy.get('input[name="firstName"]').type('Jean')
    cy.get('input[name="lastName"]').type('Dupont')
    cy.get('input[name="email"]').type('jean.dupont@example.com')
    cy.get('select[name="role"]').select('employee')
    cy.get('select[name="team"]').select('Équipe Development')
    
    cy.get('button[type="submit"]').click()
    cy.contains('Employé créé avec succès').should('be.visible')
  })

  it('should search employees', () => {
    cy.get('[data-testid="search-input"]').type('Jean')
    cy.get('[data-testid="employee-row"]').should('contain', 'Jean')
  })

  it('should edit employee', () => {
    cy.get('[data-testid="edit-employee-btn"]').first().click()
    cy.get('[data-testid="employee-modal"]').should('be.visible')
    
    cy.get('input[name="firstName"]').clear().type('Jean-Pierre')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Employé modifié avec succès').should('be.visible')
  })

  it('should delete employee', () => {
    cy.get('[data-testid="delete-employee-btn"]').first().click()
    cy.get('[data-testid="confirm-modal"]').should('be.visible')
    
    cy.get('button[data-testid="confirm-delete"]').click()
    cy.contains('Employé supprimé avec succès').should('be.visible')
  })

  it('should export employees list', () => {
    cy.get('[data-testid="export-btn"]').click()
    cy.get('[data-testid="export-modal"]').should('be.visible')
    
    cy.get('select[name="format"]').select('PDF')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Export en cours').should('be.visible')
  })
})