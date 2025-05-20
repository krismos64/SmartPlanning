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
 * Fonction pour générer un PDF pour un planning individuel
 */
export const generateSchedulePDF = async (
  schedule: Schedule,
  companyName: string = "Smart Planning"
): Promise<void> => {
  // Gestion du nom d'équipe - simplifiée et plus directe
  let teamName = schedule.teamName || "Non assigné";

  // Si nous avons un teamId mais pas de teamName, tenter de récupérer le nom
  if (!teamName && schedule.teamId) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5050/api"}/teams/${
          schedule.teamId
        }`
      );
      const data = await response.json();
      if (data.success && data.data && data.data.name) {
        teamName = data.data.name;
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nom de l'équipe:",
        error
      );
    }
  }

  // Récupérer le nom du manager
  let managerName = "Non assigné";

  // Utiliser directement la propriété managerName si elle existe déjà dans l'objet schedule
  if (schedule.managerName) {
    managerName = schedule.managerName as string;
  } else if (schedule.teamId) {
    try {
      const teamResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5050/api"}/teams/${
          schedule.teamId
        }`
      );
      const teamData = await teamResponse.json();

      if (
        teamData.success &&
        teamData.data &&
        teamData.data.managerIds &&
        teamData.data.managerIds.length > 0
      ) {
        // Si le manager est un objet avec firstName et lastName
        if (
          typeof teamData.data.managerIds[0] === "object" &&
          teamData.data.managerIds[0].firstName
        ) {
          const manager = teamData.data.managerIds[0];
          managerName = `${manager.firstName} ${manager.lastName}`;
        }
        // Sinon, c'est juste un ID et on doit chercher les infos du manager
        else {
          const managerId =
            teamData.data.managerIds[0]._id || teamData.data.managerIds[0];

          // Tenter de récupérer les infos du manager depuis l'API
          try {
            const managerResponse = await fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:5050/api"
              }/employees/${managerId}`
            );
            const managerData = await managerResponse.json();

            if (managerData.success && managerData.data) {
              managerName = `${managerData.data.firstName} ${managerData.data.lastName}`;
            }
          } catch (managerError) {
            console.error(
              "Erreur lors de la récupération des infos du manager par ID:",
              managerError
            );
          }
        }
      } else {
        // Si l'équipe n'a pas de managers définis, essayer de trouver les managers à partir de l'API
        try {
          const managersResponse = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5050/api"
            }/managers?teamId=${schedule.teamId}`
          );
          const managersData = await managersResponse.json();

          if (
            managersData.success &&
            managersData.data &&
            managersData.data.length > 0
          ) {
            const manager = managersData.data[0];
            managerName = `${manager.firstName} ${manager.lastName}`;
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des managers de l'équipe:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des infos du manager:",
        error
      );
    }
  }

  // Maintenant, teamName contient soit le nom réel de l'équipe, soit "Non assigné"

  // Initialiser le document PDF - Tous les PDFs sont maintenant en paysage
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Variables pour le document
  const now = new Date();
  const formattedDate = format(now, "dd MMMM yyyy", { locale: fr });
  const formattedTime = format(now, "HH:mm", { locale: fr });

  // Obtenir les dates de début et de fin de la semaine
  const { start: weekStart, end: weekEnd } = getWeekDateRange(
    schedule.year,
    schedule.weekNumber
  );
  const formattedWeekStart = format(weekStart, "dd MMM", { locale: fr });
  const formattedWeekEnd = format(weekEnd, "dd MMM yyyy", { locale: fr });

  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80); // Bleu foncé
  doc.text(companyName, 149, 15, { align: "center" });

  doc.setFontSize(14);
  doc.text(
    `Planning Hebdomadaire - Semaine ${schedule.weekNumber}, ${schedule.year}`,
    149,
    25,
    { align: "center" }
  );

  // Ajouter les dates exactes de la semaine
  doc.setFontSize(12);
  doc.text(`Du ${formattedWeekStart} au ${formattedWeekEnd}`, 149, 32, {
    align: "center",
  });

  // Créer un bloc d'informations stylisé pour les informations de l'employé
  const totalHours = Math.round((schedule.totalWeeklyMinutes / 60) * 100) / 100;

  // Dessiner un fond de couleur claire pour le bloc d'informations
  doc.setFillColor(240, 245, 255); // Bleu très clair
  doc.roundedRect(12, 36, 275, 25, 3, 3, "F");
  doc.setDrawColor(41, 128, 185); // Bordure bleue
  doc.setLineWidth(0.5);
  doc.roundedRect(12, 36, 275, 25, 3, 3, "S");

  // Diviser l'espace en deux colonnes
  const colWidth = 275 / 2;

  // Information sur l'employé (colonne gauche)
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80); // Bleu foncé

  // Ligne 1, colonne 1: Employé
  doc.setFont("helvetica", "bold");
  doc.text("Employé:", 20, 44);
  doc.setFont("helvetica", "normal");
  doc.text(schedule.employeeName, 60, 44);

  // Ligne 2, colonne 1: Équipe
  doc.setFont("helvetica", "bold");
  doc.text("Équipe:", 20, 52);
  doc.setFont("helvetica", "normal");
  doc.text(teamName, 60, 52);

  // Ligne 1, colonne 2: Total hebdomadaire
  doc.setFont("helvetica", "bold");
  doc.text("Total hebdomadaire:", 150, 44);
  doc.setFont("helvetica", "normal");
  doc.text(`${totalHours}h`, 220, 44);

  // Ligne 2, colonne 2: Responsable
  doc.setFont("helvetica", "bold");
  doc.text("Responsable:", 150, 52);
  doc.setFont("helvetica", "normal");
  doc.text(managerName, 220, 52);

  // Tableau des horaires - Optimisé pour tenir sur une page
  const tableData: Array<any[]> = [];

  // En-têtes du tableau - version compacte pour tenir sur une page
  DAY_KEYS.forEach((day, index) => {
    const dayName = DAYS_OF_WEEK[index];
    const daySlots = schedule.scheduleData[day] || [];

    // Simplifier pour gagner de la place - une ligne par jour
    const slots =
      daySlots.length > 0
        ? daySlots
            .map((slot) => {
              const [start, end] = slot.split("-");
              return `${formatHourDisplay(start)} - ${formatHourDisplay(end)}`;
            })
            .join(", ")
        : "Repos";

    // Calculer la durée totale du jour
    const dayTotalMinutes = daySlots.reduce((total, slot) => {
      const [start, end] = slot.split("-");
      return total + calculateDuration(start, end);
    }, 0);

    const dayTotalFormatted = formatDuration(dayTotalMinutes);

    // Une seule ligne par jour avec tous les créneaux
    tableData.push([
      dayName,
      slots,
      dayTotalFormatted,
      schedule.dailyNotes?.[day] || "",
    ]);
  });

  // Générer le tableau avec autoTable - optimisé pour le paysage et une seule page
  autoTable(doc, {
    head: [["Jour", "Horaires", "Durée", "Notes"]],
    body: tableData,
    startY: 70, // Décaler le tableau vers le bas pour laisser de la place aux nouvelles infos
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [44, 62, 80],
      lineWidth: 0.1,
      overflow: "ellipsize",
      halign: "center",
      font: "helvetica",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fillColor: [240, 240, 240], // Fond gris clair pour les lignes du corps
      textColor: [50, 50, 50], // Couleur de texte plus foncée pour une meilleure lisibilité
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // Fond blanc pour les lignes alternées
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "center", fillColor: [230, 230, 240] }, // Jour avec fond légèrement différent
      1: { cellWidth: 90, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: "auto", halign: "left" }, // Notes alignées à gauche pour faciliter la lecture
    },
    didDrawCell: function (data) {
      // Ajuster la hauteur des cellules pour optimiser l'espace
      if (
        data.column.index === 3 &&
        data.cell.text &&
        data.cell.text.length > 0
      ) {
        const textHeight = data.cell.height - data.cell.padding("vertical");
        if (textHeight < 10) {
          data.row.height = 10 + data.cell.padding("vertical");
        }
      }
    },
    didDrawPage: function () {
      // Ajouter une bordure autour du tableau
      const table = (doc as any).lastAutoTable;
      if (table) {
        doc.setDrawColor(44, 62, 80); // Même couleur que les lignes
        doc.setLineWidth(0.3); // Bordure plus épaisse
        doc.rect(
          table.startX,
          table.startY,
          table.tableWidth,
          table.finalY - table.startY
        );
      }
    },
  });

  // Notes globales - réduites pour tenir sur une page
  if (schedule.notes && schedule.notes.trim() !== "") {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    if (finalY < 140) {
      // Seulement si on a de la place
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      doc.text("Notes générales:", 15, finalY + 10);

      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      // Limiter la longueur du texte pour tenir sur une page
      const maxChars = 200;
      const truncatedNotes =
        schedule.notes.length > maxChars
          ? schedule.notes.substring(0, maxChars) + "..."
          : schedule.notes;
      const splitNotes = doc.splitTextToSize(truncatedNotes, 260);
      doc.text(splitNotes, 15, finalY + 18);
    }
  }

  // Pied de page avec infos de génération
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text(`Généré le ${formattedDate} à ${formattedTime}`, 149, 200, {
    align: "center",
  });

  // Télécharger le PDF
  doc.save(
    `Planning_${schedule.employeeName.replace(/\s+/g, "_")}_S${
      schedule.weekNumber
    }_${schedule.year}.pdf`
  );
};

/**
 * Fonction pour générer un PDF pour l'ensemble des plannings d'une équipe ou des employés sélectionnés
 * Optimisé pour tenir sur une seule page paysage
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
  const formattedWeekStart = format(weekStart, "dd MMM", { locale: fr });
  const formattedWeekEnd = format(weekEnd, "dd MMM yyyy", { locale: fr });

  // Initialiser le document PDF
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Variables pour le document
  const now = new Date();
  const formattedDate = format(now, "dd MMMM yyyy", { locale: fr });
  const formattedTime = format(now, "HH:mm", { locale: fr });

  // En-tête - Optimisé pour l'espace
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text(companyName, 149, 15, { align: "center" });

  // Mettre le nom de l'équipe en gras
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Planning - ${teamName} - Semaine ${weekNumber}, ${year}`, 149, 25, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");

  // Ajouter les dates exactes de la semaine
  doc.setFontSize(12);
  doc.text(`Du ${formattedWeekStart} au ${formattedWeekEnd}`, 149, 32, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setTextColor(52, 73, 94);
  doc.text(`Nombre d'employés: ${schedules.length}`, 15, 40);

  // Déterminer si nous générons un PDF pour "Tous les employés"
  const isAllEmployees = teamName === "Tous les employés";

  // Définir les en-têtes en fonction du mode
  let headers = isAllEmployees
    ? ["Employé", "Équipe", "Total", ...DAYS_OF_WEEK]
    : ["Employé", "Total", ...DAYS_OF_WEEK];

  // Préparer les données pour le tableau
  let tableData: Array<any[]> = [];
  let tableColors: Array<any> = [];

  // Si on regroupe par équipe, trier d'abord les plannings par équipe
  if (groupByTeam && isAllEmployees) {
    // Regrouper les plannings par équipe pour l'affichage
    const teamGroups: Record<string, Schedule[]> = {};

    // Créer les groupes d'équipe
    schedules.forEach((schedule) => {
      const teamKey = schedule.teamName || "Non assigné";
      if (!teamGroups[teamKey]) {
        teamGroups[teamKey] = [];
      }
      teamGroups[teamKey].push(schedule);
    });

    // Parcourir chaque groupe d'équipe
    Object.entries(teamGroups).forEach(
      ([teamName, teamSchedules], teamIndex) => {
        // Si ce n'est pas la première équipe, ajouter une ligne d'en-tête d'équipe
        if (teamIndex > 0) {
          // Ajouter une ligne vide entre les équipes
          const emptyRow = Array(headers.length).fill("");
          tableData.push(emptyRow);
          tableColors.push({ fillColor: [240, 240, 240] });
        }

        // Ajouter les données pour chaque employé de l'équipe
        teamSchedules.forEach((schedule, employeeIndex) => {
          const employeeName = schedule.employeeName;
          const totalHours =
            Math.round((schedule.totalWeeklyMinutes / 60) * 100) / 100;

          // Créer le tableau de données avec colonne d'équipe
          const rowData = [employeeName, teamName, `${totalHours}h`];

          // Ajouter les horaires condensés pour chaque jour
          DAY_KEYS.forEach((day) => {
            const daySlots = schedule.scheduleData[day] || [];
            const timeText =
              daySlots.length > 0
                ? daySlots
                    .map((slot) => {
                      const [start, end] = slot.split("-");
                      return `${formatHourDisplay(start)}-${formatHourDisplay(
                        end
                      )}`;
                    })
                    .join("\n")
                : "-";
            rowData.push(timeText);
          });

          tableData.push(rowData);

          // Déterminer la couleur de fond pour ce groupe d'équipe
          // Alterner les couleurs entre les équipes pour une meilleure visibilité
          const isEvenTeam = teamIndex % 2 === 0;
          tableColors.push({
            fillColor: isEvenTeam ? [255, 255, 255] : [240, 245, 255],
          });
        });
      }
    );
  } else {
    // Mode standard sans regroupement
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
                  return `${formatHourDisplay(start)}-${formatHourDisplay(
                    end
                  )}`;
                })
                .join("\n")
            : "-";
        rowData.push(timeText);
      });

      tableData.push(rowData);
    });
  }

  // Ajuster la taille de police en fonction du nombre d'employés et du mode
  let fontSize;
  if (isAllEmployees) {
    fontSize = schedules.length > 12 ? 6 : schedules.length > 8 ? 7 : 8;
  } else {
    fontSize = schedules.length > 15 ? 7 : schedules.length > 10 ? 8 : 9;
  }

  // Configurer les styles de colonnes selon le mode
  const columnStyles: Record<string, any> = {
    0: { fontStyle: "bold", cellWidth: 30, halign: "left" }, // Nom de l'employé aligné à gauche
  };

  if (isAllEmployees) {
    // Si "Tous les employés", ajouter un style pour la colonne "Équipe"
    columnStyles[1] = { cellWidth: 25, halign: "left" };
    columnStyles[2] = { cellWidth: 12, halign: "center" }; // Total
  } else {
    // Sinon, style normal pour la colonne Total
    columnStyles[1] = { cellWidth: 15, halign: "center" };
  }

  // Générer le tableau avec autoTable - mode ultra-compact
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: fontSize,
      cellPadding: 2,
      lineColor: [44, 62, 80],
      lineWidth: 0.1,
      overflow: "ellipsize",
      valign: "middle",
      halign: "center", // Alignement centré par défaut
      font: "helvetica",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center", // En-têtes centrés
    },
    columnStyles: columnStyles,
    // Utiliser des couleurs de fond personnalisées si disponibles
    bodyStyles:
      tableColors.length > 0
        ? undefined
        : {
            fillColor: [240, 240, 240], // Fond gris clair pour les lignes du corps
            textColor: [50, 50, 50], // Couleur de texte plus foncée pour une meilleure lisibilité
          },
    // Utiliser des couleurs alternées uniquement si nous n'utilisons pas de couleurs personnalisées
    alternateRowStyles:
      tableColors.length > 0
        ? undefined
        : {
            fillColor: [255, 255, 255], // Fond blanc pour les lignes alternées
          },
    // Ajuster le traitement des cellules pour économiser de l'espace
    didParseCell: function (data: any) {
      // Appliquer une fonte plus petite aux jours avec beaucoup de créneaux
      if (
        (isAllEmployees && data.column.index >= 3) ||
        (!isAllEmployees && data.column.index >= 2)
      ) {
        if (data.section === "body") {
          const content = data.cell.text;
          if (content && content.length > 30) {
            data.cell.styles.fontSize = fontSize - 1;
          }
        }
      }

      // Appliquer les couleurs personnalisées pour les lignes
      if (data.section === "body" && tableColors.length > 0) {
        const rowIndex = data.row.index;
        if (tableColors[rowIndex]) {
          Object.assign(data.cell.styles, tableColors[rowIndex]);
        }
      }
    },
  });

  // Pied de page avec infos de génération
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text(`Généré le ${formattedDate} à ${formattedTime}`, 149, 200, {
    align: "center",
  });

  // Télécharger le PDF
  doc.save(
    `Planning_${teamName.replace(/\s+/g, "_")}_S${weekNumber}_${year}.pdf`
  );
};
