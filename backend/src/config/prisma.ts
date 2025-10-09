/**
 * Prisma Client Singleton - Configuration centralisée
 *
 * Ce module fournit une instance unique de PrismaClient
 * pour toute l'application, évitant les multiples connexions.
 *
 * Features:
 * - Singleton pattern
 * - Logging des requêtes en développement
 * - Gestion gracieuse de la déconnexion
 * - Support hot reload (ts-node-dev)
 */

import { PrismaClient } from '@prisma/client';

// Type pour le global avec Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Configuration Prisma Client avec logging adapté à l'environnement
 */
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,
};

/**
 * Singleton PrismaClient
 * En développement, utilise global.prisma pour éviter les multiples instances
 * lors du hot reload (ts-node-dev)
 */
const prisma = global.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

/**
 * Graceful shutdown - Déconnexion propre de Prisma
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
