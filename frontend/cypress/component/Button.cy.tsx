import { Button } from '../../src/components/ui/Button'

describe('Button Component', () => {
  it('should render button with text', () => {
    cy.mount(<Button>Click me</Button>)
    cy.get('button').should('contain', 'Click me')
  })

  it('should handle click events', () => {
    const onClick = cy.stub().as('onClick')
    cy.mount(<Button onClick={onClick}>Click me</Button>)
    
    cy.get('button').click()
    cy.get('@onClick').should('have.been.called')
  })

  it('should render different variants', () => {
    cy.mount(<Button variant="primary">Primary</Button>)
    cy.get('button').should('have.class', 'bg-blue-600')
    
    cy.mount(<Button variant="secondary">Secondary</Button>)
    cy.get('button').should('have.class', 'bg-gray-600')
    
    cy.mount(<Button variant="danger">Danger</Button>)
    cy.get('button').should('have.class', 'bg-red-600')
  })

  it('should handle disabled state', () => {
    cy.mount(<Button disabled>Disabled</Button>)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'opacity-50')
  })

  it('should render loading state', () => {
    cy.mount(<Button loading>Loading</Button>)
    cy.get('button').should('be.disabled')
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
  })

  it('should render different sizes', () => {
    cy.mount(<Button size="small">Small</Button>)
    cy.get('button').should('have.class', 'px-3 py-1')
    
    cy.mount(<Button size="medium">Medium</Button>)
    cy.get('button').should('have.class', 'px-4 py-2')
    
    cy.mount(<Button size="large">Large</Button>)
    cy.get('button').should('have.class', 'px-6 py-3')
  })
})