/**
 * Types partagés pour les composants de gestion des congés
 */

// Interface pour les entreprises
export interface Company {
  _id: string;
  name: string;
}

// Interface pour les équipes
export interface Team {
  _id: string;
  name: string;
  companyId: string;
}

// Interface pour les employés accessibles
export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  teamId?: string;
  photoUrl?: string;
}

// Types pour les demandes de congés
export interface VacationRequest {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    companyId?: string;
    teamId?: string;
    photoUrl?: string;
  };
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

// Interface pour le formulaire de création
export interface VacationFormData {
  startDate: string;
  endDate: string;
  reason?: string;
  employeeId?: string;
  status?: "pending" | "approved" | "rejected";
}
