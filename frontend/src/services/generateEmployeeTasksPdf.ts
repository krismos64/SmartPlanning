import { format, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Task {
  title: string;
  dueDate: string | Date;
  status: "pending" | "inProgress" | "completed";
}

/**
 * Génère un PDF au format paysage A4 listant les tâches d'un employé
 * @param tasks Liste des tâches à inclure dans le PDF
 * @param employeeName Nom de l'employé (optionnel)
 */
export const generateEmployeeTasksPdf = (
  tasks: Task[],
  employeeName?: string
): void => {
  // Création du document PDF en format paysage
  const doc = new jsPDF({ orientation: "landscape" });

  // Mise en place du titre et sous-titre
  const title = employeeName
    ? `Tâches de ${employeeName}`
    : "Tâches – Export SmartPlanning";
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
      case "pending":
        return "En attente";
      case "inProgress":
        return "En cours";
      case "completed":
        return "Terminée";
      default:
        return status;
    }
  };

  // Vérification si une tâche est en retard
  const isLate = (dueDate: string | Date): string => {
    const taskDueDate =
      typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    return isBefore(taskDueDate, new Date()) ? "Oui" : "Non";
  };

  // Préparation des données pour le tableau
  const tableData = tasks.map((task) => [
    task.title,
    typeof task.dueDate === "string"
      ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr })
      : format(task.dueDate, "dd MMM yyyy", { locale: fr }),
    translateStatus(task.status),
    isLate(task.dueDate),
  ]);

  // Définition des entêtes de colonnes
  const headers = ["Titre", "Date limite", "Statut", "Retard ?"];

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
      0: { cellWidth: "auto" }, // La colonne du titre peut prendre plus d'espace
    },
  });

  // Génération du nom du fichier avec la date du jour
  const fileName = `taches-employe-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  // Téléchargement du fichier
  doc.save(fileName);
};
