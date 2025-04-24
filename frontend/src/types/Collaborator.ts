/**
 * Types liés aux collaborateurs dans SmartPlanning
 */

import { UserRole } from "./User";

/**
 * Interface représentant un collaborateur (utilisateur + informations d'employé)
 */
export interface Collaborator {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Extract<UserRole, "manager" | "employee">;
  companyId: string;
  status: "active" | "inactive";
  teamId?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    _id: string;
    userId: string;
    companyId: string;
    teamId?: string;
    firstName: string;
    lastName: string;
    status: "actif" | "inactif";
    contractHoursPerWeek: number;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

/**
 * Données requises pour la création d'un collaborateur
 */
export interface CreateCollaboratorInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Extract<UserRole, "manager" | "employee">;
  teamId?: string;
  contractHoursPerWeek?: number;
}

/**
 * Données pour la mise à jour d'un collaborateur
 * Tous les champs sont optionnels
 */
export interface UpdateCollaboratorInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: Extract<UserRole, "manager" | "employee">;
  teamId?: string;
  contractHoursPerWeek?: number;
}

/**
 * Réponse de l'API pour la liste des collaborateurs
 */
export interface CollaboratorsApiResponse {
  success: boolean;
  message: string;
  data: Collaborator[];
}

/**
 * Réponse de l'API pour un seul collaborateur
 */
export interface CollaboratorApiResponse {
  success: boolean;
  message: string;
  data: {
    user: Collaborator;
    employee: Collaborator["employee"];
  };
}
