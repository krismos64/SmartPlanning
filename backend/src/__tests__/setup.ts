import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

// Variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-jwt-secret-key-very-secure';
process.env.NODE_ENV = 'test';
process.env.PORT = '5051';

// Setup avant tous les tests
global.beforeAll(async () => {
  try {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Créer une instance MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Se connecter à la base de données en mémoire avec des options spécifiques
    await mongoose.connect(uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Base de données de test MongoDB connectée');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    throw error;
  }
});

// Nettoyage après tous les tests
global.afterAll(async () => {
  try {
    // Nettoyer toutes les collections avant de fermer
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
    
    // Fermer la connexion
    await mongoose.disconnect();
    
    // Arrêter le serveur MongoDB en mémoire
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Base de données de test fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
  }
});

// Nettoyage entre chaque test
global.beforeEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Nettoyer toutes les collections
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
});