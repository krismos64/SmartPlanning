/**
 * Utilitaires pour les composants de gestion des congés
 */

/**
 * Calcule la durée en jours entre deux dates
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Nombre de jours
 */
export const calculateDuration = (
  startDate: string,
  endDate: string
): number => {
  return (
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24) +
        1
    ) || 0
  );
};

/**
 * Formate la date pour l'affichage
 * @param dateString Chaîne de date à formater
 * @returns Date formatée (ex: "15 avril 2023")
 */
export const formatDate = (dateString: string): string => {
  console.log(`Formatage de date - Original: ${dateString}`);

  // Extraire la partie YYYY-MM-DD de la date
  const datePart = dateString.split("T")[0];

  // Décomposer la date en année, mois, jour
  const [year, month, day] = datePart.split("-").map((n) => parseInt(n, 10));

  // Vérifier que les composants sont valides
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error("Format de date invalide:", dateString);
    return "Date invalide";
  }

  // Créer une date à midi UTC pour éviter les problèmes de fuseau horaire
  const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  console.log(`Date formatée - UTC (12:00): ${dateUTC.toISOString()}`);

  // Utiliser l'API Intl pour formater selon la locale française
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // Forcer l'utilisation du fuseau UTC
  }).format(dateUTC);
};

/**
 * Traduit le statut en français
 * @param status Statut en anglais
 * @returns Statut traduit en français
 */
export const translateStatus = (status: string): string => {
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
 * Obtient le type de badge pour un statut
 */
export const getStatusBadgeType = (
  status: string
): "success" | "error" | "info" | "warning" => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "info";
  }
};

// Utilitaire pour formater les dates au format YYYY-MM-DD
export const formatDateForBackend = (dateStr: string) => {
  // Extraire les composants de la date de manière plus robuste
  let year, month, day;

  if (dateStr.includes("T")) {
    // Format ISO
    const dateOnly = dateStr.split("T")[0];
    [year, month, day] = dateOnly.split("-").map((num) => parseInt(num, 10));
  } else if (dateStr.includes("-")) {
    // Format YYYY-MM-DD simple
    [year, month, day] = dateStr.split("-").map((num) => parseInt(num, 10));
  } else {
    // Fallback au constructeur Date standard
    const date = new Date(dateStr);
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    day = date.getUTCDate();
  }

  // S'assurer que les valeurs sont valides
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error("Erreur de format de date:", dateStr);
    // Fallback au comportement d'origine
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  }

  // Formatter la date en YYYY-MM-DD à midi UTC pour éviter les problèmes de fuseau horaire
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};
