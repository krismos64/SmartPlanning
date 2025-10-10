/**
 * Configuration de test PostgreSQL avec Prisma
 *
 * MIGRATION: Remplace MongoDB Memory Server par PostgreSQL test database
 * Utilise une base de données PostgreSQL dédiée aux tests
 */

import dotenv from 'dotenv';
import prisma from '../config/prisma';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

// Variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-jwt-secret-key-very-secure';
process.env.NODE_ENV = 'test';
process.env.PORT = '5051';

// Override DATABASE_URL pour utiliser une base de test
// Format: postgresql://user:password@localhost:5432/smartplanning_test
if (!process.env.DATABASE_URL?.includes('_test')) {
  const testDbUrl = process.env.DATABASE_URL?.replace('/smartplanning', '/smartplanning_test') ||
                    'postgresql://postgres:postgres@localhost:5432/smartplanning_test';
  process.env.DATABASE_URL = testDbUrl;
}

// Setup avant tous les tests
beforeAll(async () => {
  try {
    // Tester la connexion PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Base de données de test PostgreSQL connectée');
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error);
    console.error('💡 Assurez-vous que la base "smartplanning_test" existe');
    console.error('   Créez-la avec: createdb smartplanning_test');
    throw error;
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    // Fermer la connexion Prisma
    await prisma.$disconnect();
    console.log('✅ Base de données de test fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
  }
});

// Nettoyage entre chaque test
beforeEach(async () => {
  try {
    // Nettoyer toutes les tables PostgreSQL (noms en snake_case via @@map)
    // L'ordre respecte les contraintes de clés étrangères
    const tables = [
      'role_permission',
      'user_role',
      'audit_log',
      'chatbot_interaction',
      'chatbot_settings',
      'shift',
      'payment',
      'subscription',
      'generated_schedule',
      'weekly_schedule',
      'vacation_request',
      'incident',
      'task',
      'event',
      'employee',
      'team',
      'user',
      'company',
      'role',
      'permission'
    ];

    // Désactiver temporairement les contraintes FK
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Supprimer les données de toutes les tables (snake_case)
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // Réactiver les contraintes FK
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
});
