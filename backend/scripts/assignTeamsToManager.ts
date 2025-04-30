/**
 * Script pour attribuer des équipes à un manager
 *
 * Ce script permet d'associer une ou plusieurs équipes à un utilisateur manager
 * pour qu'il puisse accéder aux employés de ces équipes.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import TeamModel, { ITeam } from "../src/models/Team.model";
import { User } from "../src/models/User.model";

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Fonction principale
async function assignTeamsToManager() {
  try {
    // Paramètres à configurer
    const managerEmail = process.argv[2]; // Email du manager
    const teamIds = process.argv.slice(3); // Liste d'IDs d'équipes à associer

    if (!managerEmail) {
      console.error("❌ Veuillez spécifier l'email du manager");
      console.log(
        "Usage: npm run assign-teams-to-manager <email_manager> <teamId1> [teamId2 ...]"
      );
      process.exit(1);
    }

    console.log(`📝 Recherche du manager avec l'email: ${managerEmail}`);
    const manager = await User.findOne({ email: managerEmail });

    if (!manager) {
      console.error(
        `❌ Aucun utilisateur trouvé avec l'email: ${managerEmail}`
      );
      process.exit(1);
    }

    if (manager.role !== "manager") {
      console.error(
        `❌ L'utilisateur ${managerEmail} n'est pas un manager (rôle actuel: ${manager.role})`
      );
      console.log("🔄 Mise à jour du rôle en 'manager'");
      manager.role = "manager";
    }

    // Vérifier les équipes spécifiées
    let validTeamIds: mongoose.Types.ObjectId[] = [];

    if (teamIds.length === 0) {
      // Si aucune équipe n'est spécifiée, attribuer toutes les équipes disponibles
      console.log(
        "🔍 Aucune équipe spécifiée, recherche de toutes les équipes disponibles"
      );

      // Si le manager a une entreprise assignée, filtrer par entreprise
      const companyFilter = manager.companyId
        ? { companyId: manager.companyId }
        : {};
      const teams = await TeamModel.find(companyFilter);

      if (teams.length === 0) {
        console.error("❌ Aucune équipe trouvée dans la base de données");
        process.exit(1);
      }

      validTeamIds = teams.map((team: ITeam) => team._id);
      console.log(`✅ ${teams.length} équipes trouvées`);
    } else {
      // Vérifier chaque ID d'équipe spécifié
      for (const teamId of teamIds) {
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
          console.error(`❌ ID d'équipe invalide: ${teamId}`);
          continue;
        }

        const team = await TeamModel.findById(teamId);
        if (!team) {
          console.error(`❌ Équipe non trouvée avec l'ID: ${teamId}`);
          continue;
        }

        validTeamIds.push(team._id);
        console.log(`✅ Équipe valide: ${team.name} (${teamId})`);
      }

      if (validTeamIds.length === 0) {
        console.error(
          "❌ Aucune équipe valide trouvée parmi les IDs spécifiés"
        );
        process.exit(1);
      }
    }

    // Mettre à jour le manager avec les équipes validées
    console.log(
      `🔄 Attribution de ${validTeamIds.length} équipes au manager ${manager.firstName} ${manager.lastName}`
    );

    manager.teamIds = validTeamIds;
    await manager.save();

    console.log("✅ Mise à jour réussie!");
    console.log("📋 Détails du manager:");
    console.log(`- Nom: ${manager.firstName} ${manager.lastName}`);
    console.log(`- Email: ${manager.email}`);
    console.log(`- Rôle: ${manager.role}`);
    console.log(`- Équipes assignées: ${validTeamIds.length}`);
    console.log(`- IDs des équipes: ${validTeamIds.join(", ")}`);
  } catch (error) {
    console.error("❌ Une erreur est survenue:", error);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB");
  }
}

// Exécution de la fonction principale
assignTeamsToManager();
