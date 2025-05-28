/**
 * Composant pour les actions d'approbation/rejet des demandes
 */
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import { VacationRequest } from "./types";
import { UserRole } from "./useVacationPermissions";

interface VacationActionsProps {
  request: VacationRequest;
  userRole: UserRole;
  actionLoading: string | null;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
  onEdit: (request: VacationRequest) => void;
  onDelete: (id: string) => void;
}

const VacationActions: React.FC<VacationActionsProps> = ({
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

  const isLoading = actionLoading === request._id;

  // Pour les employés, ne permettre la modification/suppression que si la demande est en attente
  const canEditDelete =
    userRole === "employee"
      ? request.status === "pending" && request.permissions?.canEdit
      : request.permissions?.canEdit;

  const canDelete =
    userRole === "employee"
      ? request.status === "pending" && request.permissions?.canDelete
      : request.permissions?.canDelete;

  // Debug logs
  console.log("=== DEBUG VACATION ACTIONS ===");
  console.log("UserRole:", userRole);
  console.log("Request status:", request.status);
  console.log("Request permissions:", request.permissions);
  console.log(
    "canApproveReject:",
    ["manager", "directeur", "admin"].includes(userRole)
  );
  console.log("canEditDelete:", canEditDelete);
  console.log("canDelete:", canDelete);
  console.log(
    "Should show approve/reject buttons:",
    ["manager", "directeur", "admin"].includes(userRole) &&
      request.status === "pending"
  );

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

  console.log("DEBUG FINAL - role:", userRole);
  console.log("DEBUG FINAL - statut:", request.status);
  console.log(
    "DEBUG FINAL - boutons visibles ?",
    ["manager", "directeur", "admin"].includes(userRole) &&
      request.status === "pending"
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Actions principales */}
      <div className="flex justify-end gap-1 flex-wrap">
        {/* Boutons d'approbation/refus - uniquement pour les demandes en attente et les managers+ */}
        {["manager", "directeur", "admin"].includes(userRole) &&
          request.status === "pending" && (
            <>
              <button
                onClick={() => setShowApprovalForm(true)}
                disabled={isLoading}
                title="Approuver la demande"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md
                          bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500/40
                          text-white transition-colors duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => setShowRejectionForm(true)}
                disabled={isLoading}
                title="Refuser la demande"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md
                          bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/40
                          text-white transition-colors duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={16} />
              </button>
            </>
          )}

        {/* Bouton Modifier - pour tous si ils ont la permission */}
        {canEditDelete && (
          <button
            onClick={() => onEdit(request)}
            title={
              userRole === "employee"
                ? "Modifier la demande"
                : "Modifier/Gérer la demande"
            }
            className="inline-flex items-center justify-center w-8 h-8 rounded-md
                      bg-gray-600 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500/40
                      dark:bg-gray-700 dark:hover:bg-gray-600
                      text-white transition-colors duration-200"
          >
            <Calendar size={16} />
          </button>
        )}

        {/* Bouton Supprimer - pour tous si ils ont la permission */}
        {canDelete && (
          <button
            onClick={() => onDelete(request._id)}
            disabled={isLoading}
            title="Supprimer la demande"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md
                      bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/40
                      text-white transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {/* Formulaire d'approbation */}
      {showApprovalForm && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="mb-2">
            <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Commentaire d'approbation (optionnel)
            </label>
            <textarea
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
            <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Raison du rejet (optionnel)
            </label>
            <textarea
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

      {/* Information sur qui a approuvé/refusé - uniquement pour managers+ */}
      {request.status !== "pending" &&
        !canDelete &&
        ["manager", "directeur", "admin"].includes(userRole) &&
        userRole !== "employee" && (
          <div className="text-[var(--text-tertiary)] dark:text-gray-400 text-xs text-right mt-1">
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

export default VacationActions;
