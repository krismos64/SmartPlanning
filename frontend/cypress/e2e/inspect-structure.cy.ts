/**
 * Test d'Inspection Structure Frontend - SmartPlanning
 * 
 * Découvrir la vraie structure HTML/React pour adapter les tests
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

describe('Inspection Structure SmartPlanning', () => {
  beforeEach(() => {
    // Mock auth minimal
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@smartplanning.fr',
        role: 'admin'
      }));
    });

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: { id: 'test-user', email: 'test@smartplanning.fr', role: 'admin' }
    });
  });

  it('devrait inspecter la page d\'accueil', () => {
    cy.visit('/');
    cy.wait(2000);

    // Capturer et logger la structure
    cy.get('body').then(($body) => {
      console.log('=== STRUCTURE PAGE D\'ACCUEIL ===');
      console.log('URL actuelle:', Cypress.config('baseUrl'));
      console.log('Titre page:', $body.find('title').text() || document.title);
      
      // Navigation / Header
      const nav = $body.find('nav, header, [role="navigation"]');
      if (nav.length > 0) {
        console.log('Navigation trouvée:', nav.length, 'éléments');
        nav.each((i, el) => {
          console.log(`Nav ${i}:`, el.textContent?.slice(0, 100));
        });
      }

      // Liens principaux
      const links = $body.find('a[href*="planning"], a[href*="wizard"]');
      if (links.length > 0) {
        console.log('Liens planning trouvés:');
        links.each((i, el) => {
          console.log(`- ${el.textContent} -> ${el.getAttribute('href')}`);
        });
      }

      // Boutons principaux  
      const buttons = $body.find('button');
      console.log(`Boutons trouvés: ${buttons.length}`);
      buttons.slice(0, 5).each((i, el) => {
        console.log(`Button ${i}: "${el.textContent?.trim()}"`);
      });
    });
  });

  it('devrait inspecter les routes disponibles', () => {
    const routes = [
      '/',
      '/connexion',
      '/dashboard', 
      '/planning-wizard',
      '/planning',
      '/employees',
      '/admin'
    ];

    routes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false });
      cy.wait(1000);

      cy.url().then(url => {
        console.log(`=== ROUTE: ${route} ===`);
        console.log('URL finale:', url);
        
        // Vérifier si accessible
        cy.get('body').then($body => {
          const hasError = $body.text().includes('404') || 
                          $body.text().includes('Not Found') ||
                          $body.text().includes('Erreur');
          
          if (hasError) {
            console.log(`❌ Route ${route}: Erreur/404`);
          } else {
            console.log(`✅ Route ${route}: Accessible`);
            
            // Capturer éléments clés
            const title = $body.find('h1, h2, .title').first().text();
            console.log('Titre principal:', title);
            
            const forms = $body.find('form, input, select');
            console.log('Formulaires:', forms.length, 'éléments');
          }
        });
      });
    });
  });

  it('devrait inspecter Planning Wizard spécifiquement', () => {
    cy.visit('/planning-wizard', { failOnStatusCode: false });
    cy.wait(2000);

    cy.get('body').then($body => {
      console.log('=== PLANNING WIZARD INSPECTION ===');
      
      // Structure générale
      console.log('Page title:', document.title);
      console.log('Body classes:', $body.attr('class'));
      
      // Rechercher éléments wizard
      const wizardElements = $body.find('[class*="wizard"], [class*="step"], [data-testid*="wizard"]');
      console.log('Éléments wizard trouvés:', wizardElements.length);
      
      // Inputs disponibles
      const inputs = $body.find('input');
      console.log(`=== INPUTS (${inputs.length} trouvés) ===`);
      inputs.each((i, el) => {
        const $el = Cypress.$(el);
        console.log(`Input ${i}:`, {
          type: $el.attr('type'),
          name: $el.attr('name'),
          placeholder: $el.attr('placeholder'),
          className: $el.attr('class'),
          id: $el.attr('id')
        });
      });

      // Selects disponibles
      const selects = $body.find('select');
      console.log(`=== SELECTS (${selects.length} trouvés) ===`);
      selects.each((i, el) => {
        const $el = Cypress.$(el);
        console.log(`Select ${i}:`, {
          name: $el.attr('name'),
          className: $el.attr('class'),
          options: $el.find('option').length
        });
      });

      // Boutons disponibles
      const buttons = $body.find('button');
      console.log(`=== BUTTONS (${buttons.length} trouvés) ===`);
      buttons.each((i, el) => {
        const $el = Cypress.$(el);
        console.log(`Button ${i}:`, {
          text: $el.text().trim(),
          type: $el.attr('type'),
          className: $el.attr('class'),
          disabled: $el.attr('disabled')
        });
      });

      // Textes mentionnant AdvancedSchedulingEngine
      const bodyText = $body.text();
      const hasAdvanced = bodyText.includes('AdvancedScheduling') || 
                         bodyText.includes('Advanced') ||
                         bodyText.includes('Engine');
      console.log('Mentions AdvancedSchedulingEngine:', hasAdvanced);
      
      // Textes en français
      const frenchTerms = ['Étape', 'Suivant', 'Précédent', 'Générer', 'Planning', 'Employé'];
      console.log('=== TERMES FRANÇAIS DÉTECTÉS ===');
      frenchTerms.forEach(term => {
        const found = bodyText.includes(term);
        console.log(`"${term}":`, found ? '✅' : '❌');
      });
    });
  });

  it('devrait inspecter les appels API réels', () => {
    // Intercepter et logger tous appels API
    cy.intercept('**', (req) => {
      console.log('=== API CALL ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      
      // Laisser passer ou retourner mock
      req.continue();
    }).as('allAPICalls');

    cy.visit('/planning-wizard', { failOnStatusCode: false });
    cy.wait(3000);

    // Tenter quelques interactions basiques
    cy.get('input').first().then($input => {
      if ($input.length > 0) {
        cy.wrap($input).click();
        cy.wait(500);
        
        if ($input.attr('type') === 'text' || $input.attr('type') === 'number') {
          cy.wrap($input).clear().type('test');
        }
      }
    });

    cy.get('button').first().then($button => {
      if ($button.length > 0 && !$button.attr('disabled')) {
        cy.wrap($button).click({ force: true });
        cy.wait(1000);
      }
    });

    // Logger calls API interceptés
    cy.get('@allAPICalls.all').then((calls) => {
      console.log(`=== ${calls.length} APPELS API INTERCEPTÉS ===`);
      calls.forEach((call, i) => {
        console.log(`${i + 1}. ${call.request.method} ${call.request.url}`);
      });
    });
  });

  it('devrait examiner la console pour erreurs', () => {
    cy.visit('/planning-wizard', { failOnStatusCode: false });
    
    // Capturer erreurs console
    cy.window().then((win) => {
      const originalError = win.console.error;
      const originalWarn = win.console.warn;
      
      const errors = [];
      const warnings = [];
      
      win.console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(win.console, args);
      };
      
      win.console.warn = (...args) => {
        warnings.push(args.join(' '));
        originalWarn.apply(win.console, args);
      };
      
      // Attendre puis analyser
      cy.wait(3000).then(() => {
        console.log('=== ERREURS CONSOLE ===');
        console.log('Erreurs:', errors.length);
        errors.forEach((err, i) => {
          console.log(`Error ${i + 1}:`, err);
        });
        
        console.log('=== WARNINGS CONSOLE ===');
        console.log('Warnings:', warnings.length);
        warnings.forEach((warn, i) => {
          console.log(`Warning ${i + 1}:`, warn);
        });
      });
    });
  });
});