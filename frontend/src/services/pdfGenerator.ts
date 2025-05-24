import { addDays, format, startOfISOWeek } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Types
interface Schedule {
  _id: string;
  employeeId: string;
  employeeName: string;
  teamId?: string;
  teamName?: string;
  managerName?: string;
  scheduleData: Record<string, string[]>;
  dailyNotes?: Record<string, string>;
  dailyDates?: Record<string, Date>;
  totalWeeklyMinutes: number;
  notes?: string;
  year: number;
  weekNumber: number;
  status: "approved" | "draft";
}

interface TimeSlot {
  start: string;
  end: string;
}

// Constantes
const DAYS_OF_WEEK = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Fonctions utilitaires
const calculateDuration = (start: string, end: string): number => {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
};

/**
 * Formate une heure du format "HH:MM" vers le format "HHhMM"
 */
const formatHourDisplay = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(":");
  return minutes === "00" ? `${hours}h` : `${hours}h${minutes}`;
};

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return "0h";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Obtient les dates de début et de fin de la semaine pour un numéro de semaine et une année donnés
 */
const getWeekDateRange = (
  year: number,
  week: number
): { start: Date; end: Date } => {
  const startDate = startOfISOWeek(new Date(year, 0, (week - 1) * 7 + 1));
  const endDate = addDays(startDate, 6);
  return { start: startDate, end: endDate };
};

/**
 * Fonction pour générer un PDF pour un planning individuel - Version minimaliste optimisée
 */
export const generateSchedulePDF = async (
  schedule: Schedule,
  companyName: string = "Smart Planning"
): Promise<void> => {
  // Récupérer le nom d'équipe depuis les données du planning
  const teamName = schedule.teamName || "Non assigné";

  // Initialiser le document PDF en paysage pour optimiser l'espace
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Variables pour le document
  const now = new Date();
  const formattedDate = format(now, "dd/MM/yyyy", { locale: fr });
  const formattedTime = format(now, "HH:mm", { locale: fr });

  // Obtenir les dates de début et de fin de la semaine
  const { start: weekStart, end: weekEnd } = getWeekDateRange(
    schedule.year,
    schedule.weekNumber
  );
  const formattedWeekStart = format(weekStart, "dd MMMM", { locale: fr });
  const formattedWeekEnd = format(weekEnd, "dd MMMM yyyy", { locale: fr });

  // === EN-TÊTE MINIMALISTE ===
  // Titre principal avec couleur professionnelle discrète
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72); // Bleu-gris professionnel
  doc.text("PLANNING HEBDOMADAIRE", 15, 15);

  // Ligne de séparation avec couleur discrète
  doc.setDrawColor(74, 85, 104); // Bleu-gris moyen
  doc.setLineWidth(0.5);
  doc.line(15, 20, 282, 20);

  // === INFORMATIONS EMPLOYÉ (Une ligne compacte) ===
  const infoY = 28;
  const totalHours = Math.round((schedule.totalWeeklyMinutes / 60) * 100) / 100;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72);
  doc.text(`${schedule.employeeName}`, 15, infoY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99); // Gris professionnel
  doc.text(`| ${teamName}`, 80, infoY);
  doc.text(`| Semaine ${schedule.weekNumber}, ${schedule.year}`, 140, infoY);
  doc.text(`| Du ${formattedWeekStart} au ${formattedWeekEnd}`, 200, infoY);

  // Total hebdomadaire avec couleur accent discrète
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Vert emeraude discret
  doc.text(`Total: ${totalHours}h`, 282, infoY, { align: "right" });

  // === TABLEAU PRINCIPAL OPTIMISÉ ===
  const tableData: Array<any[]> = [];

  // Calculer les dates exactes pour chaque jour
  DAY_KEYS.forEach((day, index) => {
    const dayName = DAYS_OF_WEEK[index];
    const daySlots = schedule.scheduleData[day] || [];

    // Calculer la date exacte du jour
    const dayDate = addDays(weekStart, index);
    const formattedDayDate = format(dayDate, "dd MMM yyyy", { locale: fr });

    // Formatage des créneaux (condensé)
    const slots =
      daySlots.length > 0
        ? daySlots
            .map((slot) => {
              const [start, end] = slot.split("-");
              return `${start}-${end}`;
            })
            .join(", ")
        : "Repos";

    // Calculer la durée totale du jour
    const dayTotalMinutes = daySlots.reduce((total, slot) => {
      const [start, end] = slot.split("-");
      return total + calculateDuration(start, end);
    }, 0);

    const dayTotalFormatted =
      dayTotalMinutes > 0 ? formatDuration(dayTotalMinutes) : "-";

    // Notes quotidiennes (condensées)
    const dayNotes = schedule.dailyNotes?.[day] || "";
    const truncatedNotes =
      dayNotes.length > 60 ? dayNotes.substring(0, 57) + "..." : dayNotes;

    tableData.push([
      `${dayName}\n${formattedDayDate}`,
      slots,
      dayTotalFormatted,
      truncatedNotes || "-",
    ]);
  });

  // Tableau principal avec largeur étendue et polices plus grandes
  autoTable(doc, {
    head: [["JOUR", "HORAIRES", "DURÉE", "NOTES"]],
    body: tableData,
    startY: 38, // Retour à la position normale
    margin: { left: 10, right: 10 }, // Marges réduites pour plus d'espace
    tableWidth: 277, // Largeur étendue (était 267mm)
    styles: {
      fontSize: 10, // Police augmentée (était 9)
      cellPadding: 4, // Padding légèrement augmenté
      lineColor: [148, 163, 184], // Gris-bleu discret
      lineWidth: 0.3,
      font: "helvetica",
      textColor: [30, 41, 59], // Bleu-gris foncé
    },
    headStyles: {
      fillColor: [226, 232, 240], // Gris-bleu très clair
      textColor: [45, 55, 72], // Bleu-gris professionnel
      fontStyle: "bold",
      fontSize: 11, // Police en-tête augmentée (était 10)
      halign: "center",
    },
    bodyStyles: {
      fillColor: [255, 255, 255], // Fond blanc
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gris très très clair avec nuance bleue
    },
    columnStyles: {
      0: {
        cellWidth: 55, // Largeur augmentée (était 45)
        halign: "center",
        fontStyle: "bold",
        fontSize: 9, // Police légèrement augmentée (était 8)
        fillColor: [241, 245, 249], // Gris-bleu très clair pour les jours
      },
      1: {
        cellWidth: 100, // Largeur augmentée (était 80)
        halign: "center",
        fontSize: 10, // Police augmentée (était 9)
      },
      2: {
        cellWidth: 35, // Largeur augmentée (était 25)
        halign: "center",
        fontStyle: "bold",
        fontSize: 11, // Police augmentée pour mettre en évidence
        textColor: [16, 185, 129], // Vert emeraude pour les durées
      },
      3: {
        cellWidth: 87, // Largeur ajustée (était 117)
        halign: "left",
        fontSize: 9, // Police légèrement augmentée (était 8)
        textColor: [75, 85, 99], // Gris professionnel pour les notes
      },
    },
    didDrawPage: function () {
      // Bordure avec couleur professionnelle
      const table = (doc as any).lastAutoTable;
      if (table) {
        doc.setDrawColor(74, 85, 104); // Bleu-gris moyen
        doc.setLineWidth(0.5);
        doc.rect(
          table.startX,
          table.startY,
          table.tableWidth,
          table.finalY - table.startY
        );
      }
    },
  });

  // === NOTES GÉNÉRALES (si espace disponible) ===
  const finalY = (doc as any).lastAutoTable.finalY || 160;

  if (schedule.notes && schedule.notes.trim() !== "" && finalY < 180) {
    // Zone notes avec couleur discrète
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 55, 72); // Bleu-gris professionnel
    doc.text("Notes générales:", 15, finalY + 8);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99); // Gris professionnel

    // Limiter la longueur pour tenir sur la page
    const maxChars = 400;
    const truncatedNotes =
      schedule.notes.length > maxChars
        ? schedule.notes.substring(0, maxChars) + "..."
        : schedule.notes;

    const splitNotes = doc.splitTextToSize(truncatedNotes, 250);
    doc.text(splitNotes, 15, finalY + 14);
  }

  // === PIED DE PAGE MINIMALISTE ===
  doc.setDrawColor(148, 163, 184); // Gris-bleu discret
  doc.setLineWidth(0.3);
  doc.line(15, 195, 282, 195);

  // Informations de génération (discrètes)
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${formattedDate} à ${formattedTime}`, 15, 200);

  // Signature discrète avec bonne URL
  doc.text("smartplanning.fr", 282, 200, { align: "right" });

  // Télécharger le PDF avec nom optimisé
  const fileName = `Planning_${schedule.employeeName.replace(/\s+/g, "_")}_S${
    schedule.weekNumber
  }_${schedule.year}.pdf`;
  doc.save(fileName);
};

/**
 * Fonction pour générer un PDF pour l'ensemble des plannings d'une équipe ou des employés sélectionnés
 * Design moderne assorti au PDF employé unique
 * @param schedules - Les plannings à inclure dans le PDF
 * @param teamName - Le nom de l'équipe ou "Tous les employés"
 * @param companyName - Le nom de l'entreprise
 * @param groupByTeam - Indique si les plannings doivent être regroupés par équipe (uniquement pour "Tous les employés")
 */
export const generateTeamSchedulePDF = (
  schedules: Schedule[],
  teamName: string = "Équipe",
  companyName: string = "Smart Planning",
  groupByTeam: boolean = false
): void => {
  // Vérifier qu'il y a des plannings à générer
  if (!schedules || schedules.length === 0) {
    console.error("Aucun planning à générer");
    return;
  }

  // Extraire la semaine et l'année du premier planning
  const { weekNumber, year } = schedules[0];

  // Obtenir les dates de début et de fin de la semaine
  const { start: weekStart, end: weekEnd } = getWeekDateRange(year, weekNumber);
  const formattedWeekStart = format(weekStart, "dd MMMM", { locale: fr });
  const formattedWeekEnd = format(weekEnd, "dd MMMM yyyy", { locale: fr });

  // Initialiser le document PDF
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Variables pour le document
  const now = new Date();
  const formattedDate = format(now, "dd/MM/yyyy", { locale: fr });
  const formattedTime = format(now, "HH:mm", { locale: fr });

  // === EN-TÊTE MINIMALISTE ===
  // Titre principal avec couleur professionnelle discrète
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72); // Bleu-gris professionnel
  doc.text("PLANNING D'ÉQUIPE", 15, 15);

  // Ligne de séparation avec couleur discrète
  doc.setDrawColor(74, 85, 104); // Bleu-gris moyen
  doc.setLineWidth(0.5);
  doc.line(15, 20, 282, 20);

  // === INFORMATIONS ÉQUIPE (Une ligne compacte) ===
  const infoY = 28;

  // Calculer le total d'heures de l'équipe
  const totalTeamMinutes = schedules.reduce(
    (total, schedule) => total + schedule.totalWeeklyMinutes,
    0
  );
  const totalTeamHours = Math.round((totalTeamMinutes / 60) * 100) / 100;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72);
  doc.text(`${teamName}`, 15, infoY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99); // Gris professionnel
  doc.text(
    `| ${schedules.length} employé${schedules.length > 1 ? "s" : ""}`,
    80,
    infoY
  );
  doc.text(`| Semaine ${weekNumber}, ${year}`, 130, infoY);

  // Dates en évidence avec design professionnel
  const dateText = `Du ${formattedWeekStart} au ${formattedWeekEnd}`;
  const dateWidth = doc.getTextWidth(dateText) + 10;
  const dateX = 200;

  // Fond coloré pour les dates
  doc.setFillColor(226, 232, 240); // Gris-bleu très clair
  doc.roundedRect(dateX - 2, infoY - 6, dateWidth, 12, 3, 3, "F");

  // Bordure professionnelle
  doc.setDrawColor(74, 85, 104); // Bleu-gris moyen
  doc.setLineWidth(0.5);
  doc.roundedRect(dateX - 2, infoY - 6, dateWidth, 12, 3, 3, "S");

  // Texte des dates en gras
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 55, 72); // Bleu-gris professionnel
  doc.text(dateText, dateX, infoY);

  // Déterminer si nous générons un PDF pour "Tous les employés"
  const isAllEmployees = teamName === "Tous les employés";

  // Définir les en-têtes en fonction du mode
  let headers = isAllEmployees
    ? [
        "EMPLOYÉ",
        "ÉQUIPE",
        "TOTAL",
        "LUN",
        "MAR",
        "MER",
        "JEU",
        "VEN",
        "SAM",
        "DIM",
      ]
    : ["EMPLOYÉ", "TOTAL", "LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

  // === TABLEAU PRINCIPAL AVEC DESIGN MODERNE ===
  let tableData: Array<any[]> = [];

  // Mode standard optimisé
  schedules.forEach((schedule) => {
    const employeeName = schedule.employeeName;
    const totalHours =
      Math.round((schedule.totalWeeklyMinutes / 60) * 100) / 100;

    // Obtenir le nom de l'équipe
    const employeeTeamName = schedule.teamName || "Non assigné";

    // Créer le tableau de données avec ou sans colonne d'équipe
    const rowData = isAllEmployees
      ? [employeeName, employeeTeamName, `${totalHours}h`]
      : [employeeName, `${totalHours}h`];

    // Ajouter les horaires condensés pour chaque jour
    DAY_KEYS.forEach((day) => {
      const daySlots = schedule.scheduleData[day] || [];
      const timeText =
        daySlots.length > 0
          ? daySlots
              .map((slot) => {
                const [start, end] = slot.split("-");
                return `${start}-${end}`;
              })
              .join("\n")
          : "-";
      rowData.push(timeText);
    });

    tableData.push(rowData);
  });

  // Ajuster la taille de police en fonction du nombre d'employés
  let fontSize =
    schedules.length > 20
      ? 7
      : schedules.length > 15
      ? 8
      : schedules.length > 10
      ? 9
      : 10;

  // Configurer les styles de colonnes selon le mode avec largeurs optimisées
  const columnStyles: Record<string, any> = {};

  if (isAllEmployees) {
    // Mode "Tous les employés" avec colonne équipe
    columnStyles[0] = { cellWidth: 35, halign: "left", fontStyle: "bold" }; // Employé
    columnStyles[1] = { cellWidth: 25, halign: "left" }; // Équipe
    columnStyles[2] = {
      cellWidth: 20,
      halign: "center",
      fontStyle: "bold",
      textColor: [16, 185, 129],
    }; // Total
    // Jours de la semaine
    for (let i = 3; i < 10; i++) {
      columnStyles[i] = {
        cellWidth: 25,
        halign: "center",
        fontSize: fontSize - 1,
      };
    }
  } else {
    // Mode équipe simple
    columnStyles[0] = { cellWidth: 40, halign: "left", fontStyle: "bold" }; // Employé
    columnStyles[1] = {
      cellWidth: 25,
      halign: "center",
      fontStyle: "bold",
      textColor: [16, 185, 129],
    }; // Total
    // Jours de la semaine
    for (let i = 2; i < 9; i++) {
      columnStyles[i] = {
        cellWidth: 30,
        halign: "center",
        fontSize: fontSize - 1,
      };
    }
  }

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 38,
    margin: { left: 10, right: 10 }, // Marges réduites pour plus d'espace
    tableWidth: 277, // Largeur étendue comme le PDF employé
    styles: {
      fontSize: fontSize,
      cellPadding: 3,
      lineColor: [148, 163, 184], // Gris-bleu discret
      lineWidth: 0.3,
      font: "helvetica",
      textColor: [30, 41, 59], // Bleu-gris foncé
    },
    headStyles: {
      fillColor: [226, 232, 240], // Gris-bleu très clair
      textColor: [45, 55, 72], // Bleu-gris professionnel
      fontStyle: "bold",
      fontSize: fontSize + 1,
      halign: "center",
    },
    bodyStyles: {
      fillColor: [255, 255, 255], // Fond blanc
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gris très très clair avec nuance bleue
    },
    columnStyles: columnStyles,
    didDrawPage: function () {
      // Bordure avec couleur professionnelle
      const table = (doc as any).lastAutoTable;
      if (table) {
        doc.setDrawColor(74, 85, 104); // Bleu-gris moyen
        doc.setLineWidth(0.5);
        doc.rect(
          table.startX,
          table.startY,
          table.tableWidth,
          table.finalY - table.startY
        );
      }
    },
  });

  // === PIED DE PAGE MINIMALISTE ===
  doc.setDrawColor(148, 163, 184); // Gris-bleu discret
  doc.setLineWidth(0.3);
  doc.line(15, 195, 282, 195);

  // Informations de génération (discrètes)
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${formattedDate} à ${formattedTime}`, 15, 200);

  // Signature discrète avec bonne URL
  doc.text("smartplanning.fr", 282, 200, { align: "right" });

  // Télécharger le PDF
  doc.save(
    `Planning_${teamName.replace(/\s+/g, "_")}_S${weekNumber}_${year}.pdf`
  );
};
