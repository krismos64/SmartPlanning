import mongoose from "mongoose";
import { ENV } from "./env";

// Options de connexion MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions;

/**
 * Établit la connexion à la base de données MongoDB
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, options);
    console.log(`✅ MongoDB connectée: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
    } else {
      console.error("❌ Erreur inconnue lors de la connexion à MongoDB");
    }
    process.exit(1);
  }
};

export default connectDB;
