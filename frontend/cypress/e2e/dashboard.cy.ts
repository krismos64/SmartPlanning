describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/dashboard')
    cy.waitForPageLoad()
  })

  it('should display dashboard content', () => {
    cy.contains('Tableau de bord').should('be.visible')
    cy.get('[data-testid="dashboard-stats"]').should('be.visible')
  })

  it('should display navigation menu', () => {
    cy.get('[data-testid="sidebar-menu"]').should('be.visible')
    cy.contains('Équipes').should('be.visible')
    cy.contains('Employés').should('be.visible')
    cy.contains('Planning').should('be.visible')
  })

  it('should navigate to different sections', () => {
    cy.contains('Équipes').click()
    cy.url().should('include', '/teams')
    
    cy.contains('Employés').click()
    cy.url().should('include', '/employees')
    
    cy.contains('Planning').click()
    cy.url().should('include', '/planning')
  })

  it('should display user profile in header', () => {
    cy.get('[data-testid="user-profile"]').should('be.visible')
    cy.get('[data-testid="user-profile"]').click()
    cy.contains('Profil').should('be.visible')
    cy.contains('Déconnexion').should('be.visible')
  })

  it('should logout successfully', () => {
    cy.get('[data-testid="user-profile"]').click()
    cy.contains('Déconnexion').click()
    cy.url().should('include', '/login')
  })
})