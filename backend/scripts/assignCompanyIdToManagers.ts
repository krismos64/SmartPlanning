/**
 * Script assignCompanyIdToManagers.ts
 *
 * Ce script permet d'assigner un companyId à tous les managers qui n'en ont pas
 * dans la base de données MongoDB. Il parcourt tous les utilisateurs avec le rôle
 * "manager" et leur assigne le companyId spécifié s'ils n'en ont pas déjà un.
 *
 * Usage: ts-node backend/scripts/assignCompanyIdToManagers.ts
 */

import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import path from "path";
import User from "../src/models/User.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// CompanyId à assigner aux managers (entreprise existante)
const TARGET_COMPANY_ID = "6802546b3b516b65726e96f8";

/**
 * Fonction principale qui assigne un companyId aux managers qui n'en ont pas
 */
async function assignCompanyIdToManagers(): Promise<void> {
  try {
    // Se connecter à MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb+srv://krismos:0dYH74uq8MU8xtX8a@smartplanningcluster.u62vb66.mongodb.net/smartplanning";

    console.log(`Connexion à MongoDB: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log("Connecté à MongoDB avec succès");

    // Convertir la chaîne en ObjectId
    const companyObjectId = new Types.ObjectId(TARGET_COMPANY_ID);

    // Récupérer tous les managers
    const managers = await User.find({ role: "manager" });
    console.log(`${managers.length} managers trouvés dans la base de données`);

    // Compteurs pour le rapport final
    let updatedCount = 0;
    let alreadyAssignedCount = 0;
    let errorCount = 0;

    // Traiter chaque manager
    for (const manager of managers) {
      try {
        if (manager.companyId) {
          // Le manager a déjà un companyId
          console.log(
            `Manager ${manager.email} déjà assigné à une entreprise (${manager.companyId}).`
          );
          alreadyAssignedCount++;
        } else {
          // Assigner le companyId et sauvegarder
          manager.companyId = companyObjectId;
          await manager.save();
          console.log(`CompanyId assigné à ${manager.email}.`);
          updatedCount++;
        }
      } catch (managerError) {
        console.error(
          `Erreur lors du traitement du manager ${manager.email}:`,
          managerError
        );
        errorCount++;
      }
    }

    // Afficher le rapport
    console.log("\n--- Rapport ---");
    console.log(`Managers traités: ${managers.length}`);
    console.log(`Managers déjà assignés: ${alreadyAssignedCount}`);
    console.log(`Managers mis à jour: ${updatedCount}`);
    console.log(`Erreurs: ${errorCount}`);
  } catch (error) {
    console.error("Erreur lors de l'exécution du script:", error);
    process.exit(1);
  } finally {
    // Déconnecter proprement de MongoDB
    await mongoose.disconnect();
    console.log("Déconnexion de MongoDB");
  }
}

// Exécuter la fonction principale
assignCompanyIdToManagers()
  .then(() => {
    console.log("Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });
