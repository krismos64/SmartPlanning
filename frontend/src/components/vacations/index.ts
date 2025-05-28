/**
 * Index des composants de gestion des congés
 */

// Composants
export { default as VacationActions } from "./VacationActions";
export { default as VacationExport } from "./VacationExport";
export { default as VacationFormModal } from "./VacationFormModal";
export { default as VacationStats } from "./VacationStats";
export { default as VacationTable } from "./VacationTable";

// Hooks et utilitaires
export { useVacationPermissions } from "./useVacationPermissions";
export type { UserRole, VacationPermissions } from "./useVacationPermissions";

// Types
export type {
  Company,
  Employee,
  Team,
  VacationFormData,
  VacationRequest,
} from "./types";

// Utilitaires
export {
  calculateDuration,
  formatDate,
  formatDateForBackend,
  getStatusBadgeType,
  translateStatus,
} from "./utils";
