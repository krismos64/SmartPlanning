import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface pour les demandes de congés (compatible avec VacationRequest)
interface VacationRequestData {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

/**
 * Calcule la durée en jours entre deux dates
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Nombre de jours
 */
const calculateDuration = (startDate: string, endDate: string): number => {
  return (
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24) +
        1
    ) || 0
  );
};

/**
 * Traduit le statut en français
 * @param status Statut en anglais
 * @returns Statut traduit en français
 */
const translateStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvé";
    case "rejected":
      return "Refusé";
    default:
      return status;
  }
};

/**
 * Génère un PDF des demandes de congés
 * @param requests Tableau des demandes de congés
 */
export const generateVacationPdf = (requests: VacationRequestData[]): void => {
  // Création du document PDF en orientation paysage
  const doc = new jsPDF({ orientation: "landscape" });

  // Ajout des polices et des couleurs
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80); // Couleur de texte foncée

  // Titre du document
  const title = "Liste des demandes de congés";
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });

  // Date d'export
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
  doc.text(`Généré le ${today}`, doc.internal.pageSize.width - 15, 10, {
    align: "right",
  });

  // Préparation des données pour le tableau
  const tableData = requests.map((request) => [
    // Employé
    `${request.employeeId?.firstName || "Prénom"} ${
      request.employeeId?.lastName || "Nom"
    }`,
    // Date de début
    format(new Date(request.startDate), "dd MMM yyyy", { locale: fr }),
    // Date de fin
    format(new Date(request.endDate), "dd MMM yyyy", { locale: fr }),
    // Durée
    `${calculateDuration(request.startDate, request.endDate)} jour(s)`,
    // Motif
    request.reason || "Non spécifié",
    // Statut
    translateStatus(request.status),
  ]);

  // Configuration et ajout du tableau
  autoTable(doc, {
    head: [["Employé", "Début", "Fin", "Durée", "Motif", "Statut"]],
    body: tableData,
    startY: 30,
    headStyles: {
      fillColor: [63, 81, 181], // Couleur d'en-tête indigo
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250], // Légère couleur pour les lignes alternées
    },
    margin: { top: 30 },
    // Style des cellules
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 5,
      valign: "middle",
    },
    // Styles des colonnes
    columnStyles: {
      0: { cellWidth: 50 }, // Employé
      1: { cellWidth: 30 }, // Début
      2: { cellWidth: 30 }, // Fin
      3: { cellWidth: 25 }, // Durée
      4: { cellWidth: "auto" }, // Motif (adaptatif)
      5: { cellWidth: 30 }, // Statut
    },
    // Ajout de la pagination
    didDrawPage: (data) => {
      // Pied de page avec pagination
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      // @ts-ignore - La méthode getNumberOfPages existe dans jsPDF mais n'est pas correctement typée
      const pageNumber = doc.internal.getNumberOfPages();
      doc.text(
        `Page ${pageNumber}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    },
  });

  // Génération du nom de fichier avec la date courante
  const fileName = `conges-export-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  // Téléchargement du fichier
  doc.save(fileName);
};

export default generateVacationPdf;
