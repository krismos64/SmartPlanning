import { Modal } from '../../src/components/ui/Modal'

describe('Modal Component', () => {
  it('should render modal when open', () => {
    cy.mount(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('[data-testid="modal-overlay"]').should('be.visible')
    cy.get('[data-testid="modal-content"]').should('contain', 'Modal content')
  })

  it('should not render modal when closed', () => {
    cy.mount(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('[data-testid="modal-overlay"]').should('not.exist')
  })

  it('should call onClose when clicking overlay', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('[data-testid="modal-overlay"]').click()
    cy.get('@onClose').should('have.been.called')
  })

  it('should call onClose when pressing escape', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('body').type('{esc}')
    cy.get('@onClose').should('have.been.called')
  })

  it('should not close when clicking modal content', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('[data-testid="modal-content"]').click()
    cy.get('@onClose').should('not.have.been.called')
  })

  it('should render close button', () => {
    const onClose = cy.stub().as('onClose')
    cy.mount(
      <Modal isOpen={true} onClose={onClose} showCloseButton={true}>
        <div>Modal content</div>
      </Modal>
    )
    
    cy.get('[data-testid="modal-close-btn"]').should('be.visible')
    cy.get('[data-testid="modal-close-btn"]').click()
    cy.get('@onClose').should('have.been.called')
  })
})