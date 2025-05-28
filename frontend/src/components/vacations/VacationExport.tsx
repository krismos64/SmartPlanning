import { FileDown, Filter } from "lucide-react";
import React, { useState } from "react";
import { generateVacationPdf } from "../../services/generateVacationPdf";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { Employee, Team, VacationRequest } from "./types";

interface VacationExportProps {
  requests: VacationRequest[];
  userRole: string;
  teams: Team[];
  employees: Employee[];
}

const VacationExport: React.FC<VacationExportProps> = ({
  requests,
  userRole,
  teams,
  employees,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Vérifier les permissions d'export
  const canExport = ["manager", "directeur", "admin"].includes(userRole);

  if (!canExport) {
    return null;
  }

  // Filtrer les demandes selon les critères sélectionnés
  const getFilteredRequests = (): VacationRequest[] => {
    let filtered = [...requests];

    // Filtre par équipe
    if (selectedTeamId) {
      filtered = filtered.filter((request) => {
        if (typeof request.employeeId === "object" && request.employeeId) {
          return request.employeeId.teamId === selectedTeamId;
        }
        return false;
      });
    }

    // Filtre par employé
    if (selectedEmployeeId) {
      filtered = filtered.filter((request) => {
        if (typeof request.employeeId === "object" && request.employeeId) {
          return request.employeeId._id === selectedEmployeeId;
        }
        return false;
      });
    }

    // Filtre par statut
    if (selectedStatus) {
      filtered = filtered.filter(
        (request) => request.status === selectedStatus
      );
    }

    return filtered;
  };

  // Générer le PDF avec les filtres appliqués
  const handleExportPdf = () => {
    const filteredRequests = getFilteredRequests();

    if (filteredRequests.length === 0) {
      alert("Aucune demande ne correspond aux critères sélectionnés.");
      return;
    }

    // Convertir au format attendu par generateVacationPdf
    const requestsForPdf = filteredRequests.map((request) => ({
      _id: request._id,
      employeeId: {
        _id:
          typeof request.employeeId === "object" && request.employeeId
            ? request.employeeId._id
            : "",
        firstName:
          typeof request.employeeId === "object" && request.employeeId
            ? request.employeeId.firstName
            : "Prénom",
        lastName:
          typeof request.employeeId === "object" && request.employeeId
            ? request.employeeId.lastName
            : "Nom",
      },
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || "",
      status: request.status,
      createdAt: request.createdAt,
    }));

    generateVacationPdf(requestsForPdf);
    setShowExportModal(false);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedTeamId("");
    setSelectedEmployeeId("");
    setSelectedStatus("");
  };

  // Obtenir le nombre de demandes filtrées
  const filteredCount = getFilteredRequests().length;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setShowExportModal(true)}
        icon={<FileDown size={16} />}
        className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
      >
        Exporter PDF
      </Button>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exporter les congés en PDF"
      >
        <div className="space-y-6">
          {/* Description */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez les critères de filtrage pour exporter les demandes de
            congés au format PDF.
          </div>

          {/* Filtres */}
          <div className="space-y-4">
            {/* Filtre par équipe - pour directeurs et admins */}
            {["directeur", "admin"].includes(userRole) && teams.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Équipe
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => {
                    setSelectedTeamId(e.target.value);
                    setSelectedEmployeeId(""); // Reset employé si équipe change
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les équipes</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtre par employé */}
            {employees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employé
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les employés</option>
                  {employees
                    .filter((employee) => {
                      // Si une équipe est sélectionnée, filtrer les employés de cette équipe
                      if (selectedTeamId) {
                        return employee.teamId === selectedTeamId;
                      }
                      return true;
                    })
                    .map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Refusé</option>
              </select>
            </div>
          </div>

          {/* Aperçu du nombre de demandes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div className="flex items-center gap-2 text-sm">
              <Filter size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200">
                <strong>{filteredCount}</strong> demande
                {filteredCount > 1 ? "s" : ""} sera
                {filteredCount > 1 ? "ont" : ""} exportée
                {filteredCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <Button
              variant="secondary"
              onClick={handleResetFilters}
              className="flex-1"
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              onClick={handleExportPdf}
              disabled={filteredCount === 0}
              icon={<FileDown size={16} />}
              className="flex-1"
            >
              Exporter PDF
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VacationExport;
