import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshot: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Setup code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      // Environment-specific configuration
      if (config.env.CI) {
        config.video = false;
        config.defaultCommandTimeout = 20000;
      }
      
      return config;
    },
    env: {
      // Test users
      ADMIN_EMAIL: 'christophe.mostefaoui.dev@gmail.com',
      ADMIN_PASSWORD: 'Mostefaoui2@@',
      
      // API endpoints
      API_URL: 'http://localhost:5050/api',
      
      // Feature flags for testing
      ADVANCED_SCHEDULING_ENGINE: true,
      SENTRY_MONITORING: true,
      PERFORMANCE_TESTING: true
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720
  },

  // Global configuration
  retries: {
    runMode: 2,
    openMode: 0
  },
  
  // Test isolation
  testIsolation: true,
  
  // Performance
  numTestsKeptInMemory: 10,
  
  // Security
  chromeWebSecurity: false,
  
  // Folders
  fixturesFolder: 'cypress/fixtures',
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots'
});