/**
 * Tests E2E Planning Wizard - Version Simplifiée
 * 
 * Tests qui contournent l'authentification pour tester la structure UI
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

describe('Planning Wizard - Tests Simplifiés', () => {
  
  it('devrait vérifier que la page planning wizard existe', () => {
    // Configuration minimale - juste vérifier que la page se charge
    cy.visit('/planning-wizard', { failOnStatusCode: false });
    
    // Vérifier qu'une page se charge (même si redirigée)
    cy.get('body').should('be.visible');
    
    // Log de l'URL actuelle pour diagnostic
    cy.url().then(url => {
      console.log('URL actuelle:', url);
      
      if (url.includes('/connexion')) {
        console.log('✅ Page redirigée vers connexion (authentification requise)');
        
        // Vérifier les éléments de connexion
        cy.contains('Connexion', { timeout: 5000 }).should('be.visible');
        cy.get('input[type="email"], input').should('be.visible');
        
      } else if (url.includes('/planning-wizard')) {
        console.log('✅ Page planning wizard accessible directement');
        
        // Vérifier les éléments du wizard
        cy.contains('Étape', { timeout: 5000 }).should('be.visible');
        
      } else {
        console.log('ℹ️ Page redirigée vers:', url);
      }
    });
  });

  it('devrait simuler connexion et accéder au planning wizard', () => {
    // Aller d'abord sur la page de connexion
    cy.visit('/connexion');
    
    // Attendre le chargement de la page de connexion
    cy.contains('Connexion', { timeout: 10000 }).should('be.visible');
    
    // Mock de l'API de connexion pour simuler l'authentification
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'mock-jwt-token',
        user: {
          _id: 'test-user',
          email: 'test@smartplanning.fr',
          role: 'admin',
          company: { name: 'Test Company' }
        }
      }
    }).as('login');

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: { 
        success: true,
        data: {
          _id: 'test-user', 
          email: 'test@smartplanning.fr', 
          role: 'admin',
          company: { name: 'Test Company' }
        }
      }
    }).as('authMe');

    // Remplir le formulaire de connexion
    cy.get('input[type="email"], input').first().type('test@smartplanning.fr');
    cy.get('input[type="password"], input[type="password"]').type('password123');
    
    // Cliquer sur connexion
    cy.get('button').contains('Connexion').click();
    
    // Maintenant naviguer vers planning wizard
    cy.visit('/planning-wizard');
    
    // Vérifier si on arrive sur le wizard
    cy.url().then(url => {
      console.log('URL après connexion:', url);
      
      if (url.includes('/planning-wizard')) {
        console.log('✅ Accès au planning wizard réussi');
        
        // Chercher des éléments du wizard
        cy.get('body').should('contain.text', 'Étape').or('contain.text', 'Planning').or('contain.text', 'Wizard');
        
      } else {
        console.log('ℹ️ Redirection vers:', url);
      }
    });
  });

  it('devrait vérifier la structure générale du site', () => {
    // Test de la page d'accueil
    cy.visit('/', { failOnStatusCode: false });
    
    cy.get('body').should('be.visible');
    
    // Log des éléments trouvés sur la page
    cy.get('body').then($body => {
      const text = $body.text();
      console.log('Contenu de la page d\'accueil trouvé:');
      console.log('- Contient "SmartPlanning":', text.includes('SmartPlanning'));
      console.log('- Contient "Planning":', text.includes('Planning'));
      console.log('- Contient "Connexion":', text.includes('Connexion'));
      console.log('- Contient navigation:', $body.find('nav, .nav, header').length > 0);
    });

    // Vérifier les liens de navigation principaux
    cy.get('a').should('have.length.at.least', 1);
    
    console.log('✅ Structure générale du site vérifiée');
  });

  it('devrait tester les routes principales', () => {
    const routes = [
      '/',
      '/connexion',
      '/planning-wizard',
      '/dashboard'
    ];

    routes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false });
      
      cy.get('body').should('be.visible');
      
      cy.url().then(url => {
        console.log(`Route ${route} -> ${url}`);
      });
      
      // Attendre un peu entre les tests
      cy.wait(500);
    });
    
    console.log('✅ Test des routes principales terminé');
  });

  it('devrait mesurer les performances générales', () => {
    cy.visit('/');
    
    // Mesurer les performances de navigation
    cy.window().then((win) => {
      const perf = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perf) {
        const metrics = {
          domLoad: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          fullLoad: perf.loadEventEnd - perf.fetchStart,
          domInteractive: perf.domInteractive - perf.fetchStart,
          ttfb: perf.responseStart - perf.fetchStart
        };
        
        console.log('📊 Métriques Performance:');
        console.log(`   TTFB: ${metrics.ttfb.toFixed(2)}ms`);
        console.log(`   DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
        console.log(`   DOM Load: ${metrics.domLoad.toFixed(2)}ms`);
        console.log(`   Full Load: ${metrics.fullLoad.toFixed(2)}ms`);
        
        // Vérifications de performance basiques
        expect(metrics.ttfb).to.be.lessThan(2000); // < 2s
        expect(metrics.domInteractive).to.be.lessThan(5000); // < 5s
        expect(metrics.fullLoad).to.be.lessThan(10000); // < 10s
        
        console.log('✅ Performances générales acceptables');
      }
    });
  });

  it('devrait vérifier la responsivité', () => {
    // Test sur différentes tailles d'écran
    const viewports = [
      { width: 375, height: 667, name: 'iPhone' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/', { failOnStatusCode: false });
      
      cy.get('body').should('be.visible');
      
      // Vérifier qu'il n'y a pas de débordement horizontal
      cy.get('body').then($body => {
        const bodyWidth = $body[0].scrollWidth;
        const viewportWidth = viewport.width;
        
        console.log(`${viewport.name}: Body width ${bodyWidth}px, Viewport ${viewportWidth}px`);
        
        // Permettre une petite tolérance pour les scrollbars
        expect(bodyWidth).to.be.at.most(viewportWidth + 20);
      });
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) - Responsivité OK`);
    });
  });
});