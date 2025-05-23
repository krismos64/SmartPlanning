/**
 * Service de génération de PDF pour la liste des collaborateurs
 *
 * Permet d'exporter la liste des collaborateurs au format PDF en mode paysage
 * avec formatage automatique et gestion des valeurs manquantes.
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Interface représentant un employé avec email optionnel
 * Basée sur l'interface EmployeeWithEmail de CollaboratorManagementPage
 */
interface EmployeeWithEmail {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  status: string;
  teamId?: string;
  companyId?: string;
  contractHoursPerWeek?: number;
  teamName?: string;
}

/**
 * Génère un fichier PDF contenant la liste des collaborateurs
 *
 * @param employees - Tableau d'objets EmployeeWithEmail contenant les données des collaborateurs
 */
export const generateCollaboratorsPdf = (
  employees: EmployeeWithEmail[]
): void => {
  // Création du document PDF en format paysage
  const doc = new jsPDF({ orientation: "landscape" });

  // Date actuelle formatée en français
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: fr });

  // Titre principal
  doc.setFontSize(18);
  doc.text(
    "Liste des collaborateurs",
    doc.internal.pageSize.getWidth() / 2,
    20,
    {
      align: "center",
    }
  );

  // Date d'export en haut à droite
  doc.setFontSize(10);
  doc.text(
    `Généré le ${currentDate}`,
    doc.internal.pageSize.getWidth() - 15,
    10,
    {
      align: "right",
    }
  );

  // Préparation des données pour le tableau
  const tableData = employees.map((employee) => [
    // Nom complet (Prénom + Nom)
    `${employee.firstName} ${employee.lastName}`,

    // Email (ou "Non spécifié" si vide)
    employee.email || "Non spécifié",

    // Rôle
    employee.role === "admin"
      ? "Admin"
      : employee.role === "manager"
      ? "Manager"
      : "Employé",

    // Équipe (nom de l'équipe ou "Non assignée")
    employee.teamName || "Non assignée",

    // Statut ("Actif" ou "Inactif")
    employee.status === "actif" ? "Actif" : "Inactif",

    // Heures/semaine (ou "Non spécifié" si vide)
    employee.contractHoursPerWeek
      ? `${employee.contractHoursPerWeek}h`
      : "Non spécifié",
  ]);

  // Définition des entêtes de colonnes
  const headers = [
    "Nom",
    "Email",
    "Rôle",
    "Équipe",
    "Statut",
    "Heures/semaine",
  ];

  // Génération du tableau
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 30,
    headStyles: {
      fillColor: [75, 85, 175], // Couleur bleu indigo
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    // Largeurs de colonnes personnalisées
    columnStyles: {
      0: { cellWidth: 45 }, // Nom
      1: { cellWidth: 60 }, // Email
      2: { cellWidth: 25 }, // Rôle
      3: { cellWidth: 40 }, // Équipe
      4: { cellWidth: 25 }, // Statut
      5: { cellWidth: 40 }, // Heures/semaine
    },
  });

  // Génération du nom du fichier avec la date du jour au format YYYY-MM-DD
  const fileName = `collaborateurs-export-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.pdf`;

  // Téléchargement du fichier PDF
  doc.save(fileName);
};
