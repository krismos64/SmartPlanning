import dotenv from "dotenv";
import mongoose from "mongoose";

// Charger les variables d'environnement
dotenv.config();

/**
 * Fonction de connexion à MongoDB
 * Utilise la variable d'environnement MONGODB_URI qui doit pointer vers la base smartplanning
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Utiliser l'URI de connexion depuis les variables d'environnement
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);

    console.log(`✅ MongoDB connectée: ${conn.connection.host}`);
  } catch (error: unknown) {
    console.error(
      `❌ Échec de connexion à MongoDB: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
};

export default connectDB;
