/**
 * Script de création de données complètes pour une entreprise de grande distribution
 * 
 * Crée une entreprise avec :
 * - 1 directeur 
 * - 5 managers avec leurs équipes
 * - 30 employés répartis sur 5 équipes
 * - Demandes de congés, incidents, tâches
 * - Plannings pour mois précédent et à venir
 * 
 * Usage : npx ts-node src/scripts/create-retail-company-data.ts
 */

import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User.model";
import Company from "../models/Company.model";
import Team from "../models/Team.model";
import Employee from "../models/Employee.model";
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

// Données pour l'entreprise de grande distribution
const COMPANY_DATA = {
  name: "SuperMarché Plus",
  logoUrl: "https://example.com/logo-supermarche.png",
  plan: "premium" as const
};

const DIRECTOR_DATA = {
  firstName: "Marie",
  lastName: "DUBOIS",
  email: "marie.dubois@supermarche-plus.fr",
  password: "Director2025@",
  role: "directeur" as const,
  phone: "+33123456789",
  bio: "Directrice générale avec 15 ans d'expérience dans la grande distribution"
};

const MANAGERS_DATA = [
  {
    firstName: "Pierre",
    lastName: "MARTIN",
    email: "pierre.martin@supermarche-plus.fr",
    password: "Manager2025@",
    role: "manager" as const,
    phone: "+33123456790",
    bio: "Manager rayon alimentaire, spécialiste en gestion des stocks"
  },
  {
    firstName: "Sophie",
    lastName: "BERNARD",
    email: "sophie.bernard@supermarche-plus.fr",
    password: "Manager2025@",
    role: "manager" as const,
    phone: "+33123456791",
    bio: "Manager rayon textile, experte en merchandising"
  },
  {
    firstName: "Jean",
    lastName: "ROUSSEAU",
    email: "jean.rousseau@supermarche-plus.fr",
    password: "Manager2025@",
    role: "manager" as const,
    phone: "+33123456792",
    bio: "Manager caisse et accueil client, 10 ans d'expérience"
  },
  {
    firstName: "Isabelle",
    lastName: "MOREAU",
    email: "isabelle.moreau@supermarche-plus.fr",
    password: "Manager2025@",
    role: "manager" as const,
    phone: "+33123456793",
    bio: "Manager rayon électroménager et high-tech"
  },
  {
    firstName: "Thomas",
    lastName: "LAURENT",
    email: "thomas.laurent@supermarche-plus.fr",
    password: "Manager2025@",
    role: "manager" as const,
    phone: "+33123456794",
    bio: "Manager logistique et réception marchandises"
  }
];

const TEAMS_DATA = [
  {
    name: "Rayon Alimentaire",
    description: "Gestion des produits frais, épicerie et boissons"
  },
  {
    name: "Rayon Textile",
    description: "Vêtements, chaussures et accessoires"
  },
  {
    name: "Caisse et Accueil",
    description: "Service client, encaissement et accueil"
  },
  {
    name: "Électroménager",
    description: "Appareils électroménagers et high-tech"
  },
  {
    name: "Logistique",
    description: "Réception, stockage et approvisionnement"
  }
];

const EMPLOYEES_DATA = [
  // Équipe Alimentaire (6 employés)
  { firstName: "Antoine", lastName: "GARCIA", email: "antoine.garcia@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Vendeur rayon frais" },
  { firstName: "Camille", lastName: "ROUX", email: "camille.roux@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Responsable épicerie" },
  { firstName: "David", lastName: "VINCENT", email: "david.vincent@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Vendeur boulangerie" },
  { firstName: "Emma", lastName: "SIMON", email: "emma.simon@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Vendeuse fruits et légumes" },
  { firstName: "Florian", lastName: "MICHEL", email: "florian.michel@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Employé rayon surgelés" },
  { firstName: "Léa", lastName: "LEROY", email: "lea.leroy@supermarche-plus.fr", password: "Employee2025@", teamIndex: 0, role: "employee", poste: "Responsable rayon boissons" },
  
  // Équipe Textile (6 employés)
  { firstName: "Hugo", lastName: "MOREAU", email: "hugo.moreau@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Vendeur vêtements homme" },
  { firstName: "Julie", lastName: "GIRARD", email: "julie.girard@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Vendeuse vêtements femme" },
  { firstName: "Maxime", lastName: "ANDRE", email: "maxime.andre@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Vendeur chaussures" },
  { firstName: "Nathalie", lastName: "LEFEBVRE", email: "nathalie.lefebvre@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Responsable rayon enfants" },
  { firstName: "Olivier", lastName: "DUPONT", email: "olivier.dupont@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Vendeur accessoires" },
  { firstName: "Pauline", lastName: "LAMBERT", email: "pauline.lambert@supermarche-plus.fr", password: "Employee2025@", teamIndex: 1, role: "employee", poste: "Vendeuse lingerie" },
  
  // Équipe Caisse (6 employés)
  { firstName: "Quentin", lastName: "MARTIN", email: "quentin.martin@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Caissier" },
  { firstName: "Rachel", lastName: "DURAND", email: "rachel.durand@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Caissière" },
  { firstName: "Sébastien", lastName: "ROBERT", email: "sebastien.robert@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Caissier" },
  { firstName: "Tiffany", lastName: "RICHARD", email: "tiffany.richard@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Hôtesse d'accueil" },
  { firstName: "Valentin", lastName: "PETIT", email: "valentin.petit@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Caissier" },
  { firstName: "Yasmine", lastName: "DUMONT", email: "yasmine.dumont@supermarche-plus.fr", password: "Employee2025@", teamIndex: 2, role: "employee", poste: "Responsable service client" },
  
  // Équipe Électroménager (6 employés)
  { firstName: "Adrien", lastName: "FONTAINE", email: "adrien.fontaine@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Vendeur électroménager" },
  { firstName: "Béatrice", lastName: "ROUSSEL", email: "beatrice.roussel@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Vendeuse informatique" },
  { firstName: "Cédric", lastName: "MOREL", email: "cedric.morel@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Technicien SAV" },
  { firstName: "Delphine", lastName: "FOURNIER", email: "delphine.fournier@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Vendeuse téléphonie" },
  { firstName: "Étienne", lastName: "GIRAUD", email: "etienne.giraud@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Vendeur TV/Audio" },
  { firstName: "Fabienne", lastName: "MERCIER", email: "fabienne.mercier@supermarche-plus.fr", password: "Employee2025@", teamIndex: 3, role: "employee", poste: "Conseillère électroménager" },
  
  // Équipe Logistique (6 employés)
  { firstName: "Guillaume", lastName: "BOYER", email: "guillaume.boyer@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Magasinier" },
  { firstName: "Hélène", lastName: "LEMOINE", email: "helene.lemoine@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Responsable stock" },
  { firstName: "Ivan", lastName: "NICOLAS", email: "ivan.nicolas@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Cariste" },
  { firstName: "Justine", lastName: "PERRIN", email: "justine.perrin@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Réceptionnaire" },
  { firstName: "Kevin", lastName: "ROLLAND", email: "kevin.rolland@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Manutentionnaire" },
  { firstName: "Laure", lastName: "BRUN", email: "laure.brun@supermarche-plus.fr", password: "Employee2025@", teamIndex: 4, role: "employee", poste: "Assistante logistique" }
];

/**
 * Calculer le numéro de semaine ISO
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Générer des horaires de travail réalistes
 */
function generateWorkSchedule(employeeRole: string, dayOfWeek: string): string[] {
  const schedules: { [key: string]: { [day: string]: string[] } } = {
    "Caissier": {
      "lundi": ["08:00-12:00", "13:00-17:00"],
      "mardi": ["08:00-12:00", "13:00-17:00"],
      "mercredi": ["08:00-12:00", "13:00-17:00"],
      "jeudi": ["08:00-12:00", "13:00-17:00"],
      "vendredi": ["08:00-12:00", "13:00-17:00"],
      "samedi": ["08:00-12:00", "14:00-18:00"],
      "dimanche": []
    },
    "Vendeur": {
      "lundi": ["09:00-13:00", "14:00-18:00"],
      "mardi": ["09:00-13:00", "14:00-18:00"],
      "mercredi": ["09:00-13:00", "14:00-18:00"],
      "jeudi": ["09:00-13:00", "14:00-18:00"],
      "vendredi": ["09:00-13:00", "14:00-18:00"],
      "samedi": ["09:00-13:00", "14:00-18:00"],
      "dimanche": []
    },
    "Magasinier": {
      "lundi": ["06:00-10:00", "11:00-15:00"],
      "mardi": ["06:00-10:00", "11:00-15:00"],
      "mercredi": ["06:00-10:00", "11:00-15:00"],
      "jeudi": ["06:00-10:00", "11:00-15:00"],
      "vendredi": ["06:00-10:00", "11:00-15:00"],
      "samedi": ["06:00-10:00", "11:00-15:00"],
      "dimanche": []
    }
  };

  // Déterminer le type d'employé
  let type = "Vendeur";
  if (employeeRole.includes("Caissier") || employeeRole.includes("Hôtesse") || employeeRole.includes("Accueil")) {
    type = "Caissier";
  } else if (employeeRole.includes("Magasinier") || employeeRole.includes("Cariste") || employeeRole.includes("Réceptionnaire")) {
    type = "Magasinier";
  }

  return schedules[type]?.[dayOfWeek] || [];
}

/**
 * Fonction principale
 */
async function createRetailCompanyData(): Promise<void> {
  let connection: typeof mongoose | undefined;

  try {
    // Connexion à MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(chalk.blue("🔄 Connexion à la base de données établie"));

    console.log(chalk.yellow("🏬 Création des données SuperMarché Plus..."));

    // 1. Créer l'entreprise
    console.log(chalk.cyan("1. Création de l'entreprise..."));
    const company = await Company.create(COMPANY_DATA);
    console.log(chalk.green(`✅ Entreprise créée : ${company.name}`));

    // 2. Créer le directeur
    console.log(chalk.cyan("2. Création du directeur..."));
    const director = await User.create({
      ...DIRECTOR_DATA,
      companyId: company._id,
      status: "active",
      isEmailVerified: true
    });
    console.log(chalk.green(`✅ Directeur créé : ${director.firstName} ${director.lastName}`));

    // 3. Créer les managers
    console.log(chalk.cyan("3. Création des managers..."));
    const managers = [];
    for (const managerData of MANAGERS_DATA) {
      const manager = await User.create({
        ...managerData,
        companyId: company._id,
        status: "active",
        isEmailVerified: true
      });
      managers.push(manager);
      console.log(chalk.green(`✅ Manager créé : ${manager.firstName} ${manager.lastName}`));
    }

    // 4. Créer les équipes
    console.log(chalk.cyan("4. Création des équipes..."));
    const teams = [];
    for (let i = 0; i < TEAMS_DATA.length; i++) {
      const team = await Team.create({
        name: TEAMS_DATA[i].name,
        companyId: company._id,
        managerIds: [managers[i]._id],
        employeeIds: []
      });
      teams.push(team);
      console.log(chalk.green(`✅ Équipe créée : ${team.name}`));
    }

    // 5. Créer les employés
    console.log(chalk.cyan("5. Création des employés..."));
    const employees = [];
    for (const employeeData of EMPLOYEES_DATA) {
      // Créer l'utilisateur
      const user = await User.create({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        password: employeeData.password,
        role: employeeData.role,
        companyId: company._id,
        teamIds: [teams[employeeData.teamIndex]._id],
        status: "active",
        isEmailVerified: true
      });

      // Créer l'employé
      const employee = await Employee.create({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        userId: user._id,
        companyId: company._id,
        teamId: teams[employeeData.teamIndex]._id,
        status: "actif",
        role: employeeData.role,
        contractHoursPerWeek: 35,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Date aléatoire dans l'année passée
        preferences: {
          preferredDays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
          preferredHours: ["09:00-17:00"]
        }
      });

      employees.push({ user, employee, teamIndex: employeeData.teamIndex, poste: employeeData.poste });
      
      // Ajouter l'employé à l'équipe
      await Team.findByIdAndUpdate(teams[employeeData.teamIndex]._id, {
        $push: { employeeIds: employee._id }
      });

      console.log(chalk.green(`✅ Employé créé : ${employee.firstName} ${employee.lastName} (${employeeData.poste})`));
    }

    // 6. Créer des demandes de congés
    console.log(chalk.cyan("6. Création des demandes de congés..."));
    const vacationRequests = [];
    for (let i = 0; i < 15; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30); // ±30 jours
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1); // 1-10 jours

      const statuses = ["pending", "approved", "rejected"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const vacation = await VacationRequest.create({
        employeeId: employee.employee._id,
        startDate,
        endDate,
        status,
        requestedBy: employee.user._id,
        updatedBy: status !== "pending" ? managers[employee.teamIndex]._id : undefined,
        reason: [
          "Congés annuels",
          "Congés pour raisons familiales",
          "Congés sans solde",
          "Récupération heures supplémentaires",
          "Pont de fin d'année"
        ][Math.floor(Math.random() * 5)]
      });

      vacationRequests.push(vacation);
    }
    console.log(chalk.green(`✅ ${vacationRequests.length} demandes de congés créées`));

    // 7. Créer des incidents
    console.log(chalk.cyan("7. Création des incidents..."));
    const incidents = [];
    const incidentTypes = ["retard", "absence", "oubli badge", "litige", "autre"];
    const incidentDescriptions = [
      "Retard de 15 minutes sans justification",
      "Absence non prévue sur le planning",
      "Oubli du badge d'accès",
      "Litige avec un client",
      "Problème technique sur le poste de travail",
      "Incident lors de la manutention",
      "Non-respect des procédures",
      "Erreur dans la gestion du stock",
      "Problème avec l'équipement",
      "Incident lors de la pause"
    ];

    for (let i = 0; i < 20; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const manager = managers[employee.teamIndex];
      const statuses = ["pending", "resolved", "dismissed"];
      const incidentDate = new Date();
      incidentDate.setDate(incidentDate.getDate() - Math.floor(Math.random() * 30)); // 30 jours passés

      const incident = await Incident.create({
        employeeId: employee.employee._id,
        type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        description: incidentDescriptions[Math.floor(Math.random() * incidentDescriptions.length)],
        date: incidentDate,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        reportedBy: manager._id
      });

      incidents.push(incident);
    }
    console.log(chalk.green(`✅ ${incidents.length} incidents créés`));

    // 8. Créer des tâches
    console.log(chalk.cyan("8. Création des tâches..."));
    const tasks = [];
    const taskTitles = [
      "Inventaire rayon",
      "Mise en rayon nouveaux produits",
      "Nettoyage zone de vente",
      "Formation nouveau collègue",
      "Contrôle qualité produits",
      "Réorganisation stock",
      "Accueil fournisseur",
      "Préparation promotion",
      "Vérification prix",
      "Maintenance équipement"
    ];

    for (let i = 0; i < 40; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30)); // 30 jours à venir

      const statuses = ["pending", "inProgress", "completed"];
      const task = await Task.create({
        employeeId: employee.employee._id,
        title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
        dueDate,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });

      tasks.push(task);
    }
    console.log(chalk.green(`✅ ${tasks.length} tâches créées`));

    // 9. Créer des plannings
    console.log(chalk.cyan("9. Création des plannings..."));
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Mois précédent et mois à venir
    const months = [
      new Date(currentYear, currentMonth - 1, 1), // Mois précédent
      new Date(currentYear, currentMonth, 1),     // Mois actuel
      new Date(currentYear, currentMonth + 1, 1)  // Mois suivant
    ];

    let schedulesCreated = 0;
    const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

    for (const month of months) {
      for (const employee of employees) {
        // Créer 4 plannings par mois (une semaine sur deux environ)
        for (let week = 0; week < 4; week++) {
          const scheduleDate = new Date(month);
          scheduleDate.setDate(scheduleDate.getDate() + (week * 7));

          const weekNumber = getWeekNumber(scheduleDate);
          const year = scheduleDate.getFullYear();

          // Vérifier si le planning n'existe pas déjà
          const existingSchedule = await WeeklySchedule.findOne({
            employeeId: employee.employee._id,
            year,
            weekNumber
          });

          if (!existingSchedule) {
            const scheduleData = new Map<string, string[]>();
            const dailyDates = new Map<string, Date>();
            let totalMinutes = 0;

            // Générer les horaires pour chaque jour
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
              const day = daysOfWeek[dayIndex];
              const dayDate = new Date(scheduleDate);
              dayDate.setDate(scheduleDate.getDate() + dayIndex);

              dailyDates.set(day, dayDate);

              // Générer les horaires selon le poste
              const hours = generateWorkSchedule(employee.poste, day);
              scheduleData.set(day, hours);

              // Calculer les minutes travaillées
              for (const timeRange of hours) {
                const [start, end] = timeRange.split('-');
                const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
                const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
                totalMinutes += endMinutes - startMinutes;
              }
            }

            await WeeklySchedule.create({
              employeeId: employee.employee._id,
              year,
              weekNumber,
              scheduleData,
              dailyDates,
              totalWeeklyMinutes: totalMinutes,
              status: "approved",
              updatedBy: managers[employee.teamIndex]._id,
              notes: "Planning généré automatiquement"
            });

            schedulesCreated++;
          }
        }
      }
    }
    console.log(chalk.green(`✅ ${schedulesCreated} plannings créés`));

    // 10. Résumé final
    console.log(chalk.green("\n🎉 Création des données terminée avec succès!"));
    console.log(chalk.blue("\n📊 Résumé:"));
    console.log(chalk.gray(`  • Entreprise: ${company.name}`));
    console.log(chalk.gray(`  • Directeur: ${director.firstName} ${director.lastName}`));
    console.log(chalk.gray(`  • Managers: ${managers.length}`));
    console.log(chalk.gray(`  • Équipes: ${teams.length}`));
    console.log(chalk.gray(`  • Employés: ${employees.length}`));
    console.log(chalk.gray(`  • Demandes de congés: ${vacationRequests.length}`));
    console.log(chalk.gray(`  • Incidents: ${incidents.length}`));
    console.log(chalk.gray(`  • Tâches: ${tasks.length}`));
    console.log(chalk.gray(`  • Plannings: ${schedulesCreated}`));

    // Comptes de test
    console.log(chalk.blue("\n🔑 Comptes de test:"));
    console.log(chalk.yellow("📋 DIRECTEUR:"));
    console.log(chalk.white(`  Email: ${director.email}`));
    console.log(chalk.white(`  Mot de passe: ${DIRECTOR_DATA.password}`));

    console.log(chalk.yellow("\n👥 MANAGERS:"));
    managers.forEach((manager, index) => {
      console.log(chalk.white(`  ${manager.firstName} ${manager.lastName} (${TEAMS_DATA[index].name})`));
      console.log(chalk.white(`  Email: ${manager.email}`));
      console.log(chalk.white(`  Mot de passe: ${MANAGERS_DATA[index].password}`));
    });

    console.log(chalk.yellow("\n👤 EMPLOYÉS DE TEST (1 par équipe):"));
    for (let i = 0; i < 5; i++) {
      const employee = employees.find(emp => emp.teamIndex === i);
      if (employee) {
        console.log(chalk.white(`  ${employee.employee.firstName} ${employee.employee.lastName} (${employee.poste})`));
        console.log(chalk.white(`  Email: ${employee.user.email}`));
        console.log(chalk.white(`  Mot de passe: Employee2025@`));
      }
    }

  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la création des données:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB
    if (connection) {
      await mongoose.disconnect();
      console.log(chalk.blue("🔌 Connexion à la base de données fermée"));
    }
  }
}

// Exécution de la fonction principale
createRetailCompanyData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      chalk.red("❌ Erreur non gérée:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });