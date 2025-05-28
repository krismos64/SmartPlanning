/**
 * Composant modal pour créer/éditer une demande de congés
 */
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import CustomDatePicker from "../DatePicker";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { Employee, VacationFormData, VacationRequest } from "./types";
import { UserRole, useVacationPermissions } from "./useVacationPermissions";
import { translateStatus } from "./utils";

interface VacationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: VacationFormData;
  setFormData: React.Dispatch<React.SetStateAction<VacationFormData>>;
  editingVacation: VacationRequest | null;
  userRole: UserRole;
  accessibleEmployees: Employee[];
  loadingEmployees: boolean;
}

const VacationFormModal: React.FC<VacationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingVacation,
  userRole,
  accessibleEmployees,
  loadingEmployees,
}) => {
  const permissions = useVacationPermissions(userRole);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingVacation
                ? "Modifier la demande"
                : "Nouvelle demande de congés"}
            </h3>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Sélection d'employé pour les managers+ */}
              {permissions.canSelectEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employé
                  </label>
                  <Select
                    value={formData.employeeId || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, employeeId: value })
                    }
                    options={[
                      { value: "", label: "Sélectionner un employé" },
                      ...accessibleEmployees.map((emp) => ({
                        value: emp._id,
                        label: `${emp.firstName} ${emp.lastName}`,
                      })),
                    ]}
                    disabled={loadingEmployees}
                  />
                </div>
              )}

              {/* Date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de début
                </label>
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  placeholder="Sélectionner la date de début"
                />
              </div>

              {/* Date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de fin
                </label>
                <CustomDatePicker
                  value={formData.endDate}
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                  placeholder="Sélectionner la date de fin"
                />
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motif (facultatif)
                </label>
                <textarea
                  value={formData.reason || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Motif de la demande de congés (facultatif)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Section de gestion pour les managers+ en mode édition */}
              {permissions.canModifyStatus && editingVacation && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Actions de gestion
                  </h4>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        En tant que{" "}
                        {userRole === "admin"
                          ? "administrateur"
                          : userRole === "directeur"
                          ? "directeur"
                          : "manager"}
                        , vous pouvez approuver ou refuser cette demande
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Statut de la demande
                      </label>
                      <Select
                        value={formData.status || "pending"}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as any,
                          })
                        }
                        options={[
                          { value: "pending", label: "⏳ En attente" },
                          { value: "approved", label: "✅ Approuvé" },
                          { value: "rejected", label: "❌ Refusé" },
                        ]}
                      />

                      {formData.status === "approved" && (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                          Cette demande sera marquée comme approuvée
                        </p>
                      )}

                      {formData.status === "rejected" && (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                          Cette demande sera marquée comme refusée
                        </p>
                      )}

                      {formData.status === "pending" && (
                        <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          Cette demande restera en attente de validation
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Message informatif pour les employés */}
              {userRole === "employee" && editingVacation && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Information importante
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    En tant qu'employé, vous pouvez uniquement modifier les
                    dates et le motif de vos demandes en attente. Le statut
                    (approbation/rejet) sera déterminé par votre manager,
                    directeur ou administrateur.
                  </p>
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    Statut actuel :{" "}
                    <strong>{translateStatus(editingVacation.status)}</strong>
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  {editingVacation ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VacationFormModal;
