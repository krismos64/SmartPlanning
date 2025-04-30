"use strict";
/**
 * Script de migration pour ajouter un champ email vide ("") aux employés existants.
 * Usage : npm run migrate:employees
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const Employee_model_1 = __importDefault(require("../src/models/Employee.model"));
// Charger les variables d'environnement
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
async function migrateAddEmptyEmailToEmployees() {
    try {
        console.log("🚀 Connexion à MongoDB...");
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log("🔍 Recherche des employés sans email...");
        const result = await Employee_model_1.default.updateMany({ email: { $exists: false } }, { $set: { email: "" } });
        console.log(`✅ Migration terminée : ${result.modifiedCount} employés mis à jour.`);
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Erreur lors de la migration:", error);
        process.exit(1);
    }
}
migrateAddEmptyEmailToEmployees();
//# sourceMappingURL=migrate-add-email.js.map