import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";

// Port sur lequel le serveur va écouter
const PORT = ENV.PORT;

// Démarrage du serveur
const startServer = async (): Promise<void> => {
  try {
    // Connexion à la base de données
    await connectDB();

    // Démarrage du serveur Express
    app.listen(PORT, () => {
      console.log(`
✅ Serveur démarré en mode ${ENV.NODE_ENV}
📡 Écoute sur le port: ${PORT}
🌐 URL: http://localhost:${PORT}
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

// Lancement du serveur
startServer();
