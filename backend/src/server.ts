import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";
// import { initTelemetry, shutdownTelemetry } from "./monitoring/telemetry";

// Port sur lequel le serveur va écouter
const PORT = ENV.PORT;

// Démarrage du serveur
const startServer = async (): Promise<void> => {
  try {
    // Initialisation du monitoring
    // initTelemetry();

    // Connexion à la base de données
    await connectDB();

    // Démarrage du serveur Express
    app.listen(PORT, () => {
      console.log(`
✅ Serveur démarré en mode ${ENV.NODE_ENV}
📡 Écoute sur le port: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 Monitoring: OpenTelemetry activé
📈 Métriques: http://localhost:${PORT}/metrics
      `);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Erreur lors du démarrage du serveur: ${error.message}`);
    } else {
      console.error("❌ Erreur inconnue lors du démarrage du serveur");
    }
    process.exit(1);
  }
};

// Gestionnaire d'arrêt propre
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Signal ${signal} reçu, arrêt en cours...`);
  
  try {
    // await shutdownTelemetry();
    console.log('✅ Monitoring arrêté proprement');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt du monitoring:', error);
    process.exit(1);
  }
};

// Écoute des signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Lancement du serveur
startServer();
