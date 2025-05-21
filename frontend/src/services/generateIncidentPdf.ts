import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Incident {
  employeeId: {
    firstName: string;
    lastName: string;
  };
  date: string | Date;
  type: "retard" | "absence" | "oubli badge" | "litige" | "autre";
  status: "resolved" | "pending" | "dismissed";
  description: string;
  reportedBy: {
    firstName: string;
    lastName: string;
  };
}

/**
 * Génère un PDF au format paysage A4 listant les incidents
 * @param incidents Liste des incidents à inclure dans le PDF
 */
export const generateIncidentPdf = (incidents: Incident[]): void => {
  // Création du document PDF en format paysage
  const doc = new jsPDF({ orientation: "landscape" });

  // Mise en place du titre et sous-titre
  const title = "Incidents enregistrés";
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
  const subtitle = `Généré le ${today}`;

  // Ajout du titre et du sous-titre
  doc.setFontSize(18);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 30, {
    align: "center",
  });

  // Traduction des statuts
  const translateStatus = (status: string): string => {
    switch (status) {
      case "resolved":
        return "Résolu";
      case "pending":
        return "En attente";
      case "dismissed":
        return "Ignoré";
      default:
        return status;
    }
  };

  // Préparation des données pour le tableau
  const tableData = incidents.map((incident) => [
    `${incident.employeeId.firstName} ${incident.employeeId.lastName}`,
    typeof incident.date === "string"
      ? format(new Date(incident.date), "dd MMM yyyy", { locale: fr })
      : format(incident.date, "dd MMM yyyy", { locale: fr }),
    incident.type,
    translateStatus(incident.status),
    `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`,
    incident.description.length > 100
      ? `${incident.description.substring(0, 97)}...`
      : incident.description,
  ]);

  // Définition des entêtes de colonnes
  const headers = [
    "Employé",
    "Date",
    "Type",
    "Statut",
    "Déclaré par",
    "Description",
  ];

  // Génération du tableau dans le PDF
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 40,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 5,
      overflow: "linebreak",
    },
    columnStyles: {
      5: { cellWidth: "auto" }, // La colonne de description peut prendre plus d'espace
    },
  });

  // Génération du nom du fichier avec la date du jour
  const fileName = `incidents-export-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  // Téléchargement du fichier
  doc.save(fileName);
};
