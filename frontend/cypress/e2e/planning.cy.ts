describe('Planning Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/planning')
    cy.waitForPageLoad()
  })

  it('should display planning interface', () => {
    cy.contains('Planning').should('be.visible')
    cy.get('[data-testid="planning-calendar"]').should('be.visible')
  })

  it('should create new schedule', () => {
    cy.get('[data-testid="create-schedule-btn"]').click()
    cy.get('[data-testid="schedule-modal"]').should('be.visible')
    
    cy.get('input[name="title"]').type('Planning Test')
    cy.get('select[name="team"]').select('Équipe Development')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Planning créé avec succès').should('be.visible')
  })

  it('should filter schedules by team', () => {
    cy.get('[data-testid="team-filter"]').select('Équipe Development')
    cy.get('[data-testid="schedule-item"]').should('contain', 'Development')
  })

  it('should display schedule details', () => {
    cy.get('[data-testid="schedule-item"]').first().click()
    cy.get('[data-testid="schedule-details"]').should('be.visible')
    cy.contains('Détails du planning').should('be.visible')
  })

  it('should generate AI schedule', () => {
    cy.get('[data-testid="ai-generate-btn"]').click()
    cy.get('[data-testid="ai-modal"]').should('be.visible')
    
    cy.get('textarea[name="requirements"]').type('Générer un planning optimisé pour 5 employés')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Génération en cours').should('be.visible')
  })
})