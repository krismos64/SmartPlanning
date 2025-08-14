/**
 * Script d'optimisation de la base de données MongoDB
 * 
 * Ce script crée des index optimisés pour améliorer les performances
 * des requêtes les plus courantes du système SmartPlanning.
 * 
 * Usage: npx ts-node src/scripts/optimize-database.ts
 */

import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Import des modèles
import User from "../models/User.model";
import Employee from "../models/Employee.model";
import Company from "../models/Company.model";
import Team from "../models/Team.model";
import GeneratedSchedule from "../models/GeneratedSchedule.model";
import WeeklySchedule from "../models/WeeklySchedule.model";
import VacationRequest from "../models/VacationRequest.model";
import Task from "../models/Task.model";
import Incident from "../models/Incident.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Vérifier la présence de l'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error(chalk.red("❌ Erreur: Variable d'environnement MONGODB_URI non définie"));
  process.exit(1);
}

/**
 * Configuration des index optimisés par collection
 */
const indexConfigurations = [
  {
    model: User,
    name: "Users",
    indexes: [
      // Index unique sur email pour authentification rapide
      { fields: { email: 1 }, options: { unique: true, background: true } },
      
      // Index composite pour filtrage par entreprise et rôle
      { fields: { companyId: 1, role: 1 }, options: { background: true } },
      
      // Index pour recherche par statut
      { fields: { status: 1 }, options: { background: true } },
      
      // Index sparse sur resetPasswordToken (seulement les documents qui l'ont)
      { fields: { resetPasswordToken: 1 }, options: { sparse: true, background: true } },
      
      // Index sur lastLogin pour statistiques
      { fields: { lastLogin: -1 }, options: { background: true } }
    ]
  },
  
  {
    model: Employee,
    name: "Employees",
    indexes: [
      // Index composite principal : companyId + teamId + status (requêtes les plus fréquentes)
      { fields: { companyId: 1, teamId: 1, status: 1 }, options: { background: true } },
      
      // Index pour recherche par équipe seulement
      { fields: { teamId: 1, status: 1 }, options: { background: true } },
      
      // Index pour recherche par entreprise et statut
      { fields: { companyId: 1, status: 1 }, options: { background: true } },
      
      // Index pour recherche par email (si présent)
      { fields: { email: 1 }, options: { sparse: true, background: true } },
      
      // Index pour userId (référence avec User)
      { fields: { userId: 1 }, options: { sparse: true, background: true } },
      
      // Index composite pour les heures contractuelles (rapports)
      { fields: { companyId: 1, contractHoursPerWeek: 1 }, options: { background: true } }
    ]
  },
  
  {
    model: GeneratedSchedule,
    name: "GeneratedSchedules",
    indexes: [
      // Index composite ultra-optimisé pour Planning Wizard : employeeId + semaine + année
      { fields: { employeeId: 1, year: -1, weekNumber: -1 }, options: { background: true } },
      
      // Index pour recherche par employé et statut
      { fields: { employeeId: 1, status: 1 }, options: { background: true } },
      
      // Index pour recherche par semaine et année (rapports)
      { fields: { year: -1, weekNumber: -1, status: 1 }, options: { background: true } },
      
      // Index sur timestamp pour tri par date de création
      { fields: { timestamp: -1 }, options: { background: true } },
      
      // Index composite pour générateur (stats d'utilisation)
      { fields: { generatedBy: 1, timestamp: -1 }, options: { background: true } }
    ]
  },
  
  {
    model: WeeklySchedule,
    name: "WeeklySchedules",
    indexes: [
      // Index composite principal pour plannings hebdomadaires
      { fields: { employeeId: 1, week: -1, year: -1 }, options: { background: true } },
      
      // Index pour recherche par équipe et semaine
      { fields: { teamId: 1, week: -1, year: -1 }, options: { background: true } },
      
      // Index pour recherche par statut et période
      { fields: { status: 1, year: -1, week: -1 }, options: { background: true } }
    ]
  },
  
  {
    model: Team,
    name: "Teams",
    indexes: [
      // Index composite pour équipes par entreprise
      { fields: { companyId: 1, name: 1 }, options: { background: true } },
      
      // Index pour manager (référence vers User)
      { fields: { managerId: 1 }, options: { sparse: true, background: true } }
    ]
  },
  
  {
    model: VacationRequest,
    name: "VacationRequests",
    indexes: [
      // Index composite pour congés par employé et période
      { fields: { employeeId: 1, startDate: -1, endDate: -1 }, options: { background: true } },
      
      // Index pour recherche par statut et dates
      { fields: { status: 1, startDate: 1, endDate: 1 }, options: { background: true } },
      
      // Index pour conflits de dates (optimise la détection de chevauchements)
      { fields: { startDate: 1, endDate: 1 }, options: { background: true } }
    ]
  },
  
  {
    model: Task,
    name: "Tasks",
    indexes: [
      // Index composite pour tâches par équipe et statut
      { fields: { teamId: 1, status: 1 }, options: { background: true } },
      
      // Index pour assignation (employé assigné)
      { fields: { assignedTo: 1, status: 1 }, options: { background: true } },
      
      // Index pour dates d'échéance
      { fields: { dueDate: 1, status: 1 }, options: { background: true } }
    ]
  },
  
  {
    model: Incident,
    name: "Incidents",
    indexes: [
      // Index composite pour incidents par équipe et priorité
      { fields: { teamId: 1, priority: 1, status: 1 }, options: { background: true } },
      
      // Index pour rapporteur
      { fields: { reportedBy: 1, createdAt: -1 }, options: { background: true } },
      
      // Index pour résolution
      { fields: { status: 1, createdAt: -1 }, options: { background: true } }
    ]
  }
];

/**
 * Fonction principale d'optimisation
 */
async function optimizeDatabase(): Promise<void> {
  try {
    console.log(chalk.blue("🚀 Démarrage de l'optimisation de la base de données..."));
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log(chalk.green("🔄 Connexion à la base de données établie"));
    
    let totalIndexesCreated = 0;
    let totalIndexesExisting = 0;
    
    // Traitement de chaque collection
    for (const config of indexConfigurations) {
      console.log(chalk.yellow(`\n📊 Optimisation de la collection ${config.name}...`));
      
      try {
        // Lister les index existants
        const existingIndexes = await config.model.collection.getIndexes();
        console.log(chalk.gray(`  Indexes existants: ${Object.keys(existingIndexes).length}`));
        
        let collectionIndexesCreated = 0;
        
        // Créer chaque index configuré
        for (const indexConfig of config.indexes) {
          try {
            // Générer un nom d'index basé sur les champs
            const indexName = Object.keys(indexConfig.fields)
              .map(field => `${field}_${indexConfig.fields[field]}`)
              .join('_');
            
            // Vérifier si l'index existe déjà
            const indexExists = Object.keys(existingIndexes).some(name => 
              name.includes(indexName) || name === indexName
            );
            
            if (indexExists) {
              console.log(chalk.gray(`    ✓ Index ${indexName} déjà existant`));
              totalIndexesExisting++;
            } else {
              // Créer l'index
              await config.model.collection.createIndex(
                indexConfig.fields,
                { 
                  ...indexConfig.options,
                  name: indexName
                }
              );
              
              console.log(chalk.green(`    ✅ Index ${indexName} créé`));
              collectionIndexesCreated++;
              totalIndexesCreated++;
            }
            
            // Pause pour éviter la surcharge
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (indexError) {
            console.log(chalk.yellow(`    ⚠️ Erreur création index: ${indexError instanceof Error ? indexError.message : 'Erreur inconnue'}`));
          }
        }
        
        console.log(chalk.green(`  ✅ Collection ${config.name}: ${collectionIndexesCreated} nouveaux index créés`));
        
      } catch (collectionError) {
        console.log(chalk.red(`  ❌ Erreur collection ${config.name}: ${collectionError instanceof Error ? collectionError.message : 'Erreur inconnue'}`));
      }
    }
    
    console.log(chalk.blue("\n📈 Analyse des statistiques de la base..."));
    
    // Afficher les statistiques des collections principales
    const collections = ['users', 'employees', 'generatedschedules', 'teams', 'companies'];
    
    for (const collectionName of collections) {
      try {
        const stats = await mongoose.connection.db.collection(collectionName).stats();
        console.log(chalk.cyan(`  📊 ${collectionName}: ${stats.count} documents, ${Math.round(stats.size / 1024)}KB`));
      } catch (error) {
        console.log(chalk.gray(`  📊 ${collectionName}: Collection vide ou inexistante`));
      }
    }
    
    // Résumé final
    console.log(chalk.green("\n🎉 Optimisation terminée avec succès!"));
    console.log(chalk.green(`✅ ${totalIndexesCreated} nouveaux index créés`));
    console.log(chalk.gray(`ℹ️  ${totalIndexesExisting} index existaient déjà`));
    
    // Recommandations
    console.log(chalk.blue("\n💡 Recommandations:"));
    console.log(chalk.blue("   - Surveillez l'utilisation des index avec db.collection.explain()"));
    console.log(chalk.blue("   - Considérez l'implémentation d'un cache Redis pour les données fréquemment accédées"));
    console.log(chalk.blue("   - Planifiez des maintenances périodiques avec db.collection.reIndex()"));
    
  } catch (error) {
    console.error(chalk.red("❌ Erreur lors de l'optimisation:"), error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log(chalk.green("🔌 Connexion à la base de données fermée"));
    process.exit(0);
  }
}

/**
 * Fonction pour analyser les performances des requêtes
 */
async function analyzeQueryPerformance(): Promise<void> {
  console.log(chalk.blue("\n🔍 Analyse des performances des requêtes courantes..."));
  
  try {
    // Test des requêtes les plus courantes avec explain()
    const testQueries = [
      {
        name: "Recherche employés par entreprise",
        collection: "employees",
        query: { companyId: new mongoose.Types.ObjectId(), status: "actif" }
      },
      {
        name: "Planning généré par employé et semaine",
        collection: "generatedschedules",
        query: { employeeId: new mongoose.Types.ObjectId(), year: 2025, weekNumber: 35 }
      },
      {
        name: "Utilisateurs par entreprise et rôle",
        collection: "users",
        query: { companyId: new mongoose.Types.ObjectId(), role: "employee" }
      }
    ];
    
    for (const testQuery of testQueries) {
      try {
        const explain = await mongoose.connection.db
          .collection(testQuery.collection)
          .find(testQuery.query)
          .explain('executionStats');
        
        const executionStats = explain.executionStats;
        console.log(chalk.cyan(`  📈 ${testQuery.name}:`));
        console.log(chalk.gray(`     Temps d'exécution: ${executionStats.executionTimeMillis}ms`));
        console.log(chalk.gray(`     Documents examinés: ${executionStats.totalDocsExamined}`));
        console.log(chalk.gray(`     Index utilisé: ${executionStats.executionStages?.indexName || 'Aucun'}`));
        
      } catch (error) {
        console.log(chalk.yellow(`  ⚠️ ${testQuery.name}: Impossible d'analyser (collection vide?)`));
      }
    }
    
  } catch (error) {
    console.log(chalk.yellow("⚠️ Analyse des performances impossible:", error instanceof Error ? error.message : 'Erreur inconnue'));
  }
}

// Exécution du script
if (require.main === module) {
  optimizeDatabase()
    .then(() => analyzeQueryPerformance())
    .catch(console.error);
}

export { optimizeDatabase, analyzeQueryPerformance };