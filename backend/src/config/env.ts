import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Définir les variables d'environnement avec des valeurs par défaut
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5050", 10),
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning",
};

// Validation de base pour s'assurer que les variables essentielles sont définies
if (!process.env.MONGODB_URI) {
  console.warn(
    "⚠️ AVERTISSEMENT: Variable MONGODB_URI non définie dans le fichier .env"
  );
}

export default ENV;
