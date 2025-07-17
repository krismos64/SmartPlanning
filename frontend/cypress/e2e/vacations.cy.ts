describe('Vacation Management', () => {
  beforeEach(() => {
    cy.loginAsEmployee()
    cy.visit('/vacations')
    cy.waitForPageLoad()
  })

  it('should display vacation page', () => {
    cy.contains('Gestion des congés').should('be.visible')
    cy.get('[data-testid="vacation-stats"]').should('be.visible')
  })

  it('should create vacation request', () => {
    cy.get('[data-testid="request-vacation-btn"]').click()
    cy.get('[data-testid="vacation-modal"]').should('be.visible')
    
    cy.get('input[name="startDate"]').type('2024-08-01')
    cy.get('input[name="endDate"]').type('2024-08-15')
    cy.get('select[name="type"]').select('Congés payés')
    cy.get('textarea[name="reason"]').type('Vacances d\'été')
    
    cy.get('button[type="submit"]').click()
    cy.contains('Demande de congé créée').should('be.visible')
  })

  it('should display vacation history', () => {
    cy.get('[data-testid="vacation-history"]').should('be.visible')
    cy.get('[data-testid="vacation-request"]').should('exist')
  })

  it('should filter vacation requests', () => {
    cy.get('[data-testid="status-filter"]').select('En attente')
    cy.get('[data-testid="vacation-request"]').should('contain', 'En attente')
  })

  it('should cancel vacation request', () => {
    cy.get('[data-testid="cancel-vacation-btn"]').first().click()
    cy.get('[data-testid="confirm-modal"]').should('be.visible')
    
    cy.get('button[data-testid="confirm-cancel"]').click()
    cy.contains('Demande annulée').should('be.visible')
  })

  context('Manager view', () => {
    beforeEach(() => {
      cy.loginAsManager()
      cy.visit('/vacations')
      cy.waitForPageLoad()
    })

    it('should approve vacation request', () => {
      cy.get('[data-testid="approve-vacation-btn"]').first().click()
      cy.get('[data-testid="approve-modal"]').should('be.visible')
      
      cy.get('textarea[name="comment"]').type('Approuvé pour les vacances d\'été')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Demande approuvée').should('be.visible')
    })

    it('should reject vacation request', () => {
      cy.get('[data-testid="reject-vacation-btn"]').first().click()
      cy.get('[data-testid="reject-modal"]').should('be.visible')
      
      cy.get('textarea[name="comment"]').type('Période trop chargée')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Demande rejetée').should('be.visible')
    })
  })
})