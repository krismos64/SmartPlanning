import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

interface Manager {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  name: string;
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
  companyId: string;
  availableManagers: Manager[];
  availableEmployees: Employee[];
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
  companyId,
  availableManagers,
  availableEmployees,
}) => {
  const [teamName, setTeamName] = useState<string>("");
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTeamName("");
      setSelectedManagers([]);
      setSelectedEmployees([]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setSelectedManagers(selectedOptions);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setSelectedEmployees(selectedOptions);
  };

  const validateForm = (): boolean => {
    if (!teamName.trim()) {
      setErrorMessage("Le nom de l'équipe est requis");
      return false;
    }

    if (selectedManagers.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un manager");
      return false;
    }

    if (selectedEmployees.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un employé");
      return false;
    }

    return true;
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        companyId,
        name: teamName.trim(),
        managerIds: selectedManagers,
        employeeIds: selectedEmployees,
      };

      await axiosInstance.post("/api/admin/teams", payload);
      onTeamCreated();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      setErrorMessage("Erreur lors de la création de l'équipe.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          />

          <motion.div
            className="z-10 w-full max-w-md p-6 m-4 overflow-y-auto bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl"
            style={{ boxShadow: "0 0 15px rgba(76, 130, 255, 0.2)" }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Nouvelle équipe</h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 text-sm text-red-200 bg-red-900/50 rounded-lg border border-red-800"
              >
                {errorMessage}
              </motion.div>
            )}

            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label
                  htmlFor="teamName"
                  className="block mb-2 text-sm font-medium text-gray-200"
                >
                  Nom de l'équipe*
                </label>
                <input
                  type="text"
                  id="teamName"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  placeholder="Saisir le nom de l'équipe"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="managers"
                  className="block mb-2 text-sm font-medium text-gray-200"
                >
                  Managers*
                </label>
                <select
                  id="managers"
                  multiple
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  value={selectedManagers}
                  onChange={handleManagerChange}
                  size={4}
                >
                  {availableManagers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Maintenez Ctrl/Cmd pour sélectionner plusieurs managers
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="employees"
                  className="block mb-2 text-sm font-medium text-gray-200"
                >
                  Employés*
                </label>
                <select
                  id="employees"
                  multiple
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  value={selectedEmployees}
                  onChange={handleEmployeeChange}
                  size={4}
                >
                  {availableEmployees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Maintenez Ctrl/Cmd pour sélectionner plusieurs employés
                </p>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  type="button"
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onClose}
                  className="px-5 py-3 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  Annuler
                </motion.button>
                <motion.button
                  type="submit"
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  disabled={isLoading}
                  className="flex-1 px-5 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Création...
                    </span>
                  ) : (
                    "Créer l'équipe"
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTeamModal;
