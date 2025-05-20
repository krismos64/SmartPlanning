import { getISOWeek } from "date-fns";
import { FileDown, Info, Printer, User, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
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
  initialGenerationType?: "employee" | "team" | "all";
  year?: number;
  weekNumber?: number;
}

const GeneratePdfModal: React.FC<GeneratePdfModalProps> = ({
  isOpen,
  onClose,
  onGeneratePdf,
  teams,
  employees,
  currentEmployeeId,
  currentTeamId,
  initialGenerationType,
  year,
  weekNumber,
}) => {
  // Type de génération sélectionné
  const [generationType, setGenerationType] = useState<
    "employee" | "team" | "all"
  >(
    initialGenerationType ||
      (currentEmployeeId ? "employee" : currentTeamId ? "team" : "all")
  );

  // IDs sélectionnés
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    currentTeamId || ""
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentEmployeeId || ""
  );

  // États pour la gestion de la récupération des données
  const [localTeams, setLocalTeams] = useState<{ _id: string; name: string }[]>(
    teams || []
  );
  const [localEmployees, setLocalEmployees] = useState<
    { _id: string; fullName: string }[]
  >(employees || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Utiliser les valeurs fournies par le parent ou calculer les valeurs par défaut
  const [currentYear, setCurrentYear] = useState<number>(
    year || new Date().getFullYear()
  );
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(
    weekNumber || getISOWeek(new Date())
  );

  // Mettre à jour les valeurs quand les props changent
  useEffect(() => {
    if (year) setCurrentYear(year);
    if (weekNumber) setCurrentWeekNumber(weekNumber);
  }, [year, weekNumber]);

  // Fonction pour réinitialiser et fermer le modal
  const handleClose = () => {
    setGenerationType(
      initialGenerationType ||
        (currentEmployeeId ? "employee" : currentTeamId ? "team" : "all")
    );
    setSelectedTeamId(currentTeamId || "");
    setSelectedEmployeeId(currentEmployeeId || "");
    setError(null);
    onClose();
  };

  // Fonction pour générer le PDF sélectionné
  const handleGeneratePdf = async () => {
    try {
      // Si les listes sont vides, les charger avant de générer le PDF
      if (
        (generationType === "team" && localTeams.length === 0) ||
        (generationType === "employee" && localEmployees.length === 0)
      ) {
        await fetchRequiredData();
      }

      // Appel à la fonction de génération avec les paramètres appropriés
      onGeneratePdf(
        generationType,
        generationType === "team" ? selectedTeamId : undefined,
        generationType === "employee" ? selectedEmployeeId : undefined
      );

      handleClose();
    } catch (error) {
      console.error(
        "Erreur lors de la préparation de la génération PDF:",
        error
      );
      setError("Impossible de générer le PDF. Veuillez réessayer.");
    }
  };

  // Fonction pour récupérer les données si elles ne sont pas fournies
  const fetchRequiredData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les équipes si nécessaire
      if (localTeams.length === 0) {
        const teamsResponse = await api.get("/teams");
        if (teamsResponse.data.success) {
          const teamsData = teamsResponse.data.data.map((team: any) => ({
            _id: team._id,
            name: team.name,
          }));
          setLocalTeams(teamsData);
        } else {
          throw new Error("Erreur lors de la récupération des équipes");
        }
      }

      // Récupérer les employés si nécessaire
      if (localEmployees.length === 0) {
        const employeesResponse = await api.get("/employees");
        if (employeesResponse.data.success) {
          const employeesData = employeesResponse.data.data.map((emp: any) => ({
            _id: emp._id,
            fullName: `${emp.firstName} ${emp.lastName}`,
          }));
          setLocalEmployees(employeesData);
        } else {
          throw new Error("Erreur lors de la récupération des employés");
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(
        "Impossible de récupérer les données nécessaires. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les données manquantes au besoin lors de l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      // Si les listes sont vides, les récupérer automatiquement
      if (teams.length === 0 || employees.length === 0) {
        fetchRequiredData();
      } else {
        // Utiliser les données fournies par le parent
        setLocalTeams(teams);
        setLocalEmployees(employees);
      }
    }
  }, [isOpen, teams, employees]);

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
            Générez un ou plusieurs plannings hebdomadaires au format PDF pour
            la semaine {currentWeekNumber} de {currentYear}.
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

          {/* État de chargement */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                Chargement des données...
              </span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Sélection d'employé si type = employee */}
          {generationType === "employee" && !loading && (
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
                {localEmployees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sélection d'équipe si type = team */}
          {generationType === "team" && !loading && (
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
                {localTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message informatif pour le type "tous" */}
          {generationType === "all" && !loading && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
              <p>
                Cette option générera un PDF contenant tous les plannings de la
                semaine {currentWeekNumber} de {currentYear}.
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
              loading ||
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
