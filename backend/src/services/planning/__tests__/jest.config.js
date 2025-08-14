/**
 * Configuration Jest - Tests AdvancedSchedulingEngine v2.2.1
 * 
 * Configuration optimisée pour les tests de performance du moteur de planification
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Racine du projet
  rootDir: '../../..',
  
  // Patterns de fichiers de test
  testMatch: [
    '**/planning/__tests__/**/*.test.ts',
    '**/planning/__tests__/**/*.test.js'
  ],
  
  // Extensions supportées
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transformation TypeScript
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  
  // Couverture de code
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/planning',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'src/services/planning/**/*.ts',
    '!src/services/planning/**/*.test.ts',
    '!src/services/planning/**/*.d.ts'
  ],
  
  // Seuils de couverture exigés
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/services/planning/generateSchedule.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Setup des tests
  setupFilesAfterEnv: [
    '<rootDir>/src/services/planning/__tests__/setup.ts'
  ],
  
  // Timeout des tests (important pour les benchmarks)
  testTimeout: 30000, // 30s pour les tests de performance
  
  // Variables d'environnement
  setupFiles: ['<rootDir>/src/services/planning/__tests__/env.setup.js'],
  
  // Résolution des modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@planning/(.*)$': '<rootDir>/src/services/planning/$1'
  },
  
  // Reporter personnalisé pour performance
  reporters: [
    'default',
    [
      '<rootDir>/src/services/planning/__tests__/performance.reporter.js',
      {
        outputFile: 'performance-report.json'
      }
    ]
  ],
  
  // Options de performance
  maxWorkers: '50%', // Utilise 50% des CPU disponibles
  
  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Verbose pour debugging
  verbose: true,
  
  // Patterns à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Globals TypeScript
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          strict: true
        }
      }
    }
  }
};