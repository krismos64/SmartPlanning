/**
 * Hook useEmployeeActions
 *
 * Ce hook fournit des fonctions pour créer, mettre à jour et supprimer des employés
 * via des appels API REST utilisant axiosInstance.
 *
 * @returns Fonctions pour manipuler les données des employés
 */

import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

/**
 * Interface représentant les données nécessaires pour créer un nouvel employé
 */
export interface NewEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  teamId: string;
  contractHoursPerWeek: number;
  status: "actif" | "inactif";
  companyId: string;
  // Champs optionnels
  photoUrl?: string;
  startDate?: string; // Format ISO
  preferences?: {
    preferredDays?: string[];
    preferredHours?: string[];
  };
}

/**
 * Interface représentant les données pour mettre à jour un employé existant
 * Tous les champs sont optionnels car on peut ne mettre à jour que certains champs
 */
export interface UpdatedEmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  teamId?: string;
  contractHoursPerWeek?: number;
  status?: "actif" | "inactif";
  photoUrl?: string;
  companyId?: string;
  startDate?: string; // Format ISO
  preferences?: {
    preferredDays?: string[];
    preferredHours?: string[];
  };
}

/**
 * Hook pour gérer les actions CRUD sur les employés
 * @returns Fonctions pour ajouter, mettre à jour et supprimer des employés
 */
const useEmployeeActions = () => {
  // État interne pour suivre les opérations en cours
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Ajoute un nouvel employé via l'API
   * @param newEmployee - Données du nouvel employé
   */
  const addEmployee = async (newEmployee: NewEmployeeData): Promise<void> => {
    setLoading(true);

    try {
      // Appel API pour créer un nouvel employé via axiosInstance
      await axiosInstance.post("/employees", newEmployee);
      // axiosInstance gère automatiquement les erreurs et l'authentification
    } catch (error: any) {
      // Formatage et propagation de l'erreur
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la création de l'employé";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour un employé existant via l'API
   * @param employeeId - ID de l'employé à mettre à jour
   * @param updatedEmployee - Données mises à jour de l'employé
   */
  const updateEmployee = async (
    employeeId: string,
    updatedEmployee: UpdatedEmployeeData
  ): Promise<void> => {
    setLoading(true);

    try {
      // Validation de l'ID
      if (!employeeId) {
        throw new Error("ID d'employé requis pour la mise à jour");
      }

      // Appel API pour mettre à jour l'employé via axiosInstance
      await axiosInstance.patch(`/employees/${employeeId}`, updatedEmployee);
      // axiosInstance gère automatiquement les erreurs et l'authentification
    } catch (error: any) {
      // Formatage et propagation de l'erreur
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la mise à jour de l'employé";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un employé via l'API
   * @param employeeId - ID de l'employé à supprimer
   */
  const deleteEmployee = async (employeeId: string): Promise<void> => {
    setLoading(true);

    try {
      // Validation de l'ID
      if (!employeeId) {
        throw new Error("ID d'employé requis pour la suppression");
      }

      // Appel API pour supprimer l'employé via axiosInstance
      await axiosInstance.delete(`/employees/${employeeId}`);
      // axiosInstance gère automatiquement les erreurs et l'authentification
    } catch (error: any) {
      // Formatage et propagation de l'erreur
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la suppression de l'employé";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Retour des fonctions du hook
  return {
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};

export default useEmployeeActions;
