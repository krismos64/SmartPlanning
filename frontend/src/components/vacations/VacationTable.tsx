/**
 * Composant tableau pour afficher les demandes de congés
 */
import { CalendarDays, ChevronDown, ChevronUp, Plus } from "lucide-react";
import React, { useState } from "react";
import SectionCard from "../layout/SectionCard";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import VacationActions from "./VacationActions";
import { VacationRequest } from "./types";
import { UserRole } from "./useVacationPermissions";
import {
  calculateDuration,
  formatDate,
  getStatusBadgeType,
  translateStatus,
} from "./utils";

type SortField = "employee" | "period" | "status";
type SortDirection = "asc" | "desc";

interface VacationTableProps {
  requests: VacationRequest[];
  userRole: UserRole;
  actionLoading: string | null;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
  onEdit: (request: VacationRequest) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const VacationTable: React.FC<VacationTableProps> = ({
  requests,
  userRole,
  actionLoading,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  // États pour le tri
  const [sortField, setSortField] = useState<SortField>("period");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Fonction pour gérer le tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si on clique sur la même colonne, inverser la direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Si on clique sur une nouvelle colonne, trier par ordre croissant
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Fonction pour trier les demandes
  const sortedRequests = React.useMemo(() => {
    return [...requests].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "employee":
          aValue =
            typeof a.employeeId === "object" && a.employeeId
              ? `${a.employeeId.firstName} ${a.employeeId.lastName}`
              : "ZZZ"; // Mettre les employés non définis à la fin
          bValue =
            typeof b.employeeId === "object" && b.employeeId
              ? `${b.employeeId.firstName} ${b.employeeId.lastName}`
              : "ZZZ";
          break;
        case "period":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "status":
          // Ordre personnalisé pour les statuts
          const statusOrder = { pending: 1, approved: 2, rejected: 3 };
          aValue = statusOrder[a.status] || 4;
          bValue = statusOrder[b.status] || 4;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [requests, sortField, sortDirection]);

  // Composant pour les en-têtes de colonne triables
  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <th
      className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left
                 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                 transition-colors duration-200 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="ml-2 flex flex-col">
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ChevronUp size={14} className="text-blue-500" />
            ) : (
              <ChevronDown size={14} className="text-blue-500" />
            )
          ) : (
            <div className="flex flex-col opacity-30">
              <ChevronUp size={12} />
              <ChevronDown size={12} className="-mt-1" />
            </div>
          )}
        </div>
      </div>
    </th>
  );

  // Fonction pour obtenir le nom d'affichage de l'employé
  const getEmployeeDisplayName = (request: VacationRequest) => {
    if (!request.employeeId) {
      return "Employé non défini";
    }

    if (typeof request.employeeId === "string") {
      return `Employé (ID: ${(request.employeeId as string).substring(
        0,
        8
      )}...)`;
    }

    if (typeof request.employeeId === "object" && request.employeeId !== null) {
      const firstName = request.employeeId.firstName || "Prénom";
      const lastName = request.employeeId.lastName || "Nom";
      return `${firstName} ${lastName}`;
    }

    return "Employé inconnu";
  };

  // Composant pour une carte de demande (mobile)
  const VacationCard: React.FC<{ request: VacationRequest }> = ({
    request,
  }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      {/* En-tête avec employé et statut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={
              typeof request.employeeId === "object"
                ? request.employeeId?.photoUrl
                : undefined
            }
            alt={getEmployeeDisplayName(request)}
            size="sm"
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {getEmployeeDisplayName(request)}
          </span>
        </div>
        <Badge
          type={getStatusBadgeType(request.status)}
          label={translateStatus(request.status)}
        />
      </div>

      {/* Période */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Période
        </div>
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(request.startDate)} - {formatDate(request.endDate)}
        </div>
        <div className="text-xs text-gray-500">
          {calculateDuration(request.startDate, request.endDate)} jours
        </div>
      </div>

      {/* Motif */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Motif
        </div>
        <div className="text-sm text-gray-900 dark:text-white">
          {request.reason || (
            <em className="text-gray-400">Aucun motif spécifié</em>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
        <VacationActions
          request={request}
          userRole={userRole}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );

  if (requests.length === 0) {
    return (
      <SectionCard
        title={
          userRole === "employee"
            ? "Mes demandes de congés"
            : "Demandes de congés"
        }
        className="mb-6"
      >
        <div className="text-center py-8">
          <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {userRole === "employee"
              ? "Vous n'avez aucune demande de congés"
              : "Aucune demande de congés trouvée"}
          </p>
          {userRole === "employee" && (
            <Button
              variant="primary"
              onClick={onCreateNew}
              icon={<Plus size={16} />}
              className="mt-4"
            >
              Créer ma première demande
            </Button>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={
        userRole === "employee"
          ? "Mes demandes de congés"
          : "Demandes de congés"
      }
      className="mb-6"
    >
      {/* Affichage en cartes pour mobile (md et moins) */}
      <div className="block md:hidden">
        {/* Contrôles de tri pour mobile */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trier par:
            </span>
            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              {sortDirection === "asc" ? "↑ Croissant" : "↓ Décroissant"}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSort("employee")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortField === "employee"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Employé
            </button>
            <button
              onClick={() => handleSort("period")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortField === "period"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Période
            </button>
            <button
              onClick={() => handleSort("status")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortField === "status"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Statut
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {sortedRequests.map((request) => {
            // Vérification de base uniquement
            if (!request || !request._id) {
              console.warn("Demande ignorée - pas d'ID:", request);
              return null;
            }

            return <VacationCard key={request._id} request={request} />;
          })}
        </div>
      </div>

      {/* Affichage en tableau pour desktop (md et plus) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {/* Colonne Employé - toujours affichée */}
              <SortableHeader field="employee">Employé</SortableHeader>
              <SortableHeader field="period">Période</SortableHeader>
              <SortableHeader field="status">Statut</SortableHeader>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">
                Motif
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => {
              // Vérification de base uniquement
              if (!request || !request._id) {
                console.warn("Demande ignorée - pas d'ID:", request);
                return null;
              }

              return (
                <tr
                  key={request._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {/* Cellule Employé - toujours affichée */}
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={
                          typeof request.employeeId === "object"
                            ? request.employeeId?.photoUrl
                            : undefined
                        }
                        alt={getEmployeeDisplayName(request)}
                        size="sm"
                      />
                      <span className="font-medium">
                        {getEmployeeDisplayName(request)}
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <div>
                      <div className="font-medium">
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {calculateDuration(request.startDate, request.endDate)}{" "}
                        jours
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <Badge
                      type={getStatusBadgeType(request.status)}
                      label={translateStatus(request.status)}
                    />
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <span className="text-sm">
                      {request.reason || (
                        <em className="text-gray-400">Aucun motif spécifié</em>
                      )}
                    </span>
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <VacationActions
                      request={request}
                      userRole={userRole}
                      actionLoading={actionLoading}
                      onApprove={onApprove}
                      onReject={onReject}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default VacationTable;
