/**
 * Hook personnalisé pour gérer les permissions des demandes de congés
 */

export type UserRole = "employee" | "manager" | "directeur" | "admin";

export interface VacationPermissions {
  canSelectEmployee: boolean;
  canUseAdvancedFilters: boolean;
  canFilterByTeam: boolean;
  canApproveReject: boolean;
  canCreateForOthers: boolean;
  canViewAllRequests: boolean;
  canViewOwnRequests: boolean;
  canExportPdf: boolean;
  canModifyStatus: boolean;
  canEditOwnPendingRequests: boolean;
}

export const useVacationPermissions = (
  userRole: UserRole
): VacationPermissions => {
  return {
    canSelectEmployee: ["manager", "directeur", "admin"].includes(userRole),
    canUseAdvancedFilters: userRole === "admin",
    canFilterByTeam: ["admin", "directeur"].includes(userRole),
    canApproveReject: ["manager", "directeur", "admin"].includes(userRole),
    canCreateForOthers: ["manager", "directeur", "admin"].includes(userRole),
    canViewAllRequests: ["admin", "directeur", "manager"].includes(userRole),
    canViewOwnRequests: true, // Tous les utilisateurs peuvent voir leurs propres demandes
    canExportPdf: ["manager", "directeur", "admin"].includes(userRole),
    canModifyStatus: ["manager", "directeur", "admin"].includes(userRole), // Seuls les managers+ peuvent modifier le statut
    canEditOwnPendingRequests: userRole === "employee", // Les employés ne peuvent modifier que leurs demandes en attente
  };
};
