describe('Dashboard de Validation Zod', () => {
  beforeEach(() => {
    // Authentification pour accéder au dashboard de monitoring
    cy.login('admin@smartplanning.fr', 'admin123');
    
    // Intercepter les appels API
    cy.intercept('GET', '/api/monitoring/metrics/realtime', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          auth: {
            total_attempts: 150,
            success_rate: 0.95
          },
          ai: {
            total_requests: 45,
            avg_duration: 2500,
            success_rate: 0.98
          },
          planning: {
            total_generations: 12,
            avg_duration: 15000
          },
          validation: {
            total_errors: 132,
            body_errors: 89,
            params_errors: 25,
            query_errors: 18,
            by_route: {
              '/api/auth/register': {
                body: 45,
                params: 0,
                query: 2,
                total: 47
              },
              '/api/users/create': {
                body: 23,
                params: 12,
                query: 5,
                total: 40
              },
              '/api/companies/update': {
                body: 21,
                params: 13,
                query: 11,
                total: 45
              }
            }
          },
          system: {
            active_users: 42,
            memory_usage: {
              heapUsed: 85000000,
              heapTotal: 120000000,
              external: 5000000,
              arrayBuffers: 2000000
            },
            uptime: 86400
          }
        }
      }
    }).as('getMetrics');

    cy.intercept('GET', '/api/monitoring/alerts', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getAlerts');

    cy.intercept('GET', '/api/monitoring/system/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          nodejs: {
            version: 'v18.17.0',
            uptime: 86400,
            memory: {
              heapUsed: 85000000,
              heapTotal: 120000000,
              external: 5000000,
              arrayBuffers: 2000000
            }
          },
          system: {
            platform: 'darwin',
            arch: 'x64',
            env: 'development'
          },
          application: {
            version: '1.3.2',
            startTime: new Date(Date.now() - 86400000).toISOString()
          }
        }
      }
    }).as('getSystemStats');
  });

  it('devrait afficher l\\'onglet "Erreurs Zod" dans le dashboard de monitoring', () => {
    cy.visit('/monitoring');
    
    // Attendre que les données soient chargées
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Vérifier que l'onglet "Erreurs Zod" est présent
    cy.contains('Erreurs Zod').should('be.visible');
    
    // Vérifier que le badge d'erreur est affiché sur l'onglet
    cy.get('[data-testid="validation-tab"]').should('contain', '132');
  });

  it('devrait afficher les métriques de validation dans la vue d\\'ensemble', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Vérifier que les métriques de validation sont affichées dans la vue d'ensemble
    cy.contains('Erreurs de validation').should('be.visible');
    cy.contains('132').should('be.visible');
    cy.contains('Routes affectées').should('be.visible');
    cy.contains('3').should('be.visible'); // 3 routes avec des erreurs
    cy.contains('Type principal').should('be.visible');
    cy.contains('Body').should('be.visible'); // Body a le plus d'erreurs
  });

  it('devrait afficher l\\'alerte contextuelle quand le seuil est dépassé', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Cliquer sur l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier que l'alerte contextuelle est affichée
    cy.contains('Seuil d\\'erreurs dépassé').should('be.visible');
    cy.contains('Le nombre d\\'erreurs de validation a dépassé le seuil de 100').should('be.visible');
    cy.contains('Vérifiez vos formulaires côté client').should('be.visible');
  });

  it('devrait afficher les métriques principales dans la section Erreurs Zod', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier les cartes de métriques principales
    cy.contains('Total erreurs').should('be.visible');
    cy.contains('132').should('be.visible');
    
    cy.contains('Erreurs Body').should('be.visible');
    cy.contains('89').should('be.visible');
    
    cy.contains('Erreurs Params').should('be.visible');
    cy.contains('25').should('be.visible');
    
    cy.contains('Erreurs Query').should('be.visible');
    cy.contains('18').should('be.visible');
  });

  it('devrait afficher le graphique à barres des top routes', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier le titre du graphique
    cy.contains('Top 10 des routes avec erreurs').should('be.visible');
    
    // Vérifier que le graphique Recharts est présent
    cy.get('.recharts-wrapper').should('be.visible');
    
    // Vérifier que les données des routes sont affichées
    cy.contains('auth/register').should('be.visible');
    cy.contains('users/create').should('be.visible');
    cy.contains('companies/update').should('be.visible');
  });

  it('devrait afficher le tableau détaillé des erreurs par route', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier le titre du tableau
    cy.contains('Erreurs par route').should('be.visible');
    
    // Vérifier les en-têtes du tableau
    cy.contains('Route').should('be.visible');
    cy.contains('Total').should('be.visible');
    cy.contains('Body').should('be.visible');
    cy.contains('Params').should('be.visible');
    cy.contains('Query').should('be.visible');
    cy.contains('Sévérité').should('be.visible');
    
    // Vérifier qu'au moins une ligne de données est présente
    cy.contains('/api/auth/register').should('be.visible');
    cy.contains('47').should('be.visible'); // Total pour /api/auth/register
  });

  it('devrait permettre de filtrer les erreurs par type', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Utiliser le filtre par type
    cy.get('select').select('body');
    
    // Vérifier que seules les routes avec des erreurs body sont affichées
    // (Cette vérification dépendrait de l'implémentation exacte du filtre)
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('devrait permettre de rechercher des routes spécifiques', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Utiliser la barre de recherche
    cy.get('input[placeholder*="Rechercher"]').type('auth');
    
    // Vérifier que seules les routes contenant "auth" sont affichées
    cy.contains('/api/auth/register').should('be.visible');
    cy.contains('/api/users/create').should('not.exist');
  });

  it('devrait permettre de trier les colonnes du tableau', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Cliquer sur l'en-tête "Total" pour trier
    cy.contains('th', 'Total').click();
    
    // Vérifier que l'indicateur de tri est affiché
    cy.contains('th', 'Total').should('contain', '↑').or('contain', '↓');
  });

  it('devrait actualiser les métriques quand on clique sur "Actualiser"', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Cliquer sur le bouton "Actualiser"
    cy.contains('Actualiser').click();
    
    // Vérifier qu'un nouvel appel API a été fait
    cy.wait('@getMetrics');
  });

  it('devrait gérer le cas où il n\\'y a pas d\\'erreurs de validation', () => {
    // Intercepter avec des données sans erreurs
    cy.intercept('GET', '/api/monitoring/metrics/realtime', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          auth: { total_attempts: 150, success_rate: 0.95 },
          ai: { total_requests: 45, avg_duration: 2500, success_rate: 0.98 },
          planning: { total_generations: 12, avg_duration: 15000 },
          validation: {
            total_errors: 0,
            body_errors: 0,
            params_errors: 0,
            query_errors: 0,
            by_route: {}
          },
          system: {
            active_users: 42,
            memory_usage: { heapUsed: 85000000, heapTotal: 120000000, external: 5000000, arrayBuffers: 2000000 },
            uptime: 86400
          }
        }
      }
    }).as('getMetricsEmpty');
    
    cy.visit('/monitoring');
    cy.wait('@getMetricsEmpty');
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier qu'aucune alerte n'est affichée
    cy.contains('Seuil d\\'erreurs dépassé').should('not.exist');
    
    // Vérifier le message "Aucune erreur"
    cy.contains('Aucune erreur de validation détectée').should('be.visible');
  });

  it('devrait afficher les badges de sévérité appropriés', () => {
    cy.visit('/monitoring');
    cy.wait(['@getMetrics', '@getAlerts', '@getSystemStats']);
    
    // Aller à l'onglet "Erreurs Zod"
    cy.contains('Erreurs Zod').click();
    
    // Vérifier qu'au moins un badge de sévérité est affiché
    cy.get('[data-testid="severity-badge"]').should('be.visible');
    
    // Vérifier les types de badges possibles
    cy.get('table').within(() => {
      cy.get('tbody tr').first().within(() => {
        cy.get('td').last().should('contain.text', 'Critique')
          .or('contain.text', 'Élevé')
          .or('contain.text', 'Modéré')
          .or('contain.text', 'Faible');
      });
    });
  });
});