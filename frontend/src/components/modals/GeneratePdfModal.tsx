import { FileDown, Printer, User, Users } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface GeneratePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePdf: (
    type: "employee" | "team" | "all",
    teamId?: string,
    employeeId?: string
  ) => void;
  teams: { _id: string; name: string }[];
  employees: { _id: string; fullName: string }[];
  currentEmployeeId?: string;
  currentTeamId?: string;
}

const GeneratePdfModal: React.FC<GeneratePdfModalProps> = ({
  isOpen,
  onClose,
  onGeneratePdf,
  teams,
  employees,
  currentEmployeeId,
  currentTeamId,
}) => {
  // Type de génération sélectionné
  const [generationType, setGenerationType] = useState<
    "employee" | "team" | "all"
  >(currentEmployeeId ? "employee" : currentTeamId ? "team" : "all");

  // IDs sélectionnés
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    currentTeamId || ""
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentEmployeeId || ""
  );

  // Fonction pour réinitialiser et fermer le modal
  const handleClose = () => {
    setGenerationType(
      currentEmployeeId ? "employee" : currentTeamId ? "team" : "all"
    );
    setSelectedTeamId(currentTeamId || "");
    setSelectedEmployeeId(currentEmployeeId || "");
    onClose();
  };

  // Fonction pour générer le PDF sélectionné
  const handleGeneratePdf = () => {
    onGeneratePdf(
      generationType,
      generationType === "team" ? selectedTeamId : undefined,
      generationType === "employee" ? selectedEmployeeId : undefined
    );
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Générer des plannings en PDF"
      className="w-full max-w-md"
    >
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Générez un ou plusieurs plannings hebdomadaires au format PDF.
          </p>

          {/* Options de type de génération */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Type de planning à générer:
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={
                  generationType === "employee" ? "primary" : "secondary"
                }
                size="sm"
                className={`flex items-center justify-center gap-2 ${
                  generationType === "employee"
                    ? "bg-indigo-600 text-white dark:bg-indigo-700"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
                onClick={() => setGenerationType("employee")}
              >
                <User size={16} />
                <span>Employé</span>
              </Button>

              <Button
                type="button"
                variant={generationType === "team" ? "primary" : "secondary"}
                size="sm"
                className={`flex items-center justify-center gap-2 ${
                  generationType === "team"
                    ? "bg-indigo-600 text-white dark:bg-indigo-700"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
                onClick={() => setGenerationType("team")}
              >
                <Users size={16} />
                <span>Équipe</span>
              </Button>

              <Button
                type="button"
                variant={generationType === "all" ? "primary" : "secondary"}
                size="sm"
                className={`flex items-center justify-center gap-2 ${
                  generationType === "all"
                    ? "bg-indigo-600 text-white dark:bg-indigo-700"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
                onClick={() => setGenerationType("all")}
              >
                <FileDown size={16} />
                <span>Tous</span>
              </Button>
            </div>
          </div>

          {/* Sélection d'employé si type = employee */}
          {generationType === "employee" && (
            <div className="mb-4">
              <label
                htmlFor="employee-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Sélectionnez un employé:
              </label>
              <select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Sélectionnez un employé</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sélection d'équipe si type = team */}
          {generationType === "team" && (
            <div className="mb-4">
              <label
                htmlFor="team-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Sélectionnez une équipe:
              </label>
              <select
                id="team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Sélectionnez une équipe</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message informatif pour le type "tous" */}
          {generationType === "all" && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
              <p>
                Cette option générera un PDF contenant tous les plannings de la
                semaine sélectionnée.
              </p>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGeneratePdf}
            icon={<Printer size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium dark:bg-indigo-700 dark:hover:bg-indigo-600"
            disabled={
              (generationType === "employee" && !selectedEmployeeId) ||
              (generationType === "team" && !selectedTeamId)
            }
          >
            Générer le PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratePdfModal;
