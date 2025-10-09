import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// MIGRATION POSTGRESQL: Configuration PostgreSQL-only (MongoDB retiré)
// Définir les variables d'environnement avec des valeurs par défaut
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5050", 10),
  // DATABASE_URL est maintenant géré directement par Prisma via .env
};

// Validation PostgreSQL (DATABASE_URL requis pour Prisma)
if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️ AVERTISSEMENT: Variable DATABASE_URL non définie dans le fichier .env (requise pour PostgreSQL/Prisma)"
  );
}

export default ENV;
