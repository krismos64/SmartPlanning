import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import React, { useState } from "react";
import Button from "./ui/Button";

/**
 * Types pour les demandes de congés
 */
interface VacationRequest {
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
  reason: string;
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

type UserRole = "employee" | "manager" | "directeur" | "admin";

/**
 * Hook personnalisé pour gérer les permissions des demandes de congés
 */
export const useVacationPermissions = (userRole: UserRole) => {
  return {
    canSelectEmployee: ["manager", "directeur", "admin"].includes(userRole),
    canUseAdvancedFilters: userRole === "admin",
    canFilterByTeam: ["admin", "directeur"].includes(userRole),
    canApproveReject: ["manager", "directeur", "admin"].includes(userRole),
    canCreateForOthers: ["manager", "directeur", "admin"].includes(userRole),
    canViewAllRequests: ["admin", "directeur", "manager"].includes(userRole),
    canExportPdf: ["manager", "directeur", "admin"].includes(userRole),
  };
};

/**
 * Composant pour les actions d'approbation/rejet des demandes
 */
interface VacationActionsProps {
  request: VacationRequest;
  userRole: UserRole;
  actionLoading: string | null;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
  onEdit: (request: VacationRequest) => void;
  onDelete: (id: string) => void;
}

export const VacationActions: React.FC<VacationActionsProps> = ({
  request,
  userRole,
  actionLoading,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}) => {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [comment, setComment] = useState("");

  const canApproveReject = ["manager", "directeur", "admin"].includes(userRole);
  const isLoading = actionLoading === request._id;

  const handleApprove = () => {
    onApprove(request._id, comment.trim() || undefined);
    setComment("");
    setShowApprovalForm(false);
  };

  const handleReject = () => {
    onReject(request._id, comment.trim() || undefined);
    setComment("");
    setShowRejectionForm(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Actions principales */}
      <div className="flex justify-end gap-2">
        {/* Boutons d'approbation/refus - uniquement pour les demandes en attente */}
        {canApproveReject &&
          request.permissions?.canEdit &&
          request.status === "pending" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApprovalForm(true)}
                isLoading={isLoading}
                icon={<CheckCircle2 size={14} />}
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500/40"
              >
                Approuver
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowRejectionForm(true)}
                isLoading={isLoading}
                icon={<XCircle size={14} />}
              >
                Refuser
              </Button>
            </>
          )}

        {/* Bouton Modifier */}
        {request.permissions?.canEdit && userRole !== "employee" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(request)}
            icon={<Calendar size={14} />}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
          >
            Modifier
          </Button>
        )}

        {/* Bouton Supprimer */}
        {request.permissions?.canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(request._id)}
            isLoading={isLoading}
            icon={<XCircle size={14} />}
          >
            Supprimer
          </Button>
        )}
      </div>

      {/* Formulaire d'approbation */}
      {showApprovalForm && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="mb-2">
            <label 
              htmlFor="approval-comment"
              className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1"
            >
              Commentaire d'approbation (optionnel)
            </label>
            <textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md text-sm
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowApprovalForm(false);
                setComment("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              isLoading={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer l'approbation
            </Button>
          </div>
        </div>
      )}

      {/* Formulaire de rejet */}
      {showRejectionForm && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="mb-2">
            <label 
              htmlFor="rejection-comment"
              className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1"
            >
              Raison du rejet (optionnel)
            </label>
            <textarea
              id="rejection-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Expliquer la raison du rejet..."
              className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowRejectionForm(false);
                setComment("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              isLoading={isLoading}
            >
              Confirmer le rejet
            </Button>
          </div>
        </div>
      )}

      {/* Information sur qui a approuvé/refusé */}
      {request.status !== "pending" &&
        !request.permissions?.canDelete &&
        canApproveReject && (
          <div className="text-gray-500 dark:text-gray-400 text-xs text-right mt-1">
            {request.status === "approved" ? "Approuvé" : "Refusé"} par{" "}
            <span className="font-medium">
              {request.updatedBy && request.updatedBy.firstName
                ? `${request.updatedBy.firstName} ${request.updatedBy.lastName}`
                : "le système"}
            </span>
          </div>
        )}
    </div>
  );
};
