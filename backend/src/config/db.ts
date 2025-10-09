/**
 * Configuration de connexion à la base de données PostgreSQL via Prisma
 *
 * MIGRATION MongoDB → PostgreSQL (Octobre 2025)
 * Ancienne version: Mongoose + MongoDB
 * Nouvelle version: Prisma + PostgreSQL 15
 *
 * La connexion Prisma est établie automatiquement lors de la première requête.
 * Ce fichier fournit une fonction de test de connexion pour validation.
 */

import prisma from './prisma';

/**
 * Teste la connexion PostgreSQL via Prisma
 * Exécute une requête simple pour vérifier la disponibilité de la BDD
 *
 * @throws Error si la connexion échoue
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Test de connexion avec une requête simple
    await prisma.$queryRaw`SELECT 1`;

    console.log('✅ PostgreSQL connectée via Prisma');

    // Afficher les informations de connexion (masquées pour sécurité)
    const dbUrl = process.env.DATABASE_URL || '';
    const dbHost = dbUrl.match(/@([^:]+)/)?.[1] || 'localhost';
    console.log(`   Host: ${dbHost}`);
    console.log(`   Database: smartplanning`);
    console.log(`   Provider: PostgreSQL 15+`);
  } catch (error: unknown) {
    console.error(
      `❌ Échec de connexion à PostgreSQL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.error('   Vérifiez DATABASE_URL dans le fichier .env');
    console.error('   Format attendu: postgresql://user@host:5432/smartplanning');
    process.exit(1);
  }
};

/**
 * Déconnecte proprement de PostgreSQL
 * Utilisé lors de l'arrêt du serveur
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ PostgreSQL déconnectée');
  } catch (error: unknown) {
    console.error(
      `❌ Erreur lors de la déconnexion: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export default connectDB;
