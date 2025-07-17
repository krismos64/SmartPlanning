describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Identifiants invalides').should('be.visible')
  })

  it('should redirect to register page', () => {
    cy.contains('Créer un compte').click()
    cy.url().should('include', '/register')
  })

  it('should redirect to forgot password page', () => {
    cy.contains('Mot de passe oublié').click()
    cy.url().should('include', '/forgot-password')
  })

  it('should login successfully with valid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[type="email"]').type(users.admin.email)
      cy.get('input[type="password"]').type(users.admin.password)
      cy.get('button[type="submit"]').click()
      
      cy.url().should('not.include', '/login')
      cy.url().should('include', '/dashboard')
    })
  })
})